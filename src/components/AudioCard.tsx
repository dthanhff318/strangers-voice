import { useState } from "react";
import { useAudioPlayer } from "../contexts/AudioPlayerContext";
import { Avatar, AvatarImage, AvatarFallback } from "./ui/avatar";
import { UserProfileModal } from "./UserProfileModal";

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

  return (
    <>
      <div
        className="bg-[var(--color-bg-card)] rounded-2xl p-4 hover:bg-[var(--color-bg-card-hover)] transition-all border border-[var(--color-border)] cursor-pointer"
        onClick={handleCardClick}
      >
        {/* Header: Avatar, Name, Title, Duration */}
        <div className="flex items-center gap-3 md:gap-4">
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
            <h3 className="font-semibold text-[var(--color-text-primary)] text-lg mb-1 truncate">
              {recording.title || "Untitled"}
            </h3>
            <p className="text-[var(--color-text-tertiary)] text-sm truncate">
              {recording.profiles?.full_name || "Unknown"}
            </p>
          </div>

          {/* Duration */}
          <div className="text-[var(--color-text-tertiary)] text-sm font-medium flex-shrink-0">
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
          }}
        />
      )}
    </>
  );
}
