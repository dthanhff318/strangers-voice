import { useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../lib/supabase";
import { getTrendingRecordsDashboard } from "../lib/edgeFunctions";
import { AudioCard } from "./AudioCard";
import { TrendingUp } from "lucide-react";

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
  } | null;
}

interface FeedProps {
  onLoginRequired?: () => void;
}

export function Feed({ onLoginRequired }: FeedProps = {}) {
  const queryClient = useQueryClient();

  // Use React Query for data fetching with caching
  const {
    data: recordings = [],
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

  return (
    <div className="space-y-8">
      {/* Header with gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-[var(--color-accent-subtle)] blur-3xl -z-10" />
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <TrendingUp className="w-8 h-8 text-[var(--color-accent-primary)]" />
            <h1 className="text-4xl font-bold text-[var(--color-text-primary)]">
              Trending voices
            </h1>
          </div>
        </div>
      </div>

      {/* Recordings List */}
      {recordings.length === 0 ? (
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
        <div className="space-y-4">
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
