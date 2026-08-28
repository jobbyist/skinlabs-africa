import { Link, useParams } from "react-router-dom";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ArrowLeft, ExternalLink, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { getComparison } from "@/data/comparisons";

const EDITORIAL_DISCLAIMER =
  "SKINLABS's views and opinions are independent. This article is not paid or sponsored content. Product information is assessed using publicly available information, ingredient analysis, editorial research and, where applicable, product testing. Prices, availability and formulations may change.";

const ComparisonArticle = () => {
  const { slug } = useParams();
  const article = getComparison(slug ?? "");

  if (!article) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 pt-32 pb-24 text-center">
          <h1 className="font-heading text-2xl font-bold text-foreground">Comparison not found</h1>
          <p className="mt-2 text-muted-foreground">This Shelf Showdown may have been retired or renamed.</p>
          <Button asChild className="mt-6">
            <Link to="/reviews">Back to Reviews</Link>
          </Button>
        </main>
        <Footer />
      </div>
    );
  }

  const canonical = `https://skinlabs.co.za/reviews/versus/${article.slug}`;

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Article",
        headline: article.title,
        description: article.seoDescription,
        image: { "@type": "ImageObject", url: article.thumbnail.url },
        author: { "@type": "Organization", name: "SkinLabs", url: "https://skinlabs.co.za" },
        publisher: {
          "@type": "Organization",
          name: "SkinLabs",
          logo: { "@type": "ImageObject", url: "https://skinlabs.co.za/pwa-512.png" },
        },
        datePublished: article.publishDate,
        dateModified: article.modifiedDate,
        mainEntityOfPage: { "@type": "WebPage", "@id": canonical },
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Reviews", item: "https://skinlabs.co.za/reviews" },
          { "@type": "ListItem", position: 2, name: "Shelf Showdown", item: "https://skinlabs.co.za/reviews#shelf-showdown" },
          { "@type": "ListItem", position: 3, name: article.title, item: canonical },
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={article.seoTitle}
        description={article.seoDescription}
        canonical={canonical}
        ogType="article"
        ogImage={article.thumbnail.url}
        jsonLd={jsonLd}
      />
      <Header />
      <main className="pt-24 pb-24">
        <article className="container mx-auto max-w-3xl px-4">
          <Link to="/reviews" className="mb-6 inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> All reviews
          </Link>

          <span className="inline-flex items-center gap-1 rounded-full bg-accent px-3 py-1 text-[11px] font-semibold text-foreground">
            Shelf Showdown · {article.saContext}
          </span>

          <h1 className="mt-4 font-heading text-3xl font-bold leading-tight text-foreground md:text-4xl">{article.title}</h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">{article.dek}</p>

          <div className="mt-4 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
            <span>{new Date(article.publishDate).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })}</span>
            <span>{article.readingTime}</span>
          </div>

          <figure className="mt-8">
            <img
              src={article.thumbnail.url}
              alt={article.thumbnail.alt}
              className="w-full rounded-3xl object-cover"
              loading="lazy"
            />
            <figcaption className="mt-2 text-xs text-muted-foreground">
              Photo by{" "}
              <a href={article.thumbnail.creditUrl} target="_blank" rel="noreferrer noopener" className="underline">
                {article.thumbnail.creditName}
              </a>{" "}
              on Unsplash
            </figcaption>
          </figure>

          {/* Products compared — required product & brand links */}
          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            {article.productsCompared.map((product) => (
              <div key={`${product.brand}-${product.name}`} className="rounded-2xl border border-border bg-card p-4">
                <p className="text-xs uppercase tracking-wide text-muted-foreground">{product.brand}</p>
                <p className="font-heading font-bold text-foreground">{product.name}</p>
                <p className="mt-1 text-sm text-muted-foreground">R{product.priceZar}</p>
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  {product.reviewSlug && (
                    <Link to={`/reviews/${product.reviewSlug}`} className="inline-flex items-center gap-1 text-primary hover:underline">
                      Full SkinLabs review <ExternalLink className="h-3 w-3" />
                    </Link>
                  )}
                  <a href={product.officialBrandUrl} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-primary hover:underline">
                    Official {product.brand} site <ExternalLink className="h-3 w-3" />
                  </a>
                  {product.retailer && (
                    <a href={product.retailer.url} target="_blank" rel="noreferrer noopener" className="inline-flex items-center gap-1 text-primary hover:underline">
                      {product.retailer.label} <ExternalLink className="h-3 w-3" />
                    </a>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Body */}
          <div className="prose prose-neutral mt-10 max-w-none dark:prose-invert prose-headings:font-heading prose-headings:text-foreground prose-p:text-muted-foreground prose-li:text-muted-foreground prose-strong:text-foreground prose-a:text-primary prose-table:text-sm">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{article.bodyMarkdown}</ReactMarkdown>
          </div>

          {/* Better-for verdicts — never a universal winner */}
          <div className="mt-10">
            <h2 className="mb-4 font-heading text-lg font-bold text-foreground">Which one actually makes sense for you</h2>
            <div className="grid gap-3 sm:grid-cols-2">
              {article.verdicts.map((verdict) => (
                <div key={verdict.label} className="rounded-2xl border border-border bg-card p-4">
                  <p className="text-sm font-semibold text-foreground">{verdict.label}</p>
                  <p className="mt-1 text-sm text-muted-foreground">{verdict.text}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Key takeaways */}
          <div className="mt-10 rounded-3xl border border-border bg-card p-6">
            <h2 className="mb-3 font-heading text-lg font-bold text-foreground">Key takeaways</h2>
            <ul className="space-y-2">
              {article.keyTakeaways.map((t) => (
                <li key={t} className="flex gap-2 text-sm text-muted-foreground">
                  <span aria-hidden="true" className="mt-2 h-1 w-1 shrink-0 rounded-full bg-primary" />
                  {t}
                </li>
              ))}
            </ul>
          </div>

          {/* Editorial independence disclaimer */}
          <div className="mt-8 flex gap-3 rounded-2xl border border-border bg-secondary/30 p-4 text-xs text-muted-foreground">
            <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
            <p><span className="font-semibold text-foreground">Editorial disclaimer:</span> {EDITORIAL_DISCLAIMER}</p>
          </div>
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default ComparisonArticle;
