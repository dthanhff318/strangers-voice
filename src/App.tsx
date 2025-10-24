import { useState, useEffect } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
} from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { AudioRecorder } from "./components/AudioRecorder";
import { Feed } from "./components/Feed";
import { BottomNav } from "./components/BottomNav";
import { LoginModal } from "./components/LoginModal";
import { OnboardingModal } from "./components/OnboardingModal";
import { LoadingScreen } from "./components/LoadingScreen";
import { Toaster } from "@/components/ui/sonner";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
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
import { Admin } from "./components/Admin";
import { RecordPlayerModal } from "./components/RecordPlayerModal";
import { useAuth } from "./contexts/AuthContext";
import { LogOut, User, LayoutDashboard } from "lucide-react";
import "./App.css";

type NavTab = "home" | "follow" | "profile" | "settings" | "admin";

function MainContent() {
  const [showInitialLoading, setShowInitialLoading] = useState(true);
  const [prefetchPromise, setPrefetchPromise] = useState<Promise<void> | undefined>();
  const [showRecorder, setShowRecorder] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const { user, profile, loading, signOut, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();

  // Prefetch trending recordings on initial load
  useEffect(() => {
    const prefetch = async () => {
      try {
        await queryClient.prefetchQuery({
          queryKey: ["trending-recordings"],
          queryFn: async () => {
            const { getTrendingRecordsDashboard } = await import("./lib/edgeFunctions");
            const { data, error } = await getTrendingRecordsDashboard();
            if (error) throw error;
            return data?.data || [];
          },
        });
      } catch (error) {
        console.error("Error prefetching recordings:", error);
      }
    };

    setPrefetchPromise(prefetch());
  }, [queryClient]);

  useEffect(() => {
    if (profile && !profile.avatar_url) {
      setNeedsOnboarding(true);
    } else {
      setNeedsOnboarding(false);
    }
  }, [profile]);

  // Sync activeTab with current route
  useEffect(() => {
    if (location.pathname === "/") {
      setActiveTab("home");
    } else if (location.pathname === "/follow") {
      setActiveTab("follow");
    } else if (location.pathname === "/profile") {
      setActiveTab("profile");
    } else if (location.pathname === "/settings") {
      setActiveTab("settings");
    } else if (location.pathname === "/admin") {
      setActiveTab("admin");
    }
  }, [location.pathname]);

  const handleUploadSuccess = () => {
    // Invalidate queries to refresh recordings list
    queryClient.invalidateQueries({ queryKey: ["trending-recordings"] });
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ["user-recordings", user.id] });
    }

    setShowRecorder(false);
    navigate("/");
    setActiveTab("home");
  };

  const handleSignOut = async () => {
    await signOut();
  };

  const handleOnboardingComplete = async () => {
    await refreshProfile();
    setNeedsOnboarding(false);
  };

  const handleTabChange = (tab: NavTab) => {
    setActiveTab(tab);
    const routeMap: Record<NavTab, string> = {
      home: "/",
      follow: "/follow",
      profile: "/profile",
      settings: "/settings",
      admin: "/admin",
    };
    navigate(routeMap[tab]);
  };

  const handleAdminClick = () => {
    setActiveTab("admin");
    navigate("/admin");
  };

  const handleLoadingComplete = () => {
    setShowInitialLoading(false);
  };

  // Show initial loading screen
  if (showInitialLoading) {
    return (
      <LoadingScreen
        onComplete={handleLoadingComplete}
        onReady={prefetchPromise}
      />
    );
  }

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] pb-32">
      {/* Top Navigation */}
      <nav className="bg-[var(--color-bg-primary)]/90 backdrop-blur-sm border-b border-[var(--color-border)] sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div
            className="flex items-center gap-2 cursor-pointer"
            onClick={() => navigate("/")}
          >
            <div className="w-8 h-8 bg-[var(--color-btn-primary)] rounded-md flex items-center justify-center">
              <img src="/favicon.png" alt="" className="w-6 h-6 logo-invert" />
            </div>
            <span className="text-xl font-bold text-[var(--color-text-primary)]">
              YMelody
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
                <Button
                  variant="ghost"
                  className="flex items-center gap-2 hover:bg-[var(--color-bg-card)] px-3 py-2 rounded-lg transition-colors"
                >
                  <Avatar className="w-8 h-8">
                    <AvatarImage
                      src={profile?.avatar_url ?? ""}
                      alt={profile?.full_name ?? ""}
                    />
                    <AvatarFallback className="bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] text-xs">
                      {profile?.full_name?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <span className="text-[var(--color-text-primary)] text-sm font-medium hidden md:block">
                    {profile?.full_name}
                  </span>
                </Button>
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
                {profile?.email === "dthanhff318@gmail.com" && (
                  <DropdownMenuItem
                    onClick={handleAdminClick}
                    className="text-[var(--color-text-tertiary)] focus:bg-[var(--color-bg-elevated)] focus:text-[var(--color-text-primary)]"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>Dashboard</span>
                  </DropdownMenuItem>
                )}
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
            <Button
              onClick={() => setShowLoginModal(true)}
              className="flex items-center gap-2 bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)] px-4 py-2 rounded-lg transition-all font-medium"
            >
              <User className="w-4 h-4" />
              <span>Sign in</span>
            </Button>
          )}
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Routes */}
        <Routes>
          <Route
            path="/"
            element={
              <div className="animate-in fade-in duration-500">
                <Feed
                  onLoginRequired={() => setShowLoginModal(true)}
                />
              </div>
            }
          />
          <Route
            path="/follow"
            element={
              <div className="animate-in fade-in duration-500">
                <Follow />
              </div>
            }
          />
          <Route
            path="/profile"
            element={
              <Profile onLoginRequired={() => setShowLoginModal(true)} />
            }
          />
          <Route
            path="/profile/:userId"
            element={
              <Profile onLoginRequired={() => setShowLoginModal(true)} />
            }
          />
          <Route
            path="/settings"
            element={
              <div className="animate-in fade-in duration-500">
                <Settings />
              </div>
            }
          />
          <Route path="/admin" element={<Admin />} />
        </Routes>
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
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

      {/* Global Record Player Modal */}
      <RecordPlayerModal onLoginRequired={() => setShowLoginModal(true)} />
    </div>
  );
}

function App() {
  return (
    <Router>
      <MainContent />
    </Router>
  );
}

export default App;
