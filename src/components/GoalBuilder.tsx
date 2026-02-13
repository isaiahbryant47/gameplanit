import { useState, useEffect } from 'react';
import { scoreGoalClarity, buildGoalFromStructured, clarityMessage, CLARITY_THRESHOLD, type StructuredGoal, type GoalClarityResult } from '@/lib/goalClarity';
import { Target, Sparkles, ChevronRight, ChevronLeft, Lightbulb, CheckCircle2 } from 'lucide-react';

interface Props {
  interests: string[];
  gradeLevel: string;
  initialGoals: string;
  onGoalsChange: (goals: string) => void;
}

const GUIDED_STEPS = [
  { key: 'area' as const, question: 'What subject or area is this goal about?', placeholder: 'e.g., Math, getting an internship, college prep', hint: 'Pick the main thing you want to work on.' },
  { key: 'currentLevel' as const, question: 'Where are you right now?', placeholder: 'e.g., C+ in Algebra, no work experience yet', hint: 'No judgment — this helps us meet you where you are.' },
  { key: 'targetOutcome' as const, question: 'What result do you want?', placeholder: 'e.g., Raise my grade to a B, land 1 interview', hint: 'Be as specific as you can — numbers help!' },
  { key: 'timeline' as const, question: 'By when do you want to reach this?', placeholder: 'e.g., End of this semester, in 8 weeks', hint: 'A deadline helps us pace your plan.' },
  { key: 'motivation' as const, question: 'Why does this matter to you?', placeholder: 'e.g., I want to make my family proud, I need this for college apps', hint: 'This is just for you. It helps us keep your plan meaningful.' },
];

type GoalMode = 'quick' | 'guided';

