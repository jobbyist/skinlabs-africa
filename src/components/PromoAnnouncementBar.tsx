import { Link } from "react-router-dom";
import { Sparkles, X } from "lucide-react";
import { PROMO_END_DATE_LABEL } from "@/lib/promo";

interface PromoAnnouncementBarProps {
  onDismiss: () => void;
}

/**
 * Fixed, single-line promo bar above the main nav. Header.tsx renders this
 * together with a matching h-9 flow spacer and shifts the nav header down to
 * top-9 — see the comment there for why (it's the only way to add height
 * above a fixed header without editing every page's own pt-* class).
 */
const PromoAnnouncementBar = ({ onDismiss }: PromoAnnouncementBarProps) => (
  <div
    className="fixed inset-x-0 top-0 z-[60] flex h-9 items-center justify-center gap-2 bg-[image:var(--gradient-brand)] px-3 text-white"
    role="region"
    aria-label="Site announcement"
  >
    <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
    <p className="min-w-0 truncate text-center text-xs font-medium sm:text-sm">
      <span className="hidden sm:inline">Limited time: </span>
      All paid plans are free to try until {PROMO_END_DATE_LABEL}.{" "}
      <Link to="/announcements" className="underline underline-offset-2 hover:no-underline">
        See details
      </Link>
    </p>
    <button
      type="button"
      onClick={onDismiss}
      aria-label="Dismiss announcement"
      className="ml-1 shrink-0 rounded-full p-1 text-white/80 transition-colors hover:bg-white/15 hover:text-white"
    >
      <X className="h-3.5 w-3.5" />
    </button>
  </div>
);

export default PromoAnnouncementBar;
