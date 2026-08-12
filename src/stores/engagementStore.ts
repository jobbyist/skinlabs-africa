import { create } from "zustand";
import { persist } from "zustand/middleware";

const todayKey = () => new Date().toISOString().slice(0, 10);

interface EngagementState {
  /** ISO date of the last recorded free article view. */
  lastViewDate: string;
  viewedArticleIds: string[];
  likedIds: string[];
  savedIds: string[];
  recordArticleView: (articleId: string) => void;
  canViewArticle: (articleId: string, hasMembership: boolean) => boolean;
  toggleLike: (id: string) => void;
  toggleSave: (id: string) => void;
}

export const useEngagementStore = create<EngagementState>()(
  persist(
    (set, get) => ({
      lastViewDate: "",
      viewedArticleIds: [],
      likedIds: [],
      savedIds: [],
      recordArticleView: (articleId) => {
        const today = todayKey();
        const { lastViewDate, viewedArticleIds } = get();
        if (lastViewDate !== today) {
          set({ lastViewDate: today, viewedArticleIds: [articleId] });
        } else if (!viewedArticleIds.includes(articleId)) {
          set({ viewedArticleIds: [...viewedArticleIds, articleId] });
        }
      },
      canViewArticle: (articleId, hasMembership) => {
        if (hasMembership) return true;
        const { lastViewDate, viewedArticleIds } = get();
        if (lastViewDate !== todayKey()) return true;
        return viewedArticleIds.includes(articleId) || viewedArticleIds.length === 0;
      },
      toggleLike: (id) =>
        set((state) => ({
          likedIds: state.likedIds.includes(id)
            ? state.likedIds.filter((x) => x !== id)
            : [...state.likedIds, id],
        })),
      toggleSave: (id) =>
        set((state) => ({
          savedIds: state.savedIds.includes(id)
            ? state.savedIds.filter((x) => x !== id)
            : [...state.savedIds, id],
        })),
    }),
    { name: "skinlabs-engagement" },
  ),
);
