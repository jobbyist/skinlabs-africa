import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CloudSun, Star, FlaskConical, GitCompareArrows, ClipboardCheck, Handshake, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { cn } from "@/lib/utils";
import { SA_CITIES } from "@/lib/skinWeather/cities";

type Status = "live" | "proposed";

const FUNCTIONS_BASE = "https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1";

const STATUS_STYLE: Record<Status, string> = {
  live: "bg-brand-gold/20 text-foreground",
  proposed: "border border-dashed border-border text-muted-foreground",
};
const STATUS_LABEL: Record<Status, string> = { live: "Live", proposed: "Proposed for v1" };

const LOOP = [
  { n: "01", title: "Pick a resource", body: "Skin weather is live today. Reviews, catalogue and compatibility are proposed for v1." },
  { n: "02", title: "Call it", body: "Plain JSON over HTTPS. Skin weather needs no key. Every v1 endpoint will use a partner key." },
  { n: "03", title: "Show the credit", body: "Attribution and the Sponsored label travel with the data, so shoppers are never misled." },
  { n: "04", title: "Ship it", body: "Cache for ten minutes, handle the stable error codes, and you're done." },
];

const RESOURCES: { icon: ReactNode; status: Status; title: string; body: string; href: string }[] = [
  { icon: <CloudSun className="h-6 w-6" />, status: "live", title: "Skin weather", body: "Today's UV, UV peak, humidity and forecast high for ten South African cities.", href: "#skin-weather" },
  { icon: <Star className="h-6 w-6" />, status: "proposed", title: "Product reviews", body: "Independent reviews scored for SA climate, with the sponsored disclosure built in.", href: "#reviews" },
  { icon: <FlaskConical className="h-6 w-6" />, status: "proposed", title: "Products and ingredients", body: "A structured catalogue of what is sold here and what is in it.", href: "#catalogue" },
  { icon: <GitCompareArrows className="h-6 w-6" />, status: "proposed", title: "Ingredient compatibility", body: "Which actives should not be layered, from sourced rules only.", href: "#interactions" },
  { icon: <ClipboardCheck className="h-6 w-6" />, status: "proposed", title: "SKYNN assessments", body: "Closed until sign-off, evidence and POPIA operator agreements are in place.", href: "#assessments" },
  { icon: <Handshake className="h-6 w-6" />, status: "proposed", title: "Partner enquiries", body: "Hand a clinic or brand lead to SkinLabs®. Use Partnerships until it exists.", href: "#enquiries" },
];

const NOT_YET = [
  { item: "Partner keys", when: "Before v1" },
  { item: "api.skinlabs.co.za gateway", when: "Before v1" },
  { item: "Per-key rate limits", when: "Before v1" },
  { item: "Assessments endpoint", when: "Later" },
];

const READINESS = [
  { title: "Gateway", body: "One partner gateway on api.skinlabs.co.za that maps v1 paths to read-only queries." },
  { title: "Keys", body: "Issued per organisation, stored hashed, checked on every request and revocable." },
  { title: "Limits", body: "Per-key rate limiting by tier, with a sandbox on seeded catalogue data." },
  { title: "Data review", body: "A check that nothing exposed through the gateway holds member, payment or analytics rows." },
  { title: "Terms and POPIA", body: "Published partner terms, and a POPIA operator agreement before any clinic sends patient answers to SKYNN." },
];

const FAQS = [
  { q: "Can I call it today?", a: "Only skin weather. It is public, needs no key and allows browser calls from any origin. Everything marked Proposed for v1 cannot be called yet." },
  { q: "Is there a key, a rate limit or a price?", a: "Not yet. Partner keys, rate limits and pricing per tier are proposals. Nothing on this page claims they are enforced today." },
  { q: "Can I send patient details?", a: "No. Never send names, ID numbers or contact details to any endpoint. Clinics keep identifying data on their side and use their own reference ID." },
  { q: "Do I have to credit SkinLabs® or OpenWeather?", a: "Yes. Show “Weather data © OpenWeather” wherever skin weather appears, and the sponsored label on any review where is_sponsored is true." },
  { q: "How do I get early access to v1?", a: "Talk to us through Partnerships or Contact us. We'll tell you honestly where each endpoint stands." },
];

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQS.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })),
};

