export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      // =================================================================
      // V2 Schema Tables
      // =================================================================
      users: {
        Row: {
          id: string
          email: string | null
          phone: string | null
          display_name: string | null
          role_primary: string
          dob: string | null
          zipcode: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          email?: string | null
          phone?: string | null
          display_name?: string | null
          role_primary: string
          dob?: string | null
          zipcode?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string | null
          phone?: string | null
          display_name?: string | null
          role_primary?: string
          dob?: string | null
          zipcode?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: []
      }
      organizations: {
        Row: {
          id: string
          name: string
          org_type: string
          city: string | null
          state: string | null
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          org_type: string
          city?: string | null
          state?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          org_type?: string
          city?: string | null
          state?: string | null
          created_at?: string
        }
        Relationships: []
      }
      org_memberships: {
        Row: {
          id: string
          org_id: string
          user_id: string
          org_role: string
          status: string
          start_at: string
          end_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          org_id: string
          user_id: string
          org_role: string
          status?: string
          start_at?: string
          end_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          org_id?: string
          user_id?: string
          org_role?: string
          status?: string
          start_at?: string
          end_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_memberships_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "org_memberships_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      caregiver_links: {
        Row: {
          id: string
          caregiver_user_id: string
          student_user_id: string
          relationship: string | null
          permission_level: string
          created_at: string
        }
        Insert: {
          id?: string
          caregiver_user_id: string
          student_user_id: string
          relationship?: string | null
          permission_level?: string
          created_at?: string
        }
        Update: {
          id?: string
          caregiver_user_id?: string
          student_user_id?: string
          relationship?: string | null
          permission_level?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "caregiver_links_caregiver_user_id_fkey"
            columns: ["caregiver_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "caregiver_links_student_user_id_fkey"
            columns: ["student_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      consents: {
        Row: {
          id: string
          user_id: string
          consent_type: string
          consented_at: string
          metadata: Json
        }
        Insert: {
          id?: string
          user_id: string
          consent_type: string
          consented_at?: string
          metadata?: Json
        }
        Update: {
          id?: string
          user_id?: string
          consent_type?: string
          consented_at?: string
          metadata?: Json
        }
        Relationships: [
          {
            foreignKeyName: "consents_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_profiles: {
        Row: {
          user_id: string
          grade_level: number | null
          school_name: string | null
          gpa: number | null
          experience_level: string | null
          weekly_hours_available: number | null
          internet_access: string | null
          transport_mode: string | null
          budget_level: string | null
          work_hours_per_week: number | null
          caregiving_responsibilities: boolean
          updated_at: string
        }
        Insert: {
          user_id: string
          grade_level?: number | null
          school_name?: string | null
          gpa?: number | null
          experience_level?: string | null
          weekly_hours_available?: number | null
          internet_access?: string | null
          transport_mode?: string | null
          budget_level?: string | null
          work_hours_per_week?: number | null
          caregiving_responsibilities?: boolean
          updated_at?: string
        }
        Update: {
          user_id?: string
          grade_level?: number | null
          school_name?: string | null
          gpa?: number | null
          experience_level?: string | null
          weekly_hours_available?: number | null
          internet_access?: string | null
          transport_mode?: string | null
          budget_level?: string | null
          work_hours_per_week?: number | null
          caregiving_responsibilities?: boolean
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      goals: {
        Row: {
          id: string
          user_id: string
          goal_type: string
          title: string
          description: string | null
          target_metric: string | null
          target_date: string | null
          constraints_notes: string | null
          clarity_score: number
          status: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_type: string
          title: string
          description?: string | null
          target_metric?: string | null
          target_date?: string | null
          constraints_notes?: string | null
          clarity_score?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_type?: string
          title?: string
          description?: string | null
          target_metric?: string | null
          target_date?: string | null
          constraints_notes?: string | null
          clarity_score?: number
          status?: string
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      goal_tags: {
        Row: {
          goal_id: string
          tag: string
        }
        Insert: {
          goal_id: string
          tag: string
        }
        Update: {
          goal_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "goal_tags_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
        ]
      }
      journey_templates: {
        Row: {
          id: string
          name: string
          description: string | null
          grade_band: string | null
          duration_weeks: number
          created_by_org_id: string | null
          visibility: string
          created_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string | null
          grade_band?: string | null
          duration_weeks?: number
          created_by_org_id?: string | null
          visibility?: string
          created_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string | null
          grade_band?: string | null
          duration_weeks?: number
          created_by_org_id?: string | null
          visibility?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "journey_templates_created_by_org_id_fkey"
            columns: ["created_by_org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      milestone_templates: {
        Row: {
          id: string
          journey_template_id: string
          title: string
          description: string | null
          order_index: number
          success_criteria: string | null
        }
        Insert: {
          id?: string
          journey_template_id: string
          title: string
          description?: string | null
          order_index: number
          success_criteria?: string | null
        }
        Update: {
          id?: string
          journey_template_id?: string
          title?: string
          description?: string | null
          order_index?: number
          success_criteria?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "milestone_templates_journey_template_id_fkey"
            columns: ["journey_template_id"]
            isOneToOne: false
            referencedRelation: "journey_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_templates: {
        Row: {
          id: string
          milestone_template_id: string
          title: string
          description: string | null
          task_type: string
          estimated_minutes: number | null
          requires_evidence: boolean
          requires_review: boolean
          default_priority: number
          content_ref: Json
          order_index: number
        }
        Insert: {
          id?: string
          milestone_template_id: string
          title: string
          description?: string | null
          task_type: string
          estimated_minutes?: number | null
          requires_evidence?: boolean
          requires_review?: boolean
          default_priority?: number
          content_ref?: Json
          order_index: number
        }
        Update: {
          id?: string
          milestone_template_id?: string
          title?: string
          description?: string | null
          task_type?: string
          estimated_minutes?: number | null
          requires_evidence?: boolean
          requires_review?: boolean
          default_priority?: number
          content_ref?: Json
          order_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "task_templates_milestone_template_id_fkey"
            columns: ["milestone_template_id"]
            isOneToOne: false
            referencedRelation: "milestone_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_template_tags: {
        Row: {
          task_template_id: string
          tag: string
        }
        Insert: {
          task_template_id: string
          tag: string
        }
        Update: {
          task_template_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_template_tags_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          id: string
          user_id: string
          goal_id: string
          journey_template_id: string
          org_id: string | null
          start_date: string
          end_date: string | null
          status: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id: string
          journey_template_id: string
          org_id?: string | null
          start_date?: string
          end_date?: string | null
          status?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string
          journey_template_id?: string
          org_id?: string | null
          start_date?: string
          end_date?: string | null
          status?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_journey_template_id_fkey"
            columns: ["journey_template_id"]
            isOneToOne: false
            referencedRelation: "journey_templates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_weeks: {
        Row: {
          id: string
          plan_id: string
          week_number: number
          week_start_date: string
          focus_theme: string | null
          created_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          week_number: number
          week_start_date: string
          focus_theme?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          week_number?: number
          week_start_date?: string
          focus_theme?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "plan_weeks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_milestones: {
        Row: {
          id: string
          plan_id: string
          milestone_template_id: string
          status: string
          completed_at: string | null
        }
        Insert: {
          id?: string
          plan_id: string
          milestone_template_id: string
          status?: string
          completed_at?: string | null
        }
        Update: {
          id?: string
          plan_id?: string
          milestone_template_id?: string
          status?: string
          completed_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "plan_milestones_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plan_milestones_milestone_template_id_fkey"
            columns: ["milestone_template_id"]
            isOneToOne: false
            referencedRelation: "milestone_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      tasks: {
        Row: {
          id: string
          plan_id: string
          user_id: string
          task_template_id: string | null
          title: string
          description: string | null
          task_type: string
          priority: number
          due_at: string | null
          status: string
          completed_at: string | null
          exempt_reason: string | null
          created_at: string
        }
        Insert: {
          id?: string
          plan_id: string
          user_id: string
          task_template_id?: string | null
          title: string
          description?: string | null
          task_type: string
          priority?: number
          due_at?: string | null
          status?: string
          completed_at?: string | null
          exempt_reason?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          plan_id?: string
          user_id?: string
          task_template_id?: string | null
          title?: string
          description?: string | null
          task_type?: string
          priority?: number
          due_at?: string | null
          status?: string
          completed_at?: string | null
          exempt_reason?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tasks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tasks_task_template_id_fkey"
            columns: ["task_template_id"]
            isOneToOne: false
            referencedRelation: "task_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      task_dependencies: {
        Row: {
          task_id: string
          depends_on_task_id: string
        }
        Insert: {
          task_id: string
          depends_on_task_id: string
        }
        Update: {
          task_id?: string
          depends_on_task_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_dependencies_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_dependencies_depends_on_task_id_fkey"
            columns: ["depends_on_task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      artifacts: {
        Row: {
          id: string
          user_id: string
          artifact_type: string
          title: string
          content_text: string | null
          content_url: string | null
          storage_path: string | null
          visibility: string
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          artifact_type: string
          title: string
          content_text?: string | null
          content_url?: string | null
          storage_path?: string | null
          visibility?: string
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          artifact_type?: string
          title?: string
          content_text?: string | null
          content_url?: string | null
          storage_path?: string | null
          visibility?: string
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "artifacts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      task_evidence: {
        Row: {
          id: string
          task_id: string
          artifact_id: string
          submitted_at: string
        }
        Insert: {
          id?: string
          task_id: string
          artifact_id: string
          submitted_at?: string
        }
        Update: {
          id?: string
          task_id?: string
          artifact_id?: string
          submitted_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_evidence_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_evidence_artifact_id_fkey"
            columns: ["artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          id: string
          task_id: string
          reviewer_user_id: string
          org_id: string | null
          status: string
          feedback: string | null
          created_at: string
          resolved_at: string | null
        }
        Insert: {
          id?: string
          task_id: string
          reviewer_user_id: string
          org_id?: string | null
          status?: string
          feedback?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Update: {
          id?: string
          task_id?: string
          reviewer_user_id?: string
          org_id?: string | null
          status?: string
          feedback?: string | null
          created_at?: string
          resolved_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_reviewer_user_id_fkey"
            columns: ["reviewer_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities: {
        Row: {
          id: string
          title: string
          description: string
          provider_name: string | null
          url: string | null
          mode: string
          cost_type: string
          min_grade: number | null
          max_grade: number | null
          time_commitment_hours: number | null
          start_date: string | null
          end_date: string | null
          deadline_date: string | null
          location_name: string | null
          zipcode: string | null
          latitude: number | null
          longitude: number | null
          created_at: string
        }
        Insert: {
          id?: string
          title: string
          description: string
          provider_name?: string | null
          url?: string | null
          mode: string
          cost_type: string
          min_grade?: number | null
          max_grade?: number | null
          time_commitment_hours?: number | null
          start_date?: string | null
          end_date?: string | null
          deadline_date?: string | null
          location_name?: string | null
          zipcode?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string
        }
        Update: {
          id?: string
          title?: string
          description?: string
          provider_name?: string | null
          url?: string | null
          mode?: string
          cost_type?: string
          min_grade?: number | null
          max_grade?: number | null
          time_commitment_hours?: number | null
          start_date?: string | null
          end_date?: string | null
          deadline_date?: string | null
          location_name?: string | null
          zipcode?: string | null
          latitude?: number | null
          longitude?: number | null
          created_at?: string
        }
        Relationships: []
      }
      opportunity_tags: {
        Row: {
          opportunity_id: string
          tag: string
        }
        Insert: {
          opportunity_id: string
          tag: string
        }
        Update: {
          opportunity_id?: string
          tag?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_tags_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunity_matches: {
        Row: {
          id: string
          user_id: string
          goal_id: string | null
          opportunity_id: string
          score: number
          reasons: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id?: string | null
          opportunity_id: string
          score: number
          reasons?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string | null
          opportunity_id?: string
          score?: number
          reasons?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "opportunity_matches_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_matches_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "opportunity_matches_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      task_opportunities: {
        Row: {
          task_id: string
          opportunity_id: string
        }
        Insert: {
          task_id: string
          opportunity_id: string
        }
        Update: {
          task_id?: string
          opportunity_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "task_opportunities_task_id_fkey"
            columns: ["task_id"]
            isOneToOne: false
            referencedRelation: "tasks"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "task_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_items: {
        Row: {
          id: string
          user_id: string
          item_type: string
          ref_id: string | null
          title: string
          subtitle: string | null
          why_this: string | null
          rank_score: number
          expires_at: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          item_type: string
          ref_id?: string | null
          title: string
          subtitle?: string | null
          why_this?: string | null
          rank_score?: number
          expires_at?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          item_type?: string
          ref_id?: string | null
          title?: string
          subtitle?: string | null
          why_this?: string | null
          rank_score?: number
          expires_at?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feed_items_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          id: string
          user_id: string
          org_id: string | null
          event_type: string
          entity_type: string | null
          entity_id: string | null
          metadata: Json
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          org_id?: string | null
          event_type: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          org_id?: string | null
          event_type?: string
          entity_type?: string | null
          entity_id?: string | null
          metadata?: Json
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      outcomes: {
        Row: {
          id: string
          user_id: string
          goal_id: string | null
          outcome_type: string
          title: string
          description: string | null
          occurred_on: string
          verification_status: string
          verified_by_user_id: string | null
          evidence_artifact_id: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          goal_id?: string | null
          outcome_type: string
          title: string
          description?: string | null
          occurred_on: string
          verification_status?: string
          verified_by_user_id?: string | null
          evidence_artifact_id?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          goal_id?: string | null
          outcome_type?: string
          title?: string
          description?: string | null
          occurred_on?: string
          verification_status?: string
          verified_by_user_id?: string | null
          evidence_artifact_id?: string | null
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "outcomes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outcomes_goal_id_fkey"
            columns: ["goal_id"]
            isOneToOne: false
            referencedRelation: "goals"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outcomes_verified_by_user_id_fkey"
            columns: ["verified_by_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "outcomes_evidence_artifact_id_fkey"
            columns: ["evidence_artifact_id"]
            isOneToOne: false
            referencedRelation: "artifacts"
            referencedColumns: ["id"]
          },
        ]
      }
      org_reporting_policies: {
        Row: {
          org_id: string
          allow_individual_level: boolean
          minimum_aggregation_n: number
          created_at: string
        }
        Insert: {
          org_id: string
          allow_individual_level?: boolean
          minimum_aggregation_n?: number
          created_at?: string
        }
        Update: {
          org_id?: string
          allow_individual_level?: boolean
          minimum_aggregation_n?: number
          created_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_reporting_policies_org_id_fkey"
            columns: ["org_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      // =================================================================
      // Legacy tables (renamed from V1 schema, preserved for data)
      // =================================================================
      plans_legacy: {
        Row: {
          career_path_id: string | null
          created_at: string
          cycle_number: number
          goal_domain: string | null
          id: string
          outcome_statement: string | null
          pathway_id: string | null
          primary_pillar_focus: string[] | null
          profile_snapshot: Json
          stage: string
          target_date: string | null
          title: string
          user_id: string
        }
        Insert: {
          career_path_id?: string | null
          created_at?: string
          cycle_number?: number
          goal_domain?: string | null
          id?: string
          outcome_statement?: string | null
          pathway_id?: string | null
          primary_pillar_focus?: string[] | null
          profile_snapshot?: Json
          stage?: string
          target_date?: string | null
          title: string
          user_id: string
        }
        Update: {
          career_path_id?: string | null
          created_at?: string
          cycle_number?: number
          goal_domain?: string | null
          id?: string
          outcome_statement?: string | null
          pathway_id?: string | null
          primary_pillar_focus?: string[] | null
          profile_snapshot?: Json
          stage?: string
          target_date?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_legacy_career_path_id_fkey"
            columns: ["career_path_id"]
            isOneToOne: false
            referencedRelation: "career_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "plans_legacy_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_weeks_legacy: {
        Row: {
          actions: Json
          created_at: string
          focus: string
          id: string
          milestone: string
          plan_id: string
          week_number: number
        }
        Insert: {
          actions?: Json
          created_at?: string
          focus: string
          id?: string
          milestone: string
          plan_id: string
          week_number: number
        }
        Update: {
          actions?: Json
          created_at?: string
          focus?: string
          id?: string
          milestone?: string
          plan_id?: string
          week_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "plan_weeks_legacy_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans_legacy"
            referencedColumns: ["id"]
          },
        ]
      }
      opportunities_legacy: {
        Row: {
          created_at: string
          description: string
          domain: Database["public"]["Enums"]["goal_domain"]
          id: string
          is_active: boolean
          next_step_cta_label: string
          next_step_url: string | null
          requirements_json: Json
          title: string
        }
        Insert: {
          created_at?: string
          description: string
          domain: Database["public"]["Enums"]["goal_domain"]
          id?: string
          is_active?: boolean
          next_step_cta_label?: string
          next_step_url?: string | null
          requirements_json?: Json
          title: string
        }
        Update: {
          created_at?: string
          description?: string
          domain?: Database["public"]["Enums"]["goal_domain"]
          id?: string
          is_active?: boolean
          next_step_cta_label?: string
          next_step_url?: string | null
          requirements_json?: Json
          title?: string
        }
        Relationships: []
      }
      // =================================================================
      // Existing V1 tables (unchanged)
      // =================================================================
      career_domains: {
        Row: {
          created_at: string
          description: string
          id: string
          name: string
        }
        Insert: {
          created_at?: string
          description: string
          id?: string
          name: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          name?: string
        }
        Relationships: []
      }
      career_opportunities: {
        Row: {
          career_path_id: string
          created_at: string
          description: string
          difficulty_level: number
          external_url: string | null
          id: string
          is_active: boolean
          next_action_instructions: string
          next_action_label: string
          title: string
          type: Database["public"]["Enums"]["opportunity_type"]
        }
        Insert: {
          career_path_id: string
          created_at?: string
          description: string
          difficulty_level?: number
          external_url?: string | null
          id?: string
          is_active?: boolean
          next_action_instructions?: string
          next_action_label?: string
          title: string
          type: Database["public"]["Enums"]["opportunity_type"]
        }
        Update: {
          career_path_id?: string
          created_at?: string
          description?: string
          difficulty_level?: number
          external_url?: string | null
          id?: string
          is_active?: boolean
          next_action_instructions?: string
          next_action_label?: string
          title?: string
          type?: Database["public"]["Enums"]["opportunity_type"]
        }
        Relationships: [
          {
            foreignKeyName: "career_opportunities_career_path_id_fkey"
            columns: ["career_path_id"]
            isOneToOne: false
            referencedRelation: "career_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      career_paths: {
        Row: {
          created_at: string
          description: string
          domain_id: string
          id: string
          is_active: boolean
          name: string
          next_level_career_ids: string[]
          recommended_education_notes: string
          related_career_ids: string[]
          tags: string[]
        }
        Insert: {
          created_at?: string
          description: string
          domain_id: string
          id?: string
          is_active?: boolean
          name: string
          next_level_career_ids?: string[]
          recommended_education_notes?: string
          related_career_ids?: string[]
          tags?: string[]
        }
        Update: {
          created_at?: string
          description?: string
          domain_id?: string
          id?: string
          is_active?: boolean
          name?: string
          next_level_career_ids?: string[]
          recommended_education_notes?: string
          related_career_ids?: string[]
          tags?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "career_paths_domain_id_fkey"
            columns: ["domain_id"]
            isOneToOne: false
            referencedRelation: "career_domains"
            referencedColumns: ["id"]
          },
        ]
      }
      career_pillars: {
        Row: {
          career_path_id: string
          created_at: string
          id: string
          name: string
          weight: number
        }
        Insert: {
          career_path_id: string
          created_at?: string
          id?: string
          name: string
          weight?: number
        }
        Update: {
          career_path_id?: string
          created_at?: string
          id?: string
          name?: string
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "career_pillars_career_path_id_fkey"
            columns: ["career_path_id"]
            isOneToOne: false
            referencedRelation: "career_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      career_unlock_rules: {
        Row: {
          created_at: string
          id: string
          opportunity_id: string
          required_cycle_number: number | null
          required_manual_flags: Json | null
          required_milestone_completion_rate: number
          required_pillar: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          opportunity_id: string
          required_cycle_number?: number | null
          required_manual_flags?: Json | null
          required_milestone_completion_rate?: number
          required_pillar?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          opportunity_id?: string
          required_cycle_number?: number | null
          required_manual_flags?: Json | null
          required_milestone_completion_rate?: number
          required_pillar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "career_unlock_rules_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "career_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_analytics_snapshot: {
        Row: {
          computed_at: string
          id: string
          snapshot_json: Json
        }
        Insert: {
          computed_at?: string
          id?: string
          snapshot_json?: Json
        }
        Update: {
          computed_at?: string
          id?: string
          snapshot_json?: Json
        }
        Relationships: []
      }
      pathway_opportunities: {
        Row: {
          created_at: string
          id: string
          opportunity_id: string
          pathway_id: string
          unlock_rule_json: Json
        }
        Insert: {
          created_at?: string
          id?: string
          opportunity_id: string
          pathway_id: string
          unlock_rule_json?: Json
        }
        Update: {
          created_at?: string
          id?: string
          opportunity_id?: string
          pathway_id?: string
          unlock_rule_json?: Json
        }
        Relationships: [
          {
            foreignKeyName: "pathway_opportunities_legacy_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities_legacy"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "pathway_opportunities_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      pathways: {
        Row: {
          created_at: string
          default_milestones: Json
          description: string
          domain: Database["public"]["Enums"]["goal_domain"]
          id: string
          is_active: boolean
          tags: string[]
          title: string
        }
        Insert: {
          created_at?: string
          default_milestones?: Json
          description: string
          domain: Database["public"]["Enums"]["goal_domain"]
          id?: string
          is_active?: boolean
          tags?: string[]
          title: string
        }
        Update: {
          created_at?: string
          default_milestones?: Json
          description?: string
          domain?: Database["public"]["Enums"]["goal_domain"]
          id?: string
          is_active?: boolean
          tags?: string[]
          title?: string
        }
        Relationships: []
      }
      prediction_snapshots: {
        Row: {
          adherence_probability: number
          created_at: string
          grade_level: string | null
          id: string
          plan_hash: string
          risk_flag: boolean
          time_per_week_hours: number | null
          top_drivers: Json
          transportation: string | null
          user_hash: string
          week_number: number
        }
        Insert: {
          adherence_probability: number
          created_at?: string
          grade_level?: string | null
          id?: string
          plan_hash: string
          risk_flag?: boolean
          time_per_week_hours?: number | null
          top_drivers?: Json
          transportation?: string | null
          user_hash: string
          week_number: number
        }
        Update: {
          adherence_probability?: number
          created_at?: string
          grade_level?: string | null
          id?: string
          plan_hash?: string
          risk_flag?: boolean
          time_per_week_hours?: number | null
          top_drivers?: Json
          transportation?: string | null
          user_hash?: string
          week_number?: number
        }
        Relationships: []
      }
      profiles: {
        Row: {
          baseline_json: Json | null
          career_path_id: string | null
          constraints_json: Json | null
          created_at: string
          domain_baseline: Json | null
          goal_domain: string | null
          goals: string[] | null
          grade_level: string | null
          id: string
          interests: string[] | null
          outcome_statement: string | null
          pathway_id: string | null
          school_name: string | null
          target_date: string | null
          type: string
          updated_at: string
          user_id: string
          zip_code: string | null
        }
        Insert: {
          baseline_json?: Json | null
          career_path_id?: string | null
          constraints_json?: Json | null
          created_at?: string
          domain_baseline?: Json | null
          goal_domain?: string | null
          goals?: string[] | null
          grade_level?: string | null
          id?: string
          interests?: string[] | null
          outcome_statement?: string | null
          pathway_id?: string | null
          school_name?: string | null
          target_date?: string | null
          type?: string
          updated_at?: string
          user_id: string
          zip_code?: string | null
        }
        Update: {
          baseline_json?: Json | null
          career_path_id?: string | null
          constraints_json?: Json | null
          created_at?: string
          domain_baseline?: Json | null
          goal_domain?: string | null
          goals?: string[] | null
          grade_level?: string | null
          id?: string
          interests?: string[] | null
          outcome_statement?: string | null
          pathway_id?: string | null
          school_name?: string | null
          target_date?: string | null
          type?: string
          updated_at?: string
          user_id?: string
          zip_code?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_career_path_id_fkey"
            columns: ["career_path_id"]
            isOneToOne: false
            referencedRelation: "career_paths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category: Database["public"]["Enums"]["resource_category"]
          cost_dollars: number
          created_at: string
          created_by: string | null
          description: string
          grade_levels: string[]
          id: string
          is_active: boolean
          is_free: boolean
          tags: string[]
          title: string
          transportation: Database["public"]["Enums"]["transport_mode"]
          updated_at: string
          url: string | null
          zip_prefixes: string[]
        }
        Insert: {
          category: Database["public"]["Enums"]["resource_category"]
          cost_dollars?: number
          created_at?: string
          created_by?: string | null
          description: string
          grade_levels?: string[]
          id?: string
          is_active?: boolean
          is_free?: boolean
          tags?: string[]
          title: string
          transportation?: Database["public"]["Enums"]["transport_mode"]
          updated_at?: string
          url?: string | null
          zip_prefixes?: string[]
        }
        Update: {
          category?: Database["public"]["Enums"]["resource_category"]
          cost_dollars?: number
          created_at?: string
          created_by?: string | null
          description?: string
          grade_levels?: string[]
          id?: string
          is_active?: boolean
          is_free?: boolean
          tags?: string[]
          title?: string
          transportation?: Database["public"]["Enums"]["transport_mode"]
          updated_at?: string
          url?: string | null
          zip_prefixes?: string[]
        }
        Relationships: []
      }
      student_events: {
        Row: {
          created_at: string
          event_type: Database["public"]["Enums"]["student_event_type"]
          id: string
          payload: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: Database["public"]["Enums"]["student_event_type"]
          id?: string
          payload?: Json
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: Database["public"]["Enums"]["student_event_type"]
          id?: string
          payload?: Json
          user_id?: string
        }
        Relationships: []
      }
      student_evidence: {
        Row: {
          created_at: string
          description: string | null
          evidence_type: string
          file_path: string
          id: string
          pillar_id: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          evidence_type?: string
          file_path: string
          id?: string
          pillar_id?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          evidence_type?: string
          file_path?: string
          id?: string
          pillar_id?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_evidence_pillar_id_fkey"
            columns: ["pillar_id"]
            isOneToOne: false
            referencedRelation: "career_pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      user_career_unlocks: {
        Row: {
          accepted: boolean
          id: string
          opportunity_id: string
          seen: boolean
          unlocked_at: string
          user_id: string
        }
        Insert: {
          accepted?: boolean
          id?: string
          opportunity_id: string
          seen?: boolean
          unlocked_at?: string
          user_id: string
        }
        Update: {
          accepted?: boolean
          id?: string
          opportunity_id?: string
          seen?: boolean
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_career_unlocks_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "career_opportunities"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pathways: {
        Row: {
          created_at: string
          current_cycle_number: number
          id: string
          pathway_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          current_cycle_number?: number
          id?: string
          pathway_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          current_cycle_number?: number
          id?: string
          pathway_id?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pathways_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
            referencedColumns: ["id"]
          },
        ]
      }
      user_pillar_progress: {
        Row: {
          career_pillar_id: string
          cycle_contribution: number
          id: string
          last_updated: string
          milestone_contribution: number
          opportunity_contribution: number
          progress_score: number
          user_id: string
        }
        Insert: {
          career_pillar_id: string
          cycle_contribution?: number
          id?: string
          last_updated?: string
          milestone_contribution?: number
          opportunity_contribution?: number
          progress_score?: number
          user_id: string
        }
        Update: {
          career_pillar_id?: string
          cycle_contribution?: number
          id?: string
          last_updated?: string
          milestone_contribution?: number
          opportunity_contribution?: number
          progress_score?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_pillar_progress_career_pillar_id_fkey"
            columns: ["career_pillar_id"]
            isOneToOne: false
            referencedRelation: "career_pillars"
            referencedColumns: ["id"]
          },
        ]
      }
      user_progress: {
        Row: {
          academic_log: Json
          completed_actions: Json
          completed_goals: Json
          created_at: string
          id: string
          plan_id: string
          resources_engaged: string[]
          updated_at: string
          user_id: string
        }
        Insert: {
          academic_log?: Json
          completed_actions?: Json
          completed_goals?: Json
          created_at?: string
          id?: string
          plan_id: string
          resources_engaged?: string[]
          updated_at?: string
          user_id: string
        }
        Update: {
          academic_log?: Json
          completed_actions?: Json
          completed_goals?: Json
          created_at?: string
          id?: string
          plan_id?: string
          resources_engaged?: string[]
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_readiness: {
        Row: {
          career_path_id: string
          id: string
          last_updated: string
          overall_score: number
          previous_score: number
          strongest_pillar: string | null
          user_id: string
          weakest_pillar: string | null
        }
        Insert: {
          career_path_id: string
          id?: string
          last_updated?: string
          overall_score?: number
          previous_score?: number
          strongest_pillar?: string | null
          user_id: string
          weakest_pillar?: string | null
        }
        Update: {
          career_path_id?: string
          id?: string
          last_updated?: string
          overall_score?: number
          previous_score?: number
          strongest_pillar?: string | null
          user_id?: string
          weakest_pillar?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "user_readiness_career_path_id_fkey"
            columns: ["career_path_id"]
            isOneToOne: false
            referencedRelation: "career_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_unlocked_opportunities: {
        Row: {
          id: string
          opportunity_id: string
          reason: string | null
          unlocked_at: string
          user_id: string
        }
        Insert: {
          id?: string
          opportunity_id: string
          reason?: string | null
          unlocked_at?: string
          user_id: string
        }
        Update: {
          id?: string
          opportunity_id?: string
          reason?: string | null
          unlocked_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_unlocked_opportunities_legacy_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities_legacy"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_checkins: {
        Row: {
          completed_actions_count: number
          created_at: string
          grade_level: string | null
          id: string
          plan_hash: string
          time_per_week_hours: number | null
          total_actions_count: number
          transportation: string | null
          user_hash: string
          week_number: number
        }
        Insert: {
          completed_actions_count?: number
          created_at?: string
          grade_level?: string | null
          id?: string
          plan_hash: string
          time_per_week_hours?: number | null
          total_actions_count?: number
          transportation?: string | null
          user_hash: string
          week_number: number
        }
        Update: {
          completed_actions_count?: number
          created_at?: string
          grade_level?: string | null
          id?: string
          plan_hash?: string
          time_per_week_hours?: number | null
          total_actions_count?: number
          transportation?: string | null
          user_hash?: string
          week_number?: number
        }
        Relationships: []
      }
    }
    Views: {
      v_org_plan_completion: {
        Row: {
          org_id: string
          org_name: string
          student_count: number
          total_plans: number
          completed_plans: number
          completion_rate_pct: number | null
        }
        Relationships: []
      }
      v_org_task_completion: {
        Row: {
          org_id: string
          org_name: string
          student_count: number
          total_tasks: number
          completed_tasks: number
          approved_tasks: number
          completion_rate_pct: number | null
        }
        Relationships: []
      }
      v_org_outcomes: {
        Row: {
          org_id: string
          org_name: string
          students_with_outcomes: number
          total_outcomes: number
          verified_outcomes: number
          outcome_type: string | null
          type_count: number
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "student" | "caregiver" | "partner_admin"
      goal_domain: "college" | "career" | "health_fitness"
      opportunity_type:
        | "internship"
        | "scholarship"
        | "program"
        | "certification"
        | "event"
        | "competition"
      resource_category:
        | "online_learning"
        | "local_opportunity"
        | "scholarship"
        | "mentorship"
        | "community_event"
        | "career_program"
      student_event_type:
        | "action_completed"
        | "action_uncompleted"
        | "goal_completed"
        | "resource_engaged"
        | "opportunity_accepted"
        | "cycle_started"
        | "reflection_submitted"
        | "profile_updated"
        | "plan_adapted"
      transport_mode: "walk" | "public" | "car" | "mixed" | "virtual"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["student", "caregiver", "partner_admin"],
      goal_domain: ["college", "career", "health_fitness"],
      opportunity_type: [
        "internship",
        "scholarship",
        "program",
        "certification",
        "event",
        "competition",
      ],
      resource_category: [
        "online_learning",
        "local_opportunity",
        "scholarship",
        "mentorship",
        "community_event",
        "career_program",
      ],
      student_event_type: [
        "action_completed",
        "action_uncompleted",
        "goal_completed",
        "resource_engaged",
        "opportunity_accepted",
        "cycle_started",
        "reflection_submitted",
        "profile_updated",
        "plan_adapted",
      ],
      transport_mode: ["walk", "public", "car", "mixed", "virtual"],
    },
  },
} as const
