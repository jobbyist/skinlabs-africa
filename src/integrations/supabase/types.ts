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
      admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string
          created_at: string
          detail: Json
          id: string
          target_user_id: string
        }
        Insert: {
          action: string
          admin_user_id: string
          created_at?: string
          detail?: Json
          id?: string
          target_user_id: string
        }
        Update: {
          action?: string
          admin_user_id?: string
          created_at?: string
          detail?: Json
          id?: string
          target_user_id?: string
        }
        Relationships: []
      }
      advanced_assessment_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          session_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          session_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          session_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advanced_assessment_events_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "advanced_assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      advanced_assessment_evidence: {
        Row: {
          created_at: string
          evidence_version: string
          id: string
          publication_date: string | null
          publisher: string | null
          source_type: string
          summary: string
          title: string
          topic_tags: string[]
          url: string | null
          verification_status: string
          verified_by: string | null
        }
        Insert: {
          created_at?: string
          evidence_version: string
          id?: string
          publication_date?: string | null
          publisher?: string | null
          source_type: string
          summary: string
          title: string
          topic_tags?: string[]
          url?: string | null
          verification_status?: string
          verified_by?: string | null
        }
        Update: {
          created_at?: string
          evidence_version?: string
          id?: string
          publication_date?: string | null
          publisher?: string | null
          source_type?: string
          summary?: string
          title?: string
          topic_tags?: string[]
          url?: string | null
          verification_status?: string
          verified_by?: string | null
        }
        Relationships: []
      }
      advanced_assessment_reports: {
        Row: {
          confidence: string | null
          created_at: string
          engine_version: string | null
          error_message: string | null
          evidence_version: string | null
          generated_at: string | null
          generation_status: string
          id: string
          model: string | null
          prompt_version: string | null
          report: Json | null
          safety_flags: Json | null
          session_id: string
          user_id: string
        }
        Insert: {
          confidence?: string | null
          created_at?: string
          engine_version?: string | null
          error_message?: string | null
          evidence_version?: string | null
          generated_at?: string | null
          generation_status?: string
          id?: string
          model?: string | null
          prompt_version?: string | null
          report?: Json | null
          safety_flags?: Json | null
          session_id: string
          user_id: string
        }
        Update: {
          confidence?: string | null
          created_at?: string
          engine_version?: string | null
          error_message?: string | null
          evidence_version?: string | null
          generated_at?: string | null
          generation_status?: string
          id?: string
          model?: string | null
          prompt_version?: string | null
          report?: Json | null
          safety_flags?: Json | null
          session_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advanced_assessment_reports_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: true
            referencedRelation: "advanced_assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      advanced_assessment_sessions: {
        Row: {
          access_type: string | null
          assessment_definition_id: string
          assessment_version: string
          completed_at: string | null
          completeness_pct: number
          created_at: string
          current_section_id: string | null
          engine_version: string
          expires_at: string
          failure_reason: string | null
          id: string
          idempotency_key: string | null
          pass_transaction_id: string | null
          question_library_version: string
          responses: Json
          safety_screen: Json | null
          scoring_rules_version: string
          status: string
          submission_version: number
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          access_type?: string | null
          assessment_definition_id: string
          assessment_version: string
          completed_at?: string | null
          completeness_pct?: number
          created_at?: string
          current_section_id?: string | null
          engine_version?: string
          expires_at?: string
          failure_reason?: string | null
          id?: string
          idempotency_key?: string | null
          pass_transaction_id?: string | null
          question_library_version: string
          responses?: Json
          safety_screen?: Json | null
          scoring_rules_version: string
          status?: string
          submission_version?: number
          submitted_at?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          access_type?: string | null
          assessment_definition_id?: string
          assessment_version?: string
          completed_at?: string | null
          completeness_pct?: number
          created_at?: string
          current_section_id?: string | null
          engine_version?: string
          expires_at?: string
          failure_reason?: string | null
          id?: string
          idempotency_key?: string | null
          pass_transaction_id?: string | null
          question_library_version?: string
          responses?: Json
          safety_screen?: Json | null
          scoring_rules_version?: string
          status?: string
          submission_version?: number
          submitted_at?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "advanced_assessment_sessions_assessment_definition_id_fkey"
            columns: ["assessment_definition_id"]
            isOneToOne: false
            referencedRelation: "assessment_definitions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advanced_assessment_sessions_pass_transaction_id_fkey"
            columns: ["pass_transaction_id"]
            isOneToOne: false
            referencedRelation: "ai_credit_transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      ai_analysis_usage: {
        Row: {
          created_at: string
          id: string
          plan_at_use: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          plan_at_use: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          plan_at_use?: string
          user_id?: string
        }
        Relationships: []
      }
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
          reference: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          delta: number
          expires_at?: string | null
          id?: string
          reason: string
          reference?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          delta?: number
          expires_at?: string | null
          id?: string
          reason?: string
          reference?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ai_generated_product_reviews: {
        Row: {
          am_pm_usage: string | null
          benefits: Json | null
          brand: string
          category: string
          cautions: Json | null
          comparison_products: Json | null
          community_rating: number | null
          community_rating_count: number | null
          country_of_origin: string | null
          created_at: string
          currency: string | null
          data_quality_status: string
          date_modified: string | null
          date_published: string | null
          faq: Json | null
          gallery_images: Json | null
          generated_by: string
          id: string
          is_sponsored: boolean
          key_ingredients: string[]
          key_ingredients_structured: Json | null
          local_price_zar: number
          origin: string
          primary_image: string | null
          product_format: string | null
          product_name: string
          product_size: string | null
          published_date: string
          related_ingredients_slugs: Json | null
          related_knowledge_articles: Json | null
          related_reviews: Json | null
          retailers: Json
          review_body: string | null
          review_methodology: string | null
          score_climate: number
          score_efficacy: number
          score_texture: number
          score_value: number
          seo_description: string | null
          seo_intro: string | null
          seo_title: string | null
          skin_concerns: Json | null
          skin_type_match: string[]
          skin_types: Json | null
          source_type: string
          source_url: string
          verdict: string
          where_to_buy: string
        }
        Insert: {
          am_pm_usage?: string | null
          benefits?: Json | null
          brand: string
          category: string
          cautions?: Json | null
          comparison_products?: Json | null
          community_rating?: number | null
          community_rating_count?: number | null
          country_of_origin?: string | null
          created_at?: string
          currency?: string | null
          data_quality_status?: string
          date_modified?: string | null
          date_published?: string | null
          faq?: Json | null
          gallery_images?: Json | null
          generated_by?: string
          id: string
          is_sponsored?: boolean
          key_ingredients?: string[]
          key_ingredients_structured?: Json | null
          local_price_zar: number
          origin: string
          primary_image?: string | null
          product_format?: string | null
          product_name: string
          product_size?: string | null
          published_date?: string
          related_ingredients_slugs?: Json | null
          related_knowledge_articles?: Json | null
          related_reviews?: Json | null
          retailers?: Json
          review_body?: string | null
          review_methodology?: string | null
          score_climate: number
          score_efficacy: number
          score_texture: number
          score_value: number
          seo_description?: string | null
          seo_intro?: string | null
          seo_title?: string | null
          skin_concerns?: Json | null
          skin_type_match?: string[]
          skin_types?: Json | null
          source_type: string
          source_url: string
          verdict: string
          where_to_buy: string
        }
        Update: {
          am_pm_usage?: string | null
          benefits?: Json | null
          brand?: string
          category?: string
          cautions?: Json | null
          comparison_products?: Json | null
          community_rating?: number | null
          community_rating_count?: number | null
          country_of_origin?: string | null
          created_at?: string
          currency?: string | null
          data_quality_status?: string
          date_modified?: string | null
          date_published?: string | null
          faq?: Json | null
          gallery_images?: Json | null
          generated_by?: string
          id?: string
          is_sponsored?: boolean
          key_ingredients?: string[]
          key_ingredients_structured?: Json | null
          local_price_zar?: number
          origin?: string
          primary_image?: string | null
          product_format?: string | null
          product_name?: string
          product_size?: string | null
          published_date?: string
          related_ingredients_slugs?: Json | null
          related_knowledge_articles?: Json | null
          related_reviews?: Json | null
          retailers?: Json
          review_body?: string | null
          review_methodology?: string | null
          score_climate?: number
          score_efficacy?: number
          score_texture?: number
          score_value?: number
          seo_description?: string | null
          seo_intro?: string | null
          seo_title?: string | null
          skin_concerns?: Json | null
          skin_type_match?: string[]
          skin_types?: Json | null
          source_type?: string
          source_url?: string
          verdict?: string
          where_to_buy?: string
        }
        Relationships: []
      }
      analytics_events: {
        Row: {
          created_at: string
          event_name: string
          id: string
          path: string | null
          payload: Json
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_name: string
          id?: string
          path?: string | null
          payload?: Json
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_name?: string
          id?: string
          path?: string | null
          payload?: Json
          user_id?: string | null
        }
        Relationships: []
      }
      assessment_definitions: {
        Row: {
          created_at: string
          evidence_version: string
          id: string
          notes: string | null
          question_library_version: string
          scoring_rules_version: string
          sections: Json
          status: string
          title: string
          version: string
        }
        Insert: {
          created_at?: string
          evidence_version: string
          id?: string
          notes?: string | null
          question_library_version: string
          scoring_rules_version: string
          sections: Json
          status?: string
          title: string
          version: string
        }
        Update: {
          created_at?: string
          evidence_version?: string
          id?: string
          notes?: string | null
          question_library_version?: string
          scoring_rules_version?: string
          sections?: Json
          status?: string
          title?: string
          version?: string
        }
        Relationships: []
      }
      assessment_prompt_versions: {
        Row: {
          created_at: string
          id: string
          is_placeholder: boolean
          model_default: string | null
          notes: string | null
          status: string
          system_prompt: string | null
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_placeholder?: boolean
          model_default?: string | null
          notes?: string | null
          status?: string
          system_prompt?: string | null
          version: string
        }
        Update: {
          created_at?: string
          id?: string
          is_placeholder?: boolean
          model_default?: string | null
          notes?: string | null
          status?: string
          system_prompt?: string | null
          version?: string
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
      contact_submissions: {
        Row: {
          created_at: string
          email: string
          first_name: string
          id: string
          last_name: string
          message: string
          status: string
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          first_name: string
          id?: string
          last_name: string
          message: string
          status?: string
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          last_name?: string
          message?: string
          status?: string
          subject?: string
          updated_at?: string
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
      email_delivery_events: {
        Row: {
          event_type: string
          id: string
          outbox_id: string | null
          provider_message_id: string | null
          raw_payload: Json
          received_at: string
          resend_event_id: string
        }
        Insert: {
          event_type: string
          id?: string
          outbox_id?: string | null
          provider_message_id?: string | null
          raw_payload: Json
          received_at?: string
          resend_event_id: string
        }
        Update: {
          event_type?: string
          id?: string
          outbox_id?: string | null
          provider_message_id?: string | null
          raw_payload?: Json
          received_at?: string
          resend_event_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "email_delivery_events_outbox_id_fkey"
            columns: ["outbox_id"]
            isOneToOne: false
            referencedRelation: "email_outbox"
            referencedColumns: ["id"]
          },
        ]
      }
      email_events: {
        Row: {
          created_at: string
          event_type: string
          id: string
          idempotency_key: string
          occurred_at: string
          payload: Json
          recipient_email: string | null
          source: string
          user_id: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          idempotency_key: string
          occurred_at?: string
          payload?: Json
          recipient_email?: string | null
          source: string
          user_id?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          idempotency_key?: string
          occurred_at?: string
          payload?: Json
          recipient_email?: string | null
          source?: string
          user_id?: string | null
        }
        Relationships: []
      }
      email_outbox: {
        Row: {
          attempt_count: number
          cancelled_at: string | null
          category: string
          created_at: string
          event_id: string
          failed_at: string | null
          id: string
          idempotency_key: string
          last_error: string | null
          max_attempts: number
          payload: Json
          priority: number
          processing_started_at: string | null
          processing_token: string | null
          provider_message_id: string | null
          recipient_email: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          template_id: string
          transactional: boolean
          updated_at: string
          user_id: string | null
        }
        Insert: {
          attempt_count?: number
          cancelled_at?: string | null
          category: string
          created_at?: string
          event_id: string
          failed_at?: string | null
          id?: string
          idempotency_key: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          processing_started_at?: string | null
          processing_token?: string | null
          provider_message_id?: string | null
          recipient_email?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          template_id: string
          transactional?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          attempt_count?: number
          cancelled_at?: string | null
          category?: string
          created_at?: string
          event_id?: string
          failed_at?: string | null
          id?: string
          idempotency_key?: string
          last_error?: string | null
          max_attempts?: number
          payload?: Json
          priority?: number
          processing_started_at?: string | null
          processing_token?: string | null
          provider_message_id?: string | null
          recipient_email?: string | null
          scheduled_at?: string
          sent_at?: string | null
          status?: string
          template_id?: string
          transactional?: boolean
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_outbox_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "email_events"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_waitlist: {
        Row: {
          created_at: string
          feature_key: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feature_key: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          feature_key?: string
          id?: string
          user_id?: string
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
      ingredient_aliases: {
        Row: {
          alias: string
          alias_type: Database["public"]["Enums"]["ingredient_alias_type"]
          created_at: string
          id: string
          ingredient_id: string
        }
        Insert: {
          alias: string
          alias_type?: Database["public"]["Enums"]["ingredient_alias_type"]
          created_at?: string
          id?: string
          ingredient_id: string
        }
        Update: {
          alias?: string
          alias_type?: Database["public"]["Enums"]["ingredient_alias_type"]
          created_at?: string
          id?: string
          ingredient_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_aliases_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
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
          explanation: string | null
          id: string
          ingredient_a_id: string
          ingredient_b_id: string
          interaction_type: Database["public"]["Enums"]["ingredient_interaction_type"]
          last_verified_at: string | null
          notes: string | null
          source_url: string | null
          usage_guidance: string | null
          verification_status: Database["public"]["Enums"]["data_quality_status"]
          verified_by: string | null
        }
        Insert: {
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          explanation?: string | null
          id?: string
          ingredient_a_id: string
          ingredient_b_id: string
          interaction_type: Database["public"]["Enums"]["ingredient_interaction_type"]
          last_verified_at?: string | null
          notes?: string | null
          source_url?: string | null
          usage_guidance?: string | null
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
          verified_by?: string | null
        }
        Update: {
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          explanation?: string | null
          id?: string
          ingredient_a_id?: string
          ingredient_b_id?: string
          interaction_type?: Database["public"]["Enums"]["ingredient_interaction_type"]
          last_verified_at?: string | null
          notes?: string | null
          source_url?: string | null
          usage_guidance?: string | null
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
          verified_by?: string | null
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
      ingredient_sources: {
        Row: {
          created_at: string
          created_by: string | null
          evidence_level: Database["public"]["Enums"]["evidence_level"] | null
          evidence_summary: string | null
          fetched_at: string
          id: string
          ingredient_id: string
          publication_date: string | null
          publisher: string | null
          source_title: string | null
          source_type: Database["public"]["Enums"]["data_source_type"]
          source_url: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          evidence_level?: Database["public"]["Enums"]["evidence_level"] | null
          evidence_summary?: string | null
          fetched_at?: string
          id?: string
          ingredient_id: string
          publication_date?: string | null
          publisher?: string | null
          source_title?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"]
          source_url: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          evidence_level?: Database["public"]["Enums"]["evidence_level"] | null
          evidence_summary?: string | null
          fetched_at?: string
          id?: string
          ingredient_id?: string
          publication_date?: string | null
          publisher?: string | null
          source_title?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"]
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_sources_ingredient_id_fkey"
            columns: ["ingredient_id"]
            isOneToOne: false
            referencedRelation: "ingredients"
            referencedColumns: ["id"]
          },
        ]
      }
      ingredients: {
        Row: {
          category: string | null
          common_name: string | null
          confidence: Database["public"]["Enums"]["confidence_level"] | null
          created_at: string
          description: string | null
          evidence_level: Database["public"]["Enums"]["evidence_level"] | null
          formulation_notes: string | null
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
          category?: string | null
          common_name?: string | null
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          created_at?: string
          description?: string | null
          evidence_level?: Database["public"]["Enums"]["evidence_level"] | null
          formulation_notes?: string | null
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
          category?: string | null
          common_name?: string | null
          confidence?: Database["public"]["Enums"]["confidence_level"] | null
          created_at?: string
          description?: string | null
          evidence_level?: Database["public"]["Enums"]["evidence_level"] | null
          formulation_notes?: string | null
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
      marketplace_brands: {
        Row: {
          cover_image_path: string | null
          created_at: string
          description: string | null
          id: string
          name: string
          origin: string | null
          slug: string
          source_url: string | null
          values: string[]
        }
        Insert: {
          cover_image_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name: string
          origin?: string | null
          slug: string
          source_url?: string | null
          values?: string[]
        }
        Update: {
          cover_image_path?: string | null
          created_at?: string
          description?: string | null
          id?: string
          name?: string
          origin?: string | null
          slug?: string
          source_url?: string | null
          values?: string[]
        }
        Relationships: []
      }
      marketplace_cart_items: {
        Row: {
          added_at: string
          id: string
          product_id: string
          quantity: number
          user_id: string
        }
        Insert: {
          added_at?: string
          id?: string
          product_id: string
          quantity?: number
          user_id: string
        }
        Update: {
          added_at?: string
          id?: string
          product_id?: string
          quantity?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_cart_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_fx_rates: {
        Row: {
          currency_code: string
          rate_from_zar: number
          updated_at: string
        }
        Insert: {
          currency_code: string
          rate_from_zar: number
          updated_at?: string
        }
        Update: {
          currency_code?: string
          rate_from_zar?: number
          updated_at?: string
        }
        Relationships: []
      }
      marketplace_price_sync_log: {
        Row: {
          error: string | null
          id: string
          new_price: number | null
          old_price: number | null
          product_id: string
          run_at: string
          status: string
        }
        Insert: {
          error?: string | null
          id?: string
          new_price?: number | null
          old_price?: number | null
          product_id: string
          run_at?: string
          status: string
        }
        Update: {
          error?: string | null
          id?: string
          new_price?: number | null
          old_price?: number | null
          product_id?: string
          run_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_price_sync_log_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_product_images: {
        Row: {
          alt: string | null
          created_at: string
          id: string
          is_primary: boolean
          position: number
          product_id: string
          url: string
        }
        Insert: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          position?: number
          product_id: string
          url: string
        }
        Update: {
          alt?: string | null
          created_at?: string
          id?: string
          is_primary?: boolean
          position?: number
          product_id?: string
          url?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_product_ratings: {
        Row: {
          product_id: string
          rating: number | null
          review_count: number | null
          scraped_at: string
          source_url: string
        }
        Insert: {
          product_id: string
          rating?: number | null
          review_count?: number | null
          scraped_at?: string
          source_url: string
        }
        Update: {
          product_id?: string
          rating?: number | null
          review_count?: number | null
          scraped_at?: string
          source_url?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_product_ratings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_product_user_ratings: {
        Row: {
          created_at: string
          id: string
          product_id: string
          rating: number
          review_text: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_id: string
          rating: number
          review_text?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_id?: string
          rating?: number
          review_text?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_product_user_ratings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_products: {
        Row: {
          brand_id: string
          category: string
          concern: string[]
          created_at: string
          data_quality_status: string
          description: string
          how_to_use: string | null
          id: string
          in_stock: boolean
          key_actives: string[]
          marked_up_price_zar: number
          name: string
          original_price_zar: number
          size: string | null
          skin_tone_claims: string[]
          slug: string
          source_last_synced_at: string | null
          source_url: string
          updated_at: string
          values: string[]
        }
        Insert: {
          brand_id: string
          category: string
          concern?: string[]
          created_at?: string
          data_quality_status?: string
          description: string
          how_to_use?: string | null
          id?: string
          in_stock?: boolean
          key_actives?: string[]
          marked_up_price_zar: number
          name: string
          original_price_zar: number
          size?: string | null
          skin_tone_claims?: string[]
          slug: string
          source_last_synced_at?: string | null
          source_url: string
          updated_at?: string
          values?: string[]
        }
        Update: {
          brand_id?: string
          category?: string
          concern?: string[]
          created_at?: string
          data_quality_status?: string
          description?: string
          how_to_use?: string | null
          id?: string
          in_stock?: boolean
          key_actives?: string[]
          marked_up_price_zar?: number
          name?: string
          original_price_zar?: number
          size?: string | null
          skin_tone_claims?: string[]
          slug?: string
          source_last_synced_at?: string | null
          source_url?: string
          updated_at?: string
          values?: string[]
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_products_brand_id_fkey"
            columns: ["brand_id"]
            isOneToOne: false
            referencedRelation: "marketplace_brands"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_skinlabs_picks: {
        Row: {
          created_at: string
          id: string
          position: number
          product_id: string
          week_of: string
        }
        Insert: {
          created_at?: string
          id?: string
          position?: number
          product_id: string
          week_of: string
        }
        Update: {
          created_at?: string
          id?: string
          position?: number
          product_id?: string
          week_of?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_skinlabs_picks_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
            referencedColumns: ["id"]
          },
        ]
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
      newsletter_offers: {
        Row: {
          active_from: string | null
          active_until: string | null
          created_at: string
          cta_label: string
          cta_url: string
          description: string
          headline: string
          id: string
          is_active: boolean
        }
        Insert: {
          active_from?: string | null
          active_until?: string | null
          created_at?: string
          cta_label?: string
          cta_url: string
          description: string
          headline: string
          id?: string
          is_active?: boolean
        }
        Update: {
          active_from?: string | null
          active_until?: string | null
          created_at?: string
          cta_label?: string
          cta_url?: string
          description?: string
          headline?: string
          id?: string
          is_active?: boolean
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
      notifications: {
        Row: {
          body: string | null
          category: string
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          body?: string | null
          category?: string
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          title?: string
          user_id?: string
        }
        Relationships: []
      }
      notify_me_requests: {
        Row: {
          contact_method: string
          created_at: string
          email: string | null
          feature_key: string
          id: string
          phone: string | null
        }
        Insert: {
          contact_method?: string
          created_at?: string
          email?: string | null
          feature_key: string
          id?: string
          phone?: string | null
        }
        Update: {
          contact_method?: string
          created_at?: string
          email?: string | null
          feature_key?: string
          id?: string
          phone?: string | null
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
      payment_checkout_intents: {
        Row: {
          amount_charged: number
          amount_zar: number
          consumed_at: string | null
          created_at: string
          currency: string
          gateway: string
          id: string
          metadata: Json
          purchase_type: string
          user_id: string
        }
        Insert: {
          amount_charged: number
          amount_zar: number
          consumed_at?: string | null
          created_at?: string
          currency: string
          gateway: string
          id: string
          metadata: Json
          purchase_type: string
          user_id: string
        }
        Update: {
          amount_charged?: number
          amount_zar?: number
          consumed_at?: string | null
          created_at?: string
          currency?: string
          gateway?: string
          id?: string
          metadata?: Json
          purchase_type?: string
          user_id?: string
        }
        Relationships: []
      }
      payment_transactions: {
        Row: {
          amount_original: number | null
          amount_zar: number
          created_at: string
          currency: string
          description: string
          gateway: string
          id: string
          metadata: Json
          purchase_type: string
          reference: string
          status: string
          user_id: string
        }
        Insert: {
          amount_original?: number | null
          amount_zar: number
          created_at?: string
          currency?: string
          description: string
          gateway: string
          id?: string
          metadata?: Json
          purchase_type: string
          reference: string
          status?: string
          user_id: string
        }
        Update: {
          amount_original?: number | null
          amount_zar?: number
          created_at?: string
          currency?: string
          description?: string
          gateway?: string
          id?: string
          metadata?: Json
          purchase_type?: string
          reference?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      pipeline_api_usage: {
        Row: {
          called_at: string
          id: string
          provider: string
          purpose: string | null
          success: boolean
        }
        Insert: {
          called_at?: string
          id?: string
          provider: string
          purpose?: string | null
          success?: boolean
        }
        Update: {
          called_at?: string
          id?: string
          provider?: string
          purpose?: string | null
          success?: boolean
        }
        Relationships: []
      }
      pipeline_model_calls: {
        Row: {
          attempt_number: number
          candidate_key: string | null
          created_at: string
          duration_ms: number
          http_status: number | null
          id: number
          message: string | null
          model: string
          outcome: string
          pipeline: string
          run_id: string
        }
        Insert: {
          attempt_number: number
          candidate_key?: string | null
          created_at?: string
          duration_ms: number
          http_status?: number | null
          id?: never
          message?: string | null
          model: string
          outcome: string
          pipeline: string
          run_id: string
        }
        Update: {
          attempt_number?: number
          candidate_key?: string | null
          created_at?: string
          duration_ms?: number
          http_status?: number | null
          id?: never
          message?: string | null
          model?: string
          outcome?: string
          pipeline?: string
          run_id?: string
        }
        Relationships: []
      }
      pipeline_retry_queue: {
        Row: {
          attempt_count: number
          candidate_payload: Json
          created_at: string
          id: number
          pipeline: string
          reason: string | null
          resolved: boolean
          resolved_at: string | null
          retry_after: string
        }
        Insert: {
          attempt_count?: number
          candidate_payload: Json
          created_at?: string
          id?: never
          pipeline: string
          reason?: string | null
          resolved?: boolean
          resolved_at?: string | null
          retry_after: string
        }
        Update: {
          attempt_count?: number
          candidate_payload?: Json
          created_at?: string
          id?: never
          pipeline?: string
          reason?: string | null
          resolved?: boolean
          resolved_at?: string | null
          retry_after?: string
        }
        Relationships: []
      }
      pipeline_source_cache: {
        Row: {
          cache_key: string
          expires_at: string
          fetched_at: string
          payload: Json
        }
        Insert: {
          cache_key: string
          expires_at: string
          fetched_at?: string
          payload: Json
        }
        Update: {
          cache_key?: string
          expires_at?: string
          fetched_at?: string
          payload?: Json
        }
        Relationships: []
      }
      podcast_likes: {
        Row: {
          created_at: string
          episode_slug: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          episode_slug: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          episode_slug?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      podcast_plays: {
        Row: {
          created_at: string | null
          episode_slug: string
          episode_title: string
          id: string
          played_at: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          episode_slug: string
          episode_title: string
          id?: string
          played_at?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          episode_slug?: string
          episode_title?: string
          id?: string
          played_at?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      podcast_shares: {
        Row: {
          episode_slug: string
          episode_title: string
          id: string
          shared_at: string
          user_id: string | null
        }
        Insert: {
          episode_slug: string
          episode_title: string
          id?: string
          shared_at?: string
          user_id?: string | null
        }
        Update: {
          episode_slug?: string
          episode_title?: string
          id?: string
          shared_at?: string
          user_id?: string | null
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
          promo_free_trial_until: string | null
          variant_key: string
        }
        Insert: {
          default_billing_interval?: string
          free_ai_analysis_allowance?: number
          promo_free_trial_until?: string | null
          variant_key?: string
        }
        Update: {
          default_billing_interval?: string
          free_ai_analysis_allowance?: number
          promo_free_trial_until?: string | null
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
          account_status: string
          address_line1: string | null
          address_line2: string | null
          allergies: string[] | null
          billing_interval: string
          city: string | null
          cookie_consent: string | null
          cookie_consent_at: string | null
          cookie_consent_expires_at: string | null
          cookie_consent_preferences: Json | null
          cookie_consent_version: string | null
          cookie_preferences: Json | null
          country: string
          created_at: string
          date_of_birth: string | null
          deactivated_at: string | null
          email: string | null
          founding_member: boolean
          full_name: string | null
          gender: string | null
          id: string
          is_professional: boolean
          marketing_consent: boolean
          marketing_consent_at: string | null
          marketing_unsubscribe_token: string
          notes: string | null
          phone: string | null
          postal_code: string | null
          preferred_routine_time: string | null
          province: string | null
          race_ethnicity: string | null
          skin_color: string | null
          skin_conditions: string[] | null
          starter_analyses_used: number
          subscription_started_at: string | null
          subscription_status: string | null
          trial_ends_at: string | null
          trial_plan: string | null
          trial_started_at: string | null
          trial_used_at: string | null
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          account_status?: string
          address_line1?: string | null
          address_line2?: string | null
          allergies?: string[] | null
          billing_interval?: string
          city?: string | null
          cookie_consent?: string | null
          cookie_consent_at?: string | null
          cookie_consent_expires_at?: string | null
          cookie_consent_preferences?: Json | null
          cookie_consent_version?: string | null
          cookie_preferences?: Json | null
          country?: string
          created_at?: string
          date_of_birth?: string | null
          deactivated_at?: string | null
          email?: string | null
          founding_member?: boolean
          full_name?: string | null
          gender?: string | null
          id?: string
          is_professional?: boolean
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          marketing_unsubscribe_token?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_routine_time?: string | null
          province?: string | null
          race_ethnicity?: string | null
          skin_color?: string | null
          skin_conditions?: string[] | null
          starter_analyses_used?: number
          subscription_started_at?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          trial_plan?: string | null
          trial_started_at?: string | null
          trial_used_at?: string | null
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          account_status?: string
          address_line1?: string | null
          address_line2?: string | null
          allergies?: string[] | null
          billing_interval?: string
          city?: string | null
          cookie_consent?: string | null
          cookie_consent_at?: string | null
          cookie_consent_expires_at?: string | null
          cookie_consent_preferences?: Json | null
          cookie_consent_version?: string | null
          cookie_preferences?: Json | null
          country?: string
          created_at?: string
          date_of_birth?: string | null
          deactivated_at?: string | null
          email?: string | null
          founding_member?: boolean
          full_name?: string | null
          gender?: string | null
          id?: string
          is_professional?: boolean
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          marketing_unsubscribe_token?: string
          notes?: string | null
          phone?: string | null
          postal_code?: string | null
          preferred_routine_time?: string | null
          province?: string | null
          race_ethnicity?: string | null
          skin_color?: string | null
          skin_conditions?: string[] | null
          starter_analyses_used?: number
          subscription_started_at?: string | null
          subscription_status?: string | null
          trial_ends_at?: string | null
          trial_plan?: string | null
          trial_started_at?: string | null
          trial_used_at?: string | null
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      quote_ss_beauty_requests: {
        Row: {
          additional_notes: string | null
          budget_range: string | null
          business_name: string | null
          created_at: string
          email: string
          email_error: string | null
          email_sent: boolean
          estimate: Json | null
          formulation_notes: string | null
          full_name: string
          hair_concerns: string[]
          has_branding: string | null
          id: string
          needs_compliance_help: boolean
          needs_label_design: boolean
          needs_logo: boolean
          packaging_route: string | null
          phone: string | null
          products: Json
          timeline: string | null
          white_label_interest: string | null
        }
        Insert: {
          additional_notes?: string | null
          budget_range?: string | null
          business_name?: string | null
          created_at?: string
          email: string
          email_error?: string | null
          email_sent?: boolean
          estimate?: Json | null
          formulation_notes?: string | null
          full_name: string
          hair_concerns?: string[]
          has_branding?: string | null
          id?: string
          needs_compliance_help?: boolean
          needs_label_design?: boolean
          needs_logo?: boolean
          packaging_route?: string | null
          phone?: string | null
          products: Json
          timeline?: string | null
          white_label_interest?: string | null
        }
        Update: {
          additional_notes?: string | null
          budget_range?: string | null
          business_name?: string | null
          created_at?: string
          email?: string
          email_error?: string | null
          email_sent?: boolean
          estimate?: Json | null
          formulation_notes?: string | null
          full_name?: string
          hair_concerns?: string[]
          has_branding?: string | null
          id?: string
          needs_compliance_help?: boolean
          needs_label_design?: boolean
          needs_logo?: boolean
          packaging_route?: string | null
          phone?: string | null
          products?: Json
          timeline?: string | null
          white_label_interest?: string | null
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
      routine_checkins: {
        Row: {
          checkin_date: string
          created_at: string
          id: string
          step_id: string
          time_slot: string
          user_id: string
        }
        Insert: {
          checkin_date?: string
          created_at?: string
          id?: string
          step_id: string
          time_slot: string
          user_id: string
        }
        Update: {
          checkin_date?: string
          created_at?: string
          id?: string
          step_id?: string
          time_slot?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_checkins_step_id_fkey"
            columns: ["step_id"]
            isOneToOne: false
            referencedRelation: "routine_steps"
            referencedColumns: ["id"]
          },
        ]
      }
      routine_steps: {
        Row: {
          created_at: string
          id: string
          product_name: string | null
          sort_order: number
          step_name: string
          time_of_day: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          product_name?: string | null
          sort_order?: number
          step_name: string
          time_of_day?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          product_name?: string | null
          sort_order?: number
          step_name?: string
          time_of_day?: string
          user_id?: string
        }
        Relationships: []
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
          client_analysis_id: string | null
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
          photo_storage_path: string | null
          recommendation: string
          result_payload: Json | null
          skin_type: string
          status: string
          user_id: string
        }
        Insert: {
          age_range?: string | null
          allergies?: string | null
          analysis_completeness?: number | null
          book_consultation?: boolean | null
          client_analysis_id?: string | null
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
          photo_storage_path?: string | null
          recommendation: string
          result_payload?: Json | null
          skin_type: string
          status?: string
          user_id: string
        }
        Update: {
          age_range?: string | null
          allergies?: string | null
          analysis_completeness?: number | null
          book_consultation?: boolean | null
          client_analysis_id?: string | null
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
          photo_storage_path?: string | null
          recommendation?: string
          result_payload?: Json | null
          skin_type?: string
          status?: string
          user_id?: string
        }
        Relationships: []
      }
      skynn_advanced_assessment_config: {
        Row: {
          active_definition_version: string
          active_prompt_version: string
          id: boolean
          rollout_stage: string
          updated_at: string
        }
        Insert: {
          active_definition_version: string
          active_prompt_version: string
          id?: boolean
          rollout_stage?: string
          updated_at?: string
        }
        Update: {
          active_definition_version?: string
          active_prompt_version?: string
          id?: boolean
          rollout_stage?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "skynn_advanced_assessment_config_active_definition_version_fkey"
            columns: ["active_definition_version"]
            isOneToOne: false
            referencedRelation: "assessment_definitions"
            referencedColumns: ["version"]
          },
          {
            foreignKeyName: "skynn_advanced_assessment_config_active_prompt_version_fkey"
            columns: ["active_prompt_version"]
            isOneToOne: false
            referencedRelation: "assessment_prompt_versions"
            referencedColumns: ["version"]
          },
        ]
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
      spotlight_editions: {
        Row: {
          created_at: string
          edition_label: string
          id: string
          is_current: boolean
          methodology_version: string
          review_count_at_snapshot: number
        }
        Insert: {
          created_at?: string
          edition_label: string
          id?: string
          is_current?: boolean
          methodology_version: string
          review_count_at_snapshot: number
        }
        Update: {
          created_at?: string
          edition_label?: string
          id?: string
          is_current?: boolean
          methodology_version?: string
          review_count_at_snapshot?: number
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
      web_stories: {
        Row: {
          cover_image_alt: string
          cover_image_url: string
          created_at: string
          cta_label: string | null
          cta_url: string | null
          expires_at: string | null
          id: string
          is_sponsored: boolean
          kind: Database["public"]["Enums"]["web_story_kind"]
          publish_at: string
          rail_position: number | null
          slug: string
          sponsor_name: string | null
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_alt?: string
          cover_image_url: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          expires_at?: string | null
          id?: string
          is_sponsored?: boolean
          kind?: Database["public"]["Enums"]["web_story_kind"]
          publish_at?: string
          rail_position?: number | null
          slug: string
          sponsor_name?: string | null
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_alt?: string
          cover_image_url?: string
          created_at?: string
          cta_label?: string | null
          cta_url?: string | null
          expires_at?: string | null
          id?: string
          is_sponsored?: boolean
          kind?: Database["public"]["Enums"]["web_story_kind"]
          publish_at?: string
          rail_position?: number | null
          slug?: string
          sponsor_name?: string | null
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      web_story_pages: {
        Row: {
          body: string | null
          created_at: string
          duration_ms: number
          headline: string | null
          id: string
          media_alt: string
          media_type: string
          media_url: string
          position: number
          poster_url: string | null
          story_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          duration_ms?: number
          headline?: string | null
          id?: string
          media_alt?: string
          media_type?: string
          media_url: string
          position: number
          poster_url?: string | null
          story_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          duration_ms?: number
          headline?: string | null
          id?: string
          media_alt?: string
          media_type?: string
          media_url?: string
          position?: number
          poster_url?: string | null
          story_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "web_story_pages_story_id_fkey"
            columns: ["story_id"]
            isOneToOne: false
            referencedRelation: "web_stories"
            referencedColumns: ["id"]
          },
        ]
      }
      web_story_events: {
        Row: {
          created_at: string
          event: string
          id: string
          page_index: number | null
          story_key: string
          surface: string
        }
        Insert: {
          created_at?: string
          event: string
          id?: string
          page_index?: number | null
          story_key: string
          surface?: string
        }
        Update: {
          created_at?: string
          event?: string
          id?: string
          page_index?: number | null
          story_key?: string
          surface?: string
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
      marketplace_product_internal_rating_summary: {
        Row: {
          avg_rating: number | null
          product_id: string | null
          rating_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_product_user_ratings_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "marketplace_products"
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
      admin_override_entitlement: {
        Args: {
          _reason: string
          _subscription_status: string
          _target_user_id: string
        }
        Returns: undefined
      }
      admin_search_profiles: {
        Args: { _page?: number; _page_size?: number; _query?: string }
        Returns: {
          account_status: string
          created_at: string
          email: string
          founding_member: boolean
          full_name: string
          id: string
          roles: Database["public"]["Enums"]["app_role"][]
          subscription_status: string
          total_count: number
          user_id: string
        }[]
      }
      admin_set_user_role: {
        Args: {
          _grant: boolean
          _role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: undefined
      }
      available_ai_credits: { Args: { _user_id?: string }; Returns: number }
      cancel_email_job: {
        Args: { p_job_id: string; p_reason: string }
        Returns: boolean
      }
      cancel_subscription: { Args: never; Returns: boolean }
      claim_founding_member_slot: {
        Args: { p_offer_id: string }
        Returns: boolean
      }
      claim_pending_email_jobs: {
        Args: { p_limit?: number }
        Returns: {
          attempt_count: number
          cancelled_at: string | null
          category: string
          created_at: string
          event_id: string
          failed_at: string | null
          id: string
          idempotency_key: string
          last_error: string | null
          max_attempts: number
          payload: Json
          priority: number
          processing_started_at: string | null
          processing_token: string | null
          provider_message_id: string | null
          recipient_email: string | null
          scheduled_at: string
          sent_at: string | null
          status: string
          template_id: string
          transactional: boolean
          updated_at: string
          user_id: string | null
        }[]
        SetofOptions: {
          from: "*"
          to: "email_outbox"
          isOneToOne: false
          isSetofReturn: true
        }
      }
      claim_starter_analysis: {
        Args: { p_variant_key?: string }
        Returns: {
          allowed: boolean
          remaining_free: number
          source: string
        }[]
      }
      complete_advanced_assessment_session: {
        Args: {
          p_confidence: string
          p_engine_version: string
          p_evidence_version: string
          p_model: string
          p_prompt_version: string
          p_report: Json
          p_safety_flags: Json
          p_session_id: string
        }
        Returns: undefined
      }
      complete_email_job: {
        Args: {
          p_job_id: string
          p_processing_token: string
          p_provider_message_id: string
        }
        Returns: boolean
      }
      compute_assessment_completeness: {
        Args: { p_responses: Json; p_sections: Json }
        Returns: number
      }
      consume_analysis_pass: {
        Args: never
        Returns: {
          allowed: boolean
          remaining: number
          transaction_id: string
        }[]
      }
      create_notification: {
        Args: {
          p_body?: string
          p_category: string
          p_link?: string
          p_title: string
          p_user_id: string
        }
        Returns: undefined
      }
      deactivate_account: { Args: never; Returns: boolean }
      enqueue_email: {
        Args: {
          p_category: string
          p_event_idempotency_key: string
          p_event_type: string
          p_job_idempotency_key?: string
          p_payload: Json
          p_priority?: number
          p_recipient_email: string
          p_scheduled_at?: string
          p_source: string
          p_template_id: string
          p_transactional?: boolean
          p_user_id: string
        }
        Returns: string
      }
      enqueue_email_event: {
        Args: {
          p_event_type: string
          p_idempotency_key: string
          p_payload: Json
          p_recipient_email: string
          p_source: string
          p_user_id: string
        }
        Returns: string
      }
      enqueue_email_job: {
        Args: {
          p_category: string
          p_event_id: string
          p_idempotency_key: string
          p_payload: Json
          p_priority?: number
          p_recipient_email: string
          p_scheduled_at?: string
          p_template_id: string
          p_transactional: boolean
          p_user_id: string
        }
        Returns: string
      }
      enqueue_trial_expiring_events: { Args: never; Returns: number }
      enqueue_weekly_newsletter_digest: { Args: never; Returns: number }
      expire_finished_trials: { Args: never; Returns: number }
      fail_advanced_assessment_session: {
        Args: { p_error_message: string; p_session_id: string }
        Returns: undefined
      }
      fail_email_job: {
        Args: { p_error: string; p_job_id: string; p_processing_token: string }
        Returns: boolean
      }
      get_advanced_assessment_access: {
        Args: never
        Returns: {
          access_type: string
          eligible: boolean
          membership_tier: string
          passes_available: number
          rollout_stage: string
        }[]
      }
      get_article_body: {
        Args: { p_device_id?: string; p_slug: string }
        Returns: {
          body_markdown: string
          inline_images: Json
        }[]
      }
      get_ingredient_interaction: {
        Args: { a: string; b: string }
        Returns: {
          confidence: Database["public"]["Enums"]["confidence_level"]
          explanation: string
          id: string
          interaction_type: Database["public"]["Enums"]["ingredient_interaction_type"]
          notes: string
          source_url: string
          usage_guidance: string
        }[]
      }
      get_preorder_count: { Args: { p_product_type: string }; Returns: number }
      get_routine_conflicts: {
        Args: { p_ingredient_ids: string[] }
        Returns: {
          confidence: Database["public"]["Enums"]["confidence_level"]
          explanation: string
          id: string
          ingredient_a_id: string
          ingredient_b_id: string
          interaction_type: Database["public"]["Enums"]["ingredient_interaction_type"]
          source_url: string
          usage_guidance: string
        }[]
      }
      grant_ai_credits:
        | {
            Args: {
              p_credits: number
              p_expires_after_days?: number
              p_reason: string
              p_user_id: string
            }
            Returns: undefined
          }
        | {
            Args: {
              p_credits: number
              p_expires_after_days?: number
              p_reason: string
              p_reference?: string
              p_user_id: string
            }
            Returns: boolean
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
      mark_advanced_assessment_processing: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      reactivate_account: { Args: never; Returns: boolean }
      refund_analysis_pass: {
        Args: { p_transaction_id: string }
        Returns: boolean
      }
      register_ai_analysis_use: { Args: never; Returns: boolean }
      register_article_view: { Args: { p_article_id: string }; Returns: number }
      save_advanced_assessment_progress: {
        Args: {
          p_current_section_id: string
          p_responses: Json
          p_safety_screen?: Json
          p_session_id: string
        }
        Returns: {
          access_type: string | null
          assessment_definition_id: string
          assessment_version: string
          completed_at: string | null
          completeness_pct: number
          created_at: string
          current_section_id: string | null
          engine_version: string
          expires_at: string
          failure_reason: string | null
          id: string
          idempotency_key: string | null
          pass_transaction_id: string | null
          question_library_version: string
          responses: Json
          safety_screen: Json | null
          scoring_rules_version: string
          status: string
          submission_version: number
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "advanced_assessment_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      search_ingredients: {
        Args: {
          p_category?: string
          p_concern_slug?: string
          p_evidence?: Database["public"]["Enums"]["evidence_level"]
          p_page?: number
          p_per_page?: number
          p_search?: string
        }
        Returns: {
          category: string
          common_name: string
          evidence_level: Database["public"]["Enums"]["evidence_level"]
          id: string
          inci_name: string
          irritancy_risk: Database["public"]["Enums"]["irritancy_risk"]
          pregnancy_safe: boolean
          short_description: string
          slug: string
          total_count: number
        }[]
      }
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
      start_advanced_assessment_session: {
        Args: never
        Returns: {
          access_type: string | null
          assessment_definition_id: string
          assessment_version: string
          completed_at: string | null
          completeness_pct: number
          created_at: string
          current_section_id: string | null
          engine_version: string
          expires_at: string
          failure_reason: string | null
          id: string
          idempotency_key: string | null
          pass_transaction_id: string | null
          question_library_version: string
          responses: Json
          safety_screen: Json | null
          scoring_rules_version: string
          status: string
          submission_version: number
          submitted_at: string | null
          updated_at: string
          user_id: string
        }
        SetofOptions: {
          from: "*"
          to: "advanced_assessment_sessions"
          isOneToOne: true
          isSetofReturn: false
        }
      }
      start_free_trial: {
        Args: { p_plan: string; p_variant_key?: string }
        Returns: boolean
      }
      submit_advanced_assessment_session: {
        Args: { p_safety_screen?: Json; p_session_id: string }
        Returns: {
          access_type: string
          report_id: string
          session_status: string
        }[]
      }
      subscription_ladder_rank: { Args: { p_status: string }; Returns: number }
      unsubscribe_marketing: { Args: { p_token: string }; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      web_story_kind: "editorial" | "briefing" | "review" | "comparison" | "video" | "promotional"
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
        | "peer_reviewed_literature"
        | "regulatory_database"
      evidence_level: "strong" | "moderate" | "limited" | "anecdotal" | "none"
      ingredient_alias_type:
        | "common_name"
        | "abbreviation"
        | "inci_variant"
        | "synonym"
      ingredient_concern_relationship: "treats" | "may_worsen" | "preventive"
      ingredient_interaction_type:
        | "avoid_combining"
        | "enhances"
        | "buffers"
        | "requires_spacing"
        | "compatible"
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
      web_story_kind: ["editorial", "briefing", "review", "comparison", "video", "promotional"],
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
        "peer_reviewed_literature",
        "regulatory_database",
      ],
      evidence_level: ["strong", "moderate", "limited", "anecdotal", "none"],
      ingredient_alias_type: [
        "common_name",
        "abbreviation",
        "inci_variant",
        "synonym",
      ],
      ingredient_concern_relationship: ["treats", "may_worsen", "preventive"],
      ingredient_interaction_type: [
        "avoid_combining",
        "enhances",
        "buffers",
        "requires_spacing",
        "compatible",
      ],
      irritancy_risk: ["low", "moderate", "high"],
      skin_fit_rating: ["excellent", "good", "caution", "avoid"],
    },
  },
} as const
