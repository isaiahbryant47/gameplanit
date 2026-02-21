import { Plan, Profile, User } from './types';

export interface ProgressData {
  completedActions: Record<string, boolean>; // key: "weekId-actionIdx"
  resourcesEngaged: string[]; // resource URLs or titles clicked/used
  academicLog: { date: string; gpa?: number; attendance?: number }[];
  completedGoals: Record<string, string>; // key: goal name, value: completion date ISO
  weeklyCheckins?: Record<number, {
    lowTime: boolean;
    transportationIssue: boolean;
    unexpectedResponsibilities: boolean;
    motivationLow: boolean;
    updatedAt: string;
  }>;
}

const KEYS = { users: 'gp_users', profiles: 'gp_profiles', plans: 'gp_plans', session: 'gp_session', progress: 'gp_progress' };

function read<T>(key: string): T[] { return JSON.parse(localStorage.getItem(key) || '[]'); }
function write<T>(key: string, value: T[]) { localStorage.setItem(key, JSON.stringify(value)); }

function readObj<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

const emptyProgress: ProgressData = {
  completedActions: {},
  resourcesEngaged: [],
  academicLog: [],
  completedGoals: {},
  weeklyCheckins: {},
};

export const storage = {
  seed() {
    if (read<User>(KEYS.users).length) return;
    const admin: User = { id: crypto.randomUUID(), email: 'partner@gameplanit.org', password: 'admin1234', role: 'partner_admin', createdAt: new Date().toISOString() };
    const student: User = { id: crypto.randomUUID(), email: 'student@gameplanit.org', password: 'student1234', role: 'student', createdAt: new Date().toISOString() };
    write(KEYS.users, [admin, student]);
  },
  allUsers: () => read<User>(KEYS.users),
  saveUsers: (users: User[]) => write(KEYS.users, users),
  allProfiles: () => read<Profile>(KEYS.profiles),
  saveProfiles: (profiles: Profile[]) => write(KEYS.profiles, profiles),
  allPlans: () => read<Plan>(KEYS.plans),
  savePlans: (plans: Plan[]) => write(KEYS.plans, plans),
  setSession: (userId: string | null) => userId ? localStorage.setItem(KEYS.session, userId) : localStorage.removeItem(KEYS.session),
  getSession: () => localStorage.getItem(KEYS.session),
  getProgress: (userId: string): ProgressData => readObj(`${KEYS.progress}_${userId}`, emptyProgress),
  saveProgress: (userId: string, data: ProgressData) => localStorage.setItem(`${KEYS.progress}_${userId}`, JSON.stringify(data)),
};
