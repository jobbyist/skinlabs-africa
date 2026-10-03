import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { useNewsArticles } from "@/hooks/use-news-articles";
import { getSavedPosition } from "@/components/PodcastPlayer";
import { latestPublishedEpisode, publishedPodcastEpisodes } from "@/data/podcast";
import { loadCompletedState, loadDraftState } from "@/lib/starter-analysis/persistence";
import { useEngagementStore } from "@/stores/engagementStore";
import { resolveHeroCtas, type HeroCtaFacts } from "@/lib/heroCta";

const sastToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" });

/** Gathers the visitor's activity and resolves the hero CTAs (src/lib/heroCta.ts). */
export const useHeroCtas = () => {
  const { user } = useAuth();
  const { articles } = useNewsArticles(1);
  const viewed = useEngagementStore((s) => s.viewedArticleIds);
  const [local, setLocal] = useState({ draft: false, completed: false, podcast: null as HeroCtaFacts["podcastInProgress"] });
  const [savedAnalysis, setSavedAnalysis] = useState(false);

  // Browser-only signals, read after mount so prerendered HTML stays stable.
  useEffect(() => {
    let podcast: HeroCtaFacts["podcastInProgress"] = null;
    for (const ep of [...publishedPodcastEpisodes].sort((a, b) => b.id - a.id)) {
      const pos = getSavedPosition(ep.slug);
      const total = ep.durationSeconds ?? 0;
      if (pos && pos > 15 && (!total || pos < total - 10)) {
        podcast = { slug: ep.slug, title: ep.title };
        break;
      }
    }
    setLocal({ draft: Boolean(loadDraftState()), completed: Boolean(loadCompletedState()), podcast });
  }, []);

  useEffect(() => {
    if (!user) {
      setSavedAnalysis(false);
      return;
    }
    let cancelled = false;
    void supabase
      .from("skincare_recommendations")
      .select("id", { count: "exact", head: true })
      .eq("user_id", user.id)
      .eq("status", "delivered")
      .then(({ count }) => {
        if (!cancelled) setSavedAnalysis((count ?? 0) > 0);
      });
    return () => {
      cancelled = true;
    };
  }, [user]);

  return useMemo(() => {
    const a = articles[0];
    return resolveHeroCtas({
      analysisDraft: local.draft,
      hasBasicAnalysis: local.completed || savedAnalysis,
      briefing: a ? { slug: a.slug, title: a.title, isToday: a.publish_date === sastToday() } : null,
      briefingStarted: Boolean(a && viewed.includes(a.id)),
      podcastInProgress: local.podcast,
      latestEpisode: latestPublishedEpisode ? { slug: latestPublishedEpisode.slug, title: latestPublishedEpisode.title } : null,
    });
  }, [articles, viewed, local, savedAnalysis]);
};
