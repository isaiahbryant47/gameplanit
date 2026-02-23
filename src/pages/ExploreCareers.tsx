import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { loadProfile } from '@/lib/services';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import DashboardSidebar from '@/components/DashboardSidebar';
import CareerPathMap from '@/components/explore/CareerPathMap';
import CareerPreviewPanel from '@/components/explore/CareerPreviewPanel';
import { fetchCareerDomains, fetchCareerPaths } from '@/lib/careerService';
import type { CareerDomain, CareerPath, Profile } from '@/lib/types';
import { Search, X, ArrowLeft, Compass, ArrowRight } from 'lucide-react';

const domainEmojis: Record<string, string> = {
  'Healthcare': '🏥',
  'Technology': '💻',
  'Business & Entrepreneurship': '💼',
  'Creative & Media': '🎨',
  'Skilled Trades': '🔧',
  'Public Service': '🏛️',
};

const domainDescriptions: Record<string, string> = {
  'Healthcare': 'Medicine, nursing, therapy & wellness',
  'Technology': 'Software, data, cybersecurity & IT',
  'Business & Entrepreneurship': 'Finance, marketing & startups',
  'Creative & Media': 'Design, film, music & content',
  'Skilled Trades': 'Construction, electrical & mechanics',
  'Public Service': 'Government, law & community work',
};

