import { X } from 'lucide-react'

interface AvatarPickerProps {
  isOpen: boolean
  onClose: () => void
  onSelect: (avatarUrl: string) => void
  currentAvatar: string
}

// List of seed names for dicebear avatars
const AVATAR_SEEDS = [
  'Aneka', 'Felix', 'Luis', 'Mia', 'Oliver', 'Sophie', 'Emma', 'Jack',
  'Isabella', 'Mason', 'Ava', 'Liam', 'Charlotte', 'Noah', 'Amelia', 'Ethan',
  'Harper', 'Lucas', 'Evelyn', 'Benjamin', 'Abigail', 'Henry', 'Emily', 'Alexander',
  'Elizabeth', 'Sebastian', 'Sofia', 'William', 'Avery', 'James', 'Ella', 'Daniel',
  'Scarlett', 'Matthew', 'Grace', 'Joseph', 'Chloe', 'Samuel', 'Victoria', 'David',
  'Riley', 'Carter', 'Aria', 'Wyatt', 'Lily', 'Jayden', 'Aubrey', 'John', 'Zoey'
]

const AVATAR_STYLE = 'micah'
const DICEBEAR_VERSION = '9.x'

export function AvatarPicker({ isOpen, onClose, onSelect, currentAvatar }: AvatarPickerProps) {
  if (!isOpen) return null

  const getAvatarUrl = (seed: string) => {
    return `https://api.dicebear.com/${DICEBEAR_VERSION}/${AVATAR_STYLE}/svg?seed=${seed}`
  }

  const handleSelect = (seed: string) => {
    const avatarUrl = getAvatarUrl(seed)
    onSelect(avatarUrl)
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-[var(--color-bg-primary)]/90 backdrop-blur-sm cursor-pointer"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-[var(--color-bg-card)] rounded-2xl border border-[var(--color-border)] shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[var(--color-border)]">
          <h2 className="text-2xl font-bold text-[var(--color-text-primary)]">
            Choose Your Avatar
          </h2>
          <button
            onClick={onClose}
            className="w-10 h-10 rounded-full bg-[var(--color-bg-card-hover)] hover:bg-[var(--color-bg-elevated)] flex items-center justify-center transition-colors"
          >
            <X className="w-5 h-5 text-[var(--color-text-primary)]" />
          </button>
        </div>

        {/* Avatar Grid */}
        <div className="overflow-y-auto p-6">
          <div className="grid grid-cols-4 sm:grid-cols-6 md:grid-cols-8 gap-4">
            {AVATAR_SEEDS.map((seed) => {
              const avatarUrl = getAvatarUrl(seed)
              const isSelected = currentAvatar.includes(seed)

              return (
                <button
                  key={seed}
                  onClick={() => handleSelect(seed)}
                  className={`relative aspect-square rounded-xl overflow-hidden transition-all hover:scale-110 ${
                    isSelected
                      ? 'ring-4 ring-[var(--color-btn-primary)] scale-105'
                      : 'ring-2 ring-[var(--color-border)] hover:ring-[var(--color-text-tertiary)]'
                  }`}
                  title={seed}
                >
                  <img
                    src={avatarUrl}
                    alt={seed}
                    className="w-full h-full object-cover"
                  />
                  {isSelected && (
                    <div className="absolute inset-0 bg-[var(--color-btn-primary)]/20 flex items-center justify-center">
                      <div className="w-8 h-8 rounded-full bg-[var(--color-btn-primary)] flex items-center justify-center">
                        <span className="text-[var(--color-btn-primary-text)] text-lg">✓</span>
                      </div>
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-[var(--color-border)] flex justify-between items-center">
          <p className="text-sm text-[var(--color-text-tertiary)]">
            Powered by <a href="https://www.dicebear.com" target="_blank" rel="noopener noreferrer" className="text-[var(--color-text-primary)] hover:underline">DiceBear</a>
          </p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-[var(--color-btn-secondary)] hover:bg-[var(--color-btn-secondary-hover)] text-[var(--color-btn-secondary-text)] rounded-lg font-medium transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
