import { useEffect, useState, memo } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
  progress: number; // Real progress from 0-100
}

export const LoadingScreen = memo(function LoadingScreen({ onComplete, progress }: LoadingScreenProps) {
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // When progress reaches 100%, start exit animation
    if (progress >= 100) {
      setTimeout(() => {
        setIsExiting(true);

        // Complete after fade out
        setTimeout(() => {
          onComplete();
        }, 500);
      }, 200);
    }
  }, [progress, onComplete]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-card)] to-[var(--color-bg-primary)] flex flex-col items-center justify-center transition-opacity duration-500 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo with pulse animation */}
      <div className="mb-8">
        <div className="relative">
          {/* Glow effect */}
          <div className="absolute inset-0 bg-[var(--color-btn-primary)] opacity-20 blur-3xl animate-pulse" />

          {/* Logo container */}
          <div className="relative w-24 h-24 bg-gradient-to-br from-[var(--color-btn-primary)] to-[var(--color-btn-primary-hover)] rounded-3xl flex items-center justify-center shadow-2xl shadow-[var(--shadow-primary)]">
            <img
              src="/favicon.png"
              alt="YMelody"
              className="w-16 h-16 logo-invert animate-pulse"
            />
          </div>
        </div>
      </div>

      {/* Brand name */}
      <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-2">
        YMelody
      </h1>

      {/* Tagline */}
      <p className="text-[var(--color-text-tertiary)] mb-12">
        Share your voice with the world
      </p>

      {/* Progress bar */}
      <div className="w-64">
        <div className="h-1.5 bg-[var(--color-bg-elevated)] rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-[var(--color-btn-primary)] to-[var(--color-accent-primary)] rounded-full transition-all duration-300 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Loading text */}
        <div className="mt-3 text-center">
          <span className="text-xs text-[var(--color-text-tertiary)] font-medium">
            {progress < 100 ? "Loading..." : "Ready!"}
          </span>
        </div>
      </div>

      {/* Decorative dots */}
      <div className="absolute bottom-8 flex gap-2">
        <div className="w-2 h-2 bg-[var(--color-btn-primary)] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
        <div className="w-2 h-2 bg-[var(--color-btn-primary)] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
        <div className="w-2 h-2 bg-[var(--color-btn-primary)] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
      </div>
    </div>
  );
});
