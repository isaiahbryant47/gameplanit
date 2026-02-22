import { useRef, useEffect, useState, useCallback } from 'react';
import type { CareerPath } from '@/lib/types';
import { Star, ArrowRight, TrendingUp, Shuffle, Sparkles } from 'lucide-react';

interface Props {
  paths: CareerPath[];
  allPaths: CareerPath[];
  selectedPathId: string | null;
  currentCareerPathId?: string;
  onSelect: (id: string) => void;
  domainName: string;
}

interface NodePosition {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

// Connection categories
type ConnectionType = 'grow_into' | 'similar' | 'explore_instead';

interface Connection {
  fromId: string;
  toId: string;
  type: ConnectionType;
}

const connectionConfig: Record<ConnectionType, { label: string; color: string; icon: typeof TrendingUp }> = {
  grow_into: { label: 'Build Toward', color: 'hsl(var(--primary))', icon: TrendingUp },
  similar: { label: 'You Might Also Like', color: 'hsl(var(--warning))', icon: Sparkles },
  explore_instead: { label: 'Explore Instead', color: 'hsl(var(--muted-foreground))', icon: Shuffle },
};

export default function CareerPathMap({ paths, allPaths, selectedPathId, currentCareerPathId, onSelect, domainName }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const [nodePositions, setNodePositions] = useState<Map<string, NodePosition>>(new Map());
  const [containerSize, setContainerSize] = useState({ width: 0, height: 0 });

  // Determine selected path's connections
  const selectedPath = selectedPathId ? paths.find(p => p.id === selectedPathId) : null;

  // Build connections from selected path
  const connections: Connection[] = [];
  if (selectedPath) {
    selectedPath.nextLevelCareerIds.forEach(id => {
      if (paths.some(p => p.id === id)) {
        connections.push({ fromId: selectedPath.id, toId: id, type: 'grow_into' });
      }
    });
    selectedPath.relatedCareerIds.forEach(id => {
      if (paths.some(p => p.id === id)) {
        const isNextLevel = selectedPath.nextLevelCareerIds.includes(id);
        connections.push({
          fromId: selectedPath.id,
          toId: id,
          type: isNextLevel ? 'grow_into' : 'similar',
        });
      }
    });
    // Other paths in domain not connected = "explore instead"
    paths.forEach(p => {
      if (p.id !== selectedPath.id &&
          !selectedPath.nextLevelCareerIds.includes(p.id) &&
          !selectedPath.relatedCareerIds.includes(p.id)) {
        connections.push({ fromId: selectedPath.id, toId: p.id, type: 'explore_instead' });
      }
    });
  }

  // Measure node positions after render
  const measureNodes = useCallback(() => {
    if (!containerRef.current) return;
    const container = containerRef.current;
    const rect = container.getBoundingClientRect();
    setContainerSize({ width: rect.width, height: rect.height });

    const positions = new Map<string, NodePosition>();
    paths.forEach(p => {
      const el = container.querySelector(`[data-career-id="${p.id}"]`) as HTMLElement;
      if (el) {
        const elRect = el.getBoundingClientRect();
        positions.set(p.id, {
          id: p.id,
          x: elRect.left - rect.left,
          y: elRect.top - rect.top,
          width: elRect.width,
          height: elRect.height,
        });
      }
    });
    setNodePositions(positions);
  }, [paths]);

  useEffect(() => {
    // Measure after a short delay to let layout settle
    const timer = setTimeout(measureNodes, 100);
    window.addEventListener('resize', measureNodes);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measureNodes);
    };
  }, [measureNodes, selectedPathId]);

  // Sort: selected first on left, destinations on right
  // Layout: selected career on left, all others flow to right grouped by connection type
  const growInto = connections.filter(c => c.type === 'grow_into');
  const similar = connections.filter(c => c.type === 'similar');
  const exploreInstead = connections.filter(c => c.type === 'explore_instead');

  const destinationGroups = [
    { type: 'grow_into' as ConnectionType, items: growInto, ...connectionConfig.grow_into },
    { type: 'similar' as ConnectionType, items: similar, ...connectionConfig.similar },
    { type: 'explore_instead' as ConnectionType, items: exploreInstead, ...connectionConfig.explore_instead },
  ].filter(g => g.items.length > 0);

  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-5 pt-5 pb-3 border-b border-border">
        <h3 className="text-sm font-semibold text-card-foreground">
          {domainName} Career Map
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {selectedPath ? 'See where this career connects' : 'Select a career to see your roadmap'}
        </p>
      </div>

      <div ref={containerRef} className="relative p-5 min-h-[360px]">
        {/* SVG layer for connection lines */}
        <svg
          ref={svgRef}
          className="absolute inset-0 w-full h-full pointer-events-none z-0"
          style={{ overflow: 'visible' }}
        >
          {connections.map((conn, i) => {
            const from = nodePositions.get(conn.fromId);
            const to = nodePositions.get(conn.toId);
            if (!from || !to) return null;

            const startX = from.x + from.width;
            const startY = from.y + from.height / 2;
            const endX = to.x;
            const endY = to.y + to.height / 2;

            const midX = startX + (endX - startX) * 0.5;

            const cfg = connectionConfig[conn.type];
            const opacity = conn.type === 'explore_instead' ? 0.3 : 0.6;

            return (
              <path
                key={`${conn.fromId}-${conn.toId}-${i}`}
                d={`M ${startX} ${startY} C ${midX} ${startY}, ${midX} ${endY}, ${endX} ${endY}`}
                fill="none"
                stroke={cfg.color}
                strokeWidth={conn.type === 'grow_into' ? 2.5 : 1.5}
                strokeOpacity={opacity}
                strokeDasharray={conn.type === 'explore_instead' ? '4 4' : 'none'}
                className="transition-all duration-300"
              />
            );
          })}
        </svg>

        {/* Node layout */}
        {selectedPath ? (
          // Flow layout: selected on left, destinations grouped on right
          <div className="flex gap-8 items-start relative z-10">
            {/* Selected career (left) */}
            <div className="shrink-0 w-[200px] flex items-center" style={{ minHeight: 280 }}>
              <div className="w-full">
                <CareerNode
                  path={selectedPath}
                  isSelected={true}
                  isCurrent={currentCareerPathId === selectedPath.id}
                  onClick={() => {}}
                  variant="selected"
                />
              </div>
            </div>

            {/* Destination groups (right) */}
            <div className="flex-1 space-y-4">
              {destinationGroups.map(group => (
                <div key={group.type}>
                  <div className="flex items-center gap-1.5 mb-2">
                    <group.icon className="w-3 h-3" style={{ color: group.color }} />
                    <span className="text-[11px] font-semibold uppercase tracking-wide" style={{ color: group.color }}>
                      {group.label}
                    </span>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {group.items.map(conn => {
                      const destPath = paths.find(p => p.id === conn.toId);
                      if (!destPath) return null;
                      return (
                        <CareerNode
                          key={destPath.id}
                          path={destPath}
                          isSelected={false}
                          isCurrent={currentCareerPathId === destPath.id}
                          onClick={() => onSelect(destPath.id)}
                          variant="destination"
                          connectionType={conn.type}
                        />
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          // Initial grid: no selection yet
          <div className="relative z-10">
            <p className="text-xs text-muted-foreground mb-3">Pick a career to explore its connections:</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {paths.map(p => (
                <CareerNode
                  key={p.id}
                  path={p}
                  isSelected={false}
                  isCurrent={currentCareerPathId === p.id}
                  onClick={() => onSelect(p.id)}
                  variant="default"
                />
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Legend */}
      {selectedPath && (
        <div className="px-5 py-3 border-t border-border flex flex-wrap gap-4">
          {Object.entries(connectionConfig).map(([key, cfg]) => (
            <div key={key} className="flex items-center gap-1.5">
              <div
                className="w-6 h-0.5 rounded"
                style={{
                  backgroundColor: cfg.color,
                  opacity: key === 'explore_instead' ? 0.4 : 0.7,
                  ...(key === 'explore_instead' ? { backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 3px, hsl(var(--card)) 3px, hsl(var(--card)) 6px)' } : {}),
                }}
              />
              <span className="text-[10px] text-muted-foreground">{cfg.label}</span>
            </div>
          ))}
          {currentCareerPathId && paths.some(p => p.id === currentCareerPathId) && (
            <div className="flex items-center gap-1.5">
              <Star className="w-3 h-3 text-warning fill-warning" />
              <span className="text-[10px] text-muted-foreground">Your Current Path</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CareerNode({
  path,
  isSelected,
  isCurrent,
  onClick,
  variant,
  connectionType,
}: {
  path: CareerPath;
  isSelected: boolean;
  isCurrent: boolean;
  onClick: () => void;
  variant: 'default' | 'selected' | 'destination';
  connectionType?: ConnectionType;
}) {
  const borderColor = variant === 'selected'
    ? 'border-primary ring-2 ring-primary/20 bg-accent shadow-lg'
    : connectionType === 'grow_into'
      ? 'border-primary/30 bg-primary/5 hover:border-primary/50'
      : connectionType === 'similar'
        ? 'border-warning/30 bg-warning/5 hover:border-warning/50'
        : 'border-border bg-card hover:border-primary/30';

  return (
    <button
      data-career-id={path.id}
      onClick={onClick}
      className={`relative text-left rounded-lg border p-3 transition-all duration-200 w-full ${borderColor} ${
        variant !== 'selected' ? 'hover:shadow-sm cursor-pointer' : ''
      }`}
    >
      {isCurrent && (
        <div className="absolute -top-2 -right-2 z-10">
          <span className="inline-flex items-center gap-1 rounded-full bg-warning px-2 py-0.5 text-[10px] font-semibold text-warning-foreground shadow-sm">
            <Star className="w-2.5 h-2.5 fill-current" /> Your Path
          </span>
        </div>
      )}

      <div className="flex items-start gap-2">
        {variant === 'selected' && (
          <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0 mt-0.5">
            <span className="text-sm">
              {path.tags.includes('healthcare') ? '🏥' :
               path.tags.includes('technology') ? '💻' :
               path.tags.includes('business') ? '💼' : '📋'}
            </span>
          </div>
        )}
        <div className="min-w-0">
          <h4 className={`font-semibold leading-tight ${
            variant === 'selected' ? 'text-sm text-accent-foreground' : 'text-xs text-card-foreground'
          }`}>
            {path.name}
          </h4>
          <p className={`text-muted-foreground mt-0.5 line-clamp-2 ${
            variant === 'selected' ? 'text-xs' : 'text-[11px]'
          }`}>
            {path.description}
          </p>
        </div>
      </div>

      {/* Tag chips */}
      {path.tags.length > 0 && (
        <div className="flex flex-wrap gap-1 mt-1.5">
          {path.tags.slice(0, variant === 'selected' ? 3 : 2).map(tag => (
            <span
              key={tag}
              className="text-[9px] font-medium text-muted-foreground bg-secondary rounded-full px-1.5 py-0.5"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {variant !== 'selected' && (
        <div className="flex items-center gap-1 mt-2 text-[10px] text-primary">
          <span>Explore</span>
          <ArrowRight className="w-2.5 h-2.5" />
        </div>
      )}
    </button>
  );
}
