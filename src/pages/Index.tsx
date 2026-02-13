import { Link } from 'react-router-dom';
import { BookOpen, Shield, Users } from 'lucide-react';

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-accent/30 to-background" />
        <div className="relative max-w-4xl mx-auto px-6 py-24 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground mb-6">
            <BookOpen className="w-4 h-4" />
            Personalized Learning Plans
          </div>
          <h1 className="text-5xl font-bold tracking-tight text-foreground mb-4">
            GameplanIT
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
            Personalized 12-week plans for students and caregivers — built around your real-world constraints, goals, and interests.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              to="/onboarding"
              className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-primary-foreground font-medium shadow-md hover:opacity-90 transition-opacity"
            >
              Get Started
            </Link>
            <Link
              to="/login"
              className="inline-flex items-center gap-2 rounded-lg border border-border px-6 py-3 text-foreground font-medium hover:bg-secondary transition-colors"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-4xl mx-auto px-6 pb-20">
        <div className="grid md:grid-cols-3 gap-6">
          <div className="rounded-xl bg-card border border-border p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-4">
              <BookOpen className="w-5 h-5 text-accent-foreground" />
            </div>
            <h3 className="font-semibold text-card-foreground mb-2">Tailored Plans</h3>
            <p className="text-sm text-muted-foreground">12 weeks of actionable steps based on your grade, budget, time, and transportation.</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-4">
              <Shield className="w-5 h-5 text-accent-foreground" />
            </div>
            <h3 className="font-semibold text-card-foreground mb-2">Privacy First</h3>
            <p className="text-sm text-muted-foreground">Only the data needed for your plan is stored. Partner views are fully anonymized.</p>
          </div>
          <div className="rounded-xl bg-card border border-border p-6 shadow-sm">
            <div className="w-10 h-10 rounded-lg bg-accent flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-accent-foreground" />
            </div>
            <h3 className="font-semibold text-card-foreground mb-2">For Partners</h3>
            <p className="text-sm text-muted-foreground">Schools and orgs get anonymized dashboards to understand student needs at scale.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
