// Supabase database types (auto-generated structure)
// This provides type safety for Supabase queries

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      messages: {
        Row: {
          id: string
          created_at: string
          sender_role: 'doctor' | 'patient'
          original_content: string
          translated_content: string | null
          audio_url: string | null
          language: string
          metadata: Json
        }
        Insert: {
          id?: string
          created_at?: string
          sender_role: 'doctor' | 'patient'
          original_content: string
          translated_content?: string | null
          audio_url?: string | null
          language: string
          metadata?: Json
        }
        Update: {
          id?: string
          created_at?: string
          sender_role?: 'doctor' | 'patient'
          original_content?: string
          translated_content?: string | null
          audio_url?: string | null
          language?: string
          metadata?: Json
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_recent_messages: {
        Args: { message_limit: number }
        Returns: Database['public']['Tables']['messages']['Row'][]
      }
      search_messages: {
        Args: { search_query: string }
        Returns: Database['public']['Tables']['messages']['Row'][]
      }
    }
    Enums: {
      [_ in never]: never
    }
  }
}
