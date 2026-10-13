import { useCallback, useEffect, useState } from "react";
import { AlertTriangle, Check, Loader2, RefreshCw, ShieldAlert, X } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AdminModeration, moderate, type AdminHeld, type AdminLogRow, type AdminMember, type AdminReport, type AdminSanction, type AdminTerm } from "@/lib/community/client";
import SanctionDialog, { type SanctionTarget } from "@/components/admin/SanctionDialog";
import { REPORT_REASONS, relativeTime, writeErrorMessage } from "@/lib/community/rules";

const FLAG_LABELS: Record<string, string> = {
  many_links: "3+ links",
  new_account_link: "Link from a new account",
  shortener: "Link shortener",
  blocked_term: "Blocked term",
  shouting: "ALL CAPS",
  repetition: "Repetition",
  contact_details: "Contact details",
  reported: "Reported by 3+ members",
};
const reasonLabel = (r: string) => REPORT_REASONS.find((x) => x.value === r)?.label ?? r;

const useLoad = <T,>(fn: () => Promise<T>, initial: T) => {
  const [data, setData] = useState<T>(initial);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const reload = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setData(await fn());
    } catch (e) {
      setError(writeErrorMessage(e as Error, "Couldn't load. Try again."));
    } finally {
      setLoading(false);
    }
  }, [fn]);
  useEffect(() => {
    void reload();
  }, [reload]);
  return { data, loading, error, reload };
};

const Status = ({ loading, error, onRetry, empty }: { loading: boolean; error: string | null; onRetry: () => void; empty?: string | null }) => {
  if (loading) return <p className="flex items-center gap-2 py-8 text-sm text-muted-foreground"><Loader2 className="size-4 animate-spin" /> Loading…</p>;
  if (error) return (
    <p role="alert" className="flex items-center gap-3 py-6 text-sm text-destructive">
      <AlertTriangle className="size-4" /> {error}
      <Button size="sm" variant="outline" onClick={onRetry}>Retry</Button>
    </p>
  );
  return empty ? <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p> : null;
};

const Counter = ({ label, value, warn }: { label: string; value: number | undefined; warn?: boolean }) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={`mt-1 text-2xl font-semibold tabular-nums ${warn && value ? "text-destructive" : ""}`}>{value ?? "–"}</p>
  </div>
);

const Excerpt = ({ title, body }: { title: string | null; body: string | null }) => (
  <div className="min-w-0">
    {title && <p className="break-words font-medium">{title}</p>}
    <p className="mt-1 line-clamp-4 whitespace-pre-line break-words text-sm text-muted-foreground">{body}</p>
  </div>
);

