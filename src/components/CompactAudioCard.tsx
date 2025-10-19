import { useState, useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import {
  Play,
  Pause,
  Flame,
  MessageCircle,
  MoreVertical,
  Heart,
  Flag,
  Trash2,
  Loader2,
} from "lucide-react";
import { deleteRecord } from "../lib/edgeFunctions";
import { toast } from "sonner";
import { useAuth } from "../contexts/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";

interface Recording {
  id: string;
  created_at: string;
  file_url: string;
  duration: number;
  likes_count: number;
  dislikes_count: number;
  user_id: string | null;
  title: string | null;
  description: string | null;
}

interface CompactAudioCardProps {
  recording: Recording;
  onDelete?: () => void;
}

export function CompactAudioCard({
  recording,
  onDelete,
}: CompactAudioCardProps) {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const waveformRef = useRef<HTMLDivElement>(null);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  // Initialize WaveSurfer
  useEffect(() => {
    if (!waveformRef.current) return;

    const wavesurfer = WaveSurfer.create({
      container: waveformRef.current,
      waveColor: getComputedStyle(document.documentElement)
        .getPropertyValue("--color-wave-bg")
        .trim(),
      progressColor: getComputedStyle(document.documentElement)
        .getPropertyValue("--color-wave-progress")
        .trim(),
      cursorColor: getComputedStyle(document.documentElement)
        .getPropertyValue("--color-accent-primary")
        .trim(),
      barWidth: 2,
      barGap: 1,
      barRadius: 2,
      height: 40,
      hideScrollbar: true,
    });

    wavesurfer.load(recording.file_url);

    wavesurfer.on("play", () => setIsPlaying(true));
    wavesurfer.on("pause", () => setIsPlaying(false));
    wavesurfer.on("finish", () => setIsPlaying(false));

    wavesurferRef.current = wavesurfer;

    return () => {
      wavesurfer.destroy();
    };
  }, [recording.file_url]);

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const formatCount = (count: number) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`.replace(".0k", "k");
    }
    return count.toString();
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInMs = now.getTime() - date.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "Yesterday";
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;
    return `${Math.floor(diffInDays / 365)} years ago`;
  };

  const confirmDelete = async () => {
    if (!user || recording.user_id !== user.id) return;

    try {
      setIsDeleting(true);

      // Call edge function to delete the recording
      const { error } = await deleteRecord(recording.id);

      if (error) throw error;

      // Show success toast
      toast.success("Recording deleted successfully");

      // Call onDelete callback to refresh the list
      onDelete?.();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error("Error deleting recording:", error);
      toast.error("Failed to delete recording. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="bg-[var(--color-bg-card)] rounded-xl p-3 hover:bg-[var(--color-bg-card-hover)] transition-all border border-[var(--color-border)] space-y-2">
      {/* Title & Date */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--color-text-primary)] text-base truncate">
            {recording.title || "Untitled"}
          </h3>
          {recording.description && (
            <p className="text-[var(--color-text-tertiary)] text-xs truncate mt-0.5">
              {recording.description}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <span className="text-[var(--color-text-tertiary)] text-xs">
            {formatDate(recording.created_at)}
          </span>
          {/* Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1 rounded-md hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all">
                <MoreVertical className="w-3.5 h-3.5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              className="bg-[var(--color-bg-card)] border-[var(--color-border)]"
            >
              <DropdownMenuItem
                disabled
                className="opacity-50 cursor-not-allowed text-[var(--color-text-tertiary)] text-xs"
              >
                <Heart className="w-3.5 h-3.5 mr-2" />
                Like
              </DropdownMenuItem>
              <DropdownMenuItem
                disabled
                className="opacity-50 cursor-not-allowed text-[var(--color-text-tertiary)] text-xs"
              >
                <Flag className="w-3.5 h-3.5 mr-2" />
                Report
              </DropdownMenuItem>
              {user && recording.user_id === user.id && (
                <DropdownMenuItem
                  onClick={() => setShowDeleteDialog(true)}
                  className="text-red-600 focus:bg-[var(--color-bg-elevated)] focus:text-red-600 text-xs"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Play Button & Waveform */}
      <div className="flex items-center gap-2">
        <button
          onClick={togglePlayPause}
          className="w-8 h-8 rounded-full bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] flex items-center justify-center transition-all hover:scale-105 shadow-md shadow-[var(--shadow-primary)] flex-shrink-0"
        >
          {isPlaying ? (
            <Pause
              className="w-3 h-3 text-[var(--color-btn-primary-text)]"
              fill="var(--color-btn-primary-text)"
            />
          ) : (
            <Play
              className="w-3 h-3 text-[var(--color-btn-primary-text)] ml-0.5"
              fill="var(--color-btn-primary-text)"
            />
          )}
        </button>

        <div
          ref={waveformRef}
          className="flex-1 cursor-pointer"
          onClick={togglePlayPause}
        />

        <span className="text-[var(--color-text-tertiary)] text-xs flex-shrink-0">
          {formatDuration(recording.duration)}
        </span>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-3 text-xs text-[var(--color-text-tertiary)]">
        <div className="flex items-center gap-1">
          <Flame className="w-4 h-4" />
          <span>{formatCount(recording.likes_count)}</span>
        </div>
        <div className="flex items-center gap-1">
          <MessageCircle className="w-4 h-4" />
          <span>{formatCount(recording.dislikes_count)}</span>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[var(--color-bg-card)] border-[var(--color-border)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--color-text-primary)]">
              Delete Recording
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--color-text-secondary)]">
              Are you sure you want to delete this recording? This action cannot
              be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              className="bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-card-hover)] text-[var(--color-text-primary)] hover:text-[var(--color-text-primary)] border-[var(--color-border)]"
              disabled={isDeleting}
            >
              Cancel
            </AlertDialogCancel>
            <button
              type="button"
              onClick={confirmDelete}
              disabled={isDeleting}
              className="inline-flex items-center justify-center h-10 px-4 py-2 text-sm font-semibold text-white transition-colors bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
