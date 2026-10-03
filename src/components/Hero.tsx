import { useState, useRef, useEffect } from "react";
import { ArrowRight, Atom, BookOpen, Headphones, Loader2, Users, Newspaper, Star } from "lucide-react";
import { useHeroCtas } from "@/hooks/use-hero-ctas";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import heroVideoAsset from "@/assets/hero-video.mp4";
// Reused as the <video poster> below: because the background clip is chosen
// randomly client-side from 20 candidates (see heroVideos.ts), there's no
// single "first frame" the browser's preload scanner can discover from the
// raw HTML. A shared static poster gives it an immediate, real LCP paint
// target instead of an empty background while the chosen clip streams in.
import heroPosterImage from "@/assets/hero-skincare.jpg";
import { useMembership } from "@/hooks/use-membership";
import { useAuth } from "@/hooks/use-auth";
import { useStartTrial } from "@/hooks/use-start-trial";
import { openSignupDialog } from "@/lib/conversionDialogs";
import { setPendingIntent } from "@/lib/pendingIntent";
import { trackConversionEvent } from "@/lib/analytics-events";
import { remoteHeroVideos, pickRandom, type HeroVideo } from "@/data/heroVideos";
import { trialLength } from "@/lib/promo";

/** Local brand footage + 19 remote clips = 20 total, one chosen at random per page load. */
const ALL_HERO_VIDEOS: HeroVideo[] = [
  { id: "local-default", url: heroVideoAsset, description: "SkinLabs brand hero footage" },
  ...remoteHeroVideos,
];

const stats = [
  {
    icon: Users,
    value: "3.7K+",
    label: "Community Members",
  },
  {
    icon: Newspaper,
    value: "Daily",
    label: "SA Skin Briefings",
  },
  {
    icon: Star,
    value: "4.75/5",
    label: "Member Rating",
  },
];

