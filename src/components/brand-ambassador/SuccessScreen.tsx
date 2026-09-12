import { useEffect, useRef } from "react";
import { CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { BA_APPLICATIONS_CLOSE, BA_PROGRAMME_START } from "@/data/brandAmbassador";

interface SuccessScreenProps {
  onClose: () => void;
}

const SuccessScreen = ({ onClose }: SuccessScreenProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div role="status" className="flex flex-col items-center px-6 py-10 text-center">
      <CheckCircle2 className="h-14 w-14 text-primary" aria-hidden="true" />
      <h3 ref={headingRef} tabIndex={-1} className="mt-4 font-heading text-xl font-bold text-foreground outline-none">
        APPLICATION RECEIVED.
      </h3>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        Thanks for applying to become a SkinLabs® Brand Ambassador. Our team will review your application and
        contact selected creators after the application period.
      </p>
      <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted-foreground">
        Applications close {BA_APPLICATIONS_CLOSE} · Programme starts {BA_PROGRAMME_START}
      </p>
      <Button onClick={onClose} size="lg" className="mt-6">
        Close
      </Button>
    </div>
  );
};

export default SuccessScreen;
