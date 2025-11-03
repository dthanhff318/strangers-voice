import { X } from 'lucide-react'
import { useState } from 'react'
import { Button } from './ui/button'
import { useLiveRoom } from '../hooks/useLiveRoom'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'

interface CreateLiveRoomModalProps {
  isOpen: boolean
  onClose: () => void
}

export function CreateLiveRoomModal({ isOpen, onClose }: CreateLiveRoomModalProps) {
  const [title, setTitle] = useState('')
  const [isCreating, setIsCreating] = useState(false)
  const { createRoom } = useLiveRoom()
  const { user } = useAuth()
  const navigate = useNavigate()

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!user) {
      alert('You must be logged in to create a live room')
      return
    }

    if (!title.trim()) {
      alert('Please enter a title for your live room')
      return
    }

    try {
      setIsCreating(true)
      const roomId = await createRoom({
        host_id: user.id,
        title: title.trim(),
        description: null,
      })

      if (roomId) {
        onClose()
        setTitle('')
        navigate(`/live/${roomId}`)
      }
    } finally {
      setIsCreating(false)
    }
  }

  const handleClose = () => {
    setTitle('')
    onClose()
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[var(--color-bg-primary)]/95 backdrop-blur-md z-50 cursor-pointer"
        onClick={handleClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[var(--color-bg-card)] rounded-3xl shadow-2xl border border-[var(--color-border)] w-full max-w-md pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative flex items-center justify-center py-6 border-b border-[var(--color-border)]">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">
              Create Live Room
            </h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleClose}
              className="absolute right-4 p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors rounded-full hover:bg-[var(--color-bg-card-hover)]"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <form onSubmit={handleSubmit} className="p-8 space-y-6">
            {/* Title Input */}
            <div className="space-y-2">
              <label
                htmlFor="title"
                className="text-sm font-medium text-[var(--color-text-secondary)]"
              >
                Title *
              </label>
              <input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="What's your live about?"
                maxLength={100}
                className="w-full px-4 py-3 bg-[var(--color-bg-secondary)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--color-accent)] focus:border-transparent transition-all"
                disabled={isCreating}
                required
              />
              <div className="text-xs text-[var(--color-text-muted)] text-right">
                {title.length}/100
              </div>
            </div>

            {/* Info */}
            <div className="bg-[var(--color-accent-subtle)] rounded-xl p-4 space-y-2">
              <div className="flex items-start gap-2">
                <span className="text-lg">🎙️</span>
                <div className="text-sm text-[var(--color-text-secondary)]">
                  <p className="font-medium mb-1">You're about to go live!</p>
                  <p className="text-[var(--color-text-muted)]">
                    Make sure you're in a quiet place and your microphone is working properly.
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <Button
                type="button"
                onClick={handleClose}
                variant="outline"
                className="flex-1"
                disabled={isCreating}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="flex-1 bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)]"
                disabled={isCreating}
              >
                {isCreating ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  'Go Live'
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}
