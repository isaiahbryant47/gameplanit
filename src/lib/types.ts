export type Role = 'student' | 'caregiver' | 'partner_admin';
export type Transportation = 'walk' | 'public' | 'car' | 'mixed';

export interface User {
  id: string;
  email: string;
  password: string;
  role: Role;
  createdAt: string;
}

export interface Profile {
  id: string;
  userId: string;
  type: 'student' | 'caregiver';
  gradeLevel: string;
  schoolName?: string;
  zipCode: string;
  interests: string[];
  constraints: {
    timePerWeekHours: number;
    budgetPerMonth: number;
    transportation: Transportation;
    responsibilities: string;
  };
  goals: string[];
  baseline: { gpa?: number; attendance?: number };
}

export interface PlanWeek {
  id: string;
  planId: string;
  weekNumber: number;
  focus: string;
  actions: string[];
  resources: string[];
  milestones: string[];
}

export interface Plan {
  id: string;
  userId: string;
  profileId: string;
  title: string;
  createdAt: string;
  weeks: PlanWeek[];
}
