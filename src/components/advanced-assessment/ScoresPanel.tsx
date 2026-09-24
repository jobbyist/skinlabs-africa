import { Card, CardContent } from "@/components/ui/card";
import type { AdvancedReportScores } from "@/lib/assessment/types";

const BAND_COPY: Record<string, string> = {
  none: "None",
  mild: "Mild",
  moderate: "Moderate",
  severe: "Severe",
  very_severe: "Very severe",
  no_effect: "No effect",
  small: "Small effect",
  very_large: "Very large effect",
  extremely_large: "Extremely large effect",
};

const Tile = ({ label, value, note }: { label: string; value: string; note: string }) => (
  <div className="rounded-xl border border-border p-4">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-lg font-heading font-semibold mt-0.5">{value}</p>
    <p className="text-[0.7rem] text-muted-foreground mt-1 leading-snug">{note}</p>
  </div>
);

/**
 * The deterministic, self-reported scores — computed by fixed rules in
 * supabase/functions/_shared/assessment/scoring/, never by the model. Each
 * tile carries its own "self-reported / not a clinical grading" note, per
 * the framework's rule that these must never read as a diagnosis.
 */
const ScoresPanel = ({ scores, compact = false }: { scores: AdvancedReportScores; compact?: boolean }) => {
  const tiles = [
    {
      label: "Skin type (Baumann-style)",
      value: scores.baumannStyle.code ?? "—",
      note: scores.baumannStyle.code
        ? Object.values(scores.baumannStyle.axes).map((a) => a.label).join(" · ")
        : "Answer a few more skin-behaviour questions to see this.",
    },
    scores.acne.present && {
      label: "Breakouts (self-graded)",
      value: scores.acne.gagsStyleBand ? BAND_COPY[scores.acne.gagsStyleBand] ?? scores.acne.gagsStyleBand : "—",
      note: `GAGS-style score ${scores.acne.gagsStyleTotal ?? "—"}${scores.acne.igaStyleLabel ? ` · overall: ${scores.acne.igaStyleLabel}` : ""}. Self-reported, not a clinical grading.`,
    },
    scores.glogauStyle.type && {
      label: "Sun & ageing (Glogau-style)",
      value: `Type ${scores.glogauStyle.type}`,
      note: `${scores.glogauStyle.label ?? ""}. Self-reported.`,
    },
    scores.melasmaTracker.present && {
      label: "Dark-patch tracker",
      value: `${scores.melasmaTracker.mmasiStyleScore ?? "—"} / ${scores.melasmaTracker.max}`,
      note: "mMASI-style self-tracker to repeat over time — advisory only, not a clinical measure.",
    },
    scores.qolImpact.score !== null && {
      label: "How your skin affects you",
      value: scores.qolImpact.band ? BAND_COPY[scores.qolImpact.band] ?? scores.qolImpact.band : "—",
      note: `${scores.qolImpact.score}/30 on SkinLabs' own questions (not the DLQI).`,
    },
    scores.mst.tier !== null && {
      label: "Monk Skin Tone",
      value: `MST ${scores.mst.tier}`,
      note: "Your own choice. Used to tailor guidance and to check SKYNN AI is fair across skin tones.",
    },
  ].filter(Boolean) as Array<{ label: string; value: string; note: string }>;

  return (
    <Card>
      <CardContent className="pt-6 space-y-3">
        {!compact && (
          <div>
            <p className="font-medium text-sm">Your scores</p>
            <p className="text-xs text-muted-foreground">Calculated from your answers by fixed rules — the AI doesn&apos;t set these.</p>
          </div>
        )}
        <div className="grid gap-3 sm:grid-cols-2">
          {tiles.map((t) => (
            <Tile key={t.label} {...t} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

export default ScoresPanel;
