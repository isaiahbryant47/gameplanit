import { useState, useEffect } from 'react';
import { fetchOpportunitiesForPathway, checkOpportunityUnlock } from '@/lib/pathwayService';
import type { Opportunity } from '@/lib/types';
import { Unlock, ExternalLink, Lock, Sparkles } from 'lucide-react';

interface Props {
  pathwayId: string;
  completionRate: number;
  cycleNumber: number;
}

export default function UnlockedOpportunities({ pathwayId, completionRate, cycleNumber }: Props) {
  const [items, setItems] = useState<{ opportunity: Opportunity; unlocked: boolean; rule: any }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOpportunitiesForPathway(pathwayId).then(results => {
      setItems(results.map(r => ({
        opportunity: r.opportunity,
        unlocked: checkOpportunityUnlock(r.unlockRule, completionRate, cycleNumber),
        rule: r.unlockRule,
      })));
      setLoading(false);
    });
  }, [pathwayId, completionRate, cycleNumber]);

  if (loading || items.length === 0) return null;

  const unlocked = items.filter(i => i.unlocked);
  const locked = items.filter(i => !i.unlocked);

  return (
    <div className="space-y-4">
      {unlocked.length > 0 && (
        <div className="rounded-xl border border-primary/30 bg-primary/5 p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-card-foreground">Unlocked Opportunities</h3>
          </div>
          <div className="grid gap-2 sm:grid-cols-2">
            {unlocked.map(({ opportunity: opp }) => (
              <div key={opp.id} className="rounded-lg border border-primary/20 bg-card p-3 space-y-2">
                <div className="flex items-center gap-2">
                  <Unlock className="w-3.5 h-3.5 text-primary" />
                  <h4 className="text-sm font-semibold text-card-foreground">{opp.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{opp.description}</p>
                {opp.next_step_url ? (
                  <a
                    href={opp.next_step_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                  >
                    {opp.next_step_cta_label} <ExternalLink className="w-3 h-3" />
                  </a>
                ) : (
                  <span className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground">
                    {opp.next_step_cta_label}
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {locked.length > 0 && (
        <div className="rounded-xl border border-border bg-card p-5 space-y-3">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-muted-foreground" />
            <h3 className="text-sm font-semibold text-muted-foreground">Coming Up</h3>
          </div>
          <div className="space-y-2">
            {locked.map(({ opportunity: opp, rule }) => (
              <div key={opp.id} className="rounded-lg border border-border bg-secondary/30 p-3 opacity-70">
                <h4 className="text-sm font-medium text-card-foreground">{opp.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">
                  {rule.min_rate
                    ? `Complete ${Math.round(rule.min_rate * 100)}% of milestones to unlock`
                    : 'Complete this cycle to unlock'}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
