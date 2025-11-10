import { useState } from "react";
import {
  Settings as SettingsIcon,
  Moon,
  Sun,
  Bell,
  Lock,
  Globe,
  Mail,
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

export function Settings() {
  const { theme, setTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const { t } = useTranslation(['settings', 'common']);
  const [showTerms, setShowTerms] = useState(false);
  const [showPrivacy, setShowPrivacy] = useState(false);
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
