import { useNavigate } from 'react-router-dom'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Users, Loader2, UserPlus, UserCheck } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useFollow } from '../hooks/useFollow'
import { getFollowers, getFollowing } from '../lib/edgeFunctions'
import { Button } from './ui/button'
import { Avatar, AvatarImage, AvatarFallback } from './ui/avatar'
import { PlanBadge } from './PlanBadge'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'

interface UserProfile {
  id: string
  full_name: string | null
  avatar_url: string | null
  plan?: {
    badge_color: string
  } | null
}

interface FollowersModalProps {
  isOpen: boolean
  onClose: () => void
  userId: string
  mode: 'followers' | 'following'
}

export function FollowersModal({
  isOpen,
  onClose,
  userId,
  mode,
}: FollowersModalProps) {
  const navigate = useNavigate()
  const { user } = useAuth()

  // Fetch followers/following using React Query with edge functions
  const { data: users = [], isLoading: loading } = useQuery<UserProfile[]>({
    queryKey: ['user-follows', userId, mode],
    queryFn: async () => {
      if (mode === 'followers') {
        const { data, error } = await getFollowers(userId)
        if (error) throw error
        return (data?.data || []) as UserProfile[]
      } else {
        const { data, error } = await getFollowing(userId)
        if (error) throw error
        return (data?.data || []) as UserProfile[]
      }
    },
    enabled: isOpen && !!userId,
    staleTime: 30000, // Consider data fresh for 30 seconds
  })

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[80vh] flex flex-col p-0 bg-[var(--color-bg-card)] border-[var(--color-border)]">
        {/* Header */}
        <DialogHeader className="p-6 pb-4 border-b border-[var(--color-border)]">
          <div className="flex items-center gap-3">
            <Users className="w-5 h-5 text-[var(--color-accent-primary)]" />
            <DialogTitle className="text-xl font-bold text-[var(--color-text-primary)]">
              {mode === 'followers' ? 'Followers' : 'Following'}
            </DialogTitle>
          </div>
        </DialogHeader>

        {/* Content */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 animate-spin text-[var(--color-text-tertiary)]" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <div className="w-16 h-16 mx-auto mb-4 bg-[var(--color-bg-elevated)] rounded-full flex items-center justify-center">
                <Users className="w-8 h-8 text-[var(--color-text-tertiary)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-secondary)] mb-2">
                No {mode} yet
              </h3>
              <p className="text-sm text-[var(--color-text-tertiary)]">
                {mode === 'followers'
                  ? 'When people follow this user, they will appear here'
                  : 'This user is not following anyone yet'}
              </p>
            </div>
          ) : (
            <div className="space-y-3 pt-4">
              {users.map((userProfile) => (
                <UserItem
                  key={userProfile.id}
                  userProfile={userProfile}
                  currentUserId={user?.id}
                  onNavigate={(id) => {
                    navigate(`/profile/${id}`)
                    onClose()
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}

interface UserItemProps {
  userProfile: UserProfile
  currentUserId: string | undefined
  onNavigate: (userId: string) => void
}

function UserItem({ userProfile, currentUserId, onNavigate }: UserItemProps) {
  const queryClient = useQueryClient()
  const isOwnProfile = currentUserId === userProfile.id
  const {
    isFollowing,
    isLoading: loadingFollowStatus,
    isToggling,
    handleToggleFollow,
  } = useFollow(userProfile.id, !isOwnProfile)

  const handleFollow = async () => {
    await handleToggleFollow()
    // Invalidate the follows lists to refresh after follow/unfollow
    queryClient.invalidateQueries({ queryKey: ['user-follows'] })
  }

  return (
    <div className="flex items-center gap-3 p-3 rounded-xl bg-[var(--color-bg-primary)] border border-[var(--color-border)] hover:bg-[var(--color-bg-elevated)] transition-colors">
      {/* Avatar */}
      <div
        className="cursor-pointer"
        onClick={() => onNavigate(userProfile.id)}
      >
        <Avatar className="w-12 h-12">
          <AvatarImage
            src={
              userProfile.avatar_url ||
              `https://api.dicebear.com/9.x/micah/svg?seed=${userProfile.id}`
            }
            alt={userProfile.full_name || 'User'}
          />
          <AvatarFallback className="bg-[var(--color-bg-card)] text-[var(--color-text-primary)]">
            {userProfile.full_name?.charAt(0)?.toUpperCase() || 'U'}
          </AvatarFallback>
        </Avatar>
      </div>

      {/* Info */}
      <div
        className="flex-1 min-w-0 cursor-pointer"
        onClick={() => onNavigate(userProfile.id)}
      >
        <div className="flex items-center gap-1">
          <h3 className="font-semibold text-[var(--color-text-primary)] truncate">
            {userProfile.full_name || 'Anonymous User'}
          </h3>
          <PlanBadge plan={userProfile.plan} size={16} />
        </div>
        <p className="text-sm text-[var(--color-text-tertiary)]">
          Voice Creator
        </p>
      </div>

      {/* Follow Button - Only show for other users */}
      {!isOwnProfile && (
        <div>
          {loadingFollowStatus ? (
            <Button disabled size="sm" variant="ghost">
              <Loader2 className="w-4 h-4 animate-spin" />
            </Button>
          ) : isFollowing ? (
            <Button
              onClick={handleFollow}
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
              onClick={handleFollow}
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
  )
}