const Hero = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  // Chosen once per mount (i.e. once per page load), never re-rolled on re-render.
  const [activeVideo] = useState<HeroVideo>(() => pickRandom(ALL_HERO_VIDEOS));
  const [videoSrc, setVideoSrc] = useState(activeVideo.url);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user, loading: authLoading } = useAuth();
  const { tier, isMember, isTrialing, trialUsed, loading: membershipLoading } = useMembership();
  const { start: startTrial, loading: trialStarting } = useStartTrial();
  // One tap for a free account; a signed-out visitor records a trial intent and
  // signs up (IntentResolver starts the trial as soon as they're in). Only a
  // genuinely free account is offered it: start_free_trial() overwrites the
  // plan, so a paying Glow Lite member gets the plans link instead.
  const statusLoading = authLoading || (Boolean(user) && membershipLoading);
  const canTrial = !user || (tier === "explorer" && !isTrialing && !trialUsed);
  const ctas = useHeroCtas();
  const trackCta = (id: string, slot: string) => trackConversionEvent("upgrade_click", { source: "home_hero", kind: id, feature: slot });

  const handleTrialClick = () => {
    trackConversionEvent("membership_plan_selected", { plan: "insider", kind: "trial", source: "home_hero" });
    if (!user) {
      setPendingIntent({ action: "trial", plan: "insider", returnTo: "/" });
      openSignupDialog();
      return;
    }
    void startTrial({ plan: "insider", source: "home_hero" });
  };

  // If the randomly picked remote clip fails to load (network hiccup, CDN issue),
  // fall back to the bundled local video rather than leaving a blank hero.
  const handleVideoError = () => {
    if (videoSrc !== heroVideoAsset) setVideoSrc(heroVideoAsset);
  };

  // Don't start streaming a hero clip until the page has loaded: the poster is the LCP
  // paint target, and an early multi-MB video fetch competes with the JS/CSS the page needs.
  // Also skipped on Save-Data / slow connections, where the poster alone is the better trade.
  const [videoReady, setVideoReady] = useState(false);
  useEffect(() => {
    const conn = (navigator as Navigator & { connection?: { saveData?: boolean; effectiveType?: string } }).connection;
    if (conn?.saveData || conn?.effectiveType === "2g" || conn?.effectiveType === "slow-2g") return;
    const start = () => setTimeout(() => setVideoReady(true), 300);
    if (document.readyState === "complete") start();
    else window.addEventListener("load", start, { once: true });
    return () => window.removeEventListener("load", start);
  }, []);

  // Respect prefers-reduced-motion and skip forcing an autoplaying background video onto that traffic.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className="relative min-h-[100svh] flex items-center overflow-hidden pt-20">
      <div className="absolute inset-0 z-0">
        <video
          key={videoSrc}
          ref={videoRef}
          src={videoReady ? videoSrc : undefined}
          poster={heroPosterImage}
          onError={handleVideoError}
          autoPlay
          muted
          loop
          playsInline
          preload="none"
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/50" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center lg:text-left lg:mx-0">
          <div className="space-y-8">
            <div className="gradient-border-anim inline-flex items-center gap-2 rounded-full bg-accent px-4 py-2 text-sm font-medium text-accent-foreground">
              {/* SA flag on mobile; Atom icon on larger screens */}
              <span className="text-base leading-none md:hidden" aria-hidden="true">
                🇿🇦
              </span>
              <Atom className="hidden h-4 w-4 md:inline" />
              Skincare Intelligence for South Africa
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-foreground leading-tight dark:drop-shadow-lg">
              Skincare, without the nonsense.
            </h1>

            <p className="text-lg font-medium text-foreground/90 max-w-xl mx-auto lg:mx-0 drop-shadow-sm">
              Evidence-graded product reviews, daily skin
              science briefings and SKYNN AI — a personalised skin assessment that builds your routine around your
              skin, our climate and your budget. No hype, just evidence - editorial that can't be bought.
            </p>

            {/* SKYNN AI is the one primary action; the trial is a quiet text link under it. */}
            <div className="flex flex-col items-center gap-3 lg:items-start">
              <Button
                size="lg"
                className="h-auto min-h-11 gap-2 whitespace-normal text-base px-8 py-3 shadow-lg shadow-primary/10 transition-transform motion-safe:hover:scale-[1.02] motion-safe:active:scale-[0.98] hover:shadow-xl hover:shadow-primary/15"
                asChild
              >
                <Link to={ctas.primary.href} onClick={() => trackCta(ctas.primary.id, "primary")}>
                  {ctas.primary.label}
                  <ArrowRight className="h-4 w-4 shrink-0" aria-hidden="true" />
                </Link>
              </Button>
              {ctas.secondary.length > 0 && (
                <div className="flex flex-wrap justify-center gap-2 lg:justify-start">
                  {ctas.secondary.map((c) => (
                    <Button key={c.id} variant="outline" size="sm" className="gap-1.5 bg-background/60 backdrop-blur" asChild>
                      <Link to={c.href} onClick={() => trackCta(c.id, "secondary")}>
                        {c.id === "podcast" ? <Headphones className="h-3.5 w-3.5" aria-hidden /> : <BookOpen className="h-3.5 w-3.5" aria-hidden />}
                        {c.label}
                      </Link>
                    </Button>
                  ))}
                </div>
              )}
              {/* Stays rendered (disabled) while auth/membership load, so the prerendered hero doesn't shift.
                  A paying member gets nothing here — a trial they can't use would be misleading. */}
              <div className="min-h-6 text-sm">
                {!(!statusLoading && isMember) &&
                  (statusLoading || canTrial ? (
                    <button
                      type="button"
                      onClick={handleTrialClick}
                      disabled={statusLoading || trialStarting}
                      className="inline-flex items-center gap-1.5 font-medium text-foreground/80 underline underline-offset-4 transition-colors hover:text-foreground disabled:opacity-60"
                    >
                      Or try Glow Insider free {trialLength()}
                      {trialStarting && <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" />}
                    </button>
                  ) : (
                    <Link
                      to="/pricing"
                      className="font-medium text-foreground/80 underline underline-offset-4 transition-colors hover:text-foreground"
                    >
                      See membership plans
                    </Link>
                  ))}
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 sm:gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border/60 bg-background/55 px-2 py-3 text-center shadow-sm backdrop-blur-md transition-all motion-safe:hover:-translate-y-0.5 hover:border-border hover:shadow-md sm:px-4 sm:py-4"
                >
                  <span className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-primary/15 to-primary/5 text-primary sm:h-9 sm:w-9">
                    <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                  </span>
                  <p className="font-heading text-xl font-extrabold tracking-tight text-foreground drop-shadow-sm sm:text-2xl md:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[11px] font-semibold uppercase leading-tight tracking-normal text-foreground/80 sm:text-xs">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
