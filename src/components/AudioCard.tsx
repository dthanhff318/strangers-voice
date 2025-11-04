import { useState } from "react";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { UserProfileModal } from "./UserProfileModal";
import { getBackgroundById } from "../constants/backgrounds";
import { PlanBadge } from "./PlanBadge";

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
    plan?: {
      badge_color: string;
    } | null;
  } | null;
}

interface AudioCardProps {
  recording: Recording;
  onLoginRequired?: () => void;
  onDelete?: () => void;
}

export function AudioCard({ recording }: AudioCardProps) {
  const { openInModal } = useAudioPlayer();
  const [showUserProfile, setShowUserProfile] = useState(false);

  const handleCardClick = () => {
    openInModal(recording);
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // Get background image from user's profile
  const background = getBackgroundById(recording.profiles?.background_id || null);
  const hasBackground = background && background.imageUrl;

  return (
    <>
      <div
        className="relative bg-[var(--color-bg-card)] rounded-2xl p-4 hover:bg-[var(--color-bg-card-hover)] transition-all border border-[var(--color-border)] cursor-pointer overflow-hidden"
        onClick={handleCardClick}
        style={hasBackground ? {
          backgroundImage: `url(${background.imageUrl})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        } : undefined}
      >
        {/* Dark overlay for better text readability when background is present */}
        {hasBackground && (
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/60 to-black/40 rounded-2xl" />
        )}
        {/* Header: Avatar, Name, Title, Duration */}
        <div className="relative flex items-center gap-3 md:gap-4 z-10">
          {/* Avatar */}
          <Avatar
            className="w-12 h-12 md:w-16 md:h-16 flex-shrink-0 cursor-pointer hover:opacity-80 transition-opacity"
            onClick={(e) => {
              e.stopPropagation();
              setShowUserProfile(true);
            }}
          >
            <AvatarImage src={recording.profiles?.avatar_url || ""} alt={recording.profiles?.full_name || ""} />
            <AvatarFallback className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]">
              {recording.profiles?.full_name?.charAt(0)?.toUpperCase() || 'U'}
            </AvatarFallback>
          </Avatar>

          {/* Author & Title */}
          <div className="flex-1 min-w-0">
            <h3 className={`font-semibold text-lg mb-1 truncate ${hasBackground ? 'text-white' : 'text-[var(--color-text-primary)]'}`}>
              {recording.title || "Untitled"}
            </h3>
            <div className="flex items-center gap-1">
              <p className={`text-sm truncate ${hasBackground ? 'text-white/80' : 'text-[var(--color-text-tertiary)]'}`}>
                {recording.profiles?.full_name || "Unknown"}
              </p>
              <PlanBadge plan={recording.profiles?.plan} size={16} />
            </div>
          </div>

          {/* Duration */}
          <div className={`text-sm font-medium flex-shrink-0 ${hasBackground ? 'text-white/90' : 'text-[var(--color-text-tertiary)]'}`}>
            {formatDuration(recording.duration)}
          </div>
        </div>
      </div>

      {/* User Profile Modal */}
      {recording.profiles && (
        <UserProfileModal
          isOpen={showUserProfile}
          onClose={() => setShowUserProfile(false)}
          userProfile={{
            id: recording.profiles.id,
            full_name: recording.profiles.full_name,
            avatar_url: recording.profiles.avatar_url,
            plan: recording.profiles.plan,
          }}
        />
      )}
    </>
  );
}
