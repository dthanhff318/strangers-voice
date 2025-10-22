import { useState, useRef, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { MiniAudioLoading } from "./AudioLoading";
import { useAuth } from "../contexts/AuthContext";
import { Button } from "./ui/button";

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
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

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
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const togglePlayPause = () => {
    if (!audioRef.current) return;

    if (isPlaying) {
      audioRef.current.pause();
    } else {
      audioRef.current.play();
    }
    setIsPlaying(!isPlaying);
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    if (audioRef.current) {
      audioRef.current.currentTime = time;
      setCurrentTime(time);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
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
          <Button
            onClick={startRecording}
            className="w-full bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)] font-semibold py-3 px-4 rounded-lg transition-all duration-200 flex items-center justify-center gap-2 shadow-md shadow-[var(--shadow-primary)] hover:scale-[1.02]"
          >
            <span className="text-xl">🎙️</span>
            <span className="text-sm">Start Recording</span>
          </Button>
        )}

        {isRecording && (
          <div className="space-y-3">
            <div className="flex items-center justify-center gap-2.5 bg-[var(--color-bg-card-hover)] py-5 rounded-lg border border-[var(--color-border)] shadow-sm">
              <div
                className={`w-2.5 h-2.5 rounded-full ${
                  isPaused ? "bg-[var(--color-inactive)]" : "bg-[var(--color-active-indicator)] animate-pulse"
                }`}
              />
              <span className="text-2xl font-mono font-bold text-[var(--color-text-primary)]">
                {formatTime(recordingTime)}
              </span>
            </div>

            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={pauseRecording}
                className="flex-1 bg-[var(--color-bg-card-hover)] border border-[var(--color-btn-primary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] font-semibold py-2.5 px-3 rounded-lg transition duration-200 text-sm"
              >
                {isPaused ? "▶️ Resume" : "⏸️ Pause"}
              </Button>
              <Button
                variant="outline"
                onClick={stopRecording}
                className="flex-1 bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] font-semibold py-2.5 px-3 rounded-lg transition duration-200 border border-[var(--color-border)] text-sm"
              >
                ⏹️ Stop
              </Button>
            </div>
          </div>
        )}

        {audioBlob && audioUrl && (
          <div className="space-y-4">
            {/* Preview Section */}
            <div className="bg-gradient-to-br from-[var(--color-bg-card)] to-[var(--color-bg-card-hover)] p-4 rounded-xl border border-[var(--color-border)] shadow-md">
              <div className="flex items-center gap-1.5 mb-3">
                <div className="w-1.5 h-1.5 bg-[var(--color-active-indicator)] rounded-full animate-pulse" />
                <span className="text-xs font-semibold text-[var(--color-text-primary)]">
                  Recording Preview
                </span>
              </div>

              {/* Hidden audio element */}
              <audio
                ref={audioRef}
                src={audioUrl}
                onTimeUpdate={handleTimeUpdate}
                onEnded={handleAudioEnded}
                onLoadedMetadata={() => {
                  if (audioRef.current) {
                    setDuration(audioRef.current.duration);
                  }
                }}
              />

              {/* Custom Audio Player */}
              <div className="bg-[var(--color-bg-primary)] rounded-lg p-3 space-y-2">
                {/* Play/Pause Button and Progress */}
                <div className="flex items-center gap-3">
                  <Button
                    size="icon"
                    onClick={togglePlayPause}
                    className="w-10 h-10 flex items-center justify-center bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)] rounded-full transition-all duration-200 shadow-md shadow-[var(--shadow-primary)] hover:scale-105"
                  >
                    {isPlaying ? (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M6 4h4v16H6V4zm8 0h4v16h-4V4z" />
                      </svg>
                    ) : (
                      <svg className="w-4 h-4 ml-0.5" fill="currentColor" viewBox="0 0 24 24">
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    )}
                  </Button>

                  <div className="flex-1 space-y-1">
                    {/* Progress Bar */}
                    <input
                      type="range"
                      min="0"
                      max={duration || recordingTime}
                      value={currentTime}
                      onChange={handleSeek}
                      className="w-full h-1.5 bg-[var(--color-bg-elevated)] rounded-full appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3 [&::-webkit-slider-thumb]:h-3 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-[var(--color-btn-primary)] [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:shadow-md [&::-moz-range-thumb]:w-3 [&::-moz-range-thumb]:h-3 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-[var(--color-btn-primary)] [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:cursor-pointer"
                      style={{
                        background: `linear-gradient(to right, var(--color-btn-primary) 0%, var(--color-btn-primary) ${(currentTime / (duration || recordingTime)) * 100}%, var(--color-bg-elevated) ${(currentTime / (duration || recordingTime)) * 100}%, var(--color-bg-elevated) 100%)`
                      }}
                    />

                    {/* Time Display */}
                    <div className="flex items-center justify-between text-[10px] text-[var(--color-text-tertiary)]">
                      <span className="font-mono">{formatTime(Math.floor(currentTime))}</span>
                      <span className="font-mono">{formatTime(Math.floor(duration || recordingTime))}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between text-[10px] pt-2">
                <span className="text-[var(--color-text-tertiary)]">
                  {formatTime(Math.floor(duration || recordingTime))}
                </span>
                <span className="text-green-500 font-medium flex items-center gap-1">
                  <span>✓</span>
                  <span>Ready</span>
                </span>
              </div>
            </div>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border)]"></div>
              </div>
              <div className="relative flex justify-center text-[10px]">
                <span className="bg-[var(--color-bg-card)] px-2 py-0.5 text-[var(--color-text-tertiary)] rounded-full">
                  Add details
                </span>
              </div>
            </div>

            {/* Form Section */}
            <div className="space-y-3">
              {/* Title Input */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                  Title
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="What's this recording about?"
                  maxLength={100}
                  className="w-full px-3 py-2 text-sm bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-btn-primary)] focus:ring-offset-1 focus:ring-offset-[var(--color-bg-card)] focus:border-transparent transition-all duration-200"
                />
                {title.length > 0 && (
                  <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1">
                    {title.length}/100
                  </p>
                )}
              </div>

              {/* Description Input */}
              <div>
                <label className="block text-xs font-semibold text-[var(--color-text-primary)] mb-1.5">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Tell listeners more..."
                  maxLength={500}
                  rows={3}
                  className="w-full px-3 py-2 text-sm bg-[var(--color-bg-input)] border border-[var(--color-border)] rounded-lg text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-btn-primary)] focus:ring-offset-1 focus:ring-offset-[var(--color-bg-card)] focus:border-transparent transition-all duration-200 resize-none"
                />
                <p className="text-[10px] text-[var(--color-text-tertiary)] mt-1 text-right">
                  {description.length}/500
                </p>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button
                onClick={uploadRecording}
                disabled={isUploading}
                className="flex-1 bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] disabled:opacity-50 disabled:cursor-not-allowed text-[var(--color-btn-primary-text)] font-semibold py-2.5 px-4 rounded-lg transition-all duration-200 shadow-md shadow-[var(--shadow-primary)] flex items-center justify-center gap-1.5 hover:scale-[1.02] text-sm"
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
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={discardRecording}
                disabled={isUploading}
                className="px-4 bg-[var(--color-bg-card-hover)] border border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)] hover:border-red-500/50 text-[var(--color-text-secondary)] hover:text-red-400 font-semibold py-2.5 rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed text-sm"
                title="Discard recording"
              >
                🗑️
              </Button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
