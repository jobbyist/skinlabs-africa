import { useRef } from "react";
import { cn } from "@/lib/utils";
import type { ResultsTab } from "@/lib/starter-analysis/resultsView";

const TABS: Array<{ id: ResultsTab; label: string }> = [
  { id: "profile", label: "Skin profile" },
  { id: "routine", label: "Routine" },
  { id: "integrity", label: "Confidence" },
];

interface ResultsTabNavProps {
  value: ResultsTab;
  onChange: (tab: ResultsTab) => void;
}

/** Three-way results selector with a sliding indicator; arrow keys move between tabs. */
const ResultsTabNav = ({ value, onChange }: ResultsTabNavProps) => {
  const refs = useRef<Record<string, HTMLButtonElement | null>>({});
  const index = TABS.findIndex((t) => t.id === value);

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const next = TABS[(index + (e.key === "ArrowRight" ? 1 : TABS.length - 1)) % TABS.length];
    onChange(next.id);
    refs.current[next.id]?.focus();
  };

  return (
    <div role="tablist" aria-label="Analysis results" onKeyDown={onKeyDown} className="relative grid grid-cols-3 rounded-full bg-muted p-1">
      <span
        aria-hidden="true"
        className="absolute inset-y-1 left-1 w-[calc((100%-0.5rem)/3)] rounded-full bg-background shadow-sm transition-transform duration-200 ease-out motion-reduce:transition-none"
        style={{ transform: `translateX(${index * 100}%)` }}
      />
      {TABS.map((t) => (
        <button
          key={t.id}
          ref={(el) => { refs.current[t.id] = el; }}
          role="tab"
          id={`results-tab-${t.id}`}
          aria-selected={value === t.id}
          aria-controls={`results-panel-${t.id}`}
          tabIndex={value === t.id ? 0 : -1}
          type="button"
          onClick={() => onChange(t.id)}
          className={cn(
            "relative z-10 min-h-11 rounded-full px-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
            value === t.id ? "text-foreground" : "text-muted-foreground hover:text-foreground",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
};

export default ResultsTabNav;
