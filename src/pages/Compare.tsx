import { Helmet } from "react-helmet-async";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { comparisonArticles } from "@/data/comparisons";
import { featuredEditorials } from "@/data/editorials";
import AffiliateBanner from "@/components/AffiliateBanner";
import AdSlot from "@/components/AdSlot";
import PaginationControls from "@/components/PaginationControls";
import { usePageParam } from "@/hooks/use-page-param";

const SHOWDOWN_PAGE_SIZE = 5;

const Compare = () => {
  const comingSoonExtras = featuredEditorials.filter(
    (e) => e.comingSoon && !comparisonArticles.some((c) => c.slug === e.slug),
  );
  const allShowdowns = [...comparisonArticles, ...comingSoonExtras];
  const [page, setPage] = usePageParam("page");
  const totalPages = Math.max(1, Math.ceil(allShowdowns.length / SHOWDOWN_PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pagedShowdowns = allShowdowns.slice(
    (currentPage - 1) * SHOWDOWN_PAGE_SIZE,
    currentPage * SHOWDOWN_PAGE_SIZE,
  );
  const canonical =
    currentPage > 1 ? `https://skinlabs.co.za/compare?page=${currentPage}` : "https://skinlabs.co.za/compare";

  return (
    <>
      <Helmet>
        <title>
          {currentPage > 1
            ? `Shelf Showdown — Page ${currentPage} | SkinLabs`
            : "Shelf Showdown — Head-to-Head SA Skincare Comparisons | SkinLabs"}
        </title>
        <meta
          name="description"
          content="Shelf Showdown: evidence-first head-to-head comparisons of South African skincare products. Actives, evidence and Rand value — no universal winners."
        />
        <link rel="canonical" href={canonical} />
        {currentPage > 1 && <link rel="prev" href={currentPage === 2 ? "https://skinlabs.co.za/compare" : `https://skinlabs.co.za/compare?page=${currentPage - 1}`} />}
        {currentPage < totalPages && <link rel="next" href={`https://skinlabs.co.za/compare?page=${currentPage + 1}`} />}
        <meta property="og:title" content="Shelf Showdown — SA Skincare Comparisons | SkinLabs" />
        <meta
          property="og:description"
          content="Two products, one shelf, no universal winner. Head-to-head comparisons grounded in evidence and local value."
        />
        <meta property="og:url" content="https://skinlabs.co.za/compare" />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20 pb-20">
          <section className="container mx-auto px-4">
            <div className="mb-4">
              <AdSlot placement="compare-top" compact />
            </div>
            <div className="mb-8 max-w-2xl">
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Shelf Showdown</p>
              <h1 className="mb-3 font-heading text-3xl font-bold text-foreground md:text-5xl">
                Two products, one shelf, no universal winner
              </h1>
              <p className="text-muted-foreground">
                Head-to-head comparisons on the actives, the evidence and the Rand value — so you know which one
                actually makes sense for your skin, not just which one has the bigger marketing budget.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {pagedShowdowns.map((item) =>
                "bodyMarkdown" in item ? (
                  <Link
                    key={item.slug}
                    to={`/reviews/versus/${item.slug}`}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-colors hover:border-foreground/30"
                  >
                    <img
                      src={item.thumbnail.url}
                      alt={item.thumbnail.alt}
                      loading="lazy"
                      className="h-48 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="flex flex-1 flex-col p-6">
                      <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground">
                        {item.saContext}
                      </span>
                      <h2 className="font-heading text-lg font-bold leading-snug text-foreground">{item.title}</h2>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{item.dek}</p>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground">
                        Read the showdown{" "}
                        <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                ) : (
                  <Link
                    key={item.slug}
                    to={item.href}
                    className="group flex flex-col overflow-hidden rounded-3xl border border-border bg-card transition-colors hover:border-foreground/30"
                  >
                    <div className="relative">
                      <img
                        src={item.thumbnailUrl}
                        alt={item.thumbnailAlt}
                        loading="lazy"
                        className="h-48 w-full object-cover opacity-90"
                      />
                      <span className="absolute left-3 top-3 rounded-full bg-foreground px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-background">
                        Coming soon
                      </span>
                    </div>
                    <div className="flex flex-1 flex-col p-6">
                      <span className="mb-2 inline-flex w-fit items-center gap-1 rounded-full bg-muted px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wide text-foreground">
                        {item.saContext}
                      </span>
                      <h2 className="font-heading text-lg font-bold leading-snug text-foreground">{item.title}</h2>
                      <p className="mt-2 flex-1 text-sm leading-relaxed text-muted-foreground">{item.dek}</p>
                      <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-foreground">
                        View details <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </Link>
                ),
              )}
            </div>
            <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={setPage} className="mt-8" />
          </section>

          <section className="container mx-auto mt-14 px-4">
            <div className="mx-auto max-w-3xl rounded-3xl border border-border bg-card p-6 md:p-8">
              <h2 className="font-heading text-2xl font-bold text-foreground">How Shelf Showdown works</h2>
              <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground">
                <p>
                  Every Shelf Showdown pairs two products that a South African shopper would genuinely be choosing
                  between — the same category, a similar core active or claim, and usually a meaningful price gap,
                  because "which one is actually worth it" is the question we're answering. We don't pit a serum
                  against a moisturiser to manufacture drama, and we don't run a comparison until both products have
                  already been through their own full{" "}
                  <Link to="/reviews" className="font-medium text-foreground underline underline-offset-2 hover:text-primary">
                    SkinLabs review
                  </Link>
                  .
                </p>
                <p>
                  Each showdown breaks the pair down on the things that decide whether a product earns a place on
                  your shelf: active ingredient concentration and formulation quality, how each performed in its
                  SkinLabs review score, and Rand-for-Rand value once you account for pack size and how long a tube
                  or bottle actually lasts. We're explicit when the answer is "it depends on your skin, budget or
                  climate" rather than forcing a single winner — a clinic-tier retinoid and a budget-tier one can
                  both be the right call for different people, and pretending otherwise wouldn't be honest reviewing.
                </p>
                <p>
                  As with every SkinLabs review, there's no paid placement in a Shelf Showdown outcome: neither
                  product's brand has any say in which one comes out ahead, and the same evidence and scoring
                  standard applies whether we're comparing a R150 drugstore find or a R1,200 clinic exclusive.
                </p>
              </div>
            </div>
          </section>
        </main>
        <div className="container mx-auto px-4 pb-8">
          <AffiliateBanner placement="compare-bottom" />
        </div>
        <Footer />
      </div>
    </>
  );
};

export default Compare;
