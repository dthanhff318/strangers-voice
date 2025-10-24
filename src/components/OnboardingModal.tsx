import { useState } from "react";
import type { User } from "@supabase/supabase-js";
import { updateUserInfo } from "../lib/edgeFunctions";
import { AvatarPicker } from "./AvatarPicker";
import { Loader2 } from "lucide-react";
import { Button } from "./ui/button";

interface OnboardingModalProps {
  user: User;
  onComplete: () => void;
}

export function OnboardingModal({ user, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState<"avatar" | "name">("avatar");
  const [name, setName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState(
    user.user_metadata?.avatar_url ||
      `https://api.dicebear.com/9.x/micah/svg?seed=${user.id}`
  );
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAvatarSelect = (newAvatarUrl: string) => {
    setAvatarUrl(newAvatarUrl);
    setShowAvatarPicker(false);
  };

  const handleContinueToName = () => {
    setStep("name");
  };

  const handleComplete = async () => {
    if (!name.trim()) {
      setError("Please enter your name");
      return;
    }

    try {
      setSaving(true);
      setError(null);

      // Call edge function to update user info
      const { error } = await updateUserInfo(name.trim(), avatarUrl);

      if (error) throw error;

      // Success!
      onComplete();
    } catch (err) {
      console.error("Error saving profile:", err);
      setError("Failed to save your profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-[var(--color-bg-primary)]/95 backdrop-blur-md" />

      {/* Modal */}
      <div className="relative bg-[var(--color-bg-card)] rounded-3xl border border-[var(--color-border)] shadow-2xl w-full max-w-md overflow-hidden animate-in zoom-in-95 duration-300">
        <div className="relative bg-gradient-to-r from-[var(--color-bg-elevated)] via-[var(--color-bg-card-hover)] to-[var(--color-bg-elevated)] p-8 text-center">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-[var(--color-btn-primary)] mb-4">
            <img src="/favicon.png" className="w-10 h-10 logo-invert" alt="YMelody" />
          </div>
          <h2 className="text-3xl font-bold text-[var(--color-text-primary)] mb-2">
            Welcome to YMelody!
          </h2>
          <p className="text-[var(--color-text-tertiary)]">
            Share your voice, connect with the world
          </p>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-[var(--color-bg-card-hover)] border border-[var(--color-border)] text-[var(--color-text-primary)] rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Step 1: Avatar Selection */}
          {step === "avatar" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                  Choose Your Avatar
                </h3>
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  Pick an avatar that represents you
                </p>
              </div>

              {/* Avatar Preview */}
              <div className="flex justify-center">
                <Button
                  variant="ghost"
                  onClick={() => setShowAvatarPicker(true)}
                  className="relative group h-auto p-0 hover:bg-transparent"
                >
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-[var(--color-border)] hover:border-[var(--color-btn-primary)] transition-all group-hover:scale-105">
                    <img
                      src={avatarUrl}
                      alt="Your avatar"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-[var(--color-text-primary)] text-sm font-medium">
                      Change
                    </span>
                  </div>
                </Button>
              </div>

              {/* Continue Button */}
              <Button
                onClick={handleContinueToName}
                className="w-full bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)] font-semibold py-4 rounded-xl transition-all hover:scale-105 shadow-lg shadow-[var(--shadow-primary)]"
              >
                Continue
              </Button>
            </div>
          )}

          {/* Step 2: Name Input */}
          {step === "name" && (
            <div className="space-y-6 animate-in fade-in slide-in-from-right-4 duration-300">
              <div className="text-center">
                <h3 className="text-xl font-bold text-[var(--color-text-primary)] mb-2">
                  What's your name?
                </h3>
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  This is how others will see you
                </p>
              </div>

              {/* Avatar Preview (smaller) */}
              <div className="flex justify-center">
                <div className="w-20 h-20 rounded-full overflow-hidden border-2 border-[var(--color-border)]">
                  <img
                    src={avatarUrl}
                    alt="Your avatar"
                    className="w-full h-full object-cover"
                  />
                </div>
              </div>

              {/* Name Input */}
              <div>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Enter your display name"
                  className="w-full px-4 py-4 bg-[var(--color-bg-input)] border-2 border-[var(--color-border-light)] rounded-xl text-[var(--color-text-primary)] placeholder-[var(--color-text-muted)] focus:outline-none focus:border-[var(--color-border-focus)] transition-colors text-center text-lg font-medium"
                  autoFocus
                  maxLength={50}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && name.trim()) {
                      handleComplete();
                    }
                  }}
                />
                {name.trim() && (
                  <p className="mt-2 text-xs text-[var(--color-text-tertiary)] text-center">
                    Press Enter or click below to continue
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-3">
                <Button
                  variant="secondary"
                  onClick={() => setStep("avatar")}
                  disabled={saving}
                  className="flex-1 bg-[var(--color-btn-secondary)] hover:bg-[var(--color-btn-secondary-hover)] text-[var(--color-btn-secondary-text)] font-semibold py-4 rounded-xl transition-all disabled:opacity-50"
                >
                  Back
                </Button>
                <Button
                  onClick={handleComplete}
                  disabled={!name.trim() || saving}
                  className="flex-2 bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)] font-semibold py-4 px-8 rounded-xl transition-all hover:scale-105 disabled:opacity-50 disabled:hover:scale-100 shadow-lg shadow-[var(--shadow-primary)] flex items-center justify-center gap-2"
                >
                  {saving ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <span>Creating...</span>
                    </>
                  ) : (
                    <span>Get Started</span>
                  )}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Progress Indicator */}
        <div className="px-8 pb-6">
          <div className="flex gap-2 justify-center">
            <div
              className={`h-2 rounded-full transition-all ${
                step === "avatar"
                  ? "w-8 bg-[var(--color-btn-primary)]"
                  : "w-2 bg-[var(--color-border)]"
              }`}
            />
            <div
              className={`h-2 rounded-full transition-all ${
                step === "name"
                  ? "w-8 bg-[var(--color-btn-primary)]"
                  : "w-2 bg-[var(--color-border)]"
              }`}
            />
          </div>
        </div>
      </div>

      {/* Avatar Picker Modal */}
      <AvatarPicker
        isOpen={showAvatarPicker}
        onClose={() => setShowAvatarPicker(false)}
        onSelect={handleAvatarSelect}
        currentAvatar={avatarUrl}
      />
    </div>
  );
}
