import { cn } from "@/lib/utils";

/**
 * OpenHaus by SkinLabs® lockup — an inline SVG mark (an open, rounded
 * "door/aperture" glyph, nodding to "haus") paired with a two-weight
 * wordmark and the SkinLabs® byline. Renders crisply at any size and
 * inherits color via currentColor, so it works on both the marketplace's
 * light stone background and any future dark surface.
 */
export function OpenHausMark({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 28 28"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden="true"
    >
      <rect x="1.5" y="1.5" width="25" height="25" rx="7" className="fill-stone-900" />
      <path
        d="M9 19.5V11.8c0-.7.35-1.35.94-1.73l3.5-2.24a2.06 2.06 0 0 1 2.22 0l1.6 1.02"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M19.5 13.2V19.5a1 1 0 0 1-1 1h-8"
        stroke="white"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx="14.5" cy="15.5" r="1" className="fill-white" />
    </svg>
  );
}

export function OpenHausLogo({
  className,
  markClassName,
  wordmarkSize = "text-[15px]",
}: {
  className?: string;
  markClassName?: string;
  wordmarkSize?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2", className)}>
      <OpenHausMark className={cn("h-7 w-7", markClassName)} />
      <span className="flex flex-col leading-none">
        <span className={cn("font-black tracking-[0.01em] text-stone-900", wordmarkSize)}>
          Open<span className="font-light">Haus</span>
        </span>
        <span className="text-[9px] font-medium uppercase tracking-[0.16em] text-stone-500">by skinlabs®</span>
      </span>
    </span>
  );
}
