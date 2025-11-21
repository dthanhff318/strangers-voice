import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { X, Download, Share } from 'lucide-react';
import { Button } from './ui/button';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PwaInstallPrompt() {
  const { t } = useTranslation();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIos, setIsIos] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    // Check if running as standalone app (PWA installed)
    const isStandaloneMode =
      // Standard PWA check
      window.matchMedia('(display-mode: standalone)').matches ||
      // iOS Safari
      (window.navigator as any).standalone === true ||
      // Android Chrome - check if opened from home screen
      document.referrer.includes('android-app://') ||
      // Additional checks for different display modes
      window.matchMedia('(display-mode: fullscreen)').matches ||
      window.matchMedia('(display-mode: minimal-ui)').matches;

    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    setIsIos(ios);

    // Detect mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Check if user has dismissed the prompt in this session
    const dismissed = sessionStorage.getItem('pwa-install-dismissed');

    // Check if user has previously installed (stored in localStorage)
    const hasInstalled = localStorage.getItem('pwa-installed') === 'true';

    // For all mobile devices, show prompt if not standalone, not installed, and not dismissed
    if (isMobile && !isStandaloneMode && !hasInstalled && !dismissed) {
      setShowPrompt(true);
    }

    // For Android browsers, listen for beforeinstallprompt event to enable native install
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Update prompt if not already showing
      if (!dismissed && !isStandaloneMode && !hasInstalled) {
        setShowPrompt(true);
      }
    };

    // Listen for successful app installation
    const installedHandler = () => {
      localStorage.setItem('pwa-installed', 'true');
      setShowPrompt(false);
      setIsStandalone(true);
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
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    sessionStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (!showPrompt || isStandalone) {
    return null;
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-top-3 duration-500">
      <div className="relative bg-[var(--color-bg-card)] rounded-xl shadow-md border border-[var(--color-border)] p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors rounded-full hover:bg-[var(--color-accent-hover)]"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 pr-8">
          <div className="flex-shrink-0 w-12 h-12 bg-[var(--color-btn-primary)] rounded-xl flex items-center justify-center shadow-md">
            <Download className="w-6 h-6 text-[var(--color-btn-primary-text)]" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-1">
              {t('pwa.installTitle')}
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] mb-3">
              {isIos ? t('pwa.installIos') : t('pwa.installDescription')}
            </p>

            {isIos ? (
              <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] px-3 py-2 rounded-lg">
                <Share className="w-4 h-4" />
                <span>{t('pwa.installIos')}</span>
              </div>
            ) : deferredPrompt ? (
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={handleInstallClick}
                  size="sm"
                  className="bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)] shadow-md"
                >
                  <Download className="w-4 h-4 mr-1" />
                  {t('pwa.installButton')}
                </Button>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="outline"
                  className="text-[var(--color-text-primary)] border-[var(--color-border)] hover:bg-[var(--color-bg-card-hover)]"
                >
                  {t('pwa.installLater')}
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                <div className="text-xs text-[var(--color-text-secondary)] bg-[var(--color-bg-elevated)] px-3 py-2 rounded-lg">
                  {t('pwa.installAndroid', 'Tap menu (⋮) → Add to Home screen')}
                </div>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="outline"
                  className="text-[var(--color-text-primary)] border-[var(--color-border)] hover:bg-[var(--color-bg-card-hover)]"
                >
                  {t('pwa.installLater')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
