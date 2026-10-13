import { AlignCenter, AlignLeft, AlignRight, Bold, Italic, Link2, List, ListOrdered, Minus, Quote, Strikethrough } from "lucide-react";
import { cn } from "@/lib/utils";
import type { AlignFormat, InlineFormat, LineFormat } from "@/lib/community/formatting";

export type FormatAction =
  | { kind: "inline"; format: InlineFormat }
  | { kind: "line"; format: LineFormat }
  | { kind: "align"; align: AlignFormat }
  | { kind: "link" }
  | { kind: "divider" };

interface FormatToolbarProps {
  onAction: (action: FormatAction) => void;
  align: AlignFormat;
  disabled?: boolean;
  /** Shown at the end of the row while the keyboard is up (the page's own submit row is hidden then). */
  trailing?: React.ReactNode;
  className?: string;
}

const BTN =
  "flex h-11 min-w-11 shrink-0 items-center justify-center rounded-xl px-2 text-sm font-bold text-foreground/80 transition-colors hover:bg-muted active:bg-muted disabled:opacity-50 focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-primary";

const ToolButton = ({ label, onClick, disabled, pressed, children }: { label: string; onClick: () => void; disabled?: boolean; pressed?: boolean; children: React.ReactNode }) => (
  <button
    type="button"
    className={cn(BTN, pressed && "bg-muted")}
    aria-label={label}
    title={label}
    aria-pressed={pressed}
    disabled={disabled}
    onMouseDown={(e) => e.preventDefault()}
    onClick={onClick}
  >
    {children}
  </button>
);

const NEXT_ALIGN: Record<AlignFormat, AlignFormat> = { left: "center", center: "right", right: "left" };
const ALIGN_ICON = { left: AlignLeft, center: AlignCenter, right: AlignRight } as const;

/**
 * Formatting row for the composer. Buttons swallow `mousedown` so the textarea keeps focus (and the keyboard stays up) while
 * a format is applied. Scrolls sideways on narrow screens rather than shrinking the tap targets below 44px.
 */
const FormatToolbar = ({ onAction, align, disabled, trailing, className }: FormatToolbarProps) => {
  const AlignIcon = ALIGN_ICON[align];
  return (
    <div role="toolbar" aria-label="Text formatting" className={cn("flex items-center gap-0.5 border-t border-border bg-background px-2 py-1", className)}>
      <div className="flex min-w-0 flex-1 items-center gap-0.5 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <ToolButton label="Heading 1" disabled={disabled} onClick={() => onAction({ kind: "line", format: "h1" })}>H1</ToolButton>
        <ToolButton label="Heading 2" disabled={disabled} onClick={() => onAction({ kind: "line", format: "h2" })}>H2</ToolButton>
        <ToolButton label="Body text" disabled={disabled} onClick={() => onAction({ kind: "line", format: "body" })}><span className="font-medium">Body</span></ToolButton>
        <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden="true" />
        <ToolButton label="Bold" disabled={disabled} onClick={() => onAction({ kind: "inline", format: "bold" })}><Bold className="size-5" aria-hidden="true" /></ToolButton>
        <ToolButton label="Italic" disabled={disabled} onClick={() => onAction({ kind: "inline", format: "italic" })}><Italic className="size-5" aria-hidden="true" /></ToolButton>
        <ToolButton label="Strikethrough" disabled={disabled} onClick={() => onAction({ kind: "inline", format: "strike" })}><Strikethrough className="size-5" aria-hidden="true" /></ToolButton>
        <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden="true" />
        <ToolButton label="Bulleted list" disabled={disabled} onClick={() => onAction({ kind: "line", format: "bullet" })}><List className="size-5" aria-hidden="true" /></ToolButton>
        <ToolButton label="Numbered list" disabled={disabled} onClick={() => onAction({ kind: "line", format: "ordered" })}><ListOrdered className="size-5" aria-hidden="true" /></ToolButton>
        <ToolButton label="Quote" disabled={disabled} onClick={() => onAction({ kind: "line", format: "quote" })}><Quote className="size-5" aria-hidden="true" /></ToolButton>
        <ToolButton label="Link" disabled={disabled} onClick={() => onAction({ kind: "link" })}><Link2 className="size-5" aria-hidden="true" /></ToolButton>
        <span className="mx-1 h-5 w-px shrink-0 bg-border" aria-hidden="true" />
        <ToolButton label={`Alignment: ${align}. Tap to change`} disabled={disabled} onClick={() => onAction({ kind: "align", align: NEXT_ALIGN[align] })} pressed={align !== "left"}>
          <AlignIcon className="size-5" aria-hidden="true" />
        </ToolButton>
        <ToolButton label="Divider" disabled={disabled} onClick={() => onAction({ kind: "divider" })}><Minus className="size-5" aria-hidden="true" /></ToolButton>
      </div>
      {trailing}
    </div>
  );
};

export default FormatToolbar;
