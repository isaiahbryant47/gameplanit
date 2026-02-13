import type { Profile, PlanWeek } from './types';

const themes = ['career exposure', 'study routines', 'project building', 'test prep basics', 'mentor outreach', 'wellness'];

export function generatePlanWeeks(profile: Profile, planId: string): PlanWeek[] {
  return Array.from({ length: 12 }).map((_, i) => {
    const goal = profile.goals[i % profile.goals.length];
    const interest = profile.interests[i % profile.interests.length];
    const focus = `${themes[i % themes.length]} - ${goal}`;
    const lowBudget = profile.constraints.budgetPerMonth < 40;
    const transitAction = ['walk', 'public'].includes(profile.constraints.transportation)
      ? 'Pick a walk/transit-friendly opportunity and map travel time.'
      : 'Plan one in-person and one virtual backup activity.';

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
      resources: [
        'https://www.khanacademy.org',
        'https://bigfuture.collegeboard.org',
        profile.constraints.transportation === 'public' ? 'SEPTA student fares and route tools' : 'Nearby free library teen programs'
      ],
      milestones: [`Week ${i + 1} milestone complete for ${goal}.`]
    };
  });
}
