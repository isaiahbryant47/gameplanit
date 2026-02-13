import { Link } from 'react-router-dom';
import {
  BookOpen, Shield, Users, Clock, Target, Sparkles,
  CheckCircle2, ArrowRight, GraduationCap, Heart, Building2,
  Lock, Mail, CalendarDays, ListChecks, TrendingUp
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

const steps = [
  {
    icon: Heart,
    title: 'Share your reality',
    desc: 'Tell us about your grade, schedule, budget, transportation, and goals. We meet you where you are — no judgment.',
  },
  {
    icon: CalendarDays,
    title: 'Get your 12-week roadmap',
    desc: 'Receive a personalized plan with weekly actions, local resources, and milestones matched to your life.',
  },
  {
    icon: TrendingUp,
    title: 'Stay on track',
    desc: 'Check in each week. If life gets heavier, your plan adapts automatically — lighter actions, same momentum.',
  },
];

const audiences = [
  {
    icon: GraduationCap,
    label: 'Students (Grades 7–12)',
    points: [
      "Discover career paths, scholarships, and programs you didn't know existed.",
      'Get a plan that fits your schedule — even if you only have 2 hours a week.',
      'Build real skills and a portfolio, not just homework completion.',
    ],
  },
  {
    icon: Heart,
    label: 'Caregivers & Families',
    points: [
      'See exactly what your student is working toward each week.',
      'No apps to learn — just a clear weekly roadmap you can follow together.',
      "Built around your family's budget, time, and transportation reality.",
    ],
  },
  {
    icon: Building2,
    label: 'Schools & Nonprofit Partners',
    points: [
      'Anonymized, aggregated dashboards — never individual student data.',
      'Understand what resources your community actually needs.',
      'Measure program impact with adherence and engagement trends.',
    ],
  },
];

const testimonials = [
  {
    quote: "\"I didn't think a plan could actually fit around my bus schedule and my little brother's pickup time. This one does.\"",
    attr: '— 10th grader, Philadelphia',
  },
  {
    quote: '"I finally have something concrete to look at each week instead of vague advice about \'staying on track.\'"',
    attr: '— Caregiver of 8th grader',
  },
  {
    quote: '"The anonymized data helped us reallocate mentorship hours to the grade bands that needed it most."',
    attr: '— Youth program director',
  },
];

const sampleWeek = {
  number: 3,
  focus: 'Career Exposure — Explore STEM opportunities',
  actions: [
    'Spend 30 min browsing free virtual STEM camps on Khan Academy.',
    'Complete one career-interest quiz and save results.',
    'Share what you found with a caregiver or mentor.',
  ],
  resources: [
    'Khan Academy — khanacademy.org',
    'SEPTA student fare info',
    'Local library teen coding workshops',
  ],
  milestone: 'Week 3 milestone: Identify 2 STEM paths that interest you.',
};

export default function Index() {
  return (
    <div className="min-h-screen bg-background">
      {/* ─── HERO ─── */}
      <header className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/8 via-accent/20 to-background" />
        <div className="relative max-w-5xl mx-auto px-6 pt-28 pb-20 text-center">
          <div className="inline-flex items-center gap-2 rounded-full bg-accent px-4 py-1.5 text-sm font-medium text-accent-foreground mb-6">
            <Sparkles className="w-4 h-4" />
            For grades 7–12 students &amp; their caregivers
          </div>

          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-foreground mb-5 leading-tight">
            A personalized plan for
            <span className="text-primary"> better grades, real skills, </span>
            and a clearer future
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed">
            GameplanIT builds a 12-week action plan around <em>your</em> schedule, budget, and transportation — so every student has a path forward, not just a pep talk.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="text-base px-8 py-6 shadow-md">
              <Link to="/onboarding">
                Get Your Free Plan
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 py-6">
              <a href="#plan-preview">
                See an Example Plan
              </a>
            </Button>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            Takes ~3 minutes. Free to start. No credit card required.
          </p>
        </div>
      </header>

      {/* ─── HOW IT WORKS ─── */}
      <section className="py-20 bg-secondary/30">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-foreground text-center mb-3">
            How it works
          </h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-14">
            Three steps — no accounts to connect, no transcripts to upload.
          </p>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-5">
                  <s.icon className="w-7 h-7 text-primary" />
                </div>
                <div className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
                  Step {i + 1}
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── WHO IT'S FOR ─── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-foreground text-center mb-3">
            Built for the people who need it most
          </h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-14">
            Different roles, same mission: making sure no student's potential is limited by logistics.
          </p>

          <div className="grid md:grid-cols-3 gap-6">
            {audiences.map((a, i) => (
              <Card key={i} className="border-border shadow-sm">
                <CardContent className="pt-6">
                  <div className="w-11 h-11 rounded-xl bg-accent flex items-center justify-center mb-4">
                    <a.icon className="w-5 h-5 text-accent-foreground" />
                  </div>
                  <h3 className="font-semibold text-card-foreground mb-3">{a.label}</h3>
                  <ul className="space-y-2.5">
                    {a.points.map((p, j) => (
                      <li key={j} className="flex gap-2 text-sm text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* ─── PLAN PREVIEW ─── */}
      <section id="plan-preview" className="py-20 bg-secondary/30">
        <div className="max-w-4xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-foreground text-center mb-3">
            Here's what a week actually looks like
          </h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-12">
            No vague advice. Every week has clear actions, curated resources, and a milestone to hit.
          </p>

          <Card className="border-border shadow-md overflow-hidden">
            <div className="bg-primary/5 border-b border-border px-6 py-4 flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm">
                W{sampleWeek.number}
              </div>
              <div>
                <div className="font-semibold text-foreground text-sm">Week {sampleWeek.number}</div>
                <div className="text-xs text-muted-foreground">{sampleWeek.focus}</div>
              </div>
            </div>
            <CardContent className="pt-6">
              <div className="grid sm:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                    <ListChecks className="w-3.5 h-3.5" /> Actions
                  </h4>
                  <ul className="space-y-2">
                    {sampleWeek.actions.map((a, i) => (
                      <li key={i} className="flex gap-2 text-sm text-foreground">
                        <span className="w-5 h-5 rounded border border-border flex items-center justify-center shrink-0 mt-0.5 text-xs text-muted-foreground">{i + 1}</span>
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3 flex items-center gap-1.5">
                    <BookOpen className="w-3.5 h-3.5" /> Resources
                  </h4>
                  <ul className="space-y-2">
                    {sampleWeek.resources.map((r, i) => (
                      <li key={i} className="text-sm text-muted-foreground">• {r}</li>
                    ))}
                  </ul>
                  <div className="mt-5 rounded-lg bg-accent/50 p-3">
                    <h4 className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-1 flex items-center gap-1.5">
                      <Target className="w-3.5 h-3.5" /> Milestone
                    </h4>
                    <p className="text-sm text-foreground">{sampleWeek.milestone}</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>

      {/* ─── SOCIAL PROOF ─── */}
      <section className="py-20">
        <div className="max-w-5xl mx-auto px-6">
          <h2 className="text-3xl font-bold text-foreground text-center mb-12">
            Families and educators are already seeing results
          </h2>

          <div className="grid md:grid-cols-3 gap-6 mb-14">
            {testimonials.map((t, i) => (
              <Card key={i} className="border-border shadow-sm">
                <CardContent className="pt-6">
                  <p className="text-sm text-foreground leading-relaxed italic mb-4">{t.quote}</p>
                  <p className="text-xs font-medium text-muted-foreground">{t.attr}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          <div className="flex flex-wrap justify-center gap-x-8 gap-y-3 text-sm text-muted-foreground">
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-primary" /> Built with educators &amp; youth program directors</span>
            <span className="flex items-center gap-1.5"><Shield className="w-4 h-4 text-primary" /> Privacy-first: no emails or names shared with partners</span>
            <span className="flex items-center gap-1.5"><Lock className="w-4 h-4 text-primary" /> Data anonymized &amp; aggregated — always</span>
          </div>
        </div>
      </section>

      {/* ─── FINAL CTA ─── */}
      <section className="py-20 bg-primary/5">
        <div className="max-w-3xl mx-auto px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Every student deserves a plan that fits their life
          </h2>
          <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
            Not every family has a college counselor. GameplanIT gives every student a structured path forward — for free.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
            <Button asChild size="lg" className="text-base px-8 py-6 shadow-md">
              <Link to="/onboarding">
                Get Started — It's Free
                <ArrowRight className="w-4 h-4 ml-1" />
              </Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="text-base px-8 py-6">
              <Link to="/login">
                Sign In
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm text-muted-foreground">
            Takes ~3 minutes. No credit card. Your data stays yours.
          </p>
        </div>
      </section>

      {/* ─── FOOTER ─── */}
      <footer className="border-t border-border bg-card">
        <div className="max-w-5xl mx-auto px-6 py-10">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-6">
            <div className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              <span className="font-semibold text-foreground">GameplanIT</span>
            </div>
            <nav className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
              <a href="#" className="hover:text-foreground transition-colors">Terms</a>
              <a href="#" className="hover:text-foreground transition-colors">Contact</a>
              <Link to="/partner" className="hover:text-foreground transition-colors flex items-center gap-1">
                <Mail className="w-3.5 h-3.5" /> Partner Inquiry
              </Link>
            </nav>
          </div>
          <p className="text-center text-xs text-muted-foreground mt-6">
            © {new Date().getFullYear()} GameplanIT. Built with equity, access, and privacy at the core.
          </p>
        </div>
      </footer>
    </div>
  );
}
