import { useState, useEffect, useRef } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { deleteRecord } from "../lib/edgeFunctions";
import { toast } from "sonner";
import WaveSurfer from "wavesurfer.js";
import {
  Flame,
  Play,
  Pause,
  Flag,
  Trash2,
  Loader2,
  X,
  Minimize2,
  Maximize2,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { UserProfileModal } from "./UserProfileModal";
import { ReportForm } from "./ReportForm";
import { getBackgroundById } from "../constants/backgrounds";
import {
  AlertDialog,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Button } from "./ui/button";

interface RecordPlayerModalProps {
  onLoginRequired?: () => void;
}

export function RecordPlayerModal({ onLoginRequired }: RecordPlayerModalProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const {
    currentRecording: recording,
    isModalOpen: isOpen,
    isMiniMode,
    setIsMiniMode,
    wavesurferRef: globalWavesurferRef,
    isPlaying: globalIsPlaying,
    setIsPlaying: setGlobalIsPlaying,
    close: closeModal,
  } = useAudioPlayer();

  const [userLike, setUserLike] = useState<boolean | null>(null);
  const [likesCount, setLikesCount] = useState(recording?.likes_count || 0);
  const [showUserProfile, setShowUserProfile] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showReportForm, setShowReportForm] = useState(false);
  const waveformRef = useRef<HTMLDivElement>(null);

  // Initialize WaveSurfer only once
  useEffect(() => {
    if (!isOpen || !recording || !waveformRef.current) {
      return;
    }

    // Update likes when recording changes
    setLikesCount(recording.likes_count);

    // Wait for DOM to be ready
    const timer = setTimeout(() => {
      if (!waveformRef.current) return;

      // Clean up existing instance
      if (globalWavesurferRef.current) {
        globalWavesurferRef.current.destroy();
        globalWavesurferRef.current = null;
      }

      try {
        const wavesurfer = WaveSurfer.create({
          container: waveformRef.current,
          waveColor:
            getComputedStyle(document.documentElement)
              .getPropertyValue("--color-wave-bg")
              .trim() || "#808080",
          progressColor:
            getComputedStyle(document.documentElement)
              .getPropertyValue("--color-wave-progress")
              .trim() || "#ffffff",
          cursorColor:
            getComputedStyle(document.documentElement)
              .getPropertyValue("--color-accent-primary")
              .trim() || "#0066ff",
          barWidth: 2,
          barGap: 1,
          barRadius: 2,
          height: 50,
          hideScrollbar: true,
        });

        wavesurfer.load(recording.file_url);

        wavesurfer.on("play", () => setGlobalIsPlaying(true));
        wavesurfer.on("pause", () => setGlobalIsPlaying(false));
        wavesurfer.on("finish", () => setGlobalIsPlaying(false));

        globalWavesurferRef.current = wavesurfer;
        console.log("WaveSurfer initialized");
      } catch (error) {
        console.error("Error initializing WaveSurfer:", error);
      }
    }, 300);

    return () => {
      clearTimeout(timer);
    };
  }, [recording?.id, isOpen]);

  useEffect(() => {
    if (isOpen && recording) {
      checkUserLike();
    }
  }, [isOpen, recording?.id, user]);

  const checkUserLike = async () => {
    if (!user || !recording) return;

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
    if (globalWavesurferRef.current) {
      globalWavesurferRef.current.playPause();
    }
  };

  const handleLike = async () => {
    if (!user) {
      onLoginRequired?.();
      return;
    }

    if (!recording) return;

    try {
      // If already liked, unlike it
      if (userLike === true) {
        await supabase
          .from("likes")
          .delete()
          .eq("recording_id", recording.id)
          .eq("user_id", user.id);

        setUserLike(null);
        setLikesCount((prev) => prev - 1);
        return;
      }

      // If not liked yet, add like
      if (userLike === null) {
        await supabase.from("likes").insert({
          recording_id: recording.id,
          user_id: user.id,
          is_like: true,
        });

        setUserLike(true);
        setLikesCount((prev) => prev + 1);
      }
    } catch (error) {
      console.error("Error updating like:", error);
    }
  };

  const confirmDelete = async () => {
    if (!user || !recording || recording.user_id !== user.id) return;

    try {
      setIsDeleting(true);
      const { error } = await deleteRecord(recording.id);
      if (error) throw error;

      toast.success("Recording deleted successfully");

      // Invalidate queries to refresh the feed
      queryClient.invalidateQueries({ queryKey: ["trending-recordings"] });
      queryClient.invalidateQueries({ queryKey: ["user-recordings"] });

      setShowDeleteDialog(false);
      handleClose();
    } catch (error) {
      console.error("Error deleting recording:", error);
      toast.error("Failed to delete recording. Please try again.");
    } finally {
      setIsDeleting(false);
    }
  };

  const handleReport = () => {
    if (!user) {
      onLoginRequired?.();
      return;
    }
    setShowReportForm(true);
  };

  const handleMinimize = () => {
    setIsMiniMode(true);
  };

  const handleExpand = () => {
    setIsMiniMode(false);
  };

  const handleClose = () => {
    closeModal();
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

  if (!isOpen || !recording) return null;

  // Get background image from user's profile
  const background = getBackgroundById(recording.profiles?.background_id || null);
  const hasBackground = background && background.imageUrl;

  return (
    <>
      {/* Backdrop */}
      <AnimatePresence>
        {!isMiniMode && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/50"
            style={{ zIndex: 50 }}
            onClick={handleClose}
          />
        )}
      </AnimatePresence>

      {/* Player Modal */}
      <div
        className="fixed bg-[var(--color-bg-card)] rounded-xl shadow-2xl border border-[var(--color-border)] overflow-hidden"
        style={
          isMiniMode
            ? {
                bottom: 96,
                right: 16,
                width: 320,
                zIndex: 45,
                ...(hasBackground ? {
                  backgroundImage: `url(${background.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                } : {})
              }
            : {
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%)",
                width: "min(672px, calc(100vw - 2rem))",
                zIndex: 51,
                ...(hasBackground ? {
                  backgroundImage: `url(${background.imageUrl})`,
                  backgroundSize: 'cover',
                  backgroundPosition: 'center',
                } : {})
              }
        }
      >
        {/* Dark overlay for better text readability when background is present */}
        {hasBackground && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/40 rounded-xl" />
        )}
        {/* Header - Always visible */}
        <div
          className={`relative z-10 flex items-center justify-between ${
            isMiniMode ? "p-2" : "p-3"
          } ${!isMiniMode && !hasBackground ? "border-b border-[var(--color-border)]" : ""}`}
        >
          <div
            className={`flex items-center ${
              isMiniMode ? "gap-2" : "gap-3"
            } flex-1 min-w-0`}
          >
            <Avatar
              className={`${
                isMiniMode ? "w-8 h-8" : "w-10 h-10"
              } flex-shrink-0`}
            >
              <AvatarImage
                src={recording.profiles?.avatar_url || ""}
                alt={recording.profiles?.full_name || ""}
              />
              <AvatarFallback className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
                {recording.profiles?.full_name?.charAt(0)?.toUpperCase() || "U"}
              </AvatarFallback>
            </Avatar>

            <div className="flex-1 min-w-0">
              <h3
                className={`font-semibold ${hasBackground ? 'text-white' : 'text-[var(--color-text-primary)]'} ${
                  isMiniMode ? "text-xs" : "text-sm"
                } truncate`}
              >
                {recording.title || "Untitled"}
              </h3>
              <p
                className={`${hasBackground ? 'text-white/80' : 'text-[var(--color-text-tertiary)]'} ${
                  isMiniMode ? "text-[10px]" : "text-xs"
                } truncate`}
              >
                {recording.profiles?.full_name || "Unknown"}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {isMiniMode ? (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleExpand}
                className="p-1.5 rounded-lg hover:bg-[var(--color-bg-card-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all"
                title="Expand"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={handleMinimize}
                className="p-1.5 rounded-lg hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all"
                title="Minimize"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            )}

            <Button
              variant="ghost"
              size="icon-sm"
              onClick={handleClose}
              className="p-1.5 rounded-lg hover:bg-[var(--color-bg-card-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all"
              title="Close"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Player Controls - Always visible */}
        <div className={`relative z-10 ${isMiniMode ? "px-2 pb-2" : "p-3"}`}>
          <div
            className={`flex items-center ${isMiniMode ? "gap-2" : "gap-3"}`}
          >
            <Button
              size={isMiniMode ? "icon-sm" : "icon"}
              onClick={togglePlayPause}
              className={`${
                isMiniMode ? "w-8 h-8" : "w-10 h-10"
              } rounded-full bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] flex items-center justify-center transition-all hover:scale-105 shadow-md shadow-[var(--shadow-primary)] flex-shrink-0`}
            >
              {globalIsPlaying ? (
                <Pause
                  className={`${
                    isMiniMode ? "w-3 h-3" : "w-4 h-4"
                  } text-[var(--color-btn-primary-text)]`}
                  fill="var(--color-btn-primary-text)"
                />
              ) : (
                <Play
                  className={`${
                    isMiniMode ? "w-3 h-3" : "w-4 h-4"
                  } text-[var(--color-btn-primary-text)] ml-0.5`}
                  fill="var(--color-btn-primary-text)"
                />
              )}
            </Button>

            <div
              ref={waveformRef}
              className="flex-1 cursor-pointer"
              onClick={togglePlayPause}
            />
          </div>
        </div>

        {/* Full Mode Details */}
        {!isMiniMode && (
          <div className="relative z-10 p-6 pt-0 space-y-4">
            {/* Duration */}
            <div className={`text-sm ${hasBackground ? 'text-white/90' : 'text-[var(--color-text-tertiary)]'}`}>
              {formatDuration(recording.duration)}
            </div>

            {/* Description */}
            {recording.description && (
              <p className={`text-sm ${hasBackground ? 'text-white/80' : 'text-[var(--color-text-secondary)]'}`}>
                {recording.description}
              </p>
            )}

            {/* Stats & Actions */}
            <div className="flex items-center justify-between pt-2">
              <div className="flex items-center gap-6">
                <Button
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleLike();
                  }}
                  className={`flex items-center gap-2 transition-colors p-0 h-auto ${
                    userLike === true
                      ? "text-[var(--color-text-primary)]"
                      : "text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                  }`}
                >
                  <Flame
                    className="w-6 h-6"
                    fill={userLike === true ? "currentColor" : "none"}
                  />
                  <span className="text-base font-medium">
                    {formatCount(likesCount)}
                  </span>
                </Button>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleReport}
                  className="p-2 rounded-lg hover:bg-[var(--color-bg-card-hover)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all"
                  title="Report"
                >
                  <Flag className="w-5 h-5" />
                </Button>

                {user && recording.user_id === user.id && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setShowDeleteDialog(true)}
                    className="p-2 rounded-lg hover:bg-red-600/10 text-red-600 hover:text-red-700 transition-all"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5" />
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}
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
            <Button
              variant="destructive"
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
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Report Form */}
      {user && (
        <ReportForm
          isOpen={showReportForm}
          onClose={() => setShowReportForm(false)}
          recordingId={recording.id}
          userId={user.id}
        />
      )}
    </>
  );
}
