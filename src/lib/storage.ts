import { Plan, Profile } from './types';

export interface ProgressData {
  completedActions: Record<string, boolean>; // key: "weekId-actionIdx"
  resourcesEngaged: string[]; // resource URLs or titles clicked/used
  academicLog: { date: string; gpa?: number; attendance?: number }[];
  completedGoals: Record<string, string>; // key: goal name, value: completion date ISO
}

const KEYS = { profiles: 'gp_profiles', plans: 'gp_plans', progress: 'gp_progress' };

function read<T>(key: string): T[] { return JSON.parse(localStorage.getItem(key) || '[]'); }
function write<T>(key: string, value: T[]) { localStorage.setItem(key, JSON.stringify(value)); }

function readObj<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

const emptyProgress: ProgressData = { completedActions: {}, resourcesEngaged: [], academicLog: [], completedGoals: {} };

export const storage = {
  allProfiles: () => read<Profile>(KEYS.profiles),
  saveProfiles: (profiles: Profile[]) => write(KEYS.profiles, profiles),
  allPlans: () => read<Plan>(KEYS.plans),
  savePlans: (plans: Plan[]) => write(KEYS.plans, plans),
  getProgress: (userId: string): ProgressData => readObj(`${KEYS.progress}_${userId}`, emptyProgress),
  saveProgress: (userId: string, data: ProgressData) => localStorage.setItem(`${KEYS.progress}_${userId}`, JSON.stringify(data)),
};
