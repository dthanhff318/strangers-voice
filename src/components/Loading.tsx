import { Spinner, type SpinnerProps } from '@/components/ui/shadcn-io/spinner';

interface LoadingProps {
  variant?: SpinnerProps['variant'];
  label?: string;
  size?: number;
  className?: string;
}

export function Loading({
  variant = 'ring',
  label,
  size = 24,
  className = '',
}: LoadingProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-4 ${className}`}
    >
      <Spinner variant={variant} size={size} />
      {label && (
        <span className="font-mono text-muted-foreground text-xs">
          {label}
        </span>
      )}
    </div>
  );
}
