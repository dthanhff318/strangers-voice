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

    console.log("[HOOK] 🔌 Initializing Realtime channel for room:", roomId);
    const channel = supabase.channel(`room:${roomId}`, {
      config: {
        broadcast: {
          self: false, // Don't receive own broadcasts
        },
      },
    });

    channelRef.current = channel;
    console.log("[HOOK] ✅ Channel created");

    return () => {
      console.log("[HOOK] Cleaning up channel");
      channel.unsubscribe();
      channelRef.current = null;
    };
  }, [roomId]);

  // Start streaming (for host)
  const startStreaming = useCallback(async () => {
    console.log("[HOOK] 🎙️ START STREAMING called, isHost:", isHost);

    if (!isHost) {
      setError("Only the host can start streaming");
      console.log("[HOOK] ❌ Not host, cannot stream");
      return;
    }

    try {
      setError(null);

      // Initialize service if not exists
      if (!streamServiceRef.current) {
        console.log("[HOOK] Creating AudioStreamService...");
        streamServiceRef.current = new AudioStreamService();
      }

      // Request microphone permission and start capture
      await streamServiceRef.current.startCapture();
      setHasPermission(true);
      console.log("[HOOK] ✅ Microphone captured");

      // Subscribe channel before broadcasting
      if (channelRef.current && channelRef.current.state !== "joined") {
        console.log("[HOOK] Subscribing to channel...");
        await channelRef.current.subscribe();
        console.log("[HOOK] ✅ Channel subscribed, state:", channelRef.current.state);
      }

      // Start broadcasting audio
      if (channelRef.current) {
        await streamServiceRef.current.startBroadcast(channelRef.current);
        setIsStreaming(true);
        console.log("[HOOK] ✅ STREAMING STARTED!");
      }
    } catch (err) {
      console.error("[HOOK] ❌ Error starting stream:", err);
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
    console.log("[HOOK] 🎧 START LISTENING called, isHost:", isHost);

    if (isHost) {
      setError("Host should use startStreaming instead");
      console.log("[HOOK] ❌ Is host, should not listen");
      return;
    }

    try {
      setError(null);

      // Initialize listener service if not exists
      if (!listenerServiceRef.current) {
        console.log("[HOOK] Creating AudioListenerService...");
        listenerServiceRef.current = new AudioListenerService();
      }

      // Subscribe to channel
      if (channelRef.current && channelRef.current.state !== "joined") {
        console.log("[HOOK] Subscribing to channel...");
        await channelRef.current.subscribe();
        console.log("[HOOK] ✅ Channel subscribed, state:", channelRef.current.state);
      }

      // Start listening to audio broadcasts
      if (channelRef.current) {
        await listenerServiceRef.current.startListening(channelRef.current);
        setIsStreaming(true);
        console.log("[HOOK] ✅ LISTENING STARTED!");
      }
    } catch (err) {
      console.error("[HOOK] ❌ Error starting listening:", err);
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
