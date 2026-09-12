import { BA_NON_GUARANTEE_NOTE, BA_SPOTS, BA_TOP_PERFORMER_SPOTS } from "@/data/brandAmbassador";

const benefits = [
  { label: "Retainer", description: "Potential fixed monthly compensation." },
  { label: "Products", description: "Potential free product samples." },
  { label: "Glow Insider", description: "Potential Members complimentary access." },
  { label: "Campaigns", description: "Potential additional creator campaigns." },
  { label: "Early Access", description: "Potential access to upcoming SkinLabs® initiatives." },
  { label: "More", description: "Potential exclusive partnership opportunities." },
];

const BAPerformanceOpportunity = () => {
  return (
    <section id="performance-opportunity" className="scroll-mt-32 border-b border-border py-16 sm:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Long-Term Opportunity</p>
        <h2 className="mt-2 text-balance font-heading text-3xl font-bold text-foreground sm:text-4xl">
          What could come next?
        </h2>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Successful ambassadors may be considered for continued engagement after the initial programme.
        </p>

        <div className="mt-8 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-5">
          <span className="rounded-full bg-primary px-4 py-2 font-heading text-sm font-bold text-primary-foreground">
            {BA_SPOTS} ambassadors
          </span>
          <span className="text-muted-foreground" aria-hidden="true">→</span>
          <span className="text-sm text-muted-foreground">Performance review against official quota</span>
          <span className="text-muted-foreground" aria-hidden="true">→</span>
          <span className="rounded-full bg-indigo-600 px-4 py-2 font-heading text-sm font-bold text-background">
            Up to {BA_TOP_PERFORMER_SPOTS} — 12-month partnership
          </span>
        </div>

        <p className="mt-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Potential continued-engagement benefits</p>
        <div className="mt-3 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {benefits.map((b) => (
            <div key={b.label} className="rounded-xl border border-border p-4">
              <p className="text-sm font-semibold text-foreground">{b.label}</p>
              <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>
            </div>
          ))}
        </div>

        <p className="mt-6 max-w-2xl rounded-xl border border-dashed border-border bg-secondary/40 px-4 py-3 text-xs text-muted-foreground">
          These are potential continued-engagement benefits and are not guaranteed as part of the initial 3-month
          programme. {BA_NON_GUARANTEE_NOTE}
        </p>
      </div>
    </section>
  );
};

export default BAPerformanceOpportunity;
