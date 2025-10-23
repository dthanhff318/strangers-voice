import { useState, useEffect } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { toggleFollow, getFollowStatus } from '../lib/edgeFunctions'
import { toast } from 'sonner'

/**
 * Custom hook for managing follow/unfollow functionality
 * @param userId - The user ID to follow/unfollow
 * @param enabled - Whether to enable the query (default: true)
 * @returns Follow state, counts, and toggle function
 */
export function useFollow(userId: string | undefined, enabled: boolean = true) {
  const queryClient = useQueryClient()
  const [isFollowing, setIsFollowing] = useState(false)
  const [isToggling, setIsToggling] = useState(false)

  // Fetch follow status and counts
  const {
    data: followStatus,
    isLoading,
    refetch
  } = useQuery({
    queryKey: ['follow-status', userId],
    queryFn: async () => {
      if (!userId) return null
      const { data, error } = await getFollowStatus(userId)
      if (error) throw error
      return data
    },
    enabled: enabled && !!userId,
    staleTime: 30000, // Consider data fresh for 30 seconds
  })

  // Sync local state with server data
  useEffect(() => {
    if (followStatus) {
      setIsFollowing(followStatus.isFollowing)
    }
  }, [followStatus])

  /**
   * Toggle follow/unfollow with optimistic updates
   */
  const handleToggleFollow = async () => {
    if (!userId || isToggling) return

    setIsToggling(true)
    const previousState = isFollowing

    // Optimistic update - update UI immediately
    setIsFollowing(!isFollowing)

    try {
      const { data, error } = await toggleFollow(
        userId,
        isFollowing ? 'unfollow' : 'follow'
      )

      if (error) throw error

      // Refetch to sync with server
      await refetch()

      // Invalidate all follow-related queries to update counts everywhere
      queryClient.invalidateQueries({ queryKey: ['follow-status'] })

      toast.success(data?.message || 'Success')
    } catch (err) {
      // Rollback optimistic update on error
      setIsFollowing(previousState)
      console.error('Error toggling follow:', err)
      toast.error('Failed to update follow status')
    } finally {
      setIsToggling(false)
    }
  }

  return {
    isFollowing,
    isLoading,
    isToggling,
    followersCount: followStatus?.followersCount || 0,
    followingCount: followStatus?.followingCount || 0,
    handleToggleFollow,
    refetch
  }
}
