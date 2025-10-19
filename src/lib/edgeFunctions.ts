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
 * @param fullName - User's full name
 * @param avatarUrl - User's avatar URL
 */
export async function updateUserInfo(fullName: string, avatarUrl: string) {
  return callEdgeFunction("update-user-info", { fullName, avatarUrl });
}
