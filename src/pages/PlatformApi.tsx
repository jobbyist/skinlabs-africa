import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { Code2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { cn } from "@/lib/utils";
import { SA_CITIES } from "@/lib/skinWeather/cities";

type Status = "live" | "proposed";

const FUNCTIONS_BASE = "https://gnkpzijxuciiaamakgzm.supabase.co/functions/v1";

const STATUS_STYLE: Record<Status, string> = {
  live: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  proposed: "border border-dashed border-border text-muted-foreground",
};
const STATUS_LABEL: Record<Status, string> = { live: "Live", proposed: "Proposed for v1" };

const NAV: { id: string; label: string; status?: Status }[] = [
  { id: "overview", label: "Overview" },
  { id: "start", label: "Getting started" },
  { id: "skin-weather", label: "Skin weather", status: "live" },
  { id: "reviews", label: "Product reviews", status: "proposed" },
  { id: "catalogue", label: "Products and ingredients", status: "proposed" },
  { id: "interactions", label: "Ingredient compatibility", status: "proposed" },
  { id: "assessments", label: "SKYNN assessments", status: "proposed" },
  { id: "enquiries", label: "Partner enquiries", status: "proposed" },
  { id: "errors", label: "Errors and caching" },
  { id: "terms", label: "Usage rules" },
  { id: "readiness", label: "Before v1 opens" },
];

const Code = ({ children }: { children: ReactNode }) => (
  <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px] text-foreground">{children}</code>
);

const Pre = ({ children, label }: { children: string; label: string }) => (
  <pre
    aria-label={label}
    className="my-3 overflow-x-auto rounded-xl bg-neutral-900 p-4 font-mono text-[13px] leading-relaxed text-neutral-100"
  >
    {children}
  </pre>
);

