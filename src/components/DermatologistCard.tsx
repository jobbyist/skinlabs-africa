import { useState } from "react";
import { motion } from "framer-motion";
import {
  BadgeCheck,
  Building2,
  Calendar,
  MessageCircle,
  MapPin,
  Star,
  UserRound,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { Dermatologist } from "@/data/dermatologists";
import { cn } from "@/lib/utils";

interface DermatologistCardProps {
  dermatologist: Dermatologist;
  index?: number;
  canContact?: boolean;
}

const GradientBorderButton = ({
  children,
  onClick,
  className,
}: {
  children: React.ReactNode;
  onClick: () => void;
  className?: string;
}) => (
  <button
    type="button"
    onClick={onClick}
    className={cn(
      "gradient-border-anim relative flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium",
      "bg-white text-black dark:bg-white dark:text-black",
      "transition-all duration-300 border-0",
      className,
    )}
  >
    <span className="relative z-10 inline-flex items-center gap-1.5">{children}</span>
  </button>
);

const StarRating = ({ rating, count }: { rating: number; count: number }) => {
  const full = Math.floor(rating);
  const hasHalf = rating - full >= 0.4;
  return (
    <div className="mt-1.5 flex items-center gap-1.5">
      <div className="flex items-center gap-0.5" aria-label={`Rated ${rating} out of 5`}>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5",
              i < full
                ? "fill-amber-400 text-amber-400"
                : i === full && hasHalf
                  ? "fill-amber-400/50 text-amber-400"
                  : "text-muted-foreground/40",
            )}
          />
        ))}
      </div>
      <span className="text-xs font-medium text-foreground">{rating.toFixed(1)}</span>
      <span className="text-xs text-muted-foreground">({count})</span>
    </div>
  );
};

const DermatologistCard = ({ dermatologist, index = 0 }: DermatologistCardProps) => {
  const [comingSoonOpen, setComingSoonOpen] = useState(false);
  const [notifyEmail, setNotifyEmail] = useState("");
  const [notified, setNotified] = useState(false);

  const TypeIcon = dermatologist.practiceType === "practice" ? Building2 : UserRound;

  const openComingSoon = () => {
    setComingSoonOpen(true);
    setNotified(false);
    setNotifyEmail("");
  };

  const handleNotify = (e: React.FormEvent) => {
    e.preventDefault();
    if (!notifyEmail.trim()) return;
    setNotified(true);
  };

  return (
    <>
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.3, delay: Math.min(index, 4) * 0.06 }}
        className="flex flex-col gap-4 rounded-3xl border border-border bg-card p-5 sm:flex-row sm:items-center sm:justify-between md:p-6"
      >
        <div className="flex items-start gap-4 min-w-0">
          <span
            aria-hidden
            className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground ring-1 ring-border"
          >
            <TypeIcon className="h-6 w-6" />
          </span>

          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="font-heading text-base font-bold text-foreground md:text-lg">
                {dermatologist.name}
              </h2>
              {dermatologist.verified ? (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-emerald-600 dark:text-emerald-400">
                  <BadgeCheck className="h-3 w-3" /> Verified
                </span>
              ) : (
                <span className="inline-flex items-center rounded-full bg-muted px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                  Unclaimed listing
                </span>
              )}
              <span
                className={cn(
                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                  dermatologist.category === "Medical" &&
                    "bg-sky-500/10 text-sky-700 dark:text-sky-400",
                  dermatologist.category === "Cosmetic" &&
                    "bg-fuchsia-500/10 text-fuchsia-700 dark:text-fuchsia-400",
                  dermatologist.category === "Both" &&
                    "bg-violet-500/10 text-violet-700 dark:text-violet-400",
                )}
              >
                {dermatologist.category}
              </span>
            </div>
            <p className="mt-0.5 text-xs uppercase tracking-wide text-muted-foreground">
              {dermatologist.role}
            </p>

            <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <MapPin className="h-3.5 w-3.5 shrink-0" />
              {dermatologist.city}, {dermatologist.province}
            </p>

            <StarRating rating={dermatologist.rating} count={dermatologist.reviewCount} />
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:items-end">
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <GradientBorderButton onClick={openComingSoon}>
              <Calendar className="h-3.5 w-3.5" /> Book Now
            </GradientBorderButton>

            <Button
              size="sm"
              className="flex-1 gap-1.5 bg-black text-white hover:bg-black/90 dark:bg-black dark:text-white sm:flex-none"
              onClick={openComingSoon}
            >
              <MessageCircle className="h-3.5 w-3.5" /> Message
            </Button>
          </div>
        </div>
      </motion.div>

      <Dialog open={comingSoonOpen} onOpenChange={setComingSoonOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading text-xl text-center">
              Feature Coming Soon
            </DialogTitle>
            <DialogDescription className="text-center">
              Booking calendars, secure messaging and profile actions are launching with the live
              directory. Leave your email and we'll notify you the moment they go live.
            </DialogDescription>
          </DialogHeader>

          {notified ? (
            <div className="rounded-2xl bg-emerald-500/10 p-4 text-center text-sm text-emerald-700 dark:text-emerald-400">
              Thanks — you're on the list. We'll email you when this feature is ready.
            </div>
          ) : (
            <form onSubmit={handleNotify} className="space-y-3">
              <Input
                type="email"
                required
                placeholder="you@example.com"
                value={notifyEmail}
                onChange={(e) => setNotifyEmail(e.target.value)}
                aria-label="Email for feature notification"
              />
              <Button type="submit" className="w-full">
                Notify Me
              </Button>
            </form>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default DermatologistCard;
