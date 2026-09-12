import { Button, type ButtonProps } from "@/components/ui/button";
import { BA_APPLICATIONS_OPEN, type ApplicationWindowStatus } from "@/data/brandAmbassador";

interface ApplyCTAButtonProps extends Omit<ButtonProps, "onClick" | "disabled"> {
  status: ApplicationWindowStatus;
  onApply: () => void;
  /** Label shown while applications are open. Defaults to "Apply Now". */
  openLabel?: string;
}

/**
 * The single "Apply Now" CTA used across the landing page, aware of the
 * advertised application window so it never invites a click it can't honour
 * — outside the window it shows why, and doesn't open the application flow.
 */
const ApplyCTAButton = ({ status, onApply, openLabel = "Apply Now", ...buttonProps }: ApplyCTAButtonProps) => {
  if (status === "before") {
    return (
      <Button {...buttonProps} disabled aria-disabled="true">
        Applications open {BA_APPLICATIONS_OPEN}
      </Button>
    );
  }

  if (status === "after") {
    return (
      <Button {...buttonProps} disabled aria-disabled="true">
        Applications closed
      </Button>
    );
  }

  return (
    <Button {...buttonProps} onClick={onApply}>
      {openLabel}
    </Button>
  );
};

export default ApplyCTAButton;
