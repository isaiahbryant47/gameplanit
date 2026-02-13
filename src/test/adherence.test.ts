import { describe, it, expect } from 'vitest';
import { predictAdherence, getWeekCompletionRate, getCompletionStreak } from '@/lib/predict/adherence';

describe('predictAdherence', () => {
  it('returns baseline ~0.55 with default inputs', () => {
    const result = predictAdherence({
      lastWeekCompletionRate: 0.5,
      completionStreakWeeks: 0,
      planComplexity: 4,
      timePerWeekHours: 2,
    });
    expect(result.probability).toBeCloseTo(0.55, 1);
    expect(result.riskFlag).toBe(false);
    expect(result.drivers.length).toBe(3);
  });

  it('flags risk when completion rate is very low', () => {
    const result = predictAdherence({
      lastWeekCompletionRate: 0.2,
      completionStreakWeeks: 0,
      planComplexity: 5,
      timePerWeekHours: 2,
    });
    expect(result.riskFlag).toBe(true);
    expect(result.probability).toBeLessThan(0.55);
  });

  it('boosts probability with high completion and streak', () => {
    const result = predictAdherence({
      lastWeekCompletionRate: 0.9,
      completionStreakWeeks: 4,
      planComplexity: 3,
      timePerWeekHours: 5,
    });
    expect(result.probability).toBeGreaterThan(0.75);
    expect(result.riskFlag).toBe(false);
  });

  it('penalizes high complexity plans', () => {
    const normal = predictAdherence({
      lastWeekCompletionRate: 0.5,
      completionStreakWeeks: 0,
      planComplexity: 4,
      timePerWeekHours: 4,
    });
    const complex = predictAdherence({
      lastWeekCompletionRate: 0.5,
      completionStreakWeeks: 0,
      planComplexity: 10,
      timePerWeekHours: 4,
    });
    expect(complex.probability).toBeLessThan(normal.probability);
  });

  it('clamps output to [0.05, 0.95]', () => {
    const worst = predictAdherence({
      lastWeekCompletionRate: 0,
      completionStreakWeeks: 0,
      planComplexity: 20,
      timePerWeekHours: 0,
    });
    const best = predictAdherence({
      lastWeekCompletionRate: 1,
      completionStreakWeeks: 10,
      planComplexity: 1,
      timePerWeekHours: 10,
    });
    expect(worst.probability).toBeGreaterThanOrEqual(0.05);
    expect(best.probability).toBeLessThanOrEqual(0.95);
  });

  it('uses 0.5 default when lastWeekCompletionRate is null', () => {
    const result = predictAdherence({
      lastWeekCompletionRate: null,
      completionStreakWeeks: 0,
      planComplexity: 4,
      timePerWeekHours: 2,
    });
    expect(result.probability).toBeCloseTo(0.55, 1);
  });
});

describe('getWeekCompletionRate', () => {
  it('calculates correct rate', () => {
    const completed = { 'w1-0': true, 'w1-1': false, 'w1-2': true };
    expect(getWeekCompletionRate('w1', 3, completed)).toBeCloseTo(0.667, 2);
  });

  it('returns 0 for no actions', () => {
    expect(getWeekCompletionRate('w1', 0, {})).toBe(0);
  });
});

describe('getCompletionStreak', () => {
  it('counts consecutive completed weeks from end', () => {
    const weeks = [
      { id: 'w1', actions: ['a', 'b'] },
      { id: 'w2', actions: ['a', 'b'] },
      { id: 'w3', actions: ['a', 'b'] },
    ];
    const completed = {
      'w1-0': false, 'w1-1': false, // 0% - breaks streak
      'w2-0': true, 'w2-1': true,   // 100%
      'w3-0': true, 'w3-1': true,   // 100%
    };
    expect(getCompletionStreak(weeks, completed)).toBe(2);
  });
});
