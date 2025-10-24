import { useEffect, useState } from "react";

interface LoadingScreenProps {
  onComplete: () => void;
  onReady?: Promise<void>; // Promise to wait for (e.g., data fetching)
}

export function LoadingScreen({ onComplete, onReady }: LoadingScreenProps) {
  const [progress, setProgress] = useState(0);
  const [isExiting, setIsExiting] = useState(false);
  const [isDataReady, setIsDataReady] = useState(false);

  useEffect(() => {
    // Track when data is ready
    if (onReady) {
      onReady.then(() => {
        setIsDataReady(true);
      }).catch(() => {
        // Even if fetch fails, still mark as ready to not block UI
        setIsDataReady(true);
      });
    } else {
      setIsDataReady(true);
    }
  }, [onReady]);

  useEffect(() => {
    // Minimum duration: 1000ms for smooth UX
    const minDuration = 1000;
    const interval = 50; // Update every 50ms
    const steps = minDuration / interval;
    const increment = 100 / steps;

    let currentProgress = 0;
    const startTime = Date.now();

    const timer = setInterval(() => {
      currentProgress += increment;
      const elapsed = Date.now() - startTime;

      // If data is ready and minimum time has passed, complete at 100%
      if (isDataReady && elapsed >= minDuration) {
        currentProgress = 100;
      }

      if (currentProgress >= 100) {
        currentProgress = 100;
        setProgress(100);
        clearInterval(timer);

        // Start exit animation
        setTimeout(() => {
          setIsExiting(true);

          // Complete after fade out
          setTimeout(() => {
            onComplete();
          }, 500);
        }, 200);
      } else {
        setProgress(currentProgress);
      }
    }, interval);

    return () => clearInterval(timer);
  }, [onComplete, isDataReady]);

  return (
    <div
      className={`fixed inset-0 z-[9999] bg-gradient-to-br from-[var(--color-bg-primary)] via-[var(--color-bg-card)] to-[var(--color-bg-primary)] flex flex-col items-center justify-center transition-opacity duration-500 ${
        isExiting ? "opacity-0" : "opacity-100"
      }`}
    >
      {/* Logo with pulse animation */}
      <div className="mb-8 animate-in zoom-in-50 duration-700">
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
      <h1 className="text-4xl font-bold text-[var(--color-text-primary)] mb-2 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-100">
        YMelody
      </h1>

      {/* Tagline */}
      <p className="text-[var(--color-text-tertiary)] mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-200">
        Share your voice with the world
      </p>

      {/* Progress bar */}
      <div className="w-64 animate-in fade-in slide-in-from-bottom-4 duration-700 delay-300">
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
}
