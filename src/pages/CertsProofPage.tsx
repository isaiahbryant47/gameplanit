import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/storage';
import DashboardLayout from '@/components/DashboardLayout';
import ReadinessSnapshot from '@/components/ReadinessSnapshot';
import { Award, FolderOpen, CheckCircle2, Star, FileText } from 'lucide-react';
import { useState, useEffect, useMemo } from 'react';
import { recalculateReadiness, type ReadinessExplanation } from '@/lib/readinessEngine';
import type { StructuredWeek } from '@/lib/llmPlanService';

export default function CertsProofPage() {
  const { user } = useAuth();
  const [readinessData, setReadinessData] = useState<ReadinessExplanation | null>(null);

  const profile = user ? storage.allProfiles().find(p => p.userId === user.id) : undefined;
  const plan = user ? storage.allPlans().find(p => p.userId === user.id) : undefined;
  const progress = user ? storage.getProgress(user.id) : { completedActions: {} as Record<string, boolean>, resourcesEngaged: [] as string[], academicLog: [] as any[], completedGoals: {} as Record<string, string> };

  const careerPathId = profile?.careerPathId || (plan as any)?.careerPathId;
  const cycleNumber = plan?.cycleNumber || 1;

  const structuredWeeks: StructuredWeek[] = useMemo(() => {
    if (!user) return [];
    try {
      const raw = localStorage.getItem(`gp_structured_weeks_${user.id}`);
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }, [user?.id]);

  const proofActions = useMemo(() => {
    const items: { task: string; resource: string; weekNum: number; done: boolean }[] = [];
    structuredWeeks.forEach(sw => {
      const planWeek = plan?.weeks.find(w => w.weekNumber === sw.week);
      sw.actions.forEach((a, i) => {
        const pillar = (a.pillar || '').toLowerCase();
        if (pillar.includes('proof') || pillar.includes('portfolio')) {
          const done = planWeek ? !!progress.completedActions[`${planWeek.id}-${i}`] : false;
          items.push({ task: a.task, resource: a.resource, weekNum: sw.week, done });
        }
      });
    });
    return items;
  }, [structuredWeeks, plan, progress]);

  const completedMilestones = useMemo(() => {
    if (!plan) return [];
    return plan.weeks
      .filter(w => {
        const allDone = w.actions.every((_, i) => progress.completedActions[`${w.id}-${i}`]);
        return allDone && w.actions.length > 0;
      })
      .map(w => ({ weekNumber: w.weekNumber, milestone: w.milestones[0] || `Week ${w.weekNumber} complete` }));
  }, [plan, progress]);

  useEffect(() => {
    if (!user || !careerPathId) return;
    const totalActions = plan?.weeks.reduce((s, w) => s + w.actions.length, 0) || 0;
    const completedCount = plan?.weeks.reduce((s, w) =>
      s + w.actions.filter((_, i) => progress.completedActions[`${w.id}-${i}`]).length, 0
    ) || 0;
    recalculateReadiness({
      userId: user.id,
      careerPathId,
      cycleNumber,
      pillarMilestoneRates: {},
      overallMilestoneRate: totalActions > 0 ? Math.round((completedCount / totalActions) * 100) : 0,
      acceptedOpportunityPillars: [],
    }).then(setReadinessData);
  }, [user?.id, careerPathId, cycleNumber]);

  if (!user) return <Navigate to="/login" />;

  return (
    <DashboardLayout title="Certs & Proof">
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-card-foreground">Certifications & Proof of Work</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Track your portfolio pieces, certifications, and milestones. This is the proof that shows you're ready.
        </p>
      </div>

      <ReadinessSnapshot readinessData={readinessData} />

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Milestones Achieved</h3>
          <span className="ml-auto text-xs text-muted-foreground">{completedMilestones.length} earned</span>
        </div>
        {completedMilestones.length > 0 ? (
          <div className="space-y-2">
            {completedMilestones.map((m, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-success/5 border border-success/20 p-3">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                <div>
                  <p className="text-sm font-medium text-card-foreground">{m.milestone}</p>
                  <p className="text-[11px] text-muted-foreground">Week {m.weekNumber}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Complete all actions in a week to earn milestones.</p>
        )}
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Portfolio Building Activities</h3>
        </div>
        {proofActions.length > 0 ? (
          <div className="space-y-2">
            {proofActions.map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  item.done ? 'border-success/20 bg-success/5' : 'border-border'
                }`}
              >
                {item.done ? (
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div>
                  <p className={`text-sm ${item.done ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}>
                    {item.task}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Week {item.weekNum} · {item.resource}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Portfolio activities from your plan will appear here.</p>
        )}
      </div>
    </DashboardLayout>
  );
}
