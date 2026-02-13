/**
 * Goal Clarity Engine
 * 
 * Scores student goals on specificity (0-100), detects vagueness,
 * and suggests SMART-style improvements. Rule-based MVP designed
 * to be swappable with ML later.
 */

// ── Subject / area keywords ─────────────────────────────────────
const SUBJECT_KEYWORDS = [
  'math', 'algebra', 'geometry', 'calculus', 'statistics',
  'english', 'reading', 'writing', 'essay', 'literature',
  'science', 'biology', 'chemistry', 'physics',
  'history', 'social studies', 'government', 'economics',
  'spanish', 'french', 'language',
  'coding', 'programming', 'computer science', 'technology',
  'art', 'music', 'band', 'theater', 'drama',
  'sports', 'basketball', 'football', 'soccer', 'track',
  'internship', 'job', 'career', 'volunteer', 'college',
  'sat', 'act', 'ap', 'gpa', 'test', 'exam',
];

// ── Measurable outcome patterns ─────────────────────────────────
const MEASURABLE_PATTERNS = [
  /\b(from\s+\w+\s+to\s+\w+)\b/i,        // "from C to B"
  /\b(\d+)\s*(%|percent)\b/i,              // "90%"
  /\b(score|grade|gpa)\s*(of|at|above|over)\s*\d/i,
  /\b(raise|improve|increase|boost)\b.*\b(by|to)\b/i,
  /\b(get|earn|achieve|reach|maintain)\b.*\b(an?\s)?[A-F][+-]?\b/i,
  /\b(complete|finish|pass)\b/i,
  /\b(at least|minimum|no less than)\b/i,
  /\b\d+\s*(hours?|times?|sessions?|days?|weeks?)\b/i,
];

// ── Timeline patterns ───────────────────────────────────────────
const TIMELINE_PATTERNS = [
  /\b(by|before|within|end of|this)\b.*\b(semester|quarter|month|year|week|summer|spring|fall|winter|june|july|august|september|december|january|may)\b/i,
  /\b(next|this)\s+(month|semester|quarter|year|week)\b/i,
  /\b(in|within)\s+\d+\s+(weeks?|months?|days?)\b/i,
  /\b(deadline|due date|target date)\b/i,
  /\b(before|by)\s+(graduation|finals|midterms)\b/i,
];

// ── Vague phrases ───────────────────────────────────────────────
const VAGUE_PHRASES = [
  'better grades', 'do better', 'improve', 'get good', 'be successful',
  'do well', 'try harder', 'work harder', 'be better', 'figure out',
  'explore options', 'find something', 'do something', 'learn stuff',
  'career exposure', 'get ahead', 'stay on track',
];

// ── Types ───────────────────────────────────────────────────────
export interface GoalClarityResult {
  score: number;                 // 0-100
  hasSubject: boolean;
  hasMeasurable: boolean;
  hasTimeline: boolean;
  hasConstraintAwareness: boolean;
  suggestions: string[];
  smartGoal: string | null;      // auto-expanded SMART version
  isVague: boolean;
}

export interface StructuredGoal {
  area: string;
  currentLevel: string;
  targetOutcome: string;
  timeline: string;
  motivation: string;
}

// ── Scoring ─────────────────────────────────────────────────────
export function scoreGoalClarity(rawGoal: string, profile?: { gradeLevel?: string; interests?: string[] }): GoalClarityResult {
  const goal = rawGoal.trim().toLowerCase();
  if (!goal) {
    return { score: 0, hasSubject: false, hasMeasurable: false, hasTimeline: false, hasConstraintAwareness: false, suggestions: ['Start by typing what you want to achieve.'], smartGoal: null, isVague: true };
  }

  const hasSubject = SUBJECT_KEYWORDS.some(k => goal.includes(k));
  const hasMeasurable = MEASURABLE_PATTERNS.some(p => p.test(goal));
  const hasTimeline = TIMELINE_PATTERNS.some(p => p.test(goal));
  const hasConstraintAwareness = /\b(with|despite|even though|while|around)\b/i.test(goal) || /\b(budget|time|schedule|work|job|sibling|responsibility)\b/i.test(goal);
  const isVague = VAGUE_PHRASES.some(p => goal.includes(p)) && !hasMeasurable && !hasTimeline;

  // Weighted scoring
  let score = 10; // base for having typed anything
  if (hasSubject) score += 25;
  if (hasMeasurable) score += 30;
  if (hasTimeline) score += 20;
  if (hasConstraintAwareness) score += 10;
  if (goal.length > 30) score += 5; // detail bonus

  // Penalty for extreme vagueness
  if (isVague && goal.split(' ').length < 5) score = Math.min(score, 25);

  score = Math.min(100, Math.max(0, score));

  // Build suggestions
  const suggestions: string[] = [];
  if (!hasSubject) suggestions.push('Which subject or area is this about? (e.g., "math", "coding", "internship")');
  if (!hasMeasurable) suggestions.push('What specific result do you want? (e.g., "raise my grade from C to B")');
  if (!hasTimeline) suggestions.push('By when? (e.g., "by end of semester", "in 8 weeks")');
  if (!hasConstraintAwareness && suggestions.length < 3) suggestions.push('Is there anything that might make this harder? (e.g., "while working part-time")');

  // Auto-expand to SMART goal
  const smartGoal = generateSmartExpansion(goal, { hasSubject, hasMeasurable, hasTimeline }, profile);

  return { score, hasSubject, hasMeasurable, hasTimeline, hasConstraintAwareness, suggestions: suggestions.slice(0, 3), smartGoal, isVague };
}

