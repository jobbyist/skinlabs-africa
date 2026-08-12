import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Lock, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";

interface GatedOverlayProps {
  locked: boolean;
  title?: string;
  message?: string;
  ctaLabel?: string;
  ctaHref?: string;
  onSignIn?: () => void;
  children: ReactNode;
}

/**
 * Wraps content and blurs it behind a membership prompt when `locked` is true.
 */
const GatedOverlay = ({
  locked,
  title = "Members only",
  message = "Upgrade to a SkinLabs membership to unlock this content.",
  ctaLabel = "View membership plans",
  ctaHref = "/pricing",
  onSignIn,
  children,
}: GatedOverlayProps) => {
  if (!locked) return <>{children}</>;

  return (
    <div className="relative overflow-hidden rounded-3xl">
      <div aria-hidden="true" className="pointer-events-none select-none blur-md">
        {children}
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.35 }}
        className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-background/70 px-6 text-center backdrop-blur-sm"
      >
        <span className="flex h-12 w-12 items-center justify-center rounded-full border border-border bg-card">
          <Lock className="h-5 w-5 text-foreground" />
        </span>
        <div className="space-y-1">
          <h3 className="font-heading text-xl font-bold text-foreground">{title}</h3>
          <p className="mx-auto max-w-sm text-sm text-muted-foreground">{message}</p>
        </div>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button asChild className="gap-2">
            <Link to={ctaHref}>
              <Sparkles className="h-4 w-4" />
              {ctaLabel}
            </Link>
          </Button>
          {onSignIn && (
            <Button variant="outline" onClick={onSignIn}>
              Sign in
            </Button>
          )}
        </div>
      </motion.div>
    </div>
  );
};

export default GatedOverlay;
