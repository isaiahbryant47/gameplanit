import { describe, it, expect } from 'vitest';
import { buildAdaptedActions, countBlockers, getEffectiveTimePerWeek } from '@/lib/predict/adaptation';

describe('predict adaptation helpers', () => {
  it('counts blockers correctly', () => {
    expect(countBlockers({
      lowTime: true,
      transportationIssue: false,
      unexpectedResponsibilities: true,
      motivationLow: false,
    })).toBe(2);
  });

  it('reduces available time when blockers are present', () => {
    const hours = getEffectiveTimePerWeek(5, {
      lowTime: true,
      transportationIssue: true,
      unexpectedResponsibilities: false,
      motivationLow: true,
    });
    expect(hours).toBeLessThan(5);
    expect(hours).toBeGreaterThanOrEqual(1);
  });

  it('returns micro-actions when risk is high', () => {
    const actions = buildAdaptedActions({
      currentActions: ['A', 'B', 'C', 'D'],
      goal: 'raise algebra grade',
      interest: 'technology',
      checkin: {
        lowTime: true,
        transportationIssue: false,
        unexpectedResponsibilities: false,
        motivationLow: false,
      },
      riskFlag: true,
    });

    expect(actions.length).toBe(3);
    expect(actions[0]).toContain('15 minutes');
  });

  it('trims and adds support actions for lower risk', () => {
    const actions = buildAdaptedActions({
      currentActions: ['A', 'B', 'C', 'D'],
      goal: 'raise algebra grade',
      interest: 'technology',
      checkin: {
        lowTime: true,
        transportationIssue: false,
        unexpectedResponsibilities: false,
        motivationLow: false,
      },
      riskFlag: false,
    });

    expect(actions.length).toBeGreaterThanOrEqual(2);
    expect(actions.join(' ')).toContain('Timebox');
  });
});
