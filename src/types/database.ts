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
    PostgrestVersion: "14.4"
  }
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      leads: {
        Row: {
          converted: boolean | null
          created_at: string | null
          email: string
          id: string
          postcode: string | null
          report_id: string | null
          source: string
        }
        Insert: {
          converted?: boolean | null
          created_at?: string | null
          email: string
          id?: string
          postcode?: string | null
          report_id?: string | null
          source: string
        }
        Update: {
          converted?: boolean | null
          created_at?: string | null
          email?: string
          id?: string
          postcode?: string | null
          report_id?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "leads_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      lpa: {
        Row: {
          applications_per_year: number | null
          approval_rate_percent: number | null
          article4_coverage: string | null
          average_decision_weeks: number | null
          conservation_area_count: number | null
          created_at: string | null
          flood_risk_level: string | null
          green_belt_coverage: boolean | null
          hero_image_url: string | null
          id: string
          key_policy_notes: string | null
          listed_building_count: number | null
          local_plan_adopted_date: string | null
          local_plan_name: string | null
          lpa_code: string
          name: string
          planning_email: string | null
          planning_portal_url: string | null
          population: number | null
          pre_app_advice_offered: boolean | null
          region: string | null
          slug: string
          summary_paragraph: string | null
          website_url: string | null
        }
        Insert: {
          applications_per_year?: number | null
          approval_rate_percent?: number | null
          article4_coverage?: string | null
          average_decision_weeks?: number | null
          conservation_area_count?: number | null
          created_at?: string | null
          flood_risk_level?: string | null
          green_belt_coverage?: boolean | null
          hero_image_url?: string | null
          id?: string
          key_policy_notes?: string | null
          listed_building_count?: number | null
          local_plan_adopted_date?: string | null
          local_plan_name?: string | null
          lpa_code: string
          name: string
          planning_email?: string | null
          planning_portal_url?: string | null
          population?: number | null
          pre_app_advice_offered?: boolean | null
          region?: string | null
          slug: string
          summary_paragraph?: string | null
          website_url?: string | null
        }
        Update: {
          applications_per_year?: number | null
          approval_rate_percent?: number | null
          article4_coverage?: string | null
          average_decision_weeks?: number | null
          conservation_area_count?: number | null
          created_at?: string | null
          flood_risk_level?: string | null
          green_belt_coverage?: boolean | null
          hero_image_url?: string | null
          id?: string
          key_policy_notes?: string | null
          listed_building_count?: number | null
          local_plan_adopted_date?: string | null
          local_plan_name?: string | null
          lpa_code?: string
          name?: string
          planning_email?: string | null
          planning_portal_url?: string | null
          population?: number | null
          pre_app_advice_offered?: boolean | null
          region?: string | null
          slug?: string
          summary_paragraph?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      professionals: {
        Row: {
          active: boolean | null
          company_name: string | null
          coverage_radius_miles: number | null
          created_at: string | null
          id: string
          postcode: string | null
          professional_type: string
          stripe_subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          active?: boolean | null
          company_name?: string | null
          coverage_radius_miles?: number | null
          created_at?: string | null
          id?: string
          postcode?: string | null
          professional_type: string
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          active?: boolean | null
          company_name?: string | null
          coverage_radius_miles?: number | null
          created_at?: string | null
          id?: string
          postcode?: string | null
          professional_type?: string
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "professionals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          phone: string | null
          role: string
          stripe_customer_id: string | null
          subscription_tier: string
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          phone?: string | null
          role?: string
          stripe_customer_id?: string | null
          subscription_tier?: string
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          phone?: string | null
          role?: string
          stripe_customer_id?: string | null
          subscription_tier?: string
        }
        Relationships: []
      }
      reports: {
        Row: {
          address: string
          approval_score: number | null
          constraint_data: Json | null
          created_at: string | null
          email: string | null
          id: string
          lpa_code: string | null
          lpa_name: string | null
          pdf_url: string | null
          postcode: string
          report_type: string
          share_token: string
          user_id: string | null
        }
        Insert: {
          address: string
          approval_score?: number | null
          constraint_data?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          lpa_code?: string | null
          lpa_name?: string | null
          pdf_url?: string | null
          postcode: string
          report_type?: string
          share_token?: string
          user_id?: string | null
        }
        Update: {
          address?: string
          approval_score?: number | null
          constraint_data?: Json | null
          created_at?: string | null
          email?: string | null
          id?: string
          lpa_code?: string | null
          lpa_name?: string | null
          pdf_url?: string | null
          postcode?: string
          report_type?: string
          share_token?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      statements: {
        Row: {
          address: string | null
          created_at: string | null
          generated_content: string | null
          id: string
          lpa_name: string | null
          proposal_text: string
          report_id: string | null
          status: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          created_at?: string | null
          generated_content?: string | null
          id?: string
          lpa_name?: string | null
          proposal_text: string
          report_id?: string | null
          status?: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          created_at?: string | null
          generated_content?: string | null
          id?: string
          lpa_name?: string | null
          proposal_text?: string
          report_id?: string | null
          status?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "statements_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "statements_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          created_at: string | null
          current_period_end: string | null
          id: string
          plan: string
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan: string
          status: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          current_period_end?: string | null
          id?: string
          plan?: string
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_report_by_share_token: {
        Args: { p_token: string }
        Returns: {
          address: string
          approval_score: number | null
          constraint_data: Json | null
          created_at: string | null
          email: string | null
          id: string
          lpa_code: string | null
          lpa_name: string | null
          pdf_url: string | null
          postcode: string
          report_type: string
          share_token: string
          user_id: string | null
        }
        SetofOptions: {
          from: "*"
          to: "reports"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      [_ in never]: never
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
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {},
  },
} as const
