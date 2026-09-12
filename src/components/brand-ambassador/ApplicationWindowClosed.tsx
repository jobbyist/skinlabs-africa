import { useEffect, useRef } from "react";
import { Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BA_APPLICATIONS_CLOSE,
  BA_APPLICATIONS_OPEN,
  type ApplicationWindowStatus,
} from "@/data/brandAmbassador";

interface ApplicationWindowClosedProps {
  status: Exclude<ApplicationWindowStatus, "open">;
  onClose: () => void;
}

/**
 * Shown in place of the application form whenever the modal is reached
 * outside the advertised application window (e.g. a direct link to
 * /brand-ambassadors/apply before it opens or after it closes) — the
 * authoritative guard against submissions outside the window, independent
 * of whether the landing page's own CTAs were disabled.
 */
const ApplicationWindowClosed = ({ status, onClose }: ApplicationWindowClosedProps) => {
  const headingRef = useRef<HTMLHeadingElement>(null);

  useEffect(() => {
    headingRef.current?.focus();
  }, []);

  return (
    <div role="status" className="flex flex-col items-center px-6 py-10 text-center">
      <Clock className="h-14 w-14 text-muted-foreground" aria-hidden="true" />
      <h3 ref={headingRef} tabIndex={-1} className="mt-4 font-heading text-xl font-bold text-foreground outline-none">
        {status === "before" ? "Applications aren't open yet." : "Applications are closed."}
      </h3>
      <p className="mt-3 max-w-md text-sm text-muted-foreground">
        {status === "before"
          ? `The SkinLabs® Brand Ambassador Programme opens for applications on ${BA_APPLICATIONS_OPEN}. Check back then to apply.`
          : `Applications closed on ${BA_APPLICATIONS_CLOSE}. Only 25 creators will be selected for the founding cohort, and our team will be in touch with applicants after review.`}
      </p>
      <Button onClick={onClose} size="lg" className="mt-6">
        Close
      </Button>
    </div>
  );
};

export default ApplicationWindowClosed;
