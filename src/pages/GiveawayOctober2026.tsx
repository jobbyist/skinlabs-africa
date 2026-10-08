import { lazy, Suspense, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { CalendarClock, CheckCircle2, Gift, Sparkles, Ticket } from "lucide-react";
import SEO from "@/components/SEO";
import GiveawayCta from "@/components/giveaway/GiveawayCta";
import GiveawaySkinStoryCard from "@/components/giveaway/GiveawaySkinStoryCard";
import GiveawayTerms from "@/components/giveaway/GiveawayTerms";
import {
  GIVEAWAY_CLOSING_TIME_LABEL,
  GIVEAWAY_DEADLINE_LABEL,
  GIVEAWAY_NAME,
  GIVEAWAY_SEO,
  GIVEAWAY_PATH,
  GIVEAWAY_PRIZES,
  GIVEAWAY_TIKTOK_HANDLE,
  GIVEAWAY_TIKTOK_URL,
  daysLeft,
  isGiveawayOpen,
} from "@/lib/giveaway/campaign";
import { trackGiveawayPageView } from "@/lib/giveaway/analytics";

const GiveawayEntryPanel = lazy(() => import("@/components/giveaway/GiveawayEntryPanel"));

const scrollToEntry = () => {
  const el = document.getElementById("enter");
  if (!el) return;
  const reduce = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
  history.replaceState(history.state, "", `${GIVEAWAY_PATH}#enter`);
};

const STEPS = [
  { n: "01", title: "Complete your free AI skin assessment.", body: "About two minutes. No account needed to start." },
  { n: "02", title: "Share your Skin Story on your TikTok Story.", body: "Your concerns, your journey, what you learned. Honest is perfect." },
  { n: "03", title: `Tag ${GIVEAWAY_TIKTOK_HANDLE} and complete your giveaway entry.`, body: "Confirm your entry below with your TikTok username." },
] as const;

const GiveawayOctober2026 = () => {
  const open = isGiveawayOpen();
  const [left, setLeft] = useState<number | null>(null);
  const [showEntry, setShowEntry] = useState(false);
  const [showSticky, setShowSticky] = useState(false);
  const heroCta = useRef<HTMLDivElement>(null);
  const entryAnchor = useRef<HTMLDivElement>(null);

  useEffect(() => {
    trackGiveawayPageView();
    setLeft(daysLeft());
  }, []);

  // The entry panel (auth + database) loads only when it is near the screen, or when returning to #enter after sign-in.
  useEffect(() => {
    if (window.location.hash === "#enter") setShowEntry(true);
    const el = entryAnchor.current;
    if (!el || typeof IntersectionObserver === "undefined") return setShowEntry(true);
    const io = new IntersectionObserver(([e]) => e.isIntersecting && setShowEntry(true), { rootMargin: "600px 0px" });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  // Sticky mobile CTA once the hero button has scrolled away.
  useEffect(() => {
    const el = heroCta.current;
    if (!el || typeof IntersectionObserver === "undefined") return;
    const io = new IntersectionObserver(([e]) => setShowSticky(!e.isIntersecting), { threshold: 0 });
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <SEO
        title={GIVEAWAY_SEO.title}
        description={GIVEAWAY_SEO.description}
        canonical={GIVEAWAY_PATH}
        ogImage={GIVEAWAY_SEO.ogImage}
      />

      {/* Slim campaign header: no site navigation to lead people away from the one action. */}
      <header className="flex items-center justify-between px-4 pb-2 pt-[max(1rem,env(safe-area-inset-top))] sm:px-8">
        <Link to="/" aria-label="SkinLabs® home" className="inline-flex">
          <img src="/logosvg.png" alt="SkinLabs®" width={132} height={32} className="h-7 w-auto dark:hidden" />
          <img src="/logosvgwhite.png" alt="SkinLabs®" width={132} height={32} className="hidden h-7 w-auto dark:block" />
        </Link>
        <a href="#terms" className="text-xs font-medium text-muted-foreground underline-offset-4 hover:underline">
          Terms apply
        </a>
      </header>

      <main>
        {/* HERO */}
        <section aria-labelledby="giveaway-hero" className="px-4 pb-14 pt-6 sm:px-8 sm:pb-20 sm:pt-12">
          <div className="mx-auto grid max-w-6xl items-center gap-10 lg:grid-cols-[1.15fr_0.85fr]">
            <div className="min-w-0 animate-in fade-in slide-in-from-bottom-2 duration-500 motion-reduce:animate-none">
              <p className="eyebrow">{open ? `SkinLabs® October Giveaway · Closes ${GIVEAWAY_DEADLINE_LABEL}` : `Giveaway closed ${GIVEAWAY_DEADLINE_LABEL}`}</p>
              <h1 id="giveaway-hero" className="mt-3 max-w-3xl text-balance font-heading text-[2.45rem] font-extrabold leading-[1.02] tracking-tight sm:text-6xl">
                Tell your Skin Story.
                <span className="gradient-text"> Win R500 + Lifetime Glow Insider.</span>
              </h1>
              <p className="mt-5 max-w-xl text-pretty text-lg leading-relaxed text-muted-foreground">
                Start with the free SKYNN AI skin assessment, share your honest Skin Story on TikTok, tag {GIVEAWAY_TIKTOK_HANDLE}, then confirm your entry here.
              </p>

              <div className="mt-6 flex flex-wrap gap-2" aria-label="Giveaway highlights">
                <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold">Free to enter</span>
                <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold">2 winners</span>
                <span className="rounded-full border border-border bg-card px-3 py-1.5 text-xs font-semibold">Closes {GIVEAWAY_DEADLINE_LABEL}</span>
              </div>

              <div className="mt-6 rounded-3xl border border-border bg-card p-5 shadow-sm sm:p-6">
                <p className="text-sm font-bold uppercase tracking-[0.14em] text-muted-foreground">Each winner gets</p>
                <p className="mt-1 text-xl font-bold leading-snug sm:text-2xl">R500 Takealot Voucher + Lifetime Glow Insider</p>
              </div>

              <div ref={heroCta} className="mt-8 flex flex-col items-stretch sm:flex-row sm:items-center">
                <GiveawayCta location="hero" />
              </div>
            </div>

            <div className="hidden lg:block">
              <GiveawaySkinStoryCard onEnter={scrollToEntry} />
            </div>
          </div>
        </section>

        {/* PRIZES */}
        <section aria-labelledby="prizes-heading" className="bg-muted/40 px-4 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-4xl text-center">
            <p className="eyebrow">The prizes</p>
            <h2 id="prizes-heading" className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Two Winners. Two Big SkinLabs® Rewards.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl border border-border bg-card p-6 text-left shadow-sm">
                <Gift className="h-7 w-7" aria-hidden="true" />
                <p className="mt-4 text-2xl font-bold">R500 Takealot Voucher</p>
                <p className="mt-1 text-sm text-muted-foreground">One for each winner.</p>
              </div>
              <div className="rounded-3xl border border-border bg-card p-6 text-left shadow-sm">
                <Ticket className="h-7 w-7" aria-hidden="true" />
                <p className="mt-4 text-2xl font-bold">{GIVEAWAY_PRIZES.subscription}</p>
                <p className="mt-1 text-sm text-muted-foreground">One for each winner.</p>
              </div>
            </div>
            <p className="mx-auto mt-6 max-w-xl text-pretty text-muted-foreground">
              Two lucky SkinLabs® participants will each receive a R500 Takealot voucher plus lifetime access to Glow Insider.
            </p>
          </div>
        </section>

        {/* HOW TO ENTER */}
        <section aria-labelledby="how-heading" className="px-4 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <p className="eyebrow">How to enter</p>
            <h2 id="how-heading" className="mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
              Three steps to enter.
            </h2>
            <ol className="mt-8 grid gap-4 sm:grid-cols-3">
              {STEPS.map((s) => (
                <li key={s.n} className="rounded-3xl border border-border bg-card p-6">
                  <span className="font-heading text-4xl font-extrabold text-muted-foreground/60">{s.n}</span>
                  <p className="mt-3 text-lg font-semibold leading-snug">{s.title}</p>
                  <p className="mt-2 text-sm text-muted-foreground">{s.body}</p>
                </li>
              ))}
            </ol>
            <p className="mt-6 font-semibold">Entries close {GIVEAWAY_DEADLINE_LABEL}.</p>
            <p className="mt-2 text-sm text-muted-foreground">
              Completing the assessment on its own isn't a giveaway entry. You also need to share your Story on TikTok, tag {GIVEAWAY_TIKTOK_HANDLE} and confirm your entry before the closing time.
            </p>
          </div>
        </section>

        {/* EXAMPLE SKIN STORY (phones; desktop shows it in the hero) */}
        <section aria-label="Example Skin Story" className="px-4 pb-14 lg:hidden">
          <GiveawaySkinStoryCard onEnter={scrollToEntry} />
        </section>

        {/* WHAT YOU GET */}
        <section aria-labelledby="why-heading" className="bg-muted/40 px-4 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-4xl">
            <p className="eyebrow">What you get</p>
            <h2 id="why-heading" className="mt-2 max-w-3xl text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Useful before you ever win.
            </h2>
            <div className="mt-8 grid gap-4 sm:grid-cols-3">
              <div className="rounded-3xl border border-border bg-card p-6">
                <Sparkles className="h-6 w-6" aria-hidden="true" />
                <p className="mt-3 font-semibold">A clearer skin snapshot</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Get personalised skincare insights built from your own answers, plus a routine that fits your profile.</p>
              </div>
              <div className="rounded-3xl border border-border bg-card p-6">
                <CheckCircle2 className="h-6 w-6" aria-hidden="true" />
                <p className="mt-3 font-semibold">A fast, private start</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">It takes about two minutes. Any optional photo stays on your device and is not uploaded or analysed.</p>
              </div>
              <div className="rounded-3xl border border-border bg-card p-6">
                <CalendarClock className="h-6 w-6" aria-hidden="true" />
                <p className="mt-3 font-semibold">A simple path to enter</p>
                <p className="mt-1 text-sm leading-relaxed text-muted-foreground">Save your assessment, share your Story, tag {GIVEAWAY_TIKTOK_HANDLE}, then confirm your entry below.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SKIN STORY */}
        <section aria-labelledby="story-heading" className="px-4 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-3xl">
            <p className="eyebrow">Your Skin Story</p>
            <h2 id="story-heading" className="mt-2 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              Your skin has a story. Tell us yours.
            </h2>
            <p className="mt-4 text-pretty text-lg text-muted-foreground">
              Share your experience, your skin concerns, your journey, something you discovered or what you learned from your SkinLabs® assessment. There's no script.
            </p>
            <ul className="mt-6 space-y-3 text-sm leading-relaxed sm:text-base">
              <li className="flex gap-3"><span className="mt-0.5" aria-hidden="true">✓</span><span>Talk about your skin, your experience, what you have tried or what you learned.</span></li>
              <li className="flex gap-3"><span className="mt-0.5" aria-hidden="true">✓</span><span>You do <strong>not</strong> have to leave a positive review or say SkinLabs® improved your skin.</span></li>
              <li className="flex gap-3"><span className="mt-0.5" aria-hidden="true">✓</span><span>Post it on your <strong>TikTok Story</strong>, tag <strong>{GIVEAWAY_TIKTOK_HANDLE}</strong> and keep it live while TikTok allows.</span></li>
            </ul>
            <div className="mt-6">
              <a
                href={GIVEAWAY_TIKTOK_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-11 items-center text-sm font-medium underline underline-offset-4"
              >
                See {GIVEAWAY_TIKTOK_HANDLE} on TikTok
              </a>
            </div>
          </div>
        </section>

        {/* COMPLETION CHECKLIST */}
        <section aria-labelledby="checklist-heading" className="px-4 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 shadow-sm sm:p-8">
            <p className="eyebrow">Before you leave</p>
            <h2 id="checklist-heading" className="mt-2 text-balance text-2xl font-bold tracking-tight sm:text-3xl">
              Make sure your entry is complete.
            </h2>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                "Your free assessment is saved",
                `Your TikTok Story is live and tags ${GIVEAWAY_TIKTOK_HANDLE}`,
                "You confirmed your entry below",
              ].map((item) => (
                <div key={item} className="flex items-start gap-2 rounded-2xl border border-border bg-muted/30 p-4">
                  <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
                  <p className="text-sm leading-relaxed">{item}</p>
                </div>
              ))}
            </div>
            <p className="mt-5 text-sm text-muted-foreground">Entries close {GIVEAWAY_DEADLINE_LABEL} at {GIVEAWAY_CLOSING_TIME_LABEL.toLowerCase()}.</p>
          </div>
        </section>

        {/* DEADLINE + ENTRY */}
        <section id="enter" aria-labelledby="enter-heading" className="scroll-mt-4 bg-muted/40 px-4 py-14 sm:px-8 sm:py-20">
          <div className="mx-auto max-w-3xl text-center">
            <CalendarClock className="mx-auto h-8 w-8" aria-hidden="true" />
            <h2 id="enter-heading" className="mt-3 text-balance text-3xl font-bold tracking-tight sm:text-4xl">
              {open ? `Entries close ${GIVEAWAY_DEADLINE_LABEL}` : "This giveaway has closed"}
            </h2>
            {open && left !== null && (
              <p className="mt-2 text-muted-foreground">{left === 0 ? "Today is the last day." : left === 1 ? "1 day left." : `${left} days left.`}</p>
            )}
            <div ref={entryAnchor} className="mt-8 min-h-[12rem]">
              {showEntry && (
                <Suspense fallback={<div className="mx-auto h-48 max-w-xl animate-pulse rounded-3xl bg-muted" aria-hidden="true" />}>
                  <GiveawayEntryPanel />
                </Suspense>
              )}
            </div>
          </div>
        </section>

        <GiveawayTerms />
      </main>

      <footer className="border-t border-border px-4 pb-28 pt-8 text-center text-xs text-muted-foreground sm:px-8 sm:pb-10">
        <p>
          {GIVEAWAY_NAME}. Not sponsored, administered or endorsed by TikTok or Takealot. AI-powered skin insights are general guidance, not medical advice.
        </p>
        <nav aria-label="Legal" className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
          <Link to="/privacy-policy" className="underline underline-offset-2">Privacy</Link>
          <Link to="/terms-of-service" className="underline underline-offset-2">Terms of Service</Link>
          <Link to="/cookie-policy" className="underline underline-offset-2">Cookies</Link>
          <Link to="/" className="underline underline-offset-2">SkinLabs® home</Link>
        </nav>
      </footer>

      {/* Sticky phone CTA: mounted only once the hero button has scrolled away. */}
      {showSticky && (
        <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur animate-in slide-in-from-bottom duration-200 motion-reduce:animate-none sm:hidden">
          <GiveawayCta location="mid_page" className="min-h-12" />
        </div>
      )}
    </div>
  );
};

export default GiveawayOctober2026;
