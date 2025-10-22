import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from './ui/dialog'
import { Button } from './ui/button'

interface TermsOfServiceModalProps {
  isOpen: boolean
  onClose: () => void
}

export function TermsOfServiceModal({ isOpen, onClose }: TermsOfServiceModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-[var(--color-bg-card)] border-[var(--color-border)] max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-[var(--color-text-primary)]">
            Terms of Service
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6 text-[var(--color-text-secondary)] mt-4">
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Last updated: January 2025
          </p>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              1. Acceptance of Terms
            </h2>
            <p className="text-sm leading-relaxed">
              By accessing and using YMelody, you accept and agree to be bound by these Terms of Service.
              If you do not agree to these terms, please do not use our platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              2. User Accounts
            </h2>
            <p className="text-sm leading-relaxed mb-2">
              You are responsible for:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              <li>Maintaining the confidentiality of your account</li>
              <li>All activities that occur under your account</li>
              <li>Providing accurate and complete information</li>
              <li>Updating your information to keep it accurate</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              3. Content Guidelines
            </h2>
            <p className="text-sm leading-relaxed mb-2">
              You agree not to upload, post, or share content that:
            </p>
            <ul className="list-disc list-inside text-sm space-y-1 ml-4">
              <li>Is illegal, harmful, threatening, abusive, or harassing</li>
              <li>Violates intellectual property rights</li>
              <li>Contains hate speech or discrimination</li>
              <li>Is sexually explicit or pornographic</li>
              <li>Promotes violence or illegal activities</li>
              <li>Contains spam or malicious code</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              4. Intellectual Property
            </h2>
            <p className="text-sm leading-relaxed mb-2">
              By uploading voice recordings to YMelody, you grant us a non-exclusive, worldwide,
              royalty-free license to use, reproduce, and distribute your content on the platform.
            </p>
            <p className="text-sm leading-relaxed">
              You retain all rights to your content and can delete it at any time.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              5. Privacy
            </h2>
            <p className="text-sm leading-relaxed">
              Your privacy is important to us. Please review our Privacy Policy to understand how we
              collect, use, and protect your personal information.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              6. Termination
            </h2>
            <p className="text-sm leading-relaxed">
              We reserve the right to suspend or terminate your account at any time for violations of
              these terms or for any other reason we deem necessary to protect our platform and users.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              7. Limitation of Liability
            </h2>
            <p className="text-sm leading-relaxed">
              YMelody is provided "as is" without warranties of any kind. We are not liable for any
              damages arising from your use of the platform.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              8. Changes to Terms
            </h2>
            <p className="text-sm leading-relaxed">
              We may update these terms from time to time. Continued use of the platform after changes
              constitutes acceptance of the new terms.
            </p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              9. Contact
            </h2>
            <p className="text-sm leading-relaxed">
              If you have questions about these Terms of Service, please contact us through our support channels.
            </p>
          </section>
        </div>

        <div className="mt-6 pt-4 border-t border-[var(--color-border)] flex justify-end">
          <Button
            onClick={onClose}
            className="px-6 py-2 bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)] rounded-lg font-medium transition-colors"
          >
            I Understand
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}
