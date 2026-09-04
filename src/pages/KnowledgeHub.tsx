import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  AlertTriangle,
  ArrowRight,
  Atom,
  BookOpenCheck,
  ChevronRight,
  Crown,
  Fingerprint,
  FlaskConical,
  Link2,
  ListChecks,
  MapPin,
  MessageCircle,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sun,
  Target,
  X,
  type LucideIcon,
} from "lucide-react";
import { toast } from "sonner";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import AdSlot from "@/components/AdSlot";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { linkifyMoneyBackGuarantee } from "@/lib/moneyBackLink";
import { scoreTextItem } from "@/lib/search-engine";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import { cn } from "@/lib/utils";
import {
  CATEGORIES,
  faqEntries,
  buildFaqJsonLd,
  getPopularEntries,
  getRelatedEntries,
  getEntryBySlug,
  type FAQCategoryId,
  type FAQEntry,
  GLOBAL_SAFETY_NOTICE,
  KNOWLEDGE_HUB_REVIEW_DATE,
} from "@/data/faq";

const ICONS: Record<string, LucideIcon> = {
  Atom,
  Fingerprint,
  FlaskConical,
  Target,
  ListChecks,
  Sun,
  MapPin,
  ShoppingBag,
  Crown,
};

const riskBadge = (risk: FAQEntry["riskLevel"]) => {
  if (risk === "high") return { label: "Read the safety note", className: "bg-destructive/10 text-destructive border-destructive/30" };
  if (risk === "moderate") return { label: "Worth reading in full", className: "bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-500/30" };
  return null;
};

/** Evidence + related-content drawer rendered inside each open accordion item. */
const EntryBody = ({ entry }: { entry: FAQEntry }) => {
  const related = getRelatedEntries(entry);
  const badge = riskBadge(entry.riskLevel);

  return (
    <div className="space-y-4">
      <p className="text-muted-foreground leading-relaxed">{linkifyMoneyBackGuarantee(entry.answer)}</p>

      {entry.safetyNote && (
        <div className="flex gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-sm text-foreground">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-destructive" />
          <p>{entry.safetyNote}</p>
        </div>
      )}

      {entry.evidence.length > 0 && (
        <details className="group rounded-xl border border-border bg-secondary/20 p-3 open:pb-3">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-xs font-semibold text-foreground">
            <BookOpenCheck className="h-3.5 w-3.5 text-primary" />
            Evidence reviewed · {new Date(entry.lastReviewed).toLocaleDateString("en-ZA", { month: "short", year: "numeric" })}
            <ChevronRight className="ml-auto h-3.5 w-3.5 transition-transform group-open:rotate-90" />
          </summary>
          <ul className="mt-2 space-y-2 border-t border-border pt-2">
            {entry.evidence.map((source) => (
              <li key={source.url + source.title} className="text-xs text-muted-foreground">
                <a href={source.url} target="_blank" rel="noopener noreferrer nofollow" className="font-medium text-primary hover:underline">
                  {source.title}
                </a>
                <span className="ml-1.5 rounded-full bg-accent px-1.5 py-0.5 text-[10px] font-semibold uppercase text-accent-foreground">
                  {source.sourceType}
                </span>
                <p className="mt-0.5">{source.supports}</p>
              </li>
            ))}
          </ul>
        </details>
      )}

      {(related.length > 0 || entry.relatedPages.length > 0) && (
        <div className="flex flex-wrap gap-2 pt-1">
          {entry.relatedPages.map((page) => (
            <Link
              key={page.href}
              to={page.href}
              className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-3 py-1 text-xs font-medium text-primary hover:bg-primary/10"
            >
              {page.label}
              <ArrowRight className="h-3 w-3" />
            </Link>
          ))}
          {related.map((rel) => (
            <a
              key={rel.id}
              href={`#${rel.slug}`}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-card px-3 py-1 text-xs text-muted-foreground hover:border-foreground/30 hover:text-foreground"
            >
              {rel.question}
            </a>
          ))}
        </div>
      )}

      {badge && (
        <p className={cn("inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium", badge.className)}>
          <AlertTriangle className="h-3 w-3" /> {badge.label}
        </p>
      )}
    </div>
  );
};

