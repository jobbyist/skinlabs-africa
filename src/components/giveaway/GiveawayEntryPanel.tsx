import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { openSignupDialog } from "@/lib/conversionDialogs";
import { setPendingIntent } from "@/lib/pendingIntent";
import {
  GIVEAWAY_ASSESSMENT_PATH,
  GIVEAWAY_CAMPAIGN,
  GIVEAWAY_COPY,
  GIVEAWAY_DEADLINE_LABEL,
  GIVEAWAY_PATH,
  GIVEAWAY_TERMS_VERSION,
  GIVEAWAY_TIKTOK_HANDLE,
  isGiveawayOpen,
  normaliseTikTokHandle,
} from "@/lib/giveaway/campaign";
import { trackGiveawayCta, trackGiveawayEntrySubmitted } from "@/lib/giveaway/analytics";

type Entry = { tiktok_handle: string; status: string };

const ERRORS: Record<string, string> = {
  assessment_required: "Finish and save your free skin assessment first, then come back to confirm your entry.",
  giveaway_closed: `Entries closed on ${GIVEAWAY_DEADLINE_LABEL}.`,
  invalid_handle: "That doesn't look like a TikTok username. Use letters, numbers, _ or . (2–24 characters).",
  confirmation_required: "Please tick the box to confirm you posted your Story.",
};

/**
 * Entry confirmation. TikTok Stories can't be verified automatically, so this is a self-report that SkinLabs®
 * checks by hand: a signed-in member with a saved free analysis confirms they posted the Story and tagged
 * @skinlabsza, and gives their TikTok username. Rules are enforced by enter_giveaway() on the server.
 * Lazy-loaded (only when near the viewport): the public page never touches auth or the database before then.
 */
