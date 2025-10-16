interface FloatingRecordButtonProps {
  onClick: () => void
}

export function FloatingRecordButton({ onClick }: FloatingRecordButtonProps) {
  return (
    <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom">
      <div className="bg-gray-800 rounded-full shadow-2xl border border-gray-700 flex items-center gap-3 px-6 py-4 hover:shadow-xl transition-all">
        <input
          type="text"
          placeholder="Write a comment"
          readOnly
          onClick={onClick}
          className="bg-transparent outline-none text-gray-400 placeholder-gray-500 cursor-pointer w-48"
        />
        <button
          onClick={onClick}
          className="bg-gradient-to-br from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white p-4 rounded-full transition-all hover:scale-110 shadow-lg shadow-orange-900/50"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="currentColor"
            viewBox="0 0 24 24"
          >
            <path d="M12 14c1.66 0 3-1.34 3-3V5c0-1.66-1.34-3-3-3S9 3.34 9 5v6c0 1.66 1.34 3 3 3z"/>
            <path d="M17 11c0 2.76-2.24 5-5 5s-5-2.24-5-5H5c0 3.53 2.61 6.43 6 6.92V21h2v-3.08c3.39-.49 6-3.39 6-6.92h-2z"/>
          </svg>
        </button>
      </div>
    </div>
  )
}
