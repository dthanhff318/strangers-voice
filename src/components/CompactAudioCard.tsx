import { useState, useEffect, useRef } from "react";
import WaveSurfer from "wavesurfer.js";
import { Play, Pause, Flame, MessageCircle } from "lucide-react";

interface Recording {
  id: string;
  created_at: string;
  file_url: string;
  duration: number;
  likes_count: number;
  dislikes_count: number;
  title: string | null;
  description: string | null;
}

interface CompactAudioCardProps {
  recording: Recording;
}

export function CompactAudioCard({ recording }: CompactAudioCardProps) {
  const [isPlaying, setIsPlaying] = useState(false);
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
        <span className="text-[var(--color-text-tertiary)] text-xs flex-shrink-0">
          {formatDate(recording.created_at)}
        </span>
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
    </div>
  );
}