const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">{children}</code>
);

const Pre = ({ children, label }: { children: string; label: string }) => (
  <pre aria-label={label} className="my-3 overflow-x-auto rounded-xl bg-brand-ink p-4 font-mono text-[13px] leading-relaxed text-brand-ink-foreground">
    {children}
  </pre>
);

const Table = ({ head, rows }: { head: string[]; rows: ReactNode[][] }) => (
  <div className="my-3 overflow-x-auto">
    <table className="w-full min-w-[480px] border-collapse text-sm">
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} className="border-b border-border px-3 py-2 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">{h}</th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} className="border-b border-border px-3 py-2 align-top">{cell}</td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Note = ({ children, tone = "gold" }: { children: ReactNode; tone?: "gold" | "grey" }) => (
  <div className={cn("my-4 rounded-r-xl border-l-4 bg-muted/60 px-4 py-3 text-sm", tone === "gold" ? "border-brand-gold" : "border-muted-foreground/40")}>
    {children}
  </div>
);

/** One endpoint group as a card: the same rounded-2xl panel the Practice Suite feature cards use. */
const Endpoint = ({ status, sigs, children }: { status: Status; sigs: { method: "GET" | "POST"; path: string }[]; children: ReactNode }) => (
  <div className="rounded-2xl border border-border bg-card p-6 md:p-8">
    {sigs.map((sig) => (
      <div key={sig.path} className="mb-2 flex flex-wrap items-baseline gap-2">
        <span className="rounded-md bg-brand-ink px-2 py-0.5 font-mono text-xs font-bold text-brand-ink-foreground">{sig.method}</span>
        <span className="break-all font-mono text-sm font-semibold">{sig.path}</span>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLE[status])}>{STATUS_LABEL[status]}</span>
      </div>
    ))}
    <div className="mt-3 [&_p]:mb-3 [&_p]:text-muted-foreground [&_h3]:mb-1 [&_h3]:mt-6 [&_h3]:font-heading [&_h3]:text-lg [&_h3]:font-semibold">{children}</div>
  </div>
);

const Block = ({ id, eyebrow, title, intro, children, tint }: { id: string; eyebrow: string; title: string; intro?: string; children: ReactNode; tint?: boolean }) => (
  <section id={id} className={cn("scroll-mt-24 py-16 md:py-24", tint && "border-y border-border bg-secondary/10")}>
    <div className="container mx-auto max-w-6xl space-y-8 px-4">
      <div className="max-w-2xl space-y-3">
        <p className="text-sm font-medium uppercase tracking-wider text-primary">{eyebrow}</p>
        <h2 className="text-balance font-heading text-3xl font-bold text-foreground md:text-4xl">{title}</h2>
        {intro && <p className="text-lg text-muted-foreground">{intro}</p>}
      </div>
      {children}
    </div>
  </section>
);

const reviewFields: [string, string, string][] = [
  ["id", "string", "Slug of brand and product name."],
  ["product_name, brand", "string", "Product identity."],
  ["category", "string", "See the category list above."],
  ["local_price_zar", "number", "Price at time of review."],
  ["score_efficacy, score_value, score_texture, score_climate", "number", "0 to 10. score_climate rates performance in SA heat, humidity, sun and dryness."],
  ["verdict", "string", "One or two sentence editorial verdict."],
  ["key_ingredients", "string[]", "Two to six actives named in the source."],
  ["skin_type_match", "string[]", "Skin types the product suits."],
  ["cautions", "string[]", "Warnings stated by the manufacturer only. Empty when none are stated."],
  ["retailers", "object[]", "{retailer, price_zar, in_stock, url}. Only prices that SkinLabs has read from the retailer and verified are included."],
  ["origin", "string", "Where the brand is from."],
  ["is_sponsored", "boolean", "SkinLabs has a commercial interest in this product. Partners must show this disclosure."],
  ["community_rating, community_rating_count", "number or null, integer", "Member star rating snapshot. null until a member rates."],
  ["published_date", "string", "Date the review went live."],
];

