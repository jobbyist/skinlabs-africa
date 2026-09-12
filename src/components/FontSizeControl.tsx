import { useEffect, useState } from "react";
import { ALargeSmall, Minus, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const SIZES = ["sm", "base", "lg", "xl"] as const;
type Size = (typeof SIZES)[number];

const SIZE_CLASS: Record<Size, string> = {
  sm: "text-sm leading-relaxed",
  base: "text-base leading-relaxed",
  lg: "text-lg leading-relaxed",
  xl: "text-xl leading-relaxed",
};

const STORAGE_KEY = "skinlabs-article-font-size";

interface FontSizeControlProps {
  /** CSS selector of the article body container whose font size should change */
  targetSelector?: string;
  className?: string;
}

/**
 * Compact A− / A+ control for article pages.
 * Persists preference in localStorage and applies a size class to the target element.
 */
const FontSizeControl = ({
  targetSelector = "[data-article-body]",
  className = "",
}: FontSizeControlProps) => {
  const [size, setSize] = useState<Size>(() => {
    if (typeof window === "undefined") return "base";
    const stored = localStorage.getItem(STORAGE_KEY) as Size | null;
    return stored && SIZES.includes(stored) ? stored : "base";
  });

  useEffect(() => {
    const el = document.querySelector(targetSelector);
    if (!el) return;
    // Remove previous size classes then apply the current one
    Object.values(SIZE_CLASS).forEach((c) => el.classList.remove(...c.split(" ")));
    el.classList.add(...SIZE_CLASS[size].split(" "));
    localStorage.setItem(STORAGE_KEY, size);
  }, [size, targetSelector]);

  const idx = SIZES.indexOf(size);

  return (
    <div
      className={cn(
        "inline-flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 shadow-sm",
        className,
      )}
      role="group"
      aria-label="Adjust text size"
    >
      <ALargeSmall className="h-3.5 w-3.5 text-muted-foreground" aria-hidden />
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        disabled={idx <= 0}
        onClick={() => setSize(SIZES[Math.max(0, idx - 1)])}
        aria-label="Decrease text size"
      >
        <Minus className="h-3.5 w-3.5" />
      </Button>
      <span className="min-w-[2.5rem] text-center text-xs font-medium tabular-nums text-muted-foreground">
        {size}
      </span>
      <Button
        type="button"
        variant="ghost"
        size="icon"
        className="h-7 w-7"
        disabled={idx >= SIZES.length - 1}
        onClick={() => setSize(SIZES[Math.min(SIZES.length - 1, idx + 1)])}
        aria-label="Increase text size"
      >
        <Plus className="h-3.5 w-3.5" />
      </Button>
    </div>
  );
};

export default FontSizeControl;
