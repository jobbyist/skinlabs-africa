import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { getPageWindow, type PageToken } from "@/lib/pagination";
import { cn } from "@/lib/utils";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/**
 * SEO-friendly pagination control: real page links (rendered as anchors),
 * truncated with ellipses (`getPageWindow`, unit tested) so it never grows
 * with the page count. Phones get the tightest window (first · current · last)
 * and icon-only Previous/Next so the row always fits a 320px screen; sm and
 * up show current ±1 with labelled buttons.
 */
const PaginationControls = ({ page, totalPages, onPageChange, className }: PaginationControlsProps) => {
  if (totalPages <= 1) return null;

  const go = (event: React.MouseEvent, target: number) => {
    event.preventDefault();
    if (target >= 1 && target <= totalPages && target !== page) onPageChange(target);
  };

  const pageItems = (tokens: PageToken[]) =>
    tokens.map((p, index) =>
      p === "ellipsis" ? (
        <PaginationItem key={`ellipsis-${index}`}>
          <PaginationEllipsis className="w-7 sm:w-9" />
        </PaginationItem>
      ) : (
        <PaginationItem key={p}>
          <PaginationLink
            href="#"
            isActive={p === page}
            aria-label={`Page ${p}`}
            className="h-9 w-9 tabular-nums"
            onClick={(e) => go(e, p)}
          >
            {p}
          </PaginationLink>
        </PaginationItem>
      ),
    );

  const prevDisabled = page <= 1;
  const nextDisabled = page >= totalPages;

  return (
    <Pagination className={cn("flex-col items-center gap-2", className)}>
      <PaginationContent className="max-w-full flex-nowrap gap-0.5 sm:gap-1">
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={prevDisabled}
            className={cn("px-2 sm:pl-2.5 sm:pr-4 [&>span]:sr-only sm:[&>span]:not-sr-only", prevDisabled && "pointer-events-none opacity-40")}
            onClick={(e) => go(e, page - 1)}
          />
        </PaginationItem>
        <li className="contents sm:hidden">
          <ul className="flex items-center gap-0.5">{pageItems(getPageWindow(page, totalPages, 0))}</ul>
        </li>
        <li className="hidden sm:contents">
          <ul className="flex items-center gap-1">{pageItems(getPageWindow(page, totalPages, 1))}</ul>
        </li>
        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={nextDisabled}
            className={cn("px-2 sm:pl-4 sm:pr-2.5 [&>span]:sr-only sm:[&>span]:not-sr-only", nextDisabled && "pointer-events-none opacity-40")}
            onClick={(e) => go(e, page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
      <p className="text-xs text-muted-foreground tabular-nums" aria-live="polite">
        Page {page} of {totalPages}
      </p>
    </Pagination>
  );
};

export default PaginationControls;
