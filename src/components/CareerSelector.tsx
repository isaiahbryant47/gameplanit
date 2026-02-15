import { useState, useEffect } from 'react';
import { fetchCareerDomains, fetchCareerPaths } from '@/lib/careerService';
import type { CareerDomain, CareerPath } from '@/lib/types';
import { Loader2, Search } from 'lucide-react';

interface Props {
  onSelect: (domain: CareerDomain, path: CareerPath) => void;
  selectedPathId?: string;
  selectedDomainId?: string;
}

export default function CareerSelector({ onSelect, selectedPathId, selectedDomainId }: Props) {
  const [domains, setDomains] = useState<CareerDomain[]>([]);
  const [paths, setPaths] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [domainId, setDomainId] = useState<string | null>(selectedDomainId || null);
  const [selectedDomain, setSelectedDomain] = useState<CareerDomain | null>(null);

  useEffect(() => {
    fetchCareerDomains().then(d => {
      // Filter out "General Exploration" from selection UI
      setDomains(d.filter(dom => dom.name !== 'General Exploration'));
      setLoading(false);
    });
  }, []);

  useEffect(() => {
    if (domainId) {
      setLoading(true);
      fetchCareerPaths(domainId).then(p => {
        setPaths(p);
        setLoading(false);
      });
    } else {
      setPaths([]);
    }
  }, [domainId]);

  if (loading && domains.length === 0) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading career domains...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Step A: Select Career Domain */}
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
          Step 1: Choose a career area
        </label>
        <div className="grid grid-cols-3 gap-2">
          {domains.map(d => (
            <button
              key={d.id}
              onClick={() => {
                setDomainId(d.id);
                setSelectedDomain(d);
              }}
              className={`rounded-lg border p-3 text-center transition-colors ${
                domainId === d.id
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-border text-muted-foreground hover:bg-secondary'
              }`}
            >
              <span className="text-xl block mb-1">
                {d.name === 'Healthcare' ? '🏥' : d.name === 'Technology' ? '💻' : '💼'}
              </span>
              <span className="text-xs font-semibold block">{d.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Step B: Select Career Path */}
      {domainId && paths.length > 0 && (
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
            Step 2: Pick a specific career
          </label>
          <div className="space-y-2">
            {paths.map(p => (
              <button
                key={p.id}
                onClick={() => selectedDomain && onSelect(selectedDomain, p)}
                className={`w-full text-left rounded-lg border p-4 transition-colors ${
                  selectedPathId === p.id
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'border-border text-card-foreground hover:bg-secondary'
                }`}
              >
                <h4 className="text-sm font-semibold">{p.name}</h4>
                <p className="text-xs text-muted-foreground mt-1">{p.description}</p>
                {p.recommendedEducationNotes && (
                  <p className="text-[11px] text-muted-foreground/70 mt-1">📚 {p.recommendedEducationNotes}</p>
                )}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* "Explore Careers" option */}
      {!domainId && (
        <button
          onClick={async () => {
            const allDomains = await fetchCareerDomains();
            const exploreDomain = allDomains.find(d => d.name === 'General Exploration');
            if (exploreDomain) {
              const explorePaths = await fetchCareerPaths(exploreDomain.id);
              const explorePath = explorePaths[0];
              if (explorePath) {
                onSelect(exploreDomain, explorePath);
              }
            }
          }}
          className="w-full rounded-lg border border-dashed border-border p-4 text-center text-sm text-muted-foreground hover:bg-secondary transition-colors"
        >
          <Search className="w-4 h-4 mx-auto mb-1" />
          Not sure yet? <span className="font-medium text-primary">Explore Careers</span> — we'll guide you with a broad exposure pathway.
        </button>
      )}

      {loading && domainId && (
        <div className="flex items-center justify-center py-4">
          <Loader2 className="w-4 h-4 animate-spin text-primary" />
          <span className="ml-2 text-xs text-muted-foreground">Loading careers...</span>
        </div>
      )}
    </div>
  );
}
