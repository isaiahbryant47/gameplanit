import { useState, useEffect } from 'react';
import { fetchPathways } from '@/lib/pathwayService';
import type { Pathway, GoalDomain } from '@/lib/types';
import { Compass, GraduationCap, Briefcase, Heart, Loader2 } from 'lucide-react';

interface Props {
  onSelect: (domain: GoalDomain, pathway: Pathway) => void;
  selectedPathwayId?: string;
  selectedDomain?: GoalDomain;
}

const domainConfig: Record<GoalDomain, { label: string; emoji: string; icon: typeof Compass; description: string }> = {
  career: { label: 'Career', emoji: '💼', icon: Briefcase, description: 'Explore jobs, internships, and career paths' },
  college: { label: 'College', emoji: '🎓', icon: GraduationCap, description: 'Prepare for applications, essays, and financial aid' },
  health_fitness: { label: 'Health & Fitness', emoji: '💪', icon: Heart, description: 'Build exercise and nutrition habits' },
};

export default function PathwaySelector({ onSelect, selectedPathwayId, selectedDomain }: Props) {
  const [pathways, setPathways] = useState<Pathway[]>([]);
  const [loading, setLoading] = useState(true);
  const [domain, setDomain] = useState<GoalDomain | null>(selectedDomain || null);

  useEffect(() => {
    fetchPathways().then(p => {
      setPathways(p);
      setLoading(false);
    });
  }, []);

  const filteredPathways = domain ? pathways.filter(p => p.domain === domain) : [];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading pathways...</span>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
          What area do you want to focus on?
        </label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(domainConfig) as [GoalDomain, typeof domainConfig[GoalDomain]][]).map(([key, cfg]) => (
            <button
              key={key}
              onClick={() => setDomain(key)}
              className={`rounded-lg border p-3 text-center transition-colors ${
                domain === key
                  ? 'border-primary bg-accent text-accent-foreground'
                  : 'border-border text-muted-foreground hover:bg-secondary'
              }`}
            >
              <span className="text-xl block mb-1">{cfg.emoji}</span>
              <span className="text-xs font-semibold block">{cfg.label}</span>
            </button>
          ))}
        </div>
      </div>

      {domain && filteredPathways.length > 0 && (
        <div>
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 block">
            Choose your pathway
          </label>
          <div className="space-y-2">
            {filteredPathways.map(pw => (
              <button
                key={pw.id}
                onClick={() => onSelect(domain, pw)}
                className={`w-full text-left rounded-lg border p-4 transition-colors ${
                  selectedPathwayId === pw.id
                    ? 'border-primary bg-accent text-accent-foreground'
                    : 'border-border text-card-foreground hover:bg-secondary'
                }`}
              >
                <h4 className="text-sm font-semibold">{pw.title}</h4>
                <p className="text-xs text-muted-foreground mt-1">{pw.description}</p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
