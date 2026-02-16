import { Clock, Bus, Briefcase } from 'lucide-react';
import type { Profile } from '@/lib/types';

interface Props {
  profile: Profile;
}

const transportLabels: Record<string, string> = {
  walk: '🚶 Walking',
  public: '🚌 Public transit',
  car: '🚗 Car',
  mixed: '🔀 Mixed',
};

export default function BalancingBadge({ profile }: Props) {
  const items: { icon: typeof Clock; text: string }[] = [];

  if (profile.constraints.timePerWeekHours) {
    items.push({
      icon: Clock,
      text: `${profile.constraints.timePerWeekHours}h/week`,
    });
  }

  if (profile.constraints.transportation) {
    items.push({
      icon: Bus,
      text: transportLabels[profile.constraints.transportation] || profile.constraints.transportation,
    });
  }

  if (profile.constraints.responsibilities && profile.constraints.responsibilities !== 'none') {
    items.push({
      icon: Briefcase,
      text: profile.constraints.responsibilities,
    });
  }

  if (items.length === 0) return null;

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2">
        What you're balancing
      </p>
      <div className="flex flex-wrap gap-2">
        {items.map((item, i) => (
          <span
            key={i}
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1 text-xs text-secondary-foreground"
          >
            <item.icon className="w-3 h-3" />
            {item.text}
          </span>
        ))}
      </div>
    </div>
  );
}
