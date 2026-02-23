import { useState, useEffect } from 'react';
import { fetchAggregatedAnalytics, type AggregatedAnalytics } from '@/lib/predict/analyticsService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell, PieChart, Pie } from 'recharts';
import { BrainCircuit, Loader2, AlertTriangle, Users, Compass, Map, Shield } from 'lucide-react';

export default function PartnerAnalytics() {
  const [data, setData] = useState<AggregatedAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchAggregatedAnalytics().then(d => {
      setData(d);
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-5 h-5 animate-spin text-primary" />
        <span className="ml-2 text-sm text-muted-foreground">Loading analytics...</span>
      </div>
    );
  }

  if (!data || data.overall.totalUsers === 0) {
    return (
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <BrainCircuit className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
        <p className="text-sm text-muted-foreground">No analytics data yet. Snapshots are built automatically as students use the platform.</p>
      </div>
    );
  }

  const formatPct = (v: number) => `${Math.round(v * 100)}%`;
  const rd = data.readinessDistribution;

  return (
    <div className="space-y-4">
      {/* Overview cards */}
      <div className="grid grid-cols-3 gap-3">
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Total Students</span>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{data.overall.totalUsers}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <BrainCircuit className="w-3.5 h-3.5 text-primary" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">Avg Adherence</span>
          </div>
          <p className="text-2xl font-bold text-card-foreground">{formatPct(data.overall.avgAdherence)}</p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="w-3.5 h-3.5 text-destructive" />
            <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide">At Risk</span>
          </div>
          <p className="text-2xl font-bold text-destructive">{Math.round(data.overall.atRiskPct)}%</p>
        </div>
      </div>

      {/* Readiness Distribution (new Phase 4) */}
      {rd && rd.totalScored > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-1.5">
            <Shield className="w-4 h-4 text-primary" /> Career Readiness Distribution
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Tier 1 (0-33%)</p>
              <p className="text-xl font-bold text-card-foreground">{rd.tier1}</p>
              <p className="text-[10px] text-muted-foreground">Emerging</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Tier 2 (34-66%)</p>
              <p className="text-xl font-bold text-primary">{rd.tier2}</p>
              <p className="text-[10px] text-muted-foreground">Growing</p>
            </div>
            <div className="rounded-lg border border-border p-3 text-center">
              <p className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide mb-1">Tier 3 (67%+)</p>
              <p className="text-xl font-bold text-success">{rd.tier3}</p>
              <p className="text-[10px] text-muted-foreground">Ready</p>
            </div>
          </div>
          <p className="text-[10px] text-muted-foreground mt-2">{rd.totalScored} students with readiness scores</p>
        </div>
      )}

      {/* By Goal Domain */}
      {data.byDomain.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-1.5">
            <Compass className="w-4 h-4 text-primary" /> Plans by Goal Domain
          </h3>
          <div className="flex gap-6">
            <ResponsiveContainer width="50%" height={200}>
              <PieChart>
                <Pie
                  data={data.byDomain.map(d => ({ name: d.label, value: d.planCount }))}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  label={({ name, value }) => `${name} (${value})`}
                >
                  {data.byDomain.map((_, i) => (
                    <Cell key={i} fill={['hsl(var(--primary))', 'hsl(var(--accent-foreground))', 'hsl(var(--muted-foreground))'][i % 3]} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }} />
              </PieChart>
            </ResponsiveContainer>
            <div className="flex-1 flex flex-col justify-center space-y-2">
              {data.byDomain.map(d => (
                <div key={d.domain} className="flex items-center justify-between text-sm">
                  <span className="text-card-foreground font-medium">{d.label}</span>
                  <span className="text-muted-foreground">{d.planCount} plans</span>
                </div>
              ))}
            </div>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">
            Domains with &lt;5 plans are hidden for k-anonymity.
          </div>
        </div>
      )}

      {/* By Pathway */}
      {data.byPathway.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-3 flex items-center gap-1.5">
            <Map className="w-4 h-4 text-primary" /> Plans by Pathway
          </h3>
          <ResponsiveContainer width="100%" height={Math.max(160, data.byPathway.length * 50)}>
            <BarChart layout="vertical" data={data.byPathway.map(p => ({ name: p.pathwayTitle, plans: p.planCount, avgCycle: Number(p.avgCycle.toFixed(1)) }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis dataKey="name" type="category" width={180} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                formatter={(value: number, name: string) => [value, name === 'plans' ? 'Plans' : 'Avg Cycle']}
              />
              <Bar dataKey="plans" radius={[0, 4, 4, 0]} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-3 overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Pathway</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Domain</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Plans</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Avg Cycle</th>
                </tr>
              </thead>
              <tbody>
                {data.byPathway.map(p => (
                  <tr key={p.pathwayId} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-card-foreground font-medium">{p.pathwayTitle}</td>
                    <td className="px-3 py-2 text-muted-foreground capitalize">{p.domain.replace('_', ' ')}</td>
                    <td className="px-3 py-2 text-card-foreground">{p.planCount}</td>
                    <td className="px-3 py-2 text-card-foreground">{p.avgCycle.toFixed(1)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-2 text-[10px] text-muted-foreground">
            Pathways with &lt;5 plans are hidden for k-anonymity.
          </div>
        </div>
      )}

      {/* By Grade */}
      {data.byGrade.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Avg Predicted Adherence by Grade</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.byGrade.map(g => ({ name: `Grade ${g.grade}`, adherence: Math.round(g.avgAdherence * 100), count: g.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                formatter={(value: number) => [`${value}%`, 'Adherence']}
              />
              <Bar dataKey="adherence" radius={[4, 4, 0, 0]}>
                {data.byGrade.map((_, i) => (
                  <Cell key={i} fill={`hsl(var(--primary))`} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
          <div className="mt-2 text-[10px] text-muted-foreground">
            Buckets with &lt;5 students are grouped as "Other" for privacy.
          </div>
        </div>
      )}

      {/* By Hours */}
      {data.byHours.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Avg Predicted Adherence by Weekly Hours</h3>
          <ResponsiveContainer width="100%" height={200}>
            <BarChart data={data.byHours.map(h => ({ name: h.bucket, adherence: Math.round(h.avgAdherence * 100), count: h.count }))}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="name" tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <YAxis domain={[0, 100]} tick={{ fontSize: 11, fill: 'hsl(var(--muted-foreground))' }} />
              <Tooltip
                contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid hsl(var(--border))', background: 'hsl(var(--card))' }}
                formatter={(value: number) => [`${value}%`, 'Adherence']}
              />
              <Bar dataKey="adherence" radius={[4, 4, 0, 0]} fill="hsl(var(--primary))" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* By Transport */}
      {data.byTransport.length > 0 && (
        <div className="rounded-xl border border-border bg-card shadow-sm p-5">
          <h3 className="text-sm font-semibold text-card-foreground mb-3">Avg Predicted Adherence by Transportation</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Transport</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Students</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Avg Adherence</th>
                  <th className="text-left px-3 py-2 font-medium text-muted-foreground text-xs">Bar</th>
                </tr>
              </thead>
              <tbody>
                {data.byTransport.map(t => (
                  <tr key={t.transport} className="border-b border-border last:border-0">
                    <td className="px-3 py-2 text-card-foreground capitalize">{t.transport}</td>
                    <td className="px-3 py-2 text-muted-foreground">{t.count}</td>
                    <td className="px-3 py-2 text-card-foreground font-medium">{formatPct(t.avgAdherence)}</td>
                    <td className="px-3 py-2">
                      <div className="w-full h-2 rounded-full bg-border overflow-hidden">
                        <div className="h-full rounded-full bg-primary" style={{ width: `${Math.round(t.avgAdherence * 100)}%` }} />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
