import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Sparkles, ExternalLink, Plus, Loader2, Tag } from 'lucide-react';
import type { Profile } from '@/lib/types';
import type { TablesInsert } from '@/integrations/supabase/types';
import { toast } from 'sonner';

interface DiscoveredResource {
  title: string;
  description: string;
  url?: string;
  is_free: boolean;
  category: string;
  why: string;
}

const categoryLabels: Record<string, string> = {
  online_learning: 'Online Learning',
  local_opportunity: 'Local Opportunity',
  scholarship: 'Scholarship',
  mentorship: 'Mentorship',
  community_event: 'Community Event',
  career_program: 'Career Program',
};

export default function ResourceDiscovery({ profile }: { profile: Profile }) {
  const [resources, setResources] = useState<DiscoveredResource[]>([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState<string | null>(null);

  const discover = async () => {
    setLoading(true);
    setResources([]);
    try {
      const { data, error } = await supabase.functions.invoke('discover-resources', {
        body: {
          interests: profile.interests,
          gradeLevel: profile.gradeLevel,
          zipCode: profile.zipCode,
          transportation: profile.constraints.transportation,
          budgetPerMonth: profile.constraints.budgetPerMonth,
          goals: profile.goals,
          responsibilities: profile.constraints.responsibilities,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      setResources(data?.resources || []);
    } catch (e: any) {
      console.error('Discovery error:', e);
      toast.error(e.message || 'Failed to discover resources');
    } finally {
      setLoading(false);
    }
  };

  const saveToDb = async (resource: DiscoveredResource) => {
    setSaving(resource.title);
    try {
      const row: TablesInsert<'resources'> = {
        title: resource.title,
        description: resource.description,
        url: resource.url || null,
        is_free: resource.is_free,
        category: resource.category as any,
        tags: profile.interests,
        grade_levels: [profile.gradeLevel],
        zip_prefixes: [profile.zipCode.slice(0, 3)],
        transportation: profile.constraints.transportation === 'mixed' ? 'mixed' : profile.constraints.transportation as any,
      };
      const { error } = await supabase.from('resources').insert(row);
      if (error) throw error;
      toast.success(`"${resource.title}" saved to resource library`);
    } catch (e: any) {
      toast.error(e.message || 'Failed to save resource');
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      <div className="px-5 py-4 flex items-center justify-between border-b border-border">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-primary" />
          <h2 className="text-sm font-semibold text-card-foreground">AI Resource Discovery</h2>
        </div>
        <button
          onClick={discover}
          disabled={loading}
          className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
          {loading ? 'Discovering...' : 'Find Resources for Me'}
        </button>
      </div>

      {resources.length > 0 && (
        <div className="divide-y divide-border">
          {resources.map((r, i) => (
            <div key={i} className="px-5 py-4 space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-card-foreground">{r.title}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-medium text-accent-foreground">
                      <Tag className="w-3 h-3" />
                      {categoryLabels[r.category] || r.category}
                    </span>
                    {r.is_free && (
                      <span className="rounded-full bg-success/10 px-2 py-0.5 text-[10px] font-medium text-success">Free</span>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">{r.description}</p>
                  <p className="text-xs text-primary/80 mt-1 italic">💡 {r.why}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  {r.url && (
                    <a href={r.url} target="_blank" rel="noopener noreferrer" className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary transition-colors">
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  )}
                  <button
                    onClick={() => saveToDb(r)}
                    disabled={saving === r.title}
                    className="rounded-lg border border-border p-2 text-muted-foreground hover:bg-secondary hover:text-primary transition-colors disabled:opacity-50"
                    title="Save to resource library"
                  >
                    {saving === r.title ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && resources.length === 0 && (
        <div className="px-5 py-8 text-center text-sm text-muted-foreground">
          Click "Find Resources for Me" to get AI-powered suggestions based on your profile.
        </div>
      )}
    </div>
  );
}
