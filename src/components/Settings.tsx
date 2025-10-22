import { useState } from "react";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  Lock,
  Globe,
  Mail,
} from "lucide-react";
import { Switch } from "./ui/switch";
import { Button } from "./ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import { useTheme } from "../contexts/ThemeContext";
import { TermsOfServiceModal } from "./TermsOfServiceModal";
import { PrivacyPolicyModal } from "./PrivacyPolicyModal";

export function Settings() {
  const { theme, setTheme } = useTheme();
  const [language, setLanguage] = useState("en");
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  return (
    <div className="min-h-[70vh] animate-in fade-in duration-500">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
            Settings
          </h1>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {/* Appearance */}
          <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-5">
            <div className="flex items-center gap-3 mb-4">
              <Moon className="w-5 h-5 text-[var(--color-accent-primary)]" />
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Appearance
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    Theme
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    Currently using {theme === "dark" ? "dark" : "light"} theme
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    onClick={() => setTheme("dark")}
                    size="icon"
                    className={`p-2 rounded-lg transition-colors ${
                      theme === "dark"
                        ? "bg-[var(--color-btn-primary)] text-[var(--color-btn-primary-text)]"
                        : "bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-card-hover)]"
                    }`}
                  >
                    <Moon className="w-4 h-4" />
                  </Button>
                  <Button
                    onClick={() => setTheme("light")}
                    size="icon"
                    className={`p-2 rounded-lg transition-colors ${
                      theme === "light"
                        ? "bg-[var(--color-btn-primary)] text-[var(--color-btn-primary-text)]"
                        : "bg-[var(--color-bg-elevated)] text-[var(--color-text-tertiary)] hover:bg-[var(--color-bg-card-hover)]"
                    }`}
                  >
                    <Sun className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-5">
            <div className="flex items-center gap-3 mb-4">
              <Bell className="w-5 h-5 text-[var(--color-accent-primary)]" />
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Notifications
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 opacity-50">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    Push Notifications
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    Receive notifications for new activity
                  </p>
                </div>
                <Switch disabled />
              </div>
              <div className="flex items-center justify-between py-2 opacity-50">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    Email Notifications
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    Receive email updates
                  </p>
                </div>
                <Switch disabled />
              </div>
            </div>
          </div>

          {/* Privacy */}
          <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-5">
            <div className="flex items-center gap-3 mb-4">
              <Lock className="w-5 h-5 text-[var(--color-accent-primary)]" />
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Privacy & Security
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 opacity-50">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    Private Profile
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    Only followers can see your recordings
                  </p>
                </div>
                <Switch disabled />
              </div>
            </div>
          </div>

          {/* Language */}
          <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-5">
            <div className="flex items-center gap-3 mb-4">
              <Globe className="w-5 h-5 text-[var(--color-accent-primary)]" />
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Language & Region
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    Language
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    Select your preferred language
                  </p>
                </div>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger className="w-[180px] bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)]">
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--color-bg-card)] border-[var(--color-border)]">
                    <SelectItem
                      value="en"
                      className="text-[var(--color-text-primary)] focus:bg-[var(--color-bg-elevated)] focus:text-[var(--color-text-primary)]"
                    >
                      English
                    </SelectItem>
                    <SelectItem
                      value="vi"
                      className="text-[var(--color-text-primary)] focus:bg-[var(--color-bg-elevated)] focus:text-[var(--color-text-primary)]"
                    >
                      Tiếng Việt
                    </SelectItem>
                    <SelectItem
                      value="es"
                      className="text-[var(--color-text-primary)] focus:bg-[var(--color-bg-elevated)] focus:text-[var(--color-text-primary)]"
                    >
                      Español
                    </SelectItem>
                    <SelectItem
                      value="fr"
                      className="text-[var(--color-text-primary)] focus:bg-[var(--color-bg-elevated)] focus:text-[var(--color-text-primary)]"
                    >
                      Français
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Contact */}
          <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-5">
            <div className="flex items-center gap-3 mb-4">
              <Mail className="w-5 h-5 text-[var(--color-accent-primary)]" />
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                Contact
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    Support Email
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    Get in touch with us
                  </p>
                </div>
                <a
                  href="mailto:dthanhff318@gmail.com"
                  className="text-sm text-[var(--color-accent-primary)] hover:underline"
                >
                  dthanhff318@gmail.com
                </a>
              </div>
            </div>
          </div>

          {/* About */}
          <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-5">
            <div className="flex items-center gap-3 mb-4">
              <SettingsIcon className="w-5 h-5 text-[var(--color-accent-primary)]" />
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                About
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  Version
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  Alpha 0.0.1
                </p>
              </div>
              <div className="flex items-center justify-between py-2">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  Terms of Service
                </p>
                <Button
                  variant="link"
                  onClick={() => setShowTerms(true)}
                  className="text-sm text-[var(--color-accent-primary)] hover:underline"
                >
                  View
                </Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  Privacy Policy
                </p>
                <Button
                  variant="link"
                  onClick={() => setShowPrivacy(true)}
                  className="text-sm text-[var(--color-accent-primary)] hover:underline"
                >
                  View
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Modals */}
      <TermsOfServiceModal
        isOpen={showTerms}
        onClose={() => setShowTerms(false)}
      />
      <PrivacyPolicyModal
        isOpen={showPrivacy}
        onClose={() => setShowPrivacy(false)}
      />
    </div>
  );
}
