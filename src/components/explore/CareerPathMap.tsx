import type { CareerPath } from '@/lib/types';
import { ArrowUp, Star } from 'lucide-react';

interface Props {
  paths: CareerPath[];
  allPaths: CareerPath[];
  selectedPathId: string | null;
  currentCareerPathId?: string;
  onSelect: (id: string) => void;
  domainName: string;
}

export default function CareerPathMap({ paths, allPaths, selectedPathId, currentCareerPathId, onSelect, domainName }: Props) {
  // Sort paths: entry-level first (those that appear in others' nextLevelCareerIds least)
  // Simple heuristic: paths referenced as next_level are "higher"
  const nextLevelSet = new Set(paths.flatMap(p => p.nextLevelCareerIds));
  const entryPaths = paths.filter(p => !nextLevelSet.has(p.id));
  const advancedPaths = paths.filter(p => nextLevelSet.has(p.id));

  // Build connection lines data
  const connections: { fromId: string; toId: string }[] = [];
  paths.forEach(p => {
    p.nextLevelCareerIds.forEach(nid => {
      if (paths.some(pp => pp.id === nid)) {
        connections.push({ fromId: p.id, toId: nid });
      }
    });
  });

  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-5">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-card-foreground">
          {domainName} Career Map
        </h3>
        <span className="text-xs text-muted-foreground">Click a career to learn more</span>
      </div>

      {/* Grow Into row */}
      {advancedPaths.length > 0 && (
        <div className="space-y-2">
          <div className="flex items-center gap-1.5">
            <ArrowUp className="w-3 h-3 text-primary" />
            <span className="text-[11px] font-medium text-primary uppercase tracking-wide">Grow Into</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {advancedPaths.map(p => (
              <CareerNode
                key={p.id}
                path={p}
                isSelected={selectedPathId === p.id}
                isCurrent={currentCareerPathId === p.id}
                onClick={() => onSelect(p.id)}
                tier="advanced"
              />
            ))}
          </div>
        </div>
      )}

      {/* Connection indicators */}
      {connections.length > 0 && (
        <div className="flex justify-center py-1">
          <div className="flex flex-col items-center gap-0.5">
            <div className="w-px h-4 bg-primary/30" />
            <ArrowUp className="w-3 h-3 text-primary/50" />
            <div className="w-px h-4 bg-primary/30" />
          </div>
        </div>
      )}

      {/* Entry-level / Starting careers */}
      <div className="space-y-2">
        <span className="text-[11px] font-medium text-muted-foreground uppercase tracking-wide">
          Starting Points
        </span>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {entryPaths.map(p => (
            <CareerNode
              key={p.id}
              path={p}
              isSelected={selectedPathId === p.id}
              isCurrent={currentCareerPathId === p.id}
              onClick={() => onSelect(p.id)}
              tier="entry"
            />
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 pt-2 border-t border-border">
        <div className="flex items-center gap-1.5">
          <div className="w-3 h-3 rounded-sm bg-primary/20 border border-primary" />
          <span className="text-[10px] text-muted-foreground">Selected</span>
        </div>
        {currentCareerPathId && paths.some(p => p.id === currentCareerPathId) && (
          <div className="flex items-center gap-1.5">
            <Star className="w-3 h-3 text-warning fill-warning" />
            <span className="text-[10px] text-muted-foreground">Your Current Path</span>
          </div>
        )}
        <div className="flex items-center gap-1.5">
          <ArrowUp className="w-3 h-3 text-primary/50" />
          <span className="text-[10px] text-muted-foreground">Growth Direction</span>
        </div>
      </div>
    </div>
  );
}

function CareerNode({
  path,
  isSelected,
  isCurrent,
  onClick,
  tier,
}: {
  path: CareerPath;
  isSelected: boolean;
  isCurrent: boolean;
  onClick: () => void;
  tier: 'entry' | 'advanced';
}) {
  return (
    <button
      onClick={onClick}
      className={`relative text-left rounded-lg border p-3.5 transition-all duration-200 ${
        isSelected
          ? 'border-primary bg-accent shadow-md ring-2 ring-primary/20'
          : tier === 'advanced'
            ? 'border-primary/30 bg-primary/5 hover:border-primary/60 hover:shadow-sm'
            : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
      }`}
    >
      {isCurrent && (
        <div className="absolute -top-2 -right-2">
          <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-[10px] font-semibold text-warning-foreground shadow-sm">
            <Star className="w-2.5 h-2.5 fill-current" /> Your Path
          </span>
        </div>
      )}
      <h4 className={`text-sm font-semibold leading-tight ${
        isSelected ? 'text-accent-foreground' : 'text-card-foreground'
      }`}>
        {path.name}
      </h4>
      <p className="text-[11px] text-muted-foreground mt-1 line-clamp-2">
        {path.description}
      </p>
      {path.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-2">
          {path.tags.slice(0, 3).map(t => (
            <span key={t} className="rounded-full bg-secondary px-2 py-0.5 text-[10px] text-secondary-foreground">
              {t}
            </span>
          ))}
        </div>
      )}
    </button>
  );
}
