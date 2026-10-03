import { ArrowRight, CalendarClock, Clock, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADVANCED_NAME, ANALYSIS_PASS, SKYNN_RELEASE_LABEL } from "@/lib/skynn/terminology";
import { INTAKE_EXPECTED_DELIVERY, type AdvancedReportMode } from "@/lib/assessment/types";
import AdvancedIntroIllustration from "./AdvancedIntroIllustration";

const SaFlag = () => (
  <svg viewBox="0 0 24 16" className="h-3.5 w-5 shrink-0 rounded-[2px]" aria-hidden="true">
    <rect width="24" height="16" fill="#fff" />
    <rect width="24" height="5.33" fill="#e03c31" />
    <rect y="10.67" width="24" height="5.33" fill="#001489" />
    <path d="M0 0l10 8-10 8z" fill="#ffb81c" />
    <path d="M0 2.2L7.2 8 0 13.8z" fill="#000" />
    <path d="M0 0h3.5l10 8h10.5M0 16h3.5l10-8" fill="none" stroke="#007749" strokeWidth="3" />
  </svg>
);

interface AdvancedIntroProps {
  passesAvailable: number;
  reportMode: AdvancedReportMode;
  onStart: () => void;
}

/** Intro screen: one message, one action, kept above a sticky CTA on phones. */
const AdvancedIntro = ({ passesAvailable, reportMode, onStart }: AdvancedIntroProps) => (
  <div className="mx-auto max-w-xl pb-40 text-center md:pb-0">
    <div className="relative mx-auto mb-4 w-full max-w-[17rem] sm:mb-6 sm:max-w-sm">
      <div className="gradient-bg-soft absolute inset-6 rounded-full opacity-40 blur-3xl" aria-hidden="true" />
      <AdvancedIntroIllustration className="relative w-full text-foreground" />
    </div>

    <p className="mx-auto inline-flex items-center gap-2.5 rounded-full border border-blue-500/30 bg-blue-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-foreground">
      <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
        <span className="absolute inline-flex h-full w-full rounded-full bg-blue-500 opacity-60 motion-safe:animate-ping" />
        <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-blue-600" />
      </span>
      {SKYNN_RELEASE_LABEL}
    </p>

    <h1 className="mt-5 text-balance font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">{ADVANCED_NAME}</h1>

    <p className="mx-auto mt-4 max-w-md text-pretty text-muted-foreground">
      A deeper, evidence-referenced look at your skin: how it behaves, your breakouts, sun and pigment concerns, and how it affects your
      day — with guidance tailored to your skin tone and South African conditions.
    </p>

    <ul className="mt-6 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
      <li className="flex items-center gap-1.5">
        <Clock className="h-4 w-4 text-amber-500" aria-hidden="true" />
        ~15 min
      </li>
      <li className="flex items-center gap-1.5">
        <ShieldCheck className="h-4 w-4 text-emerald-600" aria-hidden="true" />
        Reviewed by our team
      </li>
      <li className="flex items-center gap-1.5">
        <SaFlag />
        Built for SA
      </li>
    </ul>

    {reportMode === "fallback" && (
      <p className="mx-auto mt-6 flex max-w-md gap-2 rounded-2xl border border-border bg-muted/40 p-3 text-left text-sm">
        <CalendarClock className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
        <span>
          We&apos;re finishing the upgraded SKYNN AI review system and its clinical approval. Requests made now are securely queued and your
          report is expected in {INTAKE_EXPECTED_DELIVERY} — you won&apos;t need to answer the questions again.
        </span>
      </p>
    )}

    <p className="mx-auto mt-6 max-w-md text-xs text-muted-foreground">
      Cosmetic guidance, not a medical diagnosis. Your answers are saved as you go.
    </p>

    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur md:static md:mx-auto md:mt-8 md:max-w-md md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
      <Button
        size="lg"
        onClick={onStart}
        className="h-14 w-full gap-2 rounded-full bg-gradient-to-r from-blue-600 to-sky-500 text-lg font-semibold text-white shadow-lg shadow-blue-500/25 hover:from-blue-600 hover:to-sky-400"
      >
        Start my assessment
        <ArrowRight className="h-5 w-5" aria-hidden="true" />
      </Button>
      <p className="mt-2.5 text-center text-xs text-muted-foreground">
        Takes about 15 minutes. Uses 1 of your {passesAvailable} {ANALYSIS_PASS}
        {passesAvailable === 1 ? "" : "es"} when you submit — refunded if we can&apos;t release your report
        {reportMode === "fallback" ? " or you withdraw your request" : ""}.
      </p>
    </div>
  </div>
);

export default AdvancedIntro;
