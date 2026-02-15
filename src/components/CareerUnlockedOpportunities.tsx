import { useState, useEffect } from 'react';
import type { UserCareerUnlock, CareerUnlockRule, OpportunityType } from '@/lib/types';
import { fetchUserUnlocks, fetchUnlockRules, markOpportunitySeen, markOpportunityAccepted, getUnlockReason } from '@/lib/unlockService';
import { getDifficultyTier } from '@/lib/readinessEngine';
import { Trophy, ExternalLink, ChevronDown, ChevronUp, Briefcase, GraduationCap, Award, BookOpen, Calendar, Swords, Check, Eye, Star } from 'lucide-react';

interface Props {
  userId: string;
  careerPathId?: string;
  completionRate: number;
  cycleNumber: number;
  overallReadinessScore?: number;
}

const typeConfig: Record<OpportunityType, { label: string; icon: typeof Briefcase; color: string }> = {
  internship: { label: 'Internship', icon: Briefcase, color: 'text-blue-600 bg-blue-100 dark:text-blue-400 dark:bg-blue-900/30' },
  scholarship: { label: 'Scholarship', icon: GraduationCap, color: 'text-amber-600 bg-amber-100 dark:text-amber-400 dark:bg-amber-900/30' },
  program: { label: 'Program', icon: BookOpen, color: 'text-emerald-600 bg-emerald-100 dark:text-emerald-400 dark:bg-emerald-900/30' },
  certification: { label: 'Certification', icon: Award, color: 'text-purple-600 bg-purple-100 dark:text-purple-400 dark:bg-purple-900/30' },
  event: { label: 'Event', icon: Calendar, color: 'text-rose-600 bg-rose-100 dark:text-rose-400 dark:bg-rose-900/30' },
  competition: { label: 'Competition', icon: Swords, color: 'text-orange-600 bg-orange-100 dark:text-orange-400 dark:bg-orange-900/30' },
};

export default function CareerUnlockedOpportunities({ userId, careerPathId, completionRate, cycleNumber, overallReadinessScore = 0 }: Props) {
  const [unlocks, setUnlocks] = useState<UserCareerUnlock[]>([]);
  const [rules, setRules] = useState<CareerUnlockRule[]>([]);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;
    fetchUserUnlocks(userId).then(async (data) => {
      setUnlocks(data);
      if (data.length > 0) {
        const ruleData = await fetchUnlockRules(data.map(u => u.opportunityId));
        setRules(ruleData);
      }
      setLoading(false);
    });
  }, [userId]);

  if (loading) return null;
  if (unlocks.length === 0) return null;

  const unseenCount = unlocks.filter(u => !u.seen).length;

  const userTier = getDifficultyTier(overallReadinessScore);

  // Sort: unseen first, then emphasized (within tier), then by difficulty
  const sorted = [...unlocks].sort((a, b) => {
    if (!a.seen && b.seen) return -1;
    if (a.seen && !b.seen) return 1;
    const aEmphasized = (a.opportunity?.difficultyLevel || 1) <= userTier;
    const bEmphasized = (b.opportunity?.difficultyLevel || 1) <= userTier;
    if (aEmphasized && !bEmphasized) return -1;
    if (!aEmphasized && bEmphasized) return 1;
    return (b.opportunity?.difficultyLevel || 0) - (a.opportunity?.difficultyLevel || 0);
  });

  return (
    <div className="rounded-xl border border-primary/20 bg-card p-5 space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Trophy className="w-5 h-5 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Unlocked Opportunities</h3>
          {unseenCount > 0 && (
            <span className="inline-flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold">
              {unseenCount}
            </span>
          )}
        </div>
        <span className="text-xs text-muted-foreground">{unlocks.length} unlocked</span>
      </div>

      <div className="space-y-2">
        {sorted.map(unlock => {
          const opp = unlock.opportunity;
          if (!opp) return null;
          const cfg = typeConfig[opp.type] || typeConfig.program;
          const TypeIcon = cfg.icon;
          const oppRules = rules.filter(r => r.opportunityId === opp.id);
          const reason = getUnlockReason(oppRules, cycleNumber, completionRate);
          const isExpanded = expandedId === unlock.id;

          return (
            <div
              key={unlock.id}
              className={`rounded-lg border transition-colors ${!unlock.seen ? 'border-primary/40 bg-primary/5' : 'border-border bg-card'}`}
            >
              <button
                onClick={async () => {
                  if (!unlock.seen) {
                    await markOpportunitySeen(unlock.id);
                    setUnlocks(prev => prev.map(u => u.id === unlock.id ? { ...u, seen: true } : u));
                  }
                  setExpandedId(prev => prev === unlock.id ? null : unlock.id);
                }}
                className="w-full px-4 py-3 flex items-center gap-3 text-left"
              >
                <span className={`inline-flex items-center justify-center w-8 h-8 rounded-lg ${cfg.color}`}>
                  <TypeIcon className="w-4 h-4" />
                </span>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h4 className="text-sm font-semibold text-card-foreground truncate">{opp.title}</h4>
                    {!unlock.seen && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold text-primary-foreground uppercase">New</span>
                    )}
                    {unlock.accepted && (
                      <span className="inline-flex items-center gap-0.5 rounded-full bg-success/20 px-1.5 py-0.5 text-[9px] font-bold text-success uppercase">
                        <Check className="w-2.5 h-2.5" /> Applied
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{opp.description}</p>
                </div>
                <div className="flex items-center gap-2">
                  <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium ${cfg.color}`}>
                    {cfg.label}
                  </span>
                  {isExpanded ? <ChevronUp className="w-4 h-4 text-muted-foreground" /> : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                </div>
              </button>

              {isExpanded && (
                <div className="px-4 pb-4 space-y-3 border-t border-border pt-3">
                  <p className="text-xs text-primary/80 italic">{reason}</p>
                  <p className="text-sm text-card-foreground">{opp.description}</p>

                  {opp.nextActionInstructions && (
                    <div className="rounded-lg bg-secondary/50 p-3">
                      <h5 className="text-xs font-semibold text-card-foreground mb-1">📋 Next Steps</h5>
                      <p className="text-xs text-muted-foreground whitespace-pre-line">{opp.nextActionInstructions}</p>
                    </div>
                  )}

                  <div className="flex items-center gap-2">
                    {opp.externalUrl && (
                      <a
                        href={opp.externalUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:opacity-90 transition-opacity"
                      >
                        <ExternalLink className="w-3.5 h-3.5" />
                        {opp.nextActionLabel}
                      </a>
                    )}
                    {!unlock.accepted && (
                      <button
                        onClick={async () => {
                          await markOpportunityAccepted(unlock.id);
                          setUnlocks(prev => prev.map(u => u.id === unlock.id ? { ...u, accepted: true, seen: true } : u));
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-primary px-4 py-2 text-xs font-medium text-primary hover:bg-primary/10 transition-colors"
                      >
                        <Check className="w-3.5 h-3.5" />
                        Mark as Applied / Started
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
