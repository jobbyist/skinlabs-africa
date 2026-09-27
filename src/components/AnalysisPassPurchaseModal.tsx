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
import { startCreditPackCheckout, type PaymentGateway } from "@/lib/payments";
import { trackConversionEvent } from "@/lib/analytics-events";
import PaymentGatewayDialog from "@/components/PaymentGatewayDialog";
import { notifyAnalysisPassesUpdated } from "@/hooks/use-analysis-passes";
import { toast } from "sonner";

interface AnalysisPassPurchaseModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

/**
 * "Unlock your Advanced AI Dermatology Report" — the Analysis Pass purchase
 * flow (Section 6). Reuses the shared checkout (startCreditPackCheckout) and
 * DB-driven credit_packs pricing wholesale; this only adds the compact
 * choose-1-or-3 presentation for it. Packages/prices are never hardcoded
 * here — they come from usePricingConfig(), the same source the Pricing
 * page checkout already uses, so the two can never drift apart.
 */
const AnalysisPassPurchaseModal = ({ open, onOpenChange }: AnalysisPassPurchaseModalProps) => {
  const { data: config, isLoading } = usePricingConfig();
  const [selectedPackId, setSelectedPackId] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [gatewayDialogOpen, setGatewayDialogOpen] = useState(false);

  const packs = [...(config?.creditPacks ?? [])].sort((a, b) => a.credits - b.credits);
  const bestValuePackId = packs.length > 1 ? packs[packs.length - 1].pack_id : null;
  const singlePrice = packs.find((p) => p.credits === 1)?.price;
  const selectedPack = packs.find((p) => p.pack_id === selectedPackId);

  const handleContinue = () => {
    if (!selectedPack) return;
    trackConversionEvent("analysis_pass_package_selected", { packId: selectedPack.pack_id, credits: selectedPack.credits });
    setGatewayDialogOpen(true);
  };

  const handleGatewaySelect = async (gateway: PaymentGateway) => {
    if (!selectedPack) return;
    setSubmitting(true);
    const { error } = await startCreditPackCheckout(gateway, selectedPack.pack_id, config?.variantKey ?? "control");
    if (error) {
      setSubmitting(false);
      toast.error(error.message);
    } else {
      setGatewayDialogOpen(false);
    }
    // On success startCreditPackCheckout redirects/navigates the browser — nothing left to do here.
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Unlock Your Advanced AI Dermatology Report
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
                        {pack.credits === 1
                          ? "One Advanced AI Dermatology Report"
                          : `${pack.credits} Advanced AI Dermatology Reports`}
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
      <PaymentGatewayDialog
        open={gatewayDialogOpen}
        onOpenChange={(next) => !submitting && setGatewayDialogOpen(next)}
        onSelect={handleGatewaySelect}
        paypal={
          selectedPack
            ? { purchaseType: "credit_pack", packId: selectedPack.pack_id, variantKey: config?.variantKey ?? "control" }
            : undefined
        }
        onPaypalApproved={() => {
          // Captured and granted server-side already — stay on the page.
          if (selectedPack) {
            trackConversionEvent("credit_pack_purchased", { packId: selectedPack.pack_id });
            toast.success(
              `Payment confirmed — ${selectedPack.credits} Analysis Pass${selectedPack.credits === 1 ? " is" : "es are"} ready to use.`,
            );
          }
          notifyAnalysisPassesUpdated();
          setGatewayDialogOpen(false);
          onOpenChange(false);
        }}
      />
    </Dialog>
  );
};

export default AnalysisPassPurchaseModal;
