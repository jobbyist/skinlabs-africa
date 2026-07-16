import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Loader2, CheckCircle2, ChevronLeft, ChevronRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  productType: string;
}

const GOALS = ["Hydration", "Anti-Aging", "Brightening", "Acne Control", "Sensitive Skin", "Firming", "Even Tone", "Barrier Repair"];

export const CustomFormulaRequestModal = ({ open, onOpenChange, productType }: Props) => {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [form, setForm] = useState({
    skin_goals: [] as string[],
    key_ingredients: "",
    allergens: "",
    texture_preference: "",
    scent_preference: "",
    contact_name: "",
    contact_email: "",
    contact_phone: "",
    delivery_address: "",
    notes: "",
  });

  useEffect(() => {
    if (open) {
      setStep(1);
      setDone(false);
      if (user?.email) setForm((f) => ({ ...f, contact_email: user.email || "" }));
    }
  }, [open, user]);

  const toggleGoal = (g: string) =>
    setForm((f) => ({ ...f, skin_goals: f.skin_goals.includes(g) ? f.skin_goals.filter((x) => x !== g) : [...f.skin_goals, g] }));

  const submit = async () => {
    if (!form.contact_name || !form.contact_email) {
      toast.error("Please provide your name and email");
      return;
    }
    setSubmitting(true);
    const { error } = await supabase.from("custom_formula_requests").insert({
      user_id: user?.id ?? null,
      product_type: productType,
      ...form,
    });
    setSubmitting(false);
    if (error) {
      toast.error("Could not submit request. Please try again.");
      return;
    }
    setDone(true);
    toast.success("Request received — our lab will be in touch within 48 hours.");
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Custom {productType}</DialogTitle>
          <DialogDescription>
            {done ? "Your request is in." : `Step ${step} of 4 — tell us what you'd like formulated.`}
          </DialogDescription>
        </DialogHeader>

        {done ? (
          <div className="text-center py-8 space-y-3">
            <CheckCircle2 className="h-12 w-12 text-primary mx-auto" />
            <p className="text-foreground font-medium">Thank you!</p>
            <p className="text-sm text-muted-foreground">
              Our formulation lab will review your brief and reply within 48 hours with next steps.
            </p>
            <Button onClick={() => onOpenChange(false)} className="mt-4">Close</Button>
          </div>
        ) : (
          <div className="space-y-4">
            {step === 1 && (
              <div className="space-y-3">
                <Label>Skin goals (select all that apply)</Label>
                <div className="grid grid-cols-2 gap-2">
                  {GOALS.map((g) => (
                    <label key={g} className="flex items-center gap-2 rounded-lg border border-border p-2 cursor-pointer hover:bg-secondary/40">
                      <Checkbox checked={form.skin_goals.includes(g)} onCheckedChange={() => toggleGoal(g)} />
                      <span className="text-sm">{g}</span>
                    </label>
                  ))}
                </div>
              </div>
            )}

            {step === 2 && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="key">Key ingredients you'd like included</Label>
                  <Textarea id="key" value={form.key_ingredients} onChange={(e) => setForm({ ...form, key_ingredients: e.target.value })} placeholder="e.g. niacinamide, hyaluronic acid, rooibos extract" rows={2} />
                </div>
                <div>
                  <Label htmlFor="allerg">Allergens / ingredients to avoid</Label>
                  <Textarea id="allerg" value={form.allergens} onChange={(e) => setForm({ ...form, allergens: e.target.value })} placeholder="e.g. fragrance, essential oils, nut oils" rows={2} />
                </div>
              </div>
            )}

            {step === 3 && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="tex">Texture preference</Label>
                  <Input id="tex" value={form.texture_preference} onChange={(e) => setForm({ ...form, texture_preference: e.target.value })} placeholder="light gel, rich cream, oil-based, foam…" />
                </div>
                <div>
                  <Label htmlFor="scent">Scent preference</Label>
                  <Input id="scent" value={form.scent_preference} onChange={(e) => setForm({ ...form, scent_preference: e.target.value })} placeholder="unscented, botanical, citrus…" />
                </div>
              </div>
            )}

            {step === 4 && (
              <div className="space-y-3">
                <div>
                  <Label htmlFor="name">Full name *</Label>
                  <Input id="name" value={form.contact_name} onChange={(e) => setForm({ ...form, contact_name: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="email">Email *</Label>
                  <Input id="email" type="email" value={form.contact_email} onChange={(e) => setForm({ ...form, contact_email: e.target.value })} required />
                </div>
                <div>
                  <Label htmlFor="phone">Phone</Label>
                  <Input id="phone" value={form.contact_phone} onChange={(e) => setForm({ ...form, contact_phone: e.target.value })} />
                </div>
                <div>
                  <Label htmlFor="addr">Delivery address</Label>
                  <Textarea id="addr" value={form.delivery_address} onChange={(e) => setForm({ ...form, delivery_address: e.target.value })} rows={2} />
                </div>
                <div>
                  <Label htmlFor="notes">Additional notes</Label>
                  <Textarea id="notes" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} rows={2} />
                </div>
              </div>
            )}

            <div className="flex justify-between pt-2">
              <Button variant="outline" onClick={() => setStep((s) => Math.max(1, s - 1))} disabled={step === 1}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Back
              </Button>
              {step < 4 ? (
                <Button onClick={() => setStep((s) => s + 1)}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              ) : (
                <Button onClick={submit} disabled={submitting}>
                  {submitting ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : null}
                  Submit request
                </Button>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default CustomFormulaRequestModal;
