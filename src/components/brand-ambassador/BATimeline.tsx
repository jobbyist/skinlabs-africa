import { BA_PROGRAMME_END, BA_PROGRAMME_START } from "@/data/brandAmbassador";

const phases = [
  { date: "1 Oct 2026", label: "Programme begins" },
  { date: "October", label: "Create" },
  { date: "November", label: "Grow & engage" },
  { date: "December", label: "Evaluate" },
  { date: "31 Dec 2026", label: "Programme ends" },
];

const BATimeline = () => {
  return (
    <section className="border-b border-border bg-secondary/40 py-16 sm:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-10 md:grid-cols-2 md:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">The 3-Month Programme</p>
            <h2 className="mt-2 text-balance font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Start {BA_PROGRAMME_START}. Build for three months.
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              The initial programme runs for three months, giving SkinLabs® and participating creators an
              opportunity to build a working relationship, create content, generate referrals and evaluate
              opportunities for continued collaboration.
            </p>
          </div>

          <ol className="relative space-y-8 border-l border-border pl-6">
            {phases.map((phase) => (
              <li key={phase.label} className="relative">
                <span className="absolute -left-[1.65rem] top-1 h-3 w-3 rounded-full border-2 border-background bg-indigo-600" aria-hidden="true" />
                <p className="text-xs font-bold uppercase tracking-wide text-indigo-600">{phase.date}</p>
                <p className="text-sm font-medium text-foreground">{phase.label}</p>
              </li>
            ))}
          </ol>
        </div>
        <p className="sr-only">Programme ends {BA_PROGRAMME_END}</p>
      </div>
    </section>
  );
};

export default BATimeline;
