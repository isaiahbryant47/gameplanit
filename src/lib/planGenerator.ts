import type { Profile, PlanWeek } from './types';
import { fetchMatchingResources, type Resource } from './resourceService';

const themes = ['career exposure', 'study routines', 'project building', 'test prep basics', 'mentor outreach', 'wellness'];

// Fallback resources when DB is unavailable
const fallbackResources = [
  'https://www.khanacademy.org',
  'https://bigfuture.collegeboard.org',
];

export function generatePlanWeeks(profile: Profile, planId: string, dbResources?: Resource[]): PlanWeek[] {
  return Array.from({ length: 12 }).map((_, i) => {
    const goal = profile.goals[i % profile.goals.length];
    const interest = profile.interests[i % profile.interests.length];
    const focus = `${themes[i % themes.length]} - ${goal}`;
    const lowBudget = profile.constraints.budgetPerMonth < 40;
    const transitAction = ['walk', 'public'].includes(profile.constraints.transportation)
      ? 'Pick a walk/transit-friendly opportunity and map travel time.'
      : 'Plan one in-person and one virtual backup activity.';

    // Pick resources from DB if available, cycling through them
    let weekResources: string[];
    if (dbResources && dbResources.length > 0) {
      const perWeek = Math.max(2, Math.ceil(dbResources.length / 12));
      const startIdx = (i * perWeek) % dbResources.length;
      const selected: Resource[] = [];
      for (let j = 0; j < perWeek && selected.length < 3; j++) {
        selected.push(dbResources[(startIdx + j) % dbResources.length]);
      }
      weekResources = selected.map(r => r.url ? `${r.title} — ${r.url}` : r.title);
    } else {
      weekResources = [
        ...fallbackResources,
        profile.constraints.transportation === 'public' ? 'SEPTA student fares and route tools' : 'Nearby free library teen programs'
      ];
    }

    return {
      id: crypto.randomUUID(),
      planId,
      weekNumber: i + 1,
      focus,
      actions: [
        `Spend ${profile.constraints.timePerWeekHours <= 3 ? '30' : '45'} minutes exploring ${interest}.`,
        `Complete one task tied to ${goal}.`,
        'Share progress with caregiver/mentor and adjust next week.',
        lowBudget ? 'Use free/zero-cost resources only.' : 'Allocate a small optional budget for enrichment.',
        transitAction
      ],
      resources: weekResources,
      milestones: [`Week ${i + 1} milestone complete for ${goal}.`]
    };
  });
}

export async function generatePlanWeeksWithResources(profile: Profile, planId: string): Promise<PlanWeek[]> {
  const resources = await fetchMatchingResources({
    interests: profile.interests,
    gradeLevel: profile.gradeLevel,
    zipCode: profile.zipCode,
    transportation: profile.constraints.transportation,
    budgetPerMonth: profile.constraints.budgetPerMonth,
  });
  return generatePlanWeeks(profile, planId, resources);
}
