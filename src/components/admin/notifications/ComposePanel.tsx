import { useCallback, useEffect, useMemo, useState } from "react";
import { Loader2, Send, CalendarClock, Save, FlaskConical } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { AlertDialog, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PREFERENCE_LABELS, type PreferenceCategory } from "@/lib/pwa/notificationManager";
import {
  BODY_MAX,
  CATEGORIES,
  NAME_MAX,
  TITLE_MAX,
  audienceToForm,
  buildAudience,
  confirmArg,
  confirmationMatches,
  describeAudience,
  emptyAudience,
  isHealthCategory,
  needsTypedConfirmation,
  parseAudiencePreview,
  parseConfirmationRequired,
  sastToIso,
  formatSast,
  validateDraft,
  type AudienceForm,
  type AudiencePreview,
  type CampaignDraft,
} from "@/lib/notificationAdmin";
import { useAdminCall } from "./adminRpc";
import AudienceBuilder from "./AudienceBuilder";
import LockScreenPreview from "./LockScreenPreview";

export interface LoadedCampaign {
  id: string;
  name: string;
  category: string;
  title: string;
  body: string;
  url: string;
  channels: string[];
  audience: unknown;
}

interface Props {
  /** A saved draft chosen in History to continue editing. */
  draftToLoad: LoadedCampaign | null;
  onDraftLoaded: () => void;
  /** After a campaign was sent / scheduled / saved, so History and Overview refresh. */
  onChanged: () => void;
}

type Mode = "now" | "schedule";

const defaultUrl = "/dashboard?tab=inbox";

