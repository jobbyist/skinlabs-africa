import { useEffect, useMemo, useRef, useState } from "react";
import { AtSign, Check, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { cn } from "@/lib/utils";
import { generateSuggestions, statusMessage, usernameFormatError, type UsernameStatus } from "@/lib/username";

interface Props {
  /** Current username as stored (may be the glow_ placeholder). */
  username: string;
  fullName: string;
  onSaved: (username: string) => void;
}

type Check = { value: string; status: UsernameStatus } | null;

const DEBOUNCE_MS = 350;

/** Asks the database about up to 12 candidates at once; anything it doesn't return is treated as unavailable. */
const checkUsernames = async (candidates: string[]): Promise<Record<string, UsernameStatus>> => {
  // check_usernames isn't in the type baseline yet (typecheck reads supabase/types.baseline.ts), so call it untyped.
  const rpc = supabase.rpc as unknown as (
    fn: string,
    args: Record<string, unknown>,
  ) => PromiseLike<{ data: unknown; error: { message: string } | null }>;
  const { data, error } = await rpc.call(supabase, "check_usernames", { p_usernames: candidates });
  if (error) throw error;
  const out: Record<string, UsernameStatus> = {};
  for (const row of (data ?? []) as { username: string; status: UsernameStatus }[]) out[row.username] = row.status;
  return out;
};

/**
 * Settings → Profile: pick your own username. The typed value is checked live (format instantly, availability after a
 * short pause, the newest answer wins) and a row of tappable suggestions is filtered to names that are free right now.
 * The save re-checks on the server, so a name taken a second ago still ends in a clear message, never a duplicate.
 */
const UsernameCard = ({ username, fullName, onSaved }: Props) => {
  const { user } = useAuth();
  const isPlaceholder = /^glow_/i.test(username);
  const [value, setValue] = useState(isPlaceholder ? "" : username);
  const [result, setResult] = useState<Check>(null);
  const [checking, setChecking] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [seed, setSeed] = useState(0);
  const requestId = useRef(0);

  useEffect(() => {
    setValue(/^glow_/i.test(username) ? "" : username);
  }, [username]);

  const trimmed = value.trim();
  const formatError = trimmed ? usernameFormatError(trimmed) : null;
  const unchanged = trimmed.toLowerCase() === username.toLowerCase();

  // Live availability for what's typed.
  useEffect(() => {
    if (!trimmed || formatError || unchanged) {
      setResult(null);
      setChecking(false);
      return;
    }
    const id = ++requestId.current;
    setChecking(true);
    const timer = window.setTimeout(async () => {
      try {
        const statuses = await checkUsernames([trimmed]);
        if (id === requestId.current) setResult({ value: trimmed, status: statuses[trimmed] ?? "invalid" });
      } catch {
        if (id === requestId.current) setResult(null);
      } finally {
        if (id === requestId.current) setChecking(false);
      }
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(timer);
  }, [trimmed, formatError, unchanged]);

  // Suggestions: generated from the member's own details (and what they're typing), kept only if free right now.
  const ideas = useMemo(
    () => generateSuggestions({ fullName, email: user?.email, typed: formatError ? "" : trimmed }, { count: 10 }),
    // `seed` re-rolls the random fallbacks on "More ideas".
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [fullName, user?.email, formatError ? "" : trimmed.slice(0, 12), seed],
  );
  useEffect(() => {
    let cancelled = false;
    const timer = window.setTimeout(async () => {
      try {
        const statuses = await checkUsernames(ideas.slice(0, 12));
        if (!cancelled) setSuggestions(ideas.filter((i) => statuses[i] === "available").slice(0, 5));
      } catch {
        if (!cancelled) setSuggestions([]);
      }
    }, DEBOUNCE_MS);
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [ideas]);

  const canSave = Boolean(trimmed) && !formatError && !unchanged && !checking && result?.status === "available" && result.value === trimmed;

  const save = async () => {
    if (!user || !canSave) return;
    setSaving(true);
    // Re-check at the moment of saving: the answer above can be a few seconds old.
    try {
      const fresh = (await checkUsernames([trimmed]))[trimmed];
      if (fresh !== "available") {
        setResult({ value: trimmed, status: fresh ?? "invalid" });
        toast.error(statusMessage(fresh ?? "invalid", trimmed));
        return;
      }
    } catch {
      /* fall through: the unique index below is the real guard */
    }
    const { error } = await supabase.from("profiles").update({ username: trimmed }).eq("user_id", user.id);
    setSaving(false);
    if (error) {
      const taken = error.code === "23505" || error.message?.includes("profiles_username");
      if (taken) setResult({ value: trimmed, status: "taken" });
      toast.error(taken ? `${trimmed} was just taken. Try another.` : error.message?.includes("reserved") ? "That username is reserved." : "Could not save your username.");
      return;
    }
    toast.success("Username updated");
    onSaved(trimmed);
  };

  let feedback: { tone: "ok" | "bad" | "muted"; text: string } | null = null;
  if (formatError && trimmed) feedback = { tone: "bad", text: formatError };
  else if (checking) feedback = { tone: "muted", text: "Checking…" };
  else if (result && result.value === trimmed) {
    feedback = { tone: result.status === "available" || result.status === "yours" ? "ok" : "bad", text: statusMessage(result.status, trimmed) };
  } else if (unchanged && trimmed) feedback = { tone: "muted", text: "This is your current username." };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AtSign className="h-4 w-4" aria-hidden /> Username
        </CardTitle>
        <CardDescription>
          Shown on your comments, and you can sign in with it instead of your email.
          {isPlaceholder && <> Yours is <span className="font-medium text-foreground">{username}</span>, assigned when you joined. Pick your own below.</>}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="username-field">Choose a username</Label>
          <div className="relative">
            <Input
              id="username-field"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="glowseeker"
              maxLength={24}
              autoComplete="off"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              aria-invalid={feedback?.tone === "bad"}
              aria-describedby="username-feedback"
              className="pr-9"
            />
            <span className="pointer-events-none absolute inset-y-0 right-3 flex items-center" aria-hidden>
              {checking ? (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              ) : feedback?.tone === "ok" ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : feedback?.tone === "bad" ? (
                <X className="h-4 w-4 text-destructive" />
              ) : null}
            </span>
          </div>
          <p
            id="username-feedback"
            role="status"
            aria-live="polite"
            className={cn(
              "min-h-5 text-xs",
              feedback?.tone === "ok" && "text-emerald-700 dark:text-emerald-400",
              feedback?.tone === "bad" && "text-destructive",
              (!feedback || feedback.tone === "muted") && "text-muted-foreground",
            )}
          >
            {feedback?.text ?? "3–20 letters, numbers or underscores. Not case-sensitive."}
          </p>
        </div>

        {suggestions.length > 0 && (
          <div className="space-y-2">
            <p className="text-xs font-medium text-muted-foreground">Available right now</p>
            <div className="flex flex-wrap gap-2">
              {suggestions.map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setValue(s)}
                  className="rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                >
                  {s}
                </button>
              ))}
              <button
                type="button"
                onClick={() => setSeed((n) => n + 1)}
                className="rounded-full px-3 py-1.5 text-sm font-medium text-primary hover:underline"
              >
                More ideas
              </button>
            </div>
          </div>
        )}

        <Button onClick={save} disabled={!canSave || saving}>
          {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
          Save username
        </Button>
      </CardContent>
    </Card>
  );
};

export default UsernameCard;