const GiveawayEntryPanel = () => {
  const { user, loading } = useAuth();
  const open = isGiveawayOpen();
  const [hasAnalysis, setHasAnalysis] = useState<boolean | null>(null);
  const [entry, setEntry] = useState<Entry | null>(null);
  const [handle, setHandle] = useState("");
  const [posted, setPosted] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async (userId: string) => {
    const [analyses, existing] = await Promise.all([
      supabase.from("skincare_recommendations").select("id").eq("user_id", userId).eq("status", "delivered").limit(1),
      supabase.from("giveaway_entries").select("tiktok_handle, status").eq("campaign", GIVEAWAY_CAMPAIGN).maybeSingle(),
    ]);
    setHasAnalysis((analyses.data?.length ?? 0) > 0);
    setEntry(existing.data ?? null);
  }, []);

  useEffect(() => {
    if (!user) {
      setHasAnalysis(null);
      setEntry(null);
      return;
    }
    void load(user.id);
  }, [user, load]);

  const signIn = () => {
    trackGiveawayCta("entry", "enter");
    // Same intent mechanism the paywalls use: after sign-in/OAuth the visitor lands back on this section.
    setPendingIntent({ action: "unlock", returnTo: `${GIVEAWAY_PATH}#enter` });
    openSignupDialog("signup");
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    const clean = normaliseTikTokHandle(handle);
    if (!clean) return setError(ERRORS.invalid_handle);
    if (!posted) return setError(ERRORS.confirmation_required);
    if (!accepted) return setError("Please accept the giveaway terms to enter.");
    setBusy(true);
    const { data, error: rpcError } = await supabase.rpc("enter_giveaway", {
      p_campaign: GIVEAWAY_CAMPAIGN,
      p_tiktok_handle: clean,
      p_confirmed: true,
      p_terms_version: GIVEAWAY_TERMS_VERSION,
    });
    setBusy(false);
    if (rpcError) {
      const key = Object.keys(ERRORS).find((k) => rpcError.message.includes(k));
      return setError(key ? ERRORS[key] : "We couldn't save your entry just now. Please try again.");
    }
    const status = (data as { status?: string } | null)?.status ?? "submitted";
    setEntry({ tiktok_handle: clean, status });
    trackGiveawayEntrySubmitted();
  };

  const shell = "mx-auto w-full max-w-xl rounded-3xl border border-border bg-card p-6 text-left shadow-sm sm:p-8";

  if (!open) {
    return (
      <div className={shell}>
        <p className="text-lg font-semibold">Entries have closed</p>
        <p className="mt-2 text-sm text-muted-foreground">The giveaway closed on {GIVEAWAY_DEADLINE_LABEL}. Thank you to everyone who took part.</p>
      </div>
    );
  }

  if (loading) return <div className={shell} aria-busy="true"><div className="h-40 animate-pulse rounded-2xl bg-muted" /></div>;

  if (entry) {
    return (
      <div className={shell} role="status">
        <CheckCircle2 className="h-8 w-8 text-foreground" aria-hidden="true" />
        <p className="mt-3 text-lg font-semibold">Your entry is in.</p>
        <p className="mt-2 text-sm text-muted-foreground">
          We have your TikTok username <strong className="text-foreground">@{entry.tiktok_handle}</strong>. We check each Story by hand before
          anything is awarded, so this is not confirmation that your Story has been verified.
          {entry.status === "rejected" && " We couldn't verify this entry. Contact support if you think that's a mistake."}
        </p>
        <p className="mt-3 text-sm text-muted-foreground">Keep your Story live while TikTok allows, and keep an eye on your email. Winners are contacted there.</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className={shell}>
        <p className="text-lg font-semibold">Confirm your entry</p>
        <p className="mt-2 text-sm text-muted-foreground">
          Sign in or create a free account so we know where to reach you if you win. Don't have a saved analysis yet? Start with the free assessment above and come back.
        </p>
        <Button size="lg" className="mt-5 h-12 w-full rounded-full" onClick={signIn}>
          Sign in to confirm your entry
        </Button>
      </div>
    );
  }

  if (hasAnalysis === false) {
    return (
      <div className={shell}>
        <p className="text-lg font-semibold">One step first: your free assessment</p>
        <p className="mt-2 text-sm text-muted-foreground">An entry needs a saved free skin assessment on your account. It takes about two minutes.</p>
        <Button asChild size="lg" className="mt-5 h-auto min-h-12 w-full whitespace-normal rounded-full py-3">
          <Link to={GIVEAWAY_ASSESSMENT_PATH} onClick={() => trackGiveawayCta("entry", "primary")}>
            {GIVEAWAY_COPY.primaryCta}
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <form className={shell} onSubmit={submit} noValidate>
      <p className="text-lg font-semibold">Confirm your entry</p>
      <p className="mt-2 text-sm text-muted-foreground">
        Posted your Skin Story and tagged {GIVEAWAY_TIKTOK_HANDLE}? Tell us your TikTok username so we can find it.
      </p>
      <div className="mt-5 space-y-2">
        <Label htmlFor="giveaway-handle">Your TikTok username</Label>
        <Input
          id="giveaway-handle"
          value={handle}
          onChange={(ev) => setHandle(ev.target.value)}
          placeholder="@yourusername"
          autoComplete="off"
          autoCapitalize="none"
          autoCorrect="off"
          spellCheck={false}
          inputMode="text"
          maxLength={25}
          className="h-12 text-base"
        />
      </div>
      <div className="mt-5 flex items-start gap-3">
        <Checkbox id="giveaway-posted" checked={posted} onCheckedChange={(v) => setPosted(v === true)} className="mt-0.5" />
        <Label htmlFor="giveaway-posted" className="text-sm font-normal leading-snug">
          I've shared my Skin Story on my TikTok Story and tagged {GIVEAWAY_TIKTOK_HANDLE}.
        </Label>
      </div>
      <div className="mt-3 flex items-start gap-3">
        <Checkbox id="giveaway-terms" checked={accepted} onCheckedChange={(v) => setAccepted(v === true)} className="mt-0.5" />
        <Label htmlFor="giveaway-terms" className="text-sm font-normal leading-snug">
          I accept the <a href="#terms" className="underline underline-offset-2">giveaway terms</a>.
        </Label>
      </div>
      {error && (
        <p role="alert" className="mt-4 text-sm text-destructive">
          {error}
        </p>
      )}
      <Button type="submit" size="lg" disabled={busy} className="mt-5 h-12 w-full rounded-full">
        {busy ? <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" /> : null}
        {busy ? "Saving…" : "Confirm my entry"}
      </Button>
    </form>
  );
};

export default GiveawayEntryPanel;
