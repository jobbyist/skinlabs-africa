import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

interface PaginationControlsProps {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  className?: string;
}

/** Windowed page list: first, last, current ±1, with ellipses — stays legible however many pages exist. */
const getPageWindow = (current: number, total: number): (number | "ellipsis")[] => {
  const window: (number | "ellipsis")[] = [1];
  const left = Math.max(2, current - 1);
  const right = Math.min(total - 1, current + 1);
  if (left > 2) window.push("ellipsis");
  for (let i = left; i <= right; i++) window.push(i);
  if (right < total - 1) window.push("ellipsis");
  if (total > 1) window.push(total);
  return window;
};

/** SEO-friendly pagination control: real page links (rendered as anchors), windowed for long lists. */
const PaginationControls = ({ page, totalPages, onPageChange, className }: PaginationControlsProps) => {
  if (totalPages <= 1) return null;
  const pages = getPageWindow(page, totalPages);

  const go = (event: React.MouseEvent, target: number) => {
    event.preventDefault();
    if (target >= 1 && target <= totalPages && target !== page) onPageChange(target);
  };

  return (
    <Pagination className={className}>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            href="#"
            aria-disabled={page <= 1}
            className={page <= 1 ? "pointer-events-none opacity-40" : ""}
            onClick={(e) => go(e, page - 1)}
          />
        </PaginationItem>
        {pages.map((p, index) =>
          p === "ellipsis" ? (
            <PaginationItem key={`ellipsis-${index}`}>
              <PaginationEllipsis />
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink href="#" isActive={p === page} onClick={(e) => go(e, p)}>
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            href="#"
            aria-disabled={page >= totalPages}
            className={page >= totalPages ? "pointer-events-none opacity-40" : ""}
            onClick={(e) => go(e, page + 1)}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
};

export default PaginationControls;
