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
      advanced_assessment_audit_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_type: string
          at: string
          id: number
          meta: Json
          report_id: string | null
          session_id: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_type: string
          at?: string
          id?: never
          meta?: Json
          report_id?: string | null
          session_id?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_type?: string
          at?: string
          id?: never
          meta?: Json
          report_id?: string | null
          session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "advanced_assessment_audit_log_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "advanced_assessment_reports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "advanced_assessment_audit_log_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "advanced_assessment_sessions"
            referencedColumns: ["id"]
          },
        ]
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
          citation_code: string | null
          created_at: string
          doi: string | null
          evidence_version: string
          id: string
          pmid: string | null
          publication_date: string | null
          publication_year: number | null
          publisher: string | null
          source_type: string
          summary: string
          title: string
          topic_tags: string[]
          url: string | null
          verification_note: string | null
          verification_status: string
          verified_by: string | null
        }
        Insert: {
          citation_code?: string | null
          created_at?: string
          doi?: string | null
          evidence_version: string
          id?: string
          pmid?: string | null
          publication_date?: string | null
          publication_year?: number | null
          publisher?: string | null
          source_type: string
          summary: string
          title: string
          topic_tags?: string[]
          url?: string | null
          verification_note?: string | null
          verification_status?: string
          verified_by?: string | null
        }
        Update: {
          citation_code?: string | null
          created_at?: string
          doi?: string | null
          evidence_version?: string
          id?: string
          pmid?: string | null
          publication_date?: string | null
          publication_year?: number | null
          publisher?: string | null
          source_type?: string
          summary?: string
          title?: string
          topic_tags?: string[]
          url?: string | null
          verification_note?: string | null
          verification_status?: string
          verified_by?: string | null
        }
        Relationships: []
      }
      advanced_assessment_reports: {
        Row: {
          attempts: number
          confidence: string | null
          consent_snapshot: Json | null
          created_at: string
          definition_version: string | null
          email_summary: string | null
          engine_version: string | null
          error_message: string | null
          evidence_version: string | null
          generated_at: string | null
          generation_status: string
          id: string
          intake_attempts: number
          intake_next_attempt_at: string | null
          intake_scores: Json | null
          intake_status: string | null
          intake_triage: Json | null
          internal_email_attempts: number
          internal_email_error: string | null
          internal_email_last_attempt_at: string | null
          internal_email_recipient: string | null
          internal_email_sent_at: string | null
          internal_email_status: string | null
          locked_at: string | null
          locked_by: string | null
          model: string | null
          models: Json | null
          mst_tier: number | null
          pdf_error: string | null
          pdf_generated_at: string | null
          pdf_status: string | null
          pdf_storage_path: string | null
          pipeline_stage: string | null
          pipeline_state: Json | null
          processing_mode: string
          prompt_set: string | null
          prompt_version: string | null
          qa_result: Json | null
          reference_number: string | null
          released_at: string | null
          rendered_markdown: string | null
          report: Json | null
          review_notes: string | null
          review_status: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          safety_flags: Json | null
          scores: Json | null
          scoring_version: string | null
          session_id: string
          submitted_at: string | null
          triage: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          attempts?: number
          confidence?: string | null
          consent_snapshot?: Json | null
          created_at?: string
          definition_version?: string | null
          email_summary?: string | null
          engine_version?: string | null
          error_message?: string | null
          evidence_version?: string | null
          generated_at?: string | null
          generation_status?: string
          id?: string
          intake_attempts?: number
          intake_next_attempt_at?: string | null
          intake_scores?: Json | null
          intake_status?: string | null
          intake_triage?: Json | null
          internal_email_attempts?: number
          internal_email_error?: string | null
          internal_email_last_attempt_at?: string | null
          internal_email_recipient?: string | null
          internal_email_sent_at?: string | null
          internal_email_status?: string | null
          locked_at?: string | null
          locked_by?: string | null
          model?: string | null
          models?: Json | null
          mst_tier?: number | null
          pdf_error?: string | null
          pdf_generated_at?: string | null
          pdf_status?: string | null
          pdf_storage_path?: string | null
          pipeline_stage?: string | null
          pipeline_state?: Json | null
          processing_mode?: string
          prompt_set?: string | null
          prompt_version?: string | null
          qa_result?: Json | null
          reference_number?: string | null
          released_at?: string | null
          rendered_markdown?: string | null
          report?: Json | null
          review_notes?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          safety_flags?: Json | null
          scores?: Json | null
          scoring_version?: string | null
          session_id: string
          submitted_at?: string | null
          triage?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          attempts?: number
          confidence?: string | null
          consent_snapshot?: Json | null
          created_at?: string
          definition_version?: string | null
          email_summary?: string | null
          engine_version?: string | null
          error_message?: string | null
          evidence_version?: string | null
          generated_at?: string | null
          generation_status?: string
          id?: string
          intake_attempts?: number
          intake_next_attempt_at?: string | null
          intake_scores?: Json | null
          intake_status?: string | null
          intake_triage?: Json | null
          internal_email_attempts?: number
          internal_email_error?: string | null
          internal_email_last_attempt_at?: string | null
          internal_email_recipient?: string | null
          internal_email_sent_at?: string | null
          internal_email_status?: string | null
          locked_at?: string | null
          locked_by?: string | null
          model?: string | null
          models?: Json | null
          mst_tier?: number | null
          pdf_error?: string | null
          pdf_generated_at?: string | null
          pdf_status?: string | null
          pdf_storage_path?: string | null
          pipeline_stage?: string | null
          pipeline_state?: Json | null
          processing_mode?: string
          prompt_set?: string | null
          prompt_version?: string | null
          qa_result?: Json | null
          reference_number?: string | null
          released_at?: string | null
          rendered_markdown?: string | null
          report?: Json | null
          review_notes?: string | null
          review_status?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          safety_flags?: Json | null
          scores?: Json | null
          scoring_version?: string | null
          session_id?: string
          submitted_at?: string | null
          triage?: string | null
          updated_at?: string
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
          basic_analysis_id: string | null
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
          prefilled_question_ids: string[] | null
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
          basic_analysis_id?: string | null
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
          prefilled_question_ids?: string[] | null
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
          basic_analysis_id?: string | null
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
          prefilled_question_ids?: string[] | null
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
            foreignKeyName: "advanced_assessment_sessions_basic_analysis_id_fkey"
            columns: ["basic_analysis_id"]
            isOneToOne: false
            referencedRelation: "skincare_recommendations"
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
      ai_generated_comparisons: {
        Row: {
          body_markdown: string
          created_at: string
          dek: string
          faqs: Json
          generated_by: string
          id: string
          key_takeaways: string[]
          modified_date: string
          pair_key: string
          products_compared: Json
          publish_date: string
          reading_time: string
          sa_context: string
          seo_description: string
          seo_title: string
          source_review_ids: string[]
          thumbnail_alt: string
          thumbnail_credit_name: string
          thumbnail_credit_url: string
          thumbnail_url: string
          title: string
          verdicts: Json
        }
        Insert: {
          body_markdown: string
          created_at?: string
          dek: string
          faqs?: Json
          generated_by: string
          id: string
          key_takeaways?: string[]
          modified_date: string
          pair_key: string
          products_compared: Json
          publish_date: string
          reading_time?: string
          sa_context: string
          seo_description: string
          seo_title: string
          source_review_ids: string[]
          thumbnail_alt: string
          thumbnail_credit_name?: string
          thumbnail_credit_url?: string
          thumbnail_url: string
          title: string
          verdicts?: Json
        }
        Update: {
          body_markdown?: string
          created_at?: string
          dek?: string
          faqs?: Json
          generated_by?: string
          id?: string
          key_takeaways?: string[]
          modified_date?: string
          pair_key?: string
          products_compared?: Json
          publish_date?: string
          reading_time?: string
          sa_context?: string
          seo_description?: string
          seo_title?: string
          source_review_ids?: string[]
          thumbnail_alt?: string
          thumbnail_credit_name?: string
          thumbnail_credit_url?: string
          thumbnail_url?: string
          title?: string
          verdicts?: Json
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
          community_rating: number | null
          community_rating_count: number | null
          comparison_products: Json | null
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
          community_rating?: number | null
          community_rating_count?: number | null
          comparison_products?: Json | null
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
          community_rating?: number | null
          community_rating_count?: number | null
          comparison_products?: Json | null
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
      analysis_pass_grants: {
        Row: {
          admin_user_id: string
          created_at: string
          credits: number
          id: string
          note: string
          request_id: string | null
          target_email: string
          target_user_id: string
          transaction_id: string | null
        }
        Insert: {
          admin_user_id: string
          created_at?: string
          credits: number
          id?: string
          note: string
          request_id?: string | null
          target_email: string
          target_user_id: string
          transaction_id?: string | null
        }
        Update: {
          admin_user_id?: string
          created_at?: string
          credits?: number
          id?: string
          note?: string
          request_id?: string | null
          target_email?: string
          target_user_id?: string
          transaction_id?: string | null
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
      assessment_prompt_signoffs: {
        Row: {
          approved_on: string | null
          created_at: string
          definition_version: string
          dermatologist_name: string | null
          hpcsa_number: string | null
          notes: string | null
          prompt_set: string
          recorded_at: string | null
          recorded_by: string | null
          status: string
        }
        Insert: {
          approved_on?: string | null
          created_at?: string
          definition_version: string
          dermatologist_name?: string | null
          hpcsa_number?: string | null
          notes?: string | null
          prompt_set: string
          recorded_at?: string | null
          recorded_by?: string | null
          status?: string
        }
        Update: {
          approved_on?: string | null
          created_at?: string
          definition_version?: string
          dermatologist_name?: string | null
          hpcsa_number?: string | null
          notes?: string | null
          prompt_set?: string
          recorded_at?: string | null
          recorded_by?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "assessment_prompt_signoffs_definition_version_fkey"
            columns: ["definition_version"]
            isOneToOne: false
            referencedRelation: "assessment_definitions"
            referencedColumns: ["version"]
          },
        ]
      }
      assessment_prompt_versions: {
        Row: {
          created_at: string
          id: string
          is_placeholder: boolean
          model_default: string | null
          model_task: string | null
          notes: string | null
          prompt_set: string | null
          role: string | null
          source_reference: string | null
          status: string
          system_prompt: string | null
          version: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_placeholder?: boolean
          model_default?: string | null
          model_task?: string | null
          notes?: string | null
          prompt_set?: string | null
          role?: string | null
          source_reference?: string | null
          status?: string
          system_prompt?: string | null
          version: string
        }
        Update: {
          created_at?: string
          id?: string
          is_placeholder?: boolean
          model_default?: string | null
          model_task?: string | null
          notes?: string | null
          prompt_set?: string | null
          role?: string | null
          source_reference?: string | null
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
      consult_survey_responses: {
        Row: {
          booking_priority: number
          created_at: string
          feedback_text: string | null
          id: string
          primary_use: string
          sentiment: number
          trust_score: number
          useful_features: string[]
          user_id: string | null
        }
        Insert: {
          booking_priority: number
          created_at?: string
          feedback_text?: string | null
          id?: string
          primary_use: string
          sentiment: number
          trust_score: number
          useful_features?: string[]
          user_id?: string | null
        }
        Update: {
          booking_priority?: number
          created_at?: string
          feedback_text?: string | null
          id?: string
          primary_use?: string
          sentiment?: number
          trust_score?: number
          useful_features?: string[]
          user_id?: string | null
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
      feedback_survey_responses: {
        Row: {
          answer: string
          answer_label: string
          comment: string | null
          created_at: string
          id: string
          path: string | null
          question: string
          surface: string
          survey_id: string
          user_id: string
        }
        Insert: {
          answer: string
          answer_label: string
          comment?: string | null
          created_at?: string
          id?: string
          path?: string | null
          question: string
          surface: string
          survey_id: string
          user_id?: string
        }
        Update: {
          answer?: string
          answer_label?: string
          comment?: string | null
          created_at?: string
          id?: string
          path?: string | null
          question?: string
          surface?: string
          survey_id?: string
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
      giveaway_entries: {
        Row: {
          campaign: string
          created_at: string
          id: string
          status: string
          terms_version: string
          tiktok_handle: string
          updated_at: string
          user_id: string
        }
        Insert: {
          campaign: string
          created_at?: string
          id?: string
          status?: string
          terms_version: string
          tiktok_handle: string
          updated_at?: string
          user_id: string
        }
        Update: {
          campaign?: string
          created_at?: string
          id?: string
          status?: string
          terms_version?: string
          tiktok_handle?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
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
      ingredient_class_pair_rules: {
        Row: {
          class_a: string
          class_b: string
          created_at: string
          explanation: string
          interaction_type: Database["public"]["Enums"]["ingredient_interaction_type"]
          source_label: string
          source_url: string | null
          updated_at: string
          usage_guidance: string
        }
        Insert: {
          class_a: string
          class_b: string
          created_at?: string
          explanation: string
          interaction_type: Database["public"]["Enums"]["ingredient_interaction_type"]
          source_label?: string
          source_url?: string | null
          updated_at?: string
          usage_guidance: string
        }
        Update: {
          class_a?: string
          class_b?: string
          created_at?: string
          explanation?: string
          interaction_type?: Database["public"]["Enums"]["ingredient_interaction_type"]
          source_label?: string
          source_url?: string | null
          updated_at?: string
          usage_guidance?: string
        }
        Relationships: []
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
      ingredient_generation_requests: {
        Row: {
          id: string
          normalized_name: string
          rejection_reason: string | null
          requested_at: string
          requested_name: string
          resolved_at: string | null
          resolved_ingredient_id: string | null
          source: string
          source_ref: string | null
          status: Database["public"]["Enums"]["ingredient_generation_request_status"]
        }
        Insert: {
          id?: string
          normalized_name: string
          rejection_reason?: string | null
          requested_at?: string
          requested_name: string
          resolved_at?: string | null
          resolved_ingredient_id?: string | null
          source: string
          source_ref?: string | null
          status?: Database["public"]["Enums"]["ingredient_generation_request_status"]
        }
        Update: {
          id?: string
          normalized_name?: string
          rejection_reason?: string | null
          requested_at?: string
          requested_name?: string
          resolved_at?: string | null
          resolved_ingredient_id?: string | null
          source?: string
          source_ref?: string | null
          status?: Database["public"]["Enums"]["ingredient_generation_request_status"]
        }
        Relationships: [
          {
            foreignKeyName: "ingredient_generation_requests_resolved_ingredient_id_fkey"
            columns: ["resolved_ingredient_id"]
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
      marketplace_product_rating_stats: {
        Row: {
          avg_rating: number
          product_id: string
          rating_count: number
          updated_at: string
        }
        Insert: {
          avg_rating: number
          product_id: string
          rating_count: number
          updated_at?: string
        }
        Update: {
          avg_rating?: number
          product_id?: string
          rating_count?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_product_rating_stats_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
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
          price_checked_at: string | null
          size: string | null
          skin_tone_claims: string[]
          slug: string
          source_last_synced_at: string | null
          source_regular_price_zar: number | null
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
          price_checked_at?: string | null
          size?: string | null
          skin_tone_claims?: string[]
          slug: string
          source_last_synced_at?: string | null
          source_regular_price_zar?: number | null
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
          price_checked_at?: string | null
          size?: string | null
          skin_tone_claims?: string[]
          slug?: string
          source_last_synced_at?: string | null
          source_regular_price_zar?: number | null
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
      member_content_reads: {
        Row: {
          content_type: string
          first_read_at: string
          id: string
          slug: string
          user_id: string
        }
        Insert: {
          content_type: string
          first_read_at?: string
          id?: string
          slug: string
          user_id: string
        }
        Update: {
          content_type?: string
          first_read_at?: string
          id?: string
          slug?: string
          user_id?: string
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
          consultation_waitlist: boolean
          digest_confirm_token: string | null
          digest_confirmation_sent_at: string | null
          digest_confirmed_at: string | null
          digest_consent_text: string | null
          digest_consent_version: string | null
          digest_source: string | null
          digest_source_path: string | null
          digest_status: string
          digest_unsubscribed_at: string | null
          email: string
          id: string
          is_active: boolean
          subscribed_at: string
          unsubscribe_token: string
        }
        Insert: {
          consultation_waitlist?: boolean
          digest_confirm_token?: string | null
          digest_confirmation_sent_at?: string | null
          digest_confirmed_at?: string | null
          digest_consent_text?: string | null
          digest_consent_version?: string | null
          digest_source?: string | null
          digest_source_path?: string | null
          digest_status?: string
          digest_unsubscribed_at?: string | null
          email: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
          unsubscribe_token?: string
        }
        Update: {
          consultation_waitlist?: boolean
          digest_confirm_token?: string | null
          digest_confirmation_sent_at?: string | null
          digest_confirmed_at?: string | null
          digest_consent_text?: string | null
          digest_consent_version?: string | null
          digest_source?: string | null
          digest_source_path?: string | null
          digest_status?: string
          digest_unsubscribed_at?: string | null
          email?: string
          id?: string
          is_active?: boolean
          subscribed_at?: string
          unsubscribe_token?: string
        }
        Relationships: []
      }
      notification_admin_audit_log: {
        Row: {
          action: string
          admin_user_id: string | null
          created_at: string
          detail: Json
          id: string
        }
        Insert: {
          action: string
          admin_user_id?: string | null
          created_at?: string
          detail?: Json
          id?: string
        }
        Update: {
          action?: string
          admin_user_id?: string | null
          created_at?: string
          detail?: Json
          id?: string
        }
        Relationships: []
      }
      notification_automations: {
        Row: {
          audience: Json
          created_at: string
          description: string | null
          enabled: boolean
          event_key: string | null
          frequency: string | null
          id: string
          key: string
          last_run_at: string | null
          last_run_count: number | null
          month_day: number | null
          name: string
          send_time: string | null
          system: boolean
          template_key: string | null
          trigger_kind: string
          updated_at: string
          updated_by: string | null
          weekday: number | null
        }
        Insert: {
          audience?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          event_key?: string | null
          frequency?: string | null
          id?: string
          key: string
          last_run_at?: string | null
          last_run_count?: number | null
          month_day?: number | null
          name: string
          send_time?: string | null
          system?: boolean
          template_key?: string | null
          trigger_kind: string
          updated_at?: string
          updated_by?: string | null
          weekday?: number | null
        }
        Update: {
          audience?: Json
          created_at?: string
          description?: string | null
          enabled?: boolean
          event_key?: string | null
          frequency?: string | null
          id?: string
          key?: string
          last_run_at?: string | null
          last_run_count?: number | null
          month_day?: number | null
          name?: string
          send_time?: string | null
          system?: boolean
          template_key?: string | null
          trigger_kind?: string
          updated_at?: string
          updated_by?: string | null
          weekday?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "notification_automations_template_key_fkey"
            columns: ["template_key"]
            isOneToOne: false
            referencedRelation: "notification_templates"
            referencedColumns: ["key"]
          },
        ]
      }
      notification_campaigns: {
        Row: {
          audience: Json
          body: string
          cancelled_at: string | null
          category: string
          channels: string[]
          created_at: string
          created_by: string | null
          id: string
          name: string
          recipient_count: number | null
          scheduled_for: string | null
          sent_at: string | null
          status: string
          title: string
          updated_at: string
          url: string
        }
        Insert: {
          audience?: Json
          body: string
          cancelled_at?: string | null
          category: string
          channels?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          name: string
          recipient_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          title: string
          updated_at?: string
          url?: string
        }
        Update: {
          audience?: Json
          body?: string
          cancelled_at?: string | null
          category?: string
          channels?: string[]
          created_at?: string
          created_by?: string | null
          id?: string
          name?: string
          recipient_count?: number | null
          scheduled_for?: string | null
          sent_at?: string | null
          status?: string
          title?: string
          updated_at?: string
          url?: string
        }
        Relationships: []
      }
      notification_dispatches: {
        Row: {
          attempt_count: number
          automation_key: string | null
          body: string
          bypass_caps: boolean
          campaign_id: string | null
          category: string
          created_at: string
          devices_failed: number
          devices_sent: number
          devices_targeted: number
          guard: Json | null
          id: string
          idempotency_key: string
          inbox_notification_id: string | null
          last_error: string | null
          priority: number
          processing_started_at: string | null
          processing_token: string | null
          push_wanted: boolean
          scheduled_at: string
          sent_at: string | null
          skip_reason: string | null
          source: string
          status: string
          tag: string | null
          template_key: string | null
          title: string
          updated_at: string
          url: string
          user_id: string
        }
        Insert: {
          attempt_count?: number
          automation_key?: string | null
          body: string
          bypass_caps?: boolean
          campaign_id?: string | null
          category: string
          created_at?: string
          devices_failed?: number
          devices_sent?: number
          devices_targeted?: number
          guard?: Json | null
          id?: string
          idempotency_key: string
          inbox_notification_id?: string | null
          last_error?: string | null
          priority?: number
          processing_started_at?: string | null
          processing_token?: string | null
          push_wanted: boolean
          scheduled_at?: string
          sent_at?: string | null
          skip_reason?: string | null
          source: string
          status?: string
          tag?: string | null
          template_key?: string | null
          title: string
          updated_at?: string
          url: string
          user_id: string
        }
        Update: {
          attempt_count?: number
          automation_key?: string | null
          body?: string
          bypass_caps?: boolean
          campaign_id?: string | null
          category?: string
          created_at?: string
          devices_failed?: number
          devices_sent?: number
          devices_targeted?: number
          guard?: Json | null
          id?: string
          idempotency_key?: string
          inbox_notification_id?: string | null
          last_error?: string | null
          priority?: number
          processing_started_at?: string | null
          processing_token?: string | null
          push_wanted?: boolean
          scheduled_at?: string
          sent_at?: string | null
          skip_reason?: string | null
          source?: string
          status?: string
          tag?: string | null
          template_key?: string | null
          title?: string
          updated_at?: string
          url?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notification_dispatches_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "notification_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "notification_dispatches_inbox_notification_id_fkey"
            columns: ["inbox_notification_id"]
            isOneToOne: false
            referencedRelation: "notifications"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_preferences: {
        Row: {
          account_update: boolean
          briefing: boolean
          created_at: string
          daily_cap: number
          journal_reminder: boolean
          podcast_episode: boolean
          price_alert: boolean
          promotional: boolean
          promotional_opt_in_at: string | null
          quiet_hours_enabled: boolean
          quiet_hours_end: string
          quiet_hours_start: string
          report_ready: boolean
          routine_reminder: boolean
          routine_reminder_time: string | null
          service: boolean
          skin_weather: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          account_update?: boolean
          briefing?: boolean
          created_at?: string
          daily_cap?: number
          journal_reminder?: boolean
          podcast_episode?: boolean
          price_alert?: boolean
          promotional?: boolean
          promotional_opt_in_at?: string | null
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          report_ready?: boolean
          routine_reminder?: boolean
          routine_reminder_time?: string | null
          service?: boolean
          skin_weather?: boolean
          updated_at?: string
          user_id?: string
        }
        Update: {
          account_update?: boolean
          briefing?: boolean
          created_at?: string
          daily_cap?: number
          journal_reminder?: boolean
          podcast_episode?: boolean
          price_alert?: boolean
          promotional?: boolean
          promotional_opt_in_at?: string | null
          quiet_hours_enabled?: boolean
          quiet_hours_end?: string
          quiet_hours_start?: string
          report_ready?: boolean
          routine_reminder?: boolean
          routine_reminder_time?: string | null
          service?: boolean
          skin_weather?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      notification_settings: {
        Row: {
          default_daily_cap: number
          id: boolean
          push_enabled: boolean
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          default_daily_cap?: number
          id?: boolean
          push_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          default_daily_cap?: number
          id?: boolean
          push_enabled?: boolean
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      notification_templates: {
        Row: {
          body: string
          bypass_caps: boolean
          category: string
          channels: string[]
          created_at: string
          description: string | null
          enabled: boolean
          inbox_body: string | null
          inbox_category: string
          inbox_title: string | null
          key: string
          lock_screen_safe: boolean
          name: string
          priority: number
          system: boolean
          title: string
          updated_at: string
          updated_by: string | null
          url: string
        }
        Insert: {
          body: string
          bypass_caps?: boolean
          category: string
          channels?: string[]
          created_at?: string
          description?: string | null
          enabled?: boolean
          inbox_body?: string | null
          inbox_category?: string
          inbox_title?: string | null
          key: string
          lock_screen_safe?: boolean
          name: string
          priority?: number
          system?: boolean
          title: string
          updated_at?: string
          updated_by?: string | null
          url?: string
        }
        Update: {
          body?: string
          bypass_caps?: boolean
          category?: string
          channels?: string[]
          created_at?: string
          description?: string | null
          enabled?: boolean
          inbox_body?: string | null
          inbox_category?: string
          inbox_title?: string | null
          key?: string
          lock_screen_safe?: boolean
          name?: string
          priority?: number
          system?: boolean
          title?: string
          updated_at?: string
          updated_by?: string | null
          url?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_label: string | null
          archived_at: string | null
          body: string | null
          category: string
          created_at: string
          dispatch_id: string | null
          expires_at: string | null
          id: string
          image_url: string | null
          link: string | null
          read_at: string | null
          title: string
          user_id: string
        }
        Insert: {
          action_label?: string | null
          archived_at?: string | null
          body?: string | null
          category?: string
          created_at?: string
          dispatch_id?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
          link?: string | null
          read_at?: string | null
          title: string
          user_id: string
        }
        Update: {
          action_label?: string | null
          archived_at?: string | null
          body?: string | null
          category?: string
          created_at?: string
          dispatch_id?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string | null
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
      payment_subscriptions: {
        Row: {
          amount_charged: number
          amount_zar: number
          billing_interval: string
          cancelled_at: string | null
          created_at: string
          currency: string
          current_period_end: string | null
          first_billing_at: string | null
          fx_rate: number | null
          fx_rate_as_of: string | null
          fx_rate_source: string | null
          gateway: string
          gateway_subscription_id: string
          id: string
          metadata: Json
          next_billing_at: string | null
          payer_email: string | null
          payfast_token: string | null
          plan_id: string
          start_kind: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount_charged: number
          amount_zar: number
          billing_interval: string
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          first_billing_at?: string | null
          fx_rate?: number | null
          fx_rate_as_of?: string | null
          fx_rate_source?: string | null
          gateway: string
          gateway_subscription_id: string
          id?: string
          metadata?: Json
          next_billing_at?: string | null
          payer_email?: string | null
          payfast_token?: string | null
          plan_id: string
          start_kind: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount_charged?: number
          amount_zar?: number
          billing_interval?: string
          cancelled_at?: string | null
          created_at?: string
          currency?: string
          current_period_end?: string | null
          first_billing_at?: string | null
          fx_rate?: number | null
          fx_rate_as_of?: string | null
          fx_rate_source?: string | null
          gateway?: string
          gateway_subscription_id?: string
          id?: string
          metadata?: Json
          next_billing_at?: string | null
          payer_email?: string | null
          payfast_token?: string | null
          plan_id?: string
          start_kind?: string
          status?: string
          updated_at?: string
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
      paypal_billing_plans: {
        Row: {
          billing_interval: string
          created_at: string
          env: string
          paypal_plan_id: string | null
          paypal_product_id: string | null
          plan_id: string
        }
        Insert: {
          billing_interval: string
          created_at?: string
          env: string
          paypal_plan_id?: string | null
          paypal_product_id?: string | null
          plan_id: string
        }
        Update: {
          billing_interval?: string
          created_at?: string
          env?: string
          paypal_plan_id?: string | null
          paypal_product_id?: string | null
          plan_id?: string
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
      podcast_playback_progress: {
        Row: {
          client_updated_at: string
          duration_seconds: number | null
          episode_slug: string
          position_seconds: number
          updated_at: string
          user_id: string
        }
        Insert: {
          client_updated_at: string
          duration_seconds?: number | null
          episode_slug: string
          position_seconds: number
          updated_at?: string
          user_id: string
        }
        Update: {
          client_updated_at?: string
          duration_seconds?: number | null
          episode_slug?: string
          position_seconds?: number
          updated_at?: string
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
      practice_suite_waitlist: {
        Row: {
          admin_pain: string | null
          contact_consent: boolean
          created_at: string
          email: string
          full_name: string
          id: string
          practice_type: string
          practitioner_count: string
          province: string
          role: string
        }
        Insert: {
          admin_pain?: string | null
          contact_consent: boolean
          created_at?: string
          email: string
          full_name: string
          id?: string
          practice_type: string
          practitioner_count: string
          province: string
          role: string
        }
        Update: {
          admin_pain?: string | null
          contact_consent?: boolean
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          practice_type?: string
          practitioner_count?: string
          province?: string
          role?: string
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
          free_analysis_window_days: number
          promo_free_trial_until: string | null
          variant_key: string
        }
        Insert: {
          default_billing_interval?: string
          free_ai_analysis_allowance?: number
          free_analysis_window_days?: number
          promo_free_trial_until?: string | null
          variant_key?: string
        }
        Update: {
          default_billing_interval?: string
          free_ai_analysis_allowance?: number
          free_analysis_window_days?: number
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
          in_stock: boolean | null
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
          in_stock?: boolean | null
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
          in_stock?: boolean | null
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
          app_installed_at: string | null
          billing_interval: string
          checklist_dismissed_at: string | null
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
          last_free_analysis_at: string | null
          marketing_consent: boolean
          marketing_consent_at: string | null
          marketing_unsubscribe_token: string
          notes: string | null
          onboarding_completed_at: string | null
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
          username_generated: boolean
          weather_city_key: string | null
        }
        Insert: {
          account_status?: string
          address_line1?: string | null
          address_line2?: string | null
          allergies?: string[] | null
          app_installed_at?: string | null
          billing_interval?: string
          checklist_dismissed_at?: string | null
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
          last_free_analysis_at?: string | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          marketing_unsubscribe_token?: string
          notes?: string | null
          onboarding_completed_at?: string | null
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
          username_generated?: boolean
          weather_city_key?: string | null
        }
        Update: {
          account_status?: string
          address_line1?: string | null
          address_line2?: string | null
          allergies?: string[] | null
          app_installed_at?: string | null
          billing_interval?: string
          checklist_dismissed_at?: string | null
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
          last_free_analysis_at?: string | null
          marketing_consent?: boolean
          marketing_consent_at?: string | null
          marketing_unsubscribe_token?: string
          notes?: string | null
          onboarding_completed_at?: string | null
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
          username_generated?: boolean
          weather_city_key?: string | null
        }
        Relationships: []
      }
      push_deliveries: {
        Row: {
          browser: string | null
          clicked_at: string | null
          created_at: string
          dispatch_id: string
          error: string | null
          http_status: number | null
          id: string
          platform: string | null
          status: string
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          browser?: string | null
          clicked_at?: string | null
          created_at?: string
          dispatch_id: string
          error?: string | null
          http_status?: number | null
          id?: string
          platform?: string | null
          status: string
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          browser?: string | null
          clicked_at?: string | null
          created_at?: string
          dispatch_id?: string
          error?: string | null
          http_status?: number | null
          id?: string
          platform?: string | null
          status?: string
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_deliveries_dispatch_id_fkey"
            columns: ["dispatch_id"]
            isOneToOne: false
            referencedRelation: "notification_dispatches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "push_deliveries_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "push_subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      push_subscriptions: {
        Row: {
          auth: string
          browser: string
          created_at: string
          endpoint: string
          failure_count: number
          id: string
          is_active: boolean
          last_used_at: string | null
          p256dh: string
          platform: string
          updated_at: string
          user_id: string
        }
        Insert: {
          auth: string
          browser?: string
          created_at?: string
          endpoint: string
          failure_count?: number
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          p256dh: string
          platform?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          auth?: string
          browser?: string
          created_at?: string
          endpoint?: string
          failure_count?: number
          id?: string
          is_active?: boolean
          last_used_at?: string | null
          p256dh?: string
          platform?: string
          updated_at?: string
          user_id?: string
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
      retailer_price_runs: {
        Row: {
          finished_at: string | null
          id: string
          mode: string
          retailer: string
          started_at: string
          status: string
          summary: Json
        }
        Insert: {
          finished_at?: string | null
          id?: string
          mode: string
          retailer: string
          started_at?: string
          status?: string
          summary?: Json
        }
        Update: {
          finished_at?: string | null
          id?: string
          mode?: string
          retailer?: string
          started_at?: string
          status?: string
          summary?: Json
        }
        Relationships: []
      }
      retailer_products: {
        Row: {
          consecutive_failures: number
          created_at: string
          discovery_checked_at: string | null
          id: string
          is_available: boolean
          last_attempt_at: string | null
          last_checked_at: string | null
          last_error: string | null
          last_verified_at: string | null
          listing_size_ml: number | null
          listing_title: string | null
          match_confidence: number | null
          match_reasons: Json | null
          match_status: string
          pending_price_zar: number | null
          product_variant_id: string
          retailer_id: string
          retailer_sku: string | null
          retailer_url: string | null
          source_type: Database["public"]["Enums"]["data_source_type"]
          verification_status: Database["public"]["Enums"]["data_quality_status"]
        }
        Insert: {
          consecutive_failures?: number
          created_at?: string
          discovery_checked_at?: string | null
          id?: string
          is_available?: boolean
          last_attempt_at?: string | null
          last_checked_at?: string | null
          last_error?: string | null
          last_verified_at?: string | null
          listing_size_ml?: number | null
          listing_title?: string | null
          match_confidence?: number | null
          match_reasons?: Json | null
          match_status?: string
          pending_price_zar?: number | null
          product_variant_id: string
          retailer_id: string
          retailer_sku?: string | null
          retailer_url?: string | null
          source_type?: Database["public"]["Enums"]["data_source_type"]
          verification_status?: Database["public"]["Enums"]["data_quality_status"]
        }
        Update: {
          consecutive_failures?: number
          created_at?: string
          discovery_checked_at?: string | null
          id?: string
          is_available?: boolean
          last_attempt_at?: string | null
          last_checked_at?: string | null
          last_error?: string | null
          last_verified_at?: string | null
          listing_size_ml?: number | null
          listing_title?: string | null
          match_confidence?: number | null
          match_reasons?: Json | null
          match_status?: string
          pending_price_zar?: number | null
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
          guidance: string | null
          id: string
          product_name: string | null
          product_slug: string | null
          smart_routine_id: string | null
          sort_order: number
          source: string
          step_name: string
          time_of_day: string
          user_id: string
        }
        Insert: {
          created_at?: string
          guidance?: string | null
          id?: string
          product_name?: string | null
          product_slug?: string | null
          smart_routine_id?: string | null
          sort_order?: number
          source?: string
          step_name: string
          time_of_day?: string
          user_id: string
        }
        Update: {
          created_at?: string
          guidance?: string | null
          id?: string
          product_name?: string | null
          product_slug?: string | null
          smart_routine_id?: string | null
          sort_order?: number
          source?: string
          step_name?: string
          time_of_day?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "routine_steps_smart_routine_id_fkey"
            columns: ["smart_routine_id"]
            isOneToOne: false
            referencedRelation: "smart_routines"
            referencedColumns: ["id"]
          },
        ]
      }
      shelf_items: {
        Row: {
          actives: string[]
          amount_per_use_ml: number | null
          brand: string | null
          category: string
          created_at: string
          finished_on: string | null
          id: string
          looks_oxidised: boolean
          name: string
          opened_on: string
          pao_months: number
          routine_step_id: string | null
          size_ml: number | null
          user_id: string
          uses_per_week: number | null
        }
        Insert: {
          actives?: string[]
          amount_per_use_ml?: number | null
          brand?: string | null
          category?: string
          created_at?: string
          finished_on?: string | null
          id?: string
          looks_oxidised?: boolean
          name: string
          opened_on: string
          pao_months: number
          routine_step_id?: string | null
          size_ml?: number | null
          user_id: string
          uses_per_week?: number | null
        }
        Update: {
          actives?: string[]
          amount_per_use_ml?: number | null
          brand?: string | null
          category?: string
          created_at?: string
          finished_on?: string | null
          id?: string
          looks_oxidised?: boolean
          name?: string
          opened_on?: string
          pao_months?: number
          routine_step_id?: string | null
          size_ml?: number | null
          user_id?: string
          uses_per_week?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "shelf_items_routine_step_id_fkey"
            columns: ["routine_step_id"]
            isOneToOne: false
            referencedRelation: "routine_steps"
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
      skin_photo_journal_entries: {
        Row: {
          captured_at: string
          created_at: string
          entry_type: string
          id: string
          note: string | null
          source_analysis_id: string | null
          storage_path: string
          user_id: string
        }
        Insert: {
          captured_at?: string
          created_at?: string
          entry_type?: string
          id?: string
          note?: string | null
          source_analysis_id?: string | null
          storage_path: string
          user_id: string
        }
        Update: {
          captured_at?: string
          created_at?: string
          entry_type?: string
          id?: string
          note?: string | null
          source_analysis_id?: string | null
          storage_path?: string
          user_id?: string
        }
        Relationships: []
      }
      skin_photo_journal_settings: {
        Row: {
          created_at: string
          frequency: string
          reminder_enabled: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          frequency?: string
          reminder_enabled?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          frequency?: string
          reminder_enabled?: boolean
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
      skin_weather_cache: {
        Row: {
          city_key: string
          fetched_at: string
          payload: Json
          provider: string
        }
        Insert: {
          city_key: string
          fetched_at?: string
          payload: Json
          provider: string
        }
        Update: {
          city_key?: string
          fetched_at?: string
          payload?: Json
          provider?: string
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
          active_prompt_set: string | null
          active_prompt_version: string
          id: boolean
          report_mode: string
          rollout_stage: string
          updated_at: string
        }
        Insert: {
          active_definition_version: string
          active_prompt_set?: string | null
          active_prompt_version: string
          id?: boolean
          report_mode?: string
          rollout_stage?: string
          updated_at?: string
        }
        Update: {
          active_definition_version?: string
          active_prompt_set?: string | null
          active_prompt_version?: string
          id?: boolean
          report_mode?: string
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
      smart_routines: {
        Row: {
          advanced_session_id: string | null
          basic_analysis_id: string | null
          created_at: string
          engine_version: string
          id: string
          routine: Json
          season: string | null
          source: string
          updated_at: string
          user_id: string
        }
        Insert: {
          advanced_session_id?: string | null
          basic_analysis_id?: string | null
          created_at?: string
          engine_version: string
          id?: string
          routine: Json
          season?: string | null
          source: string
          updated_at?: string
          user_id: string
        }
        Update: {
          advanced_session_id?: string | null
          basic_analysis_id?: string | null
          created_at?: string
          engine_version?: string
          id?: string
          routine?: Json
          season?: string | null
          source?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "smart_routines_advanced_session_id_fkey"
            columns: ["advanced_session_id"]
            isOneToOne: false
            referencedRelation: "advanced_assessment_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "smart_routines_basic_analysis_id_fkey"
            columns: ["basic_analysis_id"]
            isOneToOne: false
            referencedRelation: "skincare_recommendations"
            referencedColumns: ["id"]
          },
        ]
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
      tiktok_event_log: {
        Row: {
          content_id: string | null
          created_at: string
          event_id: string
          event_name: string
          id: number
          identified: boolean
          page_key: string
          path: string | null
          status: string
          upstream_code: number | null
        }
        Insert: {
          content_id?: string | null
          created_at?: string
          event_id: string
          event_name: string
          id?: never
          identified?: boolean
          page_key: string
          path?: string | null
          status: string
          upstream_code?: number | null
        }
        Update: {
          content_id?: string | null
          created_at?: string
          event_id?: string
          event_name?: string
          id?: never
          identified?: boolean
          page_key?: string
          path?: string | null
          status?: string
          upstream_code?: number | null
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
    }
    Views: {
      conversion_funnel_daily: {
        Row: {
          day: string | null
          live_subscriptions_created: number | null
          paid_subscriptions_started: number | null
          signups: number | null
          starter_analyses_saved: number | null
          trials_started: number | null
        }
        Relationships: []
      }
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
        Insert: {
          avg_rating?: number | null
          product_id?: string | null
          rating_count?: number | null
        }
        Update: {
          avg_rating?: number | null
          product_id?: string | null
          rating_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_product_rating_stats_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: true
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
      review_live_prices: {
        Row: {
          checked_at: string | null
          in_stock: boolean | null
          price_zar: number | null
          review_id: string | null
          source_name: string | null
          source_path: string | null
        }
        Relationships: []
      }
      sa_retail_prices: {
        Row: {
          checked_at: string | null
          in_stock: boolean | null
          listing_size_ml: number | null
          listing_title: string | null
          listing_url: string | null
          price_since: string | null
          price_zar: number | null
          product_slug: string | null
          retailer_name: string | null
          retailer_slug: string | null
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
      _refund_advanced_session_pass: {
        Args: {
          p_session: Database["public"]["Tables"]["advanced_assessment_sessions"]["Row"]
        }
        Returns: boolean
      }
      admin_announce_podcast_episode: {
        Args: {
          p_audience?: Json
          p_confirm_recipients?: number
          p_slug: string
          p_title: string
        }
        Returns: number
      }
      admin_campaign_attribution: { Args: { p_days?: number }; Returns: Json }
      admin_cancel_notification_campaign: {
        Args: { p_id: string }
        Returns: number
      }
      admin_create_notification_automation: {
        Args: {
          p_audience?: Json
          p_description: string
          p_frequency: string
          p_key: string
          p_month_day?: number
          p_name: string
          p_send_time: string
          p_template_key: string
          p_weekday?: number
        }
        Returns: string
      }
      admin_events_overview: { Args: { p_days?: number }; Returns: Json }
      admin_get_advanced_assessment_review: {
        Args: { p_report_id: string }
        Returns: Json
      }
      admin_get_advanced_intake: {
        Args: { p_report_id: string }
        Returns: Json
      }
      admin_get_prompt_signoffs: {
        Args: never
        Returns: {
          approved_on: string
          definition_version: string
          dermatologist_name: string
          hpcsa_number: string
          is_active: boolean
          prompt_set: string
          recorded_at: string
          status: string
        }[]
      }
      admin_giveaway_entries: {
        Args: { p_campaign?: string }
        Returns: {
          created_at: string
          email: string
          id: string
          status: string
          terms_version: string
          tiktok_handle: string
        }[]
      }
      admin_ingredient_pair_note_coverage: { Args: never; Returns: Json }
      admin_issue_analysis_passes: {
        Args: {
          p_credits: number
          p_email: string
          p_note: string
          p_request_id: string
        }
        Returns: {
          already_issued: boolean
          credits_issued: number
          email: string
          pass_balance: number
          user_id: string
        }[]
      }
      admin_list_advanced_assessment_reviews: {
        Args: { p_status?: string }
        Returns: {
          confidence: string
          created_at: string
          generated_at: string
          mst_tier: number
          prompt_set: string
          qa_attempts: number
          regulatory_flags: Json
          report_id: string
          review_status: string
          reviewed_at: string
          session_id: string
          triage: string
        }[]
      }
      admin_list_advanced_intake: {
        Args: {
          p_from?: string
          p_limit?: number
          p_mode?: string
          p_offset?: number
          p_search?: string
          p_status?: string
          p_to?: string
        }
        Returns: {
          access_type: string
          definition_version: string
          internal_email_attempts: number
          internal_email_status: string
          pass_consumed: boolean
          pdf_status: string
          processing_mode: string
          reference_number: string
          report_id: string
          session_id: string
          status: string
          submitted_at: string
          total_count: number
          updated_at: string
          user_email: string
          user_id: string
        }[]
      }
      admin_list_feature_waitlist: {
        Args: { p_feature?: string; p_limit?: number }
        Returns: {
          created_at: string
          email: string
          feature_key: string
          full_name: string
          user_id: string
        }[]
      }
      admin_list_notification_audit: {
        Args: { p_limit?: number }
        Returns: Json
      }
      admin_list_notification_automations: {
        Args: { p_days?: number }
        Returns: Json
      }
      admin_list_notification_campaigns: {
        Args: { p_limit?: number }
        Returns: Json
      }
      admin_list_notification_dispatches: {
        Args: {
          p_limit?: number
          p_offset?: number
          p_source?: string
          p_status?: string
        }
        Returns: Json
      }
      admin_list_notification_templates: { Args: never; Returns: Json }
      admin_lookup_analysis_pass_account: {
        Args: { p_email: string }
        Returns: {
          email: string
          full_name: string
          pass_balance: number
          subscription_status: string
          user_id: string
        }[]
      }
      admin_notification_overview: { Args: { p_days?: number }; Returns: Json }
      admin_override_entitlement: {
        Args: {
          _reason: string
          _subscription_status: string
          _target_user_id: string
        }
        Returns: undefined
      }
      admin_preview_notification_audience: {
        Args: { p_audience: Json; p_category?: string; p_channels?: string[] }
        Returns: Json
      }
      admin_promote_advanced_intake_to_production: {
        Args: { p_report_ids?: string[] }
        Returns: number
      }
      admin_pwa_overview: { Args: { p_days?: number }; Returns: Json }
      admin_record_prompt_signoff: {
        Args: {
          p_approved_on: string
          p_dermatologist_name: string
          p_hpcsa_number: string
          p_notes?: string
          p_prompt_set: string
        }
        Returns: undefined
      }
      admin_reject_advanced_intake: {
        Args: { p_notes?: string; p_report_id: string }
        Returns: Json
      }
      admin_retry_advanced_intake: {
        Args: { p_report_id: string; p_what: string }
        Returns: undefined
      }
      admin_review_advanced_assessment: {
        Args: { p_decision: string; p_notes?: string; p_report_id: string }
        Returns: Json
      }
      admin_run_notification_automation_now: {
        Args: { p_key: string }
        Returns: number
      }
      admin_save_notification_campaign: {
        Args: {
          p_audience?: Json
          p_body: string
          p_category: string
          p_channels?: string[]
          p_id: string
          p_name: string
          p_title: string
          p_url?: string
        }
        Returns: string
      }
      admin_schedule_notification_campaign: {
        Args: {
          p_confirm_recipients?: number
          p_id: string
          p_scheduled_for: string
        }
        Returns: number
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
      admin_send_notification_campaign_now: {
        Args: { p_confirm_recipients?: number; p_id: string }
        Returns: number
      }
      admin_send_test_notification: {
        Args: { p_body?: string; p_title?: string; p_url?: string }
        Returns: string
      }
      admin_set_notification_settings: {
        Args: { p_default_daily_cap?: number; p_push_enabled?: boolean }
        Returns: Json
      }
      admin_set_user_role: {
        Args: {
          _grant: boolean
          _role: Database["public"]["Enums"]["app_role"]
          _target_user_id: string
        }
        Returns: undefined
      }
      admin_tiktok_events_overview: { Args: { p_days?: number }; Returns: Json }
      admin_update_notification_automation: {
        Args: {
          p_audience?: Json
          p_enabled?: boolean
          p_key: string
          p_month_day?: number
          p_send_time?: string
          p_template_key?: string
          p_weekday?: number
        }
        Returns: Json
      }
      admin_upsert_notification_template: {
        Args: {
          p_body: string
          p_category: string
          p_channels?: string[]
          p_description?: string
          p_enabled?: boolean
          p_inbox_body?: string
          p_inbox_title?: string
          p_key: string
          p_name: string
          p_title: string
          p_url?: string
        }
        Returns: Json
      }
      available_ai_credits: { Args: { _user_id?: string }; Returns: number }
      cancel_email_job: {
        Args: { p_job_id: string; p_reason: string }
        Returns: boolean
      }
      cancel_subscription: { Args: never; Returns: boolean }
      claim_advanced_assessment_jobs: {
        Args: { p_limit: number; p_worker: string }
        Returns: {
          attempts: number
          pipeline_state: Json
          report_id: string
          session_id: string
          user_id: string
        }[]
      }
      claim_advanced_intake_jobs: {
        Args: { p_limit: number; p_worker: string }
        Returns: {
          intake_attempts: number
          internal_email_status: string
          pdf_status: string
          pdf_storage_path: string
          reference_number: string
          report_id: string
          session_id: string
          submitted_at: string
          user_id: string
        }[]
      }
      claim_founding_member_slot: {
        Args: { p_offer_id: string }
        Returns: boolean
      }
      claim_notification_dispatches: {
        Args: { p_limit?: number }
        Returns: {
          d_body: string
          d_category: string
          d_id: string
          d_subscriptions: Json
          d_tag: string
          d_title: string
          d_url: string
          d_user_id: string
        }[]
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
      complete_advanced_assessment_for_review: {
        Args: {
          p_confidence: string
          p_email_summary: string
          p_engine_version: string
          p_evidence_version: string
          p_markdown: string
          p_models: Json
          p_mst_tier: number
          p_prompt_set: string
          p_qa_result: Json
          p_report: Json
          p_report_id: string
          p_scores: Json
          p_triage: string
        }
        Returns: undefined
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
      complete_notification_dispatch: {
        Args: {
          p_error?: string
          p_failed: number
          p_id: string
          p_sent: number
        }
        Returns: undefined
      }
      compute_assessment_completeness: {
        Args: { p_responses: Json; p_sections: Json }
        Returns: number
      }
      confirm_newsletter: { Args: { p_token: string }; Returns: string }
      consume_analysis_pass: {
        Args: never
        Returns: {
          allowed: boolean
          remaining: number
          transaction_id: string
        }[]
      }
      conversion_funnel_daily_rows: {
        Args: never
        Returns: {
          day: string
          live_subscriptions_created: number
          paid_subscriptions_started: number
          signups: number
          starter_analyses_saved: number
          trials_started: number
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
      delete_advanced_assessment_for_user: {
        Args: { p_session_id: string; p_user_id: string }
        Returns: Json
      }
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
      enqueue_notification: {
        Args: {
          p_automation_key?: string
          p_campaign_id?: string
          p_guard?: Json
          p_idempotency_key?: string
          p_overrides?: Json
          p_scheduled_at?: string
          p_source?: string
          p_template_key: string
          p_user_id: string
          p_vars?: Json
        }
        Returns: string
      }
      enqueue_trial_expiring_events: { Args: never; Returns: number }
      enqueue_trial_lifecycle_emails: { Args: never; Returns: number }
      enqueue_weekly_newsletter_digest: { Args: never; Returns: number }
      enter_giveaway: {
        Args: {
          p_campaign: string
          p_confirmed: boolean
          p_terms_version: string
          p_tiktok_handle: string
        }
        Returns: Json
      }
      expire_finished_trials: { Args: never; Returns: number }
      expire_lapsed_subscriptions: { Args: never; Returns: number }
      fail_advanced_assessment_session: {
        Args: { p_error_message: string; p_session_id: string }
        Returns: undefined
      }
      fail_email_job: {
        Args: { p_error: string; p_job_id: string; p_processing_token: string }
        Returns: boolean
      }
      fan_out_notification_campaign: {
        Args: { p_campaign_id: string }
        Returns: number
      }
      formulator_tier: { Args: { _user_id: string }; Returns: string }
      generate_advanced_report_reference: { Args: never; Returns: string }
      generate_placeholder_username: { Args: never; Returns: string }
      get_advanced_assessment_access: {
        Args: never
        Returns: {
          access_type: string
          eligible: boolean
          membership_tier: string
          passes_available: number
          report_mode: string
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
      get_formulator_allowance: {
        Args: { p_variant_key?: string }
        Returns: {
          free_remaining: number
          last_analysis_at: string
          last_free_analysis_at: string
          next_unlock_at: string
          pass_balance: number
          tier: string
          unlimited: boolean
          window_days: number
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
      get_ingredient_pair_note: {
        Args: { a: string; b: string }
        Returns: {
          confidence: Database["public"]["Enums"]["confidence_level"]
          explanation: string
          id: string
          interaction_type: Database["public"]["Enums"]["ingredient_interaction_type"]
          note_source: string
          notes: string
          source_label: string
          source_url: string
          usage_guidance: string
        }[]
      }
      get_my_advanced_assessment_report: {
        Args: { p_report_id?: string; p_session_id?: string }
        Returns: Json
      }
      get_preorder_count: { Args: { p_product_type: string }; Returns: number }
      get_price_discovery_batch: {
        Args: { p_limit: number; p_retailer: string }
        Returns: {
          brand: string
          product_name: string
          product_slug: string
          size_ml: number
          variant_id: string
        }[]
      }
      get_price_refresh_batch: {
        Args: { p_limit: number; p_retailer: string }
        Returns: {
          last_price_at: string
          last_price_zar: number
          listing_url: string
          pending_price_zar: number
          retailer_product_id: string
        }[]
      }
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
      get_smart_routine_access: { Args: never; Returns: boolean }
      giveaway_closes_at: { Args: never; Returns: string }
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
      has_live_payment_subscription: {
        Args: { _user_id: string }
        Returns: boolean
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      has_smart_routine_access: { Args: { _user_id: string }; Returns: boolean }
      is_member: { Args: { _user_id: string }; Returns: boolean }
      is_professional_account: { Args: { _user_id: string }; Returns: boolean }
      is_profile_complete: { Args: { _user_id: string }; Returns: boolean }
      is_trial_activated: { Args: { _user_id: string }; Returns: boolean }
      is_username_available: { Args: { p_username: string }; Returns: boolean }
      join_consultation_waitlist: { Args: { p_email: string }; Returns: string }
      link_basic_analysis_to_advanced_session: {
        Args: {
          p_basic_analysis_id: string
          p_prefilled_question_ids?: string[]
          p_session_id: string
        }
        Returns: boolean
      }
      list_my_push_devices: {
        Args: never
        Returns: {
          browser: string
          created_at: string
          id: string
          is_active: boolean
          last_used_at: string
          platform: string
        }[]
      }
      list_orphan_intake_pdfs: {
        Args: { p_limit?: number }
        Returns: {
          name: string
        }[]
      }
      log_advanced_assessment_audit: {
        Args: {
          p_action: string
          p_actor_id: string
          p_actor_type: string
          p_meta?: Json
          p_report_id: string
          p_session_id: string
        }
        Returns: undefined
      }
      mark_advanced_assessment_processing: {
        Args: { p_session_id: string }
        Returns: undefined
      }
      mark_all_notifications_read: { Args: never; Returns: number }
      mark_app_installed: { Args: never; Returns: string }
      mark_price_discovery_miss: {
        Args: { p_note: string; p_retailer_slug: string; p_variant_id: string }
        Returns: undefined
      }
      notification_admin_audit: {
        Args: { p_action: string; p_detail: Json }
        Returns: undefined
      }
      notification_audience_user_ids: {
        Args: { p_audience: Json }
        Returns: {
          user_id: string
        }[]
      }
      notification_automation_enabled: {
        Args: { p_key: string }
        Returns: boolean
      }
      notification_campaign_confirm: {
        Args: { p_confirm_recipients: number; p_id: string }
        Returns: number
      }
      notification_categories: { Args: never; Returns: string[] }
      notification_category_allowed: {
        Args: { p_category: string; p_user_id: string }
        Returns: boolean
      }
      notification_cron_secret_matches: {
        Args: { p_secret: string }
        Returns: boolean
      }
      notification_first_name: { Args: { p_user_id: string }; Returns: string }
      notification_guard_ok: {
        Args: { p_guard: Json; p_user_id: string }
        Returns: boolean
      }
      notification_inbox_category: {
        Args: { p_category: string }
        Returns: string
      }
      notification_plan_label: { Args: { p_plan: string }; Returns: string }
      notification_require_admin: { Args: never; Returns: string }
      prewarm_skin_weather_for_alerts: { Args: never; Returns: number }
      reactivate_account: { Args: never; Returns: boolean }
      record_advanced_intake_result: {
        Args: {
          p_email_error?: string
          p_email_sent?: boolean
          p_pdf_error?: string
          p_pdf_path?: string
          p_report_id: string
          p_scores?: Json
          p_triage?: Json
        }
        Returns: Json
      }
      record_price_failure: {
        Args: { p_error: string; p_retailer_product_id: string }
        Returns: undefined
      }
      record_price_observation: {
        Args: {
          p_action: string
          p_in_stock: boolean
          p_price_zar: number
          p_retailer_product_id: string
          p_source_url: string
        }
        Returns: undefined
      }
      record_push_click: { Args: { p_delivery_id: string }; Returns: boolean }
      refund_analysis_pass: {
        Args: { p_transaction_id: string }
        Returns: boolean
      }
      register_ai_analysis_use: { Args: never; Returns: boolean }
      register_article_view: { Args: { p_article_id: string }; Returns: number }
      register_push_subscription: {
        Args: {
          p_auth: string
          p_browser?: string
          p_endpoint: string
          p_p256dh: string
          p_platform?: string
        }
        Returns: string
      }
      remove_my_push_device: { Args: { p_id: string }; Returns: boolean }
      render_notification_text: {
        Args: { p_text: string; p_vars: Json }
        Returns: string
      }
      run_notification_automation: {
        Args: { p_key: string; p_now?: string }
        Returns: number
      }
      run_notification_scheduler: { Args: { p_now?: string }; Returns: number }
      sanitize_notification_url: { Args: { p_url: string }; Returns: string }
      save_advanced_assessment_pipeline_state: {
        Args: {
          p_release?: boolean
          p_report_id: string
          p_stage: string
          p_state: Json
        }
        Returns: undefined
      }
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
          basic_analysis_id: string | null
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
          prefilled_question_ids: string[] | null
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
      save_listing_candidate: {
        Args: {
          p_confidence: number
          p_reasons: Json
          p_retailer_slug: string
          p_size_ml: number
          p_status: string
          p_title: string
          p_url: string
          p_variant_id: string
        }
        Returns: string
      }
      save_smart_routine: {
        Args: {
          p_advanced_session_id?: string
          p_basic_analysis_id?: string
          p_routine: Json
        }
        Returns: string
      }
      save_starter_analysis: {
        Args: {
          p_analysis_completeness?: number
          p_client_analysis_id: string
          p_concerns: string[]
          p_contact_name?: string
          p_contact_whatsapp?: string
          p_mst_tone?: number
          p_photo_storage_path?: string
          p_recommendation: string
          p_result_payload: Json
          p_skin_type: string
          p_variant_key?: string
        }
        Returns: {
          next_unlock_at: string
          recommendation_id: string
          source: string
        }[]
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
      skynn_ops_summary: {
        Args: { p_days?: number }
        Returns: {
          advanced_intake_email_failed: number
          advanced_intake_pdf_failed: number
          advanced_pending: number
          advanced_started_from_basic: number
          advanced_submissions: number
          analysis_passes_consumed: number
          basic_analyses_saved: number
          basic_limit_hits: number
          skynn_errors: number
          skynn_pdf_downloads: number
          skynn_results_viewed: number
          skynn_starts: number
          smart_routines_saved: number
          window_days: number
        }[]
      }
      start_advanced_assessment_session: {
        Args: never
        Returns: {
          access_type: string | null
          assessment_definition_id: string
          assessment_version: string
          basic_analysis_id: string | null
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
          prefilled_question_ids: string[] | null
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
          processing_mode: string
          reference_number: string
          report_id: string
          session_status: string
        }[]
      }
      subscribe_newsletter: {
        Args: { p_email: string; p_source?: string; p_source_path?: string }
        Returns: boolean
      }
      subscription_ladder_rank: { Args: { p_status: string }; Returns: number }
      sync_openhaus_review_prices: { Args: never; Returns: number }
      trial_lifecycle_email_plan: {
        Args: { p_today?: string }
        Returns: {
          category: string
          email: string
          idempotency_key: string
          payload: Json
          template_id: string
          transactional: boolean
          trial_ends_at: string
          trial_plan: string
          user_id: string
        }[]
      }
      unregister_push_subscription: {
        Args: { p_endpoint: string }
        Returns: boolean
      }
      unsubscribe_marketing: { Args: { p_token: string }; Returns: boolean }
      unsubscribe_newsletter: { Args: { p_token: string }; Returns: boolean }
      upsert_podcast_progress: {
        Args: {
          p_client_updated_at: string
          p_duration: number
          p_position: number
          p_slug: string
        }
        Returns: boolean
      }
      verify_price_sync_secret: { Args: { p_secret: string }; Returns: boolean }
      verify_skynn_worker_secret: {
        Args: { p_secret: string }
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
        | "peer_reviewed_literature"
        | "regulatory_database"
      evidence_level: "strong" | "moderate" | "limited" | "anecdotal" | "none"
      ingredient_alias_type:
        | "common_name"
        | "abbreviation"
        | "inci_variant"
        | "synonym"
      ingredient_concern_relationship: "treats" | "may_worsen" | "preventive"
      ingredient_generation_request_status:
        | "pending"
        | "researched"
        | "published"
        | "rejected"
      ingredient_interaction_type:
        | "avoid_combining"
        | "enhances"
        | "buffers"
        | "requires_spacing"
        | "compatible"
      irritancy_risk: "low" | "moderate" | "high"
      skin_fit_rating: "excellent" | "good" | "caution" | "avoid"
      web_story_kind:
        | "editorial"
        | "briefing"
        | "review"
        | "comparison"
        | "video"
        | "promotional"
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
      ingredient_generation_request_status: [
        "pending",
        "researched",
        "published",
        "rejected",
      ],
      ingredient_interaction_type: [
        "avoid_combining",
        "enhances",
        "buffers",
        "requires_spacing",
        "compatible",
      ],
      irritancy_risk: ["low", "moderate", "high"],
      skin_fit_rating: ["excellent", "good", "caution", "avoid"],
      web_story_kind: [
        "editorial",
        "briefing",
        "review",
        "comparison",
        "video",
        "promotional",
      ],
    },
  },
} as const
