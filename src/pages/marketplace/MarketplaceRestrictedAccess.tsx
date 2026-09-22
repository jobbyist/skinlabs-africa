import { useEffect, useMemo, useState, FormEvent } from "react";
import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { Lock, Clock, Mail, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import logoWhite from "@/assets/skinlabs-logo-white.svg";

/** Launch: 1 November 2026 00:00 SAST (UTC+2) */
const LAUNCH_AT = new Date("2026-11-01T00:00:00+02:00").getTime();

type Countdown = { days: number; hours: number; minutes: number; seconds: number; done: boolean };

function useCountdown(targetMs: number): Countdown {
  const calc = (): Countdown => {
    const diff = Math.max(0, targetMs - Date.now());
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, done: true };
    const days = Math.floor(diff / 86_400_000);
    const hours = Math.floor((diff % 86_400_000) / 3_600_000);
    const minutes = Math.floor((diff % 3_600_000) / 60_000);
    const seconds = Math.floor((diff % 60_000) / 1_000);
    return { days, hours, minutes, seconds, done: false };
  };
  const [value, setValue] = useState<Countdown>(calc);
  useEffect(() => {
    const id = window.setInterval(() => setValue(calc()), 1000);
    return () => window.clearInterval(id);
  }, [targetMs]);
  return value;
}

type Props = {
  onUnlocked: () => void;
};

