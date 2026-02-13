import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/storage';
import { fetchMatchingResources, type Resource } from '@/lib/resourceService';
import { generateLLMPlan } from '@/lib/llmPlanService';
import type { Plan } from '@/lib/types';
import { generatePlanWeeks } from '@/lib/planGenerator';
import { DollarSign, Clock, Star, Check, Loader2, MapPin, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

type Category = 'free' | 'low_cost' | 'paid';
type TimeCategory = 'quick' | 'moderate' | 'intensive';
type DistCategory = 'virtual' | 'nearby' | 'farther';

function costCategory(r: Resource): Category {
  if (r.is_free || r.cost_dollars === 0) return 'free';
  if (r.cost_dollars <= 25) return 'low_cost';
  return 'paid';
}

function timeCategory(r: Resource): TimeCategory {
  if (r.transportation === 'virtual') return 'quick';
  if (['career_program', 'mentorship'].includes(r.category)) return 'intensive';
  return 'moderate';
}

const costLabels: Record<Category, { label: string; icon: typeof DollarSign; desc: string }> = {
  free: { label: 'Free', icon: DollarSign, desc: 'No cost to participate' },
  low_cost: { label: 'Low Cost ($1–$25)', icon: DollarSign, desc: 'Affordable options' },
  paid: { label: 'Paid ($25+)', icon: DollarSign, desc: 'Premium programs' },
};

const timeLabels: Record<TimeCategory, { label: string; icon: typeof Clock; desc: string }> = {
  quick: { label: 'Quick Start', icon: Clock, desc: 'Virtual & easy to begin' },
  moderate: { label: 'Moderate Commitment', icon: Clock, desc: 'Local opportunities' },
  intensive: { label: 'Deep Dive', icon: Clock, desc: 'Career & mentorship programs' },
};

const distLabels: Record<DistCategory, { label: string; desc: string }> = {
  virtual: { label: '🌐 Online / Virtual', desc: 'Access from anywhere' },
  nearby: { label: '📍 Your Neighborhood', desc: 'Matches your ZIP area' },
  farther: { label: '🗺️ Other Areas', desc: 'May require travel' },
};

const MIN_SELECTIONS = 3;
const MAX_SELECTIONS = 12;

export default function Recommendations() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<'cost' | 'time' | 'match' | 'distance'>('match');
  const [generating, setGenerating] = useState(false);
  const [genStatus, setGenStatus] = useState('');

  const profile = user ? storage.allProfiles().find(p => p.userId === user.id) : null;

  useEffect(() => {
    if (!profile) return;
    fetchMatchingResources({
      interests: profile.interests,
      gradeLevel: profile.gradeLevel,
      zipCode: profile.zipCode,
      transportation: profile.constraints.transportation,
      budgetPerMonth: profile.constraints.budgetPerMonth,
    }).then(res => {
      setResources(res);
      setLoading(false);
    });
  }, [!!profile]);

  if (!user) return <Navigate to="/login" />;
  if (!profile) return <Navigate to="/onboarding" />;

  const toggle = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else if (next.size < MAX_SELECTIONS) {
        next.add(id);
      }
      return next;
    });
  };

  const groupResources = () => {
    if (groupBy === 'cost') {
      const groups: Record<Category, Resource[]> = { free: [], low_cost: [], paid: [] };
      resources.forEach(r => groups[costCategory(r)].push(r));
      return Object.entries(groups)
        .filter(([, items]) => items.length > 0)
        .map(([key, items]) => ({
          key,
          label: costLabels[key as Category].label,
          desc: costLabels[key as Category].desc,
          items,
        }));
    }
    if (groupBy === 'time') {
      const groups: Record<TimeCategory, Resource[]> = { quick: [], moderate: [], intensive: [] };
      resources.forEach(r => groups[timeCategory(r)].push(r));
      return Object.entries(groups)
        .filter(([, items]) => items.length > 0)
        .map(([key, items]) => ({
          key,
          label: timeLabels[key as TimeCategory].label,
          desc: timeLabels[key as TimeCategory].desc,
          items,
        }));
    }
    if (groupBy === 'distance') {
      const zip = profile?.zipCode || '';
      const groups: Record<DistCategory, Resource[]> = { virtual: [], nearby: [], farther: [] };
      resources.forEach(r => {
        if (r.transportation === 'virtual') {
          groups.virtual.push(r);
        } else if (r.zip_prefixes.length === 0 || r.zip_prefixes.some(zp => zip.startsWith(zp))) {
          groups.nearby.push(r);
        } else {
          groups.farther.push(r);
        }
      });
      return Object.entries(groups)
        .filter(([, items]) => items.length > 0)
        .map(([key, items]) => ({
          key,
          label: distLabels[key as DistCategory].label,
          desc: distLabels[key as DistCategory].desc,
          items,
        }));
    }
    return [{ key: 'match', label: 'Best Matches For You', desc: 'Ranked by relevance to your profile', items: resources }];
  };

  const confirm = async () => {
    setGenerating(true);
    setGenStatus('Building your personalized plan with AI...');

    try {
      // Try LLM-powered generation first
      const result = await generateLLMPlan(profile, user.id);

      // Also save a local copy for the existing dashboard compatibility
      const localWeeks = result.weeks.map((w, i) => ({
        id: crypto.randomUUID(),
        planId: result.planId,
        weekNumber: w.week,
        focus: w.focus,
        actions: w.actions.map(a => a.task),
        resources: w.actions.map(a => `${a.resource} — ${a.access}`),
        milestones: [w.milestone],
      }));

      const plan: Plan = {
        id: result.planId,
        userId: user.id,
        profileId: profile.id,
        title: `12-Week Plan: ${profile.goals.join(' & ')}`,
        createdAt: new Date().toISOString(),
        weeks: localWeeks,
        pathwayId: profile.pathwayId,
        cycleNumber: 1,
        outcomeStatement: profile.outcomeStatement,
        targetDate: profile.targetDate,
        goalDomain: profile.goalDomain,
      };
      storage.savePlans([...storage.allPlans().filter(p => p.userId !== user.id), plan]);

      // Store the structured weeks separately for the enhanced dashboard
      localStorage.setItem(`gp_structured_weeks_${user.id}`, JSON.stringify(result.weeks));

      toast.success('Your personalized plan is ready!');
      nav('/dashboard');
    } catch (err) {
      console.error('LLM plan generation failed, falling back:', err);
      toast.error('AI generation had an issue — using smart template instead.');

      // Fallback to deterministic generation
      const selectedResources = resources.filter(r => selected.has(r.id));
      const planId = crypto.randomUUID();
      const weeks = generatePlanWeeks(profile, planId, selectedResources);
      const plan: Plan = {
        id: planId, userId: user.id, profileId: profile.id,
        title: '12-Week Game Plan', createdAt: new Date().toISOString(), weeks,
      };
      storage.savePlans([...storage.allPlans().filter(p => p.userId !== user.id), plan]);
      nav('/dashboard');
    } finally {
      setGenerating(false);
      setGenStatus('');
    }
  };

  const canConfirm = selected.size >= MIN_SELECTIONS && selected.size <= MAX_SELECTIONS;

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed bottom-4 right-4 z-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Recommendations</span>
      </div>

      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-5">
          <h1 className="text-xl font-bold text-card-foreground">Pick Your Resources</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Select {MIN_SELECTIONS}–{MAX_SELECTIONS} resources to build your personalized game plan.
          </p>
          <div className="flex items-center gap-3 mt-4 flex-wrap">
            {(['match', 'cost', 'time', 'distance'] as const).map(g => (
              <button
                key={g}
                onClick={() => setGroupBy(g)}
                className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                  groupBy === g ? 'bg-primary text-primary-foreground' : 'border border-border text-muted-foreground hover:bg-secondary'
                }`}
              >
                {g === 'match' && <Star className="w-3.5 h-3.5" />}
                {g === 'cost' && <DollarSign className="w-3.5 h-3.5" />}
                {g === 'time' && <Clock className="w-3.5 h-3.5" />}
                {g === 'distance' && <MapPin className="w-3.5 h-3.5" />}
                {g === 'match' ? 'Best Match' : g === 'cost' ? 'By Cost' : g === 'time' ? 'By Time' : 'By Distance'}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
            <span className="ml-2 text-sm text-muted-foreground">Finding resources for you...</span>
          </div>
        ) : resources.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-muted-foreground">No resources found. Your plan will use AI-recommended resources.</p>
            <button onClick={confirm} className="mt-4 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
              Generate AI Plan
            </button>
          </div>
        ) : (
          <>
            {groupResources().map(group => (
              <div key={group.key}>
                <div className="mb-3">
                  <h2 className="text-sm font-semibold text-card-foreground">{group.label}</h2>
                  <p className="text-xs text-muted-foreground">{group.desc}</p>
                </div>
                <div className="grid gap-3 sm:grid-cols-2">
                  {group.items.map(r => {
                    const isSelected = selected.has(r.id);
                    return (
                      <button
                        key={r.id}
                        onClick={() => toggle(r.id)}
                        className={`relative text-left rounded-xl border p-4 transition-all ${
                          isSelected
                            ? 'border-primary bg-primary/5 ring-1 ring-primary'
                            : 'border-border bg-card hover:border-primary/40 hover:bg-secondary/50'
                        }`}
                      >
                        {isSelected && (
                          <span className="absolute top-3 right-3 flex items-center justify-center w-5 h-5 rounded-full bg-primary text-primary-foreground">
                            <Check className="w-3 h-3" />
                          </span>
                        )}
                        <h3 className="text-sm font-semibold text-card-foreground pr-6">{r.title}</h3>
                        <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{r.description}</p>
                        <div className="flex items-center gap-2 mt-2 flex-wrap">
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                            <DollarSign className="w-3 h-3" />
                            {r.is_free ? 'Free' : `$${r.cost_dollars}`}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-medium text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                            <Clock className="w-3 h-3" />
                            {r.transportation === 'virtual' ? 'Online' : r.transportation}
                          </span>
                          <span className="text-[10px] font-medium text-muted-foreground bg-secondary rounded-full px-2 py-0.5 capitalize">
                            {r.category.replace('_', ' ')}
                          </span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Generating overlay */}
      {generating && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center">
          <div className="text-center space-y-4 p-8">
            <div className="flex items-center justify-center gap-2">
              <Sparkles className="w-6 h-6 text-primary animate-pulse" />
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
            <p className="text-lg font-semibold text-foreground">{genStatus}</p>
            <p className="text-sm text-muted-foreground">This usually takes 15–30 seconds.</p>
          </div>
        </div>
      )}

      {/* Sticky footer */}
      {resources.length > 0 && !generating && (
        <div className="sticky bottom-0 border-t border-border bg-card/95 backdrop-blur-sm">
          <div className="max-w-4xl mx-auto px-6 py-3 flex items-center justify-between">
            <p className="text-sm text-muted-foreground">
              <span className={`font-semibold ${canConfirm ? 'text-primary' : 'text-destructive'}`}>{selected.size}</span> selected
              {selected.size < MIN_SELECTIONS && <span className="text-xs ml-1">(pick at least {MIN_SELECTIONS})</span>}
              {selected.size >= MAX_SELECTIONS && <span className="text-xs ml-1">(max reached)</span>}
            </p>
            <button
              disabled={!canConfirm || generating}
              onClick={confirm}
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              <Sparkles className="w-4 h-4" />
              {generating ? 'Generating Plan...' : 'Build My AI Game Plan →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
