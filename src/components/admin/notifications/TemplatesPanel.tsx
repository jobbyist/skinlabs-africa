import { useCallback, useEffect, useState } from "react";
import { Loader2, Pencil, Plus } from "lucide-react";
import { toast } from "sonner";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { BODY_MAX, CATEGORIES, INBOX_BODY_MAX, INBOX_TITLE_MAX, TITLE_MAX, isHealthCategory } from "@/lib/notificationAdmin";
import { isSafeReturnTo } from "@/lib/pendingIntent";
import { PREFERENCE_LABELS, type PreferenceCategory } from "@/lib/pwa/notificationManager";
import { useAdminCall } from "./adminRpc";
import LockScreenPreview from "./LockScreenPreview";

interface Template {
  key: string;
  name: string;
  description: string | null;
  category: string;
  title: string;
  body: string;
  inbox_title: string | null;
  inbox_body: string | null;
  url: string;
  channels: string[];
  enabled: boolean;
  system: boolean;
  lock_screen_safe: boolean;
  bypass_caps: boolean;
}

const KEY_PATTERN = /^[a-z0-9_]{3,60}$/;
const blank = (): Template => ({ key: "", name: "", description: "", category: "service", title: "", body: "", inbox_title: "", inbox_body: "", url: "/dashboard?tab=inbox", channels: ["inbox", "push"], enabled: true, system: false, lock_screen_safe: true, bypass_caps: false });

