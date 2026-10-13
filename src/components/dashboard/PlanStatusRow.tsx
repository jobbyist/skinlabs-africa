import { Link } from "react-router-dom";
import { Crown } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatUnlockDate } from "@/lib/formulator/limits";
import type { FormulatorAllowanceStatus } from "@/hooks/use-formulator-allowance";
import type { ContextFacts } from "@/lib/context";
import { analysisPassCount, BASIC_NAME } from "@/lib/skynn/terminology";

interface PlanStatusRowProps {
  facts: ContextFacts;
  tierLabel: string;
  allowance: FormulatorAllowanceStatus | null;
}

/**
 * One quiet line of plan information, shown only when there is something worth
 * saying: a Basic analysis that's used up this week, Analysis Passes in hand, or a
 * trial. Replaces three always-on cards (allowance, plan, passes); full detail is in
 * Settings › Billing, and "Keep my membership" lives in the trial banner above.
 */
const PlanStatusRow = ({ facts, tierLabel, allowance }: PlanStatusRowProps) => {
  const parts: string[] = [];
  if (allowance?.locked) {
    parts.push(
      allowance.nextUnlockAt
        ? `Your next ${BASIC_NAME} unlocks on ${formatUnlockDate(allowance.nextUnlockAt)}`
        : `Your next ${BASIC_NAME} unlocks soon`,
    );
  }
  if (facts.analysisPasses > 0) parts.push(`${analysisPassCount(facts.analysisPasses)} ready`);
  if (facts.journey.isTrialing && facts.trialDaysLeft !== null) {
    parts.push(`${tierLabel} trial: ${facts.trialDaysLeft} day${facts.trialDaysLeft === 1 ? "" : "s"} left`);
  }
  if (parts.length === 0) return null;

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between sm:p-5">
        <p className="flex min-w-0 items-start gap-2 text-sm text-secondary-text">
          <Crown className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
          <span className="min-w-0 break-words">{parts.join(" · ")}</span>
        </p>
        <Link to="/dashboard?tab=billing" className="shrink-0 text-sm font-medium underline-offset-4 hover:underline">
          Billing
        </Link>
      </CardContent>
    </Card>
  );
};

export default PlanStatusRow;
