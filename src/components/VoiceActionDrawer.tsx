import { useState } from 'react'
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle } from './ui/drawer'
import { Button } from './ui/button'
import { AudioRecorder } from './AudioRecorder'
import { Mic, ArrowLeft } from 'lucide-react'

interface VoiceActionDrawerProps {
  isOpen: boolean
  onClose: () => void
  onUploadSuccess: () => void
}

type DrawerView = 'menu' | 'record'

export function VoiceActionDrawer({ isOpen, onClose, onUploadSuccess }: VoiceActionDrawerProps) {
  const [currentView, setCurrentView] = useState<DrawerView>('menu')

  const handleClose = () => {
    setCurrentView('menu')
    onClose()
  }

  const handleBack = () => {
    setCurrentView('menu')
  }

  const handleRecordClick = () => {
    setCurrentView('record')
  }

  const handleUploadSuccessInternal = () => {
    handleClose()
    onUploadSuccess()
  }

  return (
    <>
      <Drawer open={isOpen} onOpenChange={handleClose}>
        <DrawerContent className="bg-[var(--color-bg-card)] border-t border-[var(--color-border)] max-h-[90vh]">
          <div className="max-w-2xl mx-auto w-full">
            {/* Header */}
            <DrawerHeader className="pb-2">
              <div className="flex items-center gap-3">
                {currentView !== 'menu' && (
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={handleBack}
                    className="text-[var(--color-text-tertiary)] hover:text-[var(--color-text-primary)]"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </Button>
                )}
                <DrawerTitle className="text-[var(--color-text-primary)] text-base">
                  {currentView === 'menu' && 'Record Your Voice'}
                  {currentView === 'record' && 'Recording'}
                </DrawerTitle>
              </div>
            </DrawerHeader>

            {/* Content */}
            <div className="px-4 pb-4 overflow-y-auto max-h-[calc(90vh-80px)]">
              {currentView === 'menu' && (
                <div className="py-2">
                  {/* Record Option */}
                  <button
                    onClick={handleRecordClick}
                    className="w-full group"
                  >
                    <div className="bg-[var(--color-bg-secondary)] hover:bg-[var(--color-bg-elevated)] border border-[var(--color-border)] hover:border-[var(--color-accent)] rounded-2xl p-5 transition-all duration-200">
                      <div className="flex items-center gap-4">
                        {/* Icon */}
                        <div className="w-12 h-12 rounded-xl bg-[var(--color-btn-primary)] flex items-center justify-center group-hover:scale-105 transition-transform">
                          <Mic className="w-6 h-6 text-[var(--color-btn-primary-text)]" fill="var(--color-btn-primary-text)" />
                        </div>

                        {/* Text */}
                        <div className="flex-1 text-left">
                          <h3 className="text-base font-semibold text-[var(--color-text-primary)] mb-0.5">
                            Start Recording
                          </h3>
                          <p className="text-sm text-[var(--color-text-tertiary)]">
                            Record and share your voice
                          </p>
                        </div>

                        {/* Arrow */}
                        <div className="text-[var(--color-text-muted)] group-hover:text-[var(--color-text-secondary)] transition-colors">
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </div>
                    </div>
                  </button>
                </div>
              )}

              {currentView === 'record' && (
                <AudioRecorder onUploadSuccess={handleUploadSuccessInternal} />
              )}
            </div>
          </div>
        </DrawerContent>
      </Drawer>
    </>
  )
}
