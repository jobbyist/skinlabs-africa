import { useState } from "react";
import { Sparkles, X } from "lucide-react";
import PromoOfferDialog from "@/components/PromoOfferDialog";
import { PROMO_END_AT, PROMO_END_DATE_LABEL } from "@/lib/promo";
import PromoTrialModal from "@/components/PromoTrialModal";

/**
 * Fixed, single-line promo bar above the main nav. Header.tsx renders this
 * together with a matching h-9 flow spacer and shifts the nav header down to
 * top-9 — see the comment there for why (it's the only way to add height
 * above a fixed header without editing every page's own pt-* class).
 * md and up only: on phones the same message is PromoHeaderChip, inside the
 * header row, so it doesn't stack another fixed bar above the nav.
 * Both open the conversion-focused PromoTrialModal instead of navigating to
 * /announcements; the announcement stays reachable from the modal itself.
 */
const PromoAnnouncementBar = ({ onDismiss }: { onDismiss: () => void }) => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <div
        className="fixed inset-x-0 top-0 z-[60] hidden h-9 md:flex items-center justify-center gap-2 bg-[image:var(--gradient-brand)] px-3 text-white"
        role="region"
        aria-label="Site announcement"
      >
        <Sparkles className="h-3.5 w-3.5 shrink-0" aria-hidden />
        <p className="min-w-0 truncate text-center text-xs font-medium sm:text-sm">
          <span className="hidden sm:inline">Limited time: </span>
          All paid plans are free to try until {PROMO_END_DATE_LABEL}.{" "}
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="underline underline-offset-2 hover:no-underline"
          >
            See details
          </button>
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
      <PromoTrialModal open={open} onOpenChange={setOpen} />
    </>
  );
};

export default PromoAnnouncementBar;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** "1 Nov" from PROMO_END_AT, in SAST (no locale zero-padding). */
const promoEndShort = () => {
  const sast = new Date(new Date(PROMO_END_AT).getTime() + 2 * 60 * 60 * 1000);
  return `${sast.getUTCDate()} ${MONTHS[sast.getUTCMonth()]}`;
};

/** The promo message as a compact pill in the mobile header row (below md).
    Opens the PromoTrialModal instead of navigating to /announcements. */
export const PromoHeaderChip = () => {
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="ml-0.5 mr-auto inline-flex min-h-7 max-[369px]:hidden shrink-0 items-center whitespace-nowrap rounded-full bg-[image:var(--gradient-brand)] px-2 text-[10px] tracking-tight font-semibold text-white md:hidden"
        aria-label={`All paid plans are free to try until ${PROMO_END_DATE_LABEL}. See details`}
      >
        Free until {promoEndShort()}
      </button>
      <PromoTrialModal open={open} onOpenChange={setOpen} />
    </>
  );
};
