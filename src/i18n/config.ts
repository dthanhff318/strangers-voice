import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

// Import English translations
import enCommon from '../locales/en/common.json';
import enSettings from '../locales/en/settings.json';
import enHeader from '../locales/en/header.json';
import enNav from '../locales/en/nav.json';
import enFeed from '../locales/en/feed.json';
import enProfile from '../locales/en/profile.json';
import enAudio from '../locales/en/audio.json';
import enLive from '../locales/en/live.json';
import enModals from '../locales/en/modals.json';
import enFollow from '../locales/en/follow.json';

// Import Vietnamese translations
import viCommon from '../locales/vi/common.json';
import viSettings from '../locales/vi/settings.json';
import viHeader from '../locales/vi/header.json';
import viNav from '../locales/vi/nav.json';
import viFeed from '../locales/vi/feed.json';
import viProfile from '../locales/vi/profile.json';
import viAudio from '../locales/vi/audio.json';
import viLive from '../locales/vi/live.json';
import viModals from '../locales/vi/modals.json';
import viFollow from '../locales/vi/follow.json';

// Define supported languages
export const SUPPORTED_LANGUAGES = {
  en: 'English',
  vi: 'Tiếng Việt',
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// i18n configuration
i18n
  // Detect user language
  .use(LanguageDetector)
  // Pass the i18n instance to react-i18next
  .use(initReactI18next)
  // Initialize i18next
  .init({
    // Default language
    fallbackLng: 'en',

    // Supported languages
    supportedLngs: ['en', 'vi'],

    // Namespace configuration
    ns: ['common', 'settings', 'header', 'nav', 'feed', 'profile', 'audio', 'live', 'modals', 'follow'],
    defaultNS: 'common',

    // Language detection options
    detection: {
      // Order of language detection methods
      order: ['localStorage', 'navigator'],
      // Cache user language preference
      caches: ['localStorage'],
      // localStorage key
      lookupLocalStorage: 'i18nextLng',
    },

    // Resources (translations)
    resources: {
      en: {
        common: enCommon,
        settings: enSettings,
        header: enHeader,
        nav: enNav,
        feed: enFeed,
        profile: enProfile,
        audio: enAudio,
        live: enLive,
        modals: enModals,
        follow: enFollow,
      },
      vi: {
        common: viCommon,
        settings: viSettings,
        header: viHeader,
        nav: viNav,
        feed: viFeed,
        profile: viProfile,
        audio: viAudio,
        live: viLive,
        modals: viModals,
        follow: viFollow,
      },
    },

    // Interpolation options
    interpolation: {
      escapeValue: false, // React already escapes values
    },

    // React options
    react: {
      useSuspense: false, // Disable suspense for now
    },
  });

export default i18n;
