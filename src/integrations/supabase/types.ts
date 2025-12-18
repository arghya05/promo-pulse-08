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
      competitor_prices: {
        Row: {
          competitor_name: string
          competitor_price: number
          created_at: string
          id: string
          observation_date: string
          our_price: number
          price_gap_percent: number | null
          product_sku: string
          source: string | null
        }
        Insert: {
          competitor_name: string
          competitor_price: number
          created_at?: string
          id?: string
          observation_date: string
          our_price: number
          price_gap_percent?: number | null
          product_sku: string
          source?: string | null
        }
        Update: {
          competitor_name?: string
          competitor_price?: number
          created_at?: string
          id?: string
          observation_date?: string
          our_price?: number
          price_gap_percent?: number | null
          product_sku?: string
          source?: string | null
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
          age_band: string | null
          created_at: string | null
          customer_city: string | null
          customer_code: string
          customer_country: string | null
          customer_group: string | null
          customer_name: string | null
          customer_region: string | null
          customer_sector: string | null
          email: string | null
          gender: string | null
          id: string
          income_band: string | null
          loyalty_tier: string | null
          marital_status: string | null
          member_type: string | null
          phone: string | null
          segment: string | null
          total_lifetime_value: number | null
          updated_at: string | null
        }
        Insert: {
          age_band?: string | null
          created_at?: string | null
          customer_city?: string | null
          customer_code: string
          customer_country?: string | null
          customer_group?: string | null
          customer_name?: string | null
          customer_region?: string | null
          customer_sector?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          income_band?: string | null
          loyalty_tier?: string | null
          marital_status?: string | null
          member_type?: string | null
          phone?: string | null
          segment?: string | null
          total_lifetime_value?: number | null
          updated_at?: string | null
        }
        Update: {
          age_band?: string | null
          created_at?: string | null
          customer_city?: string | null
          customer_code?: string
          customer_country?: string | null
          customer_group?: string | null
          customer_name?: string | null
          customer_region?: string | null
          customer_sector?: string | null
          email?: string | null
          gender?: string | null
          id?: string
          income_band?: string | null
          loyalty_tier?: string | null
          marital_status?: string | null
          member_type?: string | null
          phone?: string | null
          segment?: string | null
          total_lifetime_value?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      demand_forecasts: {
        Row: {
          actual_units: number | null
          confidence_interval_high: number | null
          confidence_interval_low: number | null
          created_at: string
          forecast_accuracy: number | null
          forecast_date: string
          forecast_model: string | null
          forecast_period_end: string
          forecast_period_start: string
          forecasted_units: number
          id: string
          product_sku: string
          store_id: string | null
        }
        Insert: {
          actual_units?: number | null
          confidence_interval_high?: number | null
          confidence_interval_low?: number | null
          created_at?: string
          forecast_accuracy?: number | null
          forecast_date: string
          forecast_model?: string | null
          forecast_period_end: string
          forecast_period_start: string
          forecasted_units: number
          id?: string
          product_sku: string
          store_id?: string | null
        }
        Update: {
          actual_units?: number | null
          confidence_interval_high?: number | null
          confidence_interval_low?: number | null
          created_at?: string
          forecast_accuracy?: number | null
          forecast_date?: string
          forecast_model?: string | null
          forecast_period_end?: string
          forecast_period_start?: string
          forecasted_units?: number
          id?: string
          product_sku?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "demand_forecasts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      discounts: {
        Row: {
          applicable_categories: string[] | null
          applicable_skus: string[] | null
          created_at: string
          discount_code: string
          discount_name: string
          discount_percent: number | null
          discount_type: string
          discount_value: number
          end_date: string
          id: string
          max_discount_amount: number | null
          min_purchase_amount: number | null
          start_date: string
          status: string | null
          usage_count: number | null
        }
        Insert: {
          applicable_categories?: string[] | null
          applicable_skus?: string[] | null
          created_at?: string
          discount_code: string
          discount_name: string
          discount_percent?: number | null
          discount_type: string
          discount_value: number
          end_date: string
          id?: string
          max_discount_amount?: number | null
          min_purchase_amount?: number | null
          start_date: string
          status?: string | null
          usage_count?: number | null
        }
        Update: {
          applicable_categories?: string[] | null
          applicable_skus?: string[] | null
          created_at?: string
          discount_code?: string
          discount_name?: string
          discount_percent?: number | null
          discount_type?: string
          discount_value?: number
          end_date?: string
          id?: string
          max_discount_amount?: number | null
          min_purchase_amount?: number | null
          start_date?: string
          status?: string | null
          usage_count?: number | null
        }
        Relationships: []
      }
      employees: {
        Row: {
          created_at: string
          department: string | null
          employee_code: string
          employee_name: string
          employee_type: string
          hire_date: string | null
          hourly_rate: number | null
          id: string
          sales_target: number | null
          status: string | null
          store_id: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          department?: string | null
          employee_code: string
          employee_name: string
          employee_type: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          sales_target?: number | null
          status?: string | null
          store_id?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          department?: string | null
          employee_code?: string
          employee_name?: string
          employee_type?: string
          hire_date?: string | null
          hourly_rate?: number | null
          id?: string
          sales_target?: number | null
          status?: string | null
          store_id?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "employees_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      fixtures: {
        Row: {
          aisle_number: number | null
          assigned_category: string | null
          capacity_sqft: number | null
          created_at: string
          depth_inches: number
          fixture_code: string
          fixture_type: string
          height_inches: number
          id: string
          installed_date: string | null
          location_in_store: string | null
          status: string | null
          store_id: string | null
          width_inches: number
        }
        Insert: {
          aisle_number?: number | null
          assigned_category?: string | null
          capacity_sqft?: number | null
          created_at?: string
          depth_inches: number
          fixture_code: string
          fixture_type: string
          height_inches: number
          id?: string
          installed_date?: string | null
          location_in_store?: string | null
          status?: string | null
          store_id?: string | null
          width_inches: number
        }
        Update: {
          aisle_number?: number | null
          assigned_category?: string | null
          capacity_sqft?: number | null
          created_at?: string
          depth_inches?: number
          fixture_code?: string
          fixture_type?: string
          height_inches?: number
          id?: string
          installed_date?: string | null
          location_in_store?: string | null
          status?: string | null
          store_id?: string | null
          width_inches?: number
        }
        Relationships: [
          {
            foreignKeyName: "fixtures_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      forecast_accuracy_tracking: {
        Row: {
          bias: number | null
          category: string | null
          created_at: string
          forecast_model: string | null
          id: string
          mape: number
          notes: string | null
          rmse: number | null
          sample_size: number | null
          store_id: string | null
          tracking_date: string
        }
        Insert: {
          bias?: number | null
          category?: string | null
          created_at?: string
          forecast_model?: string | null
          id?: string
          mape: number
          notes?: string | null
          rmse?: number | null
          sample_size?: number | null
          store_id?: string | null
          tracking_date: string
        }
        Update: {
          bias?: number | null
          category?: string | null
          created_at?: string
          forecast_model?: string | null
          id?: string
          mape?: number
          notes?: string | null
          rmse?: number | null
          sample_size?: number | null
          store_id?: string | null
          tracking_date?: string
        }
        Relationships: [
          {
            foreignKeyName: "forecast_accuracy_tracking_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      holidays: {
        Row: {
          country: string | null
          created_at: string
          holiday_date: string
          holiday_name: string
          holiday_type: string | null
          id: string
        }
        Insert: {
          country?: string | null
          created_at?: string
          holiday_date: string
          holiday_name: string
          holiday_type?: string | null
          id?: string
        }
        Update: {
          country?: string | null
          created_at?: string
          holiday_date?: string
          holiday_name?: string
          holiday_type?: string | null
          id?: string
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
      invoices: {
        Row: {
          created_at: string
          customer_id: string | null
          discount_amount: number | null
          id: string
          invoice_date: string
          invoice_no: string
          order_id: string | null
          payment_method: string | null
          payment_status: string | null
          store_id: string | null
          subtotal: number
          tax_amount: number | null
          total_amount: number
          trx_type: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          invoice_date?: string
          invoice_no: string
          order_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          store_id?: string | null
          subtotal: number
          tax_amount?: number | null
          total_amount: number
          trx_type?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          discount_amount?: number | null
          id?: string
          invoice_date?: string
          invoice_no?: string
          order_id?: string | null
          payment_method?: string | null
          payment_status?: string | null
          store_id?: string | null
          subtotal?: number
          tax_amount?: number | null
          total_amount?: number
          trx_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "invoices_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "invoices_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      kpi_measures: {
        Row: {
          avg_basket_size: number | null
          avg_transaction_value: number | null
          category: string | null
          created_at: string
          discount_rate_pct: number | null
          gross_margin: number | null
          gross_margin_pct: number | null
          id: string
          inventory_turn: number | null
          margin_ly: number | null
          measure_date: string
          net_sales: number | null
          net_sales_ly: number | null
          product_sku: string | null
          return_rate_pct: number | null
          sell_through_rate: number | null
          stock_to_sales_ratio: number | null
          store_id: string | null
          transactions_count: number | null
          units_sold: number | null
          units_sold_ly: number | null
          yoy_margin_growth_pct: number | null
          yoy_net_sales_growth_pct: number | null
        }
        Insert: {
          avg_basket_size?: number | null
          avg_transaction_value?: number | null
          category?: string | null
          created_at?: string
          discount_rate_pct?: number | null
          gross_margin?: number | null
          gross_margin_pct?: number | null
          id?: string
          inventory_turn?: number | null
          margin_ly?: number | null
          measure_date: string
          net_sales?: number | null
          net_sales_ly?: number | null
          product_sku?: string | null
          return_rate_pct?: number | null
          sell_through_rate?: number | null
          stock_to_sales_ratio?: number | null
          store_id?: string | null
          transactions_count?: number | null
          units_sold?: number | null
          units_sold_ly?: number | null
          yoy_margin_growth_pct?: number | null
          yoy_net_sales_growth_pct?: number | null
        }
        Update: {
          avg_basket_size?: number | null
          avg_transaction_value?: number | null
          category?: string | null
          created_at?: string
          discount_rate_pct?: number | null
          gross_margin?: number | null
          gross_margin_pct?: number | null
          id?: string
          inventory_turn?: number | null
          margin_ly?: number | null
          measure_date?: string
          net_sales?: number | null
          net_sales_ly?: number | null
          product_sku?: string | null
          return_rate_pct?: number | null
          sell_through_rate?: number | null
          stock_to_sales_ratio?: number | null
          store_id?: string | null
          transactions_count?: number | null
          units_sold?: number | null
          units_sold_ly?: number | null
          yoy_margin_growth_pct?: number | null
          yoy_net_sales_growth_pct?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "kpi_measures_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      markdowns: {
        Row: {
          created_at: string
          effective_date: string
          end_date: string | null
          id: string
          markdown_code: string
          markdown_percent: number | null
          markdown_price: number
          markdown_reason: string
          markdown_type: string
          original_price: number
          product_sku: string
          status: string | null
          store_id: string | null
        }
        Insert: {
          created_at?: string
          effective_date: string
          end_date?: string | null
          id?: string
          markdown_code: string
          markdown_percent?: number | null
          markdown_price: number
          markdown_reason: string
          markdown_type: string
          original_price: number
          product_sku: string
          status?: string | null
          store_id?: string | null
        }
        Update: {
          created_at?: string
          effective_date?: string
          end_date?: string | null
          id?: string
          markdown_code?: string
          markdown_percent?: number | null
          markdown_price?: number
          markdown_reason?: string
          markdown_type?: string
          original_price?: number
          product_sku?: string
          status?: string | null
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "markdowns_store_id_fkey"
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
      order_items: {
        Row: {
          created_at: string
          discount_amount: number | null
          id: string
          order_id: string | null
          product_sku: string
          quantity: number
          tax_amount: number | null
          total_amount: number
          unit_price: number
        }
        Insert: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          order_id?: string | null
          product_sku: string
          quantity?: number
          tax_amount?: number | null
          total_amount: number
          unit_price: number
        }
        Update: {
          created_at?: string
          discount_amount?: number | null
          id?: string
          order_id?: string | null
          product_sku?: string
          quantity?: number
          tax_amount?: number | null
          total_amount?: number
          unit_price?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          cancel_reason: string | null
          close_reason: string | null
          created_at: string
          customer_id: string | null
          delivery_city: string | null
          delivery_country: string | null
          delivery_partner: string | null
          delivery_region: string | null
          delivery_type: string | null
          discount_amount: number | null
          id: string
          net_amount: number | null
          order_age_band: string | null
          order_age_days: number | null
          order_code: string
          order_date: string
          order_status: string | null
          store_id: string | null
          tax_amount: number | null
          total_amount: number
          updated_at: string
        }
        Insert: {
          cancel_reason?: string | null
          close_reason?: string | null
          created_at?: string
          customer_id?: string | null
          delivery_city?: string | null
          delivery_country?: string | null
          delivery_partner?: string | null
          delivery_region?: string | null
          delivery_type?: string | null
          discount_amount?: number | null
          id?: string
          net_amount?: number | null
          order_age_band?: string | null
          order_age_days?: number | null
          order_code: string
          order_date?: string
          order_status?: string | null
          store_id?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Update: {
          cancel_reason?: string | null
          close_reason?: string | null
          created_at?: string
          customer_id?: string | null
          delivery_city?: string | null
          delivery_country?: string | null
          delivery_partner?: string | null
          delivery_region?: string | null
          delivery_type?: string | null
          discount_amount?: number | null
          id?: string
          net_amount?: number | null
          order_age_band?: string | null
          order_age_days?: number | null
          order_code?: string
          order_date?: string
          order_status?: string | null
          store_id?: string | null
          tax_amount?: number | null
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      planograms: {
        Row: {
          category: string
          created_at: string
          effective_date: string | null
          id: string
          planogram_code: string | null
          planogram_name: string
          shelf_count: number
          status: string | null
          store_type: string | null
          subcategory: string | null
          total_height_inches: number
          total_width_inches: number
          updated_at: string
          version: number | null
        }
        Insert: {
          category: string
          created_at?: string
          effective_date?: string | null
          id?: string
          planogram_code?: string | null
          planogram_name: string
          shelf_count?: number
          status?: string | null
          store_type?: string | null
          subcategory?: string | null
          total_height_inches?: number
          total_width_inches?: number
          updated_at?: string
          version?: number | null
        }
        Update: {
          category?: string
          created_at?: string
          effective_date?: string | null
          id?: string
          planogram_code?: string | null
          planogram_name?: string
          shelf_count?: number
          status?: string | null
          store_type?: string | null
          subcategory?: string | null
          total_height_inches?: number
          total_width_inches?: number
          updated_at?: string
          version?: number | null
        }
        Relationships: []
      }
      price_bands: {
        Row: {
          band_description: string | null
          created_at: string
          id: string
          price_band: string
          price_department: string
          price_point_high: number
          price_point_low: number
        }
        Insert: {
          band_description?: string | null
          created_at?: string
          id?: string
          price_band: string
          price_department: string
          price_point_high: number
          price_point_low: number
        }
        Update: {
          band_description?: string | null
          created_at?: string
          id?: string
          price_band?: string
          price_department?: string
          price_point_high?: number
          price_point_low?: number
        }
        Relationships: []
      }
      price_change_history: {
        Row: {
          approved_by: string | null
          change_date: string
          change_reason: string | null
          change_type: string | null
          created_at: string
          id: string
          new_price: number
          old_price: number
          product_sku: string
        }
        Insert: {
          approved_by?: string | null
          change_date?: string
          change_reason?: string | null
          change_type?: string | null
          created_at?: string
          id?: string
          new_price: number
          old_price: number
          product_sku: string
        }
        Update: {
          approved_by?: string | null
          change_date?: string
          change_reason?: string | null
          change_type?: string | null
          created_at?: string
          id?: string
          new_price?: number
          old_price?: number
          product_sku?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          base_price: number
          brand: string | null
          brand_group: string | null
          brand_type: string | null
          buying_uom: string | null
          category: string
          class: string | null
          color: string | null
          cost: number
          created_at: string | null
          ean: string | null
          gender: string | null
          id: string
          introduction_date: string | null
          manufacturer: string | null
          margin_percent: number | null
          merchandise_flag: boolean | null
          never_out_flag: boolean | null
          outright_concession_flag: string | null
          price_elasticity: number | null
          product_depth: number | null
          product_height: number | null
          product_name: string
          product_sku: string
          product_type: string | null
          product_width: number | null
          seasonality_factor: string | null
          selling_uom: string | null
          size: string | null
          sku_status: string | null
          style: string | null
          sub_class: string | null
          subcategory: string | null
          updated_at: string | null
          variant: string | null
        }
        Insert: {
          base_price: number
          brand?: string | null
          brand_group?: string | null
          brand_type?: string | null
          buying_uom?: string | null
          category: string
          class?: string | null
          color?: string | null
          cost: number
          created_at?: string | null
          ean?: string | null
          gender?: string | null
          id?: string
          introduction_date?: string | null
          manufacturer?: string | null
          margin_percent?: number | null
          merchandise_flag?: boolean | null
          never_out_flag?: boolean | null
          outright_concession_flag?: string | null
          price_elasticity?: number | null
          product_depth?: number | null
          product_height?: number | null
          product_name: string
          product_sku: string
          product_type?: string | null
          product_width?: number | null
          seasonality_factor?: string | null
          selling_uom?: string | null
          size?: string | null
          sku_status?: string | null
          style?: string | null
          sub_class?: string | null
          subcategory?: string | null
          updated_at?: string | null
          variant?: string | null
        }
        Update: {
          base_price?: number
          brand?: string | null
          brand_group?: string | null
          brand_type?: string | null
          buying_uom?: string | null
          category?: string
          class?: string | null
          color?: string | null
          cost?: number
          created_at?: string | null
          ean?: string | null
          gender?: string | null
          id?: string
          introduction_date?: string | null
          manufacturer?: string | null
          margin_percent?: number | null
          merchandise_flag?: boolean | null
          never_out_flag?: boolean | null
          outright_concession_flag?: string | null
          price_elasticity?: number | null
          product_depth?: number | null
          product_height?: number | null
          product_name?: string
          product_sku?: string
          product_type?: string | null
          product_width?: number | null
          seasonality_factor?: string | null
          selling_uom?: string | null
          size?: string | null
          sku_status?: string | null
          style?: string | null
          sub_class?: string | null
          subcategory?: string | null
          updated_at?: string | null
          variant?: string | null
        }
        Relationships: []
      }
      promotions: {
        Row: {
          channel: string | null
          created_at: string | null
          discount_amount: number | null
          discount_percent: number | null
          end_date: string
          id: string
          product_category: string | null
          product_sku: string | null
          promo_mechanism: string | null
          promotion_name: string
          promotion_type: string
          running_promo: boolean | null
          start_date: string
          status: string | null
          target_segment: string | null
          total_spend: number | null
          updated_at: string | null
        }
        Insert: {
          channel?: string | null
          created_at?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          end_date: string
          id?: string
          product_category?: string | null
          product_sku?: string | null
          promo_mechanism?: string | null
          promotion_name: string
          promotion_type: string
          running_promo?: boolean | null
          start_date: string
          status?: string | null
          target_segment?: string | null
          total_spend?: number | null
          updated_at?: string | null
        }
        Update: {
          channel?: string | null
          created_at?: string | null
          discount_amount?: number | null
          discount_percent?: number | null
          end_date?: string
          id?: string
          product_category?: string | null
          product_sku?: string | null
          promo_mechanism?: string | null
          promotion_name?: string
          promotion_type?: string
          running_promo?: boolean | null
          start_date?: string
          status?: string | null
          target_segment?: string | null
          total_spend?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      purchase_orders: {
        Row: {
          actual_delivery_date: string | null
          created_at: string
          expected_delivery_date: string
          id: string
          order_date: string
          po_number: string
          status: string | null
          store_id: string | null
          total_amount: number
          updated_at: string
          vendor_id: string | null
        }
        Insert: {
          actual_delivery_date?: string | null
          created_at?: string
          expected_delivery_date: string
          id?: string
          order_date: string
          po_number: string
          status?: string | null
          store_id?: string | null
          total_amount: number
          updated_at?: string
          vendor_id?: string | null
        }
        Update: {
          actual_delivery_date?: string | null
          created_at?: string
          expected_delivery_date?: string
          id?: string
          order_date?: string
          po_number?: string
          status?: string | null
          store_id?: string | null
          total_amount?: number
          updated_at?: string
          vendor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_vendor_id_fkey"
            columns: ["vendor_id"]
            isOneToOne: false
            referencedRelation: "vendors"
            referencedColumns: ["id"]
          },
        ]
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
      returns: {
        Row: {
          created_at: string
          customer_id: string | null
          id: string
          order_id: string | null
          product_sku: string
          quantity: number
          refund_amount: number
          restocking_fee: number | null
          return_code: string
          return_date: string
          return_reason: string
          return_type: string
          store_id: string | null
        }
        Insert: {
          created_at?: string
          customer_id?: string | null
          id?: string
          order_id?: string | null
          product_sku: string
          quantity?: number
          refund_amount: number
          restocking_fee?: number | null
          return_code: string
          return_date?: string
          return_reason: string
          return_type: string
          store_id?: string | null
        }
        Update: {
          created_at?: string
          customer_id?: string | null
          id?: string
          order_id?: string | null
          product_sku?: string
          quantity?: number
          refund_amount?: number
          restocking_fee?: number | null
          return_code?: string
          return_date?: string
          return_reason?: string
          return_type?: string
          store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "returns_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "returns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      shelf_allocations: {
        Row: {
          created_at: string
          depth_inches: number | null
          facings: number
          height_inches: number
          id: string
          is_eye_level: boolean | null
          planogram_id: string | null
          position_from_left: number
          product_sku: string
          sales_per_sqft: number | null
          shelf_number: number
          width_inches: number
        }
        Insert: {
          created_at?: string
          depth_inches?: number | null
          facings?: number
          height_inches: number
          id?: string
          is_eye_level?: boolean | null
          planogram_id?: string | null
          position_from_left: number
          product_sku: string
          sales_per_sqft?: number | null
          shelf_number: number
          width_inches: number
        }
        Update: {
          created_at?: string
          depth_inches?: number | null
          facings?: number
          height_inches?: number
          id?: string
          is_eye_level?: boolean | null
          planogram_id?: string | null
          position_from_left?: number
          product_sku?: string
          sales_per_sqft?: number | null
          shelf_number?: number
          width_inches?: number
        }
        Relationships: [
          {
            foreignKeyName: "shelf_allocations_planogram_id_fkey"
            columns: ["planogram_id"]
            isOneToOne: false
            referencedRelation: "planograms"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_routes: {
        Row: {
          avg_transit_time_hours: number
          carbon_footprint_kg: number | null
          cost_per_mile: number | null
          created_at: string
          destination_location: string
          destination_store_id: string | null
          distance_miles: number
          id: string
          is_active: boolean | null
          origin_location: string
          origin_store_id: string | null
          route_name: string
          transportation_mode: string | null
        }
        Insert: {
          avg_transit_time_hours: number
          carbon_footprint_kg?: number | null
          cost_per_mile?: number | null
          created_at?: string
          destination_location: string
          destination_store_id?: string | null
          distance_miles: number
          id?: string
          is_active?: boolean | null
          origin_location: string
          origin_store_id?: string | null
          route_name: string
          transportation_mode?: string | null
        }
        Update: {
          avg_transit_time_hours?: number
          carbon_footprint_kg?: number | null
          cost_per_mile?: number | null
          created_at?: string
          destination_location?: string
          destination_store_id?: string | null
          distance_miles?: number
          id?: string
          is_active?: boolean | null
          origin_location?: string
          origin_store_id?: string | null
          route_name?: string
          transportation_mode?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipping_routes_destination_store_id_fkey"
            columns: ["destination_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shipping_routes_origin_store_id_fkey"
            columns: ["origin_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_age_tracking: {
        Row: {
          created_at: string
          id: string
          product_sku: string
          quantity: number
          stock_age_band: string
          stock_age_days: number
          store_id: string | null
          tracking_date: string
          value_at_cost: number | null
          value_at_retail: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          product_sku: string
          quantity: number
          stock_age_band: string
          stock_age_days: number
          store_id?: string | null
          tracking_date: string
          value_at_cost?: number | null
          value_at_retail?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          product_sku?: string
          quantity?: number
          stock_age_band?: string
          stock_age_days?: number
          store_id?: string | null
          tracking_date?: string
          value_at_cost?: number | null
          value_at_retail?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "stock_age_tracking_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
        ]
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
          channel_description: string | null
          channel_group: string | null
          closing_hours: string | null
          comp_status: string | null
          country: string | null
          created_at: string | null
          district: string | null
          id: string
          location: string | null
          opening_hours: string | null
          region: string | null
          sector: string | null
          store_code: string
          store_format: string | null
          store_group: string | null
          store_name: string
          store_size_sqft: number | null
          store_type: string | null
          updated_at: string | null
        }
        Insert: {
          channel_description?: string | null
          channel_group?: string | null
          closing_hours?: string | null
          comp_status?: string | null
          country?: string | null
          created_at?: string | null
          district?: string | null
          id?: string
          location?: string | null
          opening_hours?: string | null
          region?: string | null
          sector?: string | null
          store_code: string
          store_format?: string | null
          store_group?: string | null
          store_name: string
          store_size_sqft?: number | null
          store_type?: string | null
          updated_at?: string | null
        }
        Update: {
          channel_description?: string | null
          channel_group?: string | null
          closing_hours?: string | null
          comp_status?: string | null
          country?: string | null
          created_at?: string | null
          district?: string | null
          id?: string
          location?: string | null
          opening_hours?: string | null
          region?: string | null
          sector?: string | null
          store_code?: string
          store_format?: string | null
          store_group?: string | null
          store_name?: string
          store_size_sqft?: number | null
          store_type?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      supplier_orders: {
        Row: {
          actual_delivery_date: string | null
          created_at: string
          expected_delivery_date: string
          id: string
          on_time: boolean | null
          order_date: string
          product_sku: string
          quantity: number
          status: string | null
          supplier_id: string | null
          total_cost: number | null
          unit_cost: number
        }
        Insert: {
          actual_delivery_date?: string | null
          created_at?: string
          expected_delivery_date: string
          id?: string
          on_time?: boolean | null
          order_date: string
          product_sku: string
          quantity: number
          status?: string | null
          supplier_id?: string | null
          total_cost?: number | null
          unit_cost: number
        }
        Update: {
          actual_delivery_date?: string | null
          created_at?: string
          expected_delivery_date?: string
          id?: string
          on_time?: boolean | null
          order_date?: string
          product_sku?: string
          quantity?: number
          status?: string | null
          supplier_id?: string | null
          total_cost?: number | null
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "supplier_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          address: string | null
          city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          id: string
          lead_time_days: number
          minimum_order_value: number | null
          payment_terms: string | null
          preferred_carrier: string | null
          reliability_score: number | null
          state: string | null
          supplier_code: string
          supplier_name: string
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          lead_time_days?: number
          minimum_order_value?: number | null
          payment_terms?: string | null
          preferred_carrier?: string | null
          reliability_score?: number | null
          state?: string | null
          supplier_code: string
          supplier_name: string
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          lead_time_days?: number
          minimum_order_value?: number | null
          payment_terms?: string | null
          preferred_carrier?: string | null
          reliability_score?: number | null
          state?: string | null
          supplier_code?: string
          supplier_name?: string
          updated_at?: string
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
      time_dimension: {
        Row: {
          created_at: string
          date_value: string
          day_name: string
          day_of_week: number
          day_type: string
          fiscal_quarter: number | null
          fiscal_year: number | null
          holiday_name: string | null
          id: string
          is_holiday: boolean | null
          period: number
          period_name: string
          quarter: number
          quarter_name: string
          week: number
          week_name: string
          year: number
        }
        Insert: {
          created_at?: string
          date_value: string
          day_name: string
          day_of_week: number
          day_type: string
          fiscal_quarter?: number | null
          fiscal_year?: number | null
          holiday_name?: string | null
          id?: string
          is_holiday?: boolean | null
          period: number
          period_name: string
          quarter: number
          quarter_name: string
          week: number
          week_name: string
          year: number
        }
        Update: {
          created_at?: string
          date_value?: string
          day_name?: string
          day_of_week?: number
          day_type?: string
          fiscal_quarter?: number | null
          fiscal_year?: number | null
          holiday_name?: string | null
          id?: string
          is_holiday?: boolean | null
          period?: number
          period_name?: string
          quarter?: number
          quarter_name?: string
          week?: number
          week_name?: string
          year?: number
        }
        Relationships: []
      }
      transactions: {
        Row: {
          cost_of_goods_sold: number | null
          created_at: string | null
          customer_id: string | null
          discount_amount: number | null
          discount_type: string | null
          id: string
          margin: number | null
          net_sales: number | null
          product_name: string | null
          product_sku: string
          promotion_id: string | null
          quantity: number
          return_flag: boolean | null
          store_id: string | null
          tax_amount: number | null
          total_amount: number
          transaction_date: string
          unit_price: number
        }
        Insert: {
          cost_of_goods_sold?: number | null
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          id?: string
          margin?: number | null
          net_sales?: number | null
          product_name?: string | null
          product_sku: string
          promotion_id?: string | null
          quantity: number
          return_flag?: boolean | null
          store_id?: string | null
          tax_amount?: number | null
          total_amount: number
          transaction_date: string
          unit_price: number
        }
        Update: {
          cost_of_goods_sold?: number | null
          created_at?: string | null
          customer_id?: string | null
          discount_amount?: number | null
          discount_type?: string | null
          id?: string
          margin?: number | null
          net_sales?: number | null
          product_name?: string | null
          product_sku?: string
          promotion_id?: string | null
          quantity?: number
          return_flag?: boolean | null
          store_id?: string | null
          tax_amount?: number | null
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
      vendors: {
        Row: {
          contact_email: string | null
          contact_name: string | null
          contact_phone: string | null
          created_at: string
          credit_limit: number | null
          id: string
          payment_terms: string | null
          rating: number | null
          status: string | null
          updated_at: string
          vendor_code: string
          vendor_country: string | null
          vendor_name: string
          vendor_type: string | null
        }
        Insert: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          credit_limit?: number | null
          id?: string
          payment_terms?: string | null
          rating?: number | null
          status?: string | null
          updated_at?: string
          vendor_code: string
          vendor_country?: string | null
          vendor_name: string
          vendor_type?: string | null
        }
        Update: {
          contact_email?: string | null
          contact_name?: string | null
          contact_phone?: string | null
          created_at?: string
          credit_limit?: number | null
          id?: string
          payment_terms?: string | null
          rating?: number | null
          status?: string | null
          updated_at?: string
          vendor_code?: string
          vendor_country?: string | null
          vendor_name?: string
          vendor_type?: string | null
        }
        Relationships: []
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
