import { Link } from "react-router-dom";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import { relatedKnowledgeHubEntries } from "@/lib/content-graph";
import { cn } from "@/lib/utils";

interface RelatedKnowledgeHubProps {
  /** Ingredients, concerns, categories, brand names — anything worth matching against. */
  keywords: string[];
  limit?: number;
  title?: string;
  className?: string;
}

/**
 * Context-aware deep links into the Knowledge Hub, reused across product reviews,
 * Spotlight brand profiles, Shelf Showdown comparisons and Daily Skinny briefings.
 * Renders nothing when no relevant entries are found, so it's always safe to drop in.
 */
const RelatedKnowledgeHub = ({ keywords, limit = 3, title = "From the Knowledge Hub", className }: RelatedKnowledgeHubProps) => {
  const entries = relatedKnowledgeHubEntries(keywords, limit);
  if (entries.length === 0) return null;

  return (
    <div className={cn("mt-8", className)}>
      <h2 className="mb-3 flex items-center gap-2 font-heading text-lg font-bold text-foreground">
        <BookOpenCheck className="h-4 w-4 text-primary" /> {title}
      </h2>
      <ul className="space-y-2">
        {entries.map((entry) => (
          <li key={entry.id}>
            <Link
              to={`/knowledge-hub/${entry.slug}`}
              className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm font-medium text-foreground hover:border-primary/40"
            >
              {entry.question}
              <ArrowRight className="h-3.5 w-3.5 shrink-0 text-primary" />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default RelatedKnowledgeHub;
