import { BadgeCheck } from "lucide-react";

interface PlanBadgeProps {
  plan?: {
    badge_color: string;
  } | null;
  size?: number;
}

export function PlanBadge({ plan, size = 16 }: PlanBadgeProps) {
  if (!plan) return null;

  return (
    <BadgeCheck
      className="flex-shrink-0"
      style={{
        color: '#ffffff',
        width: `${size}px`,
        height: `${size}px`
      }}
      fill={plan.badge_color}
    />
  );
}
