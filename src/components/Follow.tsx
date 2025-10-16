import { useState, useEffect, useRef } from "react";
import { supabase } from "../lib/supabase";
import { Search, Users, Loader2, Mic } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { UserProfileModal } from "./UserProfileModal";
import { debounce } from "lodash";

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  email: string | null;
}

export function Follow() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [recordingsCounts, setRecordingsCounts] = useState<
    Record<string, number>
  >({});
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserProfile, setShowUserProfile] = useState(false);

  const searchUsers = async (query: string) => {
    if (!query.trim()) {
      setUsers([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("profiles")
        .select("id, full_name, avatar_url, email")
        .ilike("full_name", `%${query}%`)
        .limit(20);

      if (error) throw error;

      const filteredUsers = (data || []).filter((u) => u.id !== user?.id);
      setUsers(filteredUsers);

      // Fetch recordings count for each user
      fetchRecordingsCounts(filteredUsers.map((u) => u.id));
    } catch (err) {
      console.error("Error searching users:", err);
    } finally {
      setLoading(false);
    }
  };

  // Create debounced search function
  const debouncedSearch = useRef(
    debounce((query: string) => {
      searchUsers(query);
    }, 800)
  ).current;

  useEffect(() => {
    setLoading(true);
    debouncedSearch(searchQuery);

    // Cleanup function
    return () => {
      debouncedSearch.cancel();
    };
  }, [searchQuery, debouncedSearch]);

  const fetchRecordingsCounts = async (userIds: string[]) => {
    try {
      // Fetch all counts in parallel
      const countPromises = userIds.map((userId) =>
        supabase
          .from("recordings")
          .select("*", { count: "exact", head: true })
          .eq("user_id", userId)
          .then(({ count, error }) => ({
            userId,
            count: error ? 0 : count || 0,
          }))
      );

      const results = await Promise.all(countPromises);

      // Convert array to object
      const counts: Record<string, number> = {};
      results.forEach(({ userId, count }) => {
        counts[userId] = count;
      });

      setRecordingsCounts(counts);
    } catch (err) {
      console.error("Error fetching recordings counts:", err);
    }
  };

  return (
    <div className="min-h-[70vh] animate-in fade-in duration-500">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-1 h-8 bg-[var(--color-accent-primary)] rounded-full" />
          <h1 className="text-4xl font-bold text-[var(--color-text-primary)]">
            Discover Voices
          </h1>
        </div>
        <p className="text-[var(--color-text-tertiary)] text-lg ml-4">
          Find and connect with voice creators
        </p>
      </div>

      {/* Search Bar */}
      <div className="mb-6">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)]" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search users by name..."
            className="w-full pl-12 pr-4 py-4 bg-[var(--color-bg-card)] border border-[var(--color-border)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors"
          />
          {loading && (
            <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 w-5 h-5 text-[var(--color-text-tertiary)] animate-spin" />
          )}
        </div>
      </div>

      {/* Results */}
      {searchQuery.trim() === "" ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 bg-[var(--color-bg-card)] rounded-full flex items-center justify-center">
            <Search className="w-10 h-10 text-[var(--color-text-tertiary)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--color-text-secondary)] mb-2">
            Start searching
          </h3>
          <p className="text-[var(--color-text-tertiary)]">
            Type a name to find voice creators
          </p>
        </div>
      ) : users.length === 0 && !loading ? (
        <div className="text-center py-20">
          <div className="w-20 h-20 mx-auto mb-6 bg-[var(--color-bg-card)] rounded-full flex items-center justify-center">
            <Users className="w-10 h-10 text-[var(--color-text-tertiary)]" />
          </div>
          <h3 className="text-xl font-semibold text-[var(--color-text-secondary)] mb-2">
            No users found
          </h3>
          <p className="text-[var(--color-text-tertiary)]">
            Try searching with a different name
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {users.map((userProfile) => (
            <div
              key={userProfile.id}
              onClick={() => {
                setSelectedUser(userProfile);
                setShowUserProfile(true);
              }}
              className="bg-[var(--color-bg-card)] rounded-xl p-5 border border-[var(--color-border)] hover:bg-[var(--color-bg-card-hover)] transition-all hover:border-[var(--color-border-light)] hover:scale-[1.02] active:scale-[0.98]"
            >
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <img
                  src={
                    userProfile.avatar_url ||
                    `https://api.dicebear.com/9.x/micah/svg?seed=${userProfile.id}`
                  }
                  alt={userProfile.full_name || "User"}
                  className="w-16 h-16 rounded-full flex-shrink-0 border-2 border-[var(--color-border)]"
                />

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold text-[var(--color-text-primary)] text-lg truncate mb-1">
                    {userProfile.full_name || "Anonymous User"}
                  </h3>
                  <div className="flex items-center gap-1.5 text-sm text-[var(--color-text-tertiary)]">
                    <Mic className="w-3.5 h-3.5" />
                    <span>
                      {recordingsCounts[userProfile.id] !== undefined
                        ? `${recordingsCounts[userProfile.id]} recordings`
                        : "Loading..."}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* User Profile Modal */}
      {selectedUser && (
        <UserProfileModal
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          userProfile={selectedUser}
        />
      )}
    </div>
  );
}
