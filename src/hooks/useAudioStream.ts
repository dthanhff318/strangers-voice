import { useState, useCallback, useRef, useEffect } from "react";
import { RealtimeChannel } from "@supabase/supabase-js";
import {
  AudioStreamService,
  AudioListenerService,
} from "../lib/audioStreaming";
import { supabase } from "../lib/supabase";

export function useAudioStream(roomId: string, isHost: boolean) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasPermission, setHasPermission] = useState(false);

  const streamServiceRef = useRef<AudioStreamService | null>(null);
  const listenerServiceRef = useRef<AudioListenerService | null>(null);
  const channelRef = useRef<RealtimeChannel | null>(null);

  // Initialize channel
  useEffect(() => {
    if (!roomId) return;

    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: {
          self: false, // Don't receive own broadcasts
        },
      },
    });

    channelRef.current = channel;

    return () => {
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomId]);

  // Start streaming (for host)
  const startStreaming = useCallback(async () => {
    if (!isHost) {
      setError("Only the host can start streaming");
      return;
    }

    try {
      setError(null);

      // Initialize service if not exists
      if (!streamServiceRef.current) {
        streamServiceRef.current = new AudioStreamService();
      }

      // Request microphone permission and start capture
      await streamServiceRef.current.startCapture();
      setHasPermission(true);

      // Subscribe channel before broadcasting
      if (channelRef.current && channelRef.current.state !== "joined") {
        await channelRef.current.subscribe();
      }

      // Start broadcasting audio
      if (channelRef.current) {
        await streamServiceRef.current.startBroadcast(channelRef.current);
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error starting stream:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start streaming"
      );
      setIsStreaming(false);
    }
  }, [isHost]);

  // Stop streaming (for host)
  const stopStreaming = useCallback(() => {
    if (streamServiceRef.current) {
      streamServiceRef.current.stopBroadcast();
      streamServiceRef.current = null;
    }
    setIsStreaming(false);
    setHasPermission(false);
  }, []);

  // Start listening (for listeners)
  const startListening = useCallback(async () => {
    if (isHost) {
      setError("Host should use startStreaming instead");
      return;
    }

    try {
      setError(null);

      // Initialize listener service if not exists
      if (!listenerServiceRef.current) {
        listenerServiceRef.current = new AudioListenerService();
      }

      // Subscribe to channel
      if (channelRef.current && channelRef.current.state !== "joined") {
        await channelRef.current.subscribe();
      }

      // Start listening to audio broadcasts
      if (channelRef.current) {
        await listenerServiceRef.current.startListening(channelRef.current);
        setIsStreaming(true);
      }
    } catch (err) {
      console.error("Error starting listening:", err);
      setError(
        err instanceof Error ? err.message : "Failed to start listening"
      );
      setIsStreaming(false);
    }
  }, [isHost]);

  // Stop listening (for listeners)
  const stopListening = useCallback(() => {
    if (listenerServiceRef.current) {
      listenerServiceRef.current.stopListening();
      listenerServiceRef.current = null;
    }
    setIsStreaming(false);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamServiceRef.current) {
        streamServiceRef.current.stopBroadcast();
      }
      if (listenerServiceRef.current) {
        listenerServiceRef.current.stopListening();
      }
    };
  }, []);

  // Get current media stream
  const getMediaStream = useCallback((): MediaStream | null => {
    return streamServiceRef.current?.["mediaStream"] ?? null;
  }, []);

  return {
    isStreaming,
    error,
    hasPermission,
    startStreaming,
    stopStreaming,
    startListening,
    stopListening,
    getMediaStream,
  };
}
