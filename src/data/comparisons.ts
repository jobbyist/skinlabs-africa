/**
 * TEMP - loading full file next
 */
export const comparisonArticles: any[] = [];
export const getComparison = (slug: string) => comparisonArticles.find((article) => article.slug === slug);
