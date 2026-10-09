import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Lock, ShieldAlert } from "lucide-react";
import { withoutPhotoFactor, type CompletenessBreakdown } from "@/data/formulaResults";

export interface Limitation {
  lead: string;
  text: string;
}

interface ConfidencePanelProps {
  completeness: CompletenessBreakdown;
  limitations: Limitation[];
}

/**
 * "Confidence & Limitations" panel — deliberately labelled as an input-COMPLETENESS
 * measure ("how much we had to work with"), never a validated clinical-accuracy or
 * bias-free-performance claim, per SkinLabs' standing instruction against fabricating
 * AI performance claims and the SKYNN AI fairness blueprint's release-gate language.
 */
const ConfidencePanel = ({ completeness: storedCompleteness, limitations }: ConfidencePanelProps) => {
  const completeness = withoutPhotoFactor(storedCompleteness);
  return (
  <div className="rounded-2xl border border-border bg-card p-5 sm:p-6 space-y-6">
    <h4 className="font-heading font-semibold text-card-foreground">Confidence &amp; Limitations</h4>

    <div className="grid gap-5 sm:grid-cols-[auto_1fr] sm:items-center">
      <div className="flex items-center gap-4 sm:flex-col sm:text-center">
        <div className="relative h-28 w-28 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RadialBarChart
              innerRadius="72%"
              outerRadius="100%"
              data={[{ value: completeness.overall }]}
              startAngle={90}
              endAngle={-270}
            >
              <defs>
                <linearGradient id="skynn-confidence-gradient" x1="0" y1="0" x2="1" y2="1">
                  <stop offset="0%" stopColor="#22c55e" />
                  <stop offset="50%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#a855f7" />
                </linearGradient>
              </defs>
              <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
              <RadialBar
                background={{ fill: "hsl(var(--muted))" }}
                dataKey="value"
                cornerRadius={12}
                fill="url(#skynn-confidence-gradient)"
                isAnimationActive
                animationDuration={900}
              />
            </RadialBarChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="gradient-text text-2xl font-heading font-bold">{completeness.overall}%</span>
          </div>
        </div>
        <div className="sm:max-w-[9rem]">
          <p className="text-sm font-medium text-card-foreground">Analysis completeness</p>
          <p className="mt-0.5 text-xs text-muted-foreground">How much we had to work with — not a clinical accuracy score.</p>
        </div>
      </div>

      <div className="space-y-3">
        {completeness.factors.map((factor) => (
          <div key={factor.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">{factor.label}</span>
              <span className="font-medium text-card-foreground">{factor.value}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full bg-secondary">
              <div className="h-full rounded-full bg-primary" style={{ width: `${factor.value}%` }} />
            </div>
          </div>
        ))}
      </div>
    </div>

    <ul className="space-y-2" aria-label="Limitations to note">
      {limitations.map((l) => (
        <li key={l.lead} className="flex items-start gap-3 rounded-xl bg-muted/50 p-3">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden="true" />
          <p className="text-xs leading-relaxed text-muted-foreground">
            <strong className="font-semibold text-card-foreground">{l.lead}.</strong> {l.text}
          </p>
        </li>
      ))}
    </ul>

    <div className="flex items-start gap-2 border-t border-border pt-3">
      <Lock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Your data is encrypted and never sold. <a href="/privacy-policy" className="underline hover:text-foreground">Manage your data</a>
      </p>
    </div>
  </div>
  );
};

export default ConfidencePanel;
