import { Home, Users, Mic, User, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Button } from "./ui/button";

type NavTab = "home" | "follow" | "profile" | "settings" | "admin";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onRecordClick: () => void;
}

export function BottomNav({
  activeTab,
  onTabChange,
  onRecordClick,
}: BottomNavProps) {
  const { t } = useTranslation(['nav']);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50">
      {/* Gradient overlay */}
      <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--color-bg-primary)] via-[var(--color-bg-primary)]/60 to-transparent pointer-events-none" />

      {/* Nav bar */}
      <div className="relative bg-[var(--color-bg-primary)]/80 backdrop-blur-xl border-t border-[var(--color-border)]">
        <div className="max-w-4xl mx-auto px-4">
          <div className="relative flex items-end justify-between py-3 px-2">
            {/* Home Button */}
            <Button
              variant="ghost"
              onClick={() => onTabChange("home")}
              className={`group flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all duration-300 h-auto ${
                activeTab === "home"
                  ? "text-[var(--color-text-primary)]"
                  : "text-[var(--color-inactive)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-accent-subtle)]"
              }`}
            >
              <Home
                className={`w-6 h-6 transition-all duration-300 ${
                  activeTab === "home"
                    ? "fill-[var(--color-accent-primary)] scale-110"
                    : "group-hover:scale-105"
                }`}
              />
              <span
                className={`text-xs font-medium transition-all duration-300 ${
                  activeTab === "home"
                    ? "opacity-100"
                    : "opacity-70 group-hover:opacity-100"
                }`}
              >
                {t('nav:home')}
              </span>
            </Button>

            {/* Follow Button */}
            <Button
              variant="ghost"
              onClick={() => onTabChange("follow")}
              className={`group flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all duration-300 h-auto ${
                activeTab === "follow"
                  ? "text-[var(--color-text-primary)]"
                  : "text-[var(--color-inactive)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-accent-subtle)]"
              }`}
            >
              <Users
                className={`w-6 h-6 transition-all duration-300 ${
                  activeTab === "follow"
                    ? "fill-[var(--color-accent-primary)] scale-110"
                    : "group-hover:scale-105"
                }`}
              />
              <span
                className={`text-xs font-medium transition-all duration-300 ${
                  activeTab === "follow"
                    ? "opacity-100"
                    : "opacity-70 group-hover:opacity-100"
                }`}
              >
                {t('nav:follow')}
              </span>
            </Button>

            {/* Record Button (Center, Large) */}
            <Button
              variant="ghost"
              onClick={onRecordClick}
              className="group flex flex-col items-center gap-0.5 -mt-6 transition-all duration-300 h-auto p-0 hover:bg-transparent"
            >
              <div className="relative">
                {/* Glow effect */}
                <div className="absolute inset-0 rounded-full bg-[var(--color-btn-primary)] blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300" />

                {/* Button */}
                <div className="relative w-14 h-14 rounded-full bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] flex items-center justify-center shadow-2xl shadow-[var(--shadow-primary)] transition-all duration-300 group-hover:scale-110 group-active:scale-95 border-4 border-[var(--color-bg-primary)]">
                  <Mic
                    className="w-6 h-6 text-[var(--color-btn-primary-text)] group-hover:scale-110 transition-transform duration-300"
                    fill="var(--color-btn-primary-text)"
                  />
                </div>
              </div>
              <span className="text-xs font-medium text-[var(--color-text-primary)] mt-1 group-hover:scale-105 transition-transform duration-300">
                {t('nav:record')}
              </span>
            </Button>

            {/* Profile Button */}
            <Button
              variant="ghost"
              onClick={() => onTabChange("profile")}
              className={`group flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all duration-300 h-auto ${
                activeTab === "profile"
                  ? "text-[var(--color-text-primary)]"
                  : "text-[var(--color-inactive)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-accent-subtle)]"
              }`}
            >
              <User
                className={`w-6 h-6 transition-all duration-300 ${
                  activeTab === "profile"
                    ? "fill-[var(--color-accent-primary)] scale-110"
                    : "group-hover:scale-105"
                }`}
              />
              <span
                className={`text-xs font-medium transition-all duration-300 ${
                  activeTab === "profile"
                    ? "opacity-100"
                    : "opacity-70 group-hover:opacity-100"
                }`}
              >
                {t('nav:profile')}
              </span>
            </Button>

            {/* Settings Button */}
            <Button
              variant="ghost"
              onClick={() => onTabChange("settings")}
              className={`group flex flex-col items-center gap-1 px-4 py-1 rounded-xl transition-all duration-300 h-auto ${
                activeTab === "settings"
                  ? "text-[var(--color-text-primary)]"
                  : "text-[var(--color-inactive)] hover:text-[var(--color-text-primary)] hover:bg-[var(--color-accent-subtle)]"
              }`}
            >
              <Settings
                className={`w-6 h-6 transition-all duration-300 ${
                  activeTab === "settings"
                    ? "fill-[var(--color-accent-primary)] scale-110"
                    : "group-hover:scale-105"
                }`}
              />
              <span
                className={`text-xs font-medium transition-all duration-300 ${
                  activeTab === "settings"
                    ? "opacity-100"
                    : "opacity-70 group-hover:opacity-100"
                }`}
              >
                {t('nav:settings')}
              </span>
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
