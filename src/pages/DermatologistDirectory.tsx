import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  Search,
  AlertCircle,
  CheckCircle2,
  Circle,
  Clock,
  Sparkles,
  MessageSquare,
  CalendarDays,
  Star,
  Video,
  Shield,
  Brain,
  X,
  SlidersHorizontal,
  ShieldCheck,
} from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import AdSlot from "@/components/AdSlot";
import DermatologistCard from "@/components/DermatologistCard";
import PaginationControls from "@/components/PaginationControls";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Textarea } from "@/components/ui/textarea";
import { usePageParam } from "@/hooks/use-page-param";
import { dermatologists, type DirectoryCategory } from "@/data/dermatologists";
import { SITE_URL } from "@/lib/seo-config";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 6;
const LAUNCH_DATE = new Date("2026-09-25T00:00:00+02:00");
const provinces = Array.from(new Set(dermatologists.map((d) => d.province))).sort();
type CategoryFilter = "all" | DirectoryCategory;

interface RoadmapItem {
  id: string;
  title: string;
  description: string;
  status: "completed" | "in_progress" | "planned";
  eta?: string;
  icon: typeof MessageSquare;
}

const ROADMAP: RoadmapItem[] = [
  { id: "directory-v1", title: "Public directory prototype", description: "Browseable listings with Medical / Cosmetic filters and profile cards.", status: "completed", icon: Search },
  { id: "ratings", title: "Dermatologist profile rating system", description: "Verified patient ratings and review counts on every listing.", status: "in_progress", eta: "Sep 2026", icon: Star },
  { id: "messaging", title: "Encrypted in-app messaging", description: "End-to-end encrypted chat between members and practitioners.", status: "planned", eta: "Oct 2026", icon: MessageSquare },
  { id: "booking", title: "Booking calendars + secure payments", description: "Real-time availability, deposits and online payment support.", status: "planned", eta: "Oct 2026", icon: CalendarDays },
  { id: "video", title: "Remote / virtual video consultations", description: "In-platform video consult interface for Glow Insider & VIP.", status: "planned", eta: "Nov 2026", icon: Video },
  { id: "claim", title: "Profile claim / removal request form", description: "Unverified listing claim flow and removal requests for practitioners.", status: "planned", eta: "Sep 2026", icon: Shield },
  { id: "ai-summaries", title: "AI-generated consultation summaries", description: "Post-consult summaries and follow-up recommendations powered by SKYNN AI.", status: "planned", eta: "Dec 2026", icon: Brain },
];

function useCountdown(target: Date) {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const diff = Math.max(0, target.getTime() - now.getTime());
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((diff / (1000 * 60)) % 60);
  const seconds = Math.floor((diff / 1000) % 60);
  return { days, hours, minutes, seconds, launched: diff === 0 };
}

