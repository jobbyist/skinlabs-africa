import { useEffect, useRef, useState } from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ChevronLeft, ChevronRight, Loader2, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import FormProgress from "./brand-ambassador/FormProgress";
import Step1AboutYou from "./brand-ambassador/steps/Step1AboutYou";
import Step2TikTok from "./brand-ambassador/steps/Step2TikTok";
import Step3Instagram from "./brand-ambassador/steps/Step3Instagram";
import Step4Analytics from "./brand-ambassador/steps/Step4Analytics";
import Step5Content from "./brand-ambassador/steps/Step5Content";
import Step6Partnership from "./brand-ambassador/steps/Step6Partnership";
import Step7Availability from "./brand-ambassador/steps/Step7Availability";
import Step8Agreement from "./brand-ambassador/steps/Step8Agreement";
import SuccessScreen from "./brand-ambassador/SuccessScreen";
import ApplicationWindowClosed from "./brand-ambassador/ApplicationWindowClosed";
import {
  AMBASSADOR_DRAFT_STORAGE_KEY,
  STEP_META,
  TOTAL_STEPS,
  initialAmbassadorFiles,
  initialAmbassadorForm,
  isFormDirty,
  validateStep,
  type AmbassadorFormData,
  type AmbassadorFormFiles,
  type FormErrors,
} from "./brand-ambassador/formTypes";
import { BA_APPLICATIONS_CLOSE, getApplicationWindowStatus } from "@/data/brandAmbassador";

const FORMSPREE_ENDPOINT =
  (import.meta.env.VITE_FORMSPREE_BRAND_AMBASSADOR_ENDPOINT as string | undefined)?.trim() ||
  "";

interface BrandAmbassadorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function loadDraft(): AmbassadorFormData {
  if (typeof window === "undefined") return initialAmbassadorForm;
  try {
    const raw = window.localStorage.getItem(AMBASSADOR_DRAFT_STORAGE_KEY);
    if (!raw) return initialAmbassadorForm;
    const parsed = JSON.parse(raw);
    
    // Validate parsed data has expected structure
    if (typeof parsed !== "object" || parsed === null) {
      return initialAmbassadorForm;
    }
    
    // Only merge string and array fields, ignore unexpected properties
    const safeData: Partial<AmbassadorFormData> = {};
    for (const key in parsed) {
      if (key in initialAmbassadorForm) {
        const value = parsed[key];
        const initialValue = initialAmbassadorForm[key as keyof AmbassadorFormData];
        
        // Type-check each field. Assigning through a generic `keyof` indexer
        // onto a Partial<T> with mixed-type properties resolves to `never`
        // under TS's strict indexed-access narrowing, so write through an
        // unknown-keyed view instead — the runtime typeof/Array.isArray
        // checks above already guarantee the value matches the field.
        const target = safeData as Record<string, unknown>;
        if (typeof initialValue === "string" && typeof value === "string") {
          target[key] = value;
        } else if (typeof initialValue === "boolean" && typeof value === "boolean") {
          target[key] = value;
        } else if (Array.isArray(initialValue) && Array.isArray(value)) {
          target[key] = value.filter((v: unknown) => typeof v === "string");
        }
      }
    }
    
    return { ...initialAmbassadorForm, ...safeData };
  } catch {
    return initialAmbassadorForm;
  }
}

const buildFormData = (form: AmbassadorFormData, files: AmbassadorFormFiles) => {
  const fd = new FormData();
  fd.append("_subject", `SkinLabs Brand Ambassador Application — ${form.fullName}`);

  Object.entries(form).forEach(([key, value]) => {
    if (Array.isArray(value)) fd.append(key, value.join(", "));
    else fd.append(key, String(value));
  });

  if (files.tiktokAnalyticsFile) fd.append("tiktok_analytics_screenshot", files.tiktokAnalyticsFile);
  if (files.igAnalyticsFile) fd.append("instagram_analytics_screenshot", files.igAnalyticsFile);

  return fd;
};

