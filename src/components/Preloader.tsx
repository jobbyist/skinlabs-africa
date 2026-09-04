import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, Newspaper, ShieldCheck, Lock, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel";
import { useAuth } from "@/hooks/use-auth";
import { useNewsArticles } from "@/hooks/use-news-articles";
import { productReviews } from "@/data/reviews";
import { comparisonArticles } from "@/data/comparisons";
import { seasonHubs } from "@/data/seasonals";
import logo from "@/assets/newskinlabs.png";
import Autoplay from "embla-carousel-autoplay";
import { markEntryGateResolved } from "@/lib/entry-gate";

interface GateSlide {
  key: string;
  tag: string;
  title: string;
  href: string;
  image: string | null;
  imageAlt: string;
}

const featuredComparison = comparisonArticles.find((c) => c.featured) ?? comparisonArticles[0];
const springReset = seasonHubs.spring;

/** Static picks alongside the live Daily Skinny briefings: one Shelf Showdown, one Seasonals hub. */
const evergreenSlides: GateSlide[] = [
  ...(featuredComparison
    ? [
        {
          key: `compare-${featuredComparison.slug}`,
          tag: featuredComparison.saContext,
          title: featuredComparison.title,
          href: `/reviews/versus/${featuredComparison.slug}`,
          image: featuredComparison.thumbnail.url,
          imageAlt: featuredComparison.thumbnail.alt,
        },
      ]
    : []),
  {
    key: "seasonal-spring",
    tag: springReset.eyebrow,
    title: springReset.h1,
    href: "/seasonals/spring",
    image: springReset.heroImage.url,
    imageAlt: springReset.heroImage.alt,
  },
];

const LOADING_KEY = "skinlabs-preloader-shown";
const GATE_KEY = "skinlabs-gate-shown";
const LOADING_MS = 1600;
const LOADING_TIMEOUT_MS = 1800;

const trustMarkers = [
  { icon: Star, label: `${productReviews.length}+ SA products reviewed` },
  { icon: Newspaper, label: "Daily skin science briefings" },
  { icon: ShieldCheck, label: "Editorially independent" },
];

const UNLOCK_ANIMATION_MS = 650;

const BOT_UA_PATTERN =
  /bot|crawl|spider|slurp|googlebot|bingbot|yandex|baiduspider|duckduckbot|facebookexternalhit|facebot|twitterbot|linkedinbot|whatsapp|telegrambot|discordbot|pinterest|applebot|semrushbot|ahrefsbot|mj12bot|lighthouse|headlesschrome|prerender/i;

/**
 * True only for a same-session, cross-site arrival on the homepage — i.e. someone
 * clicking in from Google, social, another site, etc. Direct navigation (empty
 * referrer, which is also how every search-engine crawler and our own
 * prerender step fetch the page) and in-site navigation never qualify, so the
 * gate can never be the thing a crawler sees or indexes.
 */
const isExternalArrival = (): boolean => {
  if (typeof document === "undefined" || typeof navigator === "undefined") return false;
  if (BOT_UA_PATTERN.test(navigator.userAgent)) return false;
  if (navigator.webdriver) return false;
  if (!document.referrer) return false;
  try {
    return new URL(document.referrer).origin !== window.location.origin;
  } catch {
    return false;
  }
};

