import type { CareerPath } from '@/lib/types';
import { Compass, Wrench, FolderOpen, Rocket, ArrowRight, Star, TrendingUp, Shuffle } from 'lucide-react';

interface Props {
  path: CareerPath;
  allPaths: CareerPath[];
  isCurrentPath: boolean;
  fitScore?: number;
  isSaved?: boolean;
  canAddToCompare?: boolean;
  onAddToCompare?: (id: string) => void;
  onToggleSave?: (id: string) => void;
  onPreviewPlan?: (id: string) => void;
  onStartPath: () => void;
  onSelectRelated: (id: string) => void;
}

const stages = [
  { label: 'Explore', icon: Compass, desc: 'Discover what this career is about through research and exposure.' },
  { label: 'Build Skills', icon: Wrench, desc: 'Develop foundational skills through practice and coursework.' },
  { label: 'Build Proof', icon: FolderOpen, desc: 'Create portfolio pieces, certifications, or real-world projects.' },
  { label: 'Apply / Unlock', icon: Rocket, desc: 'Apply for opportunities and unlock next-level experiences.' },
];

export default function CareerPreviewPanel({
  path,
  allPaths,
  isCurrentPath,
  fitScore,
  isSaved,
  canAddToCompare,
  onAddToCompare,
  onToggleSave,
  onPreviewPlan,
  onStartPath,
  onSelectRelated,
}: Props) {
  const relatedPaths = path.relatedCareerIds
    .map(id => allPaths.find(p => p.id === id))
    .filter(Boolean) as CareerPath[];

  const nextLevelPaths = path.nextLevelCareerIds
    .map(id => allPaths.find(p => p.id === id))
    .filter(Boolean) as CareerPath[];

  // "Adjacent" = related paths that aren't in next_level
  const adjacentPaths = relatedPaths.filter(
    rp => !path.nextLevelCareerIds.includes(rp.id)
  );

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      {/* Header */}
      <div className="bg-accent/50 p-5 border-b border-border">
        <div className="flex items-start justify-between">
          <div>
            <h3 className="text-lg font-bold text-card-foreground">{path.name}</h3>
            {isCurrentPath && (
              <span className="inline-flex items-center gap-1 mt-1 rounded-full bg-warning px-2.5 py-0.5 text-[11px] font-semibold text-warning-foreground">
                <Star className="w-3 h-3 fill-current" /> Your Current Path
              </span>
            )}
          </div>
        </div>
      </div>

      <div className="p-5 space-y-5">
        {typeof fitScore === 'number' && (
          <section className="rounded-lg border border-border bg-secondary/40 p-3">
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Strategic Fit Score</h4>
            <p className="text-sm font-semibold text-card-foreground">{fitScore}/100</p>
            <p className="text-[11px] text-muted-foreground mt-1">Based on your current interests and constraints.</p>
          </section>
        )}

        {/* What You Do */}
        <section>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            What You Do
          </h4>
          <p className="text-sm text-card-foreground leading-relaxed">{path.description}</p>
        </section>

        {/* Why It Matters */}
        <section>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
            Why It Matters
          </h4>
          <p className="text-sm text-card-foreground leading-relaxed">
            This career helps you make an impact while building skills that are in demand. Every step you take builds toward real opportunities.
          </p>
        </section>

        {/* Education Path */}
        {path.recommendedEducationNotes && (
          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5">
              Education Path Options
            </h4>
            <p className="text-sm text-card-foreground">📚 {path.recommendedEducationNotes}</p>
          </section>
        )}

        {/* Pathway Stages */}
        <section>
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-3">
            Your 12-Week Journey
          </h4>
          <div className="space-y-2">
            {stages.map((s, i) => (
              <div key={s.label} className="flex items-start gap-3">
                <div className="flex flex-col items-center">
                  <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                    <s.icon className="w-3.5 h-3.5 text-primary" />
                  </div>
                  {i < stages.length - 1 && <div className="w-px h-4 bg-border mt-1" />}
                </div>
                <div className="pt-0.5">
                  <p className="text-xs font-semibold text-card-foreground">{s.label}</p>
                  <p className="text-[11px] text-muted-foreground">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 4: Related Careers */}
        {nextLevelPaths.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
              <TrendingUp className="w-3 h-3" /> Build Toward
            </h4>
            <div className="space-y-1.5">
              {nextLevelPaths.map(rp => (
                <button
                  key={rp.id}
                  onClick={() => onSelectRelated(rp.id)}
                  className="w-full text-left flex items-center justify-between rounded-lg border border-border p-3 hover:bg-secondary transition-colors"
                >
                  <div>
                    <p className="text-xs font-semibold text-card-foreground">{rp.name}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{rp.description}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </section>
        )}

        {adjacentPaths.length > 0 && (
          <section>
            <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 flex items-center gap-1">
              <Shuffle className="w-3 h-3" /> You Might Also Like
            </h4>
            <div className="space-y-1.5">
              {adjacentPaths.map(rp => (
                <button
                  key={rp.id}
                  onClick={() => onSelectRelated(rp.id)}
                  className="w-full text-left flex items-center justify-between rounded-lg border border-dashed border-border p-3 hover:bg-secondary transition-colors"
                >
                  <div>
                    <p className="text-xs font-semibold text-card-foreground">{rp.name}</p>
                    <p className="text-[10px] text-muted-foreground line-clamp-1">{rp.description}</p>
                  </div>
                  <ArrowRight className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                </button>
              ))}
            </div>
          </section>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <button
            onClick={() => onToggleSave?.(path.id)}
            className="rounded-lg border border-border bg-background py-2 px-3 text-xs font-semibold text-card-foreground hover:bg-secondary transition-colors"
          >
            {isSaved ? 'Saved ✓' : 'Save for Later'}
          </button>
          <button
            onClick={() => onAddToCompare?.(path.id)}
            disabled={!canAddToCompare}
            className="rounded-lg border border-border bg-background py-2 px-3 text-xs font-semibold text-card-foreground hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            Add to Compare
          </button>
          <button
            onClick={() => onPreviewPlan?.(path.id)}
            className="rounded-lg border border-border bg-background py-2 px-3 text-xs font-semibold text-card-foreground hover:bg-secondary transition-colors"
          >
            Preview Plan
          </button>
        </div>

        {/* Start CTA */}
        <button
          onClick={onStartPath}
          className="w-full flex items-center justify-center gap-2 rounded-lg bg-primary text-primary-foreground py-3 px-4 text-sm font-semibold hover:bg-primary/90 transition-colors"
        >
          {isCurrentPath ? 'Continue This Path' : 'Start This Path'}
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
