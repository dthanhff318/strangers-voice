import { useEffect, useState, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useLiveRoom } from "../hooks/useLiveRoom";
import { useAudioStream } from "../hooks/useAudioStream";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "./ui/alert-dialog";
import { Volume2, VolumeX, Users, ArrowLeft, Mic, MicOff } from "lucide-react";
import { toast } from "sonner";
import { endLiveRoom } from "../lib/edgeFunctions";
import { LiveChat } from "./LiveChat";
import { Loading } from "./Loading";

export function LiveRoom() {
  const { t } = useTranslation(['live', 'common']);
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { room, loading, error } = useLiveRoom(roomId);

  const isHost = room && user && room.host_id === user.id;

  const [listenersCount, setListenersCount] = useState(0);

  const handleHostDisconnect = useCallback(() => {
    if (!roomId || isHost) return; // Only listeners should handle this

    console.log("[LiveRoom] 🚨 Host disconnected! Leaving room...");

    // Listeners just leave the room, don't call endLiveRoom API
    // The room will become inactive naturally when there's no host
    toast.info(t('live:hostLeft'));
    navigate("/live");
  }, [roomId, isHost, navigate]);

  const {
    isStreaming,
    error: streamError,
    hasPermission,
    startStreaming,
    stopStreaming,
    startListening,
    stopListening,
  } = useAudioStream(
    roomId || "",
    isHost || false,
    user?.id,
    setListenersCount,
    handleHostDisconnect
  );

  const [isEnding, setIsEnding] = useState(false);
  const [hasJoined, setHasJoined] = useState(false);
  const [showEndConfirm, setShowEndConfirm] = useState(false);
  const [isMicMuted, setIsMicMuted] = useState(false);
  const [liveTimer, setLiveTimer] = useState(0);

  useEffect(() => {
    if (!room || !roomId || loading) return;

    if (isHost) {
      if (!isStreaming && !hasPermission) {
        handleStartStreaming();
      }
    } else {
      if (!hasJoined) {
        handleJoinRoom();
      }
    }
  }, [room, isHost, loading]);

  useEffect(() => {
    return () => {
      if (!isHost && hasJoined) {
        stopListening();
      }
    };
  }, [hasJoined, isHost, stopListening]);

  // Timer for live duration
  useEffect(() => {
    if (!room?.created_at) return;

    const startTime = new Date(room.created_at).getTime();

    const updateTimer = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - startTime) / 1000);
      setLiveTimer(elapsed);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 1000);

    return () => clearInterval(interval);
  }, [room?.created_at]);

  const formatTime = (seconds: number) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStartStreaming = async () => {
    try {
      await startStreaming();
      toast.success(t('live:streamingStarted'));
    } catch (error) {
      console.error("Error starting streaming:", error);
      toast.error(t('live:streamingFailed'));
    }
  };

  const handleJoinRoom = async () => {
    try {
      await startListening();
      setHasJoined(true);
      toast.success(t('live:joinedRoom'));
    } catch (err) {
      console.error("Error joining room:", err);
      toast.error(t('live:failedToJoin'));
    }
  };

  const handleEndLive = async () => {
    if (!roomId) return;

    try {
      setIsEnding(true);
      stopStreaming();

      const { error } = await endLiveRoom(roomId);
      if (error) throw error;

      toast.success(t('live:sessionEndedSuccess'));
      navigate("/live");
    } catch (err) {
      console.error("Error ending live:", err);
      toast.error(t('live:failedToEnd'));
      setIsEnding(false);
    }
  };

  const handleLeaveRoom = async () => {
    try {
      stopListening();
      setHasJoined(false);
      navigate("/live");
      toast.success(t('live:leftRoom'));
    } catch (err) {
      console.error("Error leaving room:", err);
      toast.error(t('live:failedToLeave'));
    }
  };

  const toggleMic = () => {
    if (isMicMuted) {
      // Unmute - restart streaming
      handleStartStreaming();
      setIsMicMuted(false);
      toast.success(t('live:micUnmuted'));
    } else {
      // Mute - stop streaming
      stopStreaming();
      setIsMicMuted(true);
      toast.success(t('live:micMuted'));
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-bg-primary)]">
        <Loading variant="ring" size={48} label={t('live:loadingRoom')} />
      </div>
    );
  }

  if (error || !room || !room.is_active) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-bg-primary)]">
        <div className="text-center space-y-4">
          <p className="text-[var(--color-text-primary)] text-lg">
            {!room?.is_active
              ? t('live:sessionEnded')
              : t('live:roomNotFound')}
          </p>
          <Button onClick={() => navigate("/live")} variant="outline">
            {t('live:backToFeed')}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div
      style={{ height: "calc(100vh - 80px - 70px)" }}
      className="bg-[var(--color-bg-primary)] flex flex-col overflow-hidden h-full"
    >
      <div className="border-b border-[var(--color-border)] flex-shrink-0">
        <div className="max-w-2xl mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <Button
              onClick={isHost ? () => navigate("/live") : handleLeaveRoom}
              variant="ghost"
              size="icon"
              className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-secondary)] transition-all"
            >
              <ArrowLeft className="w-6 h-6" />
            </Button>

            <div className="flex items-center gap-4">
              <div className="relative">
                <div className="absolute inset-0 bg-[var(--color-accent)] opacity-20 blur-xl rounded-full" />
                <div className="relative flex items-center gap-2 bg-[var(--color-accent)] px-4 py-2 rounded-full shadow-lg shadow-[var(--color-accent)]/30">
                  <div className="relative">
                    <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                    <div className="absolute inset-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                  </div>
                  <span className="text-sm font-bold text-white uppercase tracking-wider">
                    {t('live:live')}
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[var(--color-bg-secondary)] px-3 py-1.5 rounded-full border border-[var(--color-border)]">
                <Users className="w-4 h-4 text-[var(--color-text-muted)]" />
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {listenersCount}
                </span>
              </div>
            </div>

            <div className="w-10" />
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-hidden">
        <div className="max-w-2xl mx-auto px-4 py-6 space-y-4 h-full flex flex-col">
          <div className="bg-[var(--color-bg-card)] rounded-3xl p-6 space-y-4 border border-[var(--color-border)] flex-shrink-0">
            <div className="flex items-center gap-4">
              <Avatar className="w-16 h-16">
                <AvatarImage src={room.host?.avatar_url || undefined} />
                <AvatarFallback>
                  {room.host?.full_name?.charAt(0).toUpperCase() || "H"}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <p className="text-sm text-[var(--color-text-muted)] mb-1">
                  {isHost ? t('live:youreLive') : t('live:hostedBy')}
                </p>
                <p className="font-semibold text-[var(--color-text-primary)]">
                  {isHost ? room.title : room.host?.full_name || "Anonymous"}
                </p>
                {isHost && (
                  <div className="mt-2">
                    <span className="text-xs font-mono text-[var(--color-text-muted)] tabular-nums">
                      {formatTime(liveTimer)}
                    </span>
                  </div>
                )}
              </div>
              {!isHost && (
                <div className="flex items-center gap-2">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      isStreaming
                        ? "bg-green-500/20"
                        : "bg-[var(--color-bg-secondary)]"
                    }`}
                  >
                    {isStreaming ? (
                      <Volume2 className="w-5 h-5 text-green-500" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-[var(--color-text-muted)]" />
                    )}
                  </div>
                </div>
              )}
              {isHost && (
                <button
                  onClick={toggleMic}
                  className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${
                    isMicMuted
                      ? "bg-red-500/20 hover:bg-red-500/30"
                      : "bg-green-500/20 hover:bg-green-500/30"
                  }`}
                >
                  {isMicMuted ? (
                    <MicOff className="w-5 h-5 text-red-500" />
                  ) : (
                    <Mic className="w-5 h-5 text-green-500" />
                  )}
                </button>
              )}
            </div>

            {room.description && (
              <div className="pt-2 border-t border-[var(--color-border)]">
                <p className="text-sm text-[var(--color-text-secondary)]">
                  {room.description}
                </p>
              </div>
            )}

            {!isHost && !isStreaming && (
              <div className="pt-2 border-t border-[var(--color-border)]">
                <div className="flex items-center justify-center">
                  <Button
                    onClick={handleJoinRoom}
                    size="sm"
                    className="bg-green-500 hover:bg-green-600 text-white"
                  >
                    {t('live:startListening')}
                  </Button>
                </div>
                {streamError && (
                  <div className="mt-3 p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                    <p className="text-sm text-red-500 text-center">
                      {streamError}
                    </p>
                  </div>
                )}
              </div>
            )}

            {isHost && (
              <div className="pt-2 border-t border-[var(--color-border)]">
                <Button
                  onClick={() => setShowEndConfirm(true)}
                  disabled={isEnding}
                  className="w-full bg-red-500 hover:bg-red-600 text-white"
                >
                  {isEnding ? t('live:ending') : t('live:endLiveSession')}
                </Button>
              </div>
            )}
          </div>

          {roomId && (
            <div className="flex-1 min-h-0 h-full ">
              <LiveChat roomId={roomId} />
            </div>
          )}

          <AlertDialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('live:endSessionTitle')}</AlertDialogTitle>
                <AlertDialogDescription>
                  {t('live:endSessionDescription')}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common:actions.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  onClick={handleEndLive}
                  className="bg-red-500 hover:bg-red-600 !text-[var(--color-btn-primary-text)]"
                >
                  {t('live:endSession')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
    </div>
  );
}