const TemplatesPanel = ({ refreshKey, onChanged }: { refreshKey: number; onChanged: () => void }) => {
  const call = useAdminCall();
  const [items, setItems] = useState<Template[] | null>(null);
  const [editing, setEditing] = useState<{ t: Template; isNew: boolean } | null>(null);

  const load = useCallback(async () => {
    const result = await call<Template[]>("admin_list_notification_templates");
    setItems(result.ok ? result.data : []);
  }, [call]);
  useEffect(() => {
    void load();
  }, [load, refreshKey]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl text-sm text-muted-foreground">The wording automations and system events use. Lock-screen text (title and message) is capped at 80 and 240 characters; the inbox can say more. System templates can be reworded and switched off, but their category and channels are fixed.</p>
        <Button size="sm" className="gap-1.5" onClick={() => setEditing({ t: blank(), isNew: true })}>
          <Plus className="h-4 w-4" aria-hidden="true" /> New template
        </Button>
      </div>

      {items === null ? (
        <Loader2 className="h-4 w-4 motion-safe:animate-spin text-muted-foreground" aria-label="Loading" />
      ) : (
        <ul className="grid gap-3 lg:grid-cols-2">
          {items.map((t) => (
            <li key={t.key} data-testid="template-row" data-key={t.key}>
              <Card>
                <CardContent className="space-y-2 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold">{t.name}</p>
                        {t.system && <Badge variant="secondary">System</Badge>}
                        {!t.enabled && <Badge variant="outline">Off</Badge>}
                        {t.bypass_caps && <Badge variant="outline">Ignores limits</Badge>}
                      </div>
                      <p className="mt-0.5 font-mono text-[11px] text-muted-foreground">{t.key}</p>
                    </div>
                    <Button variant="ghost" size="sm" className="gap-1" onClick={() => setEditing({ t: { ...t, inbox_title: t.inbox_title ?? "", inbox_body: t.inbox_body ?? "", description: t.description ?? "" }, isNew: false })} aria-label={`Edit template: ${t.name}`}>
                      <Pencil className="h-3.5 w-3.5" aria-hidden="true" /> Edit
                    </Button>
                  </div>
                  <p className="text-sm">{t.title}</p>
                  <p className="text-xs text-muted-foreground">{t.body}</p>
                  <p className="text-xs text-muted-foreground">
                    {PREFERENCE_LABELS[t.category as PreferenceCategory]?.label ?? t.category} · {t.channels.join(" + ")} · opens {t.url}
                  </p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
      )}

      {editing && <TemplateDialog key={editing.t.key || "new"} initial={editing.t} isNew={editing.isNew} onClose={() => setEditing(null)} onSaved={async () => { setEditing(null); await load(); onChanged(); }} />}
    </div>
  );
};

const TemplateDialog = ({ initial, isNew, onClose, onSaved }: { initial: Template; isNew: boolean; onClose: () => void; onSaved: () => void }) => {
  const call = useAdminCall();
  const [t, setT] = useState<Template>(initial);
  const [busy, setBusy] = useState(false);
  const set = <K extends keyof Template>(key: K, value: Template[K]) => setT((prev) => ({ ...prev, [key]: value }));

  const problems: string[] = [];
  if (isNew && !KEY_PATTERN.test(t.key)) problems.push("The key needs 3 to 60 lowercase letters, numbers or underscores.");
  if (!t.name.trim()) problems.push("Add a name.");
  if (!t.title.trim() || t.title.trim().length > TITLE_MAX) problems.push(`The title needs 1 to ${TITLE_MAX} characters.`);
  if (!t.body.trim() || t.body.trim().length > BODY_MAX) problems.push(`The message needs 1 to ${BODY_MAX} characters.`);
  if ((t.inbox_title ?? "").length > INBOX_TITLE_MAX) problems.push(`The inbox title is limited to ${INBOX_TITLE_MAX} characters.`);
  if ((t.inbox_body ?? "").length > INBOX_BODY_MAX) problems.push(`The inbox message is limited to ${INBOX_BODY_MAX} characters.`);
  if (!isSafeReturnTo(t.url.trim())) problems.push("The link must be a path inside SkinLabs®.");
  if (t.channels.length === 0) problems.push("Pick at least one channel.");

  const save = async () => {
    setBusy(true);
    const result = await call("admin_upsert_notification_template", {
      p_key: t.key,
      p_name: t.name.trim(),
      p_category: t.category,
      p_title: t.title.trim(),
      p_body: t.body.trim(),
      p_url: t.url.trim(),
      p_inbox_title: (t.inbox_title ?? "").trim() || undefined,
      p_inbox_body: (t.inbox_body ?? "").trim() || undefined,
      p_channels: t.channels,
      p_enabled: t.enabled,
      p_description: (t.description ?? "").trim() || undefined,
    });
    setBusy(false);
    if (result.ok) {
      toast.success("Template saved.");
      onSaved();
    }
  };

  const toggleChannel = (channel: string) => set("channels", t.channels.includes(channel) ? t.channels.filter((c) => c !== channel) : [...t.channels, channel]);

  return (
    <Dialog open onOpenChange={(open) => !open && !busy && onClose()}>
      <DialogContent className="max-h-[calc(100dvh-2rem)] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{isNew ? "New template" : `Edit: ${initial.name}`}</DialogTitle>
          <DialogDescription>{t.system ? "A system template: reword it or switch it off. Its category and channels are fixed." : "Used by automations. Merge fields like {{first_name}} are filled in per member."}</DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nt-key">Key</Label>
            <Input id="nt-key" value={t.key} disabled={!isNew} onChange={(e) => set("key", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nt-name">Name</Label>
            <Input id="nt-name" value={t.name} onChange={(e) => set("name", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="nt-desc">Description</Label>
            <Input id="nt-desc" value={t.description ?? ""} onChange={(e) => set("description", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nt-category">Category</Label>
            <select id="nt-category" value={t.category} disabled={t.system} onChange={(e) => set("category", e.target.value)} className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm disabled:opacity-60">
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {PREFERENCE_LABELS[c as PreferenceCategory].label}
                </option>
              ))}
            </select>
          </div>
          <fieldset className="space-y-1.5" disabled={t.system}>
            <legend className="text-sm font-medium">Channels</legend>
            <div className="flex gap-5 pt-2 text-sm">
              {["inbox", "push"].map((c) => (
                <label key={c} className="inline-flex items-center gap-2">
                  <input type="checkbox" checked={t.channels.includes(c)} onChange={() => toggleChannel(c)} className="h-4 w-4" /> {c === "inbox" ? "Inbox" : "Push"}
                </label>
              ))}
            </div>
          </fieldset>
        </div>

        {isHealthCategory(t.category) && (
          <Alert>
            <AlertTitle>Keep lock-screen text generic</AlertTitle>
            <AlertDescription>The title and message appear on a locked screen. Don’t name a condition, product, ingredient, score or result. Put detail in the inbox text, which sits behind sign-in.</AlertDescription>
          </Alert>
        )}

        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label htmlFor="nt-title">Title</Label>
            <span className={`text-xs ${t.title.length > TITLE_MAX ? "text-destructive" : "text-muted-foreground"}`}>{t.title.length}/{TITLE_MAX}</span>
          </div>
          <Input id="nt-title" value={t.title} onChange={(e) => set("title", e.target.value)} />
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between">
            <Label htmlFor="nt-body">Message</Label>
            <span className={`text-xs ${t.body.length > BODY_MAX ? "text-destructive" : "text-muted-foreground"}`}>{t.body.length}/{BODY_MAX}</span>
          </div>
          <Textarea id="nt-body" rows={3} value={t.body} onChange={(e) => set("body", e.target.value)} />
        </div>
        <LockScreenPreview title={t.title} body={t.body} />
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label htmlFor="nt-ititle">Inbox title (optional)</Label>
            <Input id="nt-ititle" value={t.inbox_title ?? ""} onChange={(e) => set("inbox_title", e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="nt-url">Opens</Label>
            <Input id="nt-url" value={t.url} onChange={(e) => set("url", e.target.value)} />
          </div>
          <div className="space-y-1.5 sm:col-span-2">
            <Label htmlFor="nt-ibody">Inbox message (optional)</Label>
            <Textarea id="nt-ibody" rows={3} value={t.inbox_body ?? ""} onChange={(e) => set("inbox_body", e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Switch id="nt-enabled" checked={t.enabled} onCheckedChange={(v) => set("enabled", v)} />
          <Label htmlFor="nt-enabled">Enabled</Label>
        </div>
        {problems.length > 0 && <p className="text-sm text-muted-foreground">To save: {problems[0]}</p>}
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={busy}>
            Cancel
          </Button>
          <Button onClick={() => void save()} disabled={busy || problems.length > 0}>
            {busy ? <Loader2 className="h-4 w-4 motion-safe:animate-spin" aria-hidden="true" /> : "Save template"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TemplatesPanel;
