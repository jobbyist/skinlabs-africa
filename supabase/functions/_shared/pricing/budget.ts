// Keeps the price sync inside Firecrawl's limits. The free plan is a small, ONE-TIME credit
// allowance (not monthly), so the sync must never run it down: it reads the account's real
// remaining credits before every run, keeps a reserve for the other pipelines that share the
// account, and also honours a small daily cap.

/** Credits kept untouched for the other Firecrawl users (briefings, reviews) and for headroom. */
export const DEFAULT_CREDIT_RESERVE = 150;
/** Default daily ceiling for this pipeline (search = 2 credits, page read = 1). */
export const DEFAULT_DAILY_CREDIT_BUDGET = 30;

export interface CreditBudgetInput {
  dailyBudget: number;
  usedToday: number;
  /** Credits the Firecrawl account reports as remaining; null when it could not be read. */
  remainingAccountCredits: number | null;
  reserve?: number;
}

export interface CreditAllowance {
  /** Credits this run may spend (0 = do not call Firecrawl). */
  credits: number;
  limitedBy: "daily_budget" | "account_reserve" | "account_unknown" | "none";
}

/**
 * Fails closed: if the account balance is unknown the run does nothing (a missed run is cheap,
 * an exhausted free allowance is not).
 */
export function creditAllowance(input: CreditBudgetInput): CreditAllowance {
  const reserve = input.reserve ?? DEFAULT_CREDIT_RESERVE;
  if (input.remainingAccountCredits === null || !Number.isFinite(input.remainingAccountCredits)) {
    return { credits: 0, limitedBy: "account_unknown" };
  }
  const daily = Math.max(0, Math.floor(input.dailyBudget - input.usedToday));
  const account = Math.max(0, Math.floor(input.remainingAccountCredits - reserve));
  if (account <= 0) return { credits: 0, limitedBy: "account_reserve" };
  if (daily <= 0) return { credits: 0, limitedBy: "daily_budget" };
  return account < daily ? { credits: account, limitedBy: "account_reserve" } : { credits: daily, limitedBy: "none" };
}
