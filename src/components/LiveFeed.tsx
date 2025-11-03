import { useState } from 'react'
import { useLiveRooms } from '../hooks/useLiveRoom'
import { useAuth } from '../contexts/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Button } from './ui/button'
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar'
import { CreateLiveRoomModal } from './CreateLiveRoomModal'
import { Plus, Users, Radio } from 'lucide-react'
import { LoginModal } from './LoginModal'
import { getUserActiveRoom } from '../lib/edgeFunctions'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from './ui/alert-dialog'

export function LiveFeed() {
  const { rooms, loading, error } = useLiveRooms()
  const { user } = useAuth()
  const navigate = useNavigate()
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [showLoginModal, setShowLoginModal] = useState(false)
  const [showActiveRoomAlert, setShowActiveRoomAlert] = useState(false)
  const [activeRoomId, setActiveRoomId] = useState<string | null>(null)
  const [checkingRoom, setCheckingRoom] = useState(false)

  const handleCreateLive = async () => {
    if (!user) {
      setShowLoginModal(true)
      return
    }

    // Check if user already has an active room
    setCheckingRoom(true)
    const { data: activeRoom } = await getUserActiveRoom()
    setCheckingRoom(false)

    if (activeRoom) {
      setActiveRoomId(activeRoom.id)
      setShowActiveRoomAlert(true)
      return
    }

    setShowCreateModal(true)
  }

  const handleGoToActiveRoom = () => {
    if (activeRoomId) {
      navigate(`/live/${activeRoomId}`)
    }
    setShowActiveRoomAlert(false)
  }

  const handleJoinRoom = (roomId: string) => {
    navigate(`/live/${roomId}`)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="text-center space-y-4">
          <div className="w-12 h-12 border-4 border-[var(--color-accent)] border-t-transparent rounded-full animate-spin mx-auto" />
          <p className="text-[var(--color-text-secondary)]">Loading live rooms...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="pb-24">
      {/* Header */}
      <div className="border-b border-[var(--color-border)]">
        <div className="max-w-2xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <div className="absolute inset-0 bg-[var(--color-accent)] opacity-20 blur-xl rounded-full" />
                <div className="relative bg-[var(--color-accent)] p-3 rounded-2xl shadow-lg shadow-[var(--color-accent)]/20">
                  <Radio className="w-6 h-6 text-white" />
                </div>
              </div>
              <div>
                <h1 className="text-2xl font-bold text-[var(--color-text-primary)] tracking-tight">Live Rooms</h1>
                <p className="text-xs text-[var(--color-text-muted)] mt-0.5">Listen to live conversations</p>
              </div>
            </div>
            {user && (
              <Button
                onClick={handleCreateLive}
                disabled={checkingRoom}
                className="bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)] gap-2 shadow-lg shadow-[var(--color-accent)]/20 transition-all hover:scale-105 disabled:opacity-50"
              >
                {checkingRoom ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Plus className="w-5 h-5" />
                )}
                Go Live
              </Button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {error && (
          <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-xl">
            <p className="text-sm text-red-500">{error}</p>
          </div>
        )}

        {rooms.length === 0 ? (
          <div className="text-center py-16 space-y-4">
            <div className="w-20 h-20 mx-auto bg-[var(--color-bg-secondary)] rounded-full flex items-center justify-center">
              <Radio className="w-10 h-10 text-[var(--color-text-muted)]" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)]">
                No Live Rooms Right Now
              </h3>
              <p className="text-[var(--color-text-secondary)]">
                {user ? 'Be the first to start a live session!' : 'Sign in to create a live room'}
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {rooms.map((room) => (
              <div
                key={room.id}
                onClick={() => handleJoinRoom(room.id)}
                className="bg-[var(--color-bg-card)] rounded-3xl p-6 border border-[var(--color-border)] hover:border-[var(--color-accent)] transition-all cursor-pointer group"
              >
                {/* Live Badge */}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2">
                    <div className="relative">
                      <div className="w-2.5 h-2.5 bg-red-500 rounded-full animate-pulse" />
                      <div className="absolute inset-0 w-2.5 h-2.5 bg-red-500 rounded-full animate-ping" />
                    </div>
                    <span className="text-xs font-semibold text-red-500 uppercase">LIVE</span>
                  </div>
                  <div className="flex items-center gap-1.5 px-3 py-1 bg-[var(--color-bg-secondary)] rounded-full">
                    <Users className="w-4 h-4 text-[var(--color-text-muted)]" />
                    <span className="text-sm font-medium text-[var(--color-text-primary)]">
                      {room.listeners_count}
                    </span>
                  </div>
                </div>

                {/* Host Info */}
                <div className="flex items-center gap-3 mb-4">
                  <Avatar className="w-12 h-12">
                    <AvatarImage src={room.host?.avatar_url || undefined} />
                    <AvatarFallback>
                      {room.host?.full_name?.charAt(0).toUpperCase() || 'H'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-xs text-[var(--color-text-muted)] mb-0.5">Hosted by</p>
                    <p className="font-medium text-[var(--color-text-primary)]">
                      {room.host?.full_name || 'Anonymous'}
                    </p>
                  </div>
                </div>

                {/* Room Info */}
                <div className="space-y-2">
                  <h3 className="text-lg font-bold text-[var(--color-text-primary)]">
                    {room.title}
                  </h3>
                  {room.description && (
                    <p className="text-sm text-[var(--color-text-secondary)] line-clamp-2">
                      {room.description}
                    </p>
                  )}
                </div>

                {/* Join Button */}
                <div className="mt-4 pt-4 border-t border-[var(--color-border)]">
                  <Button
                    onClick={(e) => {
                      e.stopPropagation()
                      handleJoinRoom(room.id)
                    }}
                    className="w-full bg-[var(--color-accent)] hover:bg-[var(--color-accent)]/90 text-white"
                  >
                    Join & Listen
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Modals */}
      <CreateLiveRoomModal isOpen={showCreateModal} onClose={() => setShowCreateModal(false)} />
      <LoginModal isOpen={showLoginModal} onClose={() => setShowLoginModal(false)} />

      {/* Active Room Alert */}
      <AlertDialog open={showActiveRoomAlert} onOpenChange={setShowActiveRoomAlert}>
        <AlertDialogContent className="bg-[var(--color-bg-card)] border-[var(--color-border)]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[var(--color-text-primary)]">
              You Already Have an Active Live Room
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[var(--color-text-secondary)]">
              You can only have one active live room at a time. Would you like to go to your current live room?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-[var(--color-bg-secondary)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] border-[var(--color-border)]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleGoToActiveRoom}
              className="bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)]"
            >
              Go to Live Room
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
