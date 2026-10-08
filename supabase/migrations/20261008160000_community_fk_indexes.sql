-- Community Forum: indexes for foreign keys used by cascades, the admin queue and the report auto-hold trigger.
CREATE INDEX IF NOT EXISTS community_comments_parent_idx ON public.community_comments (parent_id) WHERE parent_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS community_reports_post_idx ON public.community_reports (post_id) WHERE post_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS community_reports_comment_idx ON public.community_reports (comment_id) WHERE comment_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS community_reports_resolver_idx ON public.community_reports (resolved_by) WHERE resolved_by IS NOT NULL;
CREATE INDEX IF NOT EXISTS community_moderation_log_actor_idx ON public.community_moderation_log (actor_id) WHERE actor_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS community_post_shares_user_idx ON public.community_post_shares (user_id);
CREATE INDEX IF NOT EXISTS community_posts_persona_idx ON public.community_posts (persona_id) WHERE persona_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS community_comments_persona_idx ON public.community_comments (persona_id) WHERE persona_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS community_post_likes_persona_idx ON public.community_post_likes (persona_id) WHERE persona_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS community_comment_likes_persona_idx ON public.community_comment_likes (persona_id) WHERE persona_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS community_spam_terms_creator_idx ON public.community_spam_terms (created_by) WHERE created_by IS NOT NULL;
