import { useState, useEffect } from "react";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  Lock,
  Globe,
  Mail,
  Download,
  Share,
  CheckCircle2,
} from "lucide-react";
import { useTranslation } from "react-i18next";
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
import { useLanguage } from "../contexts/LanguageContext";
import { SUPPORTED_LANGUAGES, type SupportedLanguage } from "../i18n/config";
import { TermsOfServiceModal } from "./TermsOfServiceModal";
import { PrivacyPolicyModal } from "./PrivacyPolicyModal";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function Settings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(['settings', 'common']);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [canInstall, setCanInstall] = useState(false);

  useEffect(() => {
    // Check if running as standalone app (PWA installed)
    const isStandaloneMode =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as any).standalone === true ||
      document.referrer.includes('android-app://') ||
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches;

    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    setIsIos(ios);

    // Detect mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Check if user has previously installed
    const hasInstalled = localStorage.getItem('pwa-installed') === 'true';

    // Show install option if mobile and not installed
    setCanInstall(isMobile && !isStandaloneMode && !hasInstalled);

    // For Android browsers, listen for beforeinstallprompt event
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);
      setCanInstall(true);
    };

    // Listen for successful app installation
    const installedHandler = () => {
      localStorage.setItem('pwa-installed', 'true');
      setIsStandalone(true);
      setCanInstall(false);
    };

    window.addEventListener('beforeinstallprompt', handler);
    window.addEventListener('appinstalled', installedHandler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
      window.removeEventListener('appinstalled', installedHandler);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;

    // Show the install prompt
    await deferredPrompt.prompt();

    // Wait for the user to respond to the prompt
    await deferredPrompt.userChoice;

    // Clear the prompt
    setDeferredPrompt(null);
    setCanInstall(false);
  };

  return (
    <div className="min-h-[70vh] animate-in fade-in duration-500">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)]">
            {t('settings:title')}
          </h1>
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {/* PWA Install */}
          {(canInstall || isStandalone) && (
            <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-5">
              <div className="flex items-center gap-3 mb-4">
                <Download className="w-5 h-5 text-[var(--color-accent-primary)]" />
                <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                  {t('settings:pwaInstall.title')}
                </h2>
              </div>
              <div className="space-y-3">
                {isStandalone ? (
                  <div className="flex items-center gap-3 py-2">
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)]">
                        {t('settings:pwaInstall.installed')}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)]">
                        {t('settings:pwaInstall.description')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text-primary)] mb-1">
                        {t('settings:pwaInstall.title')}
                      </p>
                      <p className="text-xs text-[var(--color-text-tertiary)] mb-3">
                        {t('settings:pwaInstall.description')}
                      </p>
                    </div>
                    {isIos ? (
                      <div className="flex items-start gap-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] px-3 py-2 rounded-lg">
                        <Share className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span>{t('pwa.installIos')}</span>
                      </div>
                    ) : deferredPrompt ? (
                      <Button
                        onClick={handleInstallClick}
                        size="sm"
                        className="bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)]"
                      >
                        <Download className="w-4 h-4 mr-2" />
                        {t('pwa.installButton')}
                      </Button>
                    ) : (
                      <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] px-3 py-2 rounded-lg">
                        {t('pwa.installAndroid', 'Tap menu (⋮) → Add to Home screen')}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Appearance */}
          <div className="bg-[var(--color-bg-card)] rounded-xl border border-[var(--color-border)] p-5">
            <div className="flex items-center gap-3 mb-4">
              <Moon className="w-5 h-5 text-[var(--color-accent-primary)]" />
              <h2 className="text-lg font-semibold text-[var(--color-text-primary)]">
                {t('settings:appearance.title')}
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {t('settings:appearance.theme')}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {t('settings:appearance.themeDescription', {
                      theme: t(`settings:appearance.${theme}`)
                    })}
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
                {t('settings:notifications.title')}
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 opacity-50">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {t('settings:notifications.push')}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {t('settings:notifications.pushDescription')}
                  </p>
                </div>
                <Switch disabled />
              </div>
              <div className="flex items-center justify-between py-2 opacity-50">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {t('settings:notifications.email')}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {t('settings:notifications.emailDescription')}
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
                {t('settings:privacy.title')}
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2 opacity-50">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {t('settings:privacy.privateProfile')}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {t('settings:privacy.privateProfileDescription')}
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
                {t('settings:language.title')}
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {t('settings:language.language')}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {t('settings:language.languageDescription')}
                  </p>
                </div>
                <Select
                  value={language}
                  onValueChange={(value) => setLanguage(value as SupportedLanguage)}
                >
                  <SelectTrigger className="w-[180px] bg-[var(--color-bg-elevated)] border-[var(--color-border)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-card-hover)]">
                    <SelectValue placeholder={t('settings:language.selectLanguage')} />
                  </SelectTrigger>
                  <SelectContent className="bg-[var(--color-bg-card)] border-[var(--color-border)]">
                    {Object.entries(SUPPORTED_LANGUAGES).map(([code, name]) => (
                      <SelectItem
                        key={code}
                        value={code}
                        className="text-[var(--color-text-primary)] focus:bg-[var(--color-bg-elevated)] focus:text-[var(--color-text-primary)]"
                      >
                        {name}
                      </SelectItem>
                    ))}
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
                {t('settings:contact.title')}
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <div>
                  <p className="text-sm font-medium text-[var(--color-text-primary)]">
                    {t('settings:contact.supportEmail')}
                  </p>
                  <p className="text-xs text-[var(--color-text-tertiary)]">
                    {t('settings:contact.supportEmailDescription')}
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
                {t('settings:about.title')}
              </h2>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between py-2">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {t('settings:about.version')}
                </p>
                <p className="text-sm text-[var(--color-text-tertiary)]">
                  Alpha 0.0.1
                </p>
              </div>
              <div className="flex items-center justify-between py-2">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {t('settings:about.termsOfService')}
                </p>
                <Button
                  variant="link"
                  onClick={() => setShowTerms(true)}
                  className="text-sm text-[var(--color-accent-primary)] hover:underline"
                >
                  {t('common:actions.view')}
                </Button>
              </div>
              <div className="flex items-center justify-between py-2">
                <p className="text-sm font-medium text-[var(--color-text-primary)]">
                  {t('settings:about.privacyPolicy')}
                </p>
                <Button
                  variant="link"
                  onClick={() => setShowPrivacy(true)}
                  className="text-sm text-[var(--color-accent-primary)] hover:underline"
                >
                  {t('common:actions.view')}
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
