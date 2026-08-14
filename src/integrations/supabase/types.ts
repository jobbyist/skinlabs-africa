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
      profiles: {
        Row: {
          allergies: string[] | null
          created_at: string
          date_of_birth: string | null
          email: string | null
          full_name: string | null
          gender: string | null
          id: string
          notes: string | null
          phone: string | null
          preferred_routine_time: string | null
          race_ethnicity: string | null
          skin_color: string | null
          skin_conditions: string[] | null
          subscription_started_at: string | null
          subscription_status: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          allergies?: string[] | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          preferred_routine_time?: string | null
          race_ethnicity?: string | null
          skin_color?: string | null
          skin_conditions?: string[] | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          allergies?: string[] | null
          created_at?: string
          date_of_birth?: string | null
          email?: string | null
          full_name?: string | null
          gender?: string | null
          id?: string
          notes?: string | null
          phone?: string | null
          preferred_routine_time?: string | null
          race_ethnicity?: string | null
          skin_color?: string | null
          skin_conditions?: string[] | null
          subscription_started_at?: string | null
          subscription_status?: string | null
          updated_at?: string
          user_id?: string
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
      skincare_recommendations: {
        Row: {
          age_range: string | null
          allergies: string | null
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
          recommendation: string
          skin_type: string
          status: string
          user_id: string
        }
        Insert: {
          age_range?: string | null
          allergies?: string | null
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
          recommendation: string
          skin_type: string
          status?: string
          user_id: string
        }
        Update: {
          age_range?: string | null
          allergies?: string | null
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
          recommendation?: string
          skin_type?: string
          status?: string
          user_id?: string
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
      [_ in never]: never
    }
    Functions: {
      get_preorder_count: { Args: { p_product_type: string }; Returns: number }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      register_article_view: { Args: { p_article_id: string }; Returns: number }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
