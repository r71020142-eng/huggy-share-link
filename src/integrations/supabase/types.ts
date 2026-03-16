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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activation_keys: {
        Row: {
          code: string
          created_at: string
          current_uses: number | null
          expires_at: string | null
          id: string
          is_active: boolean | null
          max_uses: number | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          used_at: string | null
          used_by_store_id: string | null
        }
        Insert: {
          code: string
          created_at?: string
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          used_at?: string | null
          used_by_store_id?: string | null
        }
        Update: {
          code?: string
          created_at?: string
          current_uses?: number | null
          expires_at?: string | null
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          used_at?: string | null
          used_by_store_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activation_keys_used_by_store_id_fkey"
            columns: ["used_by_store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activation_keys_used_by_store_id_fkey"
            columns: ["used_by_store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string | null
          id: string
          ip_address: string | null
          user_email: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string | null
          id?: string
          ip_address?: string | null
          user_email?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      cash_movements: {
        Row: {
          amount: number
          cash_session_id: string
          created_at: string
          created_by: string
          description: string | null
          id: string
          store_id: string
          type: string
        }
        Insert: {
          amount: number
          cash_session_id: string
          created_at?: string
          created_by: string
          description?: string | null
          id?: string
          store_id: string
          type: string
        }
        Update: {
          amount?: number
          cash_session_id?: string
          created_at?: string
          created_by?: string
          description?: string | null
          id?: string
          store_id?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "cash_movements_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_movements_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      cash_sessions: {
        Row: {
          cash_difference: number | null
          closed_at: string | null
          closed_by: string | null
          created_at: string
          expected_cash_amount: number | null
          final_cash_amount: number | null
          id: string
          initial_cash_amount: number
          notes: string | null
          opened_at: string
          opened_by: string
          status: string
          store_id: string
          total_card_amount: number | null
          total_cash_amount: number | null
          total_pix_amount: number | null
          total_sales_amount: number | null
          total_sangrias: number | null
          total_suprimentos: number | null
        }
        Insert: {
          cash_difference?: number | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          expected_cash_amount?: number | null
          final_cash_amount?: number | null
          id?: string
          initial_cash_amount?: number
          notes?: string | null
          opened_at?: string
          opened_by: string
          status?: string
          store_id: string
          total_card_amount?: number | null
          total_cash_amount?: number | null
          total_pix_amount?: number | null
          total_sales_amount?: number | null
          total_sangrias?: number | null
          total_suprimentos?: number | null
        }
        Update: {
          cash_difference?: number | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string
          expected_cash_amount?: number | null
          final_cash_amount?: number | null
          id?: string
          initial_cash_amount?: number
          notes?: string | null
          opened_at?: string
          opened_by?: string
          status?: string
          store_id?: string
          total_card_amount?: number | null
          total_cash_amount?: number | null
          total_pix_amount?: number | null
          total_sales_amount?: number | null
          total_sangrias?: number | null
          total_suprimentos?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_sessions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "cash_sessions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      categories: {
        Row: {
          created_at: string
          icon: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          sort_order: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          sort_order?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          icon?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          sort_order?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "categories_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          bairro: string | null
          complemento: string | null
          created_at: string
          crm_status: string
          first_order_at: string | null
          id: string
          last_order_at: string | null
          name: string
          observations: string | null
          phone: string
          store_id: string
          total_orders: number
          total_spent: number
        }
        Insert: {
          address?: string | null
          bairro?: string | null
          complemento?: string | null
          created_at?: string
          crm_status?: string
          first_order_at?: string | null
          id?: string
          last_order_at?: string | null
          name: string
          observations?: string | null
          phone: string
          store_id: string
          total_orders?: number
          total_spent?: number
        }
        Update: {
          address?: string | null
          bairro?: string | null
          complemento?: string | null
          created_at?: string
          crm_status?: string
          first_order_at?: string | null
          id?: string
          last_order_at?: string | null
          name?: string
          observations?: string | null
          phone?: string
          store_id?: string
          total_orders?: number
          total_spent?: number
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_banners: {
        Row: {
          created_at: string
          id: string
          image_url: string
          is_active: boolean | null
          link_category_id: string | null
          link_product_id: string | null
          link_url: string | null
          menu_id: string
          sort_order: number | null
          store_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          image_url: string
          is_active?: boolean | null
          link_category_id?: string | null
          link_product_id?: string | null
          link_url?: string | null
          menu_id: string
          sort_order?: number | null
          store_id: string
        }
        Update: {
          created_at?: string
          id?: string
          image_url?: string
          is_active?: boolean | null
          link_category_id?: string | null
          link_product_id?: string | null
          link_url?: string | null
          menu_id?: string
          sort_order?: number | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "menu_banners_link_category_id_fkey"
            columns: ["link_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_banners_link_product_id_fkey"
            columns: ["link_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_banners_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_banners_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_banners_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      menu_products: {
        Row: {
          created_at: string
          id: string
          is_available: boolean | null
          menu_id: string
          product_id: string
          sort_order: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean | null
          menu_id: string
          product_id: string
          sort_order?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean | null
          menu_id?: string
          product_id?: string
          sort_order?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "menu_products_menu_id_fkey"
            columns: ["menu_id"]
            isOneToOne: false
            referencedRelation: "menus"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menu_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      menus: {
        Row: {
          banner_mode: string | null
          banner_url: string | null
          bg_color: string | null
          created_at: string
          font_family: string | null
          id: string
          is_primary: boolean | null
          is_published: boolean | null
          logo_url: string | null
          name: string
          show_all_category: boolean | null
          show_banner: boolean | null
          show_categories: boolean | null
          show_featured: boolean | null
          show_search: boolean | null
          slug: string
          store_id: string
          text_color: string | null
          theme_color: string | null
          updated_at: string
        }
        Insert: {
          banner_mode?: string | null
          banner_url?: string | null
          bg_color?: string | null
          created_at?: string
          font_family?: string | null
          id?: string
          is_primary?: boolean | null
          is_published?: boolean | null
          logo_url?: string | null
          name: string
          show_all_category?: boolean | null
          show_banner?: boolean | null
          show_categories?: boolean | null
          show_featured?: boolean | null
          show_search?: boolean | null
          slug: string
          store_id: string
          text_color?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Update: {
          banner_mode?: string | null
          banner_url?: string | null
          bg_color?: string | null
          created_at?: string
          font_family?: string | null
          id?: string
          is_primary?: boolean | null
          is_published?: boolean | null
          logo_url?: string | null
          name?: string
          show_all_category?: boolean | null
          show_banner?: boolean | null
          show_categories?: boolean | null
          show_featured?: boolean | null
          show_search?: boolean | null
          slug?: string
          store_id?: string
          text_color?: string | null
          theme_color?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "menus_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "menus_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      neighborhoods: {
        Row: {
          created_at: string
          delivery_fee: number | null
          id: string
          is_active: boolean | null
          name: string
          store_id: string
        }
        Insert: {
          created_at?: string
          delivery_fee?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          store_id: string
        }
        Update: {
          created_at?: string
          delivery_fee?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "neighborhoods_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "neighborhoods_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          additionals: Json | null
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          product_name: string
          quantity: number
          subtotal: number
          unit_price: number
        }
        Insert: {
          additionals?: Json | null
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          product_name: string
          quantity?: number
          subtotal: number
          unit_price: number
        }
        Update: {
          additionals?: Json | null
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          product_name?: string
          quantity?: number
          subtotal?: number
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
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      order_payments: {
        Row: {
          amount: number
          cash_session_id: string | null
          created_at: string
          id: string
          order_id: string
          payment_method: string
          store_id: string
        }
        Insert: {
          amount?: number
          cash_session_id?: string | null
          created_at?: string
          id?: string
          order_id: string
          payment_method: string
          store_id: string
        }
        Update: {
          amount?: number
          cash_session_id?: string | null
          created_at?: string
          id?: string
          order_id?: string
          payment_method?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_payments_cash_session_id_fkey"
            columns: ["cash_session_id"]
            isOneToOne: false
            referencedRelation: "cash_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          customer_address: string | null
          customer_id: string | null
          customer_name: string
          customer_phone: string | null
          delivery_fee: number | null
          id: string
          is_manual: boolean | null
          neighborhood_id: string | null
          notes: string | null
          order_type: string | null
          paid_at: string | null
          payment_method: string | null
          payment_status: string
          status: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal: number
          total: number
          tracking_code: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          customer_address?: string | null
          customer_id?: string | null
          customer_name: string
          customer_phone?: string | null
          delivery_fee?: number | null
          id?: string
          is_manual?: boolean | null
          neighborhood_id?: string | null
          notes?: string | null
          order_type?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          status?: Database["public"]["Enums"]["order_status"]
          store_id: string
          subtotal?: number
          total?: number
          tracking_code?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          customer_address?: string | null
          customer_id?: string | null
          customer_name?: string
          customer_phone?: string | null
          delivery_fee?: number | null
          id?: string
          is_manual?: boolean | null
          neighborhood_id?: string | null
          notes?: string | null
          order_type?: string | null
          paid_at?: string | null
          payment_method?: string | null
          payment_status?: string
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string
          subtotal?: number
          total?: number
          tracking_code?: string | null
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
            foreignKeyName: "orders_neighborhood_id_fkey"
            columns: ["neighborhood_id"]
            isOneToOne: false
            referencedRelation: "neighborhoods"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      print_agents: {
        Row: {
          agent_version: string | null
          created_at: string
          id: string
          is_active: boolean
          last_seen_at: string | null
          machine_name: string | null
          store_id: string
          token_hash: string
          updated_at: string
        }
        Insert: {
          agent_version?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          machine_name?: string | null
          store_id: string
          token_hash: string
          updated_at?: string
        }
        Update: {
          agent_version?: string | null
          created_at?: string
          id?: string
          is_active?: boolean
          last_seen_at?: string | null
          machine_name?: string | null
          store_id?: string
          token_hash?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_agents_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_agents_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      print_jobs: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          id: string
          idempotency_key: string
          order_id: string
          printed_at: string | null
          status: string
          store_id: string
          updated_at: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key: string
          order_id: string
          printed_at?: string | null
          status?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          idempotency_key?: string
          order_id?: string
          printed_at?: string | null
          status?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_jobs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_jobs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_jobs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      print_logs: {
        Row: {
          attempts: number
          created_at: string
          error_message: string | null
          id: string
          job_id: string | null
          order_id: string | null
          printed_at: string | null
          status: string
          store_id: string
        }
        Insert: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          job_id?: string | null
          order_id?: string | null
          printed_at?: string | null
          status?: string
          store_id: string
        }
        Update: {
          attempts?: number
          created_at?: string
          error_message?: string | null
          id?: string
          job_id?: string | null
          order_id?: string | null
          printed_at?: string | null
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "print_logs_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "print_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_logs_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "print_logs_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      product_additionals: {
        Row: {
          category: string | null
          created_at: string
          id: string
          is_active: boolean | null
          is_required: boolean | null
          max_qty: number | null
          min_qty: number | null
          name: string
          price: number | null
          product_id: string
          sort_order: number | null
          store_id: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_qty?: number | null
          min_qty?: number | null
          name: string
          price?: number | null
          product_id: string
          sort_order?: number | null
          store_id: string
        }
        Update: {
          category?: string | null
          created_at?: string
          id?: string
          is_active?: boolean | null
          is_required?: boolean | null
          max_qty?: number | null
          min_qty?: number | null
          name?: string
          price?: number | null
          product_id?: string
          sort_order?: number | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_additionals_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_additionals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_additionals_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          badge: string | null
          category_id: string | null
          created_at: string
          description: string | null
          free_additionals_limits: Json | null
          id: string
          image_url: string | null
          is_active: boolean | null
          is_featured: boolean | null
          max_free_additionals: number | null
          name: string
          price: number
          sort_order: number | null
          store_id: string
          updated_at: string
        }
        Insert: {
          badge?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          free_additionals_limits?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_free_additionals?: number | null
          name: string
          price: number
          sort_order?: number | null
          store_id: string
          updated_at?: string
        }
        Update: {
          badge?: string | null
          category_id?: string | null
          created_at?: string
          description?: string | null
          free_additionals_limits?: Json | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          is_featured?: boolean | null
          max_free_additionals?: number | null
          name?: string
          price?: number
          sort_order?: number | null
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          display_name: string | null
          email: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      store_print_metrics_daily: {
        Row: {
          created_at: string
          id: string
          metric_date: string
          store_id: string
          success_rate: number
          total_errors: number
          total_prints: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          metric_date?: string
          store_id: string
          success_rate?: number
          total_errors?: number
          total_prints?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          metric_date?: string
          store_id?: string
          success_rate?: number
          total_errors?: number
          total_prints?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_print_metrics_daily_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_print_metrics_daily_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_print_settings: {
        Row: {
          auto_print: boolean
          created_at: string
          id: string
          print_mode: string
          store_id: string
          updated_at: string
        }
        Insert: {
          auto_print?: boolean
          created_at?: string
          id?: string
          print_mode?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          auto_print?: boolean
          created_at?: string
          id?: string
          print_mode?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_print_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_print_settings_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_runtime_status: {
        Row: {
          failed_jobs: number
          id: string
          last_heartbeat: string | null
          last_print_at: string | null
          printer_name: string | null
          printer_status: string
          printer_type: string | null
          queue_size: number
          store_id: string
          total_errors: number
          total_prints: number
          updated_at: string
        }
        Insert: {
          failed_jobs?: number
          id?: string
          last_heartbeat?: string | null
          last_print_at?: string | null
          printer_name?: string | null
          printer_status?: string
          printer_type?: string | null
          queue_size?: number
          store_id: string
          total_errors?: number
          total_prints?: number
          updated_at?: string
        }
        Update: {
          failed_jobs?: number
          id?: string
          last_heartbeat?: string | null
          last_print_at?: string | null
          printer_name?: string | null
          printer_status?: string
          printer_type?: string | null
          queue_size?: number
          store_id?: string
          total_errors?: number
          total_prints?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_runtime_status_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_runtime_status_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      store_whatsapp_integrations: {
        Row: {
          active: boolean
          created_at: string
          id: string
          instance_id: string
          phone_e164: string | null
          provider: string
          store_id: string
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          id?: string
          instance_id: string
          phone_e164?: string | null
          provider?: string
          store_id: string
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          id?: string
          instance_id?: string
          phone_e164?: string | null
          provider?: string
          store_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_whatsapp_integrations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "store_whatsapp_integrations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
      stores: {
        Row: {
          address: string | null
          banner_url: string | null
          created_at: string
          dashboard_pin_hash: string | null
          delivery_enabled: boolean | null
          estimated_time: string | null
          id: string
          is_open: boolean | null
          logo_url: string | null
          min_order: number | null
          monthly_goal: number | null
          name: string
          operating_hours: string | null
          owner_id: string
          pickup_enabled: boolean | null
          plan_type: Database["public"]["Enums"]["plan_type"]
          promo_banner: string | null
          slug: string
          theme_color: string | null
          updated_at: string
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          created_at?: string
          dashboard_pin_hash?: string | null
          delivery_enabled?: boolean | null
          estimated_time?: string | null
          id?: string
          is_open?: boolean | null
          logo_url?: string | null
          min_order?: number | null
          monthly_goal?: number | null
          name: string
          operating_hours?: string | null
          owner_id: string
          pickup_enabled?: boolean | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          promo_banner?: string | null
          slug: string
          theme_color?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          created_at?: string
          dashboard_pin_hash?: string | null
          delivery_enabled?: boolean | null
          estimated_time?: string | null
          id?: string
          is_open?: boolean | null
          logo_url?: string | null
          min_order?: number | null
          monthly_goal?: number | null
          name?: string
          operating_hours?: string | null
          owner_id?: string
          pickup_enabled?: boolean | null
          plan_type?: Database["public"]["Enums"]["plan_type"]
          promo_banner?: string | null
          slug?: string
          theme_color?: string | null
          updated_at?: string
          whatsapp?: string | null
        }
        Relationships: []
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
      whatsapp_events: {
        Row: {
          customer_name: string | null
          customer_phone: string | null
          error_message: string | null
          external_message_id: string
          id: string
          instance_id: string
          message_text: string | null
          order_id: string | null
          payload_raw: Json | null
          processed_at: string | null
          provider: string
          received_at: string
          status: string
          store_id: string
        }
        Insert: {
          customer_name?: string | null
          customer_phone?: string | null
          error_message?: string | null
          external_message_id: string
          id?: string
          instance_id: string
          message_text?: string | null
          order_id?: string | null
          payload_raw?: Json | null
          processed_at?: string | null
          provider?: string
          received_at?: string
          status?: string
          store_id: string
        }
        Update: {
          customer_name?: string | null
          customer_phone?: string | null
          error_message?: string | null
          external_message_id?: string
          id?: string
          instance_id?: string
          message_text?: string | null
          order_id?: string | null
          payload_raw?: Json | null
          processed_at?: string | null
          provider?: string
          received_at?: string
          status?: string
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_events_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "stores_public"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      stores_public: {
        Row: {
          address: string | null
          banner_url: string | null
          created_at: string | null
          delivery_enabled: boolean | null
          estimated_time: string | null
          id: string | null
          is_open: boolean | null
          logo_url: string | null
          min_order: number | null
          name: string | null
          operating_hours: string | null
          pickup_enabled: boolean | null
          plan_type: Database["public"]["Enums"]["plan_type"] | null
          promo_banner: string | null
          slug: string | null
          theme_color: string | null
          whatsapp: string | null
        }
        Insert: {
          address?: string | null
          banner_url?: string | null
          created_at?: string | null
          delivery_enabled?: boolean | null
          estimated_time?: string | null
          id?: string | null
          is_open?: boolean | null
          logo_url?: string | null
          min_order?: number | null
          name?: string | null
          operating_hours?: string | null
          pickup_enabled?: boolean | null
          plan_type?: Database["public"]["Enums"]["plan_type"] | null
          promo_banner?: string | null
          slug?: string | null
          theme_color?: string | null
          whatsapp?: string | null
        }
        Update: {
          address?: string | null
          banner_url?: string | null
          created_at?: string | null
          delivery_enabled?: boolean | null
          estimated_time?: string | null
          id?: string | null
          is_open?: boolean | null
          logo_url?: string | null
          min_order?: number | null
          name?: string | null
          operating_hours?: string | null
          pickup_enabled?: boolean | null
          plan_type?: Database["public"]["Enums"]["plan_type"] | null
          promo_banner?: string | null
          slug?: string | null
          theme_color?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      classify_customer_crm_status: {
        Args: { p_customer_id: string }
        Returns: undefined
      }
      close_cash_session: {
        Args: {
          p_closed_by: string
          p_closing_amount: number
          p_notes?: string
          p_session_id: string
        }
        Returns: Json
      }
      confirm_fiado_payment: {
        Args: {
          p_closed_by: string
          p_order_id: string
          p_payment_method: string
        }
        Returns: Json
      }
      get_order_by_tracking:
        | { Args: { p_tracking_code: string }; Returns: Json }
        | {
            Args: { p_store_id?: string; p_tracking_code: string }
            Returns: Json
          }
      get_tracking_by_order_id:
        | { Args: { p_order_id: string }; Returns: Json }
        | { Args: { p_order_id: string; p_store_id?: string }; Returns: Json }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_store_owner: {
        Args: { _store_id: string; _user_id: string }
        Returns: boolean
      }
      order_exists: { Args: { p_order_id: string }; Returns: boolean }
      reclassify_all_customers: {
        Args: { p_store_id?: string }
        Returns: number
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "superadmin"
      order_status:
        | "pending"
        | "confirmed"
        | "preparing"
        | "delivering"
        | "completed"
        | "cancelled"
      plan_type: "basic" | "pro"
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
      app_role: ["admin", "moderator", "user", "superadmin"],
      order_status: [
        "pending",
        "confirmed",
        "preparing",
        "delivering",
        "completed",
        "cancelled",
      ],
      plan_type: ["basic", "pro"],
    },
  },
} as const
