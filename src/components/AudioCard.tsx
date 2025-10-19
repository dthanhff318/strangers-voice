import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { deleteRecord } from "../lib/edgeFunctions";
import { toast } from "sonner";
import WaveSurfer from "wavesurfer.js";
import { Flame, MessageCircle, Play, Pause, MoreVertical, Heart, Flag, Trash2, Loader2 } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { UserProfileModal } from "./UserProfileModal";
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
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface AudioCardProps {
  recording: Recording;
  onLoginRequired?: () => void;
  onDelete?: () => void;
}

export function AudioCard({ recording, onLoginRequired, onDelete }: AudioCardProps) {
  const { user } = useAuth();
  const [isPlaying, setIsPlaying] = useState(false);
  const [userLike, setUserLike] = useState<boolean | null>(null);
  const [likesCount, setLikesCount] = useState(recording.likes_count);
  const [dislikesCount, setDislikesCount] = useState(recording.dislikes_count);
  const [showUserProfile, setShowUserProfile] = useState(false);
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
      barWidth: 3,
      barGap: 2,
      barRadius: 3,
      height: 50,
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
  }, [recording.file_url, user]);

  useEffect(() => {
    checkUserLike();
  }, []);

  const checkUserLike = async () => {
    if (!user) return;

    const { data }: { data: { is_like: boolean } | null } = await supabase
      .from("likes")
      .select("is_like")
      .eq("recording_id", recording.id)
      .eq("user_id", user.id)
      .maybeSingle();

    if (data) {
      setUserLike(data.is_like);
    }
  };

  const togglePlayPause = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.playPause();
    }
  };

  const handleLike = async (isLike: boolean) => {
    if (!user) {
      onLoginRequired?.();
      return;
    }

    try {
      // If user already has the same reaction, remove it
      if (userLike === isLike) {
        await supabase
          .from("likes")
          .delete()
          .eq("recording_id", recording.id)
          .eq("user_id", user.id);

        setUserLike(null);
        if (isLike) {
          setLikesCount((prev) => prev - 1);
        } else {
          setDislikesCount((prev) => prev - 1);
        }
        return;
      }

      // If user is changing their reaction
      if (userLike !== null) {
        await supabase
          .from("likes")
          .update({ is_like: isLike })
          .eq("recording_id", recording.id)
          .eq("user_id", user.id);

        setUserLike(isLike);
        if (isLike) {
          setLikesCount((prev) => prev + 1);
          setDislikesCount((prev) => prev - 1);
        } else {
          setLikesCount((prev) => prev - 1);
          setDislikesCount((prev) => prev + 1);
        }
        return;
      }

      // New reaction
      await supabase.from("likes").insert({
        recording_id: recording.id,
        user_id: user.id,
        is_like: isLike,
      });

      setUserLike(isLike);
      if (isLike) {
        setLikesCount((prev) => prev + 1);
      } else {
        setDislikesCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const confirmDelete = async () => {
    if (!user || recording.user_id !== user.id) return;

    try {
      setIsDeleting(true);

      // Call edge function to delete the recording
      const { error } = await deleteRecord(recording.id);

      if (error) throw error;

      // Show success toast
      toast.success('Recording deleted successfully');

      // Call onDelete callback to refresh the list
      onDelete?.();
      setShowDeleteDialog(false);
    } catch (error) {
      console.error('Error deleting recording:', error);
      toast.error('Failed to delete recording. Please try again.');
    } finally {
      setIsDeleting(false);
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

  return (
    <div className="bg-[var(--color-bg-card)] rounded-2xl p-4 hover:bg-[var(--color-bg-card-hover)] transition-all border border-[var(--color-border)] space-y-3">
      {/* Top Row: Avatar, Name, Description, Duration */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Avatar */}
        <Avatar
          className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={(e) => {
            e.stopPropagation();
            setShowUserProfile(true);
          }}
        >
          <AvatarImage src={recording.profiles?.avatar_url || ""} alt={recording.profiles?.full_name || ""} />
          <AvatarFallback className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
            {recording.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>

        {/* Author & Title */}
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-[var(--color-text-primary)] text-lg mb-1 truncate">
            {recording.title || "Untitled"}
          </h3>
          <p className="text-[var(--color-text-tertiary)] text-sm truncate">
            {recording.profiles?.full_name || "Unknown"}
          </p>
        </div>

        {/* Duration */}
        <div className="text-[var(--color-text-tertiary)] text-sm font-medium flex-shrink-0">
          {formatDuration(recording.duration)}
        </div>

        {/* Menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="p-2 rounded-lg hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all flex-shrink-0">
              <MoreVertical className="w-4 h-4" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-[var(--color-bg-card)] border-[var(--color-border)]">
            <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed text-[var(--color-text-tertiary)]">
              <Heart className="w-4 h-4 mr-2" />
              Like
            </DropdownMenuItem>
            <DropdownMenuItem disabled className="opacity-50 cursor-not-allowed text-[var(--color-text-tertiary)]">
              <Flag className="w-4 h-4 mr-2" />
              Report
            </DropdownMenuItem>
            {user && recording.user_id === user.id && (
              <DropdownMenuItem
                onClick={() => setShowDeleteDialog(true)}
                className="text-red-600 focus:bg-[var(--color-bg-elevated)] focus:text-red-600"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Middle Row: Play Button & Waveform */}
      <div className="flex items-center gap-3 md:gap-4">
        {/* Play Button */}
        <button
          onClick={togglePlayPause}
          className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] flex items-center justify-center transition-all hover:scale-105 shadow-lg shadow-[var(--shadow-primary)] flex-shrink-0"
        >
          {isPlaying ? (
            <Pause
              className="w-4 h-4 md:w-5 md:h-5 text-[var(--color-btn-primary-text)]"
              fill="var(--color-btn-primary-text)"
            />
          ) : (
            <Play
              className="w-4 h-4 md:w-5 md:h-5 text-[var(--color-btn-primary-text)] ml-0.5"
              fill="var(--color-btn-primary-text)"
            />
          )}
        </button>

        {/* Waveform */}
        <div
          ref={waveformRef}
          className="flex-1 cursor-pointer"
          onClick={togglePlayPause}
        />
      </div>

      {/* Bottom Row: Stats */}
      <div className="flex items-center gap-4 text-sm text-[var(--color-text-tertiary)] pl-[52px] md:pl-[64px]">
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLike(true);
          }}
          className={`flex items-center gap-1.5 transition-colors ${
            userLike === true
              ? "text-[var(--color-text-primary)]"
              : "hover:text-[var(--color-text-primary)]"
          }`}
        >
          <Flame
            className="w-5 h-5"
            fill={userLike === true ? "currentColor" : "none"}
          />
          <span>{formatCount(likesCount)}</span>
        </button>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleLike(false);
          }}
          className="flex items-center gap-1.5 hover:text-[var(--color-text-secondary)] transition-colors"
        >
          <MessageCircle className="w-5 h-5" />
          <span>{formatCount(dislikesCount)}</span>
        </button>
      </div>

      {/* User Profile Modal */}
      {recording.profiles && (
        <UserProfileModal
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          userProfile={{
            id: recording.profiles.id,
            full_name: recording.profiles.full_name,
            avatar_url: recording.profiles.avatar_url,
          }}
        />
      )}

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent className="bg-[var(--color-bg-card)] border-[var(--color-border)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--color-text-primary)]">
              Delete Recording
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--color-text-secondary)]">
              Are you sure you want to delete this recording? This action cannot be undone.
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
