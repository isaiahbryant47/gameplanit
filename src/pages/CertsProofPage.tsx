import { useAuth } from '@/hooks/useAuth';
import { loadProfile, loadPlan, loadProgress } from '@/lib/services';
import { recomputeReadinessServer } from '@/lib/services/readinessService';
import { uploadEvidence, listEvidence, deleteEvidence, type StudentEvidence } from '@/lib/services/evidenceService';
import DashboardLayout from '@/components/DashboardLayout';
import ReadinessSnapshot from '@/components/ReadinessSnapshot';
import { Award, FolderOpen, CheckCircle2, Star, FileText, Upload, Trash2, ExternalLink, X } from 'lucide-react';
import { useState, useEffect, useMemo, useRef } from 'react';
import type { ReadinessExplanation } from '@/lib/readinessEngine';
import type { StructuredWeek } from '@/lib/llmPlanService';
import type { Profile, Plan } from '@/lib/types';
import type { ProgressData } from '@/lib/services/progressService';
import { toast } from 'sonner';

const EVIDENCE_TYPES = ['resume', 'certificate', 'project', 'reflection', 'document', 'other'] as const;
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB

export default function CertsProofPage() {
  const { user } = useAuth();
  const [readinessData, setReadinessData] = useState<ReadinessExplanation | null>(null);
  const [profile, setProfile] = useState<Profile | undefined>();
  const [plan, setPlan] = useState<Plan | undefined>();
  const [progress, setProgress] = useState<ProgressData>({ completedActions: {}, resourcesEngaged: [], academicLog: [], completedGoals: {} });
  const [structuredWeeks, setStructuredWeeks] = useState<StructuredWeek[]>([]);
  const [loading, setLoading] = useState(true);

  // Evidence state
  const [evidence, setEvidence] = useState<StudentEvidence[]>([]);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadDesc, setUploadDesc] = useState('');
  const [uploadType, setUploadType] = useState<string>('document');
  const [uploadFile, setUploadFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([loadProfile(user.id), loadPlan(user.id)]).then(async ([prof, planData]) => {
      if (cancelled) return;
      setProfile(prof);
      setPlan(planData.plan);
      setStructuredWeeks(planData.structuredWeeks);
      const prog = await loadProgress(user.id, planData.plan?.id);
      if (!cancelled) {
        setProgress(prog);
        setLoading(false);
      }
    });
    // Load evidence
    listEvidence(user.id).then(setEvidence);
    return () => { cancelled = true; };
  }, [user?.id]);

  const careerPathId = profile?.careerPathId || (plan as any)?.careerPathId;
  const cycleNumber = plan?.cycleNumber || 1;

  const proofActions = useMemo(() => {
    const items: { task: string; resource: string; weekNum: number; done: boolean }[] = [];
    structuredWeeks.forEach(sw => {
      const planWeek = plan?.weeks.find(w => w.weekNumber === sw.week);
      sw.actions.forEach((a, i) => {
        const pillar = (a.pillar || '').toLowerCase();
        if (pillar.includes('proof') || pillar.includes('portfolio')) {
          const done = planWeek ? !!progress.completedActions[`${planWeek.id}-${i}`] : false;
          items.push({ task: a.task, resource: a.resource, weekNum: sw.week, done });
        }
      });
    });
    return items;
  }, [structuredWeeks, plan, progress]);

  const completedMilestones = useMemo(() => {
    if (!plan) return [];
    return plan.weeks
      .filter(w => {
        const allDone = w.actions.every((_, i) => progress.completedActions[`${w.id}-${i}`]);
        return allDone && w.actions.length > 0;
      })
      .map(w => ({ weekNumber: w.weekNumber, milestone: w.milestones[0] || `Week ${w.weekNumber} complete` }));
  }, [plan, progress]);

  useEffect(() => {
    if (!user || !careerPathId) return;
    const totalActions = plan?.weeks.reduce((s, w) => s + w.actions.length, 0) || 0;
    const completedCount = plan?.weeks.reduce((s, w) =>
      s + w.actions.filter((_, i) => progress.completedActions[`${w.id}-${i}`]).length, 0
    ) || 0;
    recomputeReadinessServer({
      userId: user.id,
      careerPathId,
      cycleNumber,
      pillarMilestoneRates: {},
      overallMilestoneRate: totalActions > 0 ? Math.round((completedCount / totalActions) * 100) : 0,
      acceptedOpportunityPillars: [],
      engagedPillars: [],
    }).then(setReadinessData).catch(console.error);
  }, [user?.id, careerPathId, cycleNumber]);

  const handleUpload = async () => {
    if (!user || !uploadFile || !uploadTitle.trim()) return;
    if (uploadFile.size > MAX_FILE_SIZE) {
      toast.error('File must be under 10 MB');
      return;
    }
    setUploading(true);
    const result = await uploadEvidence(user.id, uploadFile, uploadTitle.trim(), uploadDesc.trim(), uploadType);
    setUploading(false);
    if (result) {
      toast.success('Evidence uploaded!');
      setEvidence(prev => [result, ...prev]);
      setShowUpload(false);
      setUploadTitle('');
      setUploadDesc('');
      setUploadFile(null);
      setUploadType('document');
      // Refresh URLs
      listEvidence(user.id).then(setEvidence);
    } else {
      toast.error('Upload failed. Please try again.');
    }
  };

  const handleDelete = async (item: StudentEvidence) => {
    const ok = await deleteEvidence(item.id, item.filePath);
    if (ok) {
      setEvidence(prev => prev.filter(e => e.id !== item.id));
      toast.success('Evidence removed');
    }
  };

  if (loading) {
    return (
      <DashboardLayout title="My Proof">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="text-sm text-muted-foreground">Loading...</p>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title="My Proof">
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Award className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-card-foreground">Certifications & Proof of Work</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Track your portfolio pieces, certifications, and milestones. Upload artifacts as evidence of your progress.
        </p>
      </div>

      <ReadinessSnapshot readinessData={readinessData} />

      {/* ── Upload Evidence Section ── */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Upload className="w-4 h-4 text-primary" />
            <h3 className="text-sm font-semibold text-card-foreground">My Evidence</h3>
            <span className="text-xs text-muted-foreground">({evidence.length})</span>
          </div>
          <button
            onClick={() => setShowUpload(!showUpload)}
            className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-1.5 text-xs font-medium text-primary hover:bg-secondary transition-colors"
          >
            {showUpload ? <X className="w-3.5 h-3.5" /> : <Upload className="w-3.5 h-3.5" />}
            {showUpload ? 'Cancel' : 'Upload'}
          </button>
        </div>

        {showUpload && (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-4 space-y-3">
            <input
              type="text"
              placeholder="Title (e.g., Resume v2, Python Certificate)"
              value={uploadTitle}
              onChange={e => setUploadTitle(e.target.value)}
              maxLength={100}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            />
            <textarea
              placeholder="Description (optional)"
              value={uploadDesc}
              onChange={e => setUploadDesc(e.target.value)}
              maxLength={500}
              rows={2}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30 resize-none"
            />
            <div className="flex gap-3">
              <select
                value={uploadType}
                onChange={e => setUploadType(e.target.value)}
                className="rounded-lg border border-border bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              >
                {EVIDENCE_TYPES.map(t => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.doc,.docx,.png,.jpg,.jpeg,.webp,.txt,.md"
                onChange={e => setUploadFile(e.target.files?.[0] || null)}
                className="flex-1 text-sm file:mr-3 file:rounded-lg file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-foreground hover:file:bg-secondary/80"
              />
            </div>
            <button
              onClick={handleUpload}
              disabled={uploading || !uploadFile || !uploadTitle.trim()}
              className="inline-flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {uploading ? 'Uploading…' : 'Upload Evidence'}
            </button>
          </div>
        )}

        {evidence.length > 0 ? (
          <div className="space-y-2">
            {evidence.map(item => (
              <div key={item.id} className="flex items-start gap-3 rounded-lg border border-border p-3">
                <FileText className="w-4 h-4 text-primary mt-0.5 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-card-foreground truncate">{item.title}</p>
                  {item.description && (
                    <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-2">{item.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-secondary text-muted-foreground capitalize">{item.evidenceType}</span>
                    <span className="text-[10px] text-muted-foreground">{new Date(item.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  {item.fileUrl && (
                    <a href={item.fileUrl} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-secondary transition-colors">
                      <ExternalLink className="w-3.5 h-3.5 text-muted-foreground" />
                    </a>
                  )}
                  <button onClick={() => handleDelete(item)} className="p-1.5 rounded hover:bg-destructive/10 transition-colors">
                    <Trash2 className="w-3.5 h-3.5 text-destructive" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Upload resumes, certificates, or project screenshots as evidence of your progress.</p>
        )}
      </div>

      {/* ── Milestones ── */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Star className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Milestones Achieved</h3>
          <span className="ml-auto text-xs text-muted-foreground">{completedMilestones.length} earned</span>
        </div>
        {completedMilestones.length > 0 ? (
          <div className="space-y-2">
            {completedMilestones.map((m, i) => (
              <div key={i} className="flex items-center gap-3 rounded-lg bg-success/5 border border-success/20 p-3">
                <CheckCircle2 className="w-4 h-4 text-success shrink-0" />
                <div>
                  <p className="text-sm font-medium text-card-foreground">{m.milestone}</p>
                  <p className="text-[11px] text-muted-foreground">Week {m.weekNumber}</p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Complete all actions in a week to earn milestones.</p>
        )}
      </div>

      {/* ── Portfolio Activities ── */}
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <FolderOpen className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-card-foreground">Portfolio Building Activities</h3>
        </div>
        {proofActions.length > 0 ? (
          <div className="space-y-2">
            {proofActions.map((item, i) => (
              <div
                key={i}
                className={`flex items-start gap-3 rounded-lg border p-3 ${
                  item.done ? 'border-success/20 bg-success/5' : 'border-border'
                }`}
              >
                {item.done ? (
                  <CheckCircle2 className="w-4 h-4 text-success mt-0.5 shrink-0" />
                ) : (
                  <FileText className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
                )}
                <div>
                  <p className={`text-sm ${item.done ? 'text-muted-foreground line-through' : 'text-card-foreground'}`}>
                    {item.task}
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    Week {item.weekNum} · {item.resource}
                  </p>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-xs text-muted-foreground">Portfolio activities from your plan will appear here.</p>
        )}
      </div>
    </DashboardLayout>
  );
}
