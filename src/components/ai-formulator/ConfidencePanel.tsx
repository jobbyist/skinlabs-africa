import { RadialBarChart, RadialBar, PolarAngleAxis, ResponsiveContainer } from "recharts";
import { Lock, AlertTriangle } from "lucide-react";
import type { CompletenessBreakdown } from "@/data/formulaResults";

interface ConfidencePanelProps {
  completeness: CompletenessBreakdown;
  limitations: string[];
}

/**
 * "Confidence & Limitations" panel — deliberately labelled as an input-COMPLETENESS
 * measure ("how much we had to work with"), never a validated clinical-accuracy or
 * bias-free-performance claim, per SkinLabs' standing instruction against fabricating
 * AI performance claims and the SKYNN AI fairness blueprint's release-gate language.
 */
const ConfidencePanel = ({ completeness, limitations }: ConfidencePanelProps) => (
  <div className="rounded-2xl border border-border bg-card p-5 space-y-5">
    <h4 className="font-heading font-semibold text-card-foreground">Confidence &amp; Limitations</h4>

    <div className="flex items-center gap-4">
      <div className="relative h-24 w-24 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <RadialBarChart
            innerRadius="72%"
            outerRadius="100%"
            data={[{ value: completeness.overall, fill: "hsl(var(--primary))" }]}
            startAngle={90}
            endAngle={-270}
          >
            <PolarAngleAxis type="number" domain={[0, 100]} tick={false} axisLine={false} />
            <RadialBar background={{ fill: "hsl(var(--muted))" }} dataKey="value" cornerRadius={12} />
          </RadialBarChart>
        </ResponsiveContainer>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-lg font-heading font-bold text-card-foreground">{completeness.overall}%</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-medium text-card-foreground">Analysis completeness</p>
        <p className="text-xs text-muted-foreground mt-0.5">
          How much we had to work with — not a clinical accuracy score.
        </p>
      </div>
    </div>

    <div className="space-y-2.5">
      {completeness.factors.map((factor) => (
        <div key={factor.label}>
          <div className="flex justify-between text-xs mb-1">
            <span className="text-muted-foreground">{factor.label}</span>
            <span className="text-card-foreground font-medium">{factor.value}%</span>
          </div>
          <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
            <div className="h-full rounded-full bg-primary" style={{ width: `${factor.value}%` }} />
          </div>
        </div>
      ))}
    </div>

    <div className="rounded-lg bg-muted/50 p-3 space-y-1.5">
      <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
        <AlertTriangle className="h-3.5 w-3.5" />
        Limitations to note
      </div>
      <ul className="space-y-1">
        {limitations.map((l) => (
          <li key={l} className="text-xs text-muted-foreground pl-1">
            • {l}
          </li>
        ))}
      </ul>
    </div>

    <div className="flex items-start gap-2 border-t border-border pt-3">
      <Lock className="h-3.5 w-3.5 text-muted-foreground mt-0.5 shrink-0" />
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Your data is encrypted and never sold. <a href="/privacy-policy" className="underline hover:text-foreground">Manage your data</a>
      </p>
    </div>
  </div>
);

export default ConfidencePanel;
