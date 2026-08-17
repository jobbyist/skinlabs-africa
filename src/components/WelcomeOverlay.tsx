import { useState, useEffect } from "react";
import { X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AnimatePresence, motion } from "framer-motion";

const WELCOME_SHOWN_KEY = "skinlabs-welcome-shown";
const PRELOADER_SESSION_KEY = "skinlabs-preloader-shown";

const WelcomeOverlay = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Only run on client
    if (typeof window === "undefined") return;

    // Check if user has seen welcome overlay before
    const welcomeShown = localStorage.getItem(WELCOME_SHOWN_KEY);
    if (welcomeShown) return;

    // Wait for preloader to finish before showing
    const checkPreloader = () => {
      const preloaderShown = sessionStorage.getItem(PRELOADER_SESSION_KEY);
      
      if (preloaderShown === "1") {
        // Preloader has finished, show welcome overlay after a short delay
        setTimeout(() => {
          setIsVisible(true);
        }, 500);
      } else {
        // Preloader not finished yet, check again
        setTimeout(checkPreloader, 100);
      }
    };

    checkPreloader();
  }, []);

  const handleClose = () => {
    setIsVisible(false);
    localStorage.setItem(WELCOME_SHOWN_KEY, "1");
  };

  const handleGetStarted = () => {
    handleClose();
    // Navigate to get started page or scroll to content
    window.scrollTo({ top: window.innerHeight, behavior: "smooth" });
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3 }}
          className="fixed inset-0 z-[90] flex items-center justify-center bg-background/80 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0, y: 20 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
            onClick={(e) => e.stopPropagation()}
            className="relative mx-4 max-w-lg rounded-3xl border border-border bg-card p-8 shadow-2xl"
          >
            <button
              onClick={handleClose}
              className="absolute right-4 top-4 text-muted-foreground hover:text-foreground transition-colors"
              aria-label="Close welcome message"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex flex-col items-center text-center">
              <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                <Sparkles className="h-8 w-8 text-primary" />
              </div>

              <h2 className="font-heading text-2xl font-bold text-foreground mb-3">
                Welcome to SkinLabs®
              </h2>
              
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Discover AI-powered skincare routines, daily skin science briefings, independent local product reviews, and expert virtual consultations—all tailored for South African skin.
              </p>

              <Button onClick={handleGetStarted} size="lg" className="w-full">
                Get Started
              </Button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default WelcomeOverlay;
