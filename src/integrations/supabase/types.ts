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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      competitor_data: {
        Row: {
          competitor_name: string
          created_at: string | null
          id: string
          market_share_percent: number | null
          notes: string | null
          observation_date: string
          pricing_index: number | null
          product_category: string
          promotion_intensity: string | null
        }
        Insert: {
          competitor_name: string
          created_at?: string | null
          id?: string
          market_share_percent?: number | null
          notes?: string | null
          observation_date: string
          pricing_index?: number | null
          product_category: string
          promotion_intensity?: string | null
        }
        Update: {
          competitor_name?: string
          created_at?: string | null
          id?: string
          market_share_percent?: number | null
          notes?: string | null
          observation_date?: string
          pricing_index?: number | null
          product_category?: string
          promotion_intensity?: string | null
        }
        Relationships: []
      }
      customer_journey: {
        Row: {
          action_taken: string | null
          channel: string | null
          converted: boolean | null
          created_at: string | null
          customer_id: string | null
          id: string
          promotion_id: string | null
          touchpoint_date: string
          touchpoint_type: string
        }
        Insert: {
          action_taken?: string | null
          channel?: string | null
          converted?: boolean | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          promotion_id?: string | null
          touchpoint_date: string
          touchpoint_type: string
        }
        Update: {
          action_taken?: string | null
          channel?: string | null
          converted?: boolean | null
          created_at?: string | null
          customer_id?: string | null
          id?: string
          promotion_id?: string | null
          touchpoint_date?: string
          touchpoint_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "customer_journey_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customer_journey_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          created_at: string | null
          customer_code: string
          customer_name: string | null
          email: string | null
          id: string
          loyalty_tier: string | null
          phone: string | null
          segment: string | null
          total_lifetime_value: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          customer_code: string
          customer_name?: string | null
          email?: string | null
          id?: string
          loyalty_tier?: string | null
          phone?: string | null
          segment?: string | null
          total_lifetime_value?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          customer_code?: string
          customer_name?: string | null
          email?: string | null
          id?: string
          loyalty_tier?: string | null
          phone?: string | null
          segment?: string | null
          total_lifetime_value?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      inventory_levels: {
        Row: {
          created_at: string | null
          id: string
          last_restocked: string | null
          product_sku: string
          reorder_point: number | null
          stock_level: number
          stockout_risk: string | null
          store_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          last_restocked?: string | null
          product_sku: string
          reorder_point?: number | null
          stock_level: number
          stockout_risk?: string | null
          store_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          last_restocked?: string | null
          product_sku?: string
          reorder_point?: number | null
          stock_level?: number
          stockout_risk?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inventory_levels_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      marketing_channels: {
        Row: {
          channel_name: string
          channel_type: string
          clicks: number | null
          conversions: number | null
          created_at: string | null
          engagement_rate: number | null
          id: string
          impressions: number | null
          promotion_id: string | null
          reach: number | null
          spend_amount: number
        }
        Insert: {
          channel_name: string
          channel_type: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          promotion_id?: string | null
          reach?: number | null
          spend_amount: number
        }
        Update: {
          channel_name?: string
          channel_type?: string
          clicks?: number | null
          conversions?: number | null
          created_at?: string | null
          engagement_rate?: number | null
          id?: string
          impressions?: number | null
          promotion_id?: string | null
          reach?: number | null
          spend_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "marketing_channels_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          base_price: number
          brand: string | null
          category: string
          cost: number
          created_at: string | null
          id: string
          margin_percent: number | null
          price_elasticity: number | null
          product_name: string
          product_sku: string
          seasonality_factor: string | null
          subcategory: string | null
          updated_at: string | null
        }
        Insert: {
          base_price: number
          brand?: string | null
          category: string
          cost: number
          created_at?: string | null
          id?: string
          margin_percent?: number | null
          price_elasticity?: number | null
          product_name: string
          product_sku: string
          seasonality_factor?: string | null
          subcategory?: string | null
          updated_at?: string | null
        }
        Update: {
          base_price?: number
          brand?: string | null
          category?: string
          cost?: number
          created_at?: string | null
          id?: string
          margin_percent?: number | null
          price_elasticity?: number | null
          product_name?: string
          product_sku?: string
          seasonality_factor?: string | null
          subcategory?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          created_at: string | null
          discount_amount: number | null
          discount_percent: number | null
          end_date: string
          id: string
          product_category: string | null
          product_sku: string | null
          promotion_name: string
          promotion_type: string
          start_date: string
          status: string | null
          total_spend: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          end_date: string
          id?: string
          product_category?: string | null
          product_sku?: string | null
          promotion_name: string
          promotion_type: string
          start_date: string
          status?: string | null
          total_spend?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          end_date?: string
          id?: string
          product_category?: string | null
          product_sku?: string | null
          promotion_name?: string
          promotion_type?: string
          start_date?: string
          status?: string | null
          total_spend?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      question_cache: {
        Row: {
          created_at: string
          expires_at: string
          hit_count: number | null
          id: string
          persona: string
          question: string
          question_hash: string
          response: Json
          updated_at: string
        }
        Insert: {
          created_at?: string
          expires_at?: string
          hit_count?: number | null
          id?: string
          persona: string
          question: string
          question_hash: string
          response: Json
          updated_at?: string
        }
        Update: {
          created_at?: string
          expires_at?: string
          hit_count?: number | null
          id?: string
          persona?: string
          question?: string
          question_hash?: string
          response?: Json
          updated_at?: string
        }
        Relationships: []
      }
      store_performance: {
        Row: {
          avg_basket_size: number | null
          conversion_rate: number | null
          created_at: string | null
          foot_traffic: number | null
          id: string
          metric_date: string
          staff_count: number | null
          store_id: string | null
          total_sales: number | null
          weather_condition: string | null
        }
        Insert: {
          avg_basket_size?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          foot_traffic?: number | null
          id?: string
          metric_date: string
          staff_count?: number | null
          store_id?: string | null
          total_sales?: number | null
          weather_condition?: string | null
        }
        Update: {
          avg_basket_size?: number | null
          conversion_rate?: number | null
          created_at?: string | null
          foot_traffic?: number | null
          id?: string
          metric_date?: string
          staff_count?: number | null
          store_id?: string | null
          total_sales?: number | null
          weather_condition?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_performance_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          created_at: string | null
          id: string
          location: string | null
          region: string | null
          store_code: string
          store_name: string
          store_type: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          location?: string | null
          region?: string | null
          store_code: string
          store_name: string
          store_type?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          location?: string | null
          region?: string | null
          store_code?: string
          store_name?: string
          store_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      third_party_data: {
        Row: {
          created_at: string | null
          data_date: string
          data_source: string
          data_type: string
          id: string
          metadata: Json | null
          metric_name: string
          metric_value: number | null
          product_category: string | null
        }
        Insert: {
          created_at?: string | null
          data_date: string
          data_source: string
          data_type: string
          id?: string
          metadata?: Json | null
          metric_name: string
          metric_value?: number | null
          product_category?: string | null
        }
        Update: {
          created_at?: string | null
          data_date?: string
          data_source?: string
          data_type?: string
          id?: string
          metadata?: Json | null
          metric_name?: string
          metric_value?: number | null
          product_category?: string | null
        }
        Relationships: []
      }
      transactions: {
        Row: {
          created_at: string | null
          customer_id: string | null
          discount_amount: number | null
          id: string
          product_name: string | null
          product_sku: string
          promotion_id: string | null
          quantity: number
          store_id: string | null
          total_amount: number
          transaction_date: string
          unit_price: number
        }
        Insert: {
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          product_name?: string | null
          product_sku: string
          promotion_id?: string | null
          quantity: number
          store_id?: string | null
          total_amount: number
          transaction_date: string
          unit_price: number
        }
        Update: {
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          product_name?: string | null
          product_sku?: string
          promotion_id?: string | null
          quantity?: number
          store_id?: string | null
          total_amount?: number
          transaction_date?: string
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_promotion_id_fkey"
            columns: ["promotion_id"]
            isOneToOne: false
            referencedRelation: "promotions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
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
    Enums: {},
  },
} as const
