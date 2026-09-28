import type { ReactNode } from "react";
import { useEntitlements } from "@/hooks/use-entitlements";
import { useAdBlockStatus } from "@/lib/adBlockDetection";
import {
  matchesAudience,
  resolveAdPolicy,
  shouldShowAd,
  type AdPolicy,
  type AdPriority,
  type AudienceRule,
  type ViewerFacts,
} from "@/lib/viewerContext";

/**
 * The single place UI asks "who is looking at this?": login state, plan,
 * trial state, ad policy and ad-blocker status in one object. Components
 * should read this (or `<ForViewer>`) instead of combining useAuth /
 * useMembership / ad-block checks themselves, so show/hide rules stay
 * consistent across the whole experience. Rules: src/lib/viewerContext.ts.
 */
export const useViewerContext = () => {
  const ent = useEntitlements();
  const adBlock = useAdBlockStatus();
  const facts: ViewerFacts = {
    loading: ent.loading,
    isSignedIn: !ent.isAnonymous,
    ladderTier: ent.ladderTier,
    isTrialing: ent.isTrialing,
    isFoundingMember: ent.isFoundingMember,
    adBlock,
  };
  const adPolicy: AdPolicy | null = ent.loading ? null : resolveAdPolicy(facts);
  return {
    ...facts,
    accountLabel: ent.accountLabel,
    isMember: ent.isMember,
    adPolicy,
    can: ent.can,
    /** `null` while still loading. */
    matches: (rule: AudienceRule) => matchesAudience(facts, rule),
    showAd: (priority: AdPriority = "secondary") => shouldShowAd(adPolicy, priority),
  };
};

/** Whether an ad unit of this priority should render for the current viewer. */
export const useShouldShowAd = (priority: AdPriority = "secondary") => {
  const { showAd } = useViewerContext();
  return showAd(priority);
};

interface ForViewerProps {
  when: AudienceRule;
  children: ReactNode;
  /** Rendered when the rule doesn't match (not while it is still loading). */
  otherwise?: ReactNode;
  /** Rendered while the facts the rule needs are loading. Defaults to nothing. */
  loading?: ReactNode;
}

/**
 * Declarative show/hide by audience, e.g.
 *   <ForViewer when={{ signedIn: false }}>Create a free account</ForViewer>
 *   <ForViewer when={{ belowTier: "insider" }}>Upgrade …</ForViewer>
 */
export const ForViewer = ({ when, children, otherwise = null, loading = null }: ForViewerProps) => {
  const { matches } = useViewerContext();
  const result = matches(when);
  if (result === null) return <>{loading}</>;
  return <>{result ? children : otherwise}</>;
};
