import { useMemo } from "react";
import { useContextualActions } from "@/hooks/use-contextual-actions";
import type { ResolvedAction } from "@/lib/context";

export interface HeroCta {
  id: string;
  label: string;
  href: string;
  /** Icon hint for secondary links. */
  icon: "podcast" | "article";
}

const DEFAULT_PRIMARY: HeroCta = { id: "start_basic", label: "Get Your Free Basic AI Skin Report", href: "/skynn-ai", icon: "article" };

const toHero = (a: ResolvedAction): HeroCta => ({
  id: a.id,
  label: a.label,
  // Sign-up style actions (save your results) are finished on the analysis page.
  href: a.href ?? "/skynn-ai",
  icon: a.id.includes("podcast") || a.id === "listen_latest" ? "podcast" : "article",
});

/**
 * The homepage hero's actions, chosen by the contextual engine (src/lib/context) for the
 * `home_hero` surface: a visitor is asked to take the analysis, a member is asked for what
 * is next for them (build the routine, check in, review their results…) and is never
 * told to start something they have finished. The default renders instantly, so the
 * prerendered hero never shifts.
 */
export const useHeroCtas = () => {
  const { primary, secondary, loading, click } = useContextualActions("home_hero", { secondaryLimit: 2, content: true });
  return useMemo(
    () => ({
      primary: !loading && primary ? toHero(primary) : DEFAULT_PRIMARY,
      secondary: loading ? [] : secondary.map(toHero),
      /** Records the click against the CTA ledger (fatigue + analytics). */
      onClick: (id: string) => {
        const a = [primary, ...secondary].find((x) => x?.id === id);
        if (a) click(a);
      },
    }),
    [primary, secondary, loading, click],
  );
};
