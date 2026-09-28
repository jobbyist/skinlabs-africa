export type PageToken = number | "ellipsis";

/**
 * Truncated page list: always the first and last page, the current page and
 * `siblings` pages either side of it, with an ellipsis for every gap of 2+
 * pages (a gap of exactly one page shows that page instead — an ellipsis
 * standing in for a single number saves nothing). The result never exceeds
 * `2 * siblings + 5` tokens, however many pages exist.
 */
export const getPageWindow = (current: number, total: number, siblings = 1): PageToken[] => {
  if (total <= 0) return [];
  const page = Math.min(Math.max(1, Math.round(current)), total);
  const maxTokens = 2 * siblings + 5;
  if (total <= maxTokens) return Array.from({ length: total }, (_, i) => i + 1);

  let left = Math.max(2, page - siblings);
  let right = Math.min(total - 1, page + siblings);
  // Near either end, spend the unused slots on the other side so the control
  // keeps a constant width as the reader pages through.
  const span = 2 * siblings + 2; // inner pages shown when only one side is truncated
  if (left <= 3) {
    left = 2;
    right = Math.max(right, 1 + span);
  }
  if (right >= total - 2) {
    right = total - 1;
    left = Math.min(left, total - span);
  }

  const out: PageToken[] = [1];
  if (left > 2) out.push("ellipsis");
  for (let i = left; i <= right; i++) out.push(i);
  if (right < total - 1) out.push("ellipsis");
  out.push(total);
  return out;
};
