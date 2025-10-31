import { useState } from 'react';
import { Check } from 'lucide-react';
import { BACKGROUNDS, type Background } from '../constants/backgrounds';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
} from './ui/drawer';
import { Button } from './ui/button';

interface BackgroundPickerProps {
  isOpen: boolean;
  onClose: () => void;
  currentBackgroundId: string | null;
  onSelect: (backgroundId: string) => void;
}

export function BackgroundPicker({
  isOpen,
  onClose,
  currentBackgroundId,
  onSelect
}: BackgroundPickerProps) {
  const [selectedId, setSelectedId] = useState<string | null>(currentBackgroundId);

  const handleSelect = (background: Background) => {
    setSelectedId(background.id);
  };

  const handleConfirm = () => {
    if (selectedId) {
      onSelect(selectedId);
    }
    onClose();
  };

  const handleCancel = () => {
    setSelectedId(currentBackgroundId);
    onClose();
  };

  return (
    <Drawer open={isOpen} onOpenChange={onClose}>
      <DrawerContent className="bg-[var(--color-bg-elevated)]">
        <DrawerHeader>
          <DrawerTitle className="text-[var(--color-text-primary)]">
            Choose Card Background
          </DrawerTitle>
          <DrawerDescription className="text-[var(--color-text-tertiary)]">
            Select a background for your audio cards
          </DrawerDescription>
        </DrawerHeader>

        <div className="px-4 pb-4 overflow-y-auto max-h-[60vh]">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {BACKGROUNDS.map((background) => {
              const isSelected = selectedId === background.id || (!selectedId && background.id === 'none');
              const isNone = background.id === 'none';

              return (
                <button
                  key={background.id}
                  onClick={() => handleSelect(background)}
                  className={`
                    relative aspect-video rounded-lg border-2 transition-all overflow-hidden
                    ${isSelected
                      ? 'border-[var(--color-accent-primary)] ring-2 ring-[var(--color-accent-primary)]/20'
                      : 'border-[var(--color-border)] hover:border-[var(--color-accent-primary)]/50'
                    }
                    ${isNone ? 'bg-[var(--color-bg-card)]' : 'bg-cover bg-center'}
                  `}
                  style={!isNone && background.thumbnailUrl ? {
                    backgroundImage: `url(${background.thumbnailUrl})`
                  } : undefined}
                >
                  {/* Overlay for better text visibility */}
                  {!isNone && (
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-black/20" />
                  )}

                  {/* None background indicator */}
                  {isNone && (
                    <div className="absolute inset-0 flex items-center justify-center">
                      <div className="w-8 h-0.5 bg-[var(--color-text-tertiary)] rotate-45" />
                    </div>
                  )}

                  {/* Background name */}
                  <div className="absolute bottom-1 left-1 right-1 text-center">
                    <span className={`text-xs font-medium ${isNone ? 'text-[var(--color-text-tertiary)]' : 'text-white'}`}>
                      {background.name}
                    </span>
                  </div>

                  {/* Selected check mark */}
                  {isSelected && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-white dark:bg-black rounded-full flex items-center justify-center shadow-lg border border-gray-200 dark:border-gray-700">
                      <Check className="w-4 h-4 text-black dark:text-white stroke-[3]" />
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <DrawerFooter className="border-t border-[var(--color-border)] bg-[var(--color-bg-elevated)]">
          <div className="flex gap-3 w-full">
            <Button
              variant="outline"
              onClick={handleCancel}
              className="flex-1 bg-[var(--color-bg-card)] hover:bg-[var(--color-bg-card-hover)] text-[var(--color-text-primary)] border-[var(--color-border)]"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 bg-[var(--color-btn-primary)] hover:bg-[var(--color-btn-primary-hover)] text-[var(--color-btn-primary-text)]"
            >
              Select
            </Button>
          </div>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
}
