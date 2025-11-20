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
    // Check if running as standalone app
    const isStandaloneMode = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone
      || document.referrer.includes('android-app://');

    setIsStandalone(isStandaloneMode);

    // Detect iOS
    const ios = /iPhone|iPad|iPod/.test(navigator.userAgent);
    setIsIos(ios);

    // Detect mobile
    const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

    // Check if user has dismissed the prompt before
    const dismissed = localStorage.getItem('pwa-install-dismissed');

    // For all mobile devices, show prompt if not standalone and not dismissed
    if (isMobile && !isStandaloneMode && !dismissed) {
      setShowPrompt(true);
    }

    // For Android browsers, listen for beforeinstallprompt event to enable native install
    const handler = (e: Event) => {
      e.preventDefault();
      const promptEvent = e as BeforeInstallPromptEvent;
      setDeferredPrompt(promptEvent);

      // Update prompt if not already showing
      if (!dismissed && !isStandaloneMode) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handler);

    return () => {
      window.removeEventListener('beforeinstallprompt', handler);
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
    localStorage.setItem('pwa-install-dismissed', 'true');
  };

  // Don't show if already installed or dismissed
  if (!showPrompt || isStandalone) {
    return null;
  }

  return (
    <div className="w-full animate-in fade-in slide-in-from-top-3 duration-500">
      <div className="relative bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-xl shadow-md border border-purple-200 dark:border-purple-700 p-4">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 text-purple-400 hover:text-purple-600 dark:hover:text-purple-300 transition-colors rounded-full hover:bg-purple-100 dark:hover:bg-purple-800/50"
          aria-label="Close"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-start gap-4 pr-8">
          <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl flex items-center justify-center shadow-md">
            <Download className="w-6 h-6 text-white" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-base font-semibold text-purple-900 dark:text-purple-100 mb-1">
              {t('pwa.installTitle')}
            </h3>
            <p className="text-sm text-purple-700 dark:text-purple-200 mb-3">
              {isIos ? t('pwa.installIos') : t('pwa.installDescription')}
            </p>

            {isIos ? (
              <div className="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-300 bg-white/50 dark:bg-purple-800/30 px-3 py-2 rounded-lg">
                <Share className="w-4 h-4" />
                <span>{t('pwa.installIos')}</span>
              </div>
            ) : (
              <div className="flex gap-2 flex-wrap">
                <Button
                  onClick={handleInstallClick}
                  size="sm"
                  className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white shadow-md"
                >
                  <Download className="w-4 h-4 mr-1" />
                  {t('pwa.installButton')}
                </Button>
                <Button
                  onClick={handleDismiss}
                  size="sm"
                  variant="outline"
                  className="text-purple-600 dark:text-purple-300 border-purple-300 dark:border-purple-600 hover:bg-purple-100 dark:hover:bg-purple-800/50"
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
