/* eslint-disable @typescript-eslint/no-explicit-any */
import { supabase } from "./supabase";

/**
 * Call a Supabase Edge Function
 * @param functionName - Name of the edge function
 * @param body - Request body (optional)
 * @returns Response data from the edge function
 */
export async function callEdgeFunction<T = any>(
  functionName: string,
  body?: any
): Promise<{ data: T | null; error: Error | null }> {
  try {
    const { data, error } = await supabase.functions.invoke(functionName, {
      body: body || {},
    });

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error(`Error calling edge function ${functionName}:`, error);
    return { data: null, error: error as Error };
  }
}

/**
 * Get all recordings with user profiles
 */
export async function getRecordings() {
  return callEdgeFunction("get-recordings");
}

/**
 * Get current user's recordings
 */
export async function getMyRecordings() {
  return callEdgeFunction("get-my-recordings");
}

/**
 * Get top 10 trending recordings (most likes)
 */
export async function getTrendingRecordsDashboard() {
  return callEdgeFunction("get-trending-records-dashboard");
}

/**
 * Delete a recording by ID
 * @param recordingId - The ID of the recording to delete
 */
export async function deleteRecord(recordingId: string) {
  return callEdgeFunction("delete-record", { recordingId });
}

/**
 * Update user profile information
 * @param fullName - User's full name (optional)
 * @param avatarUrl - User's avatar URL (optional)
 * @param backgroundId - User's selected background ID (optional)
 */
export async function updateUserInfo(
  fullName?: string,
  avatarUrl?: string,
  backgroundId?: string
) {
  const body: any = {};
  if (fullName !== undefined) body.fullName = fullName;
  if (avatarUrl !== undefined) body.avatarUrl = avatarUrl;
  if (backgroundId !== undefined) body.backgroundId = backgroundId;

  return callEdgeFunction("update-user-info", body);
}

/**
 * Update report status
 * @param reportId - The ID of the report to update
 * @param status - The new status (pending, reviewed, resolved, dismissed)
 */
export async function updateReportStatus(reportId: string, status: string) {
  return callEdgeFunction("update-report-status", { reportId, status });
}

/**
 * Toggle follow/unfollow a user
 * @param userId - The ID of the user to follow/unfollow
 * @param action - Optional: "follow" or "unfollow". If not provided, it will toggle.
 */
export async function toggleFollow(userId: string, action?: "follow" | "unfollow") {
  return callEdgeFunction<{ success: boolean; message: string; isFollowing: boolean }>(
    "toggle-follow",
    { userId, action }
  );
}

/**
 * Get follow status and counts for a user
 * @param userId - The ID of the user to check
 * @returns Follow status, followers count, and following count
 */
export async function getFollowStatus(userId: string) {
  return callEdgeFunction<{
    isFollowing: boolean;
    followersCount: number;
    followingCount: number;
  }>("get-follow-status", { userId });
}

/**
 * Get list of followers for a user
 * @param userId - The ID of the user to get followers for
 * @returns List of user profiles who follow this user
 */
export async function getFollowers(userId: string) {
  return callEdgeFunction<{
    data: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      plan?: {
        badge_color: string;
      } | null;
    }[];
  }>("get-followers", { userId });
}

/**
 * Get list of users that a user is following
 * @param userId - The ID of the user to get following list for
 * @returns List of user profiles that this user follows
 */
export async function getFollowing(userId: string) {
  return callEdgeFunction<{
    data: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      plan?: {
        badge_color: string;
      } | null;
    }[];
  }>("get-following", { userId });
}

/**
 * Get random recommended users
 * @returns List of 5 random user profiles (excluding current user)
 */
export async function getRecommendedUsers() {
  return callEdgeFunction<{
    data: {
      id: string;
      full_name: string | null;
      avatar_url: string | null;
      email: string | null;
      plan?: {
        badge_color: string;
      } | null;
    }[];
  }>("get-recommended-users");
}

/**
 * End a live room (host only)
 * @param roomId - The ID of the live room to end
 * @returns Success status
 */
export async function endLiveRoom(roomId: string) {
  return callEdgeFunction<{
    success: boolean;
    message: string;
  }>("end-live-room", { roomId });
}

/**
 * Get a single live room by ID with host profile
 * @param roomId - The ID of the live room to fetch
 * @returns Live room data with host information
 */
export async function getLiveRoom(roomId: string) {
  return callEdgeFunction<{
    data: {
      id: string;
      title: string;
      description: string | null;
      host_id: string;
      is_active: boolean;
      listeners_count: number;
      created_at: string;
      ended_at: string | null;
      host: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
      };
    };
  }>("get-live-room", { roomId });
}

/**
 * Get all active live rooms with host profiles
 * @returns List of active live rooms
 */
export async function getLiveRooms() {
  return callEdgeFunction<{
    data: {
      id: string;
      title: string;
      description: string | null;
      host_id: string;
      is_active: boolean;
      listeners_count: number;
      created_at: string;
      ended_at: string | null;
      host: {
        id: string;
        full_name: string | null;
        avatar_url: string | null;
      };
    }[];
  }>("get-live-rooms");
}

/**
 * Create a new live room
 * @param title - Title of the live room
 * @param description - Optional description
 * @returns Created live room data
 */
export async function createLiveRoom(title: string, description?: string) {
  return callEdgeFunction<{
    data: {
      id: string;
      title: string;
      description: string | null;
      host_id: string;
      is_active: boolean;
      listeners_count: number;
      created_at: string;
      ended_at: string | null;
    };
  }>("create-live-room", { title, description });
}

/**
 * Check if current user has an active live room
 * @returns Active room data if exists, null otherwise
 */
export async function getUserActiveRoom() {
  try {
    const { data, error } = await supabase
      .from("live_rooms")
      .select("id, title, created_at")
      .eq("is_active", true)
      .maybeSingle();

    if (error) throw error;

    return { data, error: null };
  } catch (error) {
    console.error("Error checking user active room:", error);
    return { data: null, error: error as Error };
  }
}

/**
 * Update a plan (admin only)
 * @param planId - The ID of the plan to update
 * @param displayName - Plan's display name (optional)
 * @param description - Plan's description (optional)
 * @param price - Plan's price (optional)
 * @param features - Plan's features array (optional)
 * @param badgeColor - Plan's badge color (optional)
 */
export async function updatePlan(
  planId: string,
  displayName?: string,
  description?: string,
  price?: number,
  features?: string[],
  badgeColor?: string
) {
  const body: any = { planId };
  if (displayName !== undefined) body.displayName = displayName;
  if (description !== undefined) body.description = description;
  if (price !== undefined) body.price = price;
  if (features !== undefined) body.features = features;
  if (badgeColor !== undefined) body.badgeColor = badgeColor;

  return callEdgeFunction("update-plan", body);
}

/**
 * Create Stripe checkout session for plan subscription
 * @param planId - The ID of the plan to subscribe to
 * @returns Stripe checkout session URL
 */
export async function subscriptionPlan(planId: string) {
  return callEdgeFunction<{
    sessionId: string;
    url: string;
  }>("subscription-plan", { planId });
}
