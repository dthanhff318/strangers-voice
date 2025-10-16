import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { AudioCard } from "./AudioCard";
import { AudioLoading } from "./AudioLoading";
import { Sparkles } from "lucide-react";

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
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchRecordings();

    // Subscribe to realtime changes
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
          fetchRecordings();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      setError(null);

      const { data, error: fetchError } = await supabase
        .from("recordings")
        .select(
          `
          *,
          profiles!user_id(
            id,
            full_name,
            avatar_url
          )
        `
        )
        .order("created_at", { ascending: false });

      if (fetchError) throw fetchError;

      setRecordings(data || []);
    } catch (err) {
      console.error("Error fetching recordings:", err);
      setError("Failed to load recordings");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <AudioLoading />;
  }

  if (error) {
    return (
      <div className="bg-[var(--color-bg-card)] border border-[var(--color-border)] text-[var(--color-text-primary)] px-4 py-3 rounded-lg">
        {error}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header with gradient */}
      <div className="relative">
        <div className="absolute inset-0 bg-[var(--color-accent-subtle)] blur-3xl -z-10" />
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-1 h-8 bg-[var(--color-accent-primary)] rounded-full" />
            <h1 className="text-4xl font-bold text-[var(--color-text-primary)]">
              Popular voices
            </h1>
          </div>
          <p className="text-[var(--color-text-tertiary)] text-lg ml-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[var(--color-accent-primary)]" />
            Curated audio experiences just for you
          </p>
        </div>
      </div>

      {/* Recordings List */}
      {recordings.length === 0 ? (
        <div className="text-center py-12">
          <span className="text-6xl mb-4 block">🎙️</span>
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
            />
          ))}
        </div>
      )}
    </div>
  );
}
