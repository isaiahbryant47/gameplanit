import { useState, useEffect, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/storage';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import DashboardSidebar from '@/components/DashboardSidebar';
import CareerPathMap from '@/components/explore/CareerPathMap';
import CareerPreviewPanel from '@/components/explore/CareerPreviewPanel';
import { fetchCareerDomains, fetchCareerPaths } from '@/lib/careerService';
import type { CareerDomain, CareerPath } from '@/lib/types';
import { Loader2 } from 'lucide-react';

const domainEmojis: Record<string, string> = {
  Healthcare: '🏥',
  Technology: '💻',
  'Business & Entrepreneurship': '💼',
  'Creative & Media': '🎨',
  'Skilled Trades': '🔧',
  'Public Service': '🏛️',
};

const COMPARE_KEY = 'gp_compare_paths';
const SAVED_KEY = 'gp_saved_paths';

type TabKey = 'explore' | 'compare' | 'plan' | 'commit';

type SortKey = 'fit' | 'a-z';

const tabs: { key: TabKey; label: string }[] = [
  { key: 'explore', label: 'Explore' },
  { key: 'compare', label: 'Compare' },
  { key: 'plan', label: 'Plan' },
  { key: 'commit', label: 'Commit' },
];

function readLocalIds(key: string): string[] {
  try {
    const data = localStorage.getItem(key);
    if (!data) return [];
    const parsed = JSON.parse(data);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function scoreCareer(path: CareerPath, profile?: ReturnType<typeof storage.allProfiles>[number]): number {
  if (!profile) return 50;

  const interestOverlap = path.tags.filter((tag) =>
    profile.interests.some((i) => i.toLowerCase().includes(tag.toLowerCase()) || tag.toLowerCase().includes(i.toLowerCase()))
  ).length;
  const interestScore = Math.min(40, interestOverlap * 13);

  const budgetScore = profile.constraints.budgetPerMonth >= 100 ? 20 : 10;
  const timeScore = profile.constraints.timePerWeekHours >= 5 ? 20 : 8;
  const readinessScore = profile.baseline.attendance && profile.baseline.attendance >= 90 ? 20 : 12;

  return Math.min(100, interestScore + budgetScore + timeScore + readinessScore);
}

export default function ExploreCareers() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [careerDomains, setCareerDomains] = useState<CareerDomain[]>([]);
  const [allCareerPaths, setAllCareerPaths] = useState<CareerPath[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>('explore');
  const [searchQuery, setSearchQuery] = useState('');
  const [tagFilter, setTagFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<SortKey>('fit');
  const [comparePathIds, setComparePathIds] = useState<string[]>([]);
  const [savedPathIds, setSavedPathIds] = useState<string[]>([]);
  const [planPreviewId, setPlanPreviewId] = useState<string | null>(null);

  const profile = user ? storage.allProfiles().find((p) => p.userId === user.id) : undefined;

  const loadCareerData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [domains, paths] = await Promise.all([fetchCareerDomains(), fetchCareerPaths()]);
      setCareerDomains(domains.filter((dom) => dom.name !== 'General Exploration'));
      setAllCareerPaths(paths.filter((path) => path.name !== 'General Exploration'));
    } catch {
      setError('Could not load career data right now. Please retry.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadCareerData();
    setComparePathIds(readLocalIds(COMPARE_KEY));
    setSavedPathIds(readLocalIds(SAVED_KEY));
  }, [loadCareerData]);

  useEffect(() => {
    localStorage.setItem(COMPARE_KEY, JSON.stringify(comparePathIds));
  }, [comparePathIds]);

  useEffect(() => {
    localStorage.setItem(SAVED_KEY, JSON.stringify(savedPathIds));
  }, [savedPathIds]);

  const allTags = useMemo(
    () => Array.from(new Set(allCareerPaths.flatMap((path) => path.tags))).sort((a, b) => a.localeCompare(b)),
    [allCareerPaths]
  );

  const filteredByQueryAndTag = useMemo(() => {
    return allCareerPaths.filter((path) => {
      const matchQuery =
        searchQuery.trim().length === 0 ||
        path.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        path.description.toLowerCase().includes(searchQuery.toLowerCase());
      const matchTag = tagFilter === 'all' || path.tags.includes(tagFilter);
      return matchQuery && matchTag;
    });
  }, [allCareerPaths, searchQuery, tagFilter]);

  const domainPaths = useMemo(() => {
    const domainFiltered = selectedDomainId
      ? filteredByQueryAndTag.filter((p) => p.domainId === selectedDomainId)
      : [];

    const sorted = [...domainFiltered].sort((a, b) => {
      if (sortBy === 'a-z') return a.name.localeCompare(b.name);
      return scoreCareer(b, profile) - scoreCareer(a, profile);
    });

    return sorted;
  }, [filteredByQueryAndTag, profile, selectedDomainId, sortBy]);

  const selectedPath = selectedPathId ? allCareerPaths.find((p) => p.id === selectedPathId) : null;
  const selectedDomain = selectedDomainId ? careerDomains.find((d) => d.id === selectedDomainId) : null;
  const comparePaths = comparePathIds
    .map((id) => allCareerPaths.find((path) => path.id === id))
    .filter(Boolean) as CareerPath[];
  const planPreviewPath = planPreviewId ? allCareerPaths.find((path) => path.id === planPreviewId) : null;

  const addToCompare = (pathId: string) => {
    setComparePathIds((prev) => {
      if (prev.includes(pathId)) return prev;
      if (prev.length >= 3) return prev;
      return [...prev, pathId];
    });
    setActiveTab('compare');
  };

  const removeFromCompare = (pathId: string) => {
    setComparePathIds((prev) => prev.filter((id) => id !== pathId));
  };

  const toggleSavePath = (pathId: string) => {
    setSavedPathIds((prev) => (prev.includes(pathId) ? prev.filter((id) => id !== pathId) : [...prev, pathId]));
  };

  const renderExplore = () => (
    <>
      <div className="rounded-xl border border-border bg-card p-4 space-y-3">
        <h3 className="text-sm font-semibold text-card-foreground">Strategic Fit Snapshot</h3>
        <p className="text-xs text-muted-foreground">
          Complete your profile to improve recommendations. Your current constraints: {profile?.constraints.timePerWeekHours ?? 0} hrs/week,
          ${profile?.constraints.budgetPerMonth ?? 0}/month.
        </p>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
        <input
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search careers"
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="Search careers"
        />
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="Filter by tag"
        >
          <option value="all">All tags</option>
          {allTags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as SortKey)}
          className="h-9 rounded-md border border-input bg-background px-3 text-sm"
          aria-label="Sort careers"
        >
          <option value="fit">Best fit</option>
          <option value="a-z">A - Z</option>
        </select>
      </div>

      {/* Domain tiles */}
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
          <span className="ml-2 text-sm text-muted-foreground">Loading domains…</span>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
          {careerDomains.map((d) => {
            const isActive = selectedDomainId === d.id;
            const count = filteredByQueryAndTag.filter((p) => p.domainId === d.id).length;
            return (
              <button
                key={d.id}
                onClick={() => {
                  setSelectedDomainId(isActive ? null : d.id);
                  setSelectedPathId(null);
                }}
                aria-pressed={isActive}
                className={`rounded-xl border p-4 text-center transition-all ${
                  isActive ? 'border-primary bg-accent ring-1 ring-primary/20 shadow-sm' : 'border-border hover:border-primary/40 hover:shadow-sm'
                }`}
              >
                <span className="text-2xl block mb-1.5">{domainEmojis[d.name] || '📋'}</span>
                <span className={`text-xs font-semibold leading-tight block ${isActive ? 'text-accent-foreground' : 'text-card-foreground'}`}>{d.name}</span>
                <span className="text-[10px] text-muted-foreground">{count} paths</span>
              </button>
            );
          })}
        </div>
      )}

      {/* Career Map + Preview */}
      {selectedDomainId && domainPaths.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
          <div className="lg:col-span-3">
            <CareerPathMap
              paths={domainPaths}
              allPaths={allCareerPaths}
              selectedPathId={selectedPathId}
              currentCareerPathId={profile?.careerPathId}
              onSelect={setSelectedPathId}
              domainName={selectedDomain?.name || ''}
            />
          </div>
          <div className="lg:col-span-2">
            {selectedPath ? (
              <CareerPreviewPanel
                path={selectedPath}
                allPaths={allCareerPaths}
                fitScore={scoreCareer(selectedPath, profile)}
                isCurrentPath={profile?.careerPathId === selectedPath.id}
                isSaved={savedPathIds.includes(selectedPath.id)}
                canAddToCompare={comparePathIds.length < 3 || comparePathIds.includes(selectedPath.id)}
                onAddToCompare={addToCompare}
                onToggleSave={toggleSavePath}
                onPreviewPlan={(pathId) => {
                  setPlanPreviewId(pathId);
                  setActiveTab('plan');
                }}
                onStartPath={() => user ? nav('/onboarding', { state: { careerPathId: selectedPath.id } }) : nav('/login')}
                onSelectRelated={setSelectedPathId}
              />
            ) : (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                <p className="text-sm text-muted-foreground">👆 Click a career in the map to see details</p>
              </div>
            )}
          </div>
        </div>
      )}

      {!loading && selectedDomainId && domainPaths.length === 0 && (
        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
          <p className="text-sm text-muted-foreground">No results match your filters for this domain.</p>
        </div>
      )}

      {error && (
        <div className="rounded-xl border border-destructive/40 bg-destructive/10 p-4 flex items-center justify-between gap-3">
          <p className="text-sm text-destructive">{error}</p>
          <button onClick={() => void loadCareerData()} className="rounded-md border border-destructive/30 px-3 py-1.5 text-xs font-semibold text-destructive">
            Retry
          </button>
        </div>
      )}
    </>
  );

  const renderCompare = () => (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <div className="px-4 py-3 border-b border-border flex items-center justify-between">
        <h3 className="text-sm font-semibold">Career Compare Matrix</h3>
        <p className="text-xs text-muted-foreground">Select up to 3 careers</p>
      </div>
      {comparePaths.length === 0 ? (
        <div className="p-6 text-sm text-muted-foreground">No careers in compare yet. Add one from Explore.</div>
      ) : (
        <div className="overflow-auto">
          <table className="w-full min-w-[620px] text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="p-3 text-left font-medium">Metric</th>
                {comparePaths.map((path) => (
                  <th key={path.id} className="p-3 text-left font-medium">
                    <div className="flex items-center justify-between gap-2">
                      <span>{path.name}</span>
                      <button onClick={() => removeFromCompare(path.id)} className="text-xs text-muted-foreground hover:text-foreground">
                        Remove
                      </button>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-border">
                <td className="p-3 font-medium">Fit Score</td>
                {comparePaths.map((path) => (
                  <td key={path.id} className="p-3">{scoreCareer(path, profile)}/100</td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 font-medium">Education Notes</td>
                {comparePaths.map((path) => (
                  <td key={path.id} className="p-3 text-xs text-muted-foreground">{path.recommendedEducationNotes || '—'}</td>
                ))}
              </tr>
              <tr className="border-b border-border">
                <td className="p-3 font-medium">Adjacent Careers</td>
                {comparePaths.map((path) => (
                  <td key={path.id} className="p-3">{path.relatedCareerIds.length}</td>
                ))}
              </tr>
              <tr>
                <td className="p-3 font-medium">Action</td>
                {comparePaths.map((path) => (
                  <td key={path.id} className="p-3">
                    <button
                      onClick={() => {
                        setPlanPreviewId(path.id);
                        setActiveTab('plan');
                      }}
                      className="rounded-md border border-border px-3 py-1.5 text-xs font-semibold"
                    >
                      Preview Plan
                    </button>
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderPlan = () => (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h3 className="text-sm font-semibold">Plan Preview</h3>
      {planPreviewPath ? (
        <>
          <p className="text-sm text-card-foreground">
            Planning for <span className="font-semibold">{planPreviewPath.name}</span> at {profile?.constraints.timePerWeekHours ?? 0} hrs/week and ${profile?.constraints.budgetPerMonth ?? 0}/month.
          </p>
          <ul className="space-y-2 text-sm text-muted-foreground list-disc pl-5">
            <li>Weeks 1-3: Explore role expectations and required skills.</li>
            <li>Weeks 4-8: Build proof via coursework, project work, or certifications.</li>
            <li>Weeks 9-12: Apply, network, and unlock first opportunity.</li>
          </ul>
          <button onClick={() => setActiveTab('commit')} className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold">
            Continue to Commit
          </button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">Choose a career from Explore or Compare to preview a plan.</p>
      )}
    </div>
  );

  const renderCommit = () => (
    <div className="rounded-xl border border-border bg-card p-5 space-y-4">
      <h3 className="text-sm font-semibold">Commit to a Path</h3>
      {planPreviewPath ? (
        <>
          <p className="text-sm text-card-foreground">You are about to commit to <span className="font-semibold">{planPreviewPath.name}</span>.</p>
          <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
            <li>Set one weekly reminder.</li>
            <li>Complete your first skill-building activity this week.</li>
            <li>Review progress every two weeks.</li>
          </ul>
          <button
            onClick={() => user ? nav('/onboarding', { state: { careerPathId: planPreviewPath.id } }) : nav('/login')}
            className="rounded-md bg-primary text-primary-foreground px-4 py-2 text-sm font-semibold"
          >
            Start This Path
          </button>
        </>
      ) : (
        <p className="text-sm text-muted-foreground">No path selected yet. Start from Explore.</p>
      )}
    </div>
  );


  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />

        <main className="flex-1 min-w-0">
          <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-muted-foreground" />
                <h1 className="text-sm font-medium text-muted-foreground hidden sm:block">Explore Career Paths</h1>
              </div>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-6 py-6 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-card-foreground">Explore Career Paths</h2>
              <p className="text-sm text-muted-foreground mt-1">Discover, compare, and plan your next career direction.</p>
              {!user && (
                <p className="text-xs text-muted-foreground mt-1">You are viewing guest mode. Sign in to save, compare across sessions, and start a pathway.</p>
              )}
            </div>

            <div className="rounded-xl border border-border bg-card p-1 inline-flex gap-1">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
                    activeTab === tab.key ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {activeTab === 'explore' && renderExplore()}
            {activeTab === 'compare' && renderCompare()}
            {activeTab === 'plan' && renderPlan()}
            {activeTab === 'commit' && renderCommit()}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
