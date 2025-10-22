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
      recordings: {
        Row: {
          id: string
          created_at: string
          user_id: string | null
          file_url: string
          duration: number
          likes_count: number
          dislikes_count: number
          title: string | null
          description: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          user_id?: string | null
          file_url: string
          duration: number
          likes_count?: number
          dislikes_count?: number
          title?: string | null
          description?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          user_id?: string | null
          file_url?: string
          duration?: number
          likes_count?: number
          dislikes_count?: number
          title?: string | null
          description?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recordings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
      likes: {
        Row: {
          id: string
          created_at: string
          recording_id: string
          user_id: string | null
          is_like: boolean
        }
        Insert: {
          id?: string
          created_at?: string
          recording_id: string
          user_id?: string | null
          is_like: boolean
        }
        Update: {
          id?: string
          created_at?: string
          recording_id?: string
          user_id?: string | null
          is_like?: boolean
        }
        Relationships: []
      }
      profiles: {
        Row: {
          id: string
          created_at: string
          email: string | null
          full_name: string | null
          avatar_url: string | null
        }
        Insert: {
          id: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          email?: string | null
          full_name?: string | null
          avatar_url?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          id: string
          created_at: string
          recording_id: string
          user_id: string
          reasons: string[]
          additional_info: string | null
          status: string
        }
        Insert: {
          id?: string
          created_at?: string
          recording_id: string
          user_id: string
          reasons: string[]
          additional_info?: string | null
          status?: string
        }
        Update: {
          id?: string
          created_at?: string
          recording_id?: string
          user_id?: string
          reasons?: string[]
          additional_info?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "reports_recording_id_fkey"
            columns: ["recording_id"]
            isOneToOne: false
            referencedRelation: "recordings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          }
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
