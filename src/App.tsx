import { useState, useEffect } from "react";
import { AudioRecorder } from "./components/AudioRecorder";
import { Feed } from "./components/Feed";
import { BottomNav } from "./components/BottomNav";
import { LoginModal } from "./components/LoginModal";
import { OnboardingModal } from "./components/OnboardingModal";
import { Toaster } from "@/components/ui/sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Profile } from "./components/Profile";
import { Follow } from "./components/Follow";
import { Settings } from "./components/Settings";
import { useAuth } from "./contexts/AuthContext";
import { LogOut, User } from "lucide-react";
import "./App.css";

type NavTab = "home" | "follow" | "profile" | "settings";

function App() {
  const [refreshKey, setRefreshKey] = useState(0);
  const [showRecorder, setShowRecorder] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const { user, profile, loading, signOut } = useAuth();

  useEffect(() => {
    if (profile && !profile.avatar_url) {
      setNeedsOnboarding(true);
    } else {
      setNeedsOnboarding(false);
    }
  }, [profile]);

  const handleUploadSuccess = () => {
    setRefreshKey((prev) => prev + 1);
    setShowRecorder(false);
    setActiveTab("home"); // Return to home after upload
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleOnboardingComplete = async () => {
    setNeedsOnboarding(false);
    // Refresh profile data from AuthContext
    // The profile will be automatically refreshed via the useEffect in AuthContext
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] pb-32">
      {/* Top Navigation */}
      <nav className="bg-[var(--color-bg-primary)]/90 backdrop-blur-sm border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-[var(--color-btn-primary)] rounded-md flex items-center justify-center">
              <img src="/favicon.png" alt="" className="w-6 h-6 logo-invert" />
            </div>
            <span className="text-xl font-bold text-[var(--color-text-primary)]">
              Your Melody
            </span>
          </div>

          {/* User Menu */}
          {loading ? (
            <div className="flex items-center gap-2 px-3 py-2">
              <div className="w-8 h-8 rounded-full bg-[var(--color-bg-card)] animate-pulse" />
              <div className="hidden md:block w-24 h-4 bg-[var(--color-bg-card)] rounded animate-pulse" />
            </div>
          ) : profile && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 hover:bg-[var(--color-bg-card)] px-3 py-2 rounded-lg transition-colors">
                  <Avatar className="w-8 h-8">
                    <AvatarImage src={profile?.avatar_url ?? ""} alt={profile?.full_name ?? ""} />
                    <AvatarFallback className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-xs">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[var(--color-text-primary)] text-sm font-medium hidden md:block">
                    {profile?.full_name}
                  </span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 bg-[var(--color-bg-card)] border-[var(--color-border)]"
              >
                <DropdownMenuLabel className="text-[var(--color-text-primary)]">
                  <p className="font-medium truncate">
                    {profile?.full_name || "User"}
                  </p>
                  <p className="text-[var(--color-text-tertiary)] text-sm font-normal truncate">
                    {profile?.email}
                  </p>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className="bg-[var(--color-border)]" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-[var(--color-text-tertiary)] focus:bg-[var(--color-bg-elevated)] focus:text-[var(--color-text-primary)]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-2 bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)] px-4 py-2 rounded-lg transition-all font-medium"
            >
              <User className="w-4 h-4" />
              <span>Sign in</span>
            </button>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Content based on active tab */}
        {activeTab === "home" && (
          <div className="animate-in fade-in duration-500">
            <Feed
              key={refreshKey}
              onLoginRequired={() => setShowLoginModal(true)}
            />
          </div>
        )}

        {activeTab === "follow" && (
          <div className="animate-in fade-in duration-500">
            <Follow />
          </div>
        )}

        {activeTab === "profile" && (
          <Profile onLoginRequired={() => setShowLoginModal(true)} />
        )}

        {activeTab === "settings" && (
          <div className="animate-in fade-in duration-500">
            <Settings />
          </div>
        )}
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onRecordClick={() => {
          if (!user) {
            setShowLoginModal(true);
          } else {
            setShowRecorder(!showRecorder);
          }
        }}
      />

      {/* Login Modal */}
      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
      />

      {/* Onboarding Modal for new users */}
      {user && needsOnboarding && (
        <OnboardingModal user={user} onComplete={handleOnboardingComplete} />
      )}

      {/* Recorder Drawer */}
      <Drawer open={showRecorder} onOpenChange={setShowRecorder}>
        <DrawerContent className="bg-[var(--color-bg-card)] border-t border-[var(--color-border)]">
          <div className="max-w-2xl mx-auto w-full">
            <DrawerHeader className="pb-2">
              <DrawerTitle className="text-[var(--color-text-primary)] text-base">
                Record Your Voice
              </DrawerTitle>
            </DrawerHeader>
            <div className="px-4 pb-4">
              <AudioRecorder onUploadSuccess={handleUploadSuccess} />
            </div>
          </div>
        </DrawerContent>
      </Drawer>

      {/* Toast Notifications */}
      <Toaster />
    </div>
  );
}

export default App;
