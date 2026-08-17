import { useState, useEffect } from "react";
import { Sparkles, Newspaper, Users, Mic } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ANNOUNCEMENT_KEY = "skinlabs_pivot_announcement_seen";
const SHOW_DELAY_MS = 30000;

const PILLARS = [
  { icon: Newspaper, label: "Daily skin science briefings" },
  { icon: Sparkles, label: "AI-powered personalized routines" },
  { icon: Users, label: "Honest, independent product reviews" },
  { icon: Mic, label: "The Skin Deep Podcast" },
];

const PivotAnnouncementModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const hasSeenAnnouncement = localStorage.getItem(ANNOUNCEMENT_KEY);
    if (!hasSeenAnnouncement) {
      const timer = setTimeout(() => setIsOpen(true), SHOW_DELAY_MS);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    localStorage.setItem(ANNOUNCEMENT_KEY, "true");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="overflow-hidden p-0 sm:max-w-lg">
        {/* Header banner */}
        <div className="relative bg-gradient-to-br from-primary via-primary to-primary/80 px-6 pb-8 pt-7 text-primary-foreground">
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-primary-foreground/10 blur-3xl"
          />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/15 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide">
              <Sparkles className="h-3 w-3" />
              New Chapter
            </span>
            <DialogHeader className="mt-3 text-left">
              <DialogTitle className="font-heading text-2xl font-bold leading-tight text-primary-foreground">
                SkinLabs® is Evolving
              </DialogTitle>
            </DialogHeader>
            <p className="mt-2 text-sm leading-relaxed text-primary-foreground/80">
              We've pivoted from an AI-powered e-commerce platform to a content and
              community-first ecosystem — built specifically for South African skin
              and climate.
            </p>
          </div>
        </div>

        {/* Body */}
        <div className="space-y-5 px-6 py-6">
          <div className="grid grid-cols-2 gap-3">
            {PILLARS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-start gap-2.5 rounded-xl border border-border bg-secondary/30 p-3"
              >
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                  <Icon className="h-4 w-4 text-primary" />
                </span>
                <span className="text-xs font-medium leading-snug text-card-foreground">
                  {label}
                </span>
              </div>
            ))}
          </div>

          <div className="flex flex-col gap-2.5 pt-1 sm:flex-row">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Got it, thanks
            </Button>
            <Button asChild className="flex-1 gap-1.5" onClick={handleClose}>
              <a href="/about">
                Read our story
                <Sparkles className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PivotAnnouncementModal;
