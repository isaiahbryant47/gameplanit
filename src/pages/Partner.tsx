import { Navigate, Link } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { storage } from '@/lib/storage';
import { Plan, Profile } from '@/lib/types';
import { useMemo, useState } from 'react';
import { Search, Database, BrainCircuit, Users } from 'lucide-react';
import PartnerAnalytics from '@/components/PartnerAnalytics';

export default function Partner() {
  const { user, logout } = useAuth();
  const [grade, setGrade] = useState('');
  const [interest, setInterest] = useState('');
  const [zipPrefix, setZipPrefix] = useState('');
  const [transportation, setTransportation] = useState('');
  const [tab, setTab] = useState<'students' | 'analytics'>('students');

  const rows = useMemo(() => storage.allPlans().map((plan) => {
    const profile = storage.allProfiles().find((p) => p.id === plan.profileId);
    return profile ? { plan, profile } : null;
  }).filter(Boolean) as { plan: Plan; profile: Profile }[], []);

  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'partner_admin') return <Navigate to="/dashboard" />;

  const filtered = rows.filter(({ profile }) =>
    (!grade || profile.gradeLevel === grade) &&
    (!interest || profile.interests.join(',').toLowerCase().includes(interest.toLowerCase())) &&
    (!zipPrefix || profile.zipCode.startsWith(zipPrefix)) &&
    (!transportation || profile.constraints.transportation === transportation)
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Page Label */}
      <div className="fixed bottom-4 right-4 z-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Partner Dashboard</span>
      </div>
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-card-foreground">Partner Dashboard</h1>
            <p className="text-sm text-muted-foreground">Anonymized student plan data — emails are never shown</p>
          </div>
          <div className="flex gap-2">
            <Link to="/partner/resources" className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium text-foreground hover:bg-secondary transition-colors">
              <Database className="w-4 h-4" /> Resources
            </Link>
            <button onClick={() => { logout(); }} className="rounded-lg border border-border px-4 py-2 text-sm font-medium text-muted-foreground hover:bg-secondary transition-colors">
              Logout
            </button>
          </div>
        </div>
        {/* Tabs */}
        <div className="max-w-5xl mx-auto px-6">
          <div className="flex gap-1 -mb-px">
            <button
              onClick={() => setTab('students')}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'students' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Users className="w-4 h-4" /> Students
            </button>
            <button
              onClick={() => setTab('analytics')}
              className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
                tab === 'analytics' ? 'border-primary text-primary' : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <BrainCircuit className="w-4 h-4" /> Predictive Analytics
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {tab === 'analytics' ? (
          <PartnerAnalytics />
        ) : (
          <>
            {/* Filters */}
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <div className="flex items-center gap-2 mb-3">
                <Search className="w-4 h-4 text-muted-foreground" />
                <span className="text-sm font-medium text-card-foreground">Filters</span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <input className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Grade" value={grade} onChange={e => setGrade(e.target.value)} />
                <input className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Interest" value={interest} onChange={e => setInterest(e.target.value)} />
                <input className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="ZIP prefix" value={zipPrefix} onChange={e => setZipPrefix(e.target.value)} />
                <input className="rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring" placeholder="Transport" value={transportation} onChange={e => setTransportation(e.target.value)} />
              </div>
            </div>

            {/* Table */}
            <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-secondary/50">
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Plan</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Grade</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">ZIP</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Interests</th>
                      <th className="text-left px-4 py-3 font-medium text-muted-foreground">Transport</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.length === 0 ? (
                      <tr><td colSpan={5} className="px-4 py-8 text-center text-muted-foreground">No plans match the current filters</td></tr>
                    ) : (
                      filtered.map(({ plan, profile }) => (
                        <tr key={plan.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                          <td className="px-4 py-3 text-card-foreground font-medium">{plan.title}</td>
                          <td className="px-4 py-3 text-card-foreground">{profile.gradeLevel}</td>
                          <td className="px-4 py-3 text-card-foreground">{profile.zipCode.slice(0, 3)}**</td>
                          <td className="px-4 py-3 text-card-foreground">{profile.interests.join(', ')}</td>
                          <td className="px-4 py-3">
                            <span className="inline-flex rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                              {profile.constraints.transportation}
                            </span>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
