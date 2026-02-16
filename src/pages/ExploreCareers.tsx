import { useState, useEffect } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
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
  'Healthcare': '🏥',
  'Technology': '💻',
  'Business & Entrepreneurship': '💼',
  'Creative & Media': '🎨',
  'Skilled Trades': '🔧',
  'Public Service': '🏛️',
};

export default function ExploreCareers() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [careerDomains, setCareerDomains] = useState<CareerDomain[]>([]);
  const [allCareerPaths, setAllCareerPaths] = useState<CareerPath[]>([]);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const profile = user ? storage.allProfiles().find((p) => p.userId === user.id) : undefined;

  useEffect(() => {
    Promise.all([fetchCareerDomains(), fetchCareerPaths()]).then(([d, p]) => {
      setCareerDomains(d.filter(dom => dom.name !== 'General Exploration'));
      setAllCareerPaths(p.filter(path => path.name !== 'General Exploration'));
      setLoading(false);
    });
  }, []);

  if (!user) return <Navigate to="/login" />;

  const domainPaths = selectedDomainId ? allCareerPaths.filter(p => p.domainId === selectedDomainId) : [];
  const selectedPath = selectedPathId ? allCareerPaths.find(p => p.id === selectedPathId) : null;
  const selectedDomain = selectedDomainId ? careerDomains.find(d => d.id === selectedDomainId) : null;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />

        <main className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
            <div className="flex items-center justify-between px-6 py-3">
              <div className="flex items-center gap-3">
                <SidebarTrigger className="text-muted-foreground" />
                <h1 className="text-sm font-medium text-muted-foreground hidden sm:block">Explore Career Paths</h1>
              </div>
            </div>
          </div>

          <div className="max-w-5xl mx-auto px-6 py-6 space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-lg font-bold text-card-foreground">Explore Career Paths</h2>
              <p className="text-sm text-muted-foreground mt-1">
                Discover how careers connect and find your direction. Pick a domain to see the roadmap.
              </p>
            </div>

            {/* Domain tiles */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-5 h-5 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading domains…</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {careerDomains.map(d => {
                  const isActive = selectedDomainId === d.id;
                  return (
                    <button
                      key={d.id}
                      onClick={() => {
                        setSelectedDomainId(isActive ? null : d.id);
                        setSelectedPathId(null);
                      }}
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
                      isCurrentPath={profile?.careerPathId === selectedPath.id}
                      onStartPath={() => nav('/onboarding', { state: { careerPathId: selectedPath.id } })}
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

            {selectedDomainId && domainPaths.length === 0 && (
              <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                <p className="text-sm text-muted-foreground">No career paths found in this domain yet.</p>
              </div>
            )}
          </div>
        </main>
      </div>
    </SidebarProvider>
  );
}