const BrandAmbassadorModal = ({ open, onOpenChange }: BrandAmbassadorModalProps) => {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<AmbassadorFormData>(loadDraft);
  const [files, setFiles] = useState<AmbassadorFormFiles>(initialAmbassadorFiles);
  const [errors, setErrors] = useState<FormErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);
  const [confirmCloseOpen, setConfirmCloseOpen] = useState(false);

  const headingRef = useRef<HTMLHeadingElement>(null);
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const submittingRef = useRef(false);

  // Authoritative check, independent of the landing page's own CTA state —
  // this is what actually blocks the form outside the advertised window,
  // whether the modal was reached via a disabled CTA (it isn't, it's
  // disabled) or a direct link to /brand-ambassadors/apply.
  const applicationStatus = getApplicationWindowStatus();
  const applicationsOpen = applicationStatus === "open";

  // Persist a text-only draft so an accidental close (or reload) doesn't lose progress.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      window.localStorage.setItem(AMBASSADOR_DRAFT_STORAGE_KEY, JSON.stringify(form));
    } catch {
      // Storage can fail (private browsing, quota) — losing the draft-save is not fatal.
    }
  }, [form]);

  useEffect(() => {
    if (!open) return;
    scrollRef.current?.scrollTo({ top: 0 });
    headingRef.current?.focus();
  }, [step, open]);

  const updateField = <K extends keyof AmbassadorFormData>(field: K, value: AmbassadorFormData[K]) => {
    setForm((f) => ({ ...f, [field]: value }));
    setErrors((e) => ({ ...e, [field]: undefined }));
  };

  const updateFile = <K extends keyof AmbassadorFormFiles>(field: K, file: File | null) => {
    setFiles((f) => ({ ...f, [field]: file }));
    const key = field === "tiktokAnalyticsFile" ? "tiktokAnalytics" : "igAnalytics";
    setErrors((e) => ({ ...e, [key]: undefined }));
  };

  const goNext = () => {
    const stepErrors = validateStep(step, form, files);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }
    setErrors({});
    setStep((s) => Math.min(TOTAL_STEPS, s + 1));
  };

  const goBack = () => setStep((s) => Math.max(1, s - 1));

  const resetForNewApplication = () => {
    setForm(initialAmbassadorForm);
    setFiles(initialAmbassadorFiles);
    setErrors({});
    setStep(1);
    setSubmitted(false);
    setSubmitError(null);
    try {
      window.localStorage.removeItem(AMBASSADOR_DRAFT_STORAGE_KEY);
    } catch {
      // ignore
    }
  };

  const handleSubmit = async () => {
    if (submittingRef.current) return;
    if (!applicationsOpen) return;
    const stepErrors = validateStep(8, form, files);
    if (Object.keys(stepErrors).length > 0) {
      setErrors(stepErrors);
      requestAnimationFrame(() => errorSummaryRef.current?.focus());
      return;
    }
    submittingRef.current = true;
    setSubmitting(true);
    setSubmitError(null);
    try {
      const res = await fetch(FORMSPREE_ENDPOINT, {
        method: "POST",
        body: buildFormData(form, files),
        headers: { Accept: "application/json" },
      });
      if (!res.ok) throw new Error("Formspree request failed");
      setSubmitted(true);
      try {
        window.localStorage.removeItem(AMBASSADOR_DRAFT_STORAGE_KEY);
      } catch {
        // ignore
      }
    } catch {
      setSubmitError("Something went wrong while submitting your application. Please check your details and try again.");
    } finally {
      submittingRef.current = false;
      setSubmitting(false);
    }
  };

  const requestClose = () => {
    if (submitted || !applicationsOpen || !isFormDirty(form)) {
      onOpenChange(false);
      return;
    }
    setConfirmCloseOpen(true);
  };

  const handleSuccessClose = () => {
    resetForNewApplication();
    onOpenChange(false);
  };

  const stepMeta = STEP_META[step - 1];

  return (
    <>
      <DialogPrimitive.Root open={open} onOpenChange={(next) => { if (!next) requestClose(); }}>
        <DialogPrimitive.Portal>
          <DialogPrimitive.Overlay className="fixed inset-0 z-[100] bg-black/70 data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0" />
          <DialogPrimitive.Content
            onEscapeKeyDown={(e) => { e.preventDefault(); requestClose(); }}
            onPointerDownOutside={(e) => { e.preventDefault(); requestClose(); }}
            className={cn(
              "fixed z-[100] flex flex-col bg-background shadow-xl outline-none",
              "inset-0 h-[100dvh] w-full",
              "sm:inset-auto sm:left-1/2 sm:top-1/2 sm:h-auto sm:max-h-[90vh] sm:w-full sm:max-w-2xl sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl sm:border sm:border-border",
              "data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95",
            )}
          >
            <DialogPrimitive.Title asChild>
              <span className="sr-only">Apply to become a SkinLabs® Brand Ambassador</span>
            </DialogPrimitive.Title>
            <DialogPrimitive.Description asChild>
              <span className="sr-only">
                We're selecting 25 TikTok and Instagram creators to join the founding SkinLabs® Brand Ambassador &
                Creator Programme.
              </span>
            </DialogPrimitive.Description>

            {/* Fixed header: title + progress + close */}
            <div className="shrink-0 border-b border-border bg-background px-4 pb-3 pt-4 sm:rounded-t-2xl sm:px-6">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate text-xs font-bold uppercase tracking-wide text-muted-foreground">
                    SkinLabs® Brand Ambassador Application
                  </p>
                </div>
                <button
                  type="button"
                  onClick={requestClose}
                  aria-label="Close application form"
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border text-foreground transition-colors hover:bg-accent"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              {!submitted && applicationsOpen && (
                <div className="mt-3">
                  <FormProgress step={step} />
                </div>
              )}
            </div>

            {/* Scrollable content */}
            <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-5 sm:px-6">
              {submitted ? (
                <SuccessScreen onClose={handleSuccessClose} />
              ) : applicationStatus !== "open" ? (
                <ApplicationWindowClosed status={applicationStatus} onClose={() => onOpenChange(false)} />
              ) : (
                <div>
                  <h3 ref={headingRef} tabIndex={-1} className="font-heading text-lg font-bold text-foreground outline-none">
                    {stepMeta.title}
                  </h3>
                  <p className="mt-1 text-sm text-muted-foreground">{stepMeta.description}</p>

                  {Object.keys(errors).length > 0 && (
                    <div
                      ref={errorSummaryRef}
                      tabIndex={-1}
                      role="alert"
                      className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive outline-none"
                    >
                      Please fix the highlighted fields before continuing.
                    </div>
                  )}

                  <div className="mt-4">
                    {step === 1 && <Step1AboutYou form={form} errors={errors} onChange={updateField} />}
                    {step === 2 && <Step2TikTok form={form} errors={errors} onChange={updateField} />}
                    {step === 3 && <Step3Instagram form={form} errors={errors} onChange={updateField} />}
                    {step === 4 && (
                      <Step4Analytics form={form} files={files} errors={errors} onChange={updateField} onFileChange={updateFile} />
                    )}
                    {step === 5 && <Step5Content form={form} errors={errors} onChange={updateField} />}
                    {step === 6 && <Step6Partnership form={form} errors={errors} onChange={updateField} />}
                    {step === 7 && <Step7Availability form={form} errors={errors} onChange={updateField} />}
                    {step === 8 && <Step8Agreement form={form} errors={errors} onChange={updateField} />}
                  </div>

                  {step === TOTAL_STEPS && (
                    <>
                      {submitError && (
                        <p role="alert" className="mt-4 rounded-lg border border-destructive/40 bg-destructive/5 px-3 py-2 text-sm font-medium text-destructive">
                          {submitError}
                        </p>
                      )}
                      <p className="mt-4 text-xs text-muted-foreground">
                        Applications close {BA_APPLICATIONS_CLOSE}. Only 25 creators will be selected for the founding
                        cohort.
                      </p>
                    </>
                  )}
                </div>
              )}
            </div>

            {/* Fixed footer controls */}
            {!submitted && applicationsOpen && (
              <div className="flex shrink-0 items-center justify-between gap-3 border-t border-border bg-background px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:rounded-b-2xl sm:px-6">
                <Button type="button" variant="outline" onClick={goBack} disabled={step === 1 || submitting}>
                  <ChevronLeft className="h-4 w-4" /> Back
                </Button>
                {step < TOTAL_STEPS ? (
                  <Button type="button" onClick={goNext}>
                    Continue <ChevronRight className="h-4 w-4" />
                  </Button>
                ) : (
                  <Button type="button" onClick={handleSubmit} disabled={submitting} className="min-w-[13rem]">
                    {submitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> SUBMITTING MY APPLICATION…
                      </>
                    ) : (
                      "SUBMIT MY APPLICATION"
                    )}
                  </Button>
                )}
              </div>
            )}
          </DialogPrimitive.Content>
        </DialogPrimitive.Portal>
      </DialogPrimitive.Root>

      <AlertDialog open={confirmCloseOpen} onOpenChange={setConfirmCloseOpen}>
        <AlertDialogContent className="z-[110]">
          <AlertDialogHeader>
            <AlertDialogTitle>Close application form?</AlertDialogTitle>
            <AlertDialogDescription>
              You have unsaved progress on your application. We'll keep what you've entered so you can pick up where
              you left off, but you'll need to reopen the form to finish and submit it.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep editing</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setConfirmCloseOpen(false);
                onOpenChange(false);
              }}
            >
              Close for now
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};

export default BrandAmbassadorModal;
