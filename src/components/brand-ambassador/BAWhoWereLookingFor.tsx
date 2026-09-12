import { Check } from "lucide-react";

const criteria = [
  "TikTok-first creator",
  "5K–50K followers",
  "South African audience relevance",
  "Authentic communication style",
  "Strong audience engagement",
  "Skincare, beauty, wellness, lifestyle or adjacent content",
  "Comfortable creating short-form video",
  "Interested in long-term brand relationships",
];

const BAWhoWereLookingFor = () => {
  return (
    <section className="border-b border-border bg-secondary/40 py-16 sm:py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <div className="grid gap-10 md:grid-cols-2">
          <div>
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Who We're Looking For</p>
            <h2 className="mt-2 text-balance font-heading text-3xl font-bold text-foreground sm:text-4xl">
              Could you be one of the 25?
            </h2>
            <div className="mt-6 inline-flex -rotate-1 items-center rounded-2xl bg-indigo-600 px-6 py-5 text-background shadow-lg">
              <p className="font-heading text-2xl font-extrabold sm:text-3xl">5,000 – 50,000</p>
            </div>
            <p className="mt-2 text-sm font-medium text-muted-foreground">TikTok &amp; Instagram followers — assessed separately per platform.</p>
          </div>

          <div>
            <ul className="grid gap-3 sm:grid-cols-2">
              {criteria.map((item) => (
                <li key={item} className="flex items-start gap-2 text-sm text-foreground">
                  <Check className="mt-0.5 h-4 w-4 shrink-0 text-indigo-600" aria-hidden="true" />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-muted-foreground">
              Follower count is only part of the picture. We're also looking at audience quality, engagement, content
              quality, relevance and overall fit.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default BAWhoWereLookingFor;
