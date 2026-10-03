import { ArrowRight, CalendarClock, ClipboardCheck, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ADVANCED_NAME, SKYNN_RELEASE_LABEL } from "@/lib/skynn/terminology";
import { INTAKE_EXPECTED_DELIVERY, type AdvancedReportMode } from "@/lib/assessment/types";
import AdvancedIntroIllustration from "./AdvancedIntroIllustration";

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

    <p className="gradient-border-anim mx-auto inline-flex items-center gap-2.5 rounded-full bg-background px-4 py-1.5 text-xs font-semibold tracking-[0.12em] text-foreground">
      <span className="relative flex h-2.5 w-2.5" aria-hidden="true">
        <span className="gradient-bg absolute inline-flex h-full w-full rounded-full opacity-60 motion-safe:animate-ping" />
        <span className="gradient-bg relative inline-flex h-2.5 w-2.5 rounded-full" />
      </span>
      {SKYNN_RELEASE_LABEL}
    </p>

    <h1 className="mt-5 text-balance font-heading text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl">{ADVANCED_NAME}</h1>

    <p className="mx-auto mt-4 max-w-md text-pretty text-muted-foreground">
      A deeper, evidence-referenced look at your skin: how it behaves, your breakouts, sun and pigment concerns, and how it affects your
      day — with guidance tailored to your skin tone and South African conditions.
    </p>

    <ul className="mx-auto mt-6 max-w-md space-y-1.5 text-left text-sm text-muted-foreground">
      <li className="flex gap-2"><ClipboardCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> About 15 minutes of questions, saved as you go</li>
      <li className="flex gap-2"><ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> Checked by the SkinLabs team before you see it</li>
      <li className="flex gap-2"><Sparkles className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" /> Cosmetic guidance — not a medical diagnosis</li>
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

    <div className="fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background/95 px-4 pb-[max(1rem,env(safe-area-inset-bottom))] pt-4 backdrop-blur md:static md:mx-auto md:mt-8 md:max-w-md md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
      <Button
        size="lg"
        onClick={onStart}
        className="h-14 w-full gap-2 rounded-full text-lg font-semibold gradient-bg text-white shadow-md transition-[filter,box-shadow] hover:brightness-110 hover:shadow-lg disabled:bg-none disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none disabled:opacity-100"
      >
        Start my assessment
        <ArrowRight className="h-5 w-5" aria-hidden="true" />
      </Button>
      <p className="mt-2.5 text-center text-xs text-muted-foreground">
        Uses 1 of your {passesAvailable} Analysis Pass{passesAvailable === 1 ? "" : "es"} when you submit · refunded if we can&apos;t release your report
        {reportMode === "fallback" ? " or you withdraw your request" : ""}
      </p>
    </div>
  </div>
);

export default AdvancedIntro;
