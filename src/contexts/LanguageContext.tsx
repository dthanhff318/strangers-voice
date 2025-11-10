import { createContext, useContext, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import type { SupportedLanguage } from '../i18n/config';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (language: SupportedLanguage) => void;
  isChangingLanguage: boolean;
}

const LanguageContext = createContext<LanguageContextType | undefined>(
  undefined
);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const { i18n } = useTranslation();
  const [language, setLanguageState] = useState<SupportedLanguage>(
    (i18n.language as SupportedLanguage) || 'en'
  );
  const [isChangingLanguage, setIsChangingLanguage] = useState(false);

  // Update language state when i18n language changes
  useEffect(() => {
    const handleLanguageChange = (lng: string) => {
      setLanguageState(lng as SupportedLanguage);
      setIsChangingLanguage(false);
    };

    i18n.on('languageChanged', handleLanguageChange);

    return () => {
      i18n.off('languageChanged', handleLanguageChange);
    };
  }, [i18n]);

  const setLanguage = async (newLanguage: SupportedLanguage) => {
    if (newLanguage === language) return;

    setIsChangingLanguage(true);
    try {
      await i18n.changeLanguage(newLanguage);
      // Language state will be updated by the event listener
    } catch (error) {
      console.error('Failed to change language:', error);
      setIsChangingLanguage(false);
    }
  };

  return (
    <LanguageContext.Provider
      value={{
        language,
        setLanguage,
        isChangingLanguage,
      }}
    >
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (context === undefined) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