const ReportsPanel = ({ onChange }: { onChange: () => void }) => {
  const [restrict, setRestrict] = useState<SanctionTarget | null>(null);
  const [status, setStatus] = useState<"open" | "actioned" | "dismissed">("open");
  const load = useCallback(() => AdminModeration.reports(status), [status]);
  const { data, loading, error, reload } = useLoad<AdminReport[]>(load, []);
  const [busy, setBusy] = useState<string | null>(null);

  const act = async (r: AdminReport, kind: "remove" | "dismiss") => {
    setBusy(r.report_id);
    try {
      if (kind === "remove") await moderate(r.target_type, r.target_id, "remove");
      else await AdminModeration.resolveReport(r.report_id, "dismissed");
      toast.success(kind === "remove" ? "Content removed" : "Report dismissed");
      await reload();
      onChange();
    } catch (e) {
      toast.error(writeErrorMessage(e as Error, "That didn't work."));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2" role="group" aria-label="Report status">
        {(["open", "actioned", "dismissed"] as const).map((s) => (
          <Button key={s} size="sm" variant={status === s ? "default" : "outline"} onClick={() => setStatus(s)} aria-pressed={status === s} className="capitalize">{s}</Button>
        ))}
      </div>
      <Status loading={loading} error={error} onRetry={reload} empty={data.length === 0 ? `No ${status} reports.` : null} />
      {data.map((r) => (
        <Card key={r.report_id}>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="capitalize">{r.target_type}</Badge>
              <Badge variant="secondary">{reasonLabel(r.reason)}</Badge>
              {r.report_count > 1 && <Badge variant="destructive">{r.report_count} reports</Badge>}
              <span>by {r.author_name ?? "unknown"} · reported by {r.reporter_name ?? "member"} · {relativeTime(r.created_at)} ago</span>
              {r.content_status && r.content_status !== "published" && <Badge variant="outline">{r.content_status}</Badge>}
            </div>
            <Excerpt title={r.title} body={r.body} />
            {r.details && <p className="rounded-lg bg-muted px-3 py-2 text-sm">“{r.details}”</p>}
            {r.status === "open" && (
              <div className="flex flex-wrap gap-2">
                <Button size="sm" variant="destructive" disabled={busy === r.report_id} onClick={() => void act(r, "remove")}>Remove content</Button>
                <Button size="sm" variant="outline" disabled={busy === r.report_id} onClick={() => void act(r, "dismiss")}>Dismiss</Button>
                <Button size="sm" variant="outline" onClick={() => setRestrict({ kind: "content", type: r.target_type, id: r.target_id, label: r.author_name ?? "author" })}>Mute / suspend author</Button>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
      <SanctionDialog target={restrict} onClose={() => setRestrict(null)} onDone={onChange} />
    </div>
  );
};

const HeldPanel = ({ onChange }: { onChange: () => void }) => {
  const [restrict, setRestrict] = useState<SanctionTarget | null>(null);
  const { data, loading, error, reload } = useLoad<AdminHeld[]>(AdminModeration.held, []);
  const [busy, setBusy] = useState<string | null>(null);
  const review = async (h: AdminHeld, approve: boolean) => {
    setBusy(h.target_id);
    try {
      await AdminModeration.review(h.target_type, h.target_id, approve);
      toast.success(approve ? "Approved and published" : "Rejected");
      await reload();
      onChange();
    } catch (e) {
      toast.error(writeErrorMessage(e as Error, "That didn't work."));
    } finally {
      setBusy(null);
    }
  };
  return (
    <div className="space-y-3">
      <Status loading={loading} error={error} onRetry={reload} empty={data.length === 0 ? "Nothing is waiting for review." : null} />
      {data.map((h) => (
        <Card key={`${h.target_type}-${h.target_id}`}>
          <CardContent className="space-y-3 p-4">
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <Badge variant="outline" className="capitalize">{h.target_type}</Badge>
              {h.flags.map((f) => <Badge key={f} variant="secondary">{FLAG_LABELS[f] ?? f}</Badge>)}
              <span>by {h.author_name ?? "unknown"} · {relativeTime(h.created_at)} ago</span>
            </div>
            <Excerpt title={h.title} body={h.body} />
            {h.image_path && <p className="text-xs text-muted-foreground">Has an attached image (open the post to view).</p>}
            <div className="flex flex-wrap gap-2">
              <Button size="sm" disabled={busy === h.target_id} onClick={() => void review(h, true)}><Check className="mr-1.5 size-4" /> Approve</Button>
              <Button size="sm" variant="destructive" disabled={busy === h.target_id} onClick={() => void review(h, false)}><X className="mr-1.5 size-4" /> Reject</Button>
              <Button size="sm" variant="outline" onClick={() => setRestrict({ kind: "content", type: h.target_type, id: h.target_id, label: h.author_name ?? "author" })}>Mute / suspend author</Button>
            </div>
          </CardContent>
        </Card>
      ))}
      <SanctionDialog target={restrict} onClose={() => setRestrict(null)} onDone={onChange} />
    </div>
  );
};

const TermsPanel = () => {
  const { data, loading, error, reload } = useLoad<AdminTerm[]>(AdminModeration.terms, []);
  const [pattern, setPattern] = useState("");
  const [busy, setBusy] = useState(false);
  const set = async (p: string, enabled: boolean) => {
    setBusy(true);
    try {
      await AdminModeration.setTerm(p, enabled);
      setPattern("");
      await reload();
    } catch (e) {
      toast.error(writeErrorMessage(e as Error, "Only admins can change this list."));
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">Posts and comments containing an enabled term (case-insensitive) are held for review, never blocked outright.</p>
      <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); if (pattern.trim().length >= 3) void set(pattern, true); }}>
        <Input value={pattern} onChange={(e) => setPattern(e.target.value)} placeholder="Add a term or phrase (3+ characters)" maxLength={80} aria-label="New blocked term" className="max-w-sm" />
        <Button type="submit" disabled={busy || pattern.trim().length < 3}>Add</Button>
      </form>
      <Status loading={loading} error={error} onRetry={reload} />
      <ul className="grid gap-2 sm:grid-cols-2">
        {data.map((t) => (
          <li key={t.id} className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
            <span className="break-all">{t.pattern}</span>
            <Switch checked={t.enabled} onCheckedChange={(v) => void set(t.pattern, v)} aria-label={`${t.enabled ? "Disable" : "Enable"} “${t.pattern}”`} />
          </li>
        ))}
      </ul>
    </div>
  );
};

const untilLabel = (iso: string | null) => (iso ? `until ${new Date(iso).toLocaleString("en-ZA", { dateStyle: "medium", timeStyle: "short" })}` : "until lifted");

/** Find a member by handle, restrict them, and lift or review restrictions. Staff accounts can't be restricted (enforced in the database). */
const MembersPanel = ({ onChange }: { onChange: () => void }) => {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<AdminMember[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [restrict, setRestrict] = useState<SanctionTarget | null>(null);
  const [showAll, setShowAll] = useState(false);
  const load = useCallback(() => AdminModeration.sanctions(!showAll), [showAll]);
  const sanctions = useLoad<AdminSanction[]>(load, []);

  const search = async () => {
    if (query.trim().length < 2) return;
    setSearching(true);
    try {
      setResults(await AdminModeration.searchMembers(query.trim()));
    } catch (e) {
      toast.error(writeErrorMessage(e as Error, "Search failed."));
    } finally {
      setSearching(false);
    }
  };
  const refresh = async () => {
    await sanctions.reload();
    if (results) await search();
    onChange();
  };
  const lift = async (id: string) => {
    try {
      await AdminModeration.liftSanction(id);
      toast.success("Restriction lifted");
      await refresh();
    } catch (e) {
      toast.error(writeErrorMessage(e as Error, "That didn't work."));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-3">
        <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); void search(); }}>
          <Input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Find a member by handle" aria-label="Member handle" maxLength={40} className="max-w-sm" />
          <Button type="submit" disabled={searching || query.trim().length < 2}>{searching ? <Loader2 className="size-4 animate-spin" /> : "Search"}</Button>
        </form>
        {results && results.length === 0 && <p className="text-sm text-muted-foreground">No members match “{query}”.</p>}
        <ul className="space-y-2">
          {(results ?? []).map((m) => (
            <li key={m.user_id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border px-4 py-3 text-sm">
              <div className="min-w-0">
                <p className="font-medium">@{m.handle} {m.role !== "member" && <Badge variant="secondary" className="ml-1 capitalize">{m.role}</Badge>}</p>
                <p className="text-xs text-muted-foreground">{m.posts} posts · {m.comments} comments</p>
                {m.sanction_kind && <p className="mt-1 text-xs text-destructive">{m.sanction_kind === "mute" ? "Muted" : "Suspended"} {untilLabel(m.sanction_expires_at)}</p>}
              </div>
              {m.role === "member" && (
                <Button size="sm" variant="outline" onClick={() => setRestrict({ kind: "member", userId: m.user_id, label: `@${m.handle}` })}>{m.sanction_kind ? "Change restriction" : "Mute / suspend"}</Button>
              )}
            </li>
          ))}
        </ul>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between gap-3">
          <h3 className="font-heading text-base font-semibold">{showAll ? "Restriction history" : "Active restrictions"}</h3>
          <Button size="sm" variant="ghost" onClick={() => setShowAll((v) => !v)}>{showAll ? "Show active only" : "Show history"}</Button>
        </div>
        <Status loading={sanctions.loading} error={sanctions.error} onRetry={sanctions.reload} empty={sanctions.data.length === 0 ? (showAll ? "No restrictions yet." : "Nobody is muted or suspended.") : null} />
        <ul className="divide-y divide-border rounded-xl border border-border">
          {sanctions.data.map((s) => (
            <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 px-4 py-3 text-sm">
              <div className="min-w-0">
                <p><span className="font-medium">@{s.handle ?? "unknown"}</span> <Badge variant={s.active ? "destructive" : "outline"} className="ml-1 capitalize">{s.kind === "mute" ? "Muted" : "Suspended"}{s.active ? "" : s.lifted_at ? " (lifted)" : " (ended)"}</Badge></p>
                <p className="mt-0.5 break-words text-xs text-muted-foreground">{s.reason} · by {s.created_by_name ?? "staff"} · {relativeTime(s.created_at)} ago · {s.active ? untilLabel(s.expires_at) : "inactive"}</p>
              </div>
              {s.active && <Button size="sm" variant="outline" onClick={() => void lift(s.id)}>Lift</Button>}
            </li>
          ))}
        </ul>
      </div>
      <SanctionDialog target={restrict} onClose={() => setRestrict(null)} onDone={() => void refresh()} />
    </div>
  );
};

const LogPanel = () => {
  const { data, loading, error, reload } = useLoad<AdminLogRow[]>(AdminModeration.log, []);
  return (
    <div className="space-y-2">
      <Status loading={loading} error={error} onRetry={reload} empty={data.length === 0 ? "No moderation actions yet." : null} />
      <ul className="divide-y divide-border rounded-xl border border-border">
        {data.map((l, i) => (
          <li key={i} className="flex flex-wrap items-center gap-x-3 gap-y-1 px-4 py-2.5 text-sm">
            <span className="w-14 shrink-0 text-xs text-muted-foreground">{relativeTime(l.created_at)}</span>
            <Badge variant="outline" className="capitalize">{l.action.replace("_", " ")}</Badge>
            <span className="capitalize">{l.target_type}</span>
            <span className="text-muted-foreground">by {l.actor_name}</span>
            {l.note && <span className="text-xs text-muted-foreground">· {l.note}</span>}
          </li>
        ))}
      </ul>
    </div>
  );
};

/** Admin → Moderation: the Community Forum's reports, held (spam-screened) content, blocked terms and the action log. */
const ModerationTab = () => {
  const overview = useLoad<Record<string, number>>(AdminModeration.overview, {});
  const o = overview.data;
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="flex-row items-start justify-between gap-3 space-y-0">
          <div>
            <CardTitle className="flex items-center gap-2 font-heading text-lg"><ShieldAlert className="size-5" /> Community moderation</CardTitle>
            <CardDescription>Review reports and spam-held content, restrict members, and watch storage. Discussions are purged automatically 30 days after posting. Every action is logged.</CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={() => void overview.reload()} aria-label="Refresh counts"><RefreshCw className="size-4" /></Button>
        </CardHeader>
        <CardContent>
          {overview.error ? (
            <p role="alert" className="text-sm text-destructive">{overview.error}</p>
          ) : (
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-5">
              <Counter label="Open reports" value={o.open_reports} warn />
              <Counter label="Held posts" value={o.held_posts} warn />
              <Counter label="Held comments" value={o.held_comments} warn />
              <Counter label="Removed (7d)" value={o.removed_7d} />
              <Counter label="Posts (24h)" value={o.posts_24h} />
              <Counter label="Comments (24h)" value={o.comments_24h} />
              <Counter label="Restricted members" value={o.active_sanctions} />
              <Counter label="Picture storage (MB)" value={o.media_mb} />
              <Counter label="Due for 30-day purge" value={o.purge_due} />
            </div>
          )}
        </CardContent>
      </Card>
      <Tabs defaultValue="reports">
        <TabsList className="flex h-auto flex-wrap justify-start">
          <TabsTrigger value="reports">Reports{o.open_reports ? ` (${o.open_reports})` : ""}</TabsTrigger>
          <TabsTrigger value="held">Held{o.held_posts || o.held_comments ? ` (${(o.held_posts ?? 0) + (o.held_comments ?? 0)})` : ""}</TabsTrigger>
          <TabsTrigger value="members">Members{o.active_sanctions ? ` (${o.active_sanctions})` : ""}</TabsTrigger>
          <TabsTrigger value="terms">Blocked terms</TabsTrigger>
          <TabsTrigger value="log">Action log</TabsTrigger>
        </TabsList>
        <TabsContent value="reports" className="mt-4"><ReportsPanel onChange={() => void overview.reload()} /></TabsContent>
        <TabsContent value="held" className="mt-4"><HeldPanel onChange={() => void overview.reload()} /></TabsContent>
        <TabsContent value="members" className="mt-4"><MembersPanel onChange={() => void overview.reload()} /></TabsContent>
        <TabsContent value="terms" className="mt-4"><TermsPanel /></TabsContent>
        <TabsContent value="log" className="mt-4"><LogPanel /></TabsContent>
      </Tabs>
    </div>
  );
};

export default ModerationTab;
