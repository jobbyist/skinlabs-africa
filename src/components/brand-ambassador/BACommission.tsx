import { BadgeCheck, Link2, Sparkles, Users, Video } from "lucide-react";
import { BA_COMMISSION_PERCENT } from "@/data/brandAmbassador";

const flow = [
  { icon: Video, label: "Your content" },
  { icon: Users, label: "Your audience" },
  { icon: Link2, label: "Your referral" },
  { icon: BadgeCheck, label: "Successful referral" },
  { icon: Sparkles, label: `${BA_COMMISSION_PERCENT} recurring commission` },
];

const BACommission = () => {
  return (
    <section id="commission" className="scroll-mt-32 border-b border-border py-16 sm:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-10 lg:grid-cols-2 lg:items-center">
          <div className="rounded-3xl bg-black p-8 text-background sm:p-10">
            <p className="text-xs font-bold uppercase tracking-wide text-background/60">The Commission</p>
            <p className="mt-4 font-heading text-6xl font-extrabold text-indigo-400 sm:text-7xl">{BA_COMMISSION_PERCENT}</p>
            <p className="mt-2 text-sm font-semibold uppercase tracking-wide text-background/80">
              Recurring monthly commission
            </p>

            <div className="mt-8 space-y-3">
              {flow.map((item, i) => (
                <div key={item.label} className="flex items-center gap-3">
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-background/10">
                    <item.icon className="h-4 w-4" aria-hidden="true" />
                  </span>
                  <span className={i === flow.length - 1 ? "text-sm font-semibold text-indigo-300" : "text-sm text-background/80"}>
                    {item.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h2 className="text-balance font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Earn {BA_COMMISSION_PERCENT} recurring monthly commission.
            </h2>
            <p className="mt-4 max-w-md text-muted-foreground">
              Earn {BA_COMMISSION_PERCENT} recurring monthly commission on successful referrals generated through your
              ambassador referral pathway, subject to the official programme terms.
            </p>
            <p className="mt-4 max-w-md text-sm text-muted-foreground">
              Commission is tied to real, successful referrals — not a guaranteed income, salary or passive-income
              promise. Referral volume depends on your audience, content and engagement.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BACommission;
