import { Plan, Profile, User } from './types';

export interface ProgressData {
  completedActions: Record<string, boolean>; // key: "weekId-actionIdx"
  resourcesEngaged: string[]; // resource URLs or titles clicked/used
  academicLog: { date: string; gpa?: number; attendance?: number }[];
  completedGoals: Record<string, string>; // key: goal name, value: completion date ISO
}

const KEYS = { users: 'gp_users', profiles: 'gp_profiles', plans: 'gp_plans', session: 'gp_session', progress: 'gp_progress' };

function read<T>(key: string): T[] { return JSON.parse(localStorage.getItem(key) || '[]'); }
function write<T>(key: string, value: T[]) { localStorage.setItem(key, JSON.stringify(value)); }

function readObj<T>(key: string, fallback: T): T {
  const raw = localStorage.getItem(key);
  return raw ? JSON.parse(raw) : fallback;
}

const emptyProgress: ProgressData = { completedActions: {}, resourcesEngaged: [], academicLog: [], completedGoals: {} };

export const storage = {
  seed() {
    if (read<User>(KEYS.users).length) return;

    // Legacy localStorage fallback users (Supabase auth is the primary path).
    // We intentionally avoid shipping known plaintext default passwords.
    const makeSeedUser = (email: string, role: User['role']): User => ({
      id: crypto.randomUUID(),
      email,
      password: crypto.randomUUID(),
      role,
      createdAt: new Date().toISOString(),
    });

    const admin = makeSeedUser('partner@gameplanit.org', 'partner_admin');
    const student = makeSeedUser('student@gameplanit.org', 'student');
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
