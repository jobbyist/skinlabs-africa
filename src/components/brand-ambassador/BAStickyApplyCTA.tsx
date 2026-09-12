import ApplyCTAButton from "./ApplyCTAButton";
import { BA_SPOTS, type ApplicationWindowStatus } from "@/data/brandAmbassador";

interface BAStickyApplyCTAProps {
  onApply: () => void;
  status: ApplicationWindowStatus;
}

/**
 * Mobile-only sticky CTA. FloatingBottomNav hides itself on this route (see
 * FloatingBottomNav.tsx), so this is the only bottom bar signed-in mobile
 * visitors see here.
 */
const BAStickyApplyCTA = ({ onApply, status }: BAStickyApplyCTAProps) => {
  return (
    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] backdrop-blur sm:hidden">
      <ApplyCTAButton status={status} onApply={onApply} size="lg" className="w-full" openLabel={`Apply Now — ${BA_SPOTS} spots`} />
    </div>
  );
};

export default BAStickyApplyCTA;
