import type { ReactNode } from "react";
import { ChevronLeft } from "lucide-react";
import { useTheme } from "next-themes";
import skinlabsLogoBlack from "@/assets/skinlabs-logo-black.svg";
import skinlabsLogoWhite from "@/assets/skinlabs-logo-white.svg";

interface QuestionShellProps {
  /** 1-based position among the questions that currently apply. */
  position: number;
  total: number;
  sectionTitle?: string;
  onBack?: () => void;
  backLabel?: string;
  saving?: boolean;
  /** Changes on each question so the body re-runs its entrance animation. */
  stepKey: string;
  children: ReactNode;
  footer: ReactNode;
}

/**
 * Chrome for one question of the Advanced AI Dermatology Analysis: a compact
 * sticky bar (back, logo, progress), a "Question n of N" eyebrow, the body and
 * a footer that sits at the bottom of the screen on phones.
 */
const QuestionShell = ({ position, total, sectionTitle, onBack, backLabel = "Back", saving, stepKey, children, footer }: QuestionShellProps) => {
  const { resolvedTheme } = useTheme();
  const logo = resolvedTheme === "dark" ? skinlabsLogoWhite : skinlabsLogoBlack;
  const pct = total > 0 ? Math.round((position / total) * 100) : 0;

  return (
    <div className="mx-auto flex min-h-[calc(100dvh-1rem)] max-w-xl flex-col md:min-h-0">
      <div className="sticky top-0 z-30 -mx-4 flex items-center gap-3 border-b border-border bg-background/95 px-4 py-3 backdrop-blur md:static md:mx-0 md:rounded-2xl md:border">
        <button
          type="button"
          onClick={onBack}
          disabled={!onBack}
          aria-label={backLabel}
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full transition-colors hover:bg-muted active:scale-95 disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <img src={logo} alt="SkinLabs®" className="h-6 w-auto shrink-0" />
        <div
          role="progressbar"
          aria-label="Progress"
          aria-valuemin={0}
          aria-valuemax={total}
          aria-valuenow={position}
          aria-valuetext={`Question ${position} of ${total}`}
          className="ml-2 h-2 min-w-0 flex-1 overflow-hidden rounded-full bg-muted"
        >
          <div
            className="h-full rounded-full transition-[width] duration-300 ease-out"
            style={{ width: `${pct}%`, background: "linear-gradient(90deg, #2563eb, #0ea5e9)" }}
          />
        </div>
      </div>

      <div key={stepKey} className="flex-1 pt-8 animate-in fade-in slide-in-from-bottom-1 duration-200 motion-reduce:animate-none">
        <div className="mb-4 flex items-center gap-4">
          <span className="h-px w-10 bg-blue-600" aria-hidden="true" />
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-muted-foreground">
            Question {position} of {total}
            {sectionTitle && <span className="font-normal normal-case tracking-normal"> · {sectionTitle}</span>}
          </p>
        </div>
        {children}
      </div>

      <div className="sticky bottom-0 -mx-4 mt-8 border-t border-border bg-background/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <p className="mb-2 h-4 text-center text-xs text-muted-foreground" aria-live="polite">
          {saving ? "Saving…" : ""}
        </p>
        {footer}
      </div>
    </div>
  );
};

export default QuestionShell;