const ComposePanel = ({ draftToLoad, onDraftLoaded, onChanged }: Props) => {
  const call = useAdminCall();
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>("service");
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [url, setUrl] = useState(defaultUrl);
  const [inbox, setInbox] = useState(true);
  const [push, setPush] = useState(true);
  const [audience, setAudience] = useState<AudienceForm>(emptyAudience());
  const [when, setWhen] = useState("");
  const [preview, setPreview] = useState<AudiencePreview | null>(null);
  const [previewing, setPreviewing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [confirm, setConfirm] = useState<Mode | null>(null);
  const [typed, setTyped] = useState("");

  const channels = useMemo(() => [...(inbox ? ["inbox"] : []), ...(push ? ["push"] : [])], [inbox, push]);
  const audienceJson = useMemo(() => buildAudience(audience), [audience]);
  const previewKey = JSON.stringify([audienceJson, category, channels]);
  const draft: CampaignDraft = { name, category, title, body, url, channels };
  const problems = validateDraft(draft);

  useEffect(() => {
    if (!draftToLoad) return;
    setCampaignId(draftToLoad.id);
    setName(draftToLoad.name);
    setCategory(draftToLoad.category);
    setTitle(draftToLoad.title);
    setBody(draftToLoad.body);
    setUrl(draftToLoad.url);
    setInbox(draftToLoad.channels.includes("inbox"));
    setPush(draftToLoad.channels.includes("push"));
    setAudience(audienceToForm(draftToLoad.audience));
    setWhen("");
    onDraftLoaded();
  }, [draftToLoad, onDraftLoaded]);

  // Who would receive it: the same function the send uses, re-run (debounced) whenever the audience, category or channels change.
  useEffect(() => {
    if (channels.length === 0) {
      setPreview(null);
      return;
    }
    let cancelled = false;
    setPreviewing(true);
    const timer = setTimeout(async () => {
      const result = await call("admin_preview_notification_audience", { p_audience: audienceJson as never, p_category: category, p_channels: channels }, "audience-preview");
      if (cancelled) return;
      setPreview(result.ok ? parseAudiencePreview(result.data) : null);
      setPreviewing(false);
    }, 400);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [previewKey]);

  const reset = useCallback(() => {
    setCampaignId(null);
    setName("");
    setTitle("");
    setBody("");
    setUrl(defaultUrl);
    setCategory("service");
    setInbox(true);
    setPush(true);
    setAudience(emptyAudience());
    setWhen("");
    setTyped("");
  }, []);

  const save = async (): Promise<string | null> => {
    if (problems.length) {
      toast.error(problems[0]);
      return null;
    }
    const result = await call<string>("admin_save_notification_campaign", {
      p_id: (campaignId ?? null) as unknown as string,
      p_name: name.trim(),
      p_category: category,
      p_title: title.trim(),
      p_body: body.trim(),
      p_url: url.trim(),
      p_channels: channels,
      p_audience: audienceJson as never,
    });
    if (!result.ok) return null;
    setCampaignId(result.data);
    return result.data;
  };

  const saveDraft = async () => {
    setBusy(true);
    const id = await save();
    setBusy(false);
    if (id) {
      toast.success("Draft saved.");
      onChanged();
    }
  };

  const sendTest = async () => {
    if (problems.length) return void toast.error(problems[0]);
    setBusy(true);
    const result = await call("admin_send_test_notification", { p_title: title.trim(), p_body: body.trim(), p_url: url.trim() });
    setBusy(false);
    if (result.ok) toast.success("Test queued for your own devices. It arrives within a minute if push is on and you have a subscribed device.");
  };

  const readyToSend = problems.length === 0 && preview !== null && preview.members > 0 && !previewing;
  const scheduledIso = sastToIso(when);

  const submit = async () => {
    if (!confirm || !preview) return;
    setBusy(true);
    const id = await save();
    if (!id) {
      setBusy(false);
      return;
    }
    const confirmed = confirmArg(preview.members);
    const result =
      confirm === "now"
        ? await call<number>("admin_send_notification_campaign_now", { p_id: id, p_confirm_recipients: confirmed })
        : await call<number>("admin_schedule_notification_campaign", { p_id: id, p_scheduled_for: scheduledIso as string, p_confirm_recipients: confirmed });
    setBusy(false);
    if (!result.ok) {
      // The audience changed since the preview: show the fresh size and make the admin look again.
      const size = parseConfirmationRequired(result.message);
      if (size !== null) {
        setPreview((p) => (p ? { ...p, members: size } : p));
        setTyped("");
      }
      return;
    }
    toast.success(confirm === "now" ? `Sent: ${result.data} notification${result.data === 1 ? "" : "s"} queued.` : `Scheduled for ${formatSast(scheduledIso)} (${result.data} recipients).`);
    setConfirm(null);
    reset();
    onChanged();
  };

  const bulk = preview ? needsTypedConfirmation(preview.members) : false;
  const canSubmit = !busy && preview !== null && (!bulk || confirmationMatches(typed, preview.members));

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">{campaignId ? "Edit draft" : "New campaign"}</CardTitle>
          <CardDescription>A one-off message to a group of members. They only get it if they have that kind of notification switched on (essential account messages excepted).</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nc-name">Campaign name (only you see this)</Label>
              <Input id="nc-name" value={name} maxLength={NAME_MAX} onChange={(e) => setName(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="nc-category">Category</Label>
              <select id="nc-category" value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm">
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {PREFERENCE_LABELS[c as PreferenceCategory].label}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {isHealthCategory(category) && (
            <Alert>
              <AlertTitle>Keep lock-screen text generic</AlertTitle>
              <AlertDescription>
                Anything touching a member’s analysis, report, skin concern, routine or photos must not name a condition, product, ingredient, score or result. Say “Your SkinLabs® report is ready” and let the detail sit behind sign-in.
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="nc-title">Title</Label>
              <span className={`text-xs ${title.length > TITLE_MAX ? "text-destructive" : "text-muted-foreground"}`} data-testid="title-count">
                {title.length}/{TITLE_MAX}
              </span>
            </div>
            <Input id="nc-title" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <div className="flex items-baseline justify-between">
              <Label htmlFor="nc-body">Message</Label>
              <span className={`text-xs ${body.length > BODY_MAX ? "text-destructive" : "text-muted-foreground"}`} data-testid="body-count">
                {body.length}/{BODY_MAX}
              </span>
            </div>
            <Textarea id="nc-body" rows={3} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="nc-url">Opens (a path inside SkinLabs®)</Label>
              <Input id="nc-url" value={url} onChange={(e) => setUrl(e.target.value)} />
            </div>
            <fieldset className="space-y-1.5">
              <legend className="text-sm font-medium">Send to</legend>
              <div className="flex gap-5 pt-2 text-sm">
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={inbox} onChange={(e) => setInbox(e.target.checked)} className="h-4 w-4" /> Inbox
                </label>
                <label className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={push} onChange={(e) => setPush(e.target.checked)} className="h-4 w-4" /> Push
                </label>
              </div>
            </fieldset>
          </div>

          <LockScreenPreview title={title} body={body} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Audience</CardTitle>
          <CardDescription>{describeAudience(audienceJson)}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <AudienceBuilder value={audience} onChange={setAudience} />
          <div className="rounded-xl border border-border p-4" aria-live="polite" data-testid="audience-preview">
            {channels.length === 0 ? (
              <p className="text-sm text-muted-foreground">Pick inbox, push or both to see who it would reach.</p>
            ) : previewing && !preview ? (
              <Loader2 className="h-4 w-4 motion-safe:animate-spin text-muted-foreground" aria-label="Counting" />
            ) : preview ? (
              <dl className="grid grid-cols-2 gap-3 text-sm sm:grid-cols-4">
                <div>
                  <dt className="text-xs text-muted-foreground">Members matched</dt>
                  <dd className="text-lg font-semibold tabular-nums">{preview.members}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Reached in inbox</dt>
                  <dd className="text-lg font-semibold tabular-nums">{preview.inbox_reachable}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Reached by push</dt>
                  <dd className="text-lg font-semibold tabular-nums">{preview.push_reachable}</dd>
                </div>
                <div>
                  <dt className="text-xs text-muted-foreground">Opted out of this</dt>
                  <dd className="text-lg font-semibold tabular-nums">{preview.opted_out}</dd>
                </div>
                {preview.by_platform.length > 0 && (
                  <div className="col-span-2 sm:col-span-4 text-xs text-muted-foreground">
                    Push devices: {preview.by_platform.map((p) => `${p.label ?? "unknown"} ${p.count}`).join(" · ")}
                  </div>
                )}
              </dl>
            ) : (
              <p className="text-sm text-muted-foreground">The audience size isn’t available right now.</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Send</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {problems.length > 0 && (title || body || name) && <p className="text-sm text-muted-foreground">To continue: {problems[0]}</p>}
          <div className="flex flex-wrap items-end gap-3">
            <Button variant="outline" onClick={() => void saveDraft()} disabled={busy || problems.length > 0} className="gap-1.5">
              <Save className="h-4 w-4" aria-hidden="true" /> Save draft
            </Button>
            <Button variant="outline" onClick={() => void sendTest()} disabled={busy || problems.length > 0} className="gap-1.5">
              <FlaskConical className="h-4 w-4" aria-hidden="true" /> Send a test to me
            </Button>
            <Button onClick={() => { setTyped(""); setConfirm("now"); }} disabled={busy || !readyToSend} className="gap-1.5">
              <Send className="h-4 w-4" aria-hidden="true" /> Send now…
            </Button>
          </div>
          <div className="flex flex-wrap items-end gap-3 border-t border-border pt-4">
            <div className="space-y-1.5">
              <Label htmlFor="nc-when">Schedule for (South African time)</Label>
              <Input id="nc-when" type="datetime-local" value={when} onChange={(e) => setWhen(e.target.value)} className="w-56" />
            </div>
            <Button variant="secondary" onClick={() => { setTyped(""); setConfirm("schedule"); }} disabled={busy || !readyToSend || !scheduledIso} className="gap-1.5">
              <CalendarClock className="h-4 w-4" aria-hidden="true" /> Schedule…
            </Button>
          </div>
        </CardContent>
      </Card>

      <AlertDialog open={confirm !== null} onOpenChange={(open) => !open && !busy && setConfirm(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{confirm === "now" ? "Send this now?" : "Schedule this campaign?"}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 text-sm">
                <p>
                  “{title.trim()}” to <strong>{preview?.members ?? 0} members</strong> ({describeAudience(audienceJson)}) by {channels.join(" and ")}.
                  {confirm === "schedule" && <> Goes out at <strong>{formatSast(scheduledIso)}</strong>.</>} Members who have switched this kind of notification off won’t get it. This can’t be recalled once it’s sent.
                </p>
                {bulk && preview && (
                  <div className="space-y-1.5">
                    <Label htmlFor="nc-typed">This reaches more than 50 members. Type {preview.members} to confirm.</Label>
                    <Input id="nc-typed" inputMode="numeric" autoComplete="off" value={typed} onChange={(e) => setTyped(e.target.value)} />
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
            <Button onClick={() => void submit()} disabled={!canSubmit}>
              {busy ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : confirm === "now" ? `Send to ${preview?.members ?? 0}` : "Schedule"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ComposePanel;
