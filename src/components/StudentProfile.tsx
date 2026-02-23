import { useState, useCallback } from 'react';
import { saveProfile } from '@/lib/services';
import type { Profile, Transportation } from '@/lib/types';
import { X, Save, User } from 'lucide-react';
import GoalBuilder from '@/components/GoalBuilder';

const transportOptions: { value: Transportation; label: string }[] = [
  { value: 'walk', label: '🚶 Walking' },
  { value: 'public', label: '🚌 Public transit' },
  { value: 'car', label: '🚗 Car' },
  { value: 'mixed', label: '🔀 Mixed' },
];

const hoursOptions = [
  { value: 2, label: '1–2 hours' },
  { value: 4, label: '3–4 hours' },
  { value: 6, label: '5–6 hours' },
  { value: 8, label: '7+ hours' },
];

const budgetOptions = [
  { value: 0, label: 'No budget ($0)' },
  { value: 20, label: 'Up to $20/mo' },
  { value: 50, label: 'Up to $50/mo' },
  { value: 100, label: '$50+/mo' },
];

const responsibilityOptions = [
  { value: 'none', label: 'None' },
  { value: 'sibling_care', label: 'Sibling care' },
  { value: 'part_time_job', label: 'Part-time job' },
  { value: 'household_chores', label: 'Household chores' },
  { value: 'caregiving', label: 'Caregiving for a family member' },
  { value: 'other', label: 'Other' },
];

const interestOptions = [
  { value: 'internships', label: '💼 Internships' },
  { value: 'volunteering', label: '🤝 Volunteering' },
  { value: 'college_help', label: '🎓 College help' },
  { value: 'tutoring', label: '📚 Tutoring' },
  { value: 'technology', label: '💻 Technology' },
  { value: 'arts', label: '🎨 Arts & creativity' },
  { value: 'sports', label: '⚽ Sports & fitness' },
  { value: 'music', label: '🎵 Music' },
  { value: 'leadership', label: '🏅 Leadership' },
  { value: 'entrepreneurship', label: '🚀 Entrepreneurship' },
  { value: 'trades', label: '🔧 Skilled trades' },
  { value: 'mental_health', label: '🧠 Mental health & wellness' },
];

const gradeOptions = ['9', '10', '11', '12'];

interface Props {
  profile: Profile;
  onClose: () => void;
  onSave: (updated: Profile) => void;
}

