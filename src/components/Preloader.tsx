import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Newspaper, ShieldCheck, Sparkles, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import AuthDialog from "@/components/AuthDialog";
import { useAuth } from "@/hooks/use-auth";
import { useNewsArticles } from "@/hooks/use-news-articles";
import { productReviews } from "@/data/reviews";
import logo from "@/assets/newskinlabs.png";

const LOADING_KEY = "skinlabs-preloader-shown";
const GATE_KEY = "skinlabs-gate-shown";
const LOADING_MS = 1600;
const LOADING_TIMEOUT_MS = 1800;

const trustMarkers = [
  { icon: Star, label: `${productReviews.length}+ SA products reviewed` },
  { icon: Newspaper, label: "Daily skin science briefings" },
  { icon: ShieldCheck, label: "Editorially independent" },
];

const Preloader = () => {
  const { user, loading: authLoading } = useAuth();
  const { articles } = useNewsArticles(3);

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
  const [authOpen, setAuthOpen] = useState(false);

  // Brand loading animation — shown once per browser session.
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

  // Once loading has finished and auth has resolved, decide whether to show the
  // dismissible welcome gate — signed-out visitors only, once per session.
  useEffect(() => {
    if (!loadingDone || authLoading || gateDismissed) return;
    if (!user) setGateVisible(true);
  }, [loadingDone, authLoading, gateDismissed, user]);

  // If the visitor signs in while the gate is showing, drop it immediately.
  useEffect(() => {
    if (user && gateVisible) {
      sessionStorage.setItem(GATE_KEY, "1");
      setGateDismissed(true);
      setGateVisible(false);
    }
  }, [user, gateVisible]);

  const dismissGate = () => {
    sessionStorage.setItem(GATE_KEY, "1");
    setGateDismissed(true);
    setGateVisible(false);
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

              <Button size="lg" className="mt-6 gap-2" onClick={() => setAuthOpen(true)}>
                <Sparkles className="h-4 w-4" />
                Unlock Premium Skincare Intelligence
              </Button>

              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                {trustMarkers.map((marker) => (
                  <span key={marker.label} className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                    <marker.icon className="h-3.5 w-3.5 text-primary" />
                    {marker.label}
                  </span>
                ))}
              </div>

              {articles.length > 0 && (
                <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
                  {articles.map((article) => (
                    <Link
                      key={article.id}
                      to={`/newsroom/${article.slug}`}
                      onClick={dismissGate}
                      className="flex flex-col rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary"
                    >
                      <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[10px] font-semibold text-foreground">
                        {article.sa_context_tag}
                      </span>
                      <p className="line-clamp-3 text-sm font-medium text-foreground">{article.title}</p>
                      <span className="mt-3 inline-flex items-center gap-1 text-xs text-primary">
                        Read briefing <ArrowRight className="h-3 w-3" />
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AuthDialog open={authOpen} onOpenChange={setAuthOpen} defaultTab="signup" onAuthenticated={dismissGate} />
    </>
  );
};

export default Preloader;
