import { useEffect, useState } from "react";
import { X, Mic, Loader2, UserPlus, UserCheck } from "lucide-react";
import { supabase } from "../lib/supabase";
import { Button } from "@/components/ui/button";

interface UserProfile {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
}

interface UserProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile;
}

export function UserProfileModal({
  isOpen,
  onClose,
  userProfile,
}: UserProfileModalProps) {
  const [recordingsCount, setRecordingsCount] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [isFollowing, setIsFollowing] = useState(false); // TODO: Get from backend

  useEffect(() => {
    if (isOpen && userProfile.id) {
      fetchRecordingsCount();
    }
  }, [isOpen, userProfile.id]);

  const fetchRecordingsCount = async () => {
    try {
      setLoading(true);
      const { count, error } = await supabase
        .from("recordings")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userProfile.id);

      if (error) throw error;
      setRecordingsCount(count || 0);
    } catch (err) {
      console.error("Error fetching recordings count:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleBackdropClick = () => {
    onClose();
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 animate-in fade-in duration-200"
        onClick={handleBackdropClick}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] shadow-2xl max-w-sm w-full pointer-events-auto animate-in zoom-in-95 fade-in duration-200 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cover Background with Gradient */}
          <div className="relative h-28 bg-gradient-to-br from-[var(--color-bg-elevated)] via-[var(--color-bg-card-hover)] to-[var(--color-bg-elevated)]">
            {/* Close Button */}
            <Button
              variant="ghost"
              size="icon"
              onClick={(e) => {
                e.stopPropagation();
                onClose();
              }}
              className="absolute top-4 right-4 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 backdrop-blur-sm flex items-center justify-center transition-all z-10"
            >
              <X className="w-4 h-4 text-white" />
            </Button>

            {/* Subtle Pattern Overlay */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.03),transparent_50%)]" />
          </div>

          {/* Content */}
          <div className="px-6 pb-6">
            {/* Avatar - Overlapping Cover */}
            <div className="flex justify-center -mt-12 mb-4">
              <div className="relative">
                <img
                  src={userProfile.avatar_url || ""}
                  alt={userProfile.full_name || ""}
                  className="w-24 h-24 rounded-full border-4 border-[var(--color-bg-card)] shadow-xl"
                />
                {/* Status Indicator */}
                <div className="absolute bottom-1 right-1 w-5 h-5 bg-[var(--color-active-indicator)] rounded-full border-2 border-[var(--color-bg-card)]" />
              </div>
            </div>

            {/* Name */}
            <div className="text-center mb-6">
              <h3 className="text-2xl font-bold text-[var(--color-text-primary)] mb-1">
                {userProfile.full_name || "Anonymous User"}
              </h3>
              <p className="text-sm text-[var(--color-text-tertiary)] mb-4">
                Voice Creator
              </p>

              {/* Follow Button */}
              <div className="flex gap-2 justify-center">
                {isFollowing ? (
                  <Button
                    onClick={() => setIsFollowing(false)} // TODO: Add unfollow logic
                    variant="outline"
                    className="bg-[var(--color-bg-card)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)] hover:text-[var(--color-text-primary)]"
                  >
                    <UserCheck className="w-4 h-4" />
                    Following
                  </Button>
                ) : (
                  <Button
                    onClick={() => setIsFollowing(true)} // TODO: Add follow logic
                    className="bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)]"
                  >
                    <UserPlus className="w-4 h-4" />
                    Follow
                  </Button>
                )}
              </div>
            </div>

            {/* Stats Card */}
            <div className="bg-[var(--color-bg-primary)] rounded-xl border border-[var(--color-border)] relative overflow-hidden">
              {/* Subtle gradient accent */}
              <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/10 to-transparent" />

              <div className="text-center py-6">
                {/* Icon */}
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-[var(--color-bg-card)] mb-3">
                  <Mic className="w-6 h-6 text-[var(--color-accent-primary)]" />
                </div>

                {/* Count */}
                <div className="mb-1">
                  {loading ? (
                    <Loader2 className="w-6 h-6 mx-auto animate-spin text-[var(--color-text-tertiary)]" />
                  ) : (
                    <div className="text-4xl font-bold text-[var(--color-text-primary)] leading-none">
                      {recordingsCount}
                    </div>
                  )}
                </div>

                {/* Label */}
                <div className="text-sm text-[var(--color-text-tertiary)]">
                  Voice Recordings
                </div>
              </div>
            </div>

            {/* Additional Info */}
            <div className="mt-4 text-center">
              <p className="text-xs text-[var(--color-text-muted)]">
                Member of Stranger Voice Community
              </p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
