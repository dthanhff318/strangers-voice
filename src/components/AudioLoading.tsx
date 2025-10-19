export function AudioLoading() {
  return (
    <div className="flex items-center justify-center py-20">
      {/* Waveform Animation with Circle */}
      <div className="relative w-full max-w-md h-32">
        <svg
          viewBox="0 0 400 120"
          className="w-full h-full"
          xmlns="http://www.w3.org/2000/svg"
        >
          {/* Gradient Definitions */}
          <defs>
            <linearGradient id="waveGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#737373" stopOpacity="0.3" />
              <stop offset="50%" stopColor="#FFFFFF" stopOpacity="1" />
              <stop offset="100%" stopColor="#737373" stopOpacity="0.3" />
            </linearGradient>
            <radialGradient id="circleGradient">
              <stop offset="0%" stopColor="#FFFFFF" />
              <stop offset="50%" stopColor="#E5E5E5" />
              <stop offset="100%" stopColor="#A3A3A3" />
            </radialGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="coloredBlur"/>
              <feMerge>
                <feMergeNode in="coloredBlur"/>
                <feMergeNode in="SourceGraphic"/>
              </feMerge>
            </filter>
          </defs>

          {/* Animated Waveform Path */}
          <path
            d="M 0 60 Q 25 40, 50 60 T 100 60 Q 125 50, 150 60 T 200 60 Q 225 70, 250 60 T 300 60 Q 325 45, 350 60 T 400 60"
            fill="none"
            stroke="url(#waveGradient)"
            strokeWidth="2.5"
            strokeLinecap="round"
            filter="url(#glow)"
          >
            <animate
              attributeName="d"
              dur="2s"
              repeatCount="indefinite"
              values="
                M 0 60 Q 25 40, 50 60 T 100 60 Q 125 50, 150 60 T 200 60 Q 225 70, 250 60 T 300 60 Q 325 45, 350 60 T 400 60;
                M 0 60 Q 25 70, 50 60 T 100 60 Q 125 45, 150 60 T 200 60 Q 225 50, 250 60 T 300 60 Q 325 75, 350 60 T 400 60;
                M 0 60 Q 25 50, 50 60 T 100 60 Q 125 65, 150 60 T 200 60 Q 225 55, 250 60 T 300 60 Q 325 50, 350 60 T 400 60;
                M 0 60 Q 25 40, 50 60 T 100 60 Q 125 50, 150 60 T 200 60 Q 225 70, 250 60 T 300 60 Q 325 45, 350 60 T 400 60
              "
            />
          </path>

          {/* Center Circle with Gradient */}
          <circle
            cx="200"
            cy="60"
            r="22"
            fill="url(#circleGradient)"
            filter="url(#glow)"
            opacity="0.9"
          >
            <animate
              attributeName="r"
              values="22;26;22"
              dur="2s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.9;1;0.9"
              dur="2s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Inner Circle Glow */}
          <circle
            cx="200"
            cy="60"
            r="12"
            fill="#FFFFFF"
            opacity="0.8"
          >
            <animate
              attributeName="r"
              values="12;15;12"
              dur="1.5s"
              repeatCount="indefinite"
            />
            <animate
              attributeName="opacity"
              values="0.8;1;0.8"
              dur="1.5s"
              repeatCount="indefinite"
            />
          </circle>

          {/* Sparkle Effect */}
          <circle cx="220" cy="50" r="2" fill="#ffffff" opacity="0.8">
            <animate
              attributeName="opacity"
              values="0.8;0.3;0.8"
              dur="1s"
              repeatCount="indefinite"
            />
          </circle>
        </svg>
      </div>
    </div>
  )
}

export function MiniAudioLoading() {
  return (
    <div className="inline-flex items-center gap-1">
      {[...Array(3)].map((_, i) => (
        <div
          key={i}
          className="w-1 rounded-full"
          style={{
            backgroundColor: '#FFFFFF',
            height: `${12 + Math.sin(i) * 4}px`,
            animation: 'wave 0.8s ease-in-out infinite',
            animationDelay: `${i * 0.1}s`
          }}
        />
      ))}
      <style>{`
        @keyframes wave {
          0%, 100% { transform: scaleY(1); }
          50% { transform: scaleY(1.5); }
        }
      `}</style>
    </div>
  )
}
