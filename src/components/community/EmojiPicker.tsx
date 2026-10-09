import { useState } from "react";
import { Smile } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { EMOJI_GROUPS } from "@/lib/community/emoji";

interface EmojiPickerProps {
  onPick: (emoji: string) => void;
  disabled?: boolean;
  className?: string;
}

/** A compact emoji popover (curated set, no dependency). Stays open so several can be added; Escape or an outside tap closes it. */
const EmojiPicker = ({ onPick, disabled, className }: EmojiPickerProps) => {
  const [group, setGroup] = useState(EMOJI_GROUPS[0].id);
  const active = EMOJI_GROUPS.find((g) => g.id === group) ?? EMOJI_GROUPS[0];
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button type="button" variant="ghost" size="icon" disabled={disabled} className={cn("size-11 rounded-full text-muted-foreground", className)} aria-label="Add emoji">
          <Smile className="size-5" aria-hidden="true" />
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-[min(20rem,calc(100vw-2rem))] p-2" onOpenAutoFocus={(e) => e.preventDefault()}>
        <div role="tablist" aria-label="Emoji categories" className="mb-2 flex gap-1 border-b border-border pb-2">
          {EMOJI_GROUPS.map((g) => (
            <button
              key={g.id}
              type="button"
              role="tab"
              aria-selected={g.id === group}
              aria-label={g.label}
              title={g.label}
              onClick={() => setGroup(g.id)}
              className={cn("flex size-10 items-center justify-center rounded-lg text-xl transition-colors", g.id === group ? "bg-muted" : "hover:bg-muted/60")}
            >
              {g.icon}
            </button>
          ))}
        </div>
        <div role="tabpanel" aria-label={active.label} className="grid max-h-48 grid-cols-7 gap-0.5 overflow-y-auto">
          {active.emojis.map((e) => (
            <button key={e} type="button" onClick={() => onPick(e)} className="flex size-10 items-center justify-center rounded-lg text-2xl transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-[1.5px] focus-visible:ring-primary" aria-label={`Insert ${e}`}>
              {e}
            </button>
          ))}
        </div>
      </PopoverContent>
    </Popover>
  );
};

export default EmojiPicker;
