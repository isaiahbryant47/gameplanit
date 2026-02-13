import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/storage';
import { fetchMatchingResources, type Resource } from '@/lib/resourceService';
import { generatePlanWeeks } from '@/lib/planGenerator';
import type { Plan } from '@/lib/types';
import { DollarSign, Clock, Star, Check, Loader2 } from 'lucide-react';

type Category = 'free' | 'low_cost' | 'paid';
type TimeCategory = 'quick' | 'moderate' | 'intensive';

function costCategory(r: Resource): Category {
  if (r.is_free || r.cost_dollars === 0) return 'free';
  if (r.cost_dollars <= 25) return 'low_cost';
  return 'paid';
}

function timeCategory(r: Resource): TimeCategory {
  // Heuristic: virtual/online = quick, local = moderate, career programs = intensive
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

const MIN_SELECTIONS = 3;
const MAX_SELECTIONS = 12;

export default function Recommendations() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [resources, setResources] = useState<Resource[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [groupBy, setGroupBy] = useState<'cost' | 'time' | 'match'>('match');
  const [generating, setGenerating] = useState(false);

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
    // match: top match as single group
    return [{ key: 'match', label: 'Best Matches For You', desc: 'Ranked by relevance to your profile', items: resources }];
  };

  const confirm = async () => {
    setGenerating(true);
    const selectedResources = resources.filter(r => selected.has(r.id));
    const planId = crypto.randomUUID();
    const weeks = generatePlanWeeks(profile, planId, selectedResources);
    const plan: Plan = {
      id: planId, userId: user.id, profileId: profile.id,
      title: '12-Week Game Plan', createdAt: new Date().toISOString(), weeks,
    };
    storage.savePlans([...storage.allPlans().filter(p => p.userId !== user.id), plan]);
    setGenerating(false);
    nav('/dashboard');
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
          <div className="flex items-center gap-3 mt-4">
            {(['match', 'cost', 'time'] as const).map(g => (
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
                {g === 'match' ? 'Best Match' : g === 'cost' ? 'By Cost' : 'By Time'}
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
            <p className="text-muted-foreground">No resources found. Your plan will use default recommendations.</p>
            <button onClick={() => { nav('/dashboard'); }} className="mt-4 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
              Continue to Dashboard
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

      {/* Sticky footer */}
      {resources.length > 0 && (
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
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              {generating ? 'Generating Plan...' : 'Build My Game Plan →'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
