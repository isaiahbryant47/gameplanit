import assert from 'node:assert/strict';
import { generatePlanWeeks } from '../src/lib/planGenerator.ts';

const profile = {
  id: 'p1',
  userId: 'u1',
  type: 'student' as const,
  gradeLevel: '10',
  zipCode: '19139',
  interests: ['technology', 'design'],
  constraints: { timePerWeekHours: 3, budgetPerMonth: 20, transportation: 'public' as const, responsibilities: 'Sibling care' },
  goals: ['career exposure', 'improve grades'],
  baseline: {}
};

const weeks = generatePlanWeeks(profile, 'plan1');
assert.equal(weeks.length, 12, 'should generate 12 weeks');
assert.ok(weeks[0].actions.some((a) => a.includes('free/zero-cost')), 'should include low budget action');
assert.ok(weeks[0].resources.some((r) => r.includes('SEPTA')), 'should include transit-friendly resource for public transport');
console.log('All plan generator tests passed');
