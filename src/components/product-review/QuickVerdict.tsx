import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Star, TrendingUp, DollarSign, Droplets, Sun } from "lucide-react";

interface QuickVerdictProps {
  /** The editorial verdict text */
  verdict: string;
  /** Overall score out of 10 */
  overallScore: number;
  /** Breakdown of individual scores */
  scoreBreakdown: {
    efficacy: number;
    value: number;
    texture: number;
    climate: number;
  };
}

/**
 * Quick Verdict component for product review pages.
 * Displays the headline verdict, overall score, and score breakdown.
 * This is the "hero" section that gives users immediate insight.
 */
export function QuickVerdict({ verdict, overallScore, scoreBreakdown }: QuickVerdictProps) {
  const getScoreColor = (score: number) => {
    if (score >= 8) return "text-green-600 dark:text-green-400";
    if (score >= 6) return "text-yellow-600 dark:text-yellow-400";
    return "text-red-600 dark:text-red-400";
  };

  const getScoreBadgeVariant = (score: number): "default" | "secondary" | "destructive" => {
    if (score >= 8) return "default";
    if (score >= 6) return "secondary";
    return "destructive";
  };

  const scoreMetrics = [
    { label: "Efficacy", value: scoreBreakdown.efficacy, icon: TrendingUp },
    { label: "Value", value: scoreBreakdown.value, icon: DollarSign },
    { label: "Texture", value: scoreBreakdown.texture, icon: Droplets },
    { label: "SA Climate", value: scoreBreakdown.climate, icon: Sun },
  ];

  return (
    <Card className="border-2 p-6 md:p-8">
      <div className="space-y-6">
        {/* Header with overall score */}
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1">
            <h2 className="mb-2 text-lg font-semibold text-muted-foreground">Quick Verdict</h2>
            <p className="text-lg leading-relaxed md:text-xl">{verdict}</p>
          </div>
          <div className="flex flex-col items-center gap-2">
            <Badge variant={getScoreBadgeVariant(overallScore)} className="flex items-center gap-1 px-4 py-2">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-2xl font-bold">{overallScore}</span>
              <span className="text-sm text-muted-foreground">/10</span>
            </Badge>
            <span className="text-xs text-muted-foreground">Overall Score</span>
          </div>
        </div>

        {/* Score breakdown */}
        <div className="space-y-4 border-t pt-6">
          <h3 className="text-sm font-semibold text-muted-foreground">Performance Breakdown</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {scoreMetrics.map((metric) => {
              const Icon = metric.icon;
              return (
                <div key={metric.label} className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Icon className="h-4 w-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{metric.label}</span>
                    </div>
                    <span className={`text-sm font-bold ${getScoreColor(metric.value)}`}>
                      {metric.value}/10
                    </span>
                  </div>
                  <Progress value={metric.value * 10} className="h-2" />
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer note */}
        <p className="border-t pt-4 text-xs text-muted-foreground">
          SkinLabs® Editorial Assessment — Scores reflect our independent analysis of ingredients, 
          performance, value and suitability for South African skin and climate.
        </p>
      </div>
    </Card>
  );
}
