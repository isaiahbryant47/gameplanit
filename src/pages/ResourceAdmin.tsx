import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { fetchAllResources, type Resource } from '@/lib/resourceService';
import { Plus, Pencil, Trash2, ExternalLink, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Constants } from '@/integrations/supabase/types';
import type { Database } from '@/integrations/supabase/types';

type ResourceCategory = Database['public']['Enums']['resource_category'];
type TransportMode = Database['public']['Enums']['transport_mode'];

const categoryLabels: Record<ResourceCategory, string> = {
  online_learning: 'Online Learning',
  local_opportunity: 'Local Opportunity',
  scholarship: 'Scholarship',
  mentorship: 'Mentorship',
  community_event: 'Community Event',
  career_program: 'Career Program',
};

const transportLabels: Record<TransportMode, string> = {
  walk: 'Walking',
  public: 'Public Transit',
  car: 'Car',
  mixed: 'Mixed',
  virtual: 'Virtual',
};

const emptyForm = {
  title: '',
  description: '',
  url: '',
  category: 'online_learning' as ResourceCategory,
  tags: '',
  grade_levels: '',
  zip_prefixes: '',
  cost_dollars: 0,
  transportation: 'virtual' as TransportMode,
  is_free: true,
};

export default function ResourceAdmin() {
  const { user } = useAuth();
  const [resources, setResources] = useState<Resource[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadResources();
  }, []);

  const loadResources = async () => {
    setLoading(true);
    const data = await fetchAllResources();
    setResources(data);
    setLoading(false);
  };

  if (!user) return <Navigate to="/login" />;
  if (user.role !== 'partner_admin') return <Navigate to="/dashboard" />;

  const openEdit = (r: Resource) => {
    setEditing(r.id);
    setForm({
      title: r.title,
      description: r.description,
      url: r.url || '',
      category: r.category,
      tags: r.tags.join(', '),
      grade_levels: r.grade_levels.join(', '),
      zip_prefixes: r.zip_prefixes.join(', '),
      cost_dollars: r.cost_dollars,
      transportation: r.transportation,
      is_free: r.is_free,
    });
    setShowForm(true);
  };

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowForm(true);
  };

  const handleSave = async () => {
    const payload = {
      title: form.title,
      description: form.description,
      url: form.url || null,
      category: form.category,
      tags: form.tags.split(',').map(s => s.trim()).filter(Boolean),
      grade_levels: form.grade_levels.split(',').map(s => s.trim()).filter(Boolean),
      zip_prefixes: form.zip_prefixes.split(',').map(s => s.trim()).filter(Boolean),
      cost_dollars: Number(form.cost_dollars),
      transportation: form.transportation,
      is_free: form.is_free,
    };

    if (editing) {
      await supabase.from('resources').update(payload).eq('id', editing);
    } else {
      await supabase.from('resources').insert({ ...payload, created_by: null });
    }

    setShowForm(false);
    loadResources();
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this resource?')) return;
    await supabase.from('resources').delete().eq('id', id);
    loadResources();
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Page Label */}
      <div className="fixed bottom-4 right-4 z-10">
        <span className="text-xs font-semibold uppercase tracking-widest text-muted-foreground/60">Resource Manager</span>
      </div>
      {/* Header */}
      <div className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link to="/partner" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-bold text-card-foreground">Resource Manager</h1>
              <p className="text-sm text-muted-foreground">{resources.length} resources in database</p>
            </div>
          </div>
          <button
            onClick={openNew}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Plus className="w-4 h-4" /> Add Resource
          </button>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {/* Form */}
        {showForm && (
          <div className="rounded-xl border border-border bg-card p-6 shadow-sm space-y-4">
            <h2 className="text-lg font-semibold text-card-foreground">
              {editing ? 'Edit Resource' : 'New Resource'}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Title</label>
                <input
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.title}
                  onChange={e => setForm({ ...form, title: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">URL</label>
                <input
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.url}
                  onChange={e => setForm({ ...form, url: e.target.value })}
                />
              </div>
              <div className="md:col-span-2">
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Description</label>
                <textarea
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring min-h-[80px]"
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Category</label>
                <select
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.category}
                  onChange={e => setForm({ ...form, category: e.target.value as ResourceCategory })}
                >
                  {Constants.public.Enums.resource_category.map(c => (
                    <option key={c} value={c}>{categoryLabels[c]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Transportation</label>
                <select
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  value={form.transportation}
                  onChange={e => setForm({ ...form, transportation: e.target.value as TransportMode })}
                >
                  {Constants.public.Enums.transport_mode.map(t => (
                    <option key={t} value={t}>{transportLabels[t]}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Tags (comma-separated)</label>
                <input
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="technology, coding, career"
                  value={form.tags}
                  onChange={e => setForm({ ...form, tags: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Grade Levels (comma-separated)</label>
                <input
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="9, 10, 11, 12"
                  value={form.grade_levels}
                  onChange={e => setForm({ ...form, grade_levels: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">ZIP Prefixes (comma-separated)</label>
                <input
                  className="w-full rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                  placeholder="191, 190 (leave empty for nationwide)"
                  value={form.zip_prefixes}
                  onChange={e => setForm({ ...form, zip_prefixes: e.target.value })}
                />
              </div>
              <div className="flex items-center gap-4">
                <div>
                  <label className="text-xs font-medium text-muted-foreground mb-1 block">Cost ($)</label>
                  <input
                    type="number"
                    className="w-32 rounded-lg border border-input bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                    value={form.cost_dollars}
                    onChange={e => setForm({ ...form, cost_dollars: Number(e.target.value) })}
                  />
                </div>
                <label className="flex items-center gap-2 mt-4 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.is_free}
                    onChange={e => setForm({ ...form, is_free: e.target.checked })}
                    className="rounded border-input"
                  />
                  <span className="text-sm text-foreground">Free resource</span>
                </label>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button
                onClick={handleSave}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
              >
                {editing ? 'Update' : 'Create'}
              </button>
              <button
                onClick={() => setShowForm(false)}
                className="rounded-lg border border-border px-5 py-2.5 text-sm font-medium text-foreground hover:bg-secondary transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Resource List */}
        {loading ? (
          <div className="text-center py-12 text-muted-foreground">Loading resources...</div>
        ) : (
          <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-secondary/50">
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Title</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Category</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Tags</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Grades</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Free</th>
                    <th className="text-left px-4 py-3 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {resources.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-4 py-8 text-center text-muted-foreground">
                        No resources yet. Click "Add Resource" to get started.
                      </td>
                    </tr>
                  ) : (
                    resources.map(r => (
                      <tr key={r.id} className="border-b border-border last:border-0 hover:bg-secondary/30 transition-colors">
                        <td className="px-4 py-3">
                          <div className="font-medium text-card-foreground">{r.title}</div>
                          <div className="text-xs text-muted-foreground truncate max-w-[200px]">{r.description}</div>
                        </td>
                        <td className="px-4 py-3">
                          <span className="inline-flex rounded-full bg-accent px-2.5 py-0.5 text-xs font-medium text-accent-foreground">
                            {categoryLabels[r.category]}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-card-foreground text-xs">{r.tags.slice(0, 3).join(', ')}</td>
                        <td className="px-4 py-3 text-card-foreground text-xs">{r.grade_levels.join(', ') || 'All'}</td>
                        <td className="px-4 py-3 text-card-foreground">{r.is_free ? '✓' : `$${r.cost_dollars}`}</td>
                        <td className="px-4 py-3">
                          <div className="flex gap-1">
                            {r.url && (
                              <a href={r.url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
                                <ExternalLink className="w-3.5 h-3.5" />
                              </a>
                            )}
                            <button onClick={() => openEdit(r)} className="p-1.5 rounded hover:bg-secondary text-muted-foreground">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => handleDelete(r.id)} className="p-1.5 rounded hover:bg-destructive/10 text-destructive">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