// ── SMART expansion ─────────────────────────────────────────────
function generateSmartExpansion(
  goal: string,
  flags: { hasSubject: boolean; hasMeasurable: boolean; hasTimeline: boolean },
  profile?: { gradeLevel?: string; interests?: string[] }
): string | null {
  if (flags.hasSubject && flags.hasMeasurable && flags.hasTimeline) return null; // already specific

  // Map common vague goals to structured suggestions
  const expansions: Record<string, string> = {
    'better grades': `Improve my ${detectSubject(goal, profile) || '[subject]'} grade from [current grade] to [target grade] by end of this semester`,
    'do better': `Raise my performance in ${detectSubject(goal, profile) || '[subject]'} by completing all homework and scoring above [target] on the next test`,
    'get an internship': `Apply to at least 3 ${profile?.interests?.[0] || 'career-related'} internships by [month] and get at least 1 interview`,
    'improve': `Improve my ${detectSubject(goal, profile) || '[subject]'} skills by practicing [frequency] per week and reaching [target level] within [timeframe]`,
    'career exposure': `Explore 3 career paths in ${profile?.interests?.[0] || 'my interest area'} by attending 2 events and completing 1 job shadow by end of semester`,
    'college help': `Complete my college application for [school name] including essay and financial aid forms by [deadline]`,
    'volunteering': `Complete 20 volunteer hours at [organization] by [date] to build skills in [area]`,
  };

  for (const [key, expansion] of Object.entries(expansions)) {
    if (goal.includes(key)) return expansion;
  }

  // Generic fallback expansion
  if (!flags.hasSubject && !flags.hasMeasurable) {
    return `I want to [specific action] in ${detectSubject(goal, profile) || '[subject/area]'} and achieve [measurable result] by [target date]`;
  }

  return null;
}

function detectSubject(goal: string, profile?: { interests?: string[] }): string | null {
  const found = SUBJECT_KEYWORDS.find(k => goal.includes(k));
  if (found) return found;
  if (profile?.interests?.length) {
    const interestMap: Record<string, string> = {
      technology: 'computer science', tutoring: 'academics', arts: 'art',
      sports: 'athletics', music: 'music', leadership: 'leadership',
      entrepreneurship: 'business', trades: 'skilled trades',
      internships: 'career development', college_help: 'college prep',
    };
    return interestMap[profile.interests[0]] || profile.interests[0];
  }
  return null;
}

// ── Build structured goal from guided answers ───────────────────
export function buildGoalFromStructured(sg: StructuredGoal): string {
  const parts: string[] = [];
  if (sg.targetOutcome && sg.area) {
    parts.push(`${sg.targetOutcome} in ${sg.area}`);
  } else if (sg.targetOutcome) {
    parts.push(sg.targetOutcome);
  } else if (sg.area) {
    parts.push(`Improve in ${sg.area}`);
  }

  if (sg.currentLevel) parts.push(`(currently at ${sg.currentLevel})`);
  if (sg.timeline) parts.push(`by ${sg.timeline}`);
  if (sg.motivation) parts.push(`because ${sg.motivation}`);

  return parts.join(' ');
}

// ── Clarity threshold ───────────────────────────────────────────
export const CLARITY_THRESHOLD = 50;

export function clarityMessage(score: number): { text: string; tone: 'encourage' | 'good' | 'great' } {
  if (score >= 75) return { text: 'Great detail! This will help us build a strong plan for you.', tone: 'great' };
  if (score >= CLARITY_THRESHOLD) return { text: 'Good start! A bit more detail will make your plan even better.', tone: 'good' };
  if (score >= 25) return { text: `Your goal clarity is ${score}/100. Adding a specific outcome or timeline will help us build a stronger plan.`, tone: 'encourage' };
  return { text: `Let\u2019s make this more specific so we can build something that actually works for you.`, tone: 'encourage' };
}