const weatherFields: [string, string, string][] = [
  ["city", "string", "The city key you sent."],
  ["cityLabel", "string", "Display name for the city."],
  ["uvNow", "number", "UV index right now."],
  ["uvMax", "number", "Today's maximum UV index, local day."],
  ["uvPeakAt", "string or null", "When today's UV peak occurs. null once the peak has passed."],
  ["humidity", "integer", "Relative humidity right now, percent."],
  ["tempMax", "integer", "Today's forecast high, °C."],
  ["observedAt", "string", "When the weather provider produced the reading."],
  ["fetchedAt", "string", "When SkinLabs last refreshed this city."],
  ["stale", "boolean", "true when the provider is unavailable and a reading up to 6 hours old is being served instead."],
  ["attribution", "string", "Credit line you must display alongside the data."],
];

const PlatformApi = () => {
  const [filter, setFilter] = useState<Status | null>(null);
  const show = (st: Status) => !filter || filter === st;
  const toggle = (st: Status) => setFilter((f) => (f === st ? null : st));

  return (
    <>
      <SEO
        title="SkinLabs® Platform API: South African Skin Intelligence for Clinics and Products"
        description="The SkinLabs Platform API: live skin weather by South African city today, with product reviews, ingredient data and compatibility checks proposed for v1."
        canonical="https://skinlabs.co.za/api"
        jsonLd={faqJsonLd}
      />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          {/* Hero */}
          <section className="bg-brand-ink text-brand-ink-foreground">
            <div className="container mx-auto grid max-w-6xl items-center gap-12 px-4 py-16 md:py-24 lg:grid-cols-2">
              <div className="space-y-6">
                <p className="text-sm font-medium uppercase tracking-wider text-brand-gold">Platform API · v0 preview · October 2026</p>
                <h1 className="text-balance font-heading text-4xl font-bold leading-tight md:text-6xl">
                  South African skin data, <span className="text-brand-gold">ready to build on.</span>
                </h1>
                <p className="max-w-xl text-lg text-brand-ink-foreground/80 md:text-xl">
                  UV and humidity by city, independent reviews scored for local climate, and an ingredient catalogue built for South African skin. One live
                  endpoint today, the rest honestly labelled.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" className="bg-brand-gold text-brand-ink hover:bg-brand-gold/90">
                    <a href="#skin-weather">Try the live endpoint</a>
                  </Button>
                  <Button asChild size="lg" variant="outline" className="border-brand-ink-foreground/30 bg-transparent text-brand-ink-foreground hover:bg-brand-ink-foreground/10 hover:text-brand-ink-foreground">
                    <a href="#resources">See every resource</a>
                  </Button>
                </div>
                <p className="text-sm text-brand-ink-foreground/60">Nothing marked proposed can be called today, and no key, limit or price is enforced yet.</p>
              </div>

              <div className="space-y-3" aria-label="Example request and response for the skin weather endpoint">
                <div className="rounded-2xl bg-card p-5 text-card-foreground shadow-2xl">
                  <div className="flex flex-wrap items-baseline justify-between gap-3 border-b border-border pb-3">
                    <p className="font-heading font-semibold">GET /skin-weather</p>
                    <span className="rounded-full bg-muted px-2.5 py-1 text-xs uppercase tracking-wider text-muted-foreground">Illustrative values</span>
                  </div>
                  <pre className="mt-3 overflow-x-auto font-mono text-[12.5px] leading-relaxed text-foreground">{`?city=johannesburg

{
  "cityLabel": "Johannesburg",
  "uvNow": 9.4,   "uvMax": 11.2,
  "humidity": 28, "tempMax": 27,
  "stale": false,
  "attribution": "Weather data © OpenWeather"
}`}</pre>
                </div>
                <div className="space-y-1 rounded-2xl border border-brand-ink-foreground/15 p-4">
                  <p className="text-xs uppercase tracking-wider text-brand-gold">Shape matches the deployed function</p>
                  <p className="text-sm text-brand-ink-foreground/80">Only the numbers above are made up. Field names and types are the real ones.</p>
                </div>
              </div>
            </div>
          </section>

          {/* Strip */}
          <section className="border-b border-border bg-brand-cream text-brand-cream-foreground">
            <div className="container mx-auto flex max-w-6xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-5 text-sm">
              <span className="text-xs uppercase tracking-wider opacity-70">Built for</span>
              <span className="font-medium">Clinics and practices</span>
              <span className="font-medium">Retailers</span>
              <span className="font-medium">Wellness and booking apps</span>
              <span className="font-medium">Integrators</span>
            </div>
          </section>

          {/* How it works */}
          <section className="py-16 md:py-24">
            <div className="container mx-auto max-w-6xl space-y-10 px-4">
              <div className="max-w-2xl space-y-3">
                <p className="text-sm font-medium uppercase tracking-wider text-primary">The loop</p>
                <h2 className="text-balance font-heading text-3xl font-bold text-foreground md:text-4xl">Four steps, no ceremony.</h2>
                <p className="text-lg text-muted-foreground">Here's the thing: most integrations need one good endpoint, handled properly. So that's where we started.</p>
              </div>
              <ol className="grid gap-6 border-t border-foreground pt-6 sm:grid-cols-2 lg:grid-cols-4">
                {LOOP.map((l) => (
                  <li key={l.n} className="space-y-2">
                    <span className="text-sm tabular-nums text-primary">{l.n}</span>
                    <h3 className="font-heading text-xl font-semibold text-foreground">{l.title}</h3>
                    <p className="text-sm text-muted-foreground">{l.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Resources + filter */}
          <section id="resources" className="scroll-mt-24 border-y border-border bg-secondary/10 py-16 md:py-24">
            <div className="container mx-auto max-w-6xl space-y-10 px-4">
              <div className="max-w-2xl space-y-3">
                <p className="text-sm font-medium uppercase tracking-wider text-primary">Resources</p>
                <h2 className="text-balance font-heading text-3xl font-bold text-foreground md:text-4xl">What's ready today, and what isn't.</h2>
                <p className="text-lg text-muted-foreground">Every resource carries one of two labels. Select a label to filter the reference below.</p>
              </div>
              <div role="group" aria-label="Filter endpoints by status" className="grid gap-3 sm:grid-cols-2">
                {(["live", "proposed"] as Status[]).map((st) => (
                  <button
                    key={st}
                    type="button"
                    aria-pressed={filter === st}
                    onClick={() => toggle(st)}
                    className={cn("rounded-2xl border bg-card p-4 text-left transition-colors hover:bg-accent", filter === st ? "border-foreground ring-1 ring-foreground" : "border-border")}
                  >
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLE[st])}>{STATUS_LABEL[st]}</span>
                    <span className="mt-2 block text-sm text-muted-foreground">
                      {st === "live"
                        ? "Deployed and safe for partners to call now."
                        : "The data exists in SkinLabs®; the partner endpoint does not yet. Nothing marked proposed can be called today."}
                    </span>
                  </button>
                ))}
              </div>
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {RESOURCES.filter((r) => show(r.status)).map((r) => (
                  <a key={r.title} href={r.href} className="card-interactive space-y-3 rounded-2xl border border-border bg-card p-6">
                    <div className="flex items-center justify-between gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-primary">{r.icon}</div>
                      <span className={cn("rounded-full px-2.5 py-1 text-xs uppercase tracking-wider", r.status === "live" ? "bg-brand-ink text-brand-ink-foreground" : STATUS_STYLE.proposed)}>
                        {STATUS_LABEL[r.status]}
                      </span>
                    </div>
                    <h3 className="font-semibold text-foreground">{r.title}</h3>
                    <p className="text-sm text-muted-foreground">{r.body}</p>
                  </a>
                ))}
              </div>
            </div>
          </section>

          {/* Getting started */}
          <Block id="start" eyebrow="Getting started" title="Base URL, keys and conventions." >
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-heading text-lg font-semibold">Base URL</h3>
                <Table
                  head={["Environment", "Base URL", "Status"]}
                  rows={[
                    ["Current", <Code key="c">{FUNCTIONS_BASE}</Code>, "Live"],
                    ["Partner v1", <Code key="p">https://api.skinlabs.co.za/v1</Code>, "Proposed"],
                  ]}
                />
                <p className="text-sm text-muted-foreground">
                  Integrate against the v1 domain once it exists. The current URL exposes the hosting project reference and will change if SkinLabs® ever migrates projects.
                </p>
                <h3 className="mt-4 font-heading text-lg font-semibold">Authentication</h3>
                <p className="text-sm text-muted-foreground">
                  The live skin weather endpoint is public and needs no credentials. Every v1 endpoint will require a partner key, issued per organisation so usage can be metered and revoked independently.
                </p>
                <Pre label="Proposed partner key header">{`X-SkinLabs-Key: sk_partner_live_xxxxxxxxxxxxxxxx`}</Pre>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-heading text-lg font-semibold">Conventions</h3>
                <Table
                  head={["Topic", "Convention"]}
                  rows={[
                    ["Format", "JSON request and response bodies, UTF-8."],
                    ["Money", <>South African rand. Fields end in <Code>_zar</Code>, and a <Code>currency</Code> field reads <Code>"ZAR"</Code>.</>],
                    ["Time", <>ISO 8601 in UTC, e.g. <Code>2026-10-03T10:00:00.000Z</Code>.</>],
                    ["Scores", "0 to 10, one decimal place."],
                    ["Location", "City keys only, never coordinates. Snap the user to the nearest supported city before calling."],
                    ["CORS", "Browser calls to the live endpoint are allowed from any origin."],
                  ]}
                />
              </div>
            </div>
          </Block>

          {show("live") && (
            <Block id="skin-weather" eyebrow="Live" title="Skin weather" tint intro="Today's UV index, UV peak, humidity and forecast high for one South African city. Clinics use it to time SPF reminders and adjust routine advice on high-UV or very dry days.">
              <Endpoint status="live" sigs={[{ method: "GET", path: "/skin-weather?city={city}" }]}>
                <p>
                  <Code>POST</Code> with a JSON body of <Code>{`{"city": "…"}`}</Code> is also accepted and behaves identically.
                </p>
                <h3>Supported cities</h3>
                <Table head={["City key", "Label"]} rows={SA_CITIES.map((c) => [<Code key={c.key}>{c.key}</Code>, c.label])} />
                <h3>Example request</h3>
                <Pre label="cURL example">{`curl "${FUNCTIONS_BASE}/skin-weather?city=cape-town"`}</Pre>
                <Pre label="JavaScript example">{`const res = await fetch(
  "${FUNCTIONS_BASE}/skin-weather?city=cape-town"
);
const weather = await res.json();
if (!res.ok) throw new Error(weather.error); // e.g. "unknown_city"
if (weather.stale) console.info("Cached reading from", weather.fetchedAt);`}</Pre>
                <h3>Response fields</h3>
                <Table head={["Field", "Type", "Description"]} rows={weatherFields.map(([f, t, d]) => [<Code key={f}>{f}</Code>, t, d])} />
                <h3>Errors</h3>
                <Table
                  head={["HTTP", "error", "What to do"]}
                  rows={[
                    ["400", <Code key="a">unknown_city</Code>, "Send one of the ten city keys above."],
                    ["400", <Code key="b">invalid_body</Code>, "The POST body wasn't valid JSON."],
                    ["405", <Code key="c">method_not_allowed</Code>, "Use GET or POST."],
                    ["502", <Code key="d">weather_unavailable</Code>, "The provider failed and no reading under 6 hours old exists. Retry later and hide the card meanwhile."],
                  ]}
                />
                <Note>
                  <strong>Skincare tips aren't included.</strong> The SkinLabs® app turns this reading into advice using each member's own skin profile, which this endpoint never sees. Partners build their own guidance on top of the raw values.
                </Note>
              </Endpoint>
            </Block>
          )}

          {show("proposed") && (
            <>
              <Block id="reviews" eyebrow="Proposed for v1" title="Product reviews" intro="Independent reviews of skincare products sold in South Africa, each scored on efficacy, value, texture and performance in SA climate.">
                <Endpoint status="proposed" sigs={[{ method: "GET", path: "/v1/reviews" }, { method: "GET", path: "/v1/reviews/{id}" }]}>
                  <p>Retailers and clinics can show a SkinLabs® verdict next to a product they stock.</p>
                  <h3>Proposed query parameters</h3>
                  <Table
                    head={["Parameter", "Type", "Description"]}
                    rows={[
                      [<Code key="a">category</Code>, "string", "Product category, e.g. Moisturiser, Serum, Cleanser, Sunscreen."],
                      [<Code key="b">brand</Code>, "string", "Exact brand name."],
                      [<Code key="c">skin_type</Code>, "string", <>Matches against <Code>skin_type_match</Code>.</>],
                      [<Code key="d">origin</Code>, "string", <><Code>south_africa</Code> or <Code>global_available_in_sa</Code>.</>],
                      [<Code key="e">limit, cursor</Code>, "integer, string", "Pagination. Default limit 20, maximum 100."],
                    ]}
                  />
                  <h3>Review object</h3>
                  <Table head={["Field", "Type", "Description"]} rows={reviewFields.map(([f, t, d]) => [<Code key={f}>{f}</Code>, t, d])} />
                  <Note tone="grey">
                    <strong>Not included.</strong> The members-only long-form review and internal pipeline fields stay out of the partner response. Exposing the long-form review would give away a Glow Insider benefit for free.
                  </Note>
                </Endpoint>
              </Block>

              <Block id="catalogue" eyebrow="Proposed for v1" title="Products and ingredients" tint intro="A structured catalogue of products sold in South Africa and the ingredients in them.">
                <Endpoint
                  status="proposed"
                  sigs={[
                    { method: "GET", path: "/v1/products" },
                    { method: "GET", path: "/v1/products/{id}" },
                    { method: "GET", path: "/v1/ingredients?search={term}" },
                    { method: "GET", path: "/v1/ingredients/{slug}" },
                  ]}
                >
                  <p>
                    Integrators can enrich their own product listings, and clinics can look up an active a patient asks about. Ingredient search would reuse the alias-aware search that already powers the{" "}
                    <Link className="underline" to="/ingredients/checker">Ingredient Checker</Link>.
                  </p>
                  <Table
                    head={["Resource", "Contents"]}
                    rows={[
                      ["Products", "Product identity, variants and SkinLabs® scores."],
                      ["Product ingredients", "Ingredient lists linked to each product."],
                      ["Skin-type fit", "Which skin types each product suits."],
                      ["Prices by retailer", "Only prices read from the retailer's own page and recently verified."],
                      ["Brands", "Brand name, origin and profile."],
                      ["Ingredients", "Profiles, aliases and cited sources."],
                    ]}
                  />
                </Endpoint>
              </Block>

              <Block id="interactions" eyebrow="Proposed for v1" title="Ingredient compatibility" intro="Send a list of ingredients and get back any pairs that shouldn't be layered, such as a retinoid with a strong acid.">
                <Endpoint status="proposed" sigs={[{ method: "POST", path: "/v1/interactions/check" }]}>
                  <p>Useful for clinics checking a patient's home routine against an in-clinic treatment.</p>
                  <Pre label="Proposed request">{`POST /v1/interactions/check
X-SkinLabs-Key: sk_partner_live_…
Content-Type: application/json

{ "ingredients": ["retinol", "glycolic acid", "niacinamide"] }`}</Pre>
                  <Pre label="Proposed response">{`{
  "resolved": [
    { "input": "retinol",       "slug": "retinol",       "resolved": true },
    { "input": "glycolic acid", "slug": "glycolic-acid", "resolved": true },
    { "input": "niacinamide",   "slug": "niacinamide",   "resolved": true }
  ],
  "conflicts": [
    { "a": "retinol", "b": "glycolic-acid", "severity": "caution",
      "guidance": "Alternate nights rather than layering." }
  ]
}`}</Pre>
                  <p className="!text-xs">Shape is a proposal. A pair with no sourced rule returns nothing; it is never inferred.</p>
                </Endpoint>
              </Block>

              <Block id="assessments" eyebrow="Proposed for v1" title="SKYNN assessments" tint>
                <Endpoint status="proposed" sigs={[{ method: "POST", path: "/v1/assessments" }, { method: "GET", path: "/v1/assessments/{id}/report" }]}>
                  <p>Would let a clinic submit a patient's questionnaire answers and receive an Advanced AI Dermatology Analysis from SKYNN AI.</p>
                  <Note>
                    <strong>This stays closed until three things are true.</strong> The active prompt set must carry a recorded dermatologist sign-off. The evidence the report cites from must be in place. And a POPIA operator agreement must be signed with each clinic, because the request carries a real patient's health information.
                  </Note>
                </Endpoint>
              </Block>

              <Block id="enquiries" eyebrow="Proposed for v1" title="Partner enquiries">
                <Endpoint status="proposed" sigs={[{ method: "POST", path: "/v1/enquiries" }]}>
                  <p>
                    Would let an integrator's platform hand a clinic or brand lead to SkinLabs®, for example a clinic interested in <Link className="underline" to="/practice-suite">Practice Suite</Link> or a brand asking about Spotlight. Until it exists, use{" "}
                    <Link className="underline" to="/partners">Partnerships</Link> or <Link className="underline" to="/contact">Contact us</Link>.
                  </p>
                </Endpoint>
              </Block>
            </>
          )}

          {/* Errors, caching, limits */}
          <Block id="errors" eyebrow="Reference" title="Errors, caching and limits" tint intro="Every error response is JSON with an error field holding a stable, machine-readable code. Branch on the code, not on the message text.">
            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-2xl border border-border bg-card p-6">
                <Pre label="Error body">{`{ "error": "unknown_city" }`}</Pre>
                <h3 className="font-heading text-lg font-semibold">Caching</h3>
                <p className="text-sm text-muted-foreground">
                  Skin weather readings are cached per city on SkinLabs® side and shared by every caller, so partner traffic never multiplies calls to the weather provider. Responses carry <Code>Cache-Control: public, max-age=600</Code>; cache for up to 10 minutes on your side.
                </p>
              </div>
              <div className="rounded-2xl border border-border bg-card p-6">
                <h3 className="font-heading text-lg font-semibold">Proposed v1 rate limits</h3>
                <Table
                  head={["Tier", "Per minute", "Per day"]}
                  rows={[
                    ["Sandbox", "30", "1,000"],
                    ["Clinic", "120", "20,000"],
                    ["Integrator", "600", "Agreed per contract"],
                  ]}
                />
                <p className="text-sm text-muted-foreground">
                  Over the limit, v1 would return <Code>429</Code> with <Code>{`{"error":"rate_limited"}`}</Code> and a <Code>Retry-After</Code> header in seconds. These limits are a proposal and are not enforced today.
                </p>
              </div>
            </div>
          </Block>

          {/* Usage rules + not yet */}
          <section id="terms" className="scroll-mt-24 py-16 md:py-24">
            <div className="container mx-auto grid max-w-6xl gap-10 px-4 lg:grid-cols-2">
              <div className="space-y-4">
                <p className="text-sm font-medium uppercase tracking-wider text-primary">Usage rules</p>
                <h2 className="text-balance font-heading text-3xl font-bold text-foreground">Credit, disclosure and privacy come with the data.</h2>
                <p className="text-muted-foreground">These rules come from obligations SkinLabs® already carries. Partners inherit them when they display SkinLabs® data.</p>
                <Table
                  head={["Rule", "Why"]}
                  rows={[
                    ["Show “Weather data © OpenWeather” wherever skin weather appears.", "Required by the weather provider's licence."],
                    [<>Show a sponsored label on any review where <Code>is_sponsored</Code> is true.</>, "SkinLabs® has a commercial interest in those products, and hiding it would mislead shoppers."],
                    ["Don't present scores or verdicts as clinical testing or a diagnosis.", "Scores follow a published editorial method, not lab trials."],
                    ["Send city keys, never precise coordinates.", "POPIA. SkinLabs® neither receives nor stores precise location through this API."],
                    ["Don't send patient names, ID numbers or contact details to any endpoint.", "POPIA. Clinics keep identifying data on their side."],
                  ]}
                />
                <p className="flex items-center gap-2 text-sm text-foreground">
                  <ShieldCheck className="h-5 w-5 text-primary" aria-hidden="true" />
                  Read our <Link to="/privacy-policy" className="underline underline-offset-2">privacy policy</Link>.
                </p>
              </div>
              <div className="space-y-4 self-start rounded-3xl bg-brand-ink p-8 text-brand-ink-foreground">
                <p className="text-xs uppercase tracking-wider text-brand-gold">Not built yet</p>
                <p className="text-brand-ink-foreground/80">Not necessarily the list you wanted. It is the honest one.</p>
                <ul>
                  {NOT_YET.map((r) => (
                    <li key={r.item} className="flex justify-between gap-4 border-t border-brand-ink-foreground/15 py-3 last:border-b">
                      <span>{r.item}</span>
                      <span className="whitespace-nowrap text-sm text-brand-gold">{r.when}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-sm text-brand-ink-foreground/60">We'd rather tell you now than put "coming soon" on it and hope.</p>
              </div>
            </div>
          </section>

          {/* Readiness */}
          <section id="readiness" className="scroll-mt-24 border-y border-border bg-secondary/10 py-16 md:py-24">
            <div className="container mx-auto max-w-6xl space-y-10 px-4">
              <div className="max-w-2xl space-y-3">
                <p className="text-sm font-medium uppercase tracking-wider text-primary">Before v1 opens</p>
                <h2 className="text-balance font-heading text-3xl font-bold text-foreground md:text-4xl">What has to exist first.</h2>
                <p className="text-lg text-muted-foreground">None of this is built yet, and there is no launch date. We'll publish one when there is one.</p>
              </div>
              <ol className="grid gap-6 border-t border-foreground pt-6 sm:grid-cols-2 lg:grid-cols-5">
                {READINESS.map((r, i) => (
                  <li key={r.title} className="space-y-2">
                    <span className="text-sm tabular-nums text-primary">{String(i + 1).padStart(2, "0")}</span>
                    <h3 className="font-heading font-semibold text-foreground">{r.title}</h3>
                    <p className="text-sm text-muted-foreground">{r.body}</p>
                  </li>
                ))}
              </ol>
            </div>
          </section>

          {/* Contact */}
          <section id="access" className="py-16 md:py-24">
            <div className="container mx-auto grid max-w-6xl items-center gap-8 px-4 lg:grid-cols-2">
              <div className="space-y-4">
                <p className="text-sm font-medium uppercase tracking-wider text-primary">Early access</p>
                <h2 className="text-balance font-heading text-3xl font-bold text-foreground md:text-4xl">Want v1 when it opens?</h2>
                <p className="text-lg text-muted-foreground">Tell us what you'd build. We'll say honestly where each endpoint stands and whether it fits.</p>
              </div>
              <div className="flex flex-wrap gap-3 lg:justify-end">
                <Button asChild size="lg"><Link to="/partners">Talk to us about partnerships</Link></Button>
                <Button asChild size="lg" variant="outline"><Link to="/contact">Contact us</Link></Button>
              </div>
            </div>
          </section>

          {/* FAQ */}
          <section id="faq" className="pb-16 md:pb-24">
            <div className="container mx-auto max-w-3xl space-y-6 px-4">
              <h2 className="font-heading text-3xl font-bold text-foreground">Questions developers ask first</h2>
              <Accordion type="single" collapsible className="border-t border-foreground">
                {FAQS.map((f) => (
                  <AccordionItem key={f.q} value={f.q}>
                    <AccordionTrigger className="text-left text-lg">{f.q}</AccordionTrigger>
                    <AccordionContent className="text-muted-foreground">{f.a}</AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default PlatformApi;
