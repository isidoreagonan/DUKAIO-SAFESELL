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
      abandoned_carts: {
        Row: {
          address: string | null
          city: string | null
          created_at: string
          customer_name: string | null
          email: string | null
          id: string
          items: Json
          order_number: string | null
          phone: string | null
          recovery_sent_at: string | null
          session_id: string
          status: string
          store_id: string
          subtotal: number
          updated_at: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          created_at?: string
          customer_name?: string | null
          email?: string | null
          id?: string
          items?: Json
          order_number?: string | null
          phone?: string | null
          recovery_sent_at?: string | null
          session_id: string
          status?: string
          store_id: string
          subtotal?: number
          updated_at?: string
        }
        Update: {
          address?: string | null
          city?: string | null
          created_at?: string
          customer_name?: string | null
          email?: string | null
          id?: string
          items?: Json
          order_number?: string | null
          phone?: string | null
          recovery_sent_at?: string | null
          session_id?: string
          status?: string
          store_id?: string
          subtotal?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "abandoned_carts_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_audit_log: {
        Row: {
          action: string
          actor_email: string | null
          actor_id: string
          created_at: string
          details: Json
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action: string
          actor_email?: string | null
          actor_id: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action?: string
          actor_email?: string | null
          actor_id?: string
          created_at?: string
          details?: Json
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: []
      }
      admin_payouts: {
        Row: {
          amount: number
          completed_at: string | null
          created_at: string
          currency: string
          failure_reason: string | null
          id: string
          note: string | null
          payload: Json
          payout_id: string
          phone: string
          provider: string
          provider_ref: string | null
          recipient_name: string | null
          requested_by: string
          status: string
          updated_at: string
        }
        Insert: {
          amount: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          note?: string | null
          payload?: Json
          payout_id?: string
          phone: string
          provider: string
          provider_ref?: string | null
          recipient_name?: string | null
          requested_by: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          completed_at?: string | null
          created_at?: string
          currency?: string
          failure_reason?: string | null
          id?: string
          note?: string | null
          payload?: Json
          payout_id?: string
          phone?: string
          provider?: string
          provider_ref?: string | null
          recipient_name?: string | null
          requested_by?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_chat_messages: {
        Row: {
          chat_id: string
          content: string
          created_at: string
          id: string
          image_url: string | null
          model: string | null
          provider: string | null
          role: string
          user_id: string
        }
        Insert: {
          chat_id: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          model?: string | null
          provider?: string | null
          role: string
          user_id: string
        }
        Update: {
          chat_id?: string
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          model?: string | null
          provider?: string | null
          role?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_messages_chat_id_fkey"
            columns: ["chat_id"]
            isOneToOne: false
            referencedRelation: "ai_chats"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_chats: {
        Row: {
          created_at: string
          id: string
          store_id: string | null
          summary: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          store_id?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          store_id?: string | null
          summary?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chats_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_engine_settings: {
        Row: {
          fallback_to_kie: boolean
          id: number
          image_engine: string
          text_engine: string
          updated_at: string
        }
        Insert: {
          fallback_to_kie?: boolean
          id?: number
          image_engine?: string
          text_engine?: string
          updated_at?: string
        }
        Update: {
          fallback_to_kie?: boolean
          id?: number
          image_engine?: string
          text_engine?: string
          updated_at?: string
        }
        Relationships: []
      }
      ai_jobs: {
        Row: {
          acknowledged: boolean
          created_at: string
          error: string | null
          funnel: Json | null
          id: string
          images: Json
          input: Json
          locked_at: string | null
          message: string | null
          next_index: number
          palette: Json | null
          percent: number
          phase: number
          product_id: string | null
          prompts: Json | null
          queue: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          acknowledged?: boolean
          created_at?: string
          error?: string | null
          funnel?: Json | null
          id?: string
          images?: Json
          input?: Json
          locked_at?: string | null
          message?: string | null
          next_index?: number
          palette?: Json | null
          percent?: number
          phase?: number
          product_id?: string | null
          prompts?: Json | null
          queue?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          acknowledged?: boolean
          created_at?: string
          error?: string | null
          funnel?: Json | null
          id?: string
          images?: Json
          input?: Json
          locked_at?: string | null
          message?: string | null
          next_index?: number
          palette?: Json | null
          percent?: number
          phase?: number
          product_id?: string | null
          prompts?: Json | null
          queue?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_provider_keys: {
        Row: {
          api_key: string
          created_at: string
          id: string
          is_active: boolean
          last_error: string | null
          last_used_at: string | null
          model: string | null
          provider: string
          updated_at: string
          user_id: string
        }
        Insert: {
          api_key: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_used_at?: string | null
          model?: string | null
          provider: string
          updated_at?: string
          user_id: string
        }
        Update: {
          api_key?: string
          created_at?: string
          id?: string
          is_active?: boolean
          last_error?: string | null
          last_used_at?: string | null
          model?: string | null
          provider?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      collection_products: {
        Row: {
          collection_id: string
          created_at: string
          id: string
          position: number
          product_id: string
        }
        Insert: {
          collection_id: string
          created_at?: string
          id?: string
          position?: number
          product_id: string
        }
        Update: {
          collection_id?: string
          created_at?: string
          id?: string
          position?: number
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collection_products_collection_id_fkey"
            columns: ["collection_id"]
            isOneToOne: false
            referencedRelation: "collections"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "collection_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      collections: {
        Row: {
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_published: boolean
          name: string
          position: number
          slug: string
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          name: string
          position?: number
          slug: string
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean
          name?: string
          position?: number
          slug?: string
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "collections_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          ends_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_subtotal: number
          product_id: string | null
          starts_at: string | null
          store_id: string
          type: Database["public"]["Enums"]["coupon_type"]
          updated_at: string
          used_count: number
          user_id: string
          value: number
        }
        Insert: {
          code: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_subtotal?: number
          product_id?: string | null
          starts_at?: string | null
          store_id: string
          type?: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          used_count?: number
          user_id: string
          value?: number
        }
        Update: {
          code?: string
          created_at?: string
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_subtotal?: number
          product_id?: string | null
          starts_at?: string | null
          store_id?: string
          type?: Database["public"]["Enums"]["coupon_type"]
          updated_at?: string
          used_count?: number
          user_id?: string
          value?: number
        }
        Relationships: [
          {
            foreignKeyName: "coupons_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      customers: {
        Row: {
          address: string | null
          city: string | null
          country: string | null
          created_at: string
          email: string | null
          full_name: string
          id: string
          notes: string | null
          phone: string | null
          store_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          phone?: string | null
          store_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          city?: string | null
          country?: string | null
          created_at?: string
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          phone?: string | null
          store_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      discovery_ads: {
        Row: {
          active_days: number
          ad_library_url: string | null
          body: string
          category: string
          country: string
          cta_text: string | null
          cta_type: string | null
          currency: string | null
          ended_at: string | null
          external_id: string
          first_seen_at: string
          headline: string
          id: string
          image_url: string | null
          is_active: boolean
          keyword: string | null
          landing_domain: string | null
          last_seen_at: string
          link_url: string | null
          media_path: string | null
          media_type: string
          page_avatar_url: string | null
          page_categories: string[]
          page_id: string | null
          page_like_count: number | null
          page_name: string
          platform: string
          publisher_platforms: string[]
          raw: Json | null
          reach_estimate: number | null
          spend: Json | null
          started_at: string | null
          thumbnail_url: string | null
          traction_score: number
          variations_count: number
          video_url: string | null
        }
        Insert: {
          active_days?: number
          ad_library_url?: string | null
          body?: string
          category?: string
          country?: string
          cta_text?: string | null
          cta_type?: string | null
          currency?: string | null
          ended_at?: string | null
          external_id: string
          first_seen_at?: string
          headline?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          keyword?: string | null
          landing_domain?: string | null
          last_seen_at?: string
          link_url?: string | null
          media_path?: string | null
          media_type?: string
          page_avatar_url?: string | null
          page_categories?: string[]
          page_id?: string | null
          page_like_count?: number | null
          page_name?: string
          platform?: string
          publisher_platforms?: string[]
          raw?: Json | null
          reach_estimate?: number | null
          spend?: Json | null
          started_at?: string | null
          thumbnail_url?: string | null
          traction_score?: number
          variations_count?: number
          video_url?: string | null
        }
        Update: {
          active_days?: number
          ad_library_url?: string | null
          body?: string
          category?: string
          country?: string
          cta_text?: string | null
          cta_type?: string | null
          currency?: string | null
          ended_at?: string | null
          external_id?: string
          first_seen_at?: string
          headline?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          keyword?: string | null
          landing_domain?: string | null
          last_seen_at?: string
          link_url?: string | null
          media_path?: string | null
          media_type?: string
          page_avatar_url?: string | null
          page_categories?: string[]
          page_id?: string | null
          page_like_count?: number | null
          page_name?: string
          platform?: string
          publisher_platforms?: string[]
          raw?: Json | null
          reach_estimate?: number | null
          spend?: Json | null
          started_at?: string | null
          thumbnail_url?: string | null
          traction_score?: number
          variations_count?: number
          video_url?: string | null
        }
        Relationships: []
      }
      discovery_brand_searches: {
        Row: {
          billed: boolean
          country: string | null
          created_at: string
          found: number
          id: string
          stores: number
          term: string
          user_id: string
        }
        Insert: {
          billed?: boolean
          country?: string | null
          created_at?: string
          found?: number
          id?: string
          stores?: number
          term: string
          user_id: string
        }
        Update: {
          billed?: boolean
          country?: string | null
          created_at?: string
          found?: number
          id?: string
          stores?: number
          term?: string
          user_id?: string
        }
        Relationships: []
      }
      discovery_favorites: {
        Row: {
          created_at: string
          id: string
          kind: string
          payload: Json
          ref_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          payload?: Json
          ref_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          payload?: Json
          ref_id?: string
          user_id?: string
        }
        Relationships: []
      }
      discovery_jobs: {
        Row: {
          key: string
          last_error: string | null
          last_found: number
          last_inserted: number
          last_run_at: string | null
          lease_until: string | null
          paused_reason: string | null
          runs: number
          status: string
          updated_at: string
        }
        Insert: {
          key: string
          last_error?: string | null
          last_found?: number
          last_inserted?: number
          last_run_at?: string | null
          lease_until?: string | null
          paused_reason?: string | null
          runs?: number
          status?: string
          updated_at?: string
        }
        Update: {
          key?: string
          last_error?: string | null
          last_found?: number
          last_inserted?: number
          last_run_at?: string | null
          lease_until?: string | null
          paused_reason?: string | null
          runs?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      discovery_scans: {
        Row: {
          country: string | null
          created_at: string
          error: string | null
          found: number
          id: string
          inserted: number
          keyword: string | null
          source: string
          updated: number
        }
        Insert: {
          country?: string | null
          created_at?: string
          error?: string | null
          found?: number
          id?: string
          inserted?: number
          keyword?: string | null
          source?: string
          updated?: number
        }
        Update: {
          country?: string | null
          created_at?: string
          error?: string | null
          found?: number
          id?: string
          inserted?: number
          keyword?: string | null
          source?: string
          updated?: number
        }
        Relationships: []
      }
      discovery_stores: {
        Row: {
          avg_price: number
          country: string | null
          currency: string | null
          domain: string
          fetch_error: string | null
          first_seen_at: string
          id: string
          language: string | null
          last_fetched_at: string | null
          launched_at: string | null
          max_price: number
          min_price: number
          name: string | null
          pixels: string[]
          platform: string
          products: Json
          products_count: number
          socials: Json
        }
        Insert: {
          avg_price?: number
          country?: string | null
          currency?: string | null
          domain: string
          fetch_error?: string | null
          first_seen_at?: string
          id?: string
          language?: string | null
          last_fetched_at?: string | null
          launched_at?: string | null
          max_price?: number
          min_price?: number
          name?: string | null
          pixels?: string[]
          platform?: string
          products?: Json
          products_count?: number
          socials?: Json
        }
        Update: {
          avg_price?: number
          country?: string | null
          currency?: string | null
          domain?: string
          fetch_error?: string | null
          first_seen_at?: string
          id?: string
          language?: string | null
          last_fetched_at?: string | null
          launched_at?: string | null
          max_price?: number
          min_price?: number
          name?: string | null
          pixels?: string[]
          platform?: string
          products?: Json
          products_count?: number
          socials?: Json
        }
        Relationships: []
      }
      email_campaign_recipients: {
        Row: {
          campaign_id: string
          clicked_at: string | null
          created_at: string
          email: string
          error_message: string | null
          full_name: string | null
          id: string
          opened_at: string | null
          status: string
          user_id: string
        }
        Insert: {
          campaign_id: string
          clicked_at?: string | null
          created_at?: string
          email: string
          error_message?: string | null
          full_name?: string | null
          id?: string
          opened_at?: string | null
          status?: string
          user_id: string
        }
        Update: {
          campaign_id?: string
          clicked_at?: string | null
          created_at?: string
          email?: string
          error_message?: string | null
          full_name?: string | null
          id?: string
          opened_at?: string | null
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaign_recipients_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "email_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      email_campaigns: {
        Row: {
          audience: string
          bg_color: string | null
          body: string
          brand_color: string | null
          button_color: string | null
          city: string | null
          clicked_count: number
          created_at: string
          cta_label: string | null
          cta_url: string | null
          footer_note: string | null
          id: string
          inactive_days: number
          logo_url: string | null
          min_orders: number
          name: string
          opened_count: number
          preheader: string | null
          recipients_count: number
          sent_at: string | null
          sent_count: number
          status: string
          store_id: string
          subject: string
          template: string
          text_color: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          audience?: string
          bg_color?: string | null
          body?: string
          brand_color?: string | null
          button_color?: string | null
          city?: string | null
          clicked_count?: number
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          footer_note?: string | null
          id?: string
          inactive_days?: number
          logo_url?: string | null
          min_orders?: number
          name: string
          opened_count?: number
          preheader?: string | null
          recipients_count?: number
          sent_at?: string | null
          sent_count?: number
          status?: string
          store_id: string
          subject: string
          template?: string
          text_color?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          audience?: string
          bg_color?: string | null
          body?: string
          brand_color?: string | null
          button_color?: string | null
          city?: string | null
          clicked_count?: number
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          footer_note?: string | null
          id?: string
          inactive_days?: number
          logo_url?: string | null
          min_orders?: number
          name?: string
          opened_count?: number
          preheader?: string | null
          recipients_count?: number
          sent_at?: string | null
          sent_count?: number
          status?: string
          store_id?: string
          subject?: string
          template?: string
          text_color?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_campaigns_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      email_otp_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          expires_at: string
          id: string
          purpose: string
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          expires_at: string
          id?: string
          purpose?: string
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          purpose?: string
          user_id?: string
        }
        Relationships: []
      }
      lifecycle_emails: {
        Row: {
          id: string
          kind: string
          sent_at: string
          user_id: string
        }
        Insert: {
          id?: string
          kind: string
          sent_at?: string
          user_id: string
        }
        Update: {
          id?: string
          kind?: string
          sent_at?: string
          user_id?: string
        }
        Relationships: []
      }
      media_library: {
        Row: {
          added_at: string
          created_at: string
          id: string
          name: string | null
          size_bytes: number | null
          storage_path: string | null
          type: string | null
          url: string
          user_id: string
        }
        Insert: {
          added_at?: string
          created_at?: string
          id?: string
          name?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          type?: string | null
          url: string
          user_id: string
        }
        Update: {
          added_at?: string
          created_at?: string
          id?: string
          name?: string | null
          size_bytes?: number | null
          storage_path?: string | null
          type?: string | null
          url?: string
          user_id?: string
        }
        Relationships: []
      }
      offers: {
        Row: {
          buy_quantity: number
          combo_product_ids: string[]
          created_at: string
          discount_percent: number
          get_quantity: number
          gift_product_id: string | null
          id: string
          is_active: boolean
          min_quantity: number
          min_subtotal: number
          name: string
          product_id: string | null
          shipping_fee: number
          store_id: string
          tiers: Json
          type: Database["public"]["Enums"]["offer_type"]
          updated_at: string
          user_id: string
        }
        Insert: {
          buy_quantity?: number
          combo_product_ids?: string[]
          created_at?: string
          discount_percent?: number
          get_quantity?: number
          gift_product_id?: string | null
          id?: string
          is_active?: boolean
          min_quantity?: number
          min_subtotal?: number
          name: string
          product_id?: string | null
          shipping_fee?: number
          store_id: string
          tiers?: Json
          type?: Database["public"]["Enums"]["offer_type"]
          updated_at?: string
          user_id: string
        }
        Update: {
          buy_quantity?: number
          combo_product_ids?: string[]
          created_at?: string
          discount_percent?: number
          get_quantity?: number
          gift_product_id?: string | null
          id?: string
          is_active?: boolean
          min_quantity?: number
          min_subtotal?: number
          name?: string
          product_id?: string | null
          shipping_fee?: number
          store_id?: string
          tiers?: Json
          type?: Database["public"]["Enums"]["offer_type"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "offers_gift_product_id_fkey"
            columns: ["gift_product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "offers_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          product_id: string | null
          quantity: number
          title: string
          unit_price: number
          variant_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          product_id?: string | null
          quantity?: number
          title: string
          unit_price?: number
          variant_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          product_id?: string | null
          quantity?: number
          title?: string
          unit_price?: number
          variant_id?: string | null
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
          {
            foreignKeyName: "order_items_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          amount: number
          coupon_code: string | null
          created_at: string
          currency: string
          customer_email: string | null
          customer_id: string | null
          customer_name: string | null
          customer_phone: string | null
          discount_amount: number
          escrow_released_at: string | null
          id: string
          note: string | null
          order_number: string
          payment_method: string | null
          product_id: string | null
          shipping_address: string | null
          shipping_amount: number
          shipping_city: string | null
          status: Database["public"]["Enums"]["order_status"]
          store_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          escrow_released_at?: string | null
          id?: string
          note?: string | null
          order_number?: string
          payment_method?: string | null
          product_id?: string | null
          shipping_address?: string | null
          shipping_amount?: number
          shipping_city?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          coupon_code?: string | null
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_id?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          discount_amount?: number
          escrow_released_at?: string | null
          id?: string
          note?: string | null
          order_number?: string
          payment_method?: string | null
          product_id?: string | null
          shipping_address?: string | null
          shipping_amount?: number
          shipping_city?: string | null
          status?: Database["public"]["Enums"]["order_status"]
          store_id?: string | null
          updated_at?: string
          user_id?: string
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
            foreignKeyName: "orders_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      plan_promo_codes: {
        Row: {
          billing_period: string | null
          code: string
          created_at: string
          created_by: string | null
          discount_type: string
          discount_value: number
          ends_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_amount: number
          note: string | null
          plan: string | null
          starts_at: string | null
          updated_at: string
          used_count: number
        }
        Insert: {
          billing_period?: string | null
          code: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_amount?: number
          note?: string | null
          plan?: string | null
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Update: {
          billing_period?: string | null
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number
          ends_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_amount?: number
          note?: string | null
          plan?: string | null
          starts_at?: string | null
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          option1: string | null
          option2: string | null
          option3: string | null
          price: number
          product_id: string
          quantity: number
          sku: string | null
          title: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          option1?: string | null
          option2?: string | null
          option3?: string | null
          price?: number
          product_id: string
          quantity?: number
          sku?: string | null
          title?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          option1?: string | null
          option2?: string | null
          option3?: string | null
          price?: number
          product_id?: string
          quantity?: number
          sku?: string | null
          title?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          barcode: string | null
          continue_selling_out_of_stock: boolean
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          images: string[]
          inventory: number
          is_physical: boolean
          name: string
          options: Json
          price: number
          price_compare: number
          price_cost: number
          price_regular: number
          product_type: string | null
          quantity: number
          seo_description: string | null
          seo_title: string | null
          sku: string | null
          slug: string | null
          status: Database["public"]["Enums"]["product_status"]
          store_id: string | null
          tags: string[]
          title: string | null
          track_quantity: boolean
          updated_at: string
          user_id: string
          vendor: string | null
          video_url: string | null
          weight: number
        }
        Insert: {
          barcode?: string | null
          continue_selling_out_of_stock?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[]
          inventory?: number
          is_physical?: boolean
          name: string
          options?: Json
          price?: number
          price_compare?: number
          price_cost?: number
          price_regular?: number
          product_type?: string | null
          quantity?: number
          seo_description?: string | null
          seo_title?: string | null
          sku?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          store_id?: string | null
          tags?: string[]
          title?: string | null
          track_quantity?: boolean
          updated_at?: string
          user_id: string
          vendor?: string | null
          video_url?: string | null
          weight?: number
        }
        Update: {
          barcode?: string | null
          continue_selling_out_of_stock?: boolean
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          images?: string[]
          inventory?: number
          is_physical?: boolean
          name?: string
          options?: Json
          price?: number
          price_compare?: number
          price_cost?: number
          price_regular?: number
          product_type?: string | null
          quantity?: number
          seo_description?: string | null
          seo_title?: string | null
          sku?: string | null
          slug?: string | null
          status?: Database["public"]["Enums"]["product_status"]
          store_id?: string | null
          tags?: string[]
          title?: string | null
          track_quantity?: boolean
          updated_at?: string
          user_id?: string
          vendor?: string | null
          video_url?: string | null
          weight?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          full_name: string | null
          id: string
          onboarding_completed: boolean
          onboarding_completed_at: string | null
          phone: string | null
          updated_at: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id: string
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          phone?: string | null
          updated_at?: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          full_name?: string | null
          id?: string
          onboarding_completed?: boolean
          onboarding_completed_at?: string | null
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      store_integrations: {
        Row: {
          cloudinary_cloud_name: string | null
          created_at: string
          facebook_capi_token: string | null
          facebook_pixel_id: string | null
          facebook_test_event_code: string | null
          ga4_api_secret: string | null
          ga4_measurement_id: string | null
          google_ads_conversion_label: string | null
          google_ads_id: string | null
          google_sheets_url: string | null
          id: string
          store_id: string
          tiktok_access_token: string | null
          tiktok_pixel_id: string | null
          tiktok_test_event_code: string | null
          tracking_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          cloudinary_cloud_name?: string | null
          created_at?: string
          facebook_capi_token?: string | null
          facebook_pixel_id?: string | null
          facebook_test_event_code?: string | null
          ga4_api_secret?: string | null
          ga4_measurement_id?: string | null
          google_ads_conversion_label?: string | null
          google_ads_id?: string | null
          google_sheets_url?: string | null
          id?: string
          store_id: string
          tiktok_access_token?: string | null
          tiktok_pixel_id?: string | null
          tiktok_test_event_code?: string | null
          tracking_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          cloudinary_cloud_name?: string | null
          created_at?: string
          facebook_capi_token?: string | null
          facebook_pixel_id?: string | null
          facebook_test_event_code?: string | null
          ga4_api_secret?: string | null
          ga4_measurement_id?: string | null
          google_ads_conversion_label?: string | null
          google_ads_id?: string | null
          google_sheets_url?: string | null
          id?: string
          store_id?: string
          tiktok_access_token?: string | null
          tiktok_pixel_id?: string | null
          tiktok_test_event_code?: string | null
          tracking_enabled?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_integrations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      store_members: {
        Row: {
          accepted_at: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          invite_token: string
          invited_at: string
          owner_id: string
          permissions: string[]
          role: Database["public"]["Enums"]["store_member_role"]
          status: Database["public"]["Enums"]["store_member_status"]
          store_id: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          invite_token: string
          invited_at?: string
          owner_id: string
          permissions?: string[]
          role?: Database["public"]["Enums"]["store_member_role"]
          status?: Database["public"]["Enums"]["store_member_status"]
          store_id: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          invite_token?: string
          invited_at?: string
          owner_id?: string
          permissions?: string[]
          role?: Database["public"]["Enums"]["store_member_role"]
          status?: Database["public"]["Enums"]["store_member_status"]
          store_id?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_members_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          color_palette: string | null
          contact_address: string | null
          contact_city: string | null
          contact_email: string | null
          contact_phone: string | null
          country: string | null
          created_at: string
          currency: string
          custom_domain: string | null
          delivery_mode: string | null
          description: string | null
          email_notifications: boolean
          experience_level: string | null
          favicon_url: string | null
          id: string
          is_published: boolean
          is_suspended: boolean
          language: string
          legal_notice: string | null
          legal_privacy: string | null
          legal_terms: string | null
          logo_url: string | null
          monthly_revenue: string | null
          social_facebook: string | null
          social_instagram: string | null
          social_tiktok: string | null
          social_whatsapp: string | null
          social_youtube: string | null
          store_name: string
          subdomain: string | null
          suspended_at: string | null
          suspended_reason: string | null
          team_size: string | null
          theme_config: Json
          theme_published: Json
          theme_published_at: string | null
          updated_at: string
          user_id: string
          web_notifications: boolean
        }
        Insert: {
          color_palette?: string | null
          contact_address?: string | null
          contact_city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          custom_domain?: string | null
          delivery_mode?: string | null
          description?: string | null
          email_notifications?: boolean
          experience_level?: string | null
          favicon_url?: string | null
          id?: string
          is_published?: boolean
          is_suspended?: boolean
          language?: string
          legal_notice?: string | null
          legal_privacy?: string | null
          legal_terms?: string | null
          logo_url?: string | null
          monthly_revenue?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_tiktok?: string | null
          social_whatsapp?: string | null
          social_youtube?: string | null
          store_name?: string
          subdomain?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          team_size?: string | null
          theme_config?: Json
          theme_published?: Json
          theme_published_at?: string | null
          updated_at?: string
          user_id: string
          web_notifications?: boolean
        }
        Update: {
          color_palette?: string | null
          contact_address?: string | null
          contact_city?: string | null
          contact_email?: string | null
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          custom_domain?: string | null
          delivery_mode?: string | null
          description?: string | null
          email_notifications?: boolean
          experience_level?: string | null
          favicon_url?: string | null
          id?: string
          is_published?: boolean
          is_suspended?: boolean
          language?: string
          legal_notice?: string | null
          legal_privacy?: string | null
          legal_terms?: string | null
          logo_url?: string | null
          monthly_revenue?: string | null
          social_facebook?: string | null
          social_instagram?: string | null
          social_tiktok?: string | null
          social_whatsapp?: string | null
          social_youtube?: string | null
          store_name?: string
          subdomain?: string | null
          suspended_at?: string | null
          suspended_reason?: string | null
          team_size?: string | null
          theme_config?: Json
          theme_published?: Json
          theme_published_at?: string | null
          updated_at?: string
          user_id?: string
          web_notifications?: boolean
        }
        Relationships: []
      }
      store_subscriptions: {
        Row: {
          ai_period_start: string
          ai_used: number
          amount: number
          billing_period: string
          chat_extra: number
          chat_period_start: string | null
          chat_used: number
          created_at: string
          currency: string
          id: string
          notes: string | null
          period_end: string | null
          period_start: string | null
          plan: string
          provider: string | null
          provider_ref: string | null
          status: string
          store_id: string
          trial_ends_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          ai_period_start?: string
          ai_used?: number
          amount?: number
          billing_period?: string
          chat_extra?: number
          chat_period_start?: string | null
          chat_used?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          plan?: string
          provider?: string | null
          provider_ref?: string | null
          status?: string
          store_id: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          ai_period_start?: string
          ai_used?: number
          amount?: number
          billing_period?: string
          chat_extra?: number
          chat_period_start?: string | null
          chat_used?: number
          created_at?: string
          currency?: string
          id?: string
          notes?: string | null
          period_end?: string | null
          period_start?: string | null
          plan?: string
          provider?: string | null
          provider_ref?: string | null
          status?: string
          store_id?: string
          trial_ends_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_subscriptions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      store_visits: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string
          device: string | null
          id: string
          path: string
          referrer: string | null
          session_id: string | null
          store_id: string
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string | null
          store_id: string
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device?: string | null
          id?: string
          path?: string
          referrer?: string | null
          session_id?: string | null
          store_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "store_visits_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      store_whatsapp: {
        Row: {
          access_token: string | null
          business_id: string | null
          connect_mode: string
          connected_at: string | null
          created_at: string
          display_phone: string | null
          faq: Json
          greeting: string | null
          is_active: boolean
          last_error: string | null
          phone_number_id: string | null
          store_id: string
          updated_at: string
          user_id: string
          verify_token: string
          waba_id: string | null
        }
        Insert: {
          access_token?: string | null
          business_id?: string | null
          connect_mode?: string
          connected_at?: string | null
          created_at?: string
          display_phone?: string | null
          faq?: Json
          greeting?: string | null
          is_active?: boolean
          last_error?: string | null
          phone_number_id?: string | null
          store_id: string
          updated_at?: string
          user_id: string
          verify_token?: string
          waba_id?: string | null
        }
        Update: {
          access_token?: string | null
          business_id?: string | null
          connect_mode?: string
          connected_at?: string | null
          created_at?: string
          display_phone?: string | null
          faq?: Json
          greeting?: string | null
          is_active?: boolean
          last_error?: string | null
          phone_number_id?: string | null
          store_id?: string
          updated_at?: string
          user_id?: string
          verify_token?: string
          waba_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_whatsapp_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: true
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_payments: {
        Row: {
          amount: number
          base_amount: number | null
          billing_period: string
          completed_at: string | null
          correspondent: string | null
          created_at: string
          currency: string
          discount_amount: number
          failure_reason: string | null
          id: string
          payload: Json
          phone: string | null
          plan: string
          promo_code: string | null
          provider: string
          provider_ref: string | null
          status: string
          store_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          base_amount?: number | null
          billing_period?: string
          completed_at?: string | null
          correspondent?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number
          failure_reason?: string | null
          id?: string
          payload?: Json
          phone?: string | null
          plan: string
          promo_code?: string | null
          provider: string
          provider_ref?: string | null
          status?: string
          store_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          base_amount?: number | null
          billing_period?: string
          completed_at?: string | null
          correspondent?: string | null
          created_at?: string
          currency?: string
          discount_amount?: number
          failure_reason?: string | null
          id?: string
          payload?: Json
          phone?: string | null
          plan?: string
          promo_code?: string | null
          provider?: string
          provider_ref?: string | null
          status?: string
          store_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_payments_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      theme_versions: {
        Row: {
          config: Json
          created_at: string
          id: string
          kind: string
          label: string | null
          store_id: string
          user_id: string
        }
        Insert: {
          config: Json
          created_at?: string
          id?: string
          kind?: string
          label?: string | null
          store_id: string
          user_id: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          kind?: string
          label?: string | null
          store_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "theme_versions_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      trending_ads: {
        Row: {
          advertiser: string | null
          category: string
          country: string
          created_at: string
          days_active: number
          description: string
          engagement: number
          gender: string
          id: string
          is_active: boolean
          last_seen: string
          likes: number
          media_url: string | null
          platform: string
          sales_model: string
          score: number
          snapshot_url: string | null
          source_key: string | null
          source_url: string | null
          start_date: string | null
          status: string
          tags: string[]
          thumbnail_url: string | null
          title: string
          video_url: string | null
          why_it_sells: string
        }
        Insert: {
          advertiser?: string | null
          category?: string
          country?: string
          created_at?: string
          days_active?: number
          description?: string
          engagement?: number
          gender?: string
          id?: string
          is_active?: boolean
          last_seen?: string
          likes?: number
          media_url?: string | null
          platform?: string
          sales_model?: string
          score?: number
          snapshot_url?: string | null
          source_key?: string | null
          source_url?: string | null
          start_date?: string | null
          status?: string
          tags?: string[]
          thumbnail_url?: string | null
          title: string
          video_url?: string | null
          why_it_sells?: string
        }
        Update: {
          advertiser?: string | null
          category?: string
          country?: string
          created_at?: string
          days_active?: number
          description?: string
          engagement?: number
          gender?: string
          id?: string
          is_active?: boolean
          last_seen?: string
          likes?: number
          media_url?: string | null
          platform?: string
          sales_model?: string
          score?: number
          snapshot_url?: string | null
          source_key?: string | null
          source_url?: string | null
          start_date?: string | null
          status?: string
          tags?: string[]
          thumbnail_url?: string | null
          title?: string
          video_url?: string | null
          why_it_sells?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      user_security: {
        Row: {
          created_at: string
          email_2fa_enabled: boolean
          email_2fa_session_id: string | null
          email_2fa_verified_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          email_2fa_enabled?: boolean
          email_2fa_session_id?: string | null
          email_2fa_verified_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          email_2fa_enabled?: boolean
          email_2fa_session_id?: string | null
          email_2fa_verified_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      whatsapp_conversations: {
        Row: {
          created_at: string
          data: Json
          id: string
          last_message_at: string
          state: string
          store_id: string
          updated_at: string
          wa_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          id?: string
          last_message_at?: string
          state?: string
          store_id: string
          updated_at?: string
          wa_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          id?: string
          last_message_at?: string
          state?: string
          store_id?: string
          updated_at?: string
          wa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_conversations_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_messages: {
        Row: {
          body: string | null
          created_at: string
          direction: string
          id: string
          store_id: string
          wa_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          direction: string
          id?: string
          store_id: string
          wa_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          direction?: string
          id?: string
          store_id?: string
          wa_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_messages_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_settings"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      best_plan_key: { Args: { _user_id: string }; Returns: string }
      consume_coupon: {
        Args: { _code: string; _store_id: string }
        Returns: undefined
      }
      effective_plan_key: { Args: { _store_id: string }; Returns: string }
      effective_plan_key_for_user: {
        Args: { _user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_custom_domain_available: {
        Args: { _domain: string; _store_id?: string }
        Returns: boolean
      }
      is_store_link_available: {
        Args: { _link: string; _store_id?: string }
        Returns: boolean
      }
      order_in_published_store: {
        Args: { _order_id: string }
        Returns: boolean
      }
      plan_product_limit: { Args: { _plan: string }; Returns: number }
      plan_store_limit: { Args: { _plan: string }; Returns: number }
      storefront_tracking: { Args: { _store_id: string }; Returns: Json }
    }
    Enums: {
      app_role: "admin" | "user"
      coupon_type: "percent" | "fixed"
      offer_type: "quantity" | "bogo" | "free_shipping" | "combo"
      order_status:
        | "pending"
        | "processing"
        | "in_escrow"
        | "completed"
        | "cancelled"
        | "refunded"
        | "scheduled"
        | "shipping"
        | "unreachable"
      product_status: "draft" | "active" | "archived"
      store_member_role: "closer" | "products" | "courier" | "admin"
      store_member_status: "pending" | "active" | "inactive"
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
      coupon_type: ["percent", "fixed"],
      offer_type: ["quantity", "bogo", "free_shipping", "combo"],
      order_status: [
        "pending",
        "processing",
        "in_escrow",
        "completed",
        "cancelled",
        "refunded",
        "scheduled",
        "shipping",
        "unreachable",
      ],
      product_status: ["draft", "active", "archived"],
      store_member_role: ["closer", "products", "courier", "admin"],
      store_member_status: ["pending", "active", "inactive"],
    },
  },
} as const
