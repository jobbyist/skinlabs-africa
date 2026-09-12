import { Button } from "@/components/ui/button";
import { BA_SPOTS } from "@/data/brandAmbassador";

interface BAStickyApplyCTAProps {
  onApply: () => void;
}

/**
 * Mobile-only sticky CTA. Sits above FloatingBottomNav's own safe-area padding
 * and never overlaps the application modal, since it unmounts opening it.
 */
const BAStickyApplyCTA = ({ onApply }: BAStickyApplyCTAProps) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
      <Button size="lg" onClick={onApply} className="w-full">
        Apply Now — {BA_SPOTS} spots
      </Button>
    </div>
  );
};

export default BAStickyApplyCTA;
