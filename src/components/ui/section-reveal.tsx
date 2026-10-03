import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type SectionRevealProps = {
  children: ReactNode;
  className?: string;
};

/** CSS-only reveal primitive. Keeps motion lightweight and respects reduced-motion preferences. */
const SectionReveal = ({ children, className }: SectionRevealProps) => (
  <div className={cn("sl-reveal", className)}>{children}</div>
);

export default SectionReveal;
