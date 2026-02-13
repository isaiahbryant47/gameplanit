import { describe, it, expect } from 'vitest';
import { scoreGoalClarity, buildGoalFromStructured, clarityMessage, CLARITY_THRESHOLD } from '@/lib/goalClarity';

describe('scoreGoalClarity', () => {
  it('returns low score for vague input', () => {
    const result = scoreGoalClarity('better grades');
    expect(result.score).toBeLessThanOrEqual(25);
    expect(result.isVague).toBe(true);
    expect(result.suggestions.length).toBeGreaterThan(0);
  });

  it('returns high score for specific SMART goal', () => {
    const result = scoreGoalClarity('Raise my Algebra grade from C to B by end of this semester');
    expect(result.score).toBeGreaterThanOrEqual(75);
    expect(result.hasSubject).toBe(true);
    expect(result.hasMeasurable).toBe(true);
    expect(result.hasTimeline).toBe(true);
  });

  it('detects subject keywords', () => {
    expect(scoreGoalClarity('improve in math').hasSubject).toBe(true);
    expect(scoreGoalClarity('do something').hasSubject).toBe(false);
  });

  it('detects measurable outcomes', () => {
    expect(scoreGoalClarity('raise my grade from C to B').hasMeasurable).toBe(true);
    expect(scoreGoalClarity('score above 90% on test').hasMeasurable).toBe(true);
    expect(scoreGoalClarity('be better').hasMeasurable).toBe(false);
  });

  it('detects timeline', () => {
    expect(scoreGoalClarity('finish by end of semester').hasTimeline).toBe(true);
    expect(scoreGoalClarity('within 8 weeks').hasTimeline).toBe(true);
    expect(scoreGoalClarity('improve grades').hasTimeline).toBe(false);
  });

  it('generates SMART expansion for vague goals', () => {
    const result = scoreGoalClarity('better grades', { gradeLevel: '10', interests: ['technology'] });
    expect(result.smartGoal).toBeTruthy();
    expect(result.smartGoal).toContain('grade');
  });

  it('returns no SMART expansion for already-specific goals', () => {
    const result = scoreGoalClarity('Raise my math grade from C to B by end of this semester');
    expect(result.smartGoal).toBeNull();
  });

  it('gives medium score for partially specific goals', () => {
    const result = scoreGoalClarity('improve my math skills');
    expect(result.score).toBeGreaterThanOrEqual(25);
    expect(result.score).toBeLessThan(75);
    expect(result.hasSubject).toBe(true);
  });

  it('handles empty input', () => {
    const result = scoreGoalClarity('');
    expect(result.score).toBe(0);
    expect(result.isVague).toBe(true);
  });

  it('awards constraint awareness bonus', () => {
    const a = scoreGoalClarity('improve math');
    const b = scoreGoalClarity('improve math while working part-time');
    expect(b.score).toBeGreaterThan(a.score);
    expect(b.hasConstraintAwareness).toBe(true);
  });
});

describe('buildGoalFromStructured', () => {
  it('builds a complete goal string', () => {
    const result = buildGoalFromStructured({
      area: 'Algebra',
      currentLevel: 'C+',
      targetOutcome: 'Raise my grade to B',
      timeline: 'end of semester',
      motivation: 'I need it for college apps',
    });
    expect(result).toContain('Algebra');
    expect(result).toContain('Raise my grade to B');
    expect(result).toContain('end of semester');
    expect(result).toContain('college apps');
  });

  it('handles partial input gracefully', () => {
    const result = buildGoalFromStructured({ area: 'Math', currentLevel: '', targetOutcome: '', timeline: '', motivation: '' });
    expect(result).toContain('Math');
  });
});

describe('clarityMessage', () => {
  it('returns encouraging tone for low scores', () => {
    expect(clarityMessage(20).tone).toBe('encourage');
  });

  it('returns good tone for medium scores', () => {
    expect(clarityMessage(55).tone).toBe('good');
  });

  it('returns great tone for high scores', () => {
    expect(clarityMessage(80).tone).toBe('great');
  });
});
