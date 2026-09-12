import { Link } from "react-router-dom";
import { ArrowRight, BookOpenCheck } from "lucide-react";
import { relatedKnowledgeHubEntries } from "@/lib/content-graph";
import { cn } from "@/lib/utils";

interface RelatedKnowledgeHubProps {
  keywords: string[];
  limit?: number;
  title?: string;
  className?: string;
}

/** Context-aware Knowledge Hub links as card components. */
const RelatedKnowledgeHub = ({
  keywords,
  limit = 3,
  title = "Related content",
  className,
}: RelatedKnowledgeHubProps) => {
  const entries = relatedKnowledgeHubEntries(keywords, limit);
  if (entries.length === 0) return null;

  return (
    <section className={cn("mt-10", className)} aria-labelledby="related-content-heading">
      <h2
        id="related-content-heading"
        className="mb-4 flex items-center gap-2 font-heading text-2xl font-bold text-foreground"
      >
        <BookOpenCheck className="h-5 w-5 text-primary" /> {title}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {entries.map((entry) => (
          <Link
            key={entry.id}
            to={`/knowledge-hub/${entry.slug}`}
            className="group flex h-full flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-md"
          >
            <span className="text-xs font-medium uppercase tracking-wider text-primary">
              Knowledge Hub
            </span>
            <h3 className="mt-2 flex-1 font-heading text-base font-semibold leading-snug text-foreground group-hover:text-primary">
              {entry.question}
            </h3>
            <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-medium text-primary">
              Read more
              <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
};

export default RelatedKnowledgeHub;
