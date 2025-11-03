import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
import {
  Volume2,
  VolumeX,
  Users,
  ArrowLeft,
  Mic,
  MicOff,
} from "lucide-react";
import { toast } from "sonner";
import { endLiveRoom } from "../lib/edgeFunctions";

export function LiveRoom() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { room, loading, error, incrementListeners, decrementListeners } =
    useLiveRoom(roomId);

  const isHost = room && user && room.host_id === user.id;

  const {
    isStreaming,
    error: streamError,
    hasPermission,
    startStreaming,
    stopStreaming,
    startListening,
    stopListening,
  } = useAudioStream(roomId || "", isHost || false);

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
      if (!isHost && hasJoined && roomId) {
        stopListening();
        decrementListeners(roomId);
      }
    };
  }, [hasJoined, roomId, isHost]);

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
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartStreaming = async () => {
    try {
      await startStreaming();
      toast.success("Live streaming started!");
    } catch (error) {
      console.error("Error starting streaming:", error);
      toast.error("Failed to start streaming");
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId) return;

    try {
      await startListening();
      await incrementListeners(roomId);
      setHasJoined(true);
      toast.success("Joined live room");
    } catch (err) {
      console.error("Error joining room:", err);
      toast.error("Failed to join room");
    }
  };

  const handleEndLive = async () => {
    if (!roomId) return;

    try {
      setIsEnding(true);
      stopStreaming();

      const { error } = await endLiveRoom(roomId);
      if (error) throw error;

      toast.success("Live session ended");
      navigate("/live");
    } catch (err) {
      console.error("Error ending live:", err);
      toast.error("Failed to end live session");
      setIsEnding(false);
    }
  };

  const handleLeaveRoom = async () => {
    if (!roomId) return;

    try {
      stopListening();
      await decrementListeners(roomId);
      setHasJoined(false);
      navigate("/live");
      toast.success("Left live room");
    } catch (err) {
      console.error("Error leaving room:", err);
      toast.error("Failed to leave room");
    }
  };

  const toggleMic = () => {
    if (isMicMuted) {
      // Unmute - restart streaming
      handleStartStreaming();
      setIsMicMuted(false);
      toast.success("Microphone unmuted");
    } else {
      // Mute - stop streaming
      stopStreaming();
      setIsMicMuted(true);
      toast.success("Microphone muted");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-bg-primary)]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[var(--color-text-secondary)]">
            Loading live room...
          </p>
        </div>
      </div>
    );
  }

  if (error || !room || !room.is_active) {
    return (
      <div className="flex items-center justify-center h-screen bg-[var(--color-bg-primary)]">
        <div className="text-center space-y-4">
          <p className="text-[var(--color-text-primary)] text-lg">
            {!room?.is_active
              ? "This live session has ended"
              : "Room not found"}
          </p>
          <Button onClick={() => navigate("/live")} variant="outline">
            Back to Live Feed
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] pb-24">
      <div className="border-b border-[var(--color-border)]">
        <div className="max-w-2xl mx-auto px-4 py-5">
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
                    Live
                  </span>
                </div>
              </div>
              <div className="flex items-center gap-2 bg-[var(--color-bg-secondary)] px-3 py-1.5 rounded-full border border-[var(--color-border)]">
                <Users className="w-4 h-4 text-[var(--color-text-muted)]" />
                <span className="text-sm font-semibold text-[var(--color-text-primary)]">
                  {room.listeners_count}
                </span>
              </div>
            </div>

            <div className="w-10" />
          </div>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">
        <div className="bg-[var(--color-bg-card)] rounded-3xl p-6 space-y-4 border border-[var(--color-border)]">
          <div className="flex items-center gap-4">
            <Avatar className="w-16 h-16">
              <AvatarImage src={room.host?.avatar_url || undefined} />
              <AvatarFallback>
                {room.host?.full_name?.charAt(0).toUpperCase() || "H"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm text-[var(--color-text-muted)] mb-1">
                {isHost ? "You're Live" : "Hosted by"}
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
          </div>

          {room.description && (
            <div className="pt-2 border-t border-[var(--color-border)]">
              <p className="text-sm text-[var(--color-text-secondary)]">
                {room.description}
              </p>
            </div>
          )}
        </div>

        {!isHost && (
          <div className="bg-[var(--color-bg-card)] rounded-3xl p-8 border border-[var(--color-border)]">
            <div className="flex flex-col items-center justify-center space-y-6">
              <div className="relative">
                <div
                  className={`w-24 h-24 rounded-full flex items-center justify-center ${
                    isStreaming
                      ? "bg-green-500/20 border-4 border-green-500"
                      : "bg-[var(--color-bg-secondary)] border-4 border-[var(--color-border)]"
                  }`}
                >
                  {isStreaming ? (
                    <Volume2 className="w-12 h-12 text-green-500" />
                  ) : (
                    <VolumeX className="w-12 h-12 text-[var(--color-text-muted)]" />
                  )}
                </div>
                {isStreaming && (
                  <div className="absolute inset-0 w-24 h-24 rounded-full border-4 border-green-500 animate-ping opacity-20" />
                )}
              </div>

              <div className="text-center">
                <p className="text-lg font-semibold text-[var(--color-text-primary)] mb-1">
                  {isStreaming ? "Listening" : "Not Listening"}
                </p>
                <p className="text-sm text-[var(--color-text-muted)]">
                  {isStreaming
                    ? "You are listening to the live audio"
                    : "Audio connection inactive"}
                </p>
              </div>

              {streamError && (
                <div className="w-full p-3 bg-red-500/10 border border-red-500/20 rounded-xl">
                  <p className="text-sm text-red-500 text-center">
                    {streamError}
                  </p>
                </div>
              )}

              {!isStreaming && (
                <Button
                  onClick={handleJoinRoom}
                  className="bg-green-500 hover:bg-green-600 text-white px-8"
                >
                  Start Listening
                </Button>
              )}
            </div>
          </div>
        )}

        {isHost && (
          <div className="bg-[var(--color-bg-card)] rounded-3xl p-6 border border-[var(--color-border)]">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className={`w-12 h-12 rounded-full flex items-center justify-center ${
                    isMicMuted
                      ? "bg-red-500/20"
                      : "bg-green-500/20"
                  }`}
                >
                  {isMicMuted ? (
                    <MicOff className="w-6 h-6 text-red-500" />
                  ) : (
                    <Mic className="w-6 h-6 text-green-500" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-[var(--color-text-primary)]">
                    Microphone
                  </p>
                  <p className="text-sm text-[var(--color-text-muted)]">
                    {isMicMuted ? "Muted" : "Active"}
                  </p>
                </div>
              </div>
              <Button
                onClick={toggleMic}
                variant="outline"
                className={
                  isMicMuted
                    ? "border-red-500/20 hover:bg-red-500/10"
                    : "border-green-500/20 hover:bg-green-500/10"
                }
              >
                {isMicMuted ? "Unmute" : "Mute"}
              </Button>
            </div>
          </div>
        )}

        {isHost && (
          <>
            <Button
              onClick={() => setShowEndConfirm(true)}
              disabled={isEnding}
              className="w-full bg-red-500 hover:bg-red-600 text-white"
            >
              {isEnding ? "Ending..." : "End Live Session"}
            </Button>

            <AlertDialog open={showEndConfirm} onOpenChange={setShowEndConfirm}>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>End Live Session?</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to end this live session? All
                    listeners will be disconnected and this action cannot be
                    undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleEndLive}
                    className="bg-red-500 hover:bg-red-600"
                  >
                    End Session
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </>
        )}
      </div>
    </div>
  );
}