export default function StudentProfile({ profile, onClose, onSave }: Props) {
  const [f, setF] = useState({
    gradeLevel: profile.gradeLevel,
    schoolName: profile.schoolName || '',
    zipCode: profile.zipCode,
    interests: [...profile.interests],
    goals: profile.goals.join(', '),
    timePerWeekHours: profile.constraints.timePerWeekHours,
    budgetPerMonth: profile.constraints.budgetPerMonth,
    transportation: profile.constraints.transportation,
    responsibilities: profile.constraints.responsibilities ? profile.constraints.responsibilities.split(', ').filter(Boolean) : ([] as string[]),
    gpa: profile.baseline.gpa?.toString() || '',
    attendance: profile.baseline.attendance?.toString() || '',
  });

  const [saved, setSaved] = useState(false);

  const handleSave = async () => {
    const updated: Profile = {
      ...profile,
      gradeLevel: f.gradeLevel,
      schoolName: f.schoolName || undefined,
      zipCode: f.zipCode,
      interests: f.interests,
      goals: f.goals.split(',').map(s => s.trim()).filter(Boolean),
      constraints: {
        timePerWeekHours: f.timePerWeekHours,
        budgetPerMonth: f.budgetPerMonth,
        transportation: f.transportation,
        responsibilities: f.responsibilities.filter(r => r !== 'none').join(', '),
      },
      baseline: {
        gpa: f.gpa ? Number(f.gpa) : undefined,
        attendance: f.attendance ? Number(f.attendance) : undefined,
      },
    };

    try {
      await saveProfile(updated);
    } catch (e) {
      console.error('Failed to save profile:', e);
    }

    onSave(updated);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const toggleInterest = (value: string) => {
    setF(prev => ({
      ...prev,
      interests: prev.interests.includes(value)
        ? prev.interests.filter(i => i !== value)
        : [...prev.interests, value],
    }));
  };

  const toggleResponsibility = (value: string) => {
    setF(prev => {
      let next = prev.responsibilities.includes(value)
        ? prev.responsibilities.filter(r => r !== value)
        : [...prev.responsibilities, value];
      if (value === 'none') next = ['none'];
      else next = next.filter(r => r !== 'none');
      return { ...prev, responsibilities: next };
    });
  };

  return (
    <div className="rounded-xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-4 border-b border-border">
        <div className="flex items-center gap-2">
          <User className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-card-foreground">Student Profile & Settings</h2>
        </div>
        <button onClick={onClose} className="p-1 rounded-lg hover:bg-secondary transition-colors text-muted-foreground">
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="p-5 space-y-5">
        {/* Basic Info */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Basic Info</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Grade Level</label>
              <div className="flex gap-2">
                {gradeOptions.map(g => (
                  <button
                    key={g}
                    onClick={() => setF({ ...f, gradeLevel: g })}
                    className={`flex-1 rounded-lg border px-3 py-2 text-sm text-center transition-colors ${
                      f.gradeLevel === g ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {g}th
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">ZIP Code</label>
              <input
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={f.zipCode}
                onChange={e => setF({ ...f, zipCode: e.target.value })}
              />
            </div>
          </div>
          <div className="mt-3">
            <label className="text-xs text-muted-foreground mb-1 block">School Name (optional)</label>
            <input
              className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
              value={f.schoolName}
              onChange={e => setF({ ...f, schoolName: e.target.value })}
              placeholder="Enter school name"
            />
          </div>
        </div>

        {/* Interests */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Interests</h3>
          <div className="grid grid-cols-3 gap-2">
            {interestOptions.map(o => (
              <button
                key={o.value}
                onClick={() => toggleInterest(o.value)}
                className={`rounded-lg border px-3 py-2 text-xs text-left transition-colors ${
                  f.interests.includes(o.value) ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-secondary'
                }`}
              >
                {o.label}
              </button>
            ))}
          </div>
        </div>

        {/* Goals */}
        <GoalBuilder
          interests={f.interests}
          gradeLevel={f.gradeLevel}
          initialGoals={f.goals}
          onGoalsChange={useCallback((goals: string) => setF(prev => ({ ...prev, goals })), [])}
        />

        {/* Constraints */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Constraints & Availability</h3>
          <div className="space-y-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Hours per week</label>
              <div className="grid grid-cols-4 gap-2">
                {hoursOptions.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setF({ ...f, timePerWeekHours: o.value })}
                    className={`rounded-lg border px-3 py-2 text-xs text-center transition-colors ${
                      f.timePerWeekHours === o.value ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Monthly budget</label>
              <div className="grid grid-cols-4 gap-2">
                {budgetOptions.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setF({ ...f, budgetPerMonth: o.value })}
                    className={`rounded-lg border px-3 py-2 text-xs text-center transition-colors ${
                      f.budgetPerMonth === o.value ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Transportation</label>
              <div className="grid grid-cols-4 gap-2">
                {transportOptions.map(o => (
                  <button
                    key={o.value}
                    onClick={() => setF({ ...f, transportation: o.value })}
                    className={`rounded-lg border px-3 py-2 text-xs text-center transition-colors ${
                      f.transportation === o.value ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1.5 block">Responsibilities</label>
              <div className="grid grid-cols-3 gap-2">
                {responsibilityOptions.map(o => (
                  <button
                    key={o.value}
                    onClick={() => toggleResponsibility(o.value)}
                    className={`rounded-lg border px-3 py-2 text-xs text-left transition-colors ${
                      f.responsibilities.includes(o.value) ? 'border-primary bg-accent text-accent-foreground' : 'border-border text-muted-foreground hover:bg-secondary'
                    }`}
                  >
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Baseline */}
        <div>
          <h3 className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-3">Academic Baseline (optional)</h3>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">GPA</label>
              <input
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={f.gpa}
                onChange={e => setF({ ...f, gpa: e.target.value })}
                placeholder="e.g. 3.2"
              />
            </div>
            <div>
              <label className="text-xs text-muted-foreground mb-1 block">Attendance %</label>
              <input
                className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-ring"
                value={f.attendance}
                onChange={e => setF({ ...f, attendance: e.target.value })}
                placeholder="e.g. 92"
              />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center justify-end gap-3 pt-2 border-t border-border">
          {saved && <span className="text-xs text-primary font-medium">✓ Saved!</span>}
          <button
            onClick={handleSave}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:opacity-90 transition-opacity"
          >
            <Save className="w-4 h-4" /> Save Changes
          </button>
        </div>
      </div>
    </div>
  );
}
