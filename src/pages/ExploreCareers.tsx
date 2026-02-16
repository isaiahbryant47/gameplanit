import { useState, useEffect, useMemo } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/storage';
import { fetchCareerDomains, fetchCareerPaths } from '@/lib/careerService';
import type { CareerDomain, CareerPath } from '@/lib/types';
import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import DashboardSidebar from '@/components/DashboardSidebar';
import CareerPathMap from '@/components/explore/CareerPathMap';
import CareerPreviewPanel from '@/components/explore/CareerPreviewPanel';
import {
  Stethoscope, Cpu, Briefcase, Palette, Wrench, Shield,
  Loader2, ArrowLeft,
} from 'lucide-react';

const domainIcons: Record<string, typeof Stethoscope> = {
  'Healthcare': Stethoscope,
  'Technology': Cpu,
  'Business & Entrepreneurship': Briefcase,
  'Creative & Media': Palette,
  'Skilled Trades': Wrench,
  'Public Service': Shield,
};

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
  const navigate = useNavigate();
  const [domains, setDomains] = useState<CareerDomain[]>([]);
  const [allPaths, setAllPaths] = useState<CareerPath[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedDomainId, setSelectedDomainId] = useState<string | null>(null);
  const [selectedPathId, setSelectedPathId] = useState<string | null>(null);
  const [showConfirmChange, setShowConfirmChange] = useState(false);
  const [pendingPathId, setPendingPathId] = useState<string | null>(null);

  const profile = user ? storage.allProfiles().find(p => p.userId === user.id) : undefined;
  const currentCareerPathId = profile?.careerPathId;

  useEffect(() => {
    Promise.all([fetchCareerDomains(), fetchCareerPaths()]).then(([d, p]) => {
      setDomains(d.filter(dom => dom.name !== 'General Exploration'));
      setAllPaths(p.filter(path => path.name !== 'General Exploration'));
      setLoading(false);
    });
  }, []);

  const domainPaths = useMemo(
    () => selectedDomainId ? allPaths.filter(p => p.domainId === selectedDomainId) : [],
    [selectedDomainId, allPaths]
  );

  const selectedPath = useMemo(
    () => selectedPathId ? allPaths.find(p => p.id === selectedPathId) : null,
    [selectedPathId, allPaths]
  );

  const selectedDomain = useMemo(
    () => selectedDomainId ? domains.find(d => d.id === selectedDomainId) : null,
    [selectedDomainId, domains]
  );

  const handleStartPath = (pathId: string) => {
    if (currentCareerPathId && currentCareerPathId !== pathId) {
      setPendingPathId(pathId);
      setShowConfirmChange(true);
    } else {
      navigate('/onboarding', { state: { careerPathId: pathId } });
    }
  };

  const confirmChangePath = () => {
    if (pendingPathId) {
      navigate('/onboarding', { state: { careerPathId: pendingPathId } });
    }
    setShowConfirmChange(false);
  };

  if (!user) return <Navigate to="/login" />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <main className="flex-1 min-w-0">
          {/* Top bar */}
          <div className="sticky top-0 z-10 border-b border-border bg-card/95 backdrop-blur-sm">
            <div className="flex items-center gap-3 px-6 py-3">
              <SidebarTrigger className="text-muted-foreground" />
              <h1 className="text-sm font-medium text-foreground">Explore Careers</h1>
            </div>
          </div>

          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 space-y-6">
            {/* Header */}
            <div>
              <h2 className="text-2xl font-bold text-foreground">
                Discover Your Future
              </h2>
              <p className="text-sm text-muted-foreground mt-1">
                Explore career areas, see how paths connect, and start building toward your goals.
              </p>
            </div>

            {/* SECTION 1: Domain Selector */}
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-6 h-6 animate-spin text-primary" />
                <span className="ml-2 text-sm text-muted-foreground">Loading career areas...</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                {domains.map(d => {
                  const isActive = selectedDomainId === d.id;
                  const emoji = domainEmojis[d.name] || '📋';
                  return (
                    <button
                      key={d.id}
                      onClick={() => {
                        setSelectedDomainId(isActive ? null : d.id);
                        setSelectedPathId(null);
                      }}
                      className={`relative rounded-xl border p-4 text-center transition-all duration-200 ${
                        isActive
                          ? 'border-primary bg-accent shadow-md ring-2 ring-primary/20'
                          : 'border-border bg-card hover:border-primary/40 hover:shadow-sm'
                      }`}
                    >
                      <span className="text-2xl block mb-2">{emoji}</span>
                      <span className={`text-xs font-semibold block leading-tight ${
                        isActive ? 'text-accent-foreground' : 'text-card-foreground'
                      }`}>
                        {d.name}
                      </span>
                    </button>
                  );
                })}
              </div>
            )}

            {/* SECTION 2 + 3: Career Map + Preview */}
            {selectedDomainId && domainPaths.length > 0 && (
              <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
                {/* Map area */}
                <div className="lg:col-span-3">
                  <CareerPathMap
                    paths={domainPaths}
                    allPaths={allPaths}
                    selectedPathId={selectedPathId}
                    currentCareerPathId={currentCareerPathId}
                    onSelect={setSelectedPathId}
                    domainName={selectedDomain?.name || ''}
                  />
                </div>

                {/* Preview panel */}
                <div className="lg:col-span-2">
                  {selectedPath ? (
                    <CareerPreviewPanel
                      path={selectedPath}
                      allPaths={allPaths}
                      isCurrentPath={currentCareerPathId === selectedPath.id}
                      onStartPath={() => handleStartPath(selectedPath.id)}
                      onSelectRelated={(id) => setSelectedPathId(id)}
                    />
                  ) : (
                    <div className="rounded-xl border border-dashed border-border bg-card/50 p-8 text-center">
                      <p className="text-sm text-muted-foreground">
                        👆 Click a career in the map to see details
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {selectedDomainId && domainPaths.length === 0 && !loading && (
              <div className="rounded-xl border border-border bg-card p-8 text-center">
                <p className="text-sm text-muted-foreground">No career paths available in this area yet.</p>
              </div>
            )}
          </div>
        </main>

        {/* Change Path Confirmation Dialog */}
        {showConfirmChange && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
            <div className="rounded-xl border border-border bg-card p-6 max-w-sm mx-4 shadow-lg space-y-4">
              <h3 className="text-base font-semibold text-card-foreground">Change Your Path?</h3>
              <p className="text-sm text-muted-foreground">
                You already have an active career path. Starting a new one will begin a fresh 12-week cycle. Your previous progress will be saved.
              </p>
              <div className="flex gap-3 justify-end">
                <button
                  onClick={() => setShowConfirmChange(false)}
                  className="px-4 py-2 text-sm rounded-lg border border-border text-muted-foreground hover:bg-secondary transition-colors"
                >
                  Keep Current
                </button>
                <button
                  onClick={confirmChangePath}
                  className="px-4 py-2 text-sm rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
                >
                  Start New Path
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </SidebarProvider>
  );
}