export default function MarketplaceRestrictedAccess({ onUnlocked }: Props) {
  const { toast } = useToast();
  const countdown = useCountdown(LAUNCH_AT);

  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [city, setCity] = useState("");
  const [waitlistLoading, setWaitlistLoading] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);

  const units = useMemo(
    () => [
      { label: "Days", value: countdown.days },
      { label: "Hours", value: countdown.hours },
      { label: "Mins", value: countdown.minutes },
      { label: "Secs", value: countdown.seconds },
    ],
    [countdown],
  );

  async function handleUnlock(e: FormEvent) {
    e.preventDefault();
    setAuthError(null);
    setAuthLoading(true);
    try {
      const res = await fetch("/api/marketplace-auth", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      const data = (await res.json().catch(() => ({}))) as { ok?: boolean; error?: string };
      if (!res.ok || !data.ok) {
        setAuthError(data.error || "Invalid username or password.");
        return;
      }
      try {
        sessionStorage.setItem("marketplace_unlocked", "1");
      } catch {
        /* ignore */
      }
      toast({ title: "Access granted", description: "Welcome to the OpenHaus marketplace preview." });
      onUnlocked();
    } catch {
      setAuthError("Could not reach the access server. Please try again.");
    } finally {
      setAuthLoading(false);
    }
  }

  async function handleWaitlist(e: FormEvent) {
    e.preventDefault();
    if (!firstName.trim() || !lastName.trim() || !email.trim() || !phone.trim() || !city.trim()) {
      toast({ title: "Missing details", description: "Please fill in all fields.", variant: "destructive" });
      return;
    }
    setWaitlistLoading(true);
    try {
      const { error } = await supabase.from("openhaus_waitlist").insert({
        first_name: firstName.trim(),
        last_name: lastName.trim(),
        email: email.trim().toLowerCase(),
        phone: phone.trim(),
        city: city.trim(),
        country: "South Africa",
      });
      if (error) throw error;
      setWaitlistDone(true);
      toast({
        title: "You're on the list",
        description: "We'll email you closer to the 1 November 2026 launch.",
      });
    } catch (err) {
      console.error(err);
      toast({
        title: "That didn't go through",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setWaitlistLoading(false);
    }
  }

  return (
    <>
      <Helmet>
        <title>OpenHaus Marketplace — Restricted Access | SkinLabs®</title>
        <meta
          name="description"
          content="OpenHaus by SkinLabs® launches 1 November 2026. Join the early access waiting list or unlock the private marketplace preview."
        />
        <meta name="robots" content="noindex,nofollow" />
        <link rel="canonical" href="https://skinlabs.co.za/marketplace" />
      </Helmet>

      <div className="relative min-h-screen overflow-hidden bg-[#0c0b0a] text-stone-100">
        <div
          className="pointer-events-none absolute inset-0 opacity-40"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(212,175,120,0.35), transparent 60%), radial-gradient(ellipse 60% 40% at 90% 80%, rgba(120,90,60,0.25), transparent 50%)",
          }}
        />
        <div className="pointer-events-none absolute inset-0 bg-[url('/openhaus.png')] bg-cover bg-center opacity-[0.07]" />

        <header className="relative z-10 flex items-center justify-between px-5 py-5 sm:px-8">
          <Link to="/" className="inline-flex items-center gap-3">
            <img src={logoWhite} alt="SkinLabs" className="h-9 w-auto brightness-0 invert" />
            <span className="hidden text-xs font-medium tracking-[0.2em] text-stone-400 uppercase sm:inline">
              OpenHaus
            </span>
          </Link>
          <Link to="/" className="text-xs font-medium text-stone-400 transition-colors hover:text-stone-100">
            ← Back to SkinLabs
          </Link>
        </header>

        <main className="relative z-10 mx-auto flex w-full max-w-5xl flex-col gap-10 px-5 pb-20 pt-6 sm:px-8 lg:flex-row lg:items-start lg:gap-12">
          <section className="flex-1 space-y-8">
            <div className="inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-[11px] font-semibold tracking-wide text-amber-200 uppercase">
              <Lock className="h-3.5 w-3.5" />
              Restricted access · Preview only
            </div>

            <div className="space-y-4">
              <h1 className="font-heading text-3xl leading-tight font-bold tracking-tight text-white sm:text-4xl lg:text-5xl">
                Marketplace by OpenHaus
              </h1>
              <p className="max-w-xl text-base leading-relaxed text-stone-300 sm:text-lg">
                Curated South African skincare — independently reviewed, climate-aware, and built for
                local shelves. Public launch is locked until{" "}
                <span className="font-semibold text-amber-200">1 November 2026</span>.
              </p>
            </div>

            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-md sm:p-6">
              <div className="mb-4 flex items-center gap-2 text-sm font-medium text-stone-300">
                <Clock className="h-4 w-4 text-amber-300" />
                {countdown.done ? "Launch day is here" : "Countdown to public launch"}
              </div>
              <div className="grid grid-cols-4 gap-2 sm:gap-3">
                {units.map((u) => (
                  <div
                    key={u.label}
                    className="rounded-xl border border-white/10 bg-black/40 px-2 py-3 text-center sm:px-3"
                  >
                    <div className="font-mono text-2xl font-bold tabular-nums text-white sm:text-3xl">
                      {String(u.value).padStart(2, "0")}
                    </div>
                    <div className="mt-1 text-[10px] font-medium tracking-wider text-stone-400 uppercase">
                      {u.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <ul className="space-y-2 text-sm text-stone-400">
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                Independently scored product reviews linked to every listing
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                South African brands first — climate, currency and shelves in mind
              </li>
              <li className="flex items-start gap-2">
                <Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" />
                Early access members get launch samples, drops and priority invites
              </li>
            </ul>
          </section>

          <section className="w-full max-w-md space-y-6 lg:sticky lg:top-8">
            <div className="rounded-2xl border border-white/15 bg-white/5 p-6 shadow-2xl backdrop-blur-xl">
              <h2 className="text-lg font-semibold text-white">Team / partner unlock</h2>
              <p className="mt-1 text-sm text-stone-400">
                Enter the login credentials provided by the SkinLabs® support team to browse the live marketplace preview.
              </p>
              <form onSubmit={handleUnlock} className="mt-5 space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="mp-user" className="text-stone-300">Username</Label>
                  <Input
                    id="mp-user"
                    autoComplete="username"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    className="border-white/15 bg-black/40 text-white placeholder:text-stone-500"
                    placeholder="Marketplace username"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mp-pass" className="text-stone-300">Password</Label>
                  <Input
                    id="mp-pass"
                    type="password"
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="border-white/15 bg-black/40 text-white placeholder:text-stone-500"
                    placeholder="••••••••"
                    required
                  />
                </div>
                {authError && (
                  <p className="text-sm text-red-300" role="alert">{authError}</p>
                )}
                <Button type="submit" disabled={authLoading} className="w-full gap-2 bg-amber-600 text-white hover:bg-amber-500">
                  {authLoading ? "Checking…" : "Unlock marketplace"}
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </form>
            </div>

            <div className="rounded-2xl border border-white/10 bg-black/30 p-6 backdrop-blur-md">
              <div className="flex items-center gap-2">
                <Mail className="h-4 w-4 text-amber-300" />
                <h2 className="text-lg font-semibold text-white">Early access waiting list</h2>
              </div>
              <p className="mt-1 text-sm text-stone-400">
                Get notified at launch — samples, giveaways and first-look discounts for the list.
              </p>

              {waitlistDone ? (
                <p className="mt-5 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-4 py-3 text-sm text-emerald-100">
                  You're on the list. Watch your inbox closer to 1 November 2026.
                </p>
              ) : (
                <form onSubmit={handleWaitlist} className="mt-5 space-y-3">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label htmlFor="wl-first" className="text-stone-400">First name</Label>
                      <Input id="wl-first" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="border-white/15 bg-black/40 text-white" required />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="wl-last" className="text-stone-400">Last name</Label>
                      <Input id="wl-last" value={lastName} onChange={(e) => setLastName(e.target.value)} className="border-white/15 bg-black/40 text-white" required />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="wl-email" className="text-stone-400">Email</Label>
                    <Input id="wl-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="border-white/15 bg-black/40 text-white" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="wl-phone" className="text-stone-400">Phone</Label>
                    <Input id="wl-phone" type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} className="border-white/15 bg-black/40 text-white" placeholder="+27…" required />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="wl-city" className="text-stone-400">City / town</Label>
                    <Input id="wl-city" value={city} onChange={(e) => setCity(e.target.value)} className="border-white/15 bg-black/40 text-white" required />
                  </div>
                  <Button type="submit" disabled={waitlistLoading} variant="outline" className="w-full border-white/20 bg-transparent text-white hover:bg-white/10">
                    {waitlistLoading ? "Joining…" : "Join the waiting list"}
                  </Button>
                </form>
              )}
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
