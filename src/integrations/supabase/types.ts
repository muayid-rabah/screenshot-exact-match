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
    PostgrestVersion: "14.18"
  }
  public: {
    Tables: {
      academic_terms: {
        Row: {
          code: string
          ends_on: string
          is_current: boolean
          name: string
          starts_on: string
        }
        Insert: {
          code: string
          ends_on: string
          is_current?: boolean
          name: string
          starts_on: string
        }
        Update: {
          code?: string
          ends_on?: string
          is_current?: boolean
          name?: string
          starts_on?: string
        }
        Relationships: []
      }
      course_sessions: {
        Row: {
          course_id: string
          end_time: string
          id: string
          instructor: string
          room: string
          start_time: string
          weekday: number
        }
        Insert: {
          course_id: string
          end_time: string
          id?: string
          instructor: string
          room: string
          start_time: string
          weekday: number
        }
        Update: {
          course_id?: string
          end_time?: string
          id?: string
          instructor?: string
          room?: string
          start_time?: string
          weekday?: number
        }
        Relationships: [
          {
            foreignKeyName: "course_sessions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          category: string
          code: string
          credits: number
          id: string
          name: string
        }
        Insert: {
          category: string
          code: string
          credits: number
          id?: string
          name: string
        }
        Update: {
          category?: string
          code?: string
          credits?: number
          id?: string
          name?: string
        }
        Relationships: []
      }
      deadlines: {
        Row: {
          due_at: string
          id: string
          kind: string
          title: string
        }
        Insert: {
          due_at: string
          id?: string
          kind: string
          title: string
        }
        Update: {
          due_at?: string
          id?: string
          kind?: string
          title?: string
        }
        Relationships: []
      }
      exams: {
        Row: {
          course_id: string
          id: string
          kind: string
          room: string
          starts_at: string
        }
        Insert: {
          course_id: string
          id?: string
          kind: string
          room: string
          starts_at: string
        }
        Update: {
          course_id?: string
          id?: string
          kind?: string
          room?: string
          starts_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "exams_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string
          created_at: string
          id: string
          is_read: boolean
          level: string
          title: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          is_read?: boolean
          level?: string
          title: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          is_read?: boolean
          level?: string
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          academic_status: string
          admission_year: number
          advisor_name: string
          college: string
          created_at: string
          degree: string
          full_name: string
          id: string
          is_demo: boolean
          major: string
          plan_no: string
          required_hours: number
          university_id: string
          updated_at: string
        }
        Insert: {
          academic_status?: string
          admission_year?: number
          advisor_name?: string
          college?: string
          created_at?: string
          degree?: string
          full_name: string
          id: string
          is_demo?: boolean
          major?: string
          plan_no?: string
          required_hours?: number
          university_id: string
          updated_at?: string
        }
        Update: {
          academic_status?: string
          admission_year?: number
          advisor_name?: string
          college?: string
          created_at?: string
          degree?: string
          full_name?: string
          id?: string
          is_demo?: boolean
          major?: string
          plan_no?: string
          required_hours?: number
          university_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      student_records: {
        Row: {
          absences: number
          course_id: string
          grade_points: number | null
          id: string
          letter: string | null
          status: string
          term_code: string
          user_id: string
        }
        Insert: {
          absences?: number
          course_id: string
          grade_points?: number | null
          id?: string
          letter?: string | null
          status: string
          term_code: string
          user_id: string
        }
        Update: {
          absences?: number
          course_id?: string
          grade_points?: number | null
          id?: string
          letter?: string | null
          status?: string
          term_code?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_records_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_records_term_code_fkey"
            columns: ["term_code"]
            isOneToOne: false
            referencedRelation: "academic_terms"
            referencedColumns: ["code"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
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
      app_role:
        | "STUDENT"
        | "INSTRUCTOR"
        | "ACADEMIC_ADVISOR"
        | "REGISTRAR"
        | "FINANCE_ADMIN"
        | "SUPER_ADMIN"
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

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: [
        "STUDENT",
        "INSTRUCTOR",
        "ACADEMIC_ADVISOR",
        "REGISTRAR",
        "FINANCE_ADMIN",
        "SUPER_ADMIN",
      ],
    },
  },
} as const
