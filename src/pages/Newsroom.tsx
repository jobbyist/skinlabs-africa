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
  const canonical = page > 1 ? `${SITE_URL}/briefings?page=${page}` : `${SITE_URL}/briefings`;
  const title = page > 1 ? `The Daily Skinny: Daily SA Skincare Briefings — Page ${page} | SkinLabs®` : seo.title;

  return (
    <>
      <SEO title={title} description={seo.description} keywords={seo.keywords} canonical={canonical} />
      {page > 1 && (
        <Helmet>
          <link rel="prev" href={page === 2 ? `${SITE_URL}/briefings` : `${SITE_URL}/briefings?page=${page - 1}`} />
        </Helmet>
      )}

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-24">
          <div className="container mx-auto px-4">
            <AdSlot placement="briefings-top" compact />
            <NewsroomFeed paginate />

            {page === 1 && (
              <section className="mt-14 max-w-3xl rounded-3xl border border-border bg-card p-6 md:p-8">
                <h2 className="font-heading text-2xl font-bold text-foreground">What is The Daily Skinny</h2>
                <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                  <p>
                    The Daily Skinny is SkinLabs®' running briefing of skincare science — new studies, ingredient
                    controversies, regulatory changes and industry news — read, filtered and translated into what it
                    actually means for South African skin, climate and shelves. A study on barrier repair published
                    somewhere isn't useful on its own; what matters is whether it changes what you should be doing
                    on a Highveld winter morning or a humid KwaZulu-Natal afternoon, and whether the products it's
                    relevant to are even sold here.
                  </p>
                  <p>
                    New briefings publish most mornings, each a few minutes' read, written by the same editorial
                    team behind SkinLabs'{" "}
                    <Link to="/reviews" className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
                      product reviews
                    </Link>{" "}
                    and{" "}
                    <Link to="/compare" className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
                      Shelf Showdowns
                    </Link>{" "}
                    — so a briefing about a new niacinamide trial links straight through to the reviews and
                    comparisons where that evidence already shapes our scoring, not off to a generic external
                    source. Every briefing carries an SA context tag showing exactly why it's relevant here, not
                    just a global science recap.
                  </p>
                  <p>
                    The Daily Skinny is free to read on the site. Members get it bundled into a monthly PDF
                    magazine — the same editorial content, collected and formatted for offline reading — as part of
                    their SkinLabs membership.
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
