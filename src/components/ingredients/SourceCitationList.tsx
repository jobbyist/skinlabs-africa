import { ExternalLink } from "lucide-react";

interface Source {
  label: string;
  url: string;
}

/** Renders a small "Sources" list — every claim on an ingredient/checker page
 *  should be traceable back to a real, clickable source, never presented as
 *  bare assertion. */
const SourceCitationList = ({ sources }: { sources: Source[] }) => {
  if (sources.length === 0) return null;
  return (
    <div className="mt-2">
      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Sources</p>
      <ul className="mt-1 space-y-1">
        {sources.map((s) => (
          <li key={s.url}>
            <a
              href={s.url}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="inline-flex items-center gap-1 text-xs text-primary hover:underline"
            >
              {s.label} <ExternalLink className="h-3 w-3" />
            </a>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default SourceCitationList;
