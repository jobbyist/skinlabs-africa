import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import NewsroomFeed from "@/components/NewsroomFeed";
import AffiliateBanner from "@/components/AffiliateBanner";
import AdSlot from "@/components/AdSlot";
import SEO from "@/components/SEO";
import { pageSeo, SITE_URL } from "@/lib/seo-config";

const Newsroom = () => {
  const [searchParams] = useSearchParams();
  const page = Math.max(1, Number.parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const seo = pageSeo.briefings;
  const q = searchParams.get("q");
  const sort = searchParams.get("sort");
  const region = searchParams.get("region");

  const canonicalParams = new URLSearchParams();
  if (page > 1) canonicalParams.set("page", String(page));
  if (q) canonicalParams.set("q", q);
  if (sort && sort !== "newest") canonicalParams.set("sort", sort);
  if (region && region !== "all") canonicalParams.set("region", region);
  const qs = canonicalParams.toString();
  const canonical = qs ? `${SITE_URL}/briefings?${qs}` : `${SITE_URL}/briefings`;

  const title =
    page > 1
      ? `The Daily Skinny: Daily SA Skincare Briefings — Page ${page} | SkinLabs®`
      : seo.title;

  const description =
    region && region !== "all"
      ? `SkinLabs® Daily Skinny briefings filtered for ${region}. Evidence-based skincare intelligence for South African climate and skin.`
      : seo.description;

  return (
    <>
      <SEO title={title} description={description} keywords={seo.keywords} canonical={canonical} />
      <Helmet>
        {page > 1 && (
          <link
            rel="prev"
            href={page === 2 ? `${SITE_URL}/briefings` : `${SITE_URL}/briefings?page=${page - 1}`}
          />
        )}
        <link rel="next" href={`${SITE_URL}/briefings?page=${page + 1}`} />
        <meta name="robots" content="index,follow,max-image-preview:large" />
        <script type="application/ld+json">
          {JSON.stringify({
            "@context": "https://schema.org",
            "@type": "CollectionPage",
            name: "The Daily Skinny",
            description: seo.description,
            url: canonical,
            isPartOf: { "@type": "WebSite", name: "SkinLabs®", url: SITE_URL },
            about: {
              "@type": "Thing",
              name: "South African skincare science and climate-aware routines",
            },
          })}
        </script>
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-24">
          <div className="container mx-auto px-4">
            <nav aria-label="Breadcrumb" className="mb-4 text-sm text-muted-foreground">
              <ol className="flex flex-wrap items-center gap-1.5">
                <li>
                  <Link to="/" className="hover:text-foreground hover:underline">
                    Home
                  </Link>
                </li>
                <li aria-hidden="true">/</li>
                <li className="font-medium text-foreground" aria-current="page">
                  The Daily Skinny
                </li>
              </ol>
            </nav>

            <AdSlot placement="briefings-top" compact />
            <NewsroomFeed paginate />

            {page === 1 && (
              <section className="mt-14 max-w-3xl rounded-3xl border border-border bg-card p-6 md:p-8">
                <h2 className="font-heading text-2xl font-bold text-foreground">What is The Daily Skinny</h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    The Daily Skinny is SkinLabs®&apos; running briefing of skincare science — new studies, ingredient
                    controversies, regulatory changes and industry news — read, filtered and translated into what it
                    actually means for South African skin, climate and shelves.
                  </p>
                  <p>
                    New briefings publish most mornings, each a few minutes&apos; read, written by the same editorial
                    team behind SkinLabs&apos;{" "}
                    <Link to="/reviews" className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
                      product reviews
                    </Link>{" "}
                    and{" "}
                    <Link to="/compare" className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
                      Shelf Showdowns
                    </Link>
                    . Every briefing carries an SA context tag showing exactly why it&apos;s relevant here.
                  </p>
                  <p>
                    The Daily Skinny is free to read on the site. Members get it bundled into a monthly PDF
                    magazine as part of their SkinLabs membership.
                  </p>
                </div>
              </section>
            )}

            <AffiliateBanner placement="briefings-bottom" />
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Newsroom;
