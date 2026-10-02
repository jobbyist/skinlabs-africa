// Per-recipient context the email-processor resolves just before rendering:
// the one-click unsubscribe link every recipient-facing email carries, whether
// the recipient is still opted in to marketing, whether sponsored blocks may be
// shown (mirrors the site's ad policy: only Explorer / Glow Lite see ads), and
// whether they've already taken a Basic analysis (welcome-series CTA).
// eslint-disable-next-line @typescript-eslint/no-explicit-any -- deno-lint-ignore no-explicit-any
type SupabaseLike = any;

const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export function buildUnsubscribeUrl(supabaseUrl: string, token: unknown): string | null {
  if (typeof token !== "string" || !UUID_RE.test(token)) return null;
  return `${supabaseUrl.replace(/\/$/, "")}/functions/v1/email-unsubscribe?token=${token}`;
}

/** Ad policy (src/lib/viewerContext.ts): full ads for Explorer / Glow Lite, light for Insider, none for VIP. */
export function adsAllowedForTier(tier: unknown): boolean {
  return tier === "explorer" || tier === "glow_lite";
}

export interface RecipientContext {
  marketingConsent: boolean;
  unsubscribeUrl: string | null;
  showAds: boolean;
  hasAnalysis: boolean;
}

export async function loadRecipientContext(
  supabase: SupabaseLike,
  supabaseUrl: string,
  userId: string | null,
): Promise<RecipientContext | null> {
  if (!userId) return null;
  const { data: profile, error } = await supabase
    .from("profiles")
    .select("marketing_consent, marketing_unsubscribe_token")
    .eq("user_id", userId)
    .maybeSingle();
  if (error || !profile) return null;
  const { data: tier } = await supabase.rpc("formulator_tier", { _user_id: userId });
  const { count } = await supabase
    .from("skincare_recommendations")
    .select("id", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "delivered");
  return {
    marketingConsent: profile.marketing_consent === true,
    unsubscribeUrl: buildUnsubscribeUrl(supabaseUrl, profile.marketing_unsubscribe_token),
    showAds: adsAllowedForTier(tier),
    hasAnalysis: (count ?? 0) > 0,
  };
}
