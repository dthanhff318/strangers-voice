import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { getTrendingRecordsDashboard } from "../lib/edgeFunctions";
import { AudioCard } from "./AudioCard";
import { Loading } from "./Loading";
import { Sparkles } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { useLoginRequired } from "../App";
import { getTimeBasedGreeting } from "../utils/greetings";

interface Recording {
  id: string;
  created_at: string;
  file_url: string;
  duration: number;
  likes_count: number;
  dislikes_count: number;
  user_id: string | null;
  title: string | null;
  description: string | null;
  profiles?: {
    id: string;
    full_name: string | null;
    avatar_url: string | null;
    background_id: string | null;
  } | null;
}

export function Feed() {
  const queryClient = useQueryClient();
  const { profile } = useAuth();
  const { onLoginRequired } = useLoginRequired();

  // Use React Query for data fetching with caching
  const {
    data: recordings = [],
    isLoading: isLoadingRecordings,
    error,
  } = useQuery<Recording[]>({
    queryKey: ["trending-recordings"],
    queryFn: async () => {
      const { data, error: fetchError } = await getTrendingRecordsDashboard();
      if (fetchError) throw fetchError;
      return (data?.data || []) as Recording[];
    },
  });

  // Subscribe to realtime changes and invalidate cache
  useEffect(() => {
    const channel = supabase
      .channel("recordings-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "recordings",
        },
        () => {
          // Invalidate and refetch the query when data changes
          queryClient.invalidateQueries({ queryKey: ["trending-recordings"] });
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [queryClient]);

  if (error) {
    return (
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] px-4 py-3 rounded-lg">
        {error instanceof Error ? error.message : "Failed to load recordings"}
      </div>
    );
  }

  // Refresh data on delete
  const handleDelete = () => {
    queryClient.invalidateQueries({ queryKey: ["trending-recordings"] });
  };

  const greeting = getTimeBasedGreeting();
  const displayName = profile?.full_name ? `, ${profile.full_name}` : "";

  return (
    <div className="space-y-8">
      {/* Header with gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-[var(--color-accent-subtle)] blur-3xl -z-10" />
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <Sparkles className="w-6 h-6 text-[var(--color-accent-primary)]" />
            <h1 className="text-2xl font-semibold text-[var(--color-text-primary)]">
              {greeting}
              {displayName}
            </h1>
          </div>
        </div>
      </div>

      {/* Loading State */}
      {isLoadingRecordings ? (
        <Loading variant="ring" size={48} label="Loading recordings..." className="py-12" />
      ) : recordings.length === 0 ? (
        /* Empty State */
        <div className="text-center py-12">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 bg-[var(--color-btn-primary)] rounded-xl flex items-center justify-center opacity-50">
              <img
                src="/favicon.png"
                alt="YMelody"
                className="w-10 h-10 logo-invert"
              />
            </div>
          </div>
          <h3 className="text-xl font-semibold text-[var(--color-text-secondary)] mb-2">
            No recordings yet
          </h3>
          <p className="text-[var(--color-text-tertiary)]">
            Be the first to record something!
          </p>
        </div>
      ) : (
        /* Recordings List */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {recordings.map((recording) => (
            <AudioCard
              key={recording.id}
              recording={recording}
              onLoginRequired={onLoginRequired}
              onDelete={handleDelete}
            />
          ))}
        </div>
      )}
    </div>
  );
}
