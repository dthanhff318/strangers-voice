import { X } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useState } from 'react'
import { Button } from './ui/button'

interface LoginModalProps {
  isOpen: boolean
  onClose: () => void
}

export function LoginModal({ isOpen, onClose }: LoginModalProps) {
  const [loading, setLoading] = useState(false)

  if (!isOpen) return null

  const handleGoogleLogin = async () => {
    try {
      setLoading(true)
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        console.error('Login error:', error)
        alert('Failed to login. Please try again.')
      }
    } catch (error) {
      console.error('Login error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-[var(--color-bg-primary)]/95 backdrop-blur-md z-50 cursor-pointer"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
        <div
          className="bg-[var(--color-bg-card)] rounded-3xl shadow-2xl border border-[var(--color-border)] w-full max-w-md pointer-events-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="relative flex items-center justify-center py-6 border-b border-[var(--color-border)]">
            <h2 className="text-xl font-semibold text-[var(--color-text-primary)]">Welcome to YMelody!</h2>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-4 p-2 text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)] transition-colors rounded-full hover:bg-[var(--color-bg-card-hover)]"
            >
              <X className="w-5 h-5" />
            </Button>
          </div>

          {/* Content */}
          <div className="p-8 space-y-6">
            {/* Logo/Icon Section */}
            <div className="text-center space-y-3">
              <div className="w-20 h-20 mx-auto bg-[var(--color-btn-primary)] rounded-full flex items-center justify-center shadow-lg shadow-[var(--shadow-primary)]">
                <img src="/favicon.png" className="w-12 h-12 logo-invert" alt="YMelody" />
              </div>
              <p className="text-[var(--color-text-tertiary)] text-sm">
                Share your voice, connect with the world
              </p>
            </div>

            {/* Google Login Button */}
            <Button
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)] font-semibold py-4 px-6 rounded-xl transition-all duration-200 flex items-center justify-center gap-3 shadow-lg hover:shadow-xl hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-[var(--color-text-muted)] border-t-[var(--color-btn-primary-text)] rounded-full animate-spin" />
              ) : (
                <>
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                    />
                  </svg>
                  <span>Continue with Google</span>
                </>
              )}
            </Button>

            {/* Divider */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-[var(--color-border)]"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-4 text-[var(--color-text-muted)] bg-[var(--color-bg-card)]">Why sign in?</span>
              </div>
            </div>

            {/* Benefits */}
            <div className="space-y-3 text-sm text-[var(--color-text-tertiary)]">
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[var(--color-text-primary)] text-xs">✓</span>
                </div>
                <span>Record and share your audio stories</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[var(--color-text-primary)] text-xs">✓</span>
                </div>
                <span>Like and interact with others</span>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-5 h-5 rounded-full bg-[var(--color-accent-subtle)] flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-[var(--color-text-primary)] text-xs">✓</span>
                </div>
                <span>Build your voice community</span>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-8 py-6 border-t border-[var(--color-border)] text-center">
            <p className="text-xs text-[var(--color-text-muted)]">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </div>
        </div>
      </div>
    </>
  )
}
