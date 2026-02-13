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
      opportunities: {
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
            foreignKeyName: "pathway_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
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
      plan_weeks: {
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
            foreignKeyName: "plan_weeks_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "plans"
            referencedColumns: ["id"]
          },
        ]
      }
      plans: {
        Row: {
          created_at: string
          cycle_number: number
          goal_domain: string | null
          id: string
          outcome_statement: string | null
          pathway_id: string | null
          profile_snapshot: Json
          target_date: string | null
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          cycle_number?: number
          goal_domain?: string | null
          id?: string
          outcome_statement?: string | null
          pathway_id?: string | null
          profile_snapshot?: Json
          target_date?: string | null
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          cycle_number?: number
          goal_domain?: string | null
          id?: string
          outcome_statement?: string | null
          pathway_id?: string | null
          profile_snapshot?: Json
          target_date?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "plans_pathway_id_fkey"
            columns: ["pathway_id"]
            isOneToOne: false
            referencedRelation: "pathways"
            referencedColumns: ["id"]
          },
        ]
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
      user_pathways: {
        Row: {
          created_at: string
          id: string
          pathway_id: string
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          pathway_id: string
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
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
            foreignKeyName: "user_unlocked_opportunities_opportunity_id_fkey"
            columns: ["opportunity_id"]
            isOneToOne: false
            referencedRelation: "opportunities"
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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      goal_domain: "college" | "career" | "health_fitness"
      resource_category:
        | "online_learning"
        | "local_opportunity"
        | "scholarship"
        | "mentorship"
        | "community_event"
        | "career_program"
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
      goal_domain: ["college", "career", "health_fitness"],
      resource_category: [
        "online_learning",
        "local_opportunity",
        "scholarship",
        "mentorship",
        "community_event",
        "career_program",
      ],
      transport_mode: ["walk", "public", "car", "mixed", "virtual"],
    },
  },
} as const