export default function GoalBuilder({ interests, gradeLevel, initialGoals, onGoalsChange }: Props) {
  const [mode, setMode] = useState<GoalMode>('quick');
  const [quickGoal, setQuickGoal] = useState(initialGoals);
  const [guidedStep, setGuidedStep] = useState(0);
  const [structured, setStructured] = useState<StructuredGoal>({ area: '', currentLevel: '', targetOutcome: '', timeline: '', motivation: '' });
  const [clarity, setClarity] = useState<GoalClarityResult | null>(null);
  const [showSmart, setShowSmart] = useState(false);
  const [goals, setGoals] = useState<string[]>(initialGoals ? initialGoals.split(',').map(s => s.trim()).filter(Boolean) : []);

  // Score whenever quick goal changes
  useEffect(() => {
    if (mode === 'quick' && quickGoal.trim()) {
      const result = scoreGoalClarity(quickGoal, { gradeLevel, interests });
      setClarity(result);
      if (result.isVague && result.smartGoal) setShowSmart(true);
      else setShowSmart(false);
    } else {
      setClarity(null);
      setShowSmart(false);
    }
  }, [quickGoal, mode, gradeLevel, interests]);

  // Sync goals up
  useEffect(() => {
    onGoalsChange(goals.join(', '));
  }, [goals, onGoalsChange]);

  const addQuickGoal = () => {
    if (!quickGoal.trim()) return;
    setGoals(prev => [...prev, quickGoal.trim()]);
    setQuickGoal('');
    setClarity(null);
  };

  const acceptSmart = () => {
    if (clarity?.smartGoal) {
      setQuickGoal(clarity.smartGoal);
      setShowSmart(false);
    }
  };

  const finishGuided = () => {
    const built = buildGoalFromStructured(structured);
    if (built.trim()) {
      setGoals(prev => [...prev, built]);
      setStructured({ area: '', currentLevel: '', targetOutcome: '', timeline: '', motivation: '' });
      setGuidedStep(0);
      setMode('quick');
    }
  };

  const removeGoal = (idx: number) => setGoals(prev => prev.filter((_, i) => i !== idx));

  const currentStep = GUIDED_STEPS[guidedStep];
  const msg = clarity ? clarityMessage(clarity.score) : null;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Your Goals</label>
        <div className="flex gap-1">
          <button
            onClick={() => setMode('quick')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${mode === 'quick' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            Quick entry
          </button>
          <button
            onClick={() => setMode('guided')}
            className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${mode === 'guided' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}
          >
            Guide me
          </button>
        </div>
      </div>

      {/* Existing goals */}
      {goals.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {goals.map((g, i) => {
            const s = scoreGoalClarity(g, { gradeLevel, interests });
            return (
              <div key={i} className="group flex items-center gap-2 rounded-lg border border-border bg-secondary/50 px-3 py-2 text-sm">
                <div className={`w-2 h-2 rounded-full ${s.score >= 75 ? 'bg-success' : s.score >= CLARITY_THRESHOLD ? 'bg-warning' : 'bg-destructive'}`} />
                <span className="text-foreground max-w-[280px] truncate">{g}</span>
                <button onClick={() => removeGoal(i)} className="text-muted-foreground hover:text-destructive text-xs opacity-0 group-hover:opacity-100 transition-opacity">✕</button>
              </div>
            );
          })}
        </div>
      )}

      {/* Quick entry mode */}
      {mode === 'quick' && (
        <div className="space-y-3">
          <div className="relative">
            <Target className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
            <textarea
              className="w-full rounded-lg border border-input bg-background pl-9 pr-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              rows={2}
              placeholder='e.g., "Raise my Algebra grade from C to B by end of semester"'
              value={quickGoal}
              onChange={e => setQuickGoal(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); addQuickGoal(); } }}
            />
          </div>

          {/* Clarity score bar */}
          {clarity && quickGoal.trim() && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Goal Clarity</span>
                <span className={`text-xs font-bold ${clarity.score >= 75 ? 'text-success' : clarity.score >= CLARITY_THRESHOLD ? 'text-warning' : 'text-destructive'}`}>
                  {clarity.score}/100
                </span>
              </div>
              <div className="h-2 rounded-full bg-secondary overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${clarity.score >= 75 ? 'bg-success' : clarity.score >= CLARITY_THRESHOLD ? 'bg-warning' : 'bg-destructive'}`}
                  style={{ width: `${clarity.score}%` }}
                />
              </div>
              {msg && (
                <p className={`text-xs ${msg.tone === 'great' ? 'text-success' : msg.tone === 'good' ? 'text-warning' : 'text-muted-foreground'}`}>
                  {msg.text}
                </p>
              )}

              {/* Suggestions */}
              {clarity.suggestions.length > 0 && clarity.score < 75 && (
                <div className="rounded-lg border border-border bg-accent/30 p-3 space-y-1.5">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-accent-foreground">
                    <Lightbulb className="w-3.5 h-3.5" />
                    Make it stronger:
                  </div>
                  {clarity.suggestions.map((s, i) => (
                    <p key={i} className="text-xs text-muted-foreground pl-5">• {s}</p>
                  ))}
                </div>
              )}

              {/* SMART expansion */}
              {showSmart && clarity.smartGoal && (
                <div className="rounded-lg border border-primary/30 bg-primary/5 p-3 space-y-2">
                  <div className="flex items-center gap-1.5 text-xs font-medium text-primary">
                    <Sparkles className="w-3.5 h-3.5" />
                    Did you mean something like this?
                  </div>
                  <p className="text-sm text-foreground italic">&ldquo;{clarity.smartGoal}&rdquo;</p>
                  <div className="flex gap-2">
                    <button onClick={acceptSmart} className="text-xs font-medium text-primary hover:underline">Use this version</button>
                    <button onClick={() => setShowSmart(false)} className="text-xs text-muted-foreground hover:underline">No thanks</button>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={addQuickGoal}
              disabled={!quickGoal.trim()}
              className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
            >
              Add Goal
            </button>
            {quickGoal.trim() && clarity && clarity.score < CLARITY_THRESHOLD && (
              <button
                onClick={() => { setMode('guided'); setStructured(s => ({ ...s, area: quickGoal })); }}
                className="rounded-lg border border-primary/30 px-4 py-2 text-sm font-medium text-primary hover:bg-accent transition-colors"
              >
                Help me improve it
              </button>
            )}
          </div>
        </div>
      )}

      {/* Guided mode */}
      {mode === 'guided' && (
        <div className="rounded-lg border border-border bg-card p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs text-muted-foreground">Step {guidedStep + 1} of {GUIDED_STEPS.length}</span>
            <div className="flex gap-1">
              {GUIDED_STEPS.map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full transition-colors ${i <= guidedStep ? 'bg-primary' : 'bg-secondary'}`} />
              ))}
            </div>
          </div>

          <div>
            <h4 className="text-sm font-semibold text-card-foreground mb-1">{currentStep.question}</h4>
            <p className="text-xs text-muted-foreground mb-3">{currentStep.hint}</p>
            <input
              className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              placeholder={currentStep.placeholder}
              value={structured[currentStep.key]}
              onChange={e => setStructured({ ...structured, [currentStep.key]: e.target.value })}
              onKeyDown={e => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  if (guidedStep < GUIDED_STEPS.length - 1) setGuidedStep(guidedStep + 1);
                  else finishGuided();
                }
              }}
            />
          </div>

          {/* Preview of built goal */}
          {(structured.area || structured.targetOutcome) && (
            <div className="rounded-lg bg-secondary/50 p-3">
              <p className="text-xs text-muted-foreground mb-1">Your goal so far:</p>
              <p className="text-sm text-foreground">{buildGoalFromStructured(structured)}</p>
              {structured.targetOutcome && structured.timeline && (
                <div className="flex items-center gap-1 mt-2">
                  <CheckCircle2 className="w-3.5 h-3.5 text-success" />
                  <span className="text-xs text-success font-medium">Looking specific and actionable!</span>
                </div>
              )}
            </div>
          )}

          <div className="flex items-center gap-2">
            {guidedStep > 0 && (
              <button onClick={() => setGuidedStep(guidedStep - 1)} className="flex items-center gap-1 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-secondary transition-colors">
                <ChevronLeft className="w-4 h-4" /> Back
              </button>
            )}
            {guidedStep < GUIDED_STEPS.length - 1 ? (
              <button
                onClick={() => setGuidedStep(guidedStep + 1)}
                disabled={!structured[currentStep.key]?.trim()}
                className="flex items-center gap-1 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                Next <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={finishGuided}
                disabled={!structured.area && !structured.targetOutcome}
                className="flex items-center gap-1 rounded-lg bg-success px-4 py-2 text-sm font-medium text-success-foreground hover:opacity-90 transition-opacity disabled:opacity-40"
              >
                <CheckCircle2 className="w-4 h-4" /> Add This Goal
              </button>
            )}
            <button
              onClick={() => setMode('quick')}
              className="text-xs text-muted-foreground hover:underline ml-auto"
            >
              Switch to quick entry
            </button>
          </div>
        </div>
      )}

      {goals.length === 0 && (
        <p className="text-xs text-muted-foreground">Add at least one goal to continue. The more specific, the better your plan will be.</p>
      )}
    </div>
  );
}
