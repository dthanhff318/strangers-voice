import { Dialog, DialogContent, DialogHeader, DialogTitle } from "./ui/dialog";

interface PrivacyPolicyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PrivacyPolicyModal({
  isOpen,
  onClose,
}: PrivacyPolicyModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--color-bg-card)] border-[var(--color-border)] max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[var(--color-text-primary)]">
            Privacy Policy
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-[var(--color-text-secondary)] mt-4">
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Last updated: January 2025
          </p>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              1. Information We Collect
            </h2>
            <p className="text-sm leading-relaxed mb-2">
              We collect information you provide directly to us, including:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              <li>
                Account information (name, email address, profile picture)
              </li>
              <li>Voice recordings you upload to the platform</li>
              <li>User interactions (likes, comments, follows)</li>
              <li>Usage data and analytics</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              2. How We Use Your Information
            </h2>
            <p className="text-sm leading-relaxed mb-2">
              We use the information we collect to:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              <li>Provide, maintain, and improve our services</li>
              <li>Personalize your experience on the platform</li>
              <li>Send you updates and notifications</li>
              <li>Protect against fraud and abuse</li>
              <li>Analyze usage patterns to improve our platform</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              3. Information Sharing
            </h2>
            <p className="text-sm leading-relaxed mb-2">
              We do not sell your personal information. We may share your
              information:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              <li>
                With other users as part of the social features (public
                profiles, recordings)
              </li>
              <li>With service providers who help us operate the platform</li>
              <li>When required by law or to protect rights and safety</li>
              <li>In connection with a business transfer or acquisition</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              4. Data Security
            </h2>
            <p className="text-sm leading-relaxed">
              We implement appropriate technical and organizational measures to
              protect your personal information. However, no method of
              transmission over the internet is 100% secure.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              5. Your Rights
            </h2>
            <p className="text-sm leading-relaxed mb-2">
              You have the right to:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              <li>Access your personal information</li>
              <li>Update or correct your information</li>
              <li>Delete your account and associated data</li>
              <li>Opt-out of certain data collection</li>
              <li>Export your data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              6. Cookies and Tracking
            </h2>
            <p className="text-sm leading-relaxed">
              We use cookies and similar technologies to track activity on our
              platform and store certain information. You can control cookies
              through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              7. Children's Privacy
            </h2>
            <p className="text-sm leading-relaxed">
              Our platform is not intended for users under the age of 13. We do
              not knowingly collect information from children under 13.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              8. Changes to Privacy Policy
            </h2>
            <p className="text-sm leading-relaxed">
              We may update this Privacy Policy from time to time. We will
              notify you of any changes by posting the new policy on this page.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              9. Contact Us
            </h2>
            <p className="text-sm leading-relaxed">
              If you have questions about this Privacy Policy, please contact us
              through our support channels.
            </p>
          </section>
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)] rounded-lg font-medium transition-colors"
          >
            I Understand
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