const KnowledgeHub = () => {
  const navigate = useNavigate();
  const { slug: slugParam } = useParams<{ slug?: string }>();
  const [rawQuery, setRawQuery] = useState("");
  const query = useDebouncedValue(rawQuery, 150);
  const hasQuery = query.trim().length > 0;
  const [activeCategory, setActiveCategory] = useState<FAQCategoryId | null>(null);
  const [openValues, setOpenValues] = useState<string[]>([]);
  const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Deep link: /knowledge-hub/:slug opens + scrolls to that entry on load.
  useEffect(() => {
    if (!slugParam) return;
    const entry = getEntryBySlug(slugParam);
    if (!entry) return;
    setActiveCategory(entry.category);
    setOpenValues((prev) => (prev.includes(entry.slug) ? prev : [...prev, entry.slug]));
    const timeout = setTimeout(() => {
      entryRefs.current[entry.slug]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 150);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [slugParam]);

  const scored = useMemo(() => {
    if (!hasQuery) return null;
    return faqEntries
      .map((entry) => ({ entry, match: scoreTextItem(query, entry.question, entry.answer, entry.tags) }))
      .filter((r) => r.match.score > 0)
      .sort((a, b) => b.match.score - a.match.score);
  }, [query, hasQuery]);

  const visibleEntries = useMemo(() => {
    let base = scored ? scored.map((r) => r.entry) : faqEntries;
    if (activeCategory) base = base.filter((e) => e.category === activeCategory);
    return base;
  }, [scored, activeCategory]);

  const grouped = useMemo(() => {
    if (hasQuery) return null; // flat ranked list while searching
    const byCategory = new Map<FAQCategoryId, FAQEntry[]>();
    for (const entry of visibleEntries) {
      const list = byCategory.get(entry.category) ?? [];
      list.push(entry);
      byCategory.set(entry.category, list);
    }
    return CATEGORIES.filter((c) => byCategory.has(c.id)).map((c) => ({ category: c, entries: byCategory.get(c.id)! }));
  }, [visibleEntries, hasQuery]);

  const popular = getPopularEntries();

  const openEntry = (entry: FAQEntry) => {
    setActiveCategory(entry.category);
    setRawQuery("");
    setOpenValues((prev) => (prev.includes(entry.slug) ? prev : [...prev, entry.slug]));
    navigate(`/knowledge-hub/${entry.slug}`, { replace: false });
    requestAnimationFrame(() => entryRefs.current[entry.slug]?.scrollIntoView({ behavior: "smooth", block: "start" }));
  };

  const copyLink = (entry: FAQEntry) => {
    const url = `https://skinlabs.co.za/knowledge-hub/${entry.slug}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(url).then(() => toast.success("Link copied"));
    }
  };

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      buildFaqJsonLd(),
      {
        "@type": "BreadcrumbList",
        itemListElement: [{ "@type": "ListItem", position: 1, name: "Knowledge Hub", item: "https://skinlabs.co.za/knowledge-hub" }],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title="SkinLabs Knowledge Hub — Evidence-Backed Skincare Answers"
        description="Real answers, evidence-backed guidance, built for South African skin, climate and routines. Search skincare questions on ingredients, routines, skin types and the SA market."
        canonical={slugParam ? `https://skinlabs.co.za/knowledge-hub/${slugParam}` : "https://skinlabs.co.za/knowledge-hub"}
        jsonLd={jsonLd}
      />
      <Header />
      <main className="pt-20">
        <section className="py-16 bg-gradient-to-b from-secondary/10 to-background md:py-20">
          <div className="container mx-auto px-4">
            <div className="mx-auto max-w-4xl">
              <div className="mb-10 text-center md:mb-12">
                <div className="mb-6 inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
                  <BookOpenCheck className="h-8 w-8 text-primary" />
                </div>
                <h1 className="mb-4 font-heading text-4xl font-bold text-foreground md:text-5xl">SkinLabs Knowledge Hub</h1>
                <p className="mx-auto max-w-2xl text-lg text-muted-foreground md:text-xl">
                  Real answers. Evidence-backed guidance. Built for South African skin, climate and routines.
                </p>
              </div>

              {/* Safety boundary */}
              <div className="mb-8 flex gap-3 rounded-2xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground">
                <ShieldCheck className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                <p>{GLOBAL_SAFETY_NOTICE}</p>
              </div>

              <div className="my-8">
                <AdSlot placement="knowledge-hub-top" />
              </div>

              {/* Search */}
              <div className="mb-8 rounded-2xl border border-border bg-card p-4 md:p-6">
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                  <input
                    type="text"
                    value={rawQuery}
                    onChange={(e) => setRawQuery(e.target.value)}
                    placeholder="Search skincare questions — retinol, sunscreen, pigmentation…"
                    aria-label="Search the Knowledge Hub"
                    className="w-full rounded-lg border border-border bg-background py-3 pl-12 pr-10 focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                  {rawQuery && (
                    <button
                      onClick={() => setRawQuery("")}
                      aria-label="Clear search"
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {hasQuery && (
                  <p className="mt-3 text-sm text-muted-foreground">
                    {visibleEntries.length === 0
                      ? "No matches yet — try a different ingredient, concern or keyword."
                      : `${visibleEntries.length} result${visibleEntries.length === 1 ? "" : "s"} for "${query}"`}
                  </p>
                )}

                {/* Category filter chips */}
                <div className="mt-4 flex flex-wrap gap-2">
                  <button
                    onClick={() => setActiveCategory(null)}
                    className={cn(
                      "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                      activeCategory === null ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
                    )}
                  >
                    All topics
                  </button>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => setActiveCategory((prev) => (prev === cat.id ? null : cat.id))}
                      className={cn(
                        "rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                        activeCategory === cat.id ? "border-foreground bg-foreground text-background" : "border-border text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {cat.shortLabel}
                    </button>
                  ))}
                </div>
              </div>

              {!hasQuery && !activeCategory && (
                <>
                  {/* Popular questions */}
                  <div className="mb-10">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">Popular questions</h2>
                    <div className="grid gap-3 sm:grid-cols-2">
                      {popular.map((entry) => (
                        <button
                          key={entry.id}
                          onClick={() => openEntry(entry)}
                          className="flex items-center justify-between gap-2 rounded-xl border border-border bg-card p-4 text-left text-sm font-medium text-foreground hover:border-primary/40"
                        >
                          {entry.question}
                          <ArrowRight className="h-4 w-4 shrink-0 text-primary" />
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Browse by topic */}
                  <div className="mb-12">
                    <h2 className="mb-4 text-sm font-semibold uppercase tracking-wider text-primary">Browse by topic</h2>
                    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                      {CATEGORIES.map((cat) => {
                        const Icon = ICONS[cat.icon] ?? Atom;
                        const count = faqEntries.filter((e) => e.category === cat.id).length;
                        return (
                          <button
                            key={cat.id}
                            onClick={() => setActiveCategory(cat.id)}
                            className="flex flex-col items-start gap-2 rounded-2xl border border-border bg-card p-5 text-left hover:border-primary/40"
                          >
                            <span className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                              <Icon className="h-5 w-5" />
                            </span>
                            <span className="font-heading font-semibold text-foreground">{cat.title}</span>
                            <span className="text-xs text-muted-foreground">{cat.description}</span>
                            <span className="text-[11px] font-medium text-primary">{count} question{count === 1 ? "" : "s"}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}

              <div className="mb-10">
                <AdSlot placement="faq-mid" compact />
              </div>

              {/* Results */}
              {grouped ? (
                <div className="space-y-12">
                  {grouped.map(({ category, entries }) => {
                    const Icon = ICONS[category.icon] ?? Atom;
                    return (
                      <div key={category.id} id={category.id}>
                        <div className="mb-6 flex items-center gap-2">
                          <Icon className="h-5 w-5 text-primary" />
                          <h2 className="text-2xl font-bold text-foreground">{category.title}</h2>
                        </div>
                        <Accordion type="multiple" value={openValues} onValueChange={setOpenValues} className="space-y-3">
                          {entries.map((entry) => (
                            <div
                              key={entry.id}
                              id={entry.slug}
                              ref={(el) => {
                                entryRefs.current[entry.slug] = el;
                              }}
                              className="scroll-mt-28 rounded-2xl border border-border bg-card px-5"
                            >
                              <AccordionItem value={entry.slug} className="border-none">
                                <div className="flex items-start gap-2">
                                  <AccordionTrigger className="flex-1 text-left text-base font-semibold text-foreground hover:no-underline">
                                    {entry.question}
                                  </AccordionTrigger>
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      copyLink(entry);
                                    }}
                                    aria-label="Copy link to this question"
                                    className="mt-4 shrink-0 text-muted-foreground hover:text-primary"
                                  >
                                    <Link2 className="h-4 w-4" />
                                  </button>
                                </div>
                                <AccordionContent>
                                  <EntryBody entry={entry} />
                                </AccordionContent>
                              </AccordionItem>
                            </div>
                          ))}
                        </Accordion>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div>
                  <Accordion type="multiple" value={openValues} onValueChange={setOpenValues} className="space-y-3">
                    {visibleEntries.map((entry) => (
                      <div
                        key={entry.id}
                        id={entry.slug}
                        ref={(el) => {
                          entryRefs.current[entry.slug] = el;
                        }}
                        className="scroll-mt-28 rounded-2xl border border-border bg-card px-5"
                      >
                        <AccordionItem value={entry.slug} className="border-none">
                          <div className="flex items-start gap-2">
                            <AccordionTrigger className="flex-1 text-left text-base font-semibold text-foreground hover:no-underline">
                              {entry.question}
                            </AccordionTrigger>
                            <Badge variant="secondary" className="mt-4 shrink-0 text-[10px]">
                              {CATEGORIES.find((c) => c.id === entry.category)?.shortLabel}
                            </Badge>
                          </div>
                          <AccordionContent>
                            <EntryBody entry={entry} />
                          </AccordionContent>
                        </AccordionItem>
                      </div>
                    ))}
                  </Accordion>
                </div>
              )}

              {/* Still have questions CTA */}
              <div className="mt-16 rounded-3xl bg-gradient-to-r from-primary/10 to-secondary/10 p-8 text-center md:p-12">
                <MessageCircle className="mx-auto mb-4 h-12 w-12 text-primary" />
                <h2 className="mb-4 text-2xl font-bold text-foreground">Still have questions?</h2>
                <p className="mx-auto mb-6 max-w-2xl text-muted-foreground">
                  Our support team actually reads their messages — reach out via email, phone or WhatsApp.
                </p>
                <div className="flex flex-wrap justify-center gap-4 text-sm">
                  <a href="mailto:support@skinlabs.co.za" className="font-medium text-primary hover:underline">
                    support@skinlabs.co.za
                  </a>
                  <span className="text-muted-foreground">•</span>
                  <a href="tel:+27128806560" className="font-medium text-primary hover:underline">
                    +27 12 880 6560
                  </a>
                  <span className="text-muted-foreground">•</span>
                  <a href="https://wa.me/27680200749" className="font-medium text-primary hover:underline">
                    WhatsApp
                  </a>
                </div>
                  <div className="my-8">
                    <AdSlot placement="knowledge-hub-bottom" />
                  </div>

                <p className="mt-6 text-xs text-muted-foreground">
                  Content last reviewed {new Date(KNOWLEDGE_HUB_REVIEW_DATE).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" })} by{" "}
                  the SkinLabs Editorial Team.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default KnowledgeHub;
