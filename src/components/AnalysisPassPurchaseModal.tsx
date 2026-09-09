import { useState } from "react";
import { Loader2, Ticket } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { cn } from "@/lib/utils";
import { usePricingConfig } from "@/lib/pricing-config";
import { startCreditPackCheckout } from "@/lib/paystack";
import { trackConversionEvent } from "@/lib/analytics-events";

interface AnalysisPassPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * "Unlock Advanced Skin Analysis" — the Analysis Pass purchase flow (Section
 * 6). Reuses the existing Paystack checkout (startCreditPackCheckout) and
 * DB-driven credit_packs pricing wholesale; this only adds the compact
 * choose-1-or-3 presentation for it. Packages/prices are never hardcoded
 * here — they come from usePricingConfig(), the same source the Pricing
 * page checkout already uses, so the two can never drift apart.
 */
const AnalysisPassPurchaseModal = ({ open, onOpenChange }: AnalysisPassPurchaseModalProps) => {
  const { data: config, isLoading } = usePricingConfig();
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const packs = [...(config?.creditPacks ?? [])].sort((a, b) => a.credits - b.credits);
  const bestValuePackId = packs.length > 1 ? packs[packs.length - 1].pack_id : null;
  const singlePrice = packs.find((p) => p.credits === 1)?.price;

  const handleContinue = async () => {
    const pack = packs.find((p) => p.pack_id === selectedPackId);
    if (!pack) return;
    setSubmitting(true);
    trackConversionEvent("analysis_pass_package_selected", { packId: pack.pack_id, credits: pack.credits });
    const { error } = await startCreditPackCheckout(pack.pack_id, config?.variantKey ?? "control");
    if (error) setSubmitting(false);
    // On success startCreditPackCheckout redirects the browser — nothing left to do here.
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Unlock Advanced Skin Analysis
          </DialogTitle>
          <DialogDescription>
            Go beyond your Starter Analysis with a deeper, more personalised look at your skin.
          </DialogDescription>
        </DialogHeader>

        {isLoading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-5 w-5 animate-spin text-primary" />
          </div>
        ) : (
          <>
            <RadioGroup value={selectedPackId ?? ""} onValueChange={setSelectedPackId} className="grid gap-3">
              {packs.map((pack) => (
                <div key={pack.pack_id}>
                  <RadioGroupItem value={pack.pack_id} id={`pass-pack-${pack.pack_id}`} className="peer sr-only" />
                  <Label
                    htmlFor={`pass-pack-${pack.pack_id}`}
                    className={cn(
                      "flex items-center justify-between gap-4 p-4 rounded-xl border-2 border-border cursor-pointer transition-all",
                      "hover:border-primary/50 peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-accent",
                    )}
                  >
                    <div>
                      <p className="font-medium text-card-foreground">
                        {pack.credits} Analysis Pass{pack.credits === 1 ? "" : "es"}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {pack.credits === 1 ? "One Advanced Skin Analysis" : `${pack.credits} Advanced Skin Analyses`}
                        {pack.pack_id === bestValuePackId && singlePrice
                          ? ` · Save R${Math.max(0, Math.round(singlePrice * pack.credits - Number(pack.price)))}`
                          : ""}
                      </p>
                    </div>
                    <span className="font-heading font-bold text-card-foreground shrink-0">R{pack.price}</span>
                  </Label>
                </div>
              ))}
            </RadioGroup>

            <Button className="w-full gap-2 mt-2" disabled={!selectedPackId || submitting} onClick={handleContinue}>
              {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
              Continue
            </Button>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default AnalysisPassPurchaseModal;
