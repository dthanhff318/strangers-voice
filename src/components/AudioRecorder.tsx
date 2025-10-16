import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { MiniAudioLoading } from "./AudioLoading";
import { useAuth } from "../contexts/AuthContext";

interface AudioRecorderProps {
  onUploadSuccess?: () => void;
}

export function AudioRecorder({ onUploadSuccess }: AudioRecorderProps) {
  const { user } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: "audio/webm",
      });
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        const url = URL.createObjectURL(blob);
        setAudioUrl(url);

        // Get duration from audio element
        const audio = new Audio(url);
        audio.onloadedmetadata = () => {
          setDuration(audio.duration);
        };

        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach((track) => track.stop());
        }
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError("Could not access microphone. Please check permissions.");
    }
  };

  const pauseRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      if (isPaused) {
        mediaRecorderRef.current.resume();
        if (timerRef.current) clearInterval(timerRef.current);
        timerRef.current = setInterval(() => {
          setRecordingTime((prev) => prev + 1);
        }, 1000);
      } else {
        mediaRecorderRef.current.pause();
        if (timerRef.current) clearInterval(timerRef.current);
      }
      setIsPaused(!isPaused);
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      setIsPaused(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const uploadRecording = async () => {
    if (!audioBlob) return;

    try {
      setIsUploading(true);
      setError(null);

      const fileName = `recording-${Date.now()}.webm`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from("audio-recordings")
        .upload(fileName, audioBlob, {
          contentType: "audio/webm",
          cacheControl: "3600",
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const {
        data: { publicUrl },
      } = supabase.storage.from("audio-recordings").getPublicUrl(fileName);

      // Save metadata to database
      const { error: dbError } = await supabase.from("recordings").insert({
        file_url: publicUrl,
        duration: duration || recordingTime,
        user_id: user?.id,
        title: title.trim() || null,
        description: description.trim() || null,
      });

      if (dbError) throw dbError;

      // Reset state
      setAudioBlob(null);
      setAudioUrl(null);
      setDuration(0);
      setRecordingTime(0);
      setTitle("");
      setDescription("");

      onUploadSuccess?.();
    } catch (err) {
      console.error("Error uploading recording:", err);
      setError("Failed to upload recording. Please try again.");
    } finally {
      setIsUploading(false);
    }
  };

  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setRecordingTime(0);
    setTitle("");
    setDescription("");
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <>
      {error && (
        <div className="mb-4 p-3 bg-[var(--color-bg-card-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {!isRecording && !audioBlob && (
          <button
            onClick={startRecording}
            className="w-full bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)] font-semibold py-4 px-6 rounded-xl transition duration-200 flex items-center justify-center gap-3 shadow-lg shadow-[var(--shadow-primary)]"
          >
            <span className="text-2xl">🎙️</span>
            <span>Start Recording</span>
          </button>
        )}

        {isRecording && (
          <div className="space-y-4">
            <div className="flex items-center justify-center gap-3 bg-[var(--color-bg-card-hover)] py-6 rounded-xl border border-[var(--color-border)]">
              <div
                className={`w-3 h-3 rounded-full ${
                  isPaused ? "bg-[var(--color-inactive)]" : "bg-[var(--color-active-indicator)] animate-pulse"
                }`}
              />
              <span className="text-3xl font-mono font-bold text-[var(--color-text-primary)]">
                {formatTime(recordingTime)}
              </span>
            </div>

            <div className="flex gap-3">
              <button
                onClick={pauseRecording}
                className="flex-1 bg-[var(--color-bg-card-hover)] border-2 border-[var(--color-btn-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] font-semibold py-3 px-4 rounded-xl transition duration-200"
              >
                {isPaused ? "▶️ Resume" : "⏸️ Pause"}
              </button>
              <button
                onClick={stopRecording}
                className="flex-1 bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-semibold py-3 px-4 rounded-xl transition duration-200 border border-[var(--color-border)]"
              >
                ⏹️ Stop
              </button>
            </div>
          </div>
        )}

        {audioBlob && audioUrl && (
          <div className="space-y-4">
            <div className="bg-[var(--color-bg-primary)] p-4 rounded-xl border border-[var(--color-border)]">
              <p className="text-sm font-medium text-[var(--color-text-secondary)] mb-3">
                Preview your recording:
              </p>
              <audio controls src={audioUrl} className="w-full mb-3" />
              <p className="text-xs text-[var(--color-text-tertiary)]">
                Duration: {formatTime(Math.floor(duration || recordingTime))}
              </p>
            </div>

            {/* Title Input */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Title <span className="text-[var(--color-text-tertiary)]">(optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Give your recording a title..."
                maxLength={100}
                className="w-full px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border-light)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
              />
            </div>

            {/* Description Input */}
            <div>
              <label className="block text-sm font-medium text-[var(--color-text-secondary)] mb-2">
                Description <span className="text-[var(--color-text-tertiary)]">(optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Add a description..."
                maxLength={500}
                rows={3}
                className="w-full px-4 py-3 bg-[var(--color-bg-input)] border border-[var(--color-border-light)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors resize-none"
              />
              <p className="text-xs text-[var(--color-text-tertiary)] mt-1 text-right">
                {description.length}/500
              </p>
            </div>

            <div className="flex gap-3">
              <button
                onClick={uploadRecording}
                disabled={isUploading}
                className="flex-1 bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] disabled:bg-[var(--color-bg-elevated)] text-[var(--color-btn-primary-text)] disabled:text-[var(--color-text-tertiary)] font-semibold py-3 px-4 rounded-xl transition duration-200 shadow-lg shadow-[var(--shadow-primary)] flex items-center justify-center gap-2"
              >
                {isUploading ? (
                  <>
                    <MiniAudioLoading />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <>
                    <span>✓</span>
                    <span>Publish</span>
                  </>
                )}
              </button>
              <button
                onClick={discardRecording}
                disabled={isUploading}
                className="px-6 bg-[var(--color-bg-card-hover)] border-2 border-[var(--color-border)] hover:border-[var(--color-border-focus)] hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] font-semibold py-3 rounded-xl transition duration-200"
              >
                🗑️
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
