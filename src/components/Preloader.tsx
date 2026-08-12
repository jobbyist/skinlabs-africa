import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const SESSION_KEY = "skinlabs-preloader-shown";

const Preloader = () => {
  const [visible, setVisible] = useState(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem(SESSION_KEY) !== "1";
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!visible) return;
    const started = Date.now();
    const interval = window.setInterval(() => {
      const elapsed = Date.now() - started;
      setProgress(Math.min(100, Math.round((elapsed / 1600) * 100)));
    }, 60);
    const timeout = window.setTimeout(() => {
      sessionStorage.setItem(SESSION_KEY, "1");
      setVisible(false);
    }, 1800);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(timeout);
    };
  }, [visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-background"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
        >
          <motion.svg
            viewBox="0 0 320 60"
            className="w-56 md:w-72 text-foreground"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <motion.text
              x="160"
              y="42"
              textAnchor="middle"
              fill="none"
              stroke="currentColor"
              strokeWidth="0.8"
              className="font-heading"
              style={{ fontSize: 40, letterSpacing: 6, fontWeight: 800 }}
              initial={{ pathLength: 0, fillOpacity: 0 }}
              animate={{ pathLength: 1, fillOpacity: 1 }}
              transition={{ pathLength: { duration: 1.2, ease: "easeInOut" }, fillOpacity: { delay: 1, duration: 0.5 } }}
            >
              SKINLABS
            </motion.text>
          </motion.svg>

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
  );
};

export default Preloader;
