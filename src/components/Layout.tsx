import { useState } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { Header } from "./Header";
import { BottomNav } from "./BottomNav";
import { LoginModal } from "./LoginModal";
import { VoiceActionDrawer } from "./VoiceActionDrawer";
import { useAuth } from "@/contexts/AuthContext";
import { useQueryClient } from "@tanstack/react-query";

type NavTab = "home" | "follow" | "profile" | "settings" | "admin";

interface LayoutProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
}

export function Layout({ activeTab, onTabChange }: LayoutProps) {
  const [showRecorder, setShowRecorder] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { user } = useAuth();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const handleUploadSuccess = () => {
    // Invalidate queries to refresh recordings list
    queryClient.invalidateQueries({ queryKey: ["trending-recordings"] });
    if (user?.id) {
      queryClient.invalidateQueries({ queryKey: ["user-recordings", user.id] });
    }

    setShowRecorder(false);
    navigate("/");
    onTabChange("home");
  };

  const handleAdminClick = () => {
    onTabChange("admin");
    navigate("/admin");
  };

  return (
    <div className="min-h-screen bg-[var(--color-bg-primary)] pb-32">
      {/* Header */}
      <Header
        onLoginClick={() => setShowLoginModal(true)}
        onAdminClick={handleAdminClick}
      />

      {/* Main Content Area */}
      <div className="max-w-4xl mx-auto px-4 py-4">
        <Outlet context={{ onLoginRequired: () => setShowLoginModal(true) }} />
      </div>

      {/* Bottom Navigation */}
      <BottomNav
        activeTab={activeTab}
        onTabChange={onTabChange}
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

      {/* Voice Action Drawer (Record & Live) */}
      <VoiceActionDrawer
        isOpen={showRecorder}
        onClose={() => setShowRecorder(false)}
        onUploadSuccess={handleUploadSuccess}
      />
    </div>
  );
}
