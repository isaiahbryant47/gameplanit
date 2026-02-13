export type Role = 'student' | 'caregiver' | 'partner_admin';
export type Transportation = 'walk' | 'public' | 'car' | 'mixed';
export type GoalDomain = 'college' | 'career' | 'health_fitness';

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
  // Pathway fields (optional for backward compat)
  goalDomain?: GoalDomain;
  pathwayId?: string;
  outcomeStatement?: string;
  targetDate?: string;
  domainBaseline?: Record<string, string>;
}

export interface Pathway {
  id: string;
  domain: GoalDomain;
  title: string;
  description: string;
  default_milestones: string[];
  tags: string[];
  is_active: boolean;
}

export interface Opportunity {
  id: string;
  domain: GoalDomain;
  title: string;
  description: string;
  requirements_json: { min_completion_rate?: number; min_cycle?: number };
  next_step_cta_label: string;
  next_step_url?: string;
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
  // Pathway fields
  pathwayId?: string;
  cycleNumber?: number;
  outcomeStatement?: string;
  targetDate?: string;
  goalDomain?: GoalDomain;
}
