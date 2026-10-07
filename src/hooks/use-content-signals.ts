import { useEffect, useMemo, useState } from "react";
import { useNewsArticles } from "@/hooks/use-news-articles";
import { getSavedPosition } from "@/components/PodcastPlayer";
import { loadCompletedState, loadDraftState } from "@/lib/starter-analysis/persistence";
import { useEngagementStore } from "@/stores/engagementStore";
import { recentReviewViewCount } from "@/lib/reviewActivity";

const sastToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "Africa/Johannesburg" });

export interface ContentSignals {
  analysisDraft: boolean;
  analysisCompletedLocally: boolean;
  briefing: { slug: string; title: string; isToday: boolean } | null;
  briefingStarted: boolean;
  podcastInProgress: { slug: string; title: string } | null;
  latestEpisode: { slug: string; title: string } | null;
  recentReviewViews: number;
}

/**
 * Browser-only content signals shared by the hero and the context engine:
 * what the visitor was in the middle of (draft analysis, briefing, episode).
 * Read after mount so prerendered HTML stays stable; the briefing query is
 * the same cached one the home feed already runs.
 */
export const useContentSignals = ({ enabled = true }: { enabled?: boolean } = {}): ContentSignals => {
  const { articles } = useNewsArticles(1, { enabled });
  const viewed = useEngagementStore((s) => s.viewedArticleIds);
  const [latest, setLatest] = useState<ContentSignals["latestEpisode"]>(null);
  const [local, setLocal] = useState({
    draft: false,
    completed: false,
    podcast: null as ContentSignals["podcastInProgress"],
    reviewViews: 0,
  });

  useEffect(() => {
    let active = true;
    setLocal((prev) => ({ ...prev, draft: Boolean(loadDraftState()), completed: Boolean(loadCompletedState()), reviewViews: recentReviewViewCount() }));
    // The episode catalogue is its own chunk, fetched right after the first render (not part of the entry script),
    // and only for surfaces that read these signals.
    if (!enabled) return () => { active = false; };
    void import("@/data/podcast").then(({ latestPublishedEpisode, publishedPodcastEpisodes }) => {
      if (!active) return;
      let podcast: ContentSignals["podcastInProgress"] = null;
      for (const ep of [...publishedPodcastEpisodes].sort((a, b) => b.id - a.id)) {
        const pos = getSavedPosition(ep.slug);
        const total = ep.durationSeconds ?? 0;
        if (pos && pos > 15 && (!total || pos < total - 10)) {
          podcast = { slug: ep.slug, title: ep.title };
          break;
        }
      }
      setLocal((prev) => ({ ...prev, podcast }));
      setLatest(latestPublishedEpisode ? { slug: latestPublishedEpisode.slug, title: latestPublishedEpisode.title } : null);
    });
    return () => {
      active = false;
    };
  }, [enabled]);

  return useMemo(() => {
    const a = articles[0];
    return {
      analysisDraft: local.draft,
      analysisCompletedLocally: local.completed,
      briefing: a ? { slug: a.slug, title: a.title, isToday: a.publish_date === sastToday() } : null,
      briefingStarted: Boolean(a && viewed.includes(a.id)),
      podcastInProgress: local.podcast,
      latestEpisode: latest,
      recentReviewViews: local.reviewViews,
    };
  }, [articles, viewed, local, latest]);
};
