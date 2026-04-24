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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      album_photos: {
        Row: {
          album_id: string
          caption: string | null
          created_at: string
          family_id: string
          id: string
          image_url: string
          user_id: string
        }
        Insert: {
          album_id: string
          caption?: string | null
          created_at?: string
          family_id: string
          id?: string
          image_url: string
          user_id: string
        }
        Update: {
          album_id?: string
          caption?: string | null
          created_at?: string
          family_id?: string
          id?: string
          image_url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "album_photos_album_id_fkey"
            columns: ["album_id"]
            isOneToOne: false
            referencedRelation: "family_albums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "album_photos_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      answer_comments: {
        Row: {
          answer_id: string
          content: string
          created_at: string
          family_id: string
          id: string
          user_id: string
        }
        Insert: {
          answer_id: string
          content: string
          created_at?: string
          family_id: string
          id?: string
          user_id: string
        }
        Update: {
          answer_id?: string
          content?: string
          created_at?: string
          family_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answer_comments_answer_id_fkey"
            columns: ["answer_id"]
            isOneToOne: false
            referencedRelation: "answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answer_comments_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      answers: {
        Row: {
          audio_url: string | null
          capsule_id: string
          content: string
          created_at: string
          family_id: string
          id: string
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          capsule_id: string
          content: string
          created_at?: string
          family_id: string
          id?: string
          user_id: string
        }
        Update: {
          audio_url?: string | null
          capsule_id?: string
          content?: string
          created_at?: string
          family_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "answers_capsule_id_fkey"
            columns: ["capsule_id"]
            isOneToOne: false
            referencedRelation: "daily_capsules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "answers_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_completions: {
        Row: {
          capsule_id: string
          completed_at: string
          family_id: string
          id: string
          user_id: string
        }
        Insert: {
          capsule_id: string
          completed_at?: string
          family_id: string
          id?: string
          user_id: string
        }
        Update: {
          capsule_id?: string
          completed_at?: string
          family_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_completions_capsule_id_fkey"
            columns: ["capsule_id"]
            isOneToOne: false
            referencedRelation: "daily_capsules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenge_completions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      compatibility_answers: {
        Row: {
          answers: Json
          created_at: string
          family_id: string
          id: string
          quiz_id: string
          user_id: string
        }
        Insert: {
          answers: Json
          created_at?: string
          family_id: string
          id?: string
          quiz_id: string
          user_id: string
        }
        Update: {
          answers?: Json
          created_at?: string
          family_id?: string
          id?: string
          quiz_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "compatibility_answers_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "compatibility_answers_quiz_id_fkey"
            columns: ["quiz_id"]
            isOneToOne: false
            referencedRelation: "compatibility_quizzes"
            referencedColumns: ["id"]
          },
        ]
      }
      compatibility_quizzes: {
        Row: {
          created_at: string
          family_id: string
          id: string
          month_key: string
          questions: Json
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          month_key: string
          questions: Json
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          month_key?: string
          questions?: Json
        }
        Relationships: [
          {
            foreignKeyName: "compatibility_quizzes_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_capsules: {
        Row: {
          capsule_date: string
          challenge: string
          created_at: string
          family_id: string
          id: string
          question: string
        }
        Insert: {
          capsule_date: string
          challenge: string
          created_at?: string
          family_id: string
          id?: string
          question: string
        }
        Update: {
          capsule_date?: string
          challenge?: string
          created_at?: string
          family_id?: string
          id?: string
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "daily_capsules_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      decision_votes: {
        Row: {
          created_at: string
          decision_id: string
          family_id: string
          id: string
          option_index: number
          user_id: string
        }
        Insert: {
          created_at?: string
          decision_id: string
          family_id: string
          id?: string
          option_index: number
          user_id: string
        }
        Update: {
          created_at?: string
          decision_id?: string
          family_id?: string
          id?: string
          option_index?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "decision_votes_decision_id_fkey"
            columns: ["decision_id"]
            isOneToOne: false
            referencedRelation: "family_decisions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "decision_votes_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      families: {
        Row: {
          created_at: string
          created_by: string | null
          id: string
          invite_code: string
          name: string | null
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          id?: string
          invite_code: string
          name?: string | null
        }
        Update: {
          created_at?: string
          created_by?: string | null
          id?: string
          invite_code?: string
          name?: string | null
        }
        Relationships: []
      }
      family_albums: {
        Row: {
          cover_url: string | null
          created_at: string
          created_by: string
          description: string | null
          family_id: string
          id: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_url?: string | null
          created_at?: string
          created_by: string
          description?: string | null
          family_id: string
          id?: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_url?: string | null
          created_at?: string
          created_by?: string
          description?: string | null
          family_id?: string
          id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_albums_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_badges: {
        Row: {
          badge_key: string
          earned_at: string
          family_id: string
          id: string
        }
        Insert: {
          badge_key: string
          earned_at?: string
          family_id: string
          id?: string
        }
        Update: {
          badge_key?: string
          earned_at?: string
          family_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_badges_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_decisions: {
        Row: {
          closed: boolean
          closes_at: string | null
          created_at: string
          created_by: string
          family_id: string
          id: string
          options: Json
          question: string
        }
        Insert: {
          closed?: boolean
          closes_at?: string | null
          created_at?: string
          created_by: string
          family_id: string
          id?: string
          options: Json
          question: string
        }
        Update: {
          closed?: boolean
          closes_at?: string | null
          created_at?: string
          created_by?: string
          family_id?: string
          id?: string
          options?: Json
          question?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_decisions_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_events: {
        Row: {
          created_at: string
          created_by: string
          description: string | null
          event_date: string
          event_type: string
          family_id: string
          id: string
          is_recurring: boolean
          title: string
        }
        Insert: {
          created_at?: string
          created_by: string
          description?: string | null
          event_date: string
          event_type?: string
          family_id: string
          id?: string
          is_recurring?: boolean
          title: string
        }
        Update: {
          created_at?: string
          created_by?: string
          description?: string | null
          event_date?: string
          event_type?: string
          family_id?: string
          id?: string
          is_recurring?: boolean
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_events_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_members: {
        Row: {
          family_id: string
          id: string
          joined_at: string
          nickname: string | null
          role: Database["public"]["Enums"]["family_role"]
          user_id: string
        }
        Insert: {
          family_id: string
          id?: string
          joined_at?: string
          nickname?: string | null
          role?: Database["public"]["Enums"]["family_role"]
          user_id: string
        }
        Update: {
          family_id?: string
          id?: string
          joined_at?: string
          nickname?: string | null
          role?: Database["public"]["Enums"]["family_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_members_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      family_tree_nodes: {
        Row: {
          avatar_url: string | null
          birth_year: number | null
          created_at: string
          created_by: string
          family_id: string
          id: string
          name: string
          notes: string | null
          parent_node_id: string | null
          relation: string
        }
        Insert: {
          avatar_url?: string | null
          birth_year?: number | null
          created_at?: string
          created_by: string
          family_id: string
          id?: string
          name: string
          notes?: string | null
          parent_node_id?: string | null
          relation: string
        }
        Update: {
          avatar_url?: string | null
          birth_year?: number | null
          created_at?: string
          created_by?: string
          family_id?: string
          id?: string
          name?: string
          notes?: string | null
          parent_node_id?: string | null
          relation?: string
        }
        Relationships: [
          {
            foreignKeyName: "family_tree_nodes_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "family_tree_nodes_parent_node_id_fkey"
            columns: ["parent_node_id"]
            isOneToOne: false
            referencedRelation: "family_tree_nodes"
            referencedColumns: ["id"]
          },
        ]
      }
      household_tasks: {
        Row: {
          assigned_to: string | null
          created_at: string
          created_by: string
          done: boolean
          done_at: string | null
          done_by: string | null
          due_date: string | null
          family_id: string
          id: string
          priority: string
          title: string
        }
        Insert: {
          assigned_to?: string | null
          created_at?: string
          created_by: string
          done?: boolean
          done_at?: string | null
          done_by?: string | null
          due_date?: string | null
          family_id: string
          id?: string
          priority?: string
          title: string
        }
        Update: {
          assigned_to?: string | null
          created_at?: string
          created_by?: string
          done?: boolean
          done_at?: string | null
          done_by?: string | null
          due_date?: string | null
          family_id?: string
          id?: string
          priority?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "household_tasks_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          audio_url: string | null
          content: string | null
          created_at: string
          family_id: string
          id: string
          read_at: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          content?: string | null
          created_at?: string
          family_id: string
          id?: string
          read_at?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          content?: string | null
          created_at?: string
          family_id?: string
          id?: string
          read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      moment_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          moment_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          moment_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          moment_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moment_reactions_moment_id_fkey"
            columns: ["moment_id"]
            isOneToOne: false
            referencedRelation: "moments"
            referencedColumns: ["id"]
          },
        ]
      }
      moments: {
        Row: {
          audio_url: string | null
          capsule_id: string
          content: string | null
          created_at: string
          family_id: string
          id: string
          image_url: string | null
          user_id: string
        }
        Insert: {
          audio_url?: string | null
          capsule_id: string
          content?: string | null
          created_at?: string
          family_id: string
          id?: string
          image_url?: string | null
          user_id: string
        }
        Update: {
          audio_url?: string | null
          capsule_id?: string
          content?: string | null
          created_at?: string
          family_id?: string
          id?: string
          image_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "moments_capsule_id_fkey"
            columns: ["capsule_id"]
            isOneToOne: false
            referencedRelation: "daily_capsules"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "moments_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          body: string | null
          created_at: string
          family_id: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          family_id: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          family_id?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          active_family_id: string | null
          avatar_url: string | null
          created_at: string
          display_name: string
          family_id: string | null
          id: string
          notifications_enabled: boolean
          reminder_time: string | null
          updated_at: string
        }
        Insert: {
          active_family_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name: string
          family_id?: string | null
          id: string
          notifications_enabled?: boolean
          reminder_time?: string | null
          updated_at?: string
        }
        Update: {
          active_family_id?: string | null
          avatar_url?: string | null
          created_at?: string
          display_name?: string
          family_id?: string | null
          id?: string
          notifications_enabled?: boolean
          reminder_time?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_active_family_id_fkey"
            columns: ["active_family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      streaks: {
        Row: {
          current_streak: number
          family_id: string
          last_active_date: string | null
          longest_streak: number
          updated_at: string
          xp_total: number
        }
        Insert: {
          current_streak?: number
          family_id: string
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          xp_total?: number
        }
        Update: {
          current_streak?: number
          family_id?: string
          last_active_date?: string | null
          longest_streak?: number
          updated_at?: string
          xp_total?: number
        }
        Relationships: [
          {
            foreignKeyName: "streaks_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: true
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string
          family_id: string
          id: string
          role: Database["public"]["Enums"]["family_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          family_id: string
          id?: string
          role: Database["public"]["Enums"]["family_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          family_id?: string
          id?: string
          role?: Database["public"]["Enums"]["family_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      weekly_goals: {
        Row: {
          completed_by_creator: boolean
          completed_by_partner: boolean
          created_at: string
          created_by: string
          description: string | null
          family_id: string
          id: string
          progress_creator: number
          progress_partner: number
          target_count: number
          title: string
          updated_at: string
          week_start: string
        }
        Insert: {
          completed_by_creator?: boolean
          completed_by_partner?: boolean
          created_at?: string
          created_by: string
          description?: string | null
          family_id: string
          id?: string
          progress_creator?: number
          progress_partner?: number
          target_count?: number
          title: string
          updated_at?: string
          week_start: string
        }
        Update: {
          completed_by_creator?: boolean
          completed_by_partner?: boolean
          created_at?: string
          created_by?: string
          description?: string | null
          family_id?: string
          id?: string
          progress_creator?: number
          progress_partner?: number
          target_count?: number
          title?: string
          updated_at?: string
          week_start?: string
        }
        Relationships: [
          {
            foreignKeyName: "weekly_goals_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
      yearly_memories: {
        Row: {
          family_id: string
          generated_at: string
          highlights: Json
          id: string
          year: number
        }
        Insert: {
          family_id: string
          generated_at?: string
          highlights?: Json
          id?: string
          year: number
        }
        Update: {
          family_id?: string
          generated_at?: string
          highlights?: Json
          id?: string
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "yearly_memories_family_id_fkey"
            columns: ["family_id"]
            isOneToOne: false
            referencedRelation: "families"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      both_answered: { Args: { _capsule_id: string }; Returns: boolean }
      generate_invite_code: { Args: never; Returns: string }
      get_user_family_id: { Args: { _user_id: string }; Returns: string }
      is_family_member: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
      is_member_of: {
        Args: { _family_id: string; _user_id: string }
        Returns: boolean
      }
    }
    Enums: {
      family_role:
        | "parent"
        | "child"
        | "mother"
        | "father"
        | "sibling"
        | "grandparent"
        | "other"
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
      family_role: [
        "parent",
        "child",
        "mother",
        "father",
        "sibling",
        "grandparent",
        "other",
      ],
    },
  },
} as const
