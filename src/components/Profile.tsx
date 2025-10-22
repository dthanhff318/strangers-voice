import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { getMyRecordings, updateUserInfo } from '../lib/edgeFunctions'
import { Camera, Edit2, Save, X, Loader2, User as UserIcon, Mic } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { Button } from './ui/button'
import { AvatarPicker } from './AvatarPicker'
import { CompactAudioCard } from './CompactAudioCard'
import { toast } from 'sonner'

interface Recording {
  id: string
  created_at: string
  file_url: string
  duration: number
  likes_count: number
  dislikes_count: number
  user_id: string | null
  title: string | null
  description: string | null
}

interface ProfileProps {
  onLoginRequired?: () => void
}

export function Profile({ onLoginRequired }: ProfileProps = {}) {
  const { user, profile, refreshProfile } = useAuth()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Initialize form values from profile
  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '')
      setAvatarUrl(profile.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${user?.id || 'default'}`)
    }
  }, [profile, user])

  // Use React Query for fetching user's recordings with caching
  const {
    data: recordings = [],
    isLoading: loadingRecordings,
  } = useQuery<Recording[]>({
    queryKey: ['my-recordings', user?.id],
    queryFn: async () => {
      if (!user) return []
      const { data, error: fetchError } = await getMyRecordings()
      if (fetchError) throw fetchError
      return (data?.data || []) as Recording[]
    },
    enabled: !!user, // Only fetch when user is logged in
  })

  // Refresh recordings on delete
  const handleDeleteRecording = () => {
    queryClient.invalidateQueries({ queryKey: ['my-recordings', user?.id] })
  }

  // If not logged in, show login prompt
  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center animate-in fade-in duration-500 px-4">
        <div className="w-24 h-24 mx-auto mb-6 bg-[var(--color-bg-card)] rounded-full flex items-center justify-center animate-in zoom-in duration-700 delay-100">
          <UserIcon className="w-12 h-12 text-[var(--color-text-tertiary)]" />
        </div>
        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
          Sign in to view your profile
        </h2>
        <p className="text-[var(--color-text-tertiary)] max-w-sm mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
          Create your profile, customize your avatar, and connect with the community
        </p>
        <Button
          onClick={onLoginRequired}
          className="bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)] px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-[var(--shadow-primary)] animate-in zoom-in duration-500 delay-400"
        >
          Sign in with Google
        </Button>
      </div>
    )
  }

  const handleAvatarClick = () => {
    setShowAvatarPicker(true)
  }

  const handleAvatarSelect = async (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl)

    // Auto-save avatar
    try {
      setSaving(true)

      // Call edge function to update user info
      const { error } = await updateUserInfo(profile?.full_name || name, newAvatarUrl)

      if (error) throw error

      // Refresh profile data
      await refreshProfile()

      toast.success('Avatar updated successfully')
      setShowAvatarPicker(false)
    } catch (err) {
      console.error('Error saving avatar:', err)
      toast.error('Failed to save avatar. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)

      // Call edge function to update user info
      const { error } = await updateUserInfo(name, profile?.avatar_url || avatarUrl)

      if (error) throw error

      // Refresh profile data
      await refreshProfile()

      toast.success('Profile updated successfully')
      setIsEditing(false)
    } catch (err) {
      console.error('Error saving name:', err)
      toast.error('Failed to save name. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setName(profile?.full_name || '')
    setIsEditing(false)
  }

  return (
    <div className="min-h-[70vh] animate-in fade-in duration-500">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">My Profile</h1>
        </div>

        {/* Profile Card */}
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div className="relative flex-shrink-0 cursor-pointer group" onClick={handleAvatarClick}>
              <Avatar className="w-16 h-16">
                <AvatarImage src={avatarUrl} alt="Profile" className="group-hover:opacity-60 transition-opacity" />
                <AvatarFallback className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-full">
                <Camera className="w-5 h-5 text-[var(--color-text-primary)]" />
              </div>
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Name */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1">
                  Display Name
                </label>
                {isEditing ? (
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="Enter your name"
                      className="flex-1 px-3 py-1.5 bg-[var(--color-bg-input)] border border-[var(--color-border-light)] rounded-lg text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
                    />
                    <Button
                      size="icon-sm"
                      onClick={handleSave}
                      disabled={saving}
                      className="p-1.5 bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)] rounded-lg transition-all disabled:opacity-50"
                      title="Save"
                    >
                      {saving ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Save className="w-4 h-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon-sm"
                      onClick={handleCancel}
                      disabled={saving}
                      className="p-1.5 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-card-hover)] text-[var(--color-text-secondary)] rounded-lg transition-all disabled:opacity-50"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/name">
                    <p className="text-lg font-bold text-[var(--color-text-primary)] truncate">
                      {profile?.full_name || 'Anonymous User'}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={() => setIsEditing(true)}
                      className="p-1 rounded-md hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all opacity-0 group-hover/name:opacity-100"
                      title="Edit name"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </Button>
                  </div>
                )}
              </div>

              {/* Email */}
              <div className="mb-3">
                <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1">
                  Email
                </label>
                <p className="text-sm text-[var(--color-text-secondary)] truncate">{user?.email}</p>
              </div>

              {/* Member Since */}
              <div className="text-xs text-[var(--color-text-muted)]">
                Member since {new Date(user?.created_at || new Date()).toLocaleDateString()}
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 pt-4 mt-4 border-t border-[var(--color-border)]">
            <div className="text-center">
              <div className="text-xl font-bold text-[var(--color-text-primary)]">
                {loadingRecordings ? '-' : recordings.length}
              </div>
              <div className="text-xs text-[var(--color-text-tertiary)]">Recordings</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-[var(--color-text-primary)]">0</div>
              <div className="text-xs text-[var(--color-text-tertiary)]">Followers</div>
            </div>
            <div className="text-center">
              <div className="text-xl font-bold text-[var(--color-text-primary)]">0</div>
              <div className="text-xs text-[var(--color-text-tertiary)]">Following</div>
            </div>
          </div>
        </div>

        {/* My Recordings Section */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <Mic className="w-5 h-5 text-[var(--color-accent-primary)]" />
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              My Recordings
            </h2>
          </div>

          {loadingRecordings ? (
            <div className="text-center py-8">
              <Loader2 className="w-8 h-8 mx-auto animate-spin text-[var(--color-text-tertiary)]" />
            </div>
          ) : recordings.length === 0 ? (
            <div className="text-center py-12 bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)]">
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 bg-[var(--color-btn-primary)] rounded-lg flex items-center justify-center opacity-50">
                  <img src="/favicon.png" alt="YMelody" className="w-8 h-8 logo-invert" />
                </div>
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-secondary)] mb-2">
                No recordings yet
              </h3>
              <p className="text-[var(--color-text-tertiary)]">
                Start recording to share your voice with the world!
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recordings.map((recording) => (
                <CompactAudioCard key={recording.id} recording={recording} onDelete={handleDeleteRecording} />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Avatar Picker Modal */}
      <AvatarPicker
        isOpen={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        onSelect={handleAvatarSelect}
        currentAvatar={avatarUrl}
        saving={saving}
      />
    </div>
  )
}
