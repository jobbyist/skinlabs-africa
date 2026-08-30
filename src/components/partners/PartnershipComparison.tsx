import { motion, useReducedMotion } from "framer-motion";
import { Check, Minus } from "lucide-react";
import { comparisonRows, partnershipModels, type ComparisonValue } from "@/data/partnerPrograms";
import { cn } from "@/lib/utils";

const ValueCell = ({ value }: { value: ComparisonValue }) => {
  if (typeof value === "boolean") {
    return value ? (
      <span className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
        <Check className="h-4 w-4 text-primary" aria-hidden="true" />
        <span className="sr-only">Included</span>
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
        <Minus className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Not included</span>
      </span>
    );
  }
  return <span className="text-sm text-foreground/85">{value}</span>;
};

const columns = [
  { key: "affiliate" as const, label: "Affiliate Partner" },
  { key: "editorial" as const, label: "Editorial Partner" },
  { key: "strategic" as const, label: "Strategic Commerce Partner" },
];

const PartnershipComparison = () => {
  const shouldReduceMotion = useReducedMotion();

  return (
    <section className="py-20 md:py-28">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="mx-auto mb-14 max-w-2xl text-center">
          <h2 className="text-balance font-heading text-3xl font-bold text-foreground md:text-4xl">
            Which Partnership Model Is Right for You?
          </h2>
        </div>

        {/* Desktop / tablet: accessible scrollable table */}
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
          whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5 }}
          className="hidden overflow-x-auto rounded-2xl border border-border sm:block"
        >
          <table className="w-full min-w-[720px] border-collapse text-left">
            <caption className="sr-only">Comparison of SkinLabs® Affiliate, Editorial and Strategic Commerce partnership models</caption>
            <thead>
              <tr className="border-b border-border bg-secondary/30">
                <th scope="col" className="p-4 text-sm font-semibold text-foreground">
                  &nbsp;
                </th>
                {columns.map((col) => (
                  <th key={col.key} scope="col" className="p-4 font-heading text-sm font-bold text-foreground">
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {comparisonRows.map((row, index) => (
                <tr
                  key={row.label}
                  className={cn("border-b border-border last:border-b-0", index % 2 === 1 && "bg-secondary/10")}
                >
                  <th scope="row" className="p-4 text-sm font-medium text-foreground">
                    {row.label}
                  </th>
                  <td className="p-4">
                    <ValueCell value={row.affiliate} />
                  </td>
                  <td className="p-4">
                    <ValueCell value={row.editorial} />
                  </td>
                  <td className="p-4 bg-primary/[0.03]">
                    <ValueCell value={row.strategic} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </motion.div>

        {/* Mobile: stacked comparison cards */}
        <div className="space-y-6 sm:hidden">
          {partnershipModels.map((model) => (
            <div key={model.id} className="rounded-2xl border border-border bg-card p-5">
              <p className="font-heading text-base font-bold text-foreground">{model.label}</p>
              <dl className="mt-4 space-y-3">
                {comparisonRows.map((row) => (
                  <div key={row.label} className="flex items-start justify-between gap-4 border-t border-border/60 pt-3 first:border-t-0 first:pt-0">
                    <dt className="text-sm text-muted-foreground">{row.label}</dt>
                    <dd className="text-right">
                      <ValueCell
                        value={model.id === "affiliate" ? row.affiliate : model.id === "editorial" ? row.editorial : row.strategic}
                      />
                    </dd>
                  </div>
                ))}
              </dl>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default PartnershipComparison;
