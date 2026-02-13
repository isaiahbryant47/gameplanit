import { Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/storage';
import { generatePlanWeeksWithResources } from '@/lib/planGenerator';
import { RefreshCw, Printer, LogOut, ChevronDown, List, CalendarDays } from 'lucide-react';
import { useState } from 'react';
import ResourceDiscovery from '@/components/ResourceDiscovery';
import PlanCalendarView from '@/components/PlanCalendarView';

export default function Dashboard() {
  const { user, logout } = useAuth();
  const nav = useNavigate();
  const [expandedWeek, setExpandedWeek] = useState<number | null>(1);
  const [view, setView] = useState<'list' | 'calendar'>('list');

  if (!user) return <Navigate to="/login" />;
  const profile = storage.allProfiles().find((p) => p.userId === user.id);
  const plan = storage.allPlans().find((p) => p.userId === user.id);

  if (!profile || !plan) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-6">
        <div className="text-center space-y-4">
          <p className="text-lg text-muted-foreground">No plan yet.</p>
          <button onClick={() => nav('/onboarding')} className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground">
            Start Onboarding
          </button>
        </div>
      </div>
    );
  }

  const regenerate = async () => {
    const weeks = await generatePlanWeeksWithResources(profile, plan.id);
    const updated = { ...plan, createdAt: new Date().toISOString(), weeks };
    storage.savePlans([...storage.allPlans().filter((p) => p.userId !== user.id), updated]);
    nav(0);
  };

  const exportPdf = () => {
    const html = `<html><head><title>${plan.title}</title><style>body{font-family:system-ui;max-width:700px;margin:0 auto;padding:40px}h1{color:#1a5c3a}h3{margin-top:24px;color:#1a5c3a}ul{margin:8px 0}li{margin:4px 0}</style></head><body><h1>${plan.title}</h1>${plan.weeks.map(w => `<h3>Week ${w.weekNumber}: ${w.focus}</h3><ul>${w.actions.map(a => `<li>${a}</li>`).join('')}</ul>`).join('')}</body></html>`;
    const w = window.open('', '_blank');
    if (!w) return;
    w.document.write(html);
    w.document.close();
    w.print();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Label */}
      <div className="absolute top-4 left-4 z-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Student Dashboard</span>
      </div>
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-card-foreground">{plan.title}</h1>
            <p className="text-sm text-muted-foreground">Created {new Date(plan.createdAt).toLocaleDateString()}</p>
          </div>
          <div className="flex gap-2">
            <div className="inline-flex rounded-lg border border-border overflow-hidden">
              <button onClick={() => setView('list')} className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${view === 'list' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
                <List className="w-4 h-4" /> List
              </button>
              <button onClick={() => setView('calendar')} className={`inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium transition-colors ${view === 'calendar' ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-secondary'}`}>
                <CalendarDays className="w-4 h-4" /> Calendar
              </button>
            </div>
            <button onClick={regenerate} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              <RefreshCw className="w-4 h-4" /> Regenerate
            </button>
            <button onClick={exportPdf} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity">
              <Printer className="w-4 h-4" /> Export PDF
            </button>
            <button onClick={() => { logout(); nav('/'); }} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Weeks */}
      <div className="max-w-4xl mx-auto px-6 py-6 space-y-4">
        {/* AI Resource Discovery */}
        <ResourceDiscovery profile={profile} />

        {/* Weekly Plan */}
        {view === 'calendar' ? (
          <PlanCalendarView plan={plan} />
        ) : (
          plan.weeks.map(week => {
            const isOpen = expandedWeek === week.weekNumber;
            return (
              <div key={week.id} className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
                <button
                  onClick={() => setExpandedWeek(isOpen ? null : week.weekNumber)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-secondary/50 transition-colors"
                >
                  <div>
                    <span className="text-xs font-medium text-primary">WEEK {week.weekNumber}</span>
                    <h2 className="text-sm font-semibold text-card-foreground">{week.focus}</h2>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isOpen ? 'rotate-180' : ''}`} />
                </button>
                {isOpen && (
                  <div className="px-5 pb-5 space-y-3">
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Actions</h4>
                      <ul className="space-y-1.5">
                        {week.actions.map((a, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm text-card-foreground">
                            <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                            {a}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <h4 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2">Resources</h4>
                      <ul className="space-y-1">
                        {week.resources.map((r, i) => (
                          <li key={i} className="text-sm text-primary hover:underline">
                            {r.startsWith('http') ? <a href={r} target="_blank" rel="noopener noreferrer">{r}</a> : r}
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="pt-2 border-t border-border">
                      <p className="text-xs text-muted-foreground">{week.milestones[0]}</p>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