const Table = ({ head, rows }: { head: string[]; rows: ReactNode[][] }) => (
  <div className="my-3 overflow-x-auto">
    <table className="w-full min-w-[480px] border-collapse text-sm">
      <thead>
        <tr>
          {head.map((h) => (
            <th key={h} className="border-b border-border px-3 py-2 text-left text-xs font-semibold text-muted-foreground">
              {h}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {rows.map((row, i) => (
          <tr key={i}>
            {row.map((cell, j) => (
              <td key={j} className="border-b border-border px-3 py-2 align-top">
                {cell}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
    </table>
  </div>
);

const Note = ({ children, tone = "amber" }: { children: ReactNode; tone?: "amber" | "grey" }) => (
  <div
    className={cn(
      "my-4 rounded-r-xl border-l-4 bg-muted/60 px-4 py-3 text-sm",
      tone === "amber" ? "border-amber-500" : "border-muted-foreground/40",
    )}
  >
    {children}
  </div>
);

const Endpoint = ({
  status,
  sigs,
  children,
}: {
  status: Status;
  sigs: { method: "GET" | "POST"; path: string }[];
  children: ReactNode;
}) => (
  <div className={cn("relative border-l-[6px] pl-5", status === "live" ? "border-amber-500" : "border-dashed border-muted-foreground/50")}>
    {sigs.map((s) => (
      <div key={s.path} className="mb-2 flex flex-wrap items-baseline gap-2">
        <span className="rounded-md bg-foreground px-2 py-0.5 font-mono text-xs font-bold text-background">{s.method}</span>
        <span className="break-all font-mono text-sm font-semibold">{s.path}</span>
        <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLE[status])}>{STATUS_LABEL[status]}</span>
      </div>
    ))}
    {children}
  </div>
);

const Section = ({ id, title, children }: { id: string; title: string; children: ReactNode }) => (
  <section id={id} className="mb-16 scroll-mt-28 [&_p]:mb-3 [&_p]:max-w-[70ch] [&_p]:text-muted-foreground [&_h3]:mb-1 [&_h3]:mt-6 [&_h3]:font-heading [&_h3]:text-lg [&_h3]:font-semibold">
    {id === "overview" ? (
      <h1 className="mb-3 font-heading text-3xl font-bold leading-tight tracking-tight md:text-4xl">{title}</h1>
    ) : (
      <h2 className="mb-3 font-heading text-2xl font-bold tracking-tight">{title}</h2>
    )}
    {children}
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
  const show = (s: Status) => !filter || filter === s;
  const toggle = (s: Status) => setFilter((f) => (f === s ? null : s));

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="SkinLabs® Platform API — South African Skin Intelligence for Clinics and Products"
        description="The SkinLabs Platform API: live skin weather by South African city today, with product reviews, ingredient data and compatibility checks proposed for v1."
        canonical="https://skinlabs.co.za/api"
      />
      <Header />
      <main className="pt-20">
        <div className="container mx-auto grid gap-10 px-4 py-10 lg:grid-cols-[220px_minmax(0,1fr)]">
          <nav aria-label="API contents" className="lg:sticky lg:top-28 lg:self-start">
            <p className="mb-2 flex items-center gap-2 font-heading text-base font-bold">
              <Code2 className="h-4 w-4" aria-hidden /> Platform API
            </p>
            <p className="mb-3 text-xs text-muted-foreground">v0 preview · October 2026</p>
            <ol className="flex flex-wrap gap-1 lg:block lg:space-y-0.5">
              {NAV.map((n) => (
                <li key={n.id}>
                  <a
                    href={`#${n.id}`}
                    className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
                  >
                    {n.status && (
                      <span
                        aria-hidden
                        className={cn("h-2 w-2 shrink-0 rounded-full", n.status === "live" ? "bg-amber-500" : "border border-dashed border-muted-foreground")}
                      />
                    )}
                    {n.label}
                  </a>
                </li>
              ))}
            </ol>
          </nav>

          <div className="min-w-0 max-w-[860px]">
            <Section id="overview" title="SkinLabs® Platform API">
              <p className="!text-lg">
                <strong className="text-foreground">Build South African skin intelligence into your clinic or product.</strong>{" "}
                The SkinLabs Platform API gives clinics, retailers and integrators access to SA-specific skin data: UV and humidity by city,
                independent product reviews scored for local climate, and an ingredient catalogue built for melanin-rich skin and
                Highveld-to-coastal conditions.
              </p>

              <Pre label="Example request and response for the skin weather endpoint">{`GET ${FUNCTIONS_BASE}/skin-weather?city=johannesburg

{
  "city": "johannesburg",  "cityLabel": "Johannesburg",
  "uvNow": 9.4,  "uvMax": 11.2,  "uvPeakAt": "2026-10-03T10:00:00.000Z",
  "humidity": 28,  "tempMax": 27,
  "fetchedAt": "2026-10-03T08:41:12.000Z",  "stale": false,
  "attribution": "Weather data © OpenWeather"
}`}</Pre>
              <p className="!text-xs">Response values are illustrative; the shape matches the deployed function.</p>

              <h3>What's ready today, and what isn't</h3>
              <p>Every endpoint carries one of two labels. Select a label to filter the reference.</p>
              <div role="group" aria-label="Filter endpoints by status" className="grid gap-3 sm:grid-cols-2">
                {(["live", "proposed"] as Status[]).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-pressed={filter === s}
                    onClick={() => toggle(s)}
                    className={cn(
                      "rounded-xl border bg-card p-4 text-left transition-colors hover:bg-accent",
                      filter === s ? "border-foreground ring-1 ring-foreground" : "border-border",
                    )}
                  >
                    <span className={cn("rounded-full px-2.5 py-0.5 text-xs font-semibold", STATUS_STYLE[s])}>{STATUS_LABEL[s]}</span>
                    <span className="mt-2 block text-sm text-muted-foreground">
                      {s === "live"
                        ? "Deployed and safe for partners to call now."
                        : "The data exists in SkinLabs; the partner endpoint does not yet. Nothing marked proposed can be called today."}
                    </span>
                  </button>
                ))}
              </div>
              <Note tone="grey">
                <strong>How this was compiled.</strong> Endpoint behaviour for skin weather is taken from the deployed function source. Data shapes
                for proposed endpoints come from the tables and review pipeline that already hold this data. Nothing here claims a proposed
                endpoint, key or rate limit exists yet.
              </Note>
            </Section>

            <Section id="start" title="Getting started">
              <h3>Base URL</h3>
              <Table
                head={["Environment", "Base URL", "Status"]}
                rows={[
                  ["Current", <Code key="c">{FUNCTIONS_BASE}</Code>, "Live"],
                  ["Partner v1", <Code key="p">https://api.skinlabs.co.za/v1</Code>, "Proposed"],
                ]}
              />
              <p>
                Partners should integrate against the v1 domain once it exists. The current URL exposes the hosting project reference and will
                change if SkinLabs ever migrates projects.
              </p>
              <h3>Authentication</h3>
              <p>
                The live skin weather endpoint is public and needs no credentials. Every v1 endpoint will require a partner key sent as a header,
                issued per organisation so usage can be metered and revoked independently.
              </p>
              <Pre label="Proposed partner key header">{`X-SkinLabs-Key: sk_partner_live_xxxxxxxxxxxxxxxx`}</Pre>
              <h3>Conventions</h3>
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
            </Section>

            {show("live") && (
              <Section id="skin-weather" title="Skin weather">
                <Endpoint status="live" sigs={[{ method: "GET", path: "/skin-weather?city={city}" }]}>
                  <p>
                    Returns today's UV index, UV peak, humidity and forecast high for one South African city. Clinics use it to time SPF reminders
                    and adjust routine advice on high-UV or very dry days. <Code>POST</Code> with a JSON body of <Code>{`{"city": "…"}`}</Code> is also
                    accepted and behaves identically.
                  </p>
                  <h3>Supported cities</h3>
                  <Table
                    head={["City key", "Label"]}
                    rows={SA_CITIES.map((c) => [<Code key={c.key}>{c.key}</Code>, c.label])}
                  />
                  <h3>Example request</h3>
                  <Pre label="cURL example">{`curl "${FUNCTIONS_BASE}/skin-weather?city=cape-town"`}</Pre>
                  <Pre label="JavaScript example">{`const res = await fetch(
  "${FUNCTIONS_BASE}/skin-weather?city=cape-town"
);
const weather = await res.json();
if (!res.ok) throw new Error(weather.error); // e.g. "unknown_city"
if (weather.stale) console.info("Cached reading from", weather.fetchedAt);`}</Pre>
                  <h3>Response fields</h3>
                  <Table
                    head={["Field", "Type", "Description"]}
                    rows={weatherFields.map(([f, t, d]) => [<Code key={f}>{f}</Code>, t, d])}
                  />
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
                    <strong>Skincare tips aren't included.</strong> The SkinLabs app turns this reading into advice using each member's own skin
                    profile, which this endpoint never sees. Partners build their own guidance on top of the raw values.
                  </Note>
                </Endpoint>
              </Section>
            )}

            {show("proposed") && (
              <>
                <Section id="reviews" title="Product reviews">
                  <Endpoint
                    status="proposed"
                    sigs={[
                      { method: "GET", path: "/v1/reviews" },
                      { method: "GET", path: "/v1/reviews/{id}" },
                    ]}
                  >
                    <p>
                      Independent reviews of skincare products sold in South Africa, each scored on efficacy, value, texture and performance in SA
                      climate. Retailers and clinics can show a SkinLabs verdict next to a product they stock.
                    </p>
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
                    <Table
                      head={["Field", "Type", "Description"]}
                      rows={reviewFields.map(([f, t, d]) => [<Code key={f}>{f}</Code>, t, d])}
                    />
                    <Note tone="grey">
                      <strong>Not included.</strong> The members-only long-form review and internal pipeline fields stay out of the partner response.
                      Exposing the long-form review would give away a Glow Insider benefit for free.
                    </Note>
                  </Endpoint>
                </Section>

                <Section id="catalogue" title="Products and ingredients">
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
                      A structured catalogue of products sold in South Africa and the ingredients in them. Integrators can enrich their own
                      product listings, and clinics can look up an active a patient asks about. Ingredient search would reuse the alias-aware
                      search that already powers the <Link className="underline" to="/ingredients/checker">Ingredient Checker</Link>.
                    </p>
                    <Table
                      head={["Resource", "Contents"]}
                      rows={[
                        ["Products", "Product identity, variants and SkinLabs scores."],
                        ["Product ingredients", "Ingredient lists linked to each product."],
                        ["Skin-type fit", "Which skin types each product suits."],
                        ["Prices by retailer", "Only prices read from the retailer's own page and recently verified."],
                        ["Brands", "Brand name, origin and profile."],
                        ["Ingredients", "Profiles, aliases and cited sources."],
                      ]}
                    />
                  </Endpoint>
                </Section>

                <Section id="interactions" title="Ingredient compatibility">
                  <Endpoint status="proposed" sigs={[{ method: "POST", path: "/v1/interactions/check" }]}>
                    <p>
                      Send a list of ingredients and get back any pairs that shouldn't be layered, such as a retinoid with a strong acid. This is
                      useful for clinics checking a patient's home routine against an in-clinic treatment.
                    </p>
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
                </Section>

                <Section id="assessments" title="SKYNN assessments">
                  <Endpoint
                    status="proposed"
                    sigs={[
                      { method: "POST", path: "/v1/assessments" },
                      { method: "GET", path: "/v1/assessments/{id}/report" },
                    ]}
                  >
                    <p>Would let a clinic submit a patient's questionnaire answers and receive an Advanced AI Dermatology Analysis from SKYNN AI.</p>
                    <Note>
                      <strong>This stays closed until three things are true.</strong> The active prompt set must carry a recorded dermatologist
                      sign-off. The evidence the report cites from must be in place. And a POPIA operator agreement must be signed with each
                      clinic, because the request carries a real patient's health information.
                    </Note>
                  </Endpoint>
                </Section>

                <Section id="enquiries" title="Partner enquiries">
                  <Endpoint status="proposed" sigs={[{ method: "POST", path: "/v1/enquiries" }]}>
                    <p>
                      Would let an integrator's platform hand a clinic or brand lead to SkinLabs, for example a clinic interested in Practice Suite or
                      a brand asking about Spotlight. Until it exists, use <Link className="underline" to="/partners">Partnerships</Link> or{" "}
                      <Link className="underline" to="/contact">Contact us</Link>.
                    </p>
                  </Endpoint>
                </Section>
              </>
            )}

            <Section id="errors" title="Errors and caching">
              <p>
                Every error response is JSON with an <Code>error</Code> field holding a stable, machine-readable code. Branch on the code, not on
                the HTTP message text.
              </p>
              <Pre label="Error body">{`{ "error": "unknown_city" }`}</Pre>
              <h3>Caching</h3>
              <p>
                Skin weather readings are cached per city on SkinLabs' side and shared by every caller, so partner traffic never multiplies calls to
                the weather provider. Responses carry <Code>Cache-Control: public, max-age=600</Code>; cache for up to 10 minutes on your side.
              </p>
              <h3>Proposed v1 rate limits</h3>
              <Table
                head={["Tier", "Requests per minute", "Requests per day"]}
                rows={[
                  ["Sandbox", "30", "1,000"],
                  ["Clinic", "120", "20,000"],
                  ["Integrator", "600", "Agreed per contract"],
                ]}
              />
              <p>
                Over the limit, v1 would return <Code>429</Code> with <Code>{`{"error":"rate_limited"}`}</Code> and a <Code>Retry-After</Code> header
                in seconds. These limits are a proposal and are not enforced today.
              </p>
            </Section>

            <Section id="terms" title="Usage rules">
              <p>These rules come from obligations SkinLabs already carries. Partners inherit them when they display SkinLabs data.</p>
              <Table
                head={["Rule", "Why"]}
                rows={[
                  ["Show “Weather data © OpenWeather” wherever skin weather appears.", "Required by the weather provider's licence."],
                  [<>Show a sponsored label on any review where <Code>is_sponsored</Code> is true.</>, "SkinLabs has a commercial interest in those products, and hiding it would mislead shoppers."],
                  ["Don't present scores or verdicts as clinical testing or a diagnosis.", "SkinLabs scores follow a published editorial method, not lab trials, and its text deliberately avoids naming conditions."],
                  ["Send city keys, never precise coordinates.", "POPIA. SkinLabs neither receives nor stores precise location through this API."],
                  ["Don't send patient names, ID numbers or contact details to any endpoint.", "POPIA. Clinics keep identifying data on their side and use their own reference ID."],
                ]}
              />
            </Section>

            <Section id="readiness" title="Before v1 opens">
              <p>What has to exist before the first partner clinic can use the proposed endpoints. None of this is built yet.</p>
              <ul className="list-disc space-y-2 pl-5 text-sm text-muted-foreground">
                <li>A single partner gateway on <Code>api.skinlabs.co.za</Code> that maps v1 paths to read-only queries.</li>
                <li>Partner keys: issued per organisation, stored hashed, checked on every request and revocable.</li>
                <li>Per-key rate limiting by tier.</li>
                <li>A review that the catalogue data exposed through the gateway contains no member, payment or analytics rows.</li>
                <li>A POPIA operator agreement, needed before any clinic sends patient questionnaire data to SKYNN.</li>
                <li>Published partner terms covering attribution, sponsored disclosure, no-diagnosis framing and pricing per tier.</li>
                <li>A sandbox with seeded catalogue data.</li>
              </ul>
              <p className="mt-4">
                Interested in early access?{" "}
                <Link className="underline" to="/partners">Talk to us about partnerships</Link>.
              </p>
            </Section>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PlatformApi;
