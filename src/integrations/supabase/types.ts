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
      ai_analysis_uses: {
        Row: {
          id: string
          used_at: string
          user_id: string
        }
        Insert: {
          id?: string
          used_at?: string
          user_id: string
        }
        Update: {
          id?: string
          used_at?: string
          user_id?: string
        }
        Relationships: []
      }
      ai_credit_transactions: {
        Row: {
          created_at: string
          delta: number
          expires_at: string | null
          id: string
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          expires_at?: string | null
          id?: string
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          expires_at?: string | null
          id?: string
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      auth_exchange_codes: {
        Row: {
          code: string
          created_at: string
          expires_at: string
          id: string
          used: boolean
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          expires_at: string
          id?: string
          used?: boolean
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          expires_at?: string
          id?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      brand_sources: {
        Row: {
          brand_id: string
          created_by: string | null
          fetched_at: string
          id: string
          notes: string | null
          source_date: string | null
          source_type: Database["public"]["Enums"]["data_source_type"]
          source_url: string | null
        }
        Insert: {
          brand_id: string
          created_by?: string | null
          fetched_at?: string
          id?: string
          notes?: string | null
          source_date?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"]
          source_url?: string | null
        }
        Update: {
          brand_id?: string
          created_by?: string | null
          fetched_at?: string
          id?: string
          notes?: string | null
          source_date?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"]
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "brand_sources_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
        ]
      }
      brands: {
        Row: {
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          country: string | null
          created_at: string
          description: string | null
          founded_year: number | null
          id: string
          is_sa_brand: boolean | null
          last_verified_at: string | null
          logo_url: string | null
          name: string
          slug: string
          source_date: string | null
          source_type: Database["public"]["Enums"]["data_source_type"] | null
          source_url: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["data_quality_status"]
          verified_by: string | null
          website_url: string | null
        }
        Insert: {
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          country?: string | null
          created_at?: string
          description?: string | null
          founded_year?: number | null
          id?: string
          is_sa_brand?: boolean | null
          last_verified_at?: string | null
          logo_url?: string | null
          name: string
          slug: string
          source_date?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"] | null
          source_url?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
          verified_by?: string | null
          website_url?: string | null
        }
        Update: {
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          country?: string | null
          created_at?: string
          description?: string | null
          founded_year?: number | null
          id?: string
          is_sa_brand?: boolean | null
          last_verified_at?: string | null
          logo_url?: string | null
          name?: string
          slug?: string
          source_date?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"] | null
          source_url?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
          verified_by?: string | null
          website_url?: string | null
        }
        Relationships: []
      }
      business_enquiries: {
        Row: {
          budget_range: string | null
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone: string | null
          country: string | null
          created_at: string
          id: string
          project_brief: string | null
          services_interested: string[] | null
          status: string
          timeline: string | null
          updated_at: string
        }
        Insert: {
          budget_range?: string | null
          company_name: string
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          project_brief?: string | null
          services_interested?: string[] | null
          status?: string
          timeline?: string | null
          updated_at?: string
        }
        Update: {
          budget_range?: string | null
          company_name?: string
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          id?: string
          project_brief?: string | null
          services_interested?: string[] | null
          status?: string
          timeline?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          created_at: string
          description: string | null
          id: string
          name: string
          parent_category_id: string | null
          slug: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          name: string
          parent_category_id?: string | null
          slug: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          parent_category_id?: string | null
          slug?: string
        }
        Relationships: [
          {
            foreignKeyName: "categories_parent_category_id_fkey"
            columns: ["parent_category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      climate_profiles: {
        Row: {
          humidity_level: string | null
          id: string
          name: string
          region_description: string | null
          slug: string
          temperature_profile: string | null
          uv_index_level: string | null
        }
        Insert: {
          humidity_level?: string | null
          id?: string
          name: string
          region_description?: string | null
          slug: string
          temperature_profile?: string | null
          uv_index_level?: string | null
        }
        Update: {
          humidity_level?: string | null
          id?: string
          name?: string
          region_description?: string | null
          slug?: string
          temperature_profile?: string | null
          uv_index_level?: string | null
        }
        Relationships: []
      }
      credit_packs: {
        Row: {
          credits: number
          expires_after_days: number | null
          is_active: boolean
          name: string
          pack_id: string
          price: number
          sort_order: number
          variant_key: string
        }
        Insert: {
          credits: number
          expires_after_days?: number | null
          is_active?: boolean
          name: string
          pack_id: string
          price: number
          sort_order?: number
          variant_key?: string
        }
        Update: {
          credits?: number
          expires_after_days?: number | null
          is_active?: boolean
          name?: string
          pack_id?: string
          price?: number
          sort_order?: number
          variant_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "credit_packs_variant_key_fkey"
            columns: ["variant_key"]
            isOneToOne: false
            referencedRelation: "pricing_experiment_variants"
            referencedColumns: ["variant_key"]
          },
        ]
      }
      custom_formula_requests: {
        Row: {
          allergens: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          delivery_address: string | null
          id: string
          key_ingredients: string | null
          notes: string | null
          product_type: string
          scent_preference: string | null
          skin_goals: string[] | null
          status: string
          texture_preference: string | null
          updated_at: string
          user_id: string | null
        }
        Insert: {
          allergens?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          delivery_address?: string | null
          id?: string
          key_ingredients?: string | null
          notes?: string | null
          product_type: string
          scent_preference?: string | null
          skin_goals?: string[] | null
          status?: string
          texture_preference?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          allergens?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          delivery_address?: string | null
          id?: string
          key_ingredients?: string | null
          notes?: string | null
          product_type?: string
          scent_preference?: string | null
          skin_goals?: string[] | null
          status?: string
          texture_preference?: string | null
          updated_at?: string
          user_id?: string | null
        }
        Relationships: []
      }
      founding_member_offers: {
        Row: {
          benefits: Json
          duration_months: number | null
          ends_at: string | null
          grants_plan: string
          id: string
          is_active: boolean
          member_cap: number
          name: string
          price: number
          redeemed_count: number
          starts_at: string
          variant_key: string
        }
        Insert: {
          benefits?: Json
          duration_months?: number | null
          ends_at?: string | null
          grants_plan?: string
          id?: string
          is_active?: boolean
          member_cap: number
          name?: string
          price: number
          redeemed_count?: number
          starts_at?: string
          variant_key?: string
        }
        Update: {
          benefits?: Json
          duration_months?: number | null
          ends_at?: string | null
          grants_plan?: string
          id?: string
          is_active?: boolean
          member_cap?: number
          name?: string
          price?: number
          redeemed_count?: number
          starts_at?: string
          variant_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "founding_member_offers_variant_key_fkey"
            columns: ["variant_key"]
            isOneToOne: false
            referencedRelation: "pricing_experiment_variants"
            referencedColumns: ["variant_key"]
          },
        ]
      }
      ingredient_concerns: {
        Row: {
          concern_id: string
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          id: string
          ingredient_id: string
          notes: string | null
          relationship: Database["public"]["Enums"]["ingredient_concern_relationship"]
          source_url: string | null
        }
        Insert: {
          concern_id: string
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          id?: string
          ingredient_id: string
          notes?: string | null
          relationship: Database["public"]["Enums"]["ingredient_concern_relationship"]
          source_url?: string | null
        }
        Update: {
          concern_id?: string
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          id?: string
          ingredient_id?: string
          notes?: string | null
          relationship?: Database["public"]["Enums"]["ingredient_concern_relationship"]
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_concerns_concern_id_fkey"
            columns: ["concern_id"]
            isOneToOne: false
            referencedRelation: "skin_concerns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_concerns_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredient_interactions: {
        Row: {
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          id: string
          ingredient_a_id: string
          ingredient_b_id: string
          interaction_type: Database["public"]["Enums"]["ingredient_interaction_type"]
          notes: string | null
          source_url: string | null
        }
        Insert: {
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          id?: string
          ingredient_a_id: string
          ingredient_b_id: string
          interaction_type: Database["public"]["Enums"]["ingredient_interaction_type"]
          notes?: string | null
          source_url?: string | null
        }
        Update: {
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          id?: string
          ingredient_a_id?: string
          ingredient_b_id?: string
          interaction_type?: Database["public"]["Enums"]["ingredient_interaction_type"]
          notes?: string | null
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_interactions_ingredient_a_id_fkey"
            columns: ["ingredient_a_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "ingredient_interactions_ingredient_b_id_fkey"
            columns: ["ingredient_b_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          common_name: string | null
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          created_at: string
          description: string | null
          evidence_level: Database["public"]["Enums"]["evidence_level"] | null
          function_summary: string | null
          id: string
          inci_name: string
          irritancy_risk: Database["public"]["Enums"]["irritancy_risk"] | null
          last_verified_at: string | null
          pregnancy_safe: boolean | null
          slug: string
          source_date: string | null
          source_type: Database["public"]["Enums"]["data_source_type"] | null
          source_url: string | null
          typical_concentration_range: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["data_quality_status"]
          verified_by: string | null
        }
        Insert: {
          common_name?: string | null
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          created_at?: string
          description?: string | null
          evidence_level?: Database["public"]["Enums"]["evidence_level"] | null
          function_summary?: string | null
          id?: string
          inci_name: string
          irritancy_risk?: Database["public"]["Enums"]["irritancy_risk"] | null
          last_verified_at?: string | null
          pregnancy_safe?: boolean | null
          slug: string
          source_date?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"] | null
          source_url?: string | null
          typical_concentration_range?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
          verified_by?: string | null
        }
        Update: {
          common_name?: string | null
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          created_at?: string
          description?: string | null
          evidence_level?: Database["public"]["Enums"]["evidence_level"] | null
          function_summary?: string | null
          id?: string
          inci_name?: string
          irritancy_risk?: Database["public"]["Enums"]["irritancy_risk"] | null
          last_verified_at?: string | null
          pregnancy_safe?: boolean | null
          slug?: string
          source_date?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"] | null
          source_url?: string | null
          typical_concentration_range?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
          verified_by?: string | null
        }
        Relationships: []
      }
      news_article_engagement: {
        Row: {
          article_id: string
          created_at: string
          id: string
          kind: string
          user_id: string
        }
        Insert: {
          article_id: string
          created_at?: string
          id?: string
          kind: string
          user_id: string
        }
        Update: {
          article_id?: string
          created_at?: string
          id?: string
          kind?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_article_engagement_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_article_engagement_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      news_article_views: {
        Row: {
          article_id: string
          id: string
          view_date: string
          views: number
        }
        Insert: {
          article_id: string
          id?: string
          view_date?: string
          views?: number
        }
        Update: {
          article_id?: string
          id?: string
          view_date?: string
          views?: number
        }
        Relationships: [
          {
            foreignKeyName: "news_article_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_article_views_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      news_articles: {
        Row: {
          body_markdown: string
          cover_credit_name: string | null
          cover_credit_url: string | null
          cover_image_alt: string | null
          cover_image_url: string | null
          created_at: string
          excerpt: string
          id: string
          inline_images: Json
          is_premium: boolean
          json_ld: Json | null
          key_takeaways: string[]
          publish_date: string
          reading_time: string
          sa_context_tag: string
          seo_description: string | null
          seo_title: string | null
          slug: string
          source_name: string
          source_url: string
          status: string
          title: string
          updated_at: string
          view_count: number
          word_count: number
        }
        Insert: {
          body_markdown?: string
          cover_credit_name?: string | null
          cover_credit_url?: string | null
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          inline_images?: Json
          is_premium?: boolean
          json_ld?: Json | null
          key_takeaways?: string[]
          publish_date?: string
          reading_time?: string
          sa_context_tag?: string
          seo_description?: string | null
          seo_title?: string | null
          slug: string
          source_name?: string
          source_url?: string
          status?: string
          title: string
          updated_at?: string
          view_count?: number
          word_count?: number
        }
        Update: {
          body_markdown?: string
          cover_credit_name?: string | null
          cover_credit_url?: string | null
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string
          excerpt?: string
          id?: string
          inline_images?: Json
          is_premium?: boolean
          json_ld?: Json | null
          key_takeaways?: string[]
          publish_date?: string
          reading_time?: string
          sa_context_tag?: string
          seo_description?: string | null
          seo_title?: string | null
          slug?: string
          source_name?: string
          source_url?: string
          status?: string
          title?: string
          updated_at?: string
          view_count?: number
          word_count?: number
        }
        Relationships: []
      }
      news_comments: {
        Row: {
          article_id: string
          author_name: string
          body: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          article_id: string
          author_name?: string
          body: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          article_id?: string
          author_name?: string
          body?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "news_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "news_comments_article_id_fkey"
            columns: ["article_id"]
            isOneToOne: false
            referencedRelation: "news_articles_public"
            referencedColumns: ["id"]
          },
        ]
      }
      news_sync_runs: {
        Row: {
          ai_calls: number
          articles_created: number
          created_at: string
          detail: string | null
          firecrawl_calls: number
          id: string
          run_date: string
          status: string
        }
        Insert: {
          ai_calls?: number
          articles_created?: number
          created_at?: string
          detail?: string | null
          firecrawl_calls?: number
          id?: string
          run_date?: string
          status?: string
        }
        Update: {
          ai_calls?: number
          articles_created?: number
          created_at?: string
          detail?: string | null
          firecrawl_calls?: number
          id?: string
          run_date?: string
          status?: string
        }
        Relationships: []
      }
      newsletter_subscribers: {
        Row: {
          email: string
          id: string
          is_active: boolean
          subscribed_at: string
        }
        Insert: {
          email: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Update: {
          email?: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
        }
        Relationships: []
      }
      openhaus_waitlist: {
        Row: {
          city: string
          country: string
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          phone: string
        }
        Insert: {
          city: string
          country: string
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          phone: string
        }
        Update: {
          city?: string
          country?: string
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          phone?: string
        }
        Relationships: []
      }
      partner_enquiries: {
        Row: {
          audience_size: string | null
          business_name: string
          business_type: string | null
          country: string | null
          created_at: string
          full_name: string
          id: string
          message: string | null
          partnership_model: string
          status: string
          updated_at: string
          website: string | null
          work_email: string
        }
        Insert: {
          audience_size?: string | null
          business_name: string
          business_type?: string | null
          country?: string | null
          created_at?: string
          full_name: string
          id?: string
          message?: string | null
          partnership_model: string
          status?: string
          updated_at?: string
          website?: string | null
          work_email: string
        }
        Update: {
          audience_size?: string | null
          business_name?: string
          business_type?: string | null
          country?: string | null
          created_at?: string
          full_name?: string
          id?: string
          message?: string | null
          partnership_model?: string
          status?: string
          updated_at?: string
          website?: string | null
          work_email?: string
        }
        Relationships: []
      }
      preorders: {
        Row: {
          amount: number
          created_at: string
          id: string
          payment_id: string | null
          product_type: string
          status: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          id?: string
          payment_id?: string | null
          product_type?: string
          status?: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          id?: string
          payment_id?: string | null
          product_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      pricing_experiment_variants: {
        Row: {
          created_at: string
          description: string | null
          is_active: boolean
          traffic_weight: number
          variant_key: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          traffic_weight?: number
          variant_key: string
        }
        Update: {
          created_at?: string
          description?: string | null
          is_active?: boolean
          traffic_weight?: number
          variant_key?: string
        }
        Relationships: []
      }
      pricing_plans: {
        Row: {
          badge: string | null
          benefits: Json
          cta_label: string
          cta_override: string | null
          is_purchasable: boolean
          money_back_days: number | null
          name: string
          plan_id: string
          price_annual: number
          price_monthly: number
          sort_order: number
          tagline: string
          trial_days: number
          trial_eligible: boolean
          updated_at: string
          variant_key: string
        }
        Insert: {
          badge?: string | null
          benefits?: Json
          cta_label: string
          cta_override?: string | null
          is_purchasable?: boolean
          money_back_days?: number | null
          name: string
          plan_id: string
          price_annual: number
          price_monthly: number
          sort_order?: number
          tagline: string
          trial_days?: number
          trial_eligible?: boolean
          updated_at?: string
          variant_key?: string
        }
        Update: {
          badge?: string | null
          benefits?: Json
          cta_label?: string
          cta_override?: string | null
          is_purchasable?: boolean
          money_back_days?: number | null
          name?: string
          plan_id?: string
          price_annual?: number
          price_monthly?: number
          sort_order?: number
          tagline?: string
          trial_days?: number
          trial_eligible?: boolean
          updated_at?: string
          variant_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_plans_variant_key_fkey"
            columns: ["variant_key"]
            isOneToOne: false
            referencedRelation: "pricing_experiment_variants"
            referencedColumns: ["variant_key"]
          },
        ]
      }
      pricing_settings: {
        Row: {
          default_billing_interval: string
          free_ai_analysis_allowance: number
          variant_key: string
        }
        Insert: {
          default_billing_interval?: string
          free_ai_analysis_allowance?: number
          variant_key?: string
        }
        Update: {
          default_billing_interval?: string
          free_ai_analysis_allowance?: number
          variant_key?: string
        }
        Relationships: [
          {
            foreignKeyName: "pricing_settings_variant_key_fkey"
            columns: ["variant_key"]
            isOneToOne: true
            referencedRelation: "pricing_experiment_variants"
            referencedColumns: ["variant_key"]
          },
        ]
      }
      product_claims: {
        Row: {
          claim_text: string
          claim_type: Database["public"]["Enums"]["claim_type"]
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          created_at: string
          id: string
          is_substantiated: boolean
          last_verified_at: string | null
          product_id: string
          source_date: string | null
          source_type: Database["public"]["Enums"]["data_source_type"] | null
          source_url: string | null
          substantiation_notes: string | null
          substantiation_source_url: string | null
          verification_status: Database["public"]["Enums"]["data_quality_status"]
          verified_by: string | null
        }
        Insert: {
          claim_text: string
          claim_type?: Database["public"]["Enums"]["claim_type"]
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          created_at?: string
          id?: string
          is_substantiated?: boolean
          last_verified_at?: string | null
          product_id: string
          source_date?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"] | null
          source_url?: string | null
          substantiation_notes?: string | null
          substantiation_source_url?: string | null
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
          verified_by?: string | null
        }
        Update: {
          claim_text?: string
          claim_type?: Database["public"]["Enums"]["claim_type"]
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          created_at?: string
          id?: string
          is_substantiated?: boolean
          last_verified_at?: string | null
          product_id?: string
          source_date?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"] | null
          source_url?: string | null
          substantiation_notes?: string | null
          substantiation_source_url?: string | null
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_claims_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_climate_fit: {
        Row: {
          climate_profile_id: string
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          fit_score: number | null
          id: string
          last_verified_at: string | null
          methodology_version: string | null
          product_id: string
          rationale: string | null
          verification_status: Database["public"]["Enums"]["data_quality_status"]
        }
        Insert: {
          climate_profile_id: string
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          fit_score?: number | null
          id?: string
          last_verified_at?: string | null
          methodology_version?: string | null
          product_id: string
          rationale?: string | null
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
        }
        Update: {
          climate_profile_id?: string
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          fit_score?: number | null
          id?: string
          last_verified_at?: string | null
          methodology_version?: string | null
          product_id?: string
          rationale?: string | null
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
        }
        Relationships: [
          {
            foreignKeyName: "product_climate_fit_climate_profile_id_fkey"
            columns: ["climate_profile_id"]
            isOneToOne: false
            referencedRelation: "climate_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_climate_fit_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_concerns: {
        Row: {
          concern_id: string
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          id: string
          notes: string | null
          product_id: string
        }
        Insert: {
          concern_id: string
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          id?: string
          notes?: string | null
          product_id: string
        }
        Update: {
          concern_id?: string
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          id?: string
          notes?: string | null
          product_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_concerns_concern_id_fkey"
            columns: ["concern_id"]
            isOneToOne: false
            referencedRelation: "skin_concerns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_concerns_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_ingredients: {
        Row: {
          concentration_percent: number | null
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          id: string
          ingredient_id: string
          is_key_ingredient: boolean
          last_verified_at: string | null
          position: number | null
          product_version_id: string
          source_date: string | null
          source_type: Database["public"]["Enums"]["data_source_type"] | null
          source_url: string | null
          verification_status: Database["public"]["Enums"]["data_quality_status"]
          verified_by: string | null
        }
        Insert: {
          concentration_percent?: number | null
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          id?: string
          ingredient_id: string
          is_key_ingredient?: boolean
          last_verified_at?: string | null
          position?: number | null
          product_version_id: string
          source_date?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"] | null
          source_url?: string | null
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
          verified_by?: string | null
        }
        Update: {
          concentration_percent?: number | null
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          id?: string
          ingredient_id?: string
          is_key_ingredient?: boolean
          last_verified_at?: string | null
          position?: number | null
          product_version_id?: string
          source_date?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"] | null
          source_url?: string | null
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_ingredients_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_ingredients_product_version_id_fkey"
            columns: ["product_version_id"]
            isOneToOne: false
            referencedRelation: "product_versions"
            referencedColumns: ["id"]
          },
        ]
      }
      product_prices: {
        Row: {
          currency: string
          id: string
          price_zar: number
          recorded_at: string
          recorded_by: string | null
          retailer_product_id: string
          source_type: Database["public"]["Enums"]["data_source_type"]
          source_url: string | null
          verification_status: Database["public"]["Enums"]["data_quality_status"]
        }
        Insert: {
          currency?: string
          id?: string
          price_zar: number
          recorded_at?: string
          recorded_by?: string | null
          retailer_product_id: string
          source_type?: Database["public"]["Enums"]["data_source_type"]
          source_url?: string | null
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
        }
        Update: {
          currency?: string
          id?: string
          price_zar?: number
          recorded_at?: string
          recorded_by?: string | null
          retailer_product_id?: string
          source_type?: Database["public"]["Enums"]["data_source_type"]
          source_url?: string | null
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
        }
        Relationships: [
          {
            foreignKeyName: "product_prices_retailer_product_id_fkey"
            columns: ["retailer_product_id"]
            isOneToOne: false
            referencedRelation: "current_product_prices"
            referencedColumns: ["retailer_product_id"]
          },
          {
            foreignKeyName: "product_prices_retailer_product_id_fkey"
            columns: ["retailer_product_id"]
            isOneToOne: false
            referencedRelation: "retailer_products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_scores: {
        Row: {
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          id: string
          last_verified_at: string | null
          methodology_version: string
          notes: string | null
          product_id: string
          score: number
          score_type: string
          scored_at: string
          scored_by: string | null
          source_url: string | null
          verification_status: Database["public"]["Enums"]["data_quality_status"]
        }
        Insert: {
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          id?: string
          last_verified_at?: string | null
          methodology_version: string
          notes?: string | null
          product_id: string
          score: number
          score_type: string
          scored_at?: string
          scored_by?: string | null
          source_url?: string | null
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
        }
        Update: {
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          id?: string
          last_verified_at?: string | null
          methodology_version?: string
          notes?: string | null
          product_id?: string
          score?: number
          score_type?: string
          scored_at?: string
          scored_by?: string | null
          source_url?: string | null
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
        }
        Relationships: [
          {
            foreignKeyName: "product_scores_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_skin_type_fit: {
        Row: {
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          fit_rating: Database["public"]["Enums"]["skin_fit_rating"]
          id: string
          notes: string | null
          product_id: string
          skin_type_id: string
        }
        Insert: {
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          fit_rating: Database["public"]["Enums"]["skin_fit_rating"]
          id?: string
          notes?: string | null
          product_id: string
          skin_type_id: string
        }
        Update: {
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          fit_rating?: Database["public"]["Enums"]["skin_fit_rating"]
          id?: string
          notes?: string | null
          product_id?: string
          skin_type_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_skin_type_fit_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_skin_type_fit_skin_type_id_fkey"
            columns: ["skin_type_id"]
            isOneToOne: false
            referencedRelation: "skin_types"
            referencedColumns: ["id"]
          },
        ]
      }
      product_sources: {
        Row: {
          created_by: string | null
          fetched_at: string
          id: string
          notes: string | null
          product_id: string
          source_date: string | null
          source_type: Database["public"]["Enums"]["data_source_type"]
          source_url: string | null
        }
        Insert: {
          created_by?: string | null
          fetched_at?: string
          id?: string
          notes?: string | null
          product_id: string
          source_date?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"]
          source_url?: string | null
        }
        Update: {
          created_by?: string | null
          fetched_at?: string
          id?: string
          notes?: string | null
          product_id?: string
          source_date?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"]
          source_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_sources_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          created_at: string
          id: string
          is_default: boolean
          product_id: string
          size_ml: number | null
          sku: string | null
          variant_label: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_default?: boolean
          product_id: string
          size_ml?: number | null
          sku?: string | null
          variant_label: string
        }
        Update: {
          created_at?: string
          id?: string
          is_default?: boolean
          product_id?: string
          size_ml?: number | null
          sku?: string | null
          variant_label?: string
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
      product_versions: {
        Row: {
          created_at: string
          effective_from: string | null
          effective_to: string | null
          id: string
          is_current: boolean
          product_id: string
          reformulation_notes: string | null
          source_type: Database["public"]["Enums"]["data_source_type"] | null
          source_url: string | null
          verification_status: Database["public"]["Enums"]["data_quality_status"]
          version_label: string
        }
        Insert: {
          created_at?: string
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          is_current?: boolean
          product_id: string
          reformulation_notes?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"] | null
          source_url?: string | null
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
          version_label: string
        }
        Update: {
          created_at?: string
          effective_from?: string | null
          effective_to?: string | null
          id?: string
          is_current?: boolean
          product_id?: string
          reformulation_notes?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"] | null
          source_url?: string | null
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
          version_label?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_versions_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          brand_id: string
          category_id: string | null
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          created_at: string
          description: string | null
          discontinued_at: string | null
          id: string
          image_url: string | null
          is_discontinued: boolean
          last_verified_at: string | null
          launch_date: string | null
          name: string
          slug: string
          source_date: string | null
          source_type: Database["public"]["Enums"]["data_source_type"] | null
          source_url: string | null
          updated_at: string
          verification_status: Database["public"]["Enums"]["data_quality_status"]
          verified_by: string | null
        }
        Insert: {
          brand_id: string
          category_id?: string | null
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          created_at?: string
          description?: string | null
          discontinued_at?: string | null
          id?: string
          image_url?: string | null
          is_discontinued?: boolean
          last_verified_at?: string | null
          launch_date?: string | null
          name: string
          slug: string
          source_date?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"] | null
          source_url?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
          verified_by?: string | null
        }
        Update: {
          brand_id?: string
          category_id?: string | null
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          created_at?: string
          description?: string | null
          discontinued_at?: string | null
          id?: string
          image_url?: string | null
          is_discontinued?: boolean
          last_verified_at?: string | null
          launch_date?: string | null
          name?: string
          slug?: string
          source_date?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"] | null
          source_url?: string | null
          updated_at?: string
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
          verified_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "brands"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          allergies: string[] | null
          billing_interval: string
          created_at: string
          date_of_birth: string | null
          email: string | null
          founding_member: boolean
          full_name: string | null
          gender: string | null
          id: string
          is_professional: boolean
          notes: string | null
          phone: string | null
          preferred_routine_time: string | null
          race_ethnicity: string | null
          skin_color: string | null
          skin_conditions: string[] | null
          starter_analyses_used: number
          subscription_started_at: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          trial_plan: string | null
          trial_used_at: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          allergies?: string[] | null
          billing_interval?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          founding_member?: boolean
          full_name?: string | null
          gender?: string | null
          id?: string
          is_professional?: boolean
          notes?: string | null
          phone?: string | null
          preferred_routine_time?: string | null
          race_ethnicity?: string | null
          skin_color?: string | null
          skin_conditions?: string[] | null
          starter_analyses_used?: number
          subscription_started_at?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          trial_plan?: string | null
          trial_used_at?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          allergies?: string[] | null
          billing_interval?: string
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          founding_member?: boolean
          full_name?: string | null
          gender?: string | null
          id?: string
          is_professional?: boolean
          notes?: string | null
          phone?: string | null
          preferred_routine_time?: string | null
          race_ethnicity?: string | null
          skin_color?: string | null
          skin_conditions?: string[] | null
          starter_analyses_used?: number
          subscription_started_at?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          trial_plan?: string | null
          trial_used_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      retailer_products: {
        Row: {
          created_at: string
          id: string
          is_available: boolean
          last_checked_at: string | null
          last_verified_at: string | null
          product_variant_id: string
          retailer_id: string
          retailer_sku: string | null
          retailer_url: string | null
          source_type: Database["public"]["Enums"]["data_source_type"]
          verification_status: Database["public"]["Enums"]["data_quality_status"]
        }
        Insert: {
          created_at?: string
          id?: string
          is_available?: boolean
          last_checked_at?: string | null
          last_verified_at?: string | null
          product_variant_id: string
          retailer_id: string
          retailer_sku?: string | null
          retailer_url?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"]
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
        }
        Update: {
          created_at?: string
          id?: string
          is_available?: boolean
          last_checked_at?: string | null
          last_verified_at?: string | null
          product_variant_id?: string
          retailer_id?: string
          retailer_sku?: string | null
          retailer_url?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"]
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
        }
        Relationships: [
          {
            foreignKeyName: "retailer_products_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retailer_products_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
        ]
      }
      retailers: {
        Row: {
          created_at: string
          id: string
          is_active: boolean
          logo_url: string | null
          name: string
          slug: string
          website_url: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name: string
          slug: string
          website_url?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_active?: boolean
          logo_url?: string | null
          name?: string
          slug?: string
          website_url?: string | null
        }
        Relationships: []
      }
      review_comments: {
        Row: {
          body: string
          created_at: string
          display_name: string | null
          id: string
          review_id: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          display_name?: string | null
          id?: string
          review_id: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          display_name?: string | null
          id?: string
          review_id?: string
          user_id?: string
        }
        Relationships: []
      }
      review_details: {
        Row: {
          created_at: string
          full_review: string
          review_id: string
        }
        Insert: {
          created_at?: string
          full_review: string
          review_id: string
        }
        Update: {
          created_at?: string
          full_review?: string
          review_id?: string
        }
        Relationships: []
      }
      review_evidence: {
        Row: {
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          created_at: string
          created_by: string | null
          evidence_type: string
          id: string
          review_id: string
          source_date: string | null
          source_type: Database["public"]["Enums"]["data_source_type"] | null
          source_url: string | null
          summary: string
        }
        Insert: {
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          created_at?: string
          created_by?: string | null
          evidence_type: string
          id?: string
          review_id: string
          source_date?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"] | null
          source_url?: string | null
          summary: string
        }
        Update: {
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          created_at?: string
          created_by?: string | null
          evidence_type?: string
          id?: string
          review_id?: string
          source_date?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"] | null
          source_url?: string | null
          summary?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_evidence_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_images: {
        Row: {
          alt: string
          created_at: string
          credit_name: string
          credit_url: string
          image_url: string
          photo_id: string | null
          review_id: string
          updated_at: string
        }
        Insert: {
          alt?: string
          created_at?: string
          credit_name?: string
          credit_url?: string
          image_url: string
          photo_id?: string | null
          review_id: string
          updated_at?: string
        }
        Update: {
          alt?: string
          created_at?: string
          credit_name?: string
          credit_url?: string
          image_url?: string
          photo_id?: string | null
          review_id?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_ratings: {
        Row: {
          created_at: string
          id: string
          liked: boolean
          rating: number
          review_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liked?: boolean
          rating: number
          review_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liked?: boolean
          rating?: number
          review_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      review_versions: {
        Row: {
          changed_reason: string | null
          created_at: string
          created_by: string | null
          id: string
          review_id: string
          verdict_full: string | null
          verdict_summary: string
          version_number: number
        }
        Insert: {
          changed_reason?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          review_id: string
          verdict_full?: string | null
          verdict_summary: string
          version_number: number
        }
        Update: {
          changed_reason?: string | null
          created_at?: string
          created_by?: string | null
          id?: string
          review_id?: string
          verdict_full?: string | null
          verdict_summary?: string
          version_number?: number
        }
        Relationships: [
          {
            foreignKeyName: "review_versions_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          created_at: string
          id: string
          methodology_version: string | null
          product_id: string
          published_at: string | null
          reviewer: string | null
          slug: string
          status: string
          updated_at: string
          verdict_full: string | null
          verdict_summary: string
        }
        Insert: {
          created_at?: string
          id?: string
          methodology_version?: string | null
          product_id: string
          published_at?: string | null
          reviewer?: string | null
          slug: string
          status?: string
          updated_at?: string
          verdict_full?: string | null
          verdict_summary: string
        }
        Update: {
          created_at?: string
          id?: string
          methodology_version?: string | null
          product_id?: string
          published_at?: string | null
          reviewer?: string | null
          slug?: string
          status?: string
          updated_at?: string
          verdict_full?: string | null
          verdict_summary?: string
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
      skin_concerns: {
        Row: {
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      skin_journey_entries: {
        Row: {
          created_at: string
          entry_date: string
          id: string
          mood: string | null
          notes: string | null
          photo_url: string | null
          skin_condition_rating: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string | null
          notes?: string | null
          photo_url?: string | null
          skin_condition_rating?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          entry_date?: string
          id?: string
          mood?: string | null
          notes?: string | null
          photo_url?: string | null
          skin_condition_rating?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      skin_types: {
        Row: {
          description: string | null
          id: string
          name: string
          slug: string
        }
        Insert: {
          description?: string | null
          id?: string
          name: string
          slug: string
        }
        Update: {
          description?: string | null
          id?: string
          name?: string
          slug?: string
        }
        Relationships: []
      }
      skincare_recommendations: {
        Row: {
          age_range: string | null
          allergies: string | null
          analysis_completeness: number | null
          book_consultation: boolean | null
          concerns: string[]
          contact_name: string | null
          contact_whatsapp: string | null
          created_at: string
          current_products: string | null
          email_sent_to: string | null
          environment: string | null
          id: string
          lifestyle: string | null
          mst_source: string | null
          mst_tone: number | null
          recommendation: string
          skin_type: string
          status: string
          user_id: string
        }
        Insert: {
          age_range?: string | null
          allergies?: string | null
          analysis_completeness?: number | null
          book_consultation?: boolean | null
          concerns: string[]
          contact_name?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          current_products?: string | null
          email_sent_to?: string | null
          environment?: string | null
          id?: string
          lifestyle?: string | null
          mst_source?: string | null
          mst_tone?: number | null
          recommendation: string
          skin_type: string
          status?: string
          user_id: string
        }
        Update: {
          age_range?: string | null
          allergies?: string | null
          analysis_completeness?: number | null
          book_consultation?: boolean | null
          concerns?: string[]
          contact_name?: string | null
          contact_whatsapp?: string | null
          created_at?: string
          current_products?: string | null
          email_sent_to?: string | null
          environment?: string | null
          id?: string
          lifestyle?: string | null
          mst_source?: string | null
          mst_tone?: number | null
          recommendation?: string
          skin_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      skynn_fairness_events: {
        Row: {
          completeness_score: number | null
          compliance_flags: string[]
          created_at: string
          grounded_match_attempted: number | null
          grounded_match_count: number | null
          had_photo: boolean
          id: string
          model_version: string | null
          mst_band: string
          mst_tone: number | null
          result_tier: string
          skin_type: string | null
          source: string
        }
        Insert: {
          completeness_score?: number | null
          compliance_flags?: string[]
          created_at?: string
          grounded_match_attempted?: number | null
          grounded_match_count?: number | null
          had_photo?: boolean
          id?: string
          model_version?: string | null
          mst_band: string
          mst_tone?: number | null
          result_tier: string
          skin_type?: string | null
          source: string
        }
        Update: {
          completeness_score?: number | null
          compliance_flags?: string[]
          created_at?: string
          grounded_match_attempted?: number | null
          grounded_match_count?: number | null
          had_photo?: boolean
          id?: string
          model_version?: string | null
          mst_band?: string
          mst_tone?: number | null
          result_tier?: string
          skin_type?: string | null
          source?: string
        }
        Relationships: []
      }
      spotlight_brand_requests: {
        Row: {
          brand_name: string
          brand_slug: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          created_at: string
          id: string
          message: string | null
          official_website: string | null
          request_type: string
          role_at_brand: string | null
          status: string
          updated_at: string
        }
        Insert: {
          brand_name: string
          brand_slug?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          message?: string | null
          official_website?: string | null
          request_type: string
          role_at_brand?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          brand_name?: string
          brand_slug?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          created_at?: string
          id?: string
          message?: string | null
          official_website?: string | null
          request_type?: string
          role_at_brand?: string | null
          status?: string
          updated_at?: string
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
    }
    Views: {
      current_product_prices: {
        Row: {
          currency: string | null
          is_available: boolean | null
          price_id: string | null
          price_zar: number | null
          product_variant_id: string | null
          recorded_at: string | null
          retailer_id: string | null
          retailer_product_id: string | null
        }
        Relationships: [
          {
            foreignKeyName: "retailer_products_product_variant_id_fkey"
            columns: ["product_variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "retailer_products_retailer_id_fkey"
            columns: ["retailer_id"]
            isOneToOne: false
            referencedRelation: "retailers"
            referencedColumns: ["id"]
          },
        ]
      }
      news_articles_public: {
        Row: {
          cover_credit_name: string | null
          cover_credit_url: string | null
          cover_image_alt: string | null
          cover_image_url: string | null
          created_at: string | null
          excerpt: string | null
          id: string | null
          is_premium: boolean | null
          json_ld: Json | null
          key_takeaways: string[] | null
          publish_date: string | null
          reading_time: string | null
          sa_context_tag: string | null
          seo_description: string | null
          seo_title: string | null
          slug: string | null
          source_name: string | null
          source_url: string | null
          title: string | null
          view_count: number | null
          word_count: number | null
        }
        Insert: {
          cover_credit_name?: string | null
          cover_credit_url?: string | null
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string | null
          is_premium?: boolean | null
          json_ld?: Json | null
          key_takeaways?: string[] | null
          publish_date?: string | null
          reading_time?: string | null
          sa_context_tag?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          source_name?: string | null
          source_url?: string | null
          title?: string | null
          view_count?: number | null
          word_count?: number | null
        }
        Update: {
          cover_credit_name?: string | null
          cover_credit_url?: string | null
          cover_image_alt?: string | null
          cover_image_url?: string | null
          created_at?: string | null
          excerpt?: string | null
          id?: string | null
          is_premium?: boolean | null
          json_ld?: Json | null
          key_takeaways?: string[] | null
          publish_date?: string | null
          reading_time?: string | null
          sa_context_tag?: string | null
          seo_description?: string | null
          seo_title?: string | null
          slug?: string | null
          source_name?: string | null
          source_url?: string | null
          title?: string | null
          view_count?: number | null
          word_count?: number | null
        }
        Relationships: []
      }
      skynn_fairness_summary: {
        Row: {
          avg_completeness: number | null
          avg_grounded_match_rate_pct: number | null
          compliance_flag_count: number | null
          event_count: number | null
          mst_band: string | null
          result_tier: string | null
          source: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      available_ai_credits: { Args: { _user_id: string }; Returns: number }
      cancel_subscription: { Args: never; Returns: boolean }
      claim_founding_member_slot: {
        Args: { p_offer_id: string }
        Returns: boolean
      }
      claim_starter_analysis: {
        Args: { p_variant_key?: string }
        Returns: {
          allowed: boolean
          remaining_free: number
          source: string
        }[]
      }
      expire_finished_trials: { Args: never; Returns: number }
      get_article_body: {
        Args: { p_device_id?: string; p_slug: string }
        Returns: {
          body_markdown: string
          inline_images: Json
        }[]
      }
      get_preorder_count: { Args: { p_product_type: string }; Returns: number }
      grant_ai_credits: {
        Args: {
          p_credits: number
          p_expires_after_days?: number
          p_reason: string
          p_user_id: string
        }
        Returns: undefined
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_member: { Args: { _user_id: string }; Returns: boolean }
      is_professional_account: { Args: { _user_id: string }; Returns: boolean }
      is_profile_complete: { Args: { _user_id: string }; Returns: boolean }
      is_username_available: { Args: { p_username: string }; Returns: boolean }
      register_ai_analysis_use: { Args: never; Returns: boolean }
      register_article_view: { Args: { p_article_id: string }; Returns: number }
      search_products: {
        Args: {
          p_category_slug?: string
          p_ingredient_slug?: string
          p_limit?: number
          p_max_price_zar?: number
          p_skin_type_slug?: string
        }
        Returns: {
          brand_name: string
          category_name: string
          lowest_price_zar: number
          product_id: string
          product_name: string
          product_slug: string
          verification_status: Database["public"]["Enums"]["data_quality_status"]
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      start_free_trial: {
        Args: { p_plan: string; p_variant_key?: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      claim_type: "marketing" | "clinical" | "regulatory"
      confidence_level: "low" | "medium" | "high"
      data_quality_status:
        | "unverified"
        | "partially_verified"
        | "verified"
        | "deprecated"
      data_source_type:
        | "brand_website"
        | "retailer_listing"
        | "ingredient_database"
        | "manual_editorial"
        | "internal_editorial"
        | "user_submission"
        | "distributor_document"
        | "clinical_study"
        | "other"
      evidence_level: "strong" | "moderate" | "limited" | "anecdotal" | "none"
      ingredient_concern_relationship: "treats" | "may_worsen" | "preventive"
      ingredient_interaction_type:
        | "avoid_combining"
        | "enhances"
        | "buffers"
        | "requires_spacing"
      irritancy_risk: "low" | "moderate" | "high"
      skin_fit_rating: "excellent" | "good" | "caution" | "avoid"
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
      app_role: ["admin", "moderator", "user"],
      claim_type: ["marketing", "clinical", "regulatory"],
      confidence_level: ["low", "medium", "high"],
      data_quality_status: [
        "unverified",
        "partially_verified",
        "verified",
        "deprecated",
      ],
      data_source_type: [
        "brand_website",
        "retailer_listing",
        "ingredient_database",
        "manual_editorial",
        "internal_editorial",
        "user_submission",
        "distributor_document",
        "clinical_study",
        "other",
      ],
      evidence_level: ["strong", "moderate", "limited", "anecdotal", "none"],
      ingredient_concern_relationship: ["treats", "may_worsen", "preventive"],
      ingredient_interaction_type: [
        "avoid_combining",
        "enhances",
        "buffers",
        "requires_spacing",
      ],
      irritancy_risk: ["low", "moderate", "high"],
      skin_fit_rating: ["excellent", "good", "caution", "avoid"],
    },
  },
} as const
