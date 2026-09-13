// Generated from Supabase project sduefddcfsurhoyxmfrq (2026-09-13).
// Regenerate after schema changes (Supabase MCP `generate_typescript_types`
// or `supabase gen types typescript --project-id sduefddcfsurhoyxmfrq`).
export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.17"
  }
  public: {
    Tables: {
      guests: {
        Row: {
          attending: boolean | null
          created_at: string
          dietary: string | null
          full_name: string
          household_id: string
          id: string
          is_child: boolean
        }
        Insert: {
          attending?: boolean | null
          created_at?: string
          dietary?: string | null
          full_name: string
          household_id: string
          id?: string
          is_child?: boolean
        }
        Update: {
          attending?: boolean | null
          created_at?: string
          dietary?: string | null
          full_name?: string
          household_id?: string
          id?: string
          is_child?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "guests_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "guests_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      households: {
        Row: {
          amount_due_cents: number
          created_at: string
          email: string | null
          id: string
          invite_code: string | null
          max_guests: number
          message: string | null
          name: string
          notes: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          phone: string | null
          responded_at: string | null
          rsvp_status: Database["public"]["Enums"]["rsvp_status"]
          updated_at: string
        }
        Insert: {
          amount_due_cents?: number
          created_at?: string
          email?: string | null
          id?: string
          invite_code?: string | null
          max_guests?: number
          message?: string | null
          name: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string | null
          responded_at?: string | null
          rsvp_status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
        }
        Update: {
          amount_due_cents?: number
          created_at?: string
          email?: string | null
          id?: string
          invite_code?: string | null
          max_guests?: number
          message?: string | null
          name?: string
          notes?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          phone?: string | null
          responded_at?: string | null
          rsvp_status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount_cents: number
          created_at: string
          household_id: string
          id: string
          method: string | null
          notes: string | null
          paid_at: string
          reference: string | null
        }
        Insert: {
          amount_cents: number
          created_at?: string
          household_id: string
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string
          reference?: string | null
        }
        Update: {
          amount_cents?: number
          created_at?: string
          household_id?: string
          id?: string
          method?: string | null
          notes?: string | null
          paid_at?: string
          reference?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "payments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
      responses: {
        Row: {
          author_email: string | null
          created_at: string
          freeform: Json
          id: string
          notes: Json
          project: string
          selections: Json
          user_id: string
        }
        Insert: {
          author_email?: string | null
          created_at?: string
          freeform?: Json
          id?: string
          notes?: Json
          project?: string
          selections?: Json
          user_id: string
        }
        Update: {
          author_email?: string | null
          created_at?: string
          freeform?: Json
          id?: string
          notes?: Json
          project?: string
          selections?: Json
          user_id?: string
        }
        Relationships: []
      }
      rsvp_submissions: {
        Row: {
          created_at: string
          household_id: string | null
          id: string
          ip: string | null
          payload: Json
          user_agent: string | null
        }
        Insert: {
          created_at?: string
          household_id?: string | null
          id?: string
          ip?: string | null
          payload: Json
          user_agent?: string | null
        }
        Update: {
          created_at?: string
          household_id?: string | null
          id?: string
          ip?: string | null
          payload?: Json
          user_agent?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "rsvp_submissions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "household_overview"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "rsvp_submissions_household_id_fkey"
            columns: ["household_id"]
            isOneToOne: false
            referencedRelation: "households"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      household_overview: {
        Row: {
          amount_due_cents: number | null
          attending_count: number | null
          child_count: number | null
          created_at: string | null
          email: string | null
          guest_count: number | null
          id: string | null
          invite_code: string | null
          max_guests: number | null
          message: string | null
          name: string | null
          notes: string | null
          outstanding_cents: number | null
          paid_cents: number | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          phone: string | null
          responded_at: string | null
          rsvp_status: Database["public"]["Enums"]["rsvp_status"] | null
          updated_at: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      recompute_payment_status: {
        Args: { p_household_id: string }
        Returns: undefined
      }
    }
    Enums: {
      payment_status: "unpaid" | "partial" | "paid"
      rsvp_status: "pending" | "attending" | "declined"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      payment_status: ["unpaid", "partial", "paid"],
      rsvp_status: ["pending", "attending", "declined"],
    },
  },
} as const
