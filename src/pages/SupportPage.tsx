import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { loadProfile, loadPlan, loadProgress } from '@/lib/services';
import DashboardLayout from '@/components/DashboardLayout';
import BalancingBadge from '@/components/BalancingBadge';
import AdherencePrediction from '@/components/AdherencePrediction';
import { Heart, MessageCircle, HelpCircle, BookOpen, Users, Phone, ExternalLink } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { Profile, Plan } from '@/lib/types';
import type { ProgressData } from '@/lib/services/progressService';

const supportResources = [
  {
    title: 'Crisis Text Line',
    description: 'Free, 24/7 support for those in crisis. Text HOME to 741741.',
    icon: MessageCircle,
    action: 'Text HOME to 741741',
    url: 'https://www.crisistextline.org/',
  },
  {
    title: 'Boys Town Hotline',
    description: 'Free counseling for teens and families. Available 24/7.',
    icon: Phone,
    action: 'Call 1-800-448-3000',
    url: 'https://www.boystown.org/hotline',
  },
  {
    title: 'Study Tips & Time Management',
    description: 'Learn strategies for managing school, activities, and responsibilities.',
    icon: BookOpen,
    action: 'Browse tips',
    url: 'https://www.khanacademy.org/college-careers-more/learnstorm-growth-mindset-activities-us',
  },
  {
    title: 'Mentorship Programs',
    description: 'Connect with mentors who can guide your career and academic journey.',
    icon: Users,
    action: 'Find mentors',
    url: 'https://www.mentoring.org/',
  },
];

export default function SupportPage() {
  const { user } = useAuth();
  const nav = useNavigate();
  const [profile, setProfile] = useState<Profile | undefined>();
  const [plan, setPlan] = useState<Plan | undefined>();
  const [progress, setProgress] = useState<ProgressData>({ completedActions: {}, resourcesEngaged: [], academicLog: [], completedGoals: {} });

  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    Promise.all([loadProfile(user.id), loadPlan(user.id)]).then(async ([prof, planData]) => {
      if (cancelled) return;
      setProfile(prof);
      setPlan(planData.plan);
      const prog = await loadProgress(user.id, planData.plan?.id);
      if (!cancelled) setProgress(prog);
    });
    return () => { cancelled = true; };
  }, [user?.id]);

  return (
    <DashboardLayout title="Support">
      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <div className="flex items-center gap-2">
          <Heart className="w-5 h-5 text-primary" />
          <h2 className="text-base font-semibold text-card-foreground">Support & Wellness</h2>
        </div>
        <p className="text-sm text-muted-foreground">
          Your journey matters, and so does your well-being. Here you'll find resources, check-ins, and support to help you thrive.
        </p>
      </div>

      {profile && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
            <HelpCircle className="w-4 h-4 text-primary" />
            What You're Balancing
          </h3>
          <BalancingBadge profile={profile} />
        </div>
      )}

      {plan && profile && user && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground">Plan Check-In</h3>
          <AdherencePrediction
            plan={plan}
            profile={profile}
            userId={user.id}
            progress={progress}
            onPlanAdapted={() => nav(0)}
          />
        </div>
      )}

      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground">Support Resources</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {supportResources.map((r, i) => {
            const Icon = r.icon;
            return (
              <div key={i} className="rounded-xl border border-border bg-card p-4 space-y-2 hover:border-primary/30 transition-colors">
                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10">
                    <Icon className="w-4 h-4 text-primary" />
                  </span>
                  <h4 className="text-sm font-semibold text-card-foreground">{r.title}</h4>
                </div>
                <p className="text-xs text-muted-foreground">{r.description}</p>
                <a
                  href={r.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                >
                  {r.action} <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            );
          })}
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-5 space-y-3">
        <h3 className="text-sm font-semibold text-card-foreground">Frequently Asked Questions</h3>
        <div className="space-y-3">
          {[
            { q: 'What if I fall behind on my plan?', a: "That's okay! Your plan adapts to you. Focus on what you can do this week and the system will adjust recommendations." },
            { q: 'How do I change my career path?', a: 'Visit the "My Path" page in the sidebar to explore and switch to a different career path anytime.' },
            { q: 'Can I redo a cycle?', a: 'Yes! Once you complete a cycle, you can start a new one that builds on your progress with more challenging activities.' },
            { q: 'Who can see my data?', a: 'Only you and authorized partner administrators can view your progress. Your data is private and secure.' },
          ].map((faq, i) => (
            <div key={i} className="rounded-lg bg-secondary/30 p-3">
              <p className="text-sm font-medium text-card-foreground">{faq.q}</p>
              <p className="text-xs text-muted-foreground mt-1">{faq.a}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
