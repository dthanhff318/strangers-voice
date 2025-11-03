import { useState, useEffect, useRef, useCallback } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  useNavigate,
  useLocation,
  useOutletContext,
} from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { Feed } from "./components/Feed";
import { OnboardingModal } from "./components/OnboardingModal";
import { LoadingScreen } from "./components/LoadingScreen";
import { Toaster } from "@/components/ui/sonner";
import { Profile } from "./components/Profile";
import { Follow } from "./components/Follow";
import { Settings } from "./components/Settings";
import { Admin } from "./components/Admin";
import { RecordPlayerModal } from "./components/RecordPlayerModal";
import { LiveRoom } from "./components/LiveRoom";
import { Layout } from "./components/Layout";
import { useAuth } from "./contexts/AuthContext";
import "./App.css";
import { LiveFeed } from "@/components/LiveFeed";

type NavTab = "home" | "follow" | "profile" | "settings" | "admin";

// Hook to use outlet context
export function useLoginRequired() {
  return useOutletContext<{ onLoginRequired: () => void }>();
}

function MainContent() {
  const [showInitialLoading, setShowInitialLoading] = useState(true);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<NavTab>("home");
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const { user, profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const location = useLocation();
  const hasPrefetched = useRef(false);

  // Prefetch data based on initial route with progress tracking
  useEffect(() => {
    // Only run once
    if (hasPrefetched.current) return;
    hasPrefetched.current = true;

    const prefetch = async () => {
      try {
        const initialPath = location.pathname;

        // Start at 10%
        setLoadingProgress(10);

        // Simulate some initial loading time
        await new Promise((resolve) => setTimeout(resolve, 100));
        setLoadingProgress(30);

        // Home page - prefetch trending recordings
        if (initialPath === "/") {
          setLoadingProgress(50);

          await queryClient.prefetchQuery({
            queryKey: ["trending-recordings"],
            queryFn: async () => {
              const { getTrendingRecordsDashboard } = await import(
                "./lib/edgeFunctions"
              );
              const { data, error } = await getTrendingRecordsDashboard();
              if (error) throw error;
              return data?.data || [];
            },
          });

          setLoadingProgress(90);
        }
        // Follow page - prefetch recommended users
        else if (initialPath === "/follow" && user?.id) {
          setLoadingProgress(50);

          const { getRecommendedUsers } = await import("./lib/edgeFunctions");
          await getRecommendedUsers();

          setLoadingProgress(90);
        }
        // Profile page - prefetch own recordings
        else if (initialPath === "/profile" && user?.id) {
          setLoadingProgress(50);

          await queryClient.prefetchQuery({
            queryKey: ["user-recordings", user.id],
            queryFn: async () => {
              const { getMyRecordings } = await import("./lib/edgeFunctions");
              const { data, error } = await getMyRecordings();
              if (error) throw error;
              return data?.data || [];
            },
          });

          setLoadingProgress(90);
        }

        // Final step - ensure minimum display time
        await new Promise((resolve) => setTimeout(resolve, 200));
        setLoadingProgress(100);
      } catch (error) {
        console.error("Error prefetching data:", error);
        // Even on error, complete loading to not block UI
        setLoadingProgress(100);
      }
    };

    prefetch();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run once on mount

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

  const handleLoadingComplete = useCallback(() => {
    setShowInitialLoading(false);
  }, []);

  // Show initial loading screen
  if (showInitialLoading) {
    return (
      <LoadingScreen
        onComplete={handleLoadingComplete}
        progress={loadingProgress}
      />
    );
  }

  return (
    <>
      {/* Routes */}
      <Routes>
        <Route element={<Layout activeTab={activeTab} onTabChange={handleTabChange} />}>
          <Route
            path="/"
            element={
              <div className="animate-in fade-in duration-500">
                <Feed />
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
            path="/live"
            element={
              <div className="animate-in fade-in duration-500">
                <LiveFeed />
              </div>
            }
          />
          <Route
            path="/profile"
            element={<Profile />}
          />
          <Route
            path="/profile/:userId"
            element={<Profile />}
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
        </Route>
        {/* LiveRoom without Layout */}
        <Route path="/live/:roomId" element={<LiveRoom />} />
      </Routes>

      {/* Onboarding Modal for new users */}
      {user && needsOnboarding && (
        <OnboardingModal user={user} onComplete={handleOnboardingComplete} />
      )}

      {/* Toast Notifications */}
      <Toaster />

      {/* Global Record Player Modal */}
      <RecordPlayerModal />
    </>
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
