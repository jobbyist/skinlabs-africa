import { Check } from "lucide-react";
import { MST_SCALE } from "@/data/mstScale";

interface MstGridProps {
  value: number | null;
  onChange: (value: number | null) => void;
}

/**
 * Self-report grid for the Monk Skin Tone (MST) Scale. Selection is always optional —
 * per SkinLabs' fairness blueprint, MST is a self-reported evaluation dimension only,
 * never required to proceed and never treated as a diagnostic input.
 */
const MstGrid = ({ value, onChange }: MstGridProps) => (
  <div className="space-y-4">
    <div className="grid grid-cols-5 gap-3 sm:gap-4">
      {MST_SCALE.map((swatch) => {
        const selected = value === swatch.level;
        return (
          <button
            key={swatch.level}
            type="button"
            onClick={() => onChange(selected ? null : swatch.level)}
            aria-pressed={selected}
            aria-label={`Monk Skin Tone ${swatch.level}`}
            className="flex flex-col items-center gap-1.5 group"
          >
            <span
              className={
                "relative h-12 w-12 sm:h-14 sm:w-14 rounded-full border transition-all flex items-center justify-center " +
                (selected ? "ring-2 ring-primary ring-offset-2 ring-offset-card scale-105" : "border-border group-hover:scale-105")
              }
              style={{ backgroundColor: swatch.hex }}
            >
              {selected && (
                <Check
                  className="h-5 w-5 drop-shadow"
                  style={{ color: swatch.level <= 5 ? "#1a1a1a" : "#ffffff" }}
                />
              )}
            </span>
            <span className={"text-xs font-medium " + (selected ? "text-foreground" : "text-muted-foreground")}>{swatch.level}</span>
          </button>
        );
      })}
    </div>
    <div className="text-center">
      <button
        type="button"
        onClick={() => onChange(null)}
        className={"text-xs underline underline-offset-2 " + (value === null ? "text-foreground" : "text-muted-foreground hover:text-foreground")}
      >
        Prefer not to say
      </button>
    </div>
  </div>
);

export default MstGrid;
