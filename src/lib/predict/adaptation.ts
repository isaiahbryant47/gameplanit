import { generateMicroActions } from './adherence';

export interface WeeklyCheckin {
  lowTime: boolean;
  transportationIssue: boolean;
  unexpectedResponsibilities: boolean;
  motivationLow: boolean;
}

export function countBlockers(checkin: WeeklyCheckin): number {
  return Object.values(checkin).filter(Boolean).length;
}

export function getEffectiveTimePerWeek(baseHours: number, checkin: WeeklyCheckin): number {
  let adjusted = baseHours;
  if (checkin.lowTime) adjusted -= 1.5;
  if (checkin.unexpectedResponsibilities) adjusted -= 1;
  if (checkin.transportationIssue) adjusted -= 0.5;
  if (checkin.motivationLow) adjusted -= 0.5;
  return Math.max(1, Number(adjusted.toFixed(1)));
}

export function buildAdaptedActions(input: {
  currentActions: string[];
  goal: string;
  interest: string;
  checkin: WeeklyCheckin;
  riskFlag: boolean;
}): string[] {
  const blockerCount = countBlockers(input.checkin);

  if (input.riskFlag || blockerCount >= 2) {
    return generateMicroActions(input.goal, input.interest);
  }

  const trimmed = input.currentActions.slice(0, Math.max(2, input.currentActions.length - 1));
  const supportActions: string[] = [];

  if (input.checkin.transportationIssue) {
    supportActions.push('Choose one virtual or walking-distance option for this week.');
  }
  if (input.checkin.lowTime) {
    supportActions.push('Timebox one 20-minute focus block on your calendar.');
  }
  if (input.checkin.motivationLow) {
    supportActions.push('Text a mentor/caregiver your one goal for this week before starting.');
  }

  return [...trimmed, ...supportActions].slice(0, 4);
}
