import { useMemo, useState } from "react";
import { toast } from "sonner";
import { CheckCircle2, ChevronLeft, ChevronRight, Loader2, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import {
  computeQuoteEstimate,
  formatZar,
  PRODUCT_FILL_SIZES,
  PRODUCT_LABELS,
  type ProductKey,
} from "@/lib/quoteSsBeautyPricing";
import { BUDGET_RANGE_OPTIONS, HAIR_CONCERN_OPTIONS, INITIAL_QUOTE_FORM_STATE, type QuoteFormState } from "./types";
import QuoteStepper from "./QuoteStepper";

const PRODUCT_OPTIONS: ProductKey[] = ["hair_growth_oil", "hair_food", "leave_in_conditioner"];
const TOTAL_STEPS = 7;

const QuoteSSBeautyForm = () => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<QuoteFormState>(INITIAL_QUOTE_FORM_STATE);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const update = <K extends keyof QuoteFormState>(key: K, value: QuoteFormState[K]) =>
    setForm((prev) => ({ ...prev, [key]: value }));

  const toggleProduct = (product: ProductKey) => {
    setForm((prev) => {
      const has = prev.products.includes(product);
      const products = has ? prev.products.filter((p) => p !== product) : [...prev.products, product];
      const quantities = { ...prev.quantities };
      const formulationApproaches = { ...prev.formulationApproaches };
      if (!has) {
        quantities[product] = quantities[product] ?? 10;
        formulationApproaches[product] = formulationApproaches[product] ?? "stock_base";
      }
      return { ...prev, products, quantities, formulationApproaches };
    });
  };

  const toggleConcern = (concern: string) => {
    setForm((prev) => ({
      ...prev,
      hairConcerns: prev.hairConcerns.includes(concern)
        ? prev.hairConcerns.filter((c) => c !== concern)
        : [...prev.hairConcerns, concern],
    }));
  };

  const estimate = useMemo(() => {
    if (form.products.length === 0 || !form.packagingRoute) return null;
    return computeQuoteEstimate({
      products: form.products.map((p) => ({
        product: p,
        quantity: form.quantities[p] ?? 10,
        formulationApproach: form.formulationApproaches[p] ?? "stock_base",
      })),
      packagingRoute: form.packagingRoute,
      needsLogo: form.needsLogo,
      needsLabelDesign: form.needsLabelDesign,
      needsComplianceHelp: form.needsComplianceHelp,
    });
  }, [form]);

  const canAdvance = (): boolean => {
    switch (step) {
      case 1:
        return form.fullName.trim().length > 1 && /\S+@\S+\.\S+/.test(form.email);
      case 2:
        return form.products.length > 0 && form.products.every((p) => (form.quantities[p] ?? 0) >= 10);
      case 3:
        return form.products.every((p) => !!form.formulationApproaches[p]);
      case 4:
        return form.hasBranding !== "";
      case 5:
        return form.packagingRoute !== "" && form.whiteLabelInterest !== "";
      case 6:
        return form.timeline !== "";
      case 7:
        return form.consent;
      default:
        return true;
    }
  };

  const next = () => {
    if (!canAdvance()) {
      toast.error("Please fill in the required fields before continuing");
      return;
    }
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };
  const back = () => setStep((s) => Math.max(1, s - 1));

  const handleSubmit = async () => {
    if (form.website.trim() !== "") return; // honeypot
    if (!canAdvance()) {
      toast.error("Please confirm you understand this is a preliminary estimate before submitting");
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.functions.invoke("quote-ss-beauty-submit", {
        body: {
          fullName: form.fullName,
          businessName: form.businessName,
          email: form.email,
          phone: form.phone,
          products: form.products.map((p) => ({
            product: p,
            quantity: form.quantities[p] ?? 10,
            formulationApproach: form.formulationApproaches[p] ?? "stock_base",
          })),
          hairConcerns: form.hairConcerns,
          formulationNotes: form.formulationNotes,
          hasBranding: form.hasBranding,
          needsLogo: form.needsLogo,
          needsLabelDesign: form.needsLabelDesign,
          needsComplianceHelp: form.needsComplianceHelp,
          packagingRoute: form.packagingRoute,
          whiteLabelInterest: form.whiteLabelInterest,
          timeline: form.timeline,
          budgetRange: form.budgetRange,
          additionalNotes: form.additionalNotes,
          website: form.website,
        },
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err) {
      console.error("quote-ss-beauty-submit failed:", err);
      toast.error("Something went wrong sending your request — please try again or email support@skinlabs.co.za");
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    return (
      <Card className="max-w-xl mx-auto text-center">
        <CardContent className="pt-10 pb-10 px-6 sm:px-10">
          <div className="mx-auto mb-5 h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center">
            <CheckCircle2 className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl font-heading font-bold text-foreground mb-3">Thank you, {form.fullName}!</h2>
          <p className="text-muted-foreground leading-relaxed">
            Your Business Suite quote request has been sent to our team. We'll review your product mix and
            preferences and follow up with a tailored proposal — including firm pricing and sample kit options — on
            a call, just as discussed.
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-2xl mx-auto">
      <QuoteStepper step={step} />

      <Card>
        <CardContent className="pt-8 pb-8 px-6 sm:px-10 space-y-6">
          {/* Honeypot — hidden from real visitors */}
          <input
            type="text"
            name="website"
            value={form.website}
            onChange={(e) => update("website", e.target.value)}
            className="hidden"
            tabIndex={-1}
            autoComplete="off"
            aria-hidden="true"
          />

          {step === 1 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-1">
                  Hi Siphokazi <span className="gradient-text">👋</span>
                </h2>
                <p className="text-sm text-muted-foreground">
                  Let's put together an indicative quote for your hair care line, based on what we discussed —
                  branding, labelling, formulation and white-labelling through our Business Suite. It only takes a
                  couple of minutes.
                </p>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="fullName">Full name</Label>
                  <Input id="fullName" value={form.fullName} onChange={(e) => update("fullName", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="businessName">Brand / business name</Label>
                  <Input
                    id="businessName"
                    placeholder="e.g. SS Beauty"
                    value={form.businessName}
                    onChange={(e) => update("businessName", e.target.value)}
                  />
                </div>
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={form.email} onChange={(e) => update("email", e.target.value)} />
                </div>
                <div>
                  <Label htmlFor="phone">Phone / WhatsApp (optional)</Label>
                  <Input id="phone" value={form.phone} onChange={(e) => update("phone", e.target.value)} />
                </div>
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-1">Which products?</h2>
                <p className="text-sm text-muted-foreground">
                  Select the lines you'd like us to produce. MOQs start from 10 units per SKU.
                </p>
              </div>
              <div className="space-y-3">
                {PRODUCT_OPTIONS.map((p) => {
                  const checked = form.products.includes(p);
                  return (
                    <div key={p} className={"rounded-xl border p-4 transition-colors " + (checked ? "border-primary bg-primary/5" : "border-border")}>
                      <label className="flex items-center gap-3 cursor-pointer">
                        <Checkbox checked={checked} onCheckedChange={() => toggleProduct(p)} />
                        <span className="font-medium text-foreground">{PRODUCT_LABELS[p]}</span>
                        <span className="text-xs text-muted-foreground ml-auto">{PRODUCT_FILL_SIZES[p]} standard fill</span>
                      </label>
                      {checked && (
                        <div className="mt-3 ml-7">
                          <Label htmlFor={`qty-${p}`} className="text-xs">Initial order quantity (units)</Label>
                          <Input
                            id={`qty-${p}`}
                            type="number"
                            min={10}
                            className="max-w-[140px]"
                            value={form.quantities[p] ?? 10}
                            onChange={(e) =>
                              setForm((prev) => ({
                                ...prev,
                                quantities: { ...prev.quantities, [p]: Number(e.target.value) },
                              }))
                            }
                          />
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-1">Formulation approach</h2>
                <p className="text-sm text-muted-foreground">
                  For each product, tell us whether you'd like to customize one of our existing base formulas
                  (faster, more affordable) or go fully custom from scratch.
                </p>
              </div>
              {form.products.map((p) => (
                <div key={p} className="rounded-xl border border-border p-4">
                  <p className="font-medium text-foreground mb-3">{PRODUCT_LABELS[p]}</p>
                  <RadioGroup
                    value={form.formulationApproaches[p] ?? "stock_base"}
                    onValueChange={(v) =>
                      setForm((prev) => ({
                        ...prev,
                        formulationApproaches: { ...prev.formulationApproaches, [p]: v as "stock_base" | "full_custom" },
                      }))
                    }
                    className="space-y-2"
                  >
                    <label className="flex items-start gap-2 text-sm cursor-pointer">
                      <RadioGroupItem value="stock_base" className="mt-0.5" />
                      <span>Customize an existing base formula (fragrance, actives, viscosity)</span>
                    </label>
                    <label className="flex items-start gap-2 text-sm cursor-pointer">
                      <RadioGroupItem value="full_custom" className="mt-0.5" />
                      <span>Fully custom formulation from scratch</span>
                    </label>
                  </RadioGroup>
                </div>
              ))}
              <div>
                <Label className="mb-2 block">Hair concerns to formulate around (optional)</Label>
                <div className="flex flex-wrap gap-2">
                  {HAIR_CONCERN_OPTIONS.map((c) => (
                    <button
                      type="button"
                      key={c}
                      onClick={() => toggleConcern(c)}
                      className={
                        "text-xs px-3 py-1.5 rounded-full border transition-colors " +
                        (form.hairConcerns.includes(c)
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border text-muted-foreground hover:border-primary/50")
                      }
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="formulationNotes">Fragrance / key actives / anything to avoid (optional)</Label>
                <Textarea
                  id="formulationNotes"
                  rows={3}
                  value={form.formulationNotes}
                  onChange={(e) => update("formulationNotes", e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="space-y-5">
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-1">Branding & labelling</h2>
                <p className="text-sm text-muted-foreground">What do you need help with?</p>
              </div>
              <div>
                <Label className="mb-2 block">Do you already have branding assets?</Label>
                <RadioGroup value={form.hasBranding} onValueChange={(v) => update("hasBranding", v as QuoteFormState["hasBranding"])} className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="yes" /> Yes, complete
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="partial" /> Partial (e.g. logo but no labels)
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="no" /> No, starting from scratch
                  </label>
                </RadioGroup>
              </div>
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={form.needsLogo} onCheckedChange={(v) => update("needsLogo", !!v)} />
                  I need a logo / brand identity designed
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={form.needsLabelDesign} onCheckedChange={(v) => update("needsLabelDesign", !!v)} />
                  I need product label designs
                </label>
                <label className="flex items-center gap-2 text-sm cursor-pointer">
                  <Checkbox checked={form.needsComplianceHelp} onCheckedChange={(v) => update("needsComplianceHelp", !!v)} />
                  I need help with regulatory/compliance labelling (ingredient declarations, INCI)
                </label>
              </div>
            </div>
          )}

          {step === 5 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-1">Packaging & white-labelling</h2>
              </div>
              <div>
                <Label className="mb-2 block">Packaging</Label>
                <RadioGroup value={form.packagingRoute} onValueChange={(v) => update("packagingRoute", v as QuoteFormState["packagingRoute"])} className="space-y-2">
                  <label className="flex items-start gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="turnkey" className="mt-0.5" /> We source & apply packaging (turnkey)
                  </label>
                  <label className="flex items-start gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="client_supplied" className="mt-0.5" /> I'll supply my own packaging
                  </label>
                </RadioGroup>
              </div>
              <div>
                <Label className="mb-2 block">White-labelling</Label>
                <RadioGroup value={form.whiteLabelInterest} onValueChange={(v) => update("whiteLabelInterest", v as QuoteFormState["whiteLabelInterest"])} className="space-y-2">
                  <label className="flex items-start gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="rebrand_stock" className="mt-0.5" /> Rebrand existing/stock formulas under my brand
                  </label>
                  <label className="flex items-start gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="full_custom_only" className="mt-0.5" /> Fully custom formulation only
                  </label>
                  <label className="flex items-start gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="not_sure" className="mt-0.5" /> Not sure — open to recommendation
                  </label>
                </RadioGroup>
              </div>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-1">Timeline & budget</h2>
              </div>
              <div>
                <Label className="mb-2 block">Desired timeline</Label>
                <RadioGroup value={form.timeline} onValueChange={(v) => update("timeline", v as QuoteFormState["timeline"])} className="space-y-2">
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="asap" /> As soon as possible
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="1_2_months" /> 1–2 months
                  </label>
                  <label className="flex items-center gap-2 text-sm cursor-pointer">
                    <RadioGroupItem value="3_plus_months" /> 3+ months, flexible
                  </label>
                </RadioGroup>
              </div>
              <div>
                <Label className="mb-2 block">Budget comfort range (optional — helps us tailor the proposal)</Label>
                <Select value={form.budgetRange} onValueChange={(v) => update("budgetRange", v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select a range" />
                  </SelectTrigger>
                  <SelectContent>
                    {BUDGET_RANGE_OPTIONS.map((b) => (
                      <SelectItem key={b} value={b}>
                        {b}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-heading font-bold text-foreground mb-1">Review your request</h2>
                <p className="text-sm text-muted-foreground">Here's an indicative estimate based on your answers.</p>
              </div>

              {estimate && (
                <div className="rounded-xl border border-border bg-secondary/30 p-5 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-primary uppercase tracking-wide">
                    <Sparkles className="h-3.5 w-3.5" /> Indicative estimate
                  </div>
                  {estimate.lines.map((l) => (
                    <div key={l.product} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">
                        {l.label} · {l.quantity} units
                      </span>
                      <span className="font-medium text-foreground">{formatZar(l.lineTotal)}</span>
                    </div>
                  ))}
                  {estimate.brandIdentityFee > 0 && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-foreground">Brand identity design</span>
                      <span className="font-medium text-foreground">{formatZar(estimate.brandIdentityFee)}</span>
                    </div>
                  )}
                  <div className="border-t border-border pt-3 flex items-center justify-between text-sm text-muted-foreground">
                    <span>Subtotal (ex VAT)</span>
                    <span>{formatZar(estimate.subtotal)}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>VAT (15%)</span>
                    <span>{formatZar(estimate.vat)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-bold text-foreground">
                    <span>Estimated total</span>
                    <span>{formatZar(estimate.total)}</span>
                  </div>
                  <p className="text-[11px] text-muted-foreground pt-1">
                    Preliminary and indicative only — final pricing is confirmed after a consultation call, formula
                    approval (2–4 weeks) and production lead time (2–4 weeks).
                  </p>
                </div>
              )}

              <div>
                <Label htmlFor="additionalNotes">Anything else we should know? (optional)</Label>
                <Textarea
                  id="additionalNotes"
                  rows={3}
                  value={form.additionalNotes}
                  onChange={(e) => update("additionalNotes", e.target.value)}
                />
              </div>

              <label className="flex items-start gap-2 text-sm cursor-pointer">
                <Checkbox checked={form.consent} onCheckedChange={(v) => update("consent", !!v)} className="mt-0.5" />
                <span>
                  I understand this is a preliminary, indicative estimate and SkinLabs will follow up to confirm
                  final scope and pricing.
                </span>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex items-center justify-between mt-6">
        <Button variant="outline" onClick={back} disabled={step === 1 || submitting}>
          <ChevronLeft className="h-4 w-4 mr-1" /> Back
        </Button>
        {step < TOTAL_STEPS ? (
          <Button onClick={next}>
            Next <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSubmit} disabled={submitting || !form.consent}>
            {submitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" /> Sending...
              </>
            ) : (
              "Submit request"
            )}
          </Button>
        )}
      </div>
    </div>
  );
};

export default QuoteSSBeautyForm;
