import { useState, useEffect } from 'react';
import { fetchAggregatedAnalytics, type AggregatedAnalytics } from '@/lib/predict/analyticsService';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Cell } from 'recharts';
import { BrainCircuit, Loader2, AlertTriangle, Users } from 'lucide-react';

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
        <p className="text-sm text-muted-foreground">No prediction data yet. Analytics populate as students use their plans.</p>
      </div>
    );
  }

  const formatPct = (v: number) => `${Math.round(v * 100)}%`;

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
