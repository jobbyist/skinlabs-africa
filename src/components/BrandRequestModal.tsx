import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Loader2, PartyPopper } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface BrandRequestModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: "claim" | "submit";
  brandName?: string;
  brandSlug?: string;
}

const copy = {
  claim: {
    title: "Get in touch about your listing",
    description:
      "Own or work with a brand featured on Spotlight? Tell us who you are and we'll follow up to verify details. This is a fact-check channel, not editorial approval — SkinLabs' assessments stay independent.",
    submitLabel: "Send request",
    successMessage: "Thanks — we'll be in touch to verify your brand's details.",
  },
  submit: {
    title: "Submit your brand",
    description:
      "Think your brand belongs on Spotlight? Tell us about it. Submission doesn't guarantee inclusion — every brand still goes through the same independent research and review process.",
    submitLabel: "Submit brand",
    successMessage: "Thanks — we'll research your submission for a future Spotlight edition.",
  },
};

const BrandRequestModal = ({ open, onOpenChange, mode, brandName, brandSlug }: BrandRequestModalProps) => {
  const { user } = useAuth();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    brand_name: brandName ?? "",
    role_at_brand: "",
    official_website: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    message: "",
  });

  useEffect(() => {
    if (!open) return;
    setForm((prev) => ({
      ...prev,
      brand_name: brandName ?? prev.brand_name,
      contact_email: prev.contact_email || user?.email || "",
    }));
    setDone(false);
  }, [open, brandName, user]);

  const text = copy[mode];

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!form.brand_name || !form.contact_name || !form.contact_email) {
      toast.error("Please fill in the brand name and your contact details.");
      return;
    }
    setSubmitting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("spotlight_brand_requests").insert({
      request_type: mode === "claim" ? "claim_brand" : "submit_brand",
      brand_slug: brandSlug ?? null,
      ...form,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not send your request. Please try again.");
      return;
    }
    toast.success(text.successMessage);
    setDone(true);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className={
          "flex max-h-[min(92dvh,920px)] w-[calc(100vw-1.5rem)] max-w-lg flex-col gap-0 overflow-hidden p-0 " +
          "sm:w-full sm:max-w-md"
        }
      >
        {done ? (
          <div className="overflow-y-auto px-5 py-8 text-center sm:px-6">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
              <PartyPopper className="h-7 w-7 text-primary" />
            </div>
            <h3 className="font-heading text-lg font-bold text-foreground">Request sent</h3>
            <p className="mt-2 text-sm text-muted-foreground">{text.successMessage}</p>
            <Button className="mt-6 w-full" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </div>
        ) : (
          <>
            <div className="shrink-0 border-b border-border px-5 pb-4 pt-5 sm:px-6 sm:pt-6">
              <DialogHeader className="space-y-2 text-left">
                <DialogTitle className="pr-8 text-base sm:text-lg">{text.title}</DialogTitle>
                <DialogDescription className="text-xs leading-relaxed sm:text-sm">
                  {text.description}
                </DialogDescription>
              </DialogHeader>
            </div>

            <form
              onSubmit={handleSubmit}
              className="flex min-h-0 flex-1 flex-col"
            >
              <div className="min-h-0 flex-1 space-y-3.5 overflow-y-auto overscroll-contain px-5 py-4 sm:space-y-4 sm:px-6">
                <div className="space-y-1.5">
                  <Label htmlFor="brand_name">Brand name</Label>
                  <Input
                    id="brand_name"
                    value={form.brand_name}
                    onChange={(e) => setForm({ ...form, brand_name: e.target.value })}
                    required
                  />
                </div>
                {mode === "claim" && (
                  <div className="space-y-1.5">
                    <Label htmlFor="role_at_brand">Your role at the brand</Label>
                    <Input
                      id="role_at_brand"
                      placeholder="Founder, marketing, PR agency…"
                      value={form.role_at_brand}
                      onChange={(e) => setForm({ ...form, role_at_brand: e.target.value })}
                    />
                  </div>
                )}
                <div className="space-y-1.5">
                  <Label htmlFor="official_website">Official brand website</Label>
                  <Input
                    id="official_website"
                    type="url"
                    placeholder="https://"
                    value={form.official_website}
                    onChange={(e) => setForm({ ...form, official_website: e.target.value })}
                  />
                </div>
                <div className="grid gap-3.5 sm:grid-cols-2 sm:gap-4">
                  <div className="space-y-1.5">
                    <Label htmlFor="contact_name">Your name</Label>
                    <Input
                      id="contact_name"
                      value={form.contact_name}
                      onChange={(e) => setForm({ ...form, contact_name: e.target.value })}
                      required
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label htmlFor="contact_email">Your email</Label>
                    <Input
                      id="contact_email"
                      type="email"
                      value={form.contact_email}
                      onChange={(e) => setForm({ ...form, contact_email: e.target.value })}
                      required
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="contact_phone">Phone (optional)</Label>
                  <Input
                    id="contact_phone"
                    type="tel"
                    value={form.contact_phone}
                    onChange={(e) => setForm({ ...form, contact_phone: e.target.value })}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="message">
                    {mode === "claim"
                      ? "Anything we should correct or verify?"
                      : "Why does this brand belong on Spotlight?"}
                  </Label>
                  <Textarea
                    id="message"
                    rows={3}
                    maxLength={4000}
                    value={form.message}
                    onChange={(e) => setForm({ ...form, message: e.target.value })}
                    className="resize-none"
                  />
                </div>
              </div>

              <div className="shrink-0 border-t border-border bg-background px-5 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {text.submitLabel}
                </Button>
              </div>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default BrandRequestModal;
