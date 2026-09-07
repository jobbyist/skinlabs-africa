import { useMemo, useState } from "react";
import { Search, SlidersHorizontal, ShieldCheck } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import AdSlot from "@/components/AdSlot";
import DermatologistCard from "@/components/DermatologistCard";
import PaginationControls from "@/components/PaginationControls";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { usePageParam } from "@/hooks/use-page-param";
import { dermatologists } from "@/data/dermatologists";
import { SITE_URL } from "@/lib/seo-config";

const PAGE_SIZE = 5;
const AD_AFTER_INDEX = 2; // insert one ad unit after the 3rd card on each page

const provinces = Array.from(new Set(dermatologists.map((d) => d.province))).sort();

const DermatologistDirectory = () => {
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("all");
  const [practiceType, setPracticeType] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = usePageParam("page");

  const filtered = useMemo(() => {
    let base = dermatologists;
    if (province !== "all") base = base.filter((d) => d.province === province);
    if (practiceType !== "all") base = base.filter((d) => d.practiceType === practiceType);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      base = base.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q) ||
          d.province.toLowerCase().includes(q),
      );
    }
    return [...base].sort((a, b) => a.name.localeCompare(b.name));
  }, [query, province, practiceType]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageItems = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const goToPage = (p: number) => setPage(p);

  const baseCanonical = `${SITE_URL}/consult`;
  const canonical = currentPage > 1 ? `${baseCanonical}?page=${currentPage}` : baseCanonical;

  const title =
    currentPage > 1
      ? `Find a Trusted Dermatologist in South Africa — Page ${currentPage} | SkinLabs®`
      : "Find a Trusted Dermatologist in South Africa | SkinLabs®";
  const description =
    "Browse SkinLabs' directory of verified South African dermatologists and dermatology practices — real names, cities and provinces across Gauteng, the Western Cape, KwaZulu-Natal and beyond. Message a practitioner or claim your free listing.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "CollectionPage",
        name: "Find a Trusted Dermatologist — SkinLabs Directory",
        description,
        url: canonical,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [{ "@type": "ListItem", position: 1, name: "Consult", item: baseCanonical }],
      },
      {
        "@type": "ItemList",
        name: "SkinLabs Dermatologist Directory",
        numberOfItems: dermatologists.length,
        itemListElement: dermatologists.map((d, index) => ({
          "@type": "ListItem",
          position: index + 1,
          item: {
            "@type": d.practiceType === "practice" ? "MedicalBusiness" : "Physician",
            name: d.name,
            medicalSpecialty: "Dermatology",
            address: {
              "@type": "PostalAddress",
              addressLocality: d.city,
              addressRegion: d.province,
              addressCountry: "ZA",
            },
            ...(d.verified ? { telephone: d.phone, email: d.email } : {}),
          },
        })),
      },
    ],
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={title}
        description={description}
        canonical={canonical}
        ogImage={`${SITE_URL}/og-consult.png`}
        keywords="dermatologist South Africa, find a dermatologist, dermatology directory, skin doctor South Africa, HPCSA dermatologist"
        jsonLd={jsonLd}
      />
      <Header />

      <main className="pt-20 pb-24">
        <div className="container mx-auto px-4">
          <div className="mb-8 max-w-2xl">
            <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Directory</p>
            <h1 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-5xl">
              Find a Trusted Dermatologist
            </h1>
            <p className="text-muted-foreground">
              Browse dermatologists and dermatology practices across South Africa. Every listing is sourced from
              public professional directory records — practitioners with a{" "}
              <span className="inline-flex items-center gap-1 font-medium text-foreground">
                <ShieldCheck className="h-3.5 w-3.5" /> Verified
              </span>{" "}
              badge have contact details confirmed from a public source; others are unclaimed listings routed
              through SkinLabs until the practitioner claims their free profile.
            </p>
          </div>

          {/* Search + filters */}
          <div className="mb-6 flex flex-col gap-3 sm:flex-row">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  goToPage(1);
                }}
                placeholder="Search by name, city or province…"
                className="pl-9"
                aria-label="Search dermatologists"
              />
            </div>
            <Button
              variant="outline"
              className="gap-2 sm:w-auto"
              onClick={() => setFiltersOpen((v) => !v)}
              aria-expanded={filtersOpen}
            >
              <SlidersHorizontal className="h-4 w-4" /> Advanced Filters
            </Button>
          </div>

          {filtersOpen && (
            <div className="mb-6 grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Province</label>
                <Select
                  value={province}
                  onValueChange={(v) => {
                    setProvince(v);
                    goToPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All provinces" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Provinces</SelectItem>
                    {provinces.map((p) => (
                      <SelectItem key={p} value={p}>
                        {p}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-muted-foreground">Listing Type</label>
                <Select
                  value={practiceType}
                  onValueChange={(v) => {
                    setPracticeType(v);
                    goToPage(1);
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Listings</SelectItem>
                    <SelectItem value="practitioner">Dermatologists</SelectItem>
                    <SelectItem value="practice">Practices</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="flex items-end">
                <p className="text-sm text-muted-foreground">
                  Showing {filtered.length} of {dermatologists.length} listings
                </p>
              </div>
            </div>
          )}

          {/* Results */}
          <div className="flex flex-col gap-4">
            {pageItems.map((dermatologist, index) => (
              <div key={dermatologist.id}>
                <DermatologistCard dermatologist={dermatologist} index={index} />
                {index === AD_AFTER_INDEX && index < pageItems.length - 1 && (
                  <div className="my-4">
                    <AdSlot placement="consult-directory-inline" compact />
                  </div>
                )}
              </div>
            ))}
          </div>

          {pageItems.length === 0 && (
            <p className="py-16 text-center text-muted-foreground">No dermatologists match that search yet.</p>
          )}

          <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={goToPage} className="mt-10" />

          <p className="mx-auto mt-10 max-w-3xl text-center text-xs text-muted-foreground">
            SkinLabs does not provide medical diagnosis or treatment. This directory helps you find and contact
            independent, HPCSA-registered dermatology professionals; SkinLabs is not responsible for the medical
            advice or services they provide. Are you a dermatologist or practice owner? Get in touch via our{" "}
            <a href="/partners" className="font-medium text-foreground underline underline-offset-2">
              Partner Program
            </a>{" "}
            to claim and enrich your free listing.
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default DermatologistDirectory;
