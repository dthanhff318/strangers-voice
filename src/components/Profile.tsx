import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { useAuth } from '../contexts/AuthContext'
import { useFollow } from '../hooks/useFollow'
import { useLoginRequired } from '../App'
import { getMyRecordings, updateUserInfo } from '../lib/edgeFunctions'
import { supabase } from '../lib/supabase'
import { Camera, Edit2, Save, X, Loader2, User as UserIcon, Mic, ArrowLeft, UserPlus, UserCheck, Image } from 'lucide-react'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { Button } from './ui/button'
import { AvatarPicker } from './AvatarPicker'
import { BackgroundPicker } from './BackgroundPicker'
import { CompactAudioCard } from './CompactAudioCard'
import { FollowersModal } from './FollowersModal'
import { getBackgroundById } from '../constants/backgrounds'
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

interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  email: string | null
  created_at: string
  background_id: string | null
}

export function Profile() {
  const { userId } = useParams<{ userId: string }>()
  const navigate = useNavigate()
  const { user, profile: currentUserProfile, refreshProfile } = useAuth()
  const { onLoginRequired } = useLoginRequired()
  const queryClient = useQueryClient()
  const [isEditing, setIsEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [showAvatarPicker, setShowAvatarPicker] = useState(false)

  const [name, setName] = useState('')
  const [avatarUrl, setAvatarUrl] = useState('')
  const [showFollowersModal, setShowFollowersModal] = useState(false)
  const [followersModalMode, setFollowersModalMode] = useState<'followers' | 'following'>('followers')
  const [showBackgroundPicker, setShowBackgroundPicker] = useState(false)

  // Determine if viewing own profile or someone else's
  const isOwnProfile = !userId || userId === user?.id
  const targetUserId = userId || user?.id

  // Fetch profile data (for other users)
  const {
    data: otherUserProfile,
    isLoading: loadingProfile,
  } = useQuery<UserProfile | null>({
    queryKey: ['user-profile', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', userId)
        .single()

      if (error) throw error
      return data as UserProfile
    },
    enabled: !!userId && userId !== user?.id,
  })

  // Use the appropriate profile based on whether it's own or other user's
  const profile: UserProfile | null = isOwnProfile
    ? (currentUserProfile as UserProfile | null)
    : (otherUserProfile ?? null)

  // Use follow hook to get follow status and counts
  // Always fetch (even for own profile) to get followers/following counts
  const {
    isFollowing,
    isLoading: loadingFollowStatus,
    isToggling,
    followersCount,
    followingCount,
    handleToggleFollow
  } = useFollow(targetUserId, !!targetUserId) // Always enabled if userId exists

  // Initialize form values from profile
  useEffect(() => {
    if (isOwnProfile && currentUserProfile) {
      setName(currentUserProfile.full_name || '')
      setAvatarUrl(currentUserProfile.avatar_url || `https://api.dicebear.com/9.x/micah/svg?seed=${user?.id || 'default'}`)
    }
  }, [currentUserProfile, user, isOwnProfile])

  // Use React Query for fetching recordings with caching
  const {
    data: recordings = [],
    isLoading: loadingRecordings,
  } = useQuery<Recording[]>({
    queryKey: ['user-recordings', targetUserId],
    queryFn: async () => {
      if (!targetUserId) return []

      // If viewing own profile, use edge function
      if (isOwnProfile) {
        const { data, error: fetchError } = await getMyRecordings()
        if (fetchError) throw fetchError
        return (data?.data || []) as Recording[]
      }

      // If viewing other user's profile, fetch directly
      const { data, error } = await supabase
        .from('recordings')
        .select('*')
        .eq('user_id', targetUserId)
        .order('created_at', { ascending: false })

      if (error) throw error
      return (data || []) as Recording[]
    },
    enabled: !!targetUserId,
  })

  // Refresh recordings on delete
  const handleDeleteRecording = () => {
    queryClient.invalidateQueries({ queryKey: ['user-recordings', targetUserId] })
  }

  const handleBack = () => {
    navigate(-1)
  }

  // If not logged in and trying to view own profile, show login prompt
  if (!user && !userId) {
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

  // Loading state for other user's profile
  if (!isOwnProfile && loadingProfile) {
    return (
      <div className="min-h-[70vh] flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[var(--color-text-tertiary)]" />
      </div>
    )
  }

  // Not found state for other user's profile
  if (!isOwnProfile && !profile) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center">
        <p className="text-[var(--color-text-tertiary)] mb-4">User not found</p>
        <Button onClick={handleBack}>Go Back</Button>
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

  const handleBackgroundSelect = async (backgroundId: string) => {
    try {
      setSaving(true)

      // Call edge function to update background
      const { error } = await updateUserInfo(undefined, undefined, backgroundId)

      if (error) throw error

      // Refresh profile data
      await refreshProfile()

      toast.success('Background updated successfully')
    } catch (err) {
      console.error('Error saving background:', err)
      toast.error('Failed to save background. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  const formatDate = (dateString: string) => {
    const date = new Date(dateString)
    const day = date.getDate().toString().padStart(2, '0')
    const month = (date.getMonth() + 1).toString().padStart(2, '0')
    const year = date.getFullYear()
    return `${day}/${month}/${year}`
  }

  return (
    <div className="min-h-[70vh] animate-in fade-in duration-500">
      <div className="max-w-2xl mx-auto">
        {/* Back Button for other user's profile */}
        {!isOwnProfile && (
          <Button
            variant="ghost"
            onClick={handleBack}
            className="mb-4 text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card)]"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
        )}

        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
            {isOwnProfile ? 'My Profile' : profile?.full_name || 'User Profile'}
          </h1>
        </div>

        {/* Profile Card */}
        <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-5">
          <div className="flex items-start gap-4">
            {/* Avatar */}
            {isOwnProfile ? (
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
            ) : (
              <Avatar className="w-16 h-16 flex-shrink-0">
                <AvatarImage src={profile?.avatar_url || ''} alt="Profile" />
                <AvatarFallback className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
                  {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                </AvatarFallback>
              </Avatar>
            )}

            {/* Info */}
            <div className="flex-1 min-w-0">
              {/* Name */}
              <div className="mb-3">
                {isOwnProfile && (
                  <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1">
                    Display Name
                  </label>
                )}
                {isOwnProfile && isEditing ? (
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
                    {isOwnProfile && (
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        onClick={() => setIsEditing(true)}
                        className="p-1 rounded-md hover:bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-all opacity-0 group-hover/name:opacity-100"
                        title="Edit name"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </Button>
                    )}
                  </div>
                )}
              </div>

              {/* Email - Only show for own profile */}
              {isOwnProfile && (
                <div className="mb-3">
                  <label className="block text-xs font-medium text-[var(--color-text-tertiary)] mb-1">
                    Email
                  </label>
                  <p className="text-sm text-[var(--color-text-secondary)] truncate">{user?.email}</p>
                </div>
              )}

              {/* Voice Creator label for other user's profile */}
              {!isOwnProfile && (
                <p className="text-sm text-[var(--color-text-tertiary)] mb-3">Voice Creator</p>
              )}

              {/* Member Since */}
              <div className="text-xs text-[var(--color-text-muted)]">
                Member since {formatDate(profile?.created_at || new Date().toISOString())}
              </div>

              {/* Follow Button for other user's profile */}
              {!isOwnProfile && (
                <div className="mt-3">
                  {loadingFollowStatus ? (
                    <Button disabled size="sm">
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Loading...
                    </Button>
                  ) : isFollowing ? (
                    <Button
                      onClick={handleToggleFollow}
                      disabled={isToggling}
                      variant="outline"
                      size="sm"
                      className="bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]"
                    >
                      {isToggling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserCheck className="w-4 h-4" />
                      )}
                      Following
                    </Button>
                  ) : (
                    <Button
                      onClick={handleToggleFollow}
                      disabled={isToggling}
                      size="sm"
                      className="bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)]"
                    >
                      {isToggling ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <UserPlus className="w-4 h-4" />
                      )}
                      Follow
                    </Button>
                  )}
                </div>
              )}
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
            <div
              className="text-center cursor-pointer hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors p-2 -m-2"
              onClick={() => {
                setFollowersModalMode('followers')
                setShowFollowersModal(true)
              }}
            >
              <div className="text-xl font-bold text-[var(--color-text-primary)]">
                {loadingFollowStatus ? '-' : followersCount}
              </div>
              <div className="text-xs text-[var(--color-text-tertiary)]">Followers</div>
            </div>
            <div
              className="text-center cursor-pointer hover:bg-[var(--color-bg-elevated)] rounded-lg transition-colors p-2 -m-2"
              onClick={() => {
                setFollowersModalMode('following')
                setShowFollowersModal(true)
              }}
            >
              <div className="text-xl font-bold text-[var(--color-text-primary)]">
                {loadingFollowStatus ? '-' : followingCount}
              </div>
              <div className="text-xs text-[var(--color-text-tertiary)]">Following</div>
            </div>
          </div>

          {/* Background Selector - Only for own profile */}
          {isOwnProfile && (() => {
            const currentBackground = getBackgroundById(profile?.background_id || null);
            const hasBackground = currentBackground && currentBackground.imageUrl;

            return (
              <div className="pt-4 mt-4 border-t border-[var(--color-border)]">
                <div
                  className="relative rounded-lg overflow-hidden cursor-pointer group h-24"
                  onClick={() => setShowBackgroundPicker(true)}
                  style={hasBackground ? {
                    backgroundImage: `url(${currentBackground.imageUrl})`,
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                  } : {
                    backgroundColor: 'var(--color-bg-elevated)'
                  }}
                >
                  {/* Overlay for better text visibility */}
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-all" />

                  {/* Button content */}
                  <div className="relative h-full flex items-center justify-center gap-2 z-10">
                    <Image className={`w-5 h-5 ${hasBackground ? 'text-white' : 'text-[var(--color-text-primary)]'}`} />
                    <span className={`font-medium ${hasBackground ? 'text-white' : 'text-[var(--color-text-primary)]'}`}>
                      {hasBackground ? currentBackground.name : 'Choose Card Background'}
                    </span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>

        {/* Recordings Section */}
        <div className="mt-8">
          <div className="flex items-center gap-3 mb-4">
            <Mic className="w-5 h-5 text-[var(--color-accent-primary)]" />
            <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
              {isOwnProfile ? 'My Recordings' : 'Voice Recordings'}
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
                {isOwnProfile
                  ? 'Start recording to share your voice with the world!'
                  : "This user hasn't shared any recordings yet"}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recordings.map((recording) => (
                <CompactAudioCard
                  key={recording.id}
                  recording={recording}
                  onDelete={isOwnProfile ? handleDeleteRecording : undefined}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Avatar Picker Modal - Only for own profile */}
      {isOwnProfile && (
        <AvatarPicker
          isOpen={showAvatarPicker}
          onClose={() => setShowAvatarPicker(false)}
          onSelect={handleAvatarSelect}
          currentAvatar={avatarUrl}
          saving={saving}
        />
      )}

      {/* Followers/Following Modal */}
      {targetUserId && (
        <FollowersModal
          isOpen={showFollowersModal}
          onClose={() => setShowFollowersModal(false)}
          userId={targetUserId}
          mode={followersModalMode}
        />
      )}

      {/* Background Picker - Only for own profile */}
      {isOwnProfile && (
        <BackgroundPicker
          isOpen={showBackgroundPicker}
          onClose={() => setShowBackgroundPicker(false)}
          currentBackgroundId={profile?.background_id || null}
          onSelect={handleBackgroundSelect}
        />
      )}
    </div>
  )
}
