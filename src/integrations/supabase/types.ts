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
      coupons: {
        Row: {
          active: boolean
          code: string
          created_at: string
          discount_type: string
          discount_value: number
          expires_at: string | null
          id: string
          min_order: number
          updated_at: string
          usage_limit: number
          used_count: number
        }
        Insert: {
          active?: boolean
          code: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          min_order?: number
          updated_at?: string
          usage_limit?: number
          used_count?: number
        }
        Update: {
          active?: boolean
          code?: string
          created_at?: string
          discount_type?: string
          discount_value?: number
          expires_at?: string | null
          id?: string
          min_order?: number
          updated_at?: string
          usage_limit?: number
          used_count?: number
        }
        Relationships: []
      }
      incomplete_orders: {
        Row: {
          color: string
          converted: boolean
          created_at: string
          district: string
          full_name: string
          id: string
          phone: string
          product_id: string | null
          product_title: string
          quantity: number
          total: number
        }
        Insert: {
          color?: string
          converted?: boolean
          created_at?: string
          district?: string
          full_name?: string
          id?: string
          phone?: string
          product_id?: string | null
          product_title?: string
          quantity?: number
          total?: number
        }
        Update: {
          color?: string
          converted?: boolean
          created_at?: string
          district?: string
          full_name?: string
          id?: string
          phone?: string
          product_id?: string | null
          product_title?: string
          quantity?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "incomplete_orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      meta_settings: {
        Row: {
          access_token: string
          id: number
          pixel_id: string
          test_event_code: string
          updated_at: string
        }
        Insert: {
          access_token?: string
          id?: number
          pixel_id?: string
          test_event_code?: string
          updated_at?: string
        }
        Update: {
          access_token?: string
          id?: number
          pixel_id?: string
          test_event_code?: string
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          address: string
          color: string | null
          color_image_url: string
          created_at: string
          delivery_fee: number
          district: string
          full_name: string
          id: string
          meta_feedback_event: string
          order_number: number | null
          payment_method: string
          phone: string
          product_id: string | null
          product_title: string
          quantity: number
          size: string | null
          status: string
          thana: string
          total: number
          unit_price: number
        }
        Insert: {
          address: string
          color?: string | null
          color_image_url?: string
          created_at?: string
          delivery_fee?: number
          district: string
          full_name: string
          id?: string
          meta_feedback_event?: string
          order_number?: number | null
          payment_method?: string
          phone: string
          product_id?: string | null
          product_title: string
          quantity?: number
          size?: string | null
          status?: string
          thana: string
          total?: number
          unit_price?: number
        }
        Update: {
          address?: string
          color?: string | null
          color_image_url?: string
          created_at?: string
          delivery_fee?: number
          district?: string
          full_name?: string
          id?: string
          meta_feedback_event?: string
          order_number?: number | null
          payment_method?: string
          phone?: string
          product_id?: string | null
          product_title?: string
          quantity?: number
          size?: string | null
          status?: string
          thana?: string
          total?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category: string
          color_variants: Json
          created_at: string
          description: string
          id: string
          image_url: string
          offer_note: string
          price: number
          rating: number
          reviews: number
          slug: string
          sort_order: number
          stock: number
          tag: string | null
          title: string
          updated_at: string
          video_url: string
        }
        Insert: {
          category?: string
          color_variants?: Json
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          offer_note?: string
          price?: number
          rating?: number
          reviews?: number
          slug: string
          sort_order?: number
          stock?: number
          tag?: string | null
          title: string
          updated_at?: string
          video_url?: string
        }
        Update: {
          category?: string
          color_variants?: Json
          created_at?: string
          description?: string
          id?: string
          image_url?: string
          offer_note?: string
          price?: number
          rating?: number
          reviews?: number
          slug?: string
          sort_order?: number
          stock?: number
          tag?: string | null
          title?: string
          updated_at?: string
          video_url?: string
        }
        Relationships: []
      }
      reviews: {
        Row: {
          approved: boolean
          author: string
          comment: string
          created_at: string
          id: string
          product_id: string | null
          rating: number
          updated_at: string
        }
        Insert: {
          approved?: boolean
          author?: string
          comment?: string
          created_at?: string
          id?: string
          product_id?: string | null
          rating?: number
          updated_at?: string
        }
        Update: {
          approved?: boolean
          author?: string
          comment?: string
          created_at?: string
          id?: string
          product_id?: string | null
          rating?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_settings: {
        Row: {
          key: string
          updated_at: string
          value: string
        }
        Insert: {
          key: string
          updated_at?: string
          value?: string
        }
        Update: {
          key?: string
          updated_at?: string
          value?: string
        }
        Relationships: []
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
      slugify: { Args: { _txt: string }; Returns: string }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
