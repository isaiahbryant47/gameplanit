import { describe, it, expect } from 'vitest';
import { checkOpportunityUnlock } from '@/lib/pathwayService';

describe('checkOpportunityUnlock', () => {
  it('unlocks cycle-based opportunities when cycle threshold is met', () => {
    expect(checkOpportunityUnlock({ type: 'cycle_complete', min_cycle: 2 }, 0.1, 2)).toBe(true);
    expect(checkOpportunityUnlock({ type: 'cycle_complete', min_cycle: 3 }, 0.9, 2)).toBe(false);
  });

  it('unlocks milestone-rate opportunities when completion rate is met', () => {
    expect(checkOpportunityUnlock({ type: 'milestone_rate', min_rate: 0.75 }, 0.8, 1)).toBe(true);
    expect(checkOpportunityUnlock({ type: 'milestone_rate', min_rate: 0.75 }, 0.6, 3)).toBe(false);
  });

  it('uses safe defaults when rule thresholds are omitted', () => {
    expect(checkOpportunityUnlock({ type: 'cycle_complete' }, 0.2, 1)).toBe(true);
    expect(checkOpportunityUnlock({ type: 'milestone_rate' }, 0.49, 2)).toBe(false);
    expect(checkOpportunityUnlock({ type: 'milestone_rate' }, 0.5, 2)).toBe(true);
  });

  it('returns false for unknown rule types', () => {
    expect(checkOpportunityUnlock({ type: 'manual_review' }, 1, 99)).toBe(false);
  });
});
