// skincare-ai — RETIRED in SKYNN AI v2.1 — beta (2026-09-28).
//
// This was the legacy "live AI" path: Glow Insider / VIP members' weekly AI
// report and the in-page "Use an Analysis Pass" button on /skynn-ai. It is
// retired because it:
//   * sent the member's photo to a model and asked it to estimate skin tone
//     (Fitzpatrick) from it — SKYNN AI never infers skin tone from a photo;
//   * was a second "Advanced" flow that bypassed the Analysis Pass gate for
//     members and skipped the Advanced AI Dermatology Analysis review hold;
//   * enforced its member quota only in the browser.
// Since v2.1 the Basic AI Skin Analysis is the deterministic engine for every
// tier (save_starter_analysis) and the only Advanced path is
// /skynn-ai/advanced (skynn-advanced-assessment). The previous source is in
// git history (see the commit that introduced this stub).
//
// Kept as a deployed stub (not deleted) so an old cached frontend gets a clear
// answer instead of a 404, and so nothing can redeploy the old behaviour by
// accident.
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve((req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  return new Response(
    JSON.stringify({
      error: "This analysis has moved. Please refresh the page to use the Basic AI Skin Analysis or the Advanced AI Dermatology Analysis.",
      code: "retired",
    }),
    { status: 410, headers: { ...corsHeaders, "Content-Type": "application/json" } },
  );
});
