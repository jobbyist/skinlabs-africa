import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, PartyPopper, Sparkles, Star } from "lucide-react";

interface TrialWelcomeModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  planName: string;
  trialEndsAt: string | null;
}

const stops = [
  {
    to: "/ai-formulator",
    icon: Sparkles,
    title: "Build your custom AI routine",
    description: "A full routine re-analysed weekly, not just a basic result",
  },
  {
    to: "/reviews",
    icon: Star,
    title: "Read full product breakdowns",
    description: "Ingredient deep-dives and retailer comparisons, unlocked",
  },
  {
    to: "/podcast",
    icon: Mic,
    title: "Listen to the full podcast library",
    description: "No more 2-minute previews",
  },
];

const TrialWelcomeModal = ({ open, onOpenChange, planName, trialEndsAt }: TrialWelcomeModalProps) => {
  const endsLabel = trialEndsAt
    ? new Date(trialEndsAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long" })
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader className="text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <PartyPopper className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="font-heading text-2xl">Your {planName} trial is live</DialogTitle>
          <DialogDescription className="text-base">
            {endsLabel
              ? `Full access until ${endsLabel} — no card on file, no surprise charge.`
              : "Full access for 7 days — no card on file, no surprise charge."}
          </DialogDescription>
        </DialogHeader>

        <div className="my-4 space-y-3">
          {stops.map((stop) => (
            <Link
              key={stop.to}
              to={stop.to}
              onClick={() => onOpenChange(false)}
              className="flex items-center gap-3 rounded-2xl border border-border p-4 transition-colors hover:border-primary"
            >
              <stop.icon className="h-5 w-5 shrink-0 text-primary" />
              <div>
                <p className="font-medium text-foreground">{stop.title}</p>
                <p className="text-xs text-muted-foreground">{stop.description}</p>
              </div>
            </Link>
          ))}
        </div>

        <Button className="w-full" onClick={() => onOpenChange(false)}>
          Start exploring
        </Button>
      </DialogContent>
    </Dialog>
  );
};

export default TrialWelcomeModal;
