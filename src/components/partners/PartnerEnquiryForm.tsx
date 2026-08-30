import { useEffect, useState } from "react";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { enquiryPartnershipModelOptions, type PartnershipModel } from "@/data/partnerPrograms";

const modelIdMap: Record<PartnershipModel["id"], string> = {
  affiliate: "affiliate",
  editorial: "editorial",
  strategic: "strategic_commerce",
};

interface PartnerEnquiryFormProps {
  selectedModel: PartnershipModel["id"] | null;
}

const initialForm = {
  full_name: "",
  business_name: "",
  work_email: "",
  website: "",
  country: "",
  business_type: "",
  partnership_model: "",
  audience_size: "",
  message: "",
};

const PartnerEnquiryForm = ({ selectedModel }: PartnerEnquiryFormProps) => {
  const [form, setForm] = useState(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  useEffect(() => {
    if (selectedModel) {
      setForm((f) => ({ ...f, partnership_model: modelIdMap[selectedModel] }));
    }
  }, [selectedModel]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.business_name || !form.work_email || !form.partnership_model) {
      toast.error("We'll need your name, business, email and partnership interest before submitting.");
      return;
    }
    setSubmitting(true);
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { error } = await (supabase as any).from("partner_enquiries").insert(form);
    setSubmitting(false);
    if (error) {
      toast.error("That didn't go through — please try again.");
      return;
    }
    setDone(true);
    toast.success("Got it. Our partnerships team will be in touch shortly.");
  };

  if (done) {
    return (
      <div className="rounded-2xl border border-border bg-card p-8 text-center">
        <CheckCircle2 className="mx-auto h-12 w-12 text-primary" aria-hidden="true" />
        <p className="mt-4 text-lg font-medium text-foreground">Enquiry received</p>
        <p className="mt-1 text-sm text-muted-foreground">
          We'll be in touch at <span className="text-foreground">{form.work_email}</span>. Feel free to pick a
          time below so we can meet sooner.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6 md:p-8" aria-label="Partnership enquiry form">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="pf-name">Full name *</Label>
          <Input id="pf-name" value={form.full_name} onChange={(e) => setForm({ ...form, full_name: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="pf-business">Business / brand name *</Label>
          <Input id="pf-business" value={form.business_name} onChange={(e) => setForm({ ...form, business_name: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="pf-email">Work email *</Label>
          <Input id="pf-email" type="email" value={form.work_email} onChange={(e) => setForm({ ...form, work_email: e.target.value })} required />
        </div>
        <div>
          <Label htmlFor="pf-website">Website</Label>
          <Input id="pf-website" type="url" placeholder="https://" value={form.website} onChange={(e) => setForm({ ...form, website: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="pf-country">Country</Label>
          <Input id="pf-country" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="pf-type">Business type</Label>
          <Input id="pf-type" placeholder="e.g. Skincare brand, retailer, clinic" value={form.business_type} onChange={(e) => setForm({ ...form, business_type: e.target.value })} />
        </div>
        <div>
          <Label htmlFor="pf-model">Partnership model *</Label>
          <Select value={form.partnership_model} onValueChange={(value) => setForm({ ...form, partnership_model: value })}>
            <SelectTrigger id="pf-model">
              <SelectValue placeholder="Select an option" />
            </SelectTrigger>
            <SelectContent>
              {enquiryPartnershipModelOptions.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div>
          <Label htmlFor="pf-audience">Estimated monthly traffic / audience size</Label>
          <Input id="pf-audience" placeholder="Optional" value={form.audience_size} onChange={(e) => setForm({ ...form, audience_size: e.target.value })} />
        </div>
      </div>

      <div>
        <Label htmlFor="pf-message">Tell us about your partnership idea</Label>
        <Textarea id="pf-message" rows={4} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} placeholder="What are you building, and how would you like to work with SkinLabs®?" />
      </div>

      <Button type="submit" size="lg" className="w-full" disabled={submitting}>
        {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
        Submit enquiry
      </Button>
    </form>
  );
};

export default PartnerEnquiryForm;