const Preloader = () => {
  const { user, loading: authLoading } = useAuth();
  const { articles } = useNewsArticles(3);
  const autoplay = Autoplay({ delay: 3000, stopOnInteraction: true });
  const navigate = useNavigate();
  const location = useLocation();
  const isHome = location.pathname === "/";
  const shouldReduceMotion = useReducedMotion();
  const [isUnlocking, setIsUnlocking] = useState(false);
  const [externalArrival] = useState(isExternalArrival);

  const gateSlides: GateSlide[] = [
    ...articles.map((article) => ({
      key: article.id,
      tag: article.sa_context_tag,
      title: article.title,
      href: `/briefings/${article.slug}`,
      image: article.cover_image_url,
      imageAlt: article.cover_image_alt || article.title,
    })),
    ...evergreenSlides,
  ];

  const [showLoading, setShowLoading] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(LOADING_KEY) !== "1";
  });
  const [loadingDone, setLoadingDone] = useState(() => sessionStorage.getItem(LOADING_KEY) === "1");
  const [progress, setProgress] = useState(0);
  const [gateVisible, setGateVisible] = useState(false);
  const [gateDismissed, setGateDismissed] = useState(() => {
    if (typeof window === "undefined") return true;
    return sessionStorage.getItem(GATE_KEY) === "1";
  });

  useEffect(() => {
    if (!showLoading) return;
    const started = Date.now();
    const interval = window.setInterval(() => {
      setProgress(Math.min(100, Math.round(((Date.now() - started) / LOADING_MS) * 100)));
    }, 60);
    const timeout = window.setTimeout(() => {
      sessionStorage.setItem(LOADING_KEY, "1");
      setShowLoading(false);
      setLoadingDone(true);
    }, LOADING_TIMEOUT_MS);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [showLoading]);

  useEffect(() => {
    if (!loadingDone || authLoading || gateDismissed) return;
    if (!isHome || !externalArrival) return;
    if (!user) setGateVisible(true);
  }, [loadingDone, authLoading, gateDismissed, user, isHome, externalArrival]);

  useEffect(() => {
    if (user && gateVisible) {
      sessionStorage.setItem(GATE_KEY, "1");
      setGateDismissed(true);
      setGateVisible(false);
    }
  }, [user, gateVisible]);

  // Let other first-visit UI (e.g. the cookie consent banner) know it's clear to
  // appear: either this gate has just been dismissed / was already shown before,
  // the visitor is signed in, or the gate simply doesn't apply to this visit
  // (not the homepage, or not a cross-site arrival) so it will never show.
  useEffect(() => {
    if (gateDismissed) {
      markEntryGateResolved();
      return;
    }
    if (loadingDone && !authLoading && (user || !isHome || !externalArrival)) {
      markEntryGateResolved();
    }
  }, [gateDismissed, loadingDone, authLoading, user, isHome, externalArrival]);

  const dismissGate = () => {
    sessionStorage.setItem(GATE_KEY, "1");
    setGateDismissed(true);
    setGateVisible(false);
  };

  const handleUnlockClick = () => {
    if (isUnlocking) return;
    if (shouldReduceMotion) {
      dismissGate();
      navigate("/pricing");
      return;
    }
    setIsUnlocking(true);
    window.setTimeout(() => {
      dismissGate();
      navigate("/pricing");
    }, UNLOCK_ANIMATION_MS);
  };

  return (
    <>
      <AnimatePresence>
        {showLoading && (
          <motion.div
            key="loading"
            className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: "easeInOut" }}
          >
            <motion.img
              src={logo}
              alt="SkinLabs"
              style={{ width: 250, height: "auto" }}
              className="dark:invert"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            />
            <p className="mt-3 text-xs uppercase tracking-[0.35em] text-muted-foreground">
              Skin intelligence, locally grounded
            </p>
            <div className="mt-8 h-px w-48 overflow-hidden bg-border">
              <motion.div
                className="h-full bg-foreground"
                initial={{ width: "0%" }}
                animate={{ width: `${progress}%` }}
                transition={{ ease: "linear", duration: 0.1 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {gateVisible && (
          <motion.div
            key="gate"
            className="fixed inset-0 z-[100] overflow-y-auto bg-background"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.4, ease: "easeInOut" }}
            // Belt-and-braces: this only ever mounts for a real, cross-site human
            // arrival (see isExternalArrival above), never for a crawler or our own
            // prerender pass — data-nosnippet keeps its copy out of search snippets
            // even so, without affecting the real homepage content sitting behind it.
            data-nosnippet=""
          >
            <div className="border-b border-border bg-background/95 py-3 text-center backdrop-blur">
              <button
                onClick={dismissGate}
                className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
              >
                Proceed to SkinLabs Homepage →
              </button>
            </div>

            <div className="mx-auto max-w-lg px-6 py-14 text-center">
              <img
                src={logo}
                alt="SkinLabs"
                style={{ width: 160, height: "auto" }}
                className="mx-auto mb-8 dark:invert"
              />
              <h1 className="font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl">
                Uncover the whole story behind your skincare.
              </h1>
              <p className="mt-4 text-muted-foreground">
                Independent SA product reviews, daily skin science briefings and AI routines built for local climate
                and skin — get unlimited access with a SkinLabs membership.
              </p>

              <Button
                size="lg"
                className="relative mt-6 gap-2 overflow-hidden"
                onClick={handleUnlockClick}
                disabled={isUnlocking}
                aria-busy={isUnlocking}
              >
                <AnimatePresence mode="wait" initial={false}>
                  {isUnlocking ? (
                    <motion.span
                      key="unlocking"
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <motion.span
                        className="flex"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 0.7, repeat: Infinity, ease: "linear" }}
                      >
                        <Sparkles className="h-4 w-4" />
                      </motion.span>
                      Unlocking...
                    </motion.span>
                  ) : (
                    <motion.span
                      key="idle"
                      className="flex items-center gap-2"
                      initial={{ opacity: 0, y: -4 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 4 }}
                      transition={{ duration: 0.2 }}
                    >
                      <Lock className="h-4 w-4" />
                      Unlock Premium Skincare Intelligence
                    </motion.span>
                  )}
                </AnimatePresence>
                {isUnlocking && (
                  <motion.span
                    aria-hidden="true"
                    className="pointer-events-none absolute inset-0 bg-gradient-to-r from-transparent via-background/25 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "100%" }}
                    transition={{ duration: 0.6, ease: "easeInOut" }}
                  />
                )}
              </Button>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                {trustMarkers.map((marker) => (
                  <span key={marker.label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <marker.icon className="h-3.5 w-3.5 text-primary" />
                    {marker.label}
                  </span>
                ))}
              </div>

              {gateSlides.length > 0 && (
                <Carousel
                  className="mt-10 w-full max-w-xl mx-auto"
                  opts={{
                    align: "start",
                    loop: true,
                  }}
                  plugins={[autoplay]}
                >
                  <CarouselContent className="-ml-2 md:-ml-4">
                    {gateSlides.map((slide) => (
                      <CarouselItem key={slide.key} className="pl-2 md:pl-4 basis-full md:basis-1/2 lg:basis-1/3">
                        <Link
                          to={slide.href}
                          onClick={dismissGate}
                          className="gradient-border-anim flex h-full flex-col items-center overflow-hidden rounded-2xl border border-transparent bg-card text-center"
                        >
                          {slide.image && (
                            <div className="aspect-[16/10] w-full overflow-hidden">
                              <img
                                src={slide.image}
                                alt={slide.imageAlt}
                                loading="lazy"
                                className="h-full w-full object-cover"
                              />
                            </div>
                          )}
                          <div className="flex flex-1 flex-col items-center p-4">
                            <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-foreground">
                              {slide.tag}
                            </span>
                            <p className="line-clamp-3 text-base font-bold text-foreground">{slide.title}</p>
                            <span className="mt-3 inline-flex items-center justify-center gap-1 text-xs text-primary">
                              Read more <ArrowRight className="h-3 w-3" />
                            </span>
                          </div>
                        </Link>
                      </CarouselItem>
                    ))}
                  </CarouselContent>
                </Carousel>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Preloader;
