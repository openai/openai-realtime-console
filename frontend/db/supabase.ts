export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      conversations: {
        Row: {
          chat_group_id: string | null
          content: string
          conversation_id: string
          created_at: string
          emotion_model: string | null
          is_sensitive: boolean | null
          metadata: Json | null
          personalities_translation_id: string | null
          role: string
          user_id: string
        }
        Insert: {
          chat_group_id?: string | null
          content: string
          conversation_id?: string
          created_at?: string
          emotion_model?: string | null
          is_sensitive?: boolean | null
          metadata?: Json | null
          personalities_translation_id?: string | null
          role: string
          user_id?: string
        }
        Update: {
          chat_group_id?: string | null
          content?: string
          conversation_id?: string
          created_at?: string
          emotion_model?: string | null
          is_sensitive?: boolean | null
          metadata?: Json | null
          personalities_translation_id?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversations_personalities_translation_id_fkey"
            columns: ["personalities_translation_id"]
            isOneToOne: false
            referencedRelation: "personalities_translations"
            referencedColumns: ["personalities_translation_id"]
          },
          {
            foreignKeyName: "conversations_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      devices: {
        Row: {
          created_at: string
          device_id: string
          mac_address: string | null
          user_code: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          device_id?: string
          mac_address?: string | null
          user_code: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          device_id?: string
          mac_address?: string | null
          user_code?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "devices_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      inbound: {
        Row: {
          created_at: string
          email: string | null
          inbound_id: string
          name: string | null
          type: string | null
        }
        Insert: {
          created_at?: string
          email?: string | null
          inbound_id?: string
          name?: string | null
          type?: string | null
        }
        Update: {
          created_at?: string
          email?: string | null
          inbound_id?: string
          name?: string | null
          type?: string | null
        }
        Relationships: []
      }
      insights: {
        Row: {
          created_at: string
          date: string
          insight_id: string
          metadata: Json
          user_id: string
        }
        Insert: {
          created_at?: string
          date: string
          insight_id?: string
          metadata: Json
          user_id?: string
        }
        Update: {
          created_at?: string
          date?: string
          insight_id?: string
          metadata?: Json
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "insights_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["user_id"]
          },
        ]
      }
      languages: {
        Row: {
          code: string
          created_at: string
          flag: string
          language_id: string
          name: string
        }
        Insert: {
          code: string
          created_at?: string
          flag: string
          language_id?: string
          name: string
        }
        Update: {
          code?: string
          created_at?: string
          flag?: string
          language_id?: string
          name?: string
        }
        Relationships: []
      }
      personalities: {
        Row: {
          created_at: string
          is_doctor: boolean
          key: string
          personality_id: string
        }
        Insert: {
          created_at?: string
          is_doctor?: boolean
          key?: string
          personality_id?: string
        }
        Update: {
          created_at?: string
          is_doctor?: boolean
          key?: string
          personality_id?: string
        }
        Relationships: []
      }
      personalities_translations: {
        Row: {
          created_at: string
          language_code: string
          personalities_translation_id: string
          personality_key: string
          subtitle: string
          title: string
          trait: string
          trait_short_description: string
          voice_name: string
        }
        Insert: {
          created_at?: string
          language_code: string
          personalities_translation_id?: string
          personality_key: string
          subtitle: string
          title: string
          trait: string
          trait_short_description: string
          voice_name: string
        }
        Update: {
          created_at?: string
          language_code?: string
          personalities_translation_id?: string
          personality_key?: string
          subtitle?: string
          title?: string
          trait?: string
          trait_short_description?: string
          voice_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "personalities_translations_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "personalities_translations_personality_key_fkey"
            columns: ["personality_key"]
            isOneToOne: false
            referencedRelation: "personalities"
            referencedColumns: ["key"]
          },
          {
            foreignKeyName: "personalities_translations_voice_name_fkey"
            columns: ["voice_name"]
            isOneToOne: false
            referencedRelation: "toys"
            referencedColumns: ["name"]
          },
        ]
      }
      toys: {
        Row: {
          created_at: string
          image_src: string
          name: string
          prompt: string
          third_person_prompt: string
          toy_id: string
          tts_code: string
          tts_language_code: string | null
          tts_model: Database["public"]["Enums"]["tts_model_enum"] | null
        }
        Insert: {
          created_at?: string
          image_src?: string
          name: string
          prompt: string
          third_person_prompt?: string
          toy_id?: string
          tts_code?: string
          tts_language_code?: string | null
          tts_model?: Database["public"]["Enums"]["tts_model_enum"] | null
        }
        Update: {
          created_at?: string
          image_src?: string
          name?: string
          prompt?: string
          third_person_prompt?: string
          toy_id?: string
          tts_code?: string
          tts_language_code?: string | null
          tts_model?: Database["public"]["Enums"]["tts_model_enum"] | null
        }
        Relationships: [
          {
            foreignKeyName: "toys_language_code_fkey"
            columns: ["tts_language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string
          created_at: string
          email: string
          is_premium: boolean
          language_code: string
          modules: string[] | null
          most_recent_chat_group_id: string | null
          personality_id: string
          session_time: number
          supervisee_age: number
          supervisee_name: string
          supervisee_persona: string
          supervisor_name: string
          toy_name: string | null
          user_id: string
          user_info: Json
          volume_control: number
        }
        Insert: {
          avatar_url?: string
          created_at?: string
          email?: string
          is_premium?: boolean
          language_code?: string
          modules?: string[] | null
          most_recent_chat_group_id?: string | null
          personality_id?: string
          session_time?: number
          supervisee_age?: number
          supervisee_name: string
          supervisee_persona?: string
          supervisor_name: string
          toy_name?: string | null
          user_id?: string
          user_info?: Json
          volume_control?: number
        }
        Update: {
          avatar_url?: string
          created_at?: string
          email?: string
          is_premium?: boolean
          language_code?: string
          modules?: string[] | null
          most_recent_chat_group_id?: string | null
          personality_id?: string
          session_time?: number
          supervisee_age?: number
          supervisee_name?: string
          supervisee_persona?: string
          supervisor_name?: string
          toy_name?: string | null
          user_id?: string
          user_info?: Json
          volume_control?: number
        }
        Relationships: [
          {
            foreignKeyName: "users_language_code_fkey"
            columns: ["language_code"]
            isOneToOne: false
            referencedRelation: "languages"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "users_personality_id_fkey"
            columns: ["personality_id"]
            isOneToOne: false
            referencedRelation: "personalities"
            referencedColumns: ["personality_id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      binary_quantize:
        | {
            Args: {
              "": string
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      halfvec_avg: {
        Args: {
          "": number[]
        }
        Returns: unknown
      }
      halfvec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      halfvec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      halfvec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      hnsw_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnsw_sparsevec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      hnswhandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_bit_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflat_halfvec_support: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      ivfflathandler: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      l2_norm:
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      l2_normalize:
        | {
            Args: {
              "": string
            }
            Returns: string
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
        | {
            Args: {
              "": unknown
            }
            Returns: unknown
          }
      match_documents: {
        Args: {
          query_embedding: string
          match_count?: number
          filter?: Json
        }
        Returns: {
          id: string
          content: string
          metadata: Json
          embedding: string
          similarity: number
        }[]
      }
      sparsevec_out: {
        Args: {
          "": unknown
        }
        Returns: unknown
      }
      sparsevec_send: {
        Args: {
          "": unknown
        }
        Returns: string
      }
      sparsevec_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
      vector_avg: {
        Args: {
          "": number[]
        }
        Returns: string
      }
      vector_dims:
        | {
            Args: {
              "": string
            }
            Returns: number
          }
        | {
            Args: {
              "": unknown
            }
            Returns: number
          }
      vector_norm: {
        Args: {
          "": string
        }
        Returns: number
      }
      vector_out: {
        Args: {
          "": string
        }
        Returns: unknown
      }
      vector_send: {
        Args: {
          "": string
        }
        Returns: string
      }
      vector_typmod_in: {
        Args: {
          "": unknown[]
        }
        Returns: number
      }
    }
    Enums: {
      tts_model_enum: "FISH" | "AZURE"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
