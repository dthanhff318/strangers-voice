import { createContext, useContext, useState, useRef } from "react";
import type { ReactNode } from "react";
import WaveSurfer from "wavesurfer.js";

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

interface AudioPlayerContextType {
  currentRecording: Recording | null;
  isPlaying: boolean;
  isMiniMode: boolean;
  isModalOpen: boolean;
  playbackPosition: number;
  wavesurferRef: React.MutableRefObject<WaveSurfer | null>;
  setCurrentRecording: (recording: Recording | null) => void;
  setIsPlaying: (playing: boolean) => void;
  setIsMiniMode: (mini: boolean) => void;
  setPlaybackPosition: (position: number) => void;
  openInModal: (recording: Recording) => void;
  minimize: () => void;
  close: () => void;
}

const AudioPlayerContext = createContext<AudioPlayerContextType | undefined>(undefined);

export function AudioPlayerProvider({ children }: { children: ReactNode }) {
  const [currentRecording, setCurrentRecording] = useState<Recording | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMiniMode, setIsMiniMode] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [playbackPosition, setPlaybackPosition] = useState(0);
  const wavesurferRef = useRef<WaveSurfer | null>(null);

  const openInModal = (recording: Recording) => {
    setCurrentRecording(recording);
    setIsMiniMode(false);
    setIsModalOpen(true);
  };

  const minimize = () => {
    if (currentRecording && wavesurferRef.current) {
      // Save current playback position
      const currentTime = wavesurferRef.current.getCurrentTime();
      setPlaybackPosition(currentTime);
      setIsMiniMode(true);
    }
  };

  const close = () => {
    if (wavesurferRef.current) {
      wavesurferRef.current.stop();
    }
    setCurrentRecording(null);
    setIsMiniMode(false);
    setIsModalOpen(false);
    setIsPlaying(false);
    setPlaybackPosition(0);
  };

  return (
    <AudioPlayerContext.Provider
      value={{
        currentRecording,
        isPlaying,
        isMiniMode,
        isModalOpen,
        playbackPosition,
        wavesurferRef,
        setCurrentRecording,
        setIsPlaying,
        setIsMiniMode,
        setPlaybackPosition,
        openInModal,
        minimize,
        close,
      }}
    >
      {children}
    </AudioPlayerContext.Provider>
  );
}

export function useAudioPlayer() {
  const context = useContext(AudioPlayerContext);
  if (context === undefined) {
    throw new Error("useAudioPlayer must be used within an AudioPlayerProvider");
  }
  return context;
}