const DermatologistDirectory = () => {
  const [query, setQuery] = useState("");
  const [province, setProvince] = useState("all");
  const [category, setCategory] = useState<CategoryFilter>("all");
  const [practiceType, setPracticeType] = useState("all");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [page, setPage] = usePageParam("page");
  const countdown = useCountdown(LAUNCH_DATE);

  const [surveyStep, setSurveyStep] = useState(0);
  const [sentiment, setSentiment] = useState<number | null>(null);
  const [bookingPriority, setBookingPriority] = useState<number | null>(null);
  const [trustScore, setTrustScore] = useState<number | null>(null);
  const [primaryUse, setPrimaryUse] = useState<string | null>(null);
  const [usefulFeatures, setUsefulFeatures] = useState<string[]>([]);
  const [feedbackText, setFeedbackText] = useState("");
  const [surveyDone, setSurveyDone] = useState(false);
  const [noticeDismissed, setNoticeDismissed] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("skinlabs-directory-prototype-notice") === "1";
    } catch {
      return false;
    }
  });

  const dismissNotice = () => {
    setNoticeDismissed(true);
    try {
      localStorage.setItem("skinlabs-directory-prototype-notice", "1");
    } catch {
      /* ignore */
    }
  };

  useEffect(() => {
    const root = document.documentElement;
    if (!noticeDismissed) {
      root.style.setProperty("--prototype-notice-h", "3.25rem");
    } else {
      root.style.setProperty("--prototype-notice-h", "0px");
    }
    return () => {
      root.style.setProperty("--prototype-notice-h", "0px");
    };
  }, [noticeDismissed]);

  const filtered = useMemo(() => {
    let base = dermatologists;
    if (province !== "all") base = base.filter((d) => d.province === province);
    if (category !== "all") {
      base = base.filter((d) => d.category === category || d.category === "Both");
    }
    if (practiceType !== "all") base = base.filter((d) => d.practiceType === practiceType);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      base = base.filter(
        (d) =>
          d.name.toLowerCase().includes(q) ||
          d.city.toLowerCase().includes(q) ||
          d.province.toLowerCase().includes(q) ||
          d.role.toLowerCase().includes(q),
      );
    }
    return [...base].sort((a, b) => a.name.localeCompare(b.name));
  }, [query, province, category, practiceType]);

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
    "Browse SkinLabs' directory of verified South African dermatologists and dermatology practices — real names, cities and provinces across Gauteng, the Western Cape, KwaZulu-Natal and beyond. Filter by Medical or Cosmetic focus.";

  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "CollectionPage", name: "Find a Trusted Dermatologist — SkinLabs Directory", description, url: canonical },
      { "@type": "BreadcrumbList", itemListElement: [{ "@type": "ListItem", position: 1, name: "Consult", item: baseCanonical }] },
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
            address: { "@type": "PostalAddress", addressLocality: d.city, addressRegion: d.province, addressCountry: "ZA" },
          },
        })),
      },
    ],
  };

  const toggleFeature = (f: string) => {
    setUsefulFeatures((prev) => (prev.includes(f) ? prev.filter((x) => x !== f) : [...prev, f]));
  };

  const submitSurvey = () => {
    setSurveyDone(true);
    setSurveyStep(0);
  };

  const renderResults = () => {
    const nodes: React.ReactNode[] = [];
    pageItems.forEach((derm, index) => {
      nodes.push(
        <div key={derm.id}>
          <DermatologistCard dermatologist={derm} index={index} />
        </div>,
      );
      if ((index + 1) % 3 === 0 && index < pageItems.length - 1) {
        nodes.push(
          <div key={`ad-${index}`} className="my-2">
            <AdSlot placement="consult-directory-inline" compact />
          </div>,
        );
      }
    });
    return nodes;
  };

  return (
    <div className="min-h-screen bg-background">
      <SEO
        title={title}
        description={description}
        canonical={canonical}
        ogImage={`${SITE_URL}/og-consult.png`}
        keywords="dermatologist South Africa, find a dermatologist, dermatology directory, skin doctor South Africa, HPCSA dermatologist, cosmetic dermatology"
        jsonLd={jsonLd}
      />

      {!noticeDismissed && (
        <div className="fixed top-0 left-0 right-0 z-[60] border-b border-amber-500/30 bg-amber-500/15 backdrop-blur-md">
          <div className="container mx-auto flex items-center gap-3 px-4 py-2.5 text-sm text-amber-950 dark:text-amber-100">
            <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
            <p className="min-w-0 flex-1 text-xs sm:text-sm">
              <strong className="font-semibold">Demonstrative prototype.</strong>{" "}
              <span className="hidden sm:inline">
                This directory is for demonstration and user research while we roll out the live version. Booking and
                messaging are not yet live.
              </span>
              <span className="sm:hidden">Demo directory — booking & messaging not live yet.</span>
            </p>
            <button
              type="button"
              onClick={dismissNotice}
              aria-label="Dismiss prototype notice"
              className="shrink-0 rounded-full p-1.5 text-amber-800/80 transition-colors hover:bg-amber-500/20 hover:text-amber-950 dark:text-amber-100 dark:hover:bg-amber-500/20"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div style={{ paddingTop: noticeDismissed ? undefined : "var(--prototype-notice-h, 3.25rem)" }}>
        <Header />

        <main className="pb-24 pt-8">
          <div className="container mx-auto px-4">
            <div className="mb-8 max-w-2xl">
              <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Directory</p>
              <h1 className="mb-4 font-heading text-3xl font-bold text-foreground md:text-5xl">
                Find a Trusted Dermatologist
              </h1>
              <p className="text-muted-foreground">
                Browse dermatologists and dermatology practices across South Africa. Every listing is sourced from public
                professional directory records. Filter by <span className="font-medium text-foreground">Medical</span> or{" "}
                <span className="font-medium text-foreground">Cosmetic</span> focus. Practitioners with a{" "}
                <span className="inline-flex items-center gap-1 font-medium text-foreground">
                  <ShieldCheck className="h-3.5 w-3.5" /> Verified
                </span>{" "}
                badge have contact details confirmed from a public source; others are unclaimed listings available for free
                claim.
              </p>
            </div>

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

            <div className="mb-6 flex flex-wrap gap-2">
              {(
                [
                  { value: "all" as const, label: "All" },
                  { value: "Medical" as const, label: "Medical" },
                  { value: "Cosmetic" as const, label: "Cosmetic" },
                  { value: "Both" as const, label: "Medical + Cosmetic" },
                ] as const
              ).map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    setCategory(opt.value);
                    goToPage(1);
                  }}
                  className={cn(
                    "rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                    category === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-muted-foreground hover:bg-muted/80 hover:text-foreground",
                  )}
                >
                  {opt.label}
                </button>
              ))}
            </div>

            {filtersOpen && (
              <div className="mb-6 grid gap-4 rounded-2xl border border-border bg-card p-4 sm:grid-cols-2 lg:grid-cols-4">
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
                  <label className="mb-2 block text-sm font-medium text-muted-foreground">Focus</label>
                  <Select
                    value={category}
                    onValueChange={(v) => {
                      setCategory(v as CategoryFilter);
                      goToPage(1);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="All categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      <SelectItem value="Medical">Medical</SelectItem>
                      <SelectItem value="Cosmetic">Cosmetic</SelectItem>
                      <SelectItem value="Both">Both</SelectItem>
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

            <div className="flex flex-col gap-4">{renderResults()}</div>

            {pageItems.length === 0 && (
              <p className="py-16 text-center text-muted-foreground">No dermatologists match that search yet.</p>
            )}

            <PaginationControls page={currentPage} totalPages={totalPages} onPageChange={goToPage} className="mt-10" />

            <section className="mt-20 rounded-3xl border border-border bg-card p-6 md:p-10">
              <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
                <div>
                  <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Product roadmap</p>
                  <h2 className="font-heading text-2xl font-bold text-foreground md:text-3xl">Directory launch plan</h2>
                  <p className="mt-2 max-w-xl text-muted-foreground">
                    Phased rollout of the live practitioner directory. Overall target launch:{" "}
                    <strong className="text-foreground">25 September 2026</strong>.
                  </p>
                </div>
                <div className="rounded-2xl border border-border bg-background px-5 py-4 text-center">
                  <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">Time to launch</p>
                  {countdown.launched ? (
                    <p className="mt-1 text-2xl font-bold text-emerald-600">Live</p>
                  ) : (
                    <p className="mt-1 font-mono text-2xl font-bold tabular-nums text-foreground">
                      {countdown.days}d {String(countdown.hours).padStart(2, "0")}h{" "}
                      {String(countdown.minutes).padStart(2, "0")}m {String(countdown.seconds).padStart(2, "0")}s
                    </p>
                  )}
                </div>
              </div>

              <ul className="space-y-4">
                {ROADMAP.map((item) => {
                  const Icon = item.icon;
                  return (
                    <li key={item.id} className="flex gap-4 rounded-2xl border border-border/60 bg-background/50 p-4">
                      <span
                        className={cn(
                          "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                          item.status === "completed" && "bg-emerald-500/15 text-emerald-600",
                          item.status === "in_progress" && "bg-amber-500/15 text-amber-600",
                          item.status === "planned" && "bg-muted text-muted-foreground",
                        )}
                      >
                        {item.status === "completed" ? (
                          <CheckCircle2 className="h-5 w-5" />
                        ) : item.status === "in_progress" ? (
                          <Clock className="h-5 w-5" />
                        ) : (
                          <Circle className="h-5 w-5" />
                        )}
                      </span>
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-2">
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <h3 className="font-heading font-semibold text-foreground">{item.title}</h3>
                          <span
                            className={cn(
                              "rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide",
                              item.status === "completed" && "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
                              item.status === "in_progress" && "bg-amber-500/10 text-amber-700 dark:text-amber-400",
                              item.status === "planned" && "bg-muted text-muted-foreground",
                            )}
                          >
                            {item.status === "completed"
                              ? "Completed"
                              : item.status === "in_progress"
                                ? "In progress"
                                : "Planned"}
                          </span>
                          {item.eta && <span className="text-xs text-muted-foreground">ETA {item.eta}</span>}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">{item.description}</p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-6">
                <p className="mb-2 text-xs font-medium text-muted-foreground">Overall progress</p>
                <Progress value={28} className="h-2" />
                <p className="mt-1.5 text-xs text-muted-foreground">
                  Prototype live · ratings & claim flow next · messaging & booking after launch
                </p>
              </div>
            </section>

            <section className="mt-12 rounded-3xl border border-border bg-card p-6 md:p-10">
              <div className="mb-6 flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <h2 className="font-heading text-xl font-bold text-foreground md:text-2xl">Help shape the directory</h2>
              </div>
              <p className="mb-6 max-w-2xl text-muted-foreground">
                This is a research prototype. Share quick feedback so we prioritise the right features for the live launch.
              </p>

              {surveyDone ? (
                <div className="rounded-2xl bg-emerald-500/10 p-6 text-center text-emerald-800 dark:text-emerald-300">
                  <CheckCircle2 className="mx-auto mb-2 h-8 w-8" />
                  <p className="font-medium">Thank you — your feedback is recorded.</p>
                  <p className="mt-1 text-sm opacity-80">
                    It helps us prioritise messaging, bookings and claim flows for the live directory.
                  </p>
                </div>
              ) : (
                <div className="max-w-xl space-y-6">
                  <div className="flex gap-1.5">
                    {[0, 1, 2, 3].map((s) => (
                      <span
                        key={s}
                        className={cn("h-1.5 flex-1 rounded-full", surveyStep >= s ? "bg-primary" : "bg-muted")}
                      />
                    ))}
                  </div>

                  {surveyStep === 0 && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Question 1 of 4 · Rating
                      </p>
                      <p className="mb-3 text-sm font-medium text-foreground">
                        How useful is this directory prototype for finding a dermatologist in South Africa?
                      </p>
                      <div className="flex flex-wrap items-center gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setSentiment(n)}
                            className={cn(
                              "flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                              sentiment === n
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background hover:bg-muted",
                            )}
                            aria-label={`${n} out of 5`}
                          >
                            {n}
                          </button>
                        ))}
                        <span className="ml-1 text-xs text-muted-foreground">1 = not useful · 5 = very useful</span>
                      </div>
                      <div className="mt-4 flex justify-end">
                        <Button disabled={sentiment === null} onClick={() => setSurveyStep(1)}>
                          Next
                        </Button>
                      </div>
                    </div>
                  )}

                  {surveyStep === 1 && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Question 2 of 4 · Poll
                      </p>
                      <p className="mb-3 text-sm font-medium text-foreground">What would you use the directory for first?</p>
                      <div className="grid gap-2">
                        {[
                          "Find a medical dermatologist for a skin condition",
                          "Book a cosmetic / aesthetic treatment",
                          "Compare practitioners before deciding",
                          "Message a specialist with a quick question",
                        ].map((option) => (
                          <button
                            key={option}
                            type="button"
                            onClick={() => setPrimaryUse(option)}
                            className={cn(
                              "rounded-xl border px-4 py-3 text-left text-sm transition-colors",
                              primaryUse === option
                                ? "border-primary bg-primary/10 text-foreground"
                                : "border-border bg-background text-muted-foreground hover:bg-muted hover:text-foreground",
                            )}
                          >
                            {option}
                          </button>
                        ))}
                      </div>
                      <div className="mt-4 flex justify-between">
                        <Button variant="ghost" onClick={() => setSurveyStep(0)}>
                          Back
                        </Button>
                        <Button disabled={!primaryUse} onClick={() => setSurveyStep(2)}>
                          Next
                        </Button>
                      </div>
                    </div>
                  )}

                  {surveyStep === 2 && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Question 3 of 4 · Rating + feature poll
                      </p>
                      <p className="mb-3 text-sm font-medium text-foreground">
                        How important is in-app booking with secure payment to you?
                      </p>
                      <div className="mb-5 flex flex-wrap items-center gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setBookingPriority(n)}
                            className={cn(
                              "flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                              bookingPriority === n
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background hover:bg-muted",
                            )}
                            aria-label={`Booking importance ${n} out of 5`}
                          >
                            {n}
                          </button>
                        ))}
                        <span className="ml-1 text-xs text-muted-foreground">1 = low · 5 = essential</span>
                      </div>
                      <p className="mb-3 text-sm font-medium text-foreground">
                        Which features should we ship first? (select all that apply)
                      </p>
                      <div className="flex flex-wrap gap-2">
                        {[
                          "Encrypted messaging",
                          "Booking + payments",
                          "Video consultations",
                          "Profile ratings",
                          "Claim my listing",
                          "AI consult summaries",
                        ].map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => toggleFeature(f)}
                            className={cn(
                              "rounded-full px-3 py-1.5 text-sm transition-colors",
                              usefulFeatures.includes(f)
                                ? "bg-primary text-primary-foreground"
                                : "bg-muted text-muted-foreground hover:text-foreground",
                            )}
                          >
                            {f}
                          </button>
                        ))}
                      </div>
                      <div className="mt-4 flex justify-between">
                        <Button variant="ghost" onClick={() => setSurveyStep(1)}>
                          Back
                        </Button>
                        <Button disabled={bookingPriority === null} onClick={() => setSurveyStep(3)}>
                          Next
                        </Button>
                      </div>
                    </div>
                  )}

                  {surveyStep === 3 && (
                    <div>
                      <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
                        Question 4 of 4 · Trust rating
                      </p>
                      <p className="mb-3 text-sm font-medium text-foreground">
                        How much would you trust an unverified (unclaimed) listing to contact through SkinLabs?
                      </p>
                      <div className="mb-5 flex flex-wrap items-center gap-2">
                        {[1, 2, 3, 4, 5].map((n) => (
                          <button
                            key={n}
                            type="button"
                            onClick={() => setTrustScore(n)}
                            className={cn(
                              "flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition-colors",
                              trustScore === n
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border bg-background hover:bg-muted",
                            )}
                            aria-label={`Trust ${n} out of 5`}
                          >
                            {n}
                          </button>
                        ))}
                        <span className="ml-1 text-xs text-muted-foreground">1 = not at all · 5 = fully</span>
                      </div>
                      <label className="mb-2 block text-sm font-medium text-foreground">
                        Anything else we should prioritise? (optional)
                      </label>
                      <Textarea
                        value={feedbackText}
                        onChange={(e) => setFeedbackText(e.target.value)}
                        placeholder="e.g. filter by telehealth, medical aid acceptance, languages spoken…"
                        rows={3}
                      />
                      <div className="mt-4 flex justify-between">
                        <Button variant="ghost" onClick={() => setSurveyStep(2)}>
                          Back
                        </Button>
                        <Button disabled={trustScore === null} onClick={submitSurvey}>
                          Submit feedback
                        </Button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </section>

            <p className="mx-auto mt-10 max-w-3xl text-center text-xs text-muted-foreground">
              SkinLabs does not provide medical diagnosis or treatment. This directory helps you find independent,
              HPCSA-registered dermatology professionals; SkinLabs is not responsible for the medical advice or services
              they provide. Are you a dermatologist or practice owner? Get in touch via our{" "}
              <Link to="/partners" className="font-medium text-foreground underline underline-offset-2">
                Partner Program
              </Link>{" "}
              to claim and enrich your free listing.
            </p>
          </div>
        </main>

        <Footer />
      </div>
    </div>
  );
};

export default DermatologistDirectory;
