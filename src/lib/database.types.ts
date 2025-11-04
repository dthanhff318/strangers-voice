export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      recordings: {
        Row: {
          id: string;
          created_at: string;
          user_id: string | null;
          file_url: string;
          duration: number;
          likes_count: number;
          dislikes_count: number;
          title: string | null;
          description: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          user_id?: string | null;
          file_url: string;
          duration: number;
          likes_count?: number;
          dislikes_count?: number;
          title?: string | null;
          description?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          user_id?: string | null;
          file_url?: string;
          duration?: number;
          likes_count?: number;
          dislikes_count?: number;
          title?: string | null;
          description?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "recordings_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      likes: {
        Row: {
          id: string;
          created_at: string;
          recording_id: string;
          user_id: string | null;
          is_like: boolean;
        };
        Insert: {
          id?: string;
          created_at?: string;
          recording_id: string;
          user_id?: string | null;
          is_like: boolean;
        };
        Update: {
          id?: string;
          created_at?: string;
          recording_id?: string;
          user_id?: string | null;
          is_like?: boolean;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          created_at: string;
          email: string | null;
          full_name: string | null;
          avatar_url: string | null;
        };
        Insert: {
          id: string;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          email?: string | null;
          full_name?: string | null;
          avatar_url?: string | null;
        };
        Relationships: [];
      };
      reports: {
        Row: {
          id: string;
          created_at: string;
          recording_id: string;
          user_id: string;
          reasons: string[];
          additional_info: string | null;
          status: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          recording_id: string;
          user_id: string;
          reasons: string[];
          additional_info?: string | null;
          status?: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          recording_id?: string;
          user_id?: string;
          reasons?: string[];
          additional_info?: string | null;
          status?: string;
        };
        Relationships: [
          {
            foreignKeyName: "reports_recording_id_fkey";
            columns: ["recording_id"];
            isOneToOne: false;
            referencedRelation: "recordings";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "reports_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      live_rooms: {
        Row: {
          id: string;
          created_at: string;
          updated_at: string;
          host_id: string;
          title: string;
          description: string | null;
          is_active: boolean;
          listeners_count: number;
          ended_at: string | null;
        };
        Insert: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          host_id: string;
          title: string;
          description?: string | null;
          is_active?: boolean;
          listeners_count?: number;
          ended_at?: string | null;
        };
        Update: {
          id?: string;
          created_at?: string;
          updated_at?: string;
          host_id?: string;
          title?: string;
          description?: string | null;
          is_active?: boolean;
          listeners_count?: number;
          ended_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "live_rooms_host_id_fkey";
            columns: ["host_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
      live_chat_messages: {
        Row: {
          id: string;
          created_at: string;
          room_id: string;
          user_id: string;
          message: string;
        };
        Insert: {
          id?: string;
          created_at?: string;
          room_id: string;
          user_id: string;
          message: string;
        };
        Update: {
          id?: string;
          created_at?: string;
          room_id?: string;
          user_id?: string;
          message?: string;
        };
        Relationships: [
          {
            foreignKeyName: "live_chat_messages_room_id_fkey";
            columns: ["room_id"];
            isOneToOne: false;
            referencedRelation: "live_rooms";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "live_chat_messages_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      increment_listeners: {
        Args: {
          room_id: string;
        };
        Returns: void;
      };
      decrement_listeners: {
        Args: {
          room_id: string;
        };
        Returns: void;
      };
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
}
