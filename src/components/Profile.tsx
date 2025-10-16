import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { supabase } from '../lib/supabase'
import { Camera, Edit2, Save, X, Loader2, User, Mic } from 'lucide-react'
import { AvatarPicker } from './AvatarPicker'
import { CompactAudioCard } from './CompactAudioCard'

interface Recording {
  id: string
  created_at: string
  file_url: string
  duration: number
  likes_count: number
  dislikes_count: number
  title: string | null
  description: string | null
}

interface ProfileProps {
  onLoginRequired?: () => void
}

export function Profile({ onLoginRequired }: ProfileProps = {}) {
  const { user, profile, refreshProfile } = useAuth()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)
  const [recordings, setRecordings] = useState<Recording[]>([])
  const [loadingRecordings, setLoadingRecordings] = useState(true)

  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')

  // Initialize form values from profile
  useEffect(() => {
    if (profile) {
      setName(profile.full_name || '')
      setAvatarUrl(profile.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${user?.id || 'default'}`)
    }
  }, [profile, user])

  // Fetch user's recordings
  useEffect(() => {
    if (user) {
      fetchRecordings()
    }
  }, [user])

  const fetchRecordings = async () => {
    if (!user) return

    try {
      setLoadingRecordings(true)
      const { data, error: fetchError } = await supabase
        .from('recordings')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })

      if (fetchError) throw fetchError

      setRecordings(data || [])
    } catch (err) {
      console.error('Error fetching recordings:', err)
    } finally {
      setLoadingRecordings(false)
    }
  }

  // If not logged in, show login prompt
  if (!user) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center text-center animate-in fade-in duration-500 px-4">
        <div className="w-24 h-24 mx-auto mb-6 bg-[var(--color-bg-card)] rounded-full flex items-center justify-center animate-in zoom-in duration-700 delay-100">
          <User className="w-12 h-12 text-[var(--color-text-tertiary)]" />
        </div>
        <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-3 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-200">
          Sign in to view your profile
        </h2>
        <p className="text-[var(--color-text-tertiary)] max-w-sm mb-8 animate-in fade-in slide-in-from-bottom-2 duration-500 delay-300">
          Create your profile, customize your avatar, and connect with the community
        </p>
        <button
          onClick={onLoginRequired}
          className="bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)] px-8 py-4 rounded-xl font-semibold transition-all hover:scale-105 shadow-lg shadow-[var(--shadow-primary)] animate-in zoom-in duration-500 delay-400"
        >
          Sign in with Google
        </button>
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
      setError(null)

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          avatar_url: newAvatarUrl
        }
      })

      if (updateError) throw updateError

      // Update profiles table
      await supabase
        .from('profiles')
        .upsert({
          id: user!.id,
          full_name: profile?.full_name || name,
          avatar_url: newAvatarUrl,
          email: user!.email
        })

      // Refresh profile data
      await refreshProfile()
      setShowAvatarPicker(false)
    } catch (err) {
      console.error('Error saving avatar:', err)
      setError('Failed to save avatar. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleSave = async () => {
    try {
      setSaving(true)
      setError(null)

      // Update user metadata
      const { error: updateError } = await supabase.auth.updateUser({
        data: {
          full_name: name
        }
      })

      if (updateError) throw updateError

      // Update profiles table
      await supabase
        .from('profiles')
        .upsert({
          id: user!.id,
          full_name: name,
          avatar_url: profile?.avatar_url || avatarUrl,
          email: user!.email
        })

      // Refresh profile data
      await refreshProfile()

      setIsEditing(false)
    } catch (err) {
      console.error('Error saving name:', err)
      setError('Failed to save name. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    setName(profile?.full_name || '')
    setIsEditing(false)
    setError(null)
  }

  return (
    <div className="min-h-[70vh] animate-in fade-in duration-500">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">My Profile</h1>
        </div>

        {/* Error Message */}
        {error && (
          <div className="mb-6 p-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg animate-in slide-in-from-top-2">
            {error}
          </div>
        )}

        {/* Profile Card */}
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            <div
              className="relative w-16 h-16 rounded-full bg-[var(--color-bg-primary)] overflow-hidden flex-shrink-0 cursor-pointer group"
              onClick={handleAvatarClick}
            >
              <img
                src={avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover group-hover:opacity-60 transition-opacity"
              />
              <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
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
                    <button
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
                    </button>
                    <button
                      onClick={handleCancel}
                      disabled={saving}
                      className="p-1.5 bg-[var(--color-bg-elevated)] hover:bg-[var(--color-bg-card-hover)] text-[var(--color-text-secondary)] rounded-lg transition-all disabled:opacity-50"
                      title="Cancel"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <div className="flex items-center gap-2 group/name">
                    <p className="text-lg font-bold text-[var(--color-text-primary)] truncate">
                      {profile?.full_name || 'Anonymous User'}
                    </p>
                    <button
                      onClick={() => setIsEditing(true)}
                      className="p-1 rounded-md hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all opacity-0 group-hover/name:opacity-100"
                      title="Edit name"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
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
              <Mic className="w-12 h-12 mx-auto mb-4 text-[var(--color-text-tertiary)]" />
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
                <CompactAudioCard key={recording.id} recording={recording} />
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
      />
    </div>
  )
}