export default function ExploreCareers() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [careerDomains, setCareerDomains] = useState<CareerDomain[]>([]);
  const [allCareerPaths, setAllCareerPaths] = useState<CareerPath[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTagFilter, setActiveTagFilter] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | undefined>();

  useEffect(() => {
    if (user) loadProfile(user.id).then(setProfile);
  }, [user?.id]);

  useEffect(() => {
    Promise.all([fetchCareerDomains(), fetchCareerPaths()]).then(([d, p]) => {
      setCareerDomains(d.filter(dom => dom.name !== 'General Exploration'));
      setAllCareerPaths(p.filter(path => path.name !== 'General Exploration'));
      setLoading(false);
    });
  }, []);

  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const q = searchQuery.toLowerCase();
    return allCareerPaths.filter(
      p => p.name.toLowerCase().includes(q) ||
           p.description.toLowerCase().includes(q) ||
           p.tags.some(t => t.toLowerCase().includes(q))
    );
  }, [searchQuery, allCareerPaths]);

  const isSearching = searchQuery.trim().length > 0;

  const domainPaths = useMemo(() => {
    if (!selectedDomainId) return [];
    let paths = allCareerPaths.filter(p => p.domainId === selectedDomainId);
    if (activeTagFilter) {
      paths = paths.filter(p => p.tags.includes(activeTagFilter));
    }
    return paths;
  }, [selectedDomainId, allCareerPaths, activeTagFilter]);

  const domainTags = useMemo(() => {
    if (!selectedDomainId) return [];
    const paths = allCareerPaths.filter(p => p.domainId === selectedDomainId);
    const tagSet = new Set<string>();
    paths.forEach(p => p.tags.forEach(t => tagSet.add(t)));
    return Array.from(tagSet).sort();
  }, [selectedDomainId, allCareerPaths]);

  const domainCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    allCareerPaths.forEach(p => {
      counts[p.domainId] = (counts[p.domainId] || 0) + 1;
    });
    return counts;
  }, [allCareerPaths]);

  const selectedPath = selectedPathId ? allCareerPaths.find(p => p.id === selectedPathId) : null;
  const selectedDomain = selectedDomainId ? careerDomains.find(d => d.id === selectedDomainId) : null;

  const handleSelectDomain = (domainId: string) => {
    const isActive = selectedDomainId === domainId;
    setSelectedDomainId(isActive ? null : domainId);
    setSelectedPathId(null);
    setActiveTagFilter(null);
    setSearchQuery('');
  };

  const handleSearchSelect = (path: CareerPath) => {
    setSelectedDomainId(path.domainId);
    setSelectedPathId(path.id);
    setSearchQuery('');
    setActiveTagFilter(null);
  };

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

          <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
            <div className="space-y-4">
              <div>
                <h2 className="text-lg font-bold text-card-foreground">Explore Career Paths</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Discover how careers connect and find your direction. Pick a domain or search for a career.
                </p>
              </div>

              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search careers by name, description, or skill..."
                  className="w-full rounded-lg border border-border bg-card pl-10 pr-10 py-2.5 text-sm text-card-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-colors"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-card-foreground transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {isSearching && (
                <div className="rounded-xl border border-border bg-card overflow-hidden">
                  <div className="px-4 py-2.5 border-b border-border bg-accent/30">
                    <p className="text-xs font-medium text-muted-foreground">
                      {searchResults.length} {searchResults.length === 1 ? 'career' : 'careers'} found
                    </p>
                  </div>
                  {searchResults.length > 0 ? (
                    <div className="max-h-72 overflow-y-auto divide-y divide-border">
                      {searchResults.map(path => {
                        const domain = careerDomains.find(d => d.id === path.domainId);
                        return (
                          <button
                            key={path.id}
                            onClick={() => handleSearchSelect(path)}
                            className="w-full text-left px-4 py-3 hover:bg-secondary transition-colors flex items-start gap-3"
                          >
                            <span className="text-lg shrink-0 mt-0.5">{domainEmojis[domain?.name || ''] || '📋'}</span>
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-semibold text-card-foreground">{path.name}</p>
                              <p className="text-xs text-muted-foreground line-clamp-1">{path.description}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] font-medium text-primary bg-primary/10 rounded-full px-2 py-0.5">
                                  {domain?.name || 'Unknown'}
                                </span>
                                {path.tags.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-[10px] text-muted-foreground bg-secondary rounded-full px-2 py-0.5">
                                    {tag}
                                  </span>
                                ))}
                              </div>
                            </div>
                            <ArrowRight className="w-4 h-4 text-muted-foreground shrink-0 mt-1" />
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-8 text-center">
                      <p className="text-sm text-muted-foreground">No careers match your search. Try different keywords.</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {!isSearching && (
              <>
                {loading ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="rounded-xl border border-border p-4 animate-pulse">
                          <div className="w-8 h-8 bg-muted rounded-full mx-auto mb-2" />
                          <div className="h-3 w-16 bg-muted rounded mx-auto mb-1.5" />
                          <div className="h-2 w-12 bg-muted rounded mx-auto" />
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    {careerDomains.map(d => {
                      const isActive = selectedDomainId === d.id;
                      const count = domainCounts[d.id] || 0;
                      return (
                        <button
                          key={d.id}
                          onClick={() => handleSelectDomain(d.id)}
                          className={`rounded-xl border p-4 text-center transition-all ${
                            isActive
                              ? 'border-primary bg-accent ring-1 ring-primary/20 shadow-sm'
                              : 'border-border hover:border-primary/40 hover:shadow-sm'
                          }`}
                        >
                          <span className="text-2xl block mb-1.5">{domainEmojis[d.name] || '📋'}</span>
                          <span className={`text-xs font-semibold leading-tight block ${isActive ? 'text-accent-foreground' : 'text-card-foreground'}`}>
                            {d.name}
                          </span>
                          <span className="text-[10px] text-muted-foreground block mt-1 leading-snug">
                            {domainDescriptions[d.name] || d.description}
                          </span>
                          <span className={`text-[10px] mt-1.5 inline-block rounded-full px-2 py-0.5 font-medium ${
                            isActive ? 'bg-primary/15 text-primary' : 'bg-secondary text-muted-foreground'
                          }`}>
                            {count} {count === 1 ? 'career' : 'careers'}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}

                {selectedDomainId && !loading && (
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setSelectedDomainId(null);
                            setSelectedPathId(null);
                            setActiveTagFilter(null);
                          }}
                          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground hover:text-card-foreground transition-colors"
                        >
                          <ArrowLeft className="w-3 h-3" /> All Domains
                        </button>
                        <span className="text-xs text-muted-foreground">/</span>
                        <span className="text-xs font-semibold text-card-foreground">
                          {domainEmojis[selectedDomain?.name || ''] || '📋'} {selectedDomain?.name}
                        </span>
                      </div>
                    </div>

                    {domainTags.length > 1 && (
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          onClick={() => setActiveTagFilter(null)}
                          className={`text-[11px] font-medium rounded-full px-3 py-1 transition-colors ${
                            !activeTagFilter
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                          }`}
                        >
                          All
                        </button>
                        {domainTags.map(tag => (
                          <button
                            key={tag}
                            onClick={() => setActiveTagFilter(activeTagFilter === tag ? null : tag)}
                            className={`text-[11px] font-medium rounded-full px-3 py-1 transition-colors ${
                              activeTagFilter === tag
                                ? 'bg-primary text-primary-foreground'
                                : 'bg-secondary text-muted-foreground hover:bg-secondary/80'
                            }`}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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
                          isCurrentPath={profile?.careerPathId === selectedPath.id}
                          onStartPath={() => nav('/onboarding', { state: { careerPathId: selectedPath.id } })}
                          onSelectRelated={setSelectedPathId}
                        />
                      ) : (
                        <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center space-y-3">
                          <Compass className="w-8 h-8 text-muted-foreground/40 mx-auto" />
                          <div>
                            <p className="text-sm font-medium text-card-foreground">Select a career</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Click any career in the map to see what the path looks like, what you'll learn, and where it can lead.
                            </p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedDomainId && domainPaths.length === 0 && !loading && (
                  <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center space-y-2">
                    <p className="text-sm text-muted-foreground">
                      {activeTagFilter
                        ? `No careers match the "${activeTagFilter}" filter in this domain.`
                        : 'No career paths found in this domain yet.'}
                    </p>
                    {activeTagFilter && (
                      <button
                        onClick={() => setActiveTagFilter(null)}
                        className="text-xs text-primary hover:underline"
                      >
                        Clear filter
                      </button>
                    )}
                  </div>
                )}

                {!selectedDomainId && !loading && (
                  <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center space-y-3">
                    <Compass className="w-10 h-10 text-muted-foreground/40 mx-auto" />
                    <div>
                      <p className="text-base font-semibold text-card-foreground">Choose a Domain</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Select a career domain above to explore paths, or use the search bar to find specific careers.
                      </p>
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
