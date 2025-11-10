import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, User, LayoutDashboard } from "lucide-react";

interface HeaderProps {
  onLoginClick: () => void;
  onAdminClick: () => void;
}

export function Header({ onLoginClick, onAdminClick }: HeaderProps) {
  const { user, profile, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation(['header', 'common']);

  const handleSignOut = async () => {
    await signOut();
  };

  return (
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
            {t('header:appName')}
          </span>
        </div>

        <div className="flex items-center gap-3">
          {/* Live Button - Only show when user is logged in */}
          {user && (
            <Button
              onClick={() => navigate("/live")}
              variant="ghost"
              className="flex items-center gap-2 hover:bg-[var(--color-bg-card)] px-3 py-2 rounded-lg transition-colors"
            >
              <div className="relative">
                <div className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />
                <div className="absolute inset-0 w-2 h-2 bg-red-500 rounded-full animate-ping" />
              </div>
              <span className="text-[var(--color-text-primary)] text-sm font-medium">
                {t('header:live')}
              </span>
            </Button>
          )}

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
                    onClick={onAdminClick}
                    className="text-[var(--color-text-tertiary)] focus:bg-[var(--color-bg-elevated)] focus:text-[var(--color-text-primary)]"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    <span>{t('header:dashboard')}</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="text-[var(--color-text-tertiary)] focus:bg-[var(--color-bg-elevated)] focus:text-[var(--color-text-primary)]"
                >
                  <LogOut className="w-4 h-4" />
                  <span>{t('header:signOut')}</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button
              onClick={onLoginClick}
              className="flex items-center gap-2 bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)] px-4 py-2 rounded-lg transition-all font-medium"
            >
              <User className="w-4 h-4" />
              <span>{t('header:signIn')}</span>
            </Button>
          )}
        </div>
      </div>
    </nav>
  );
}
