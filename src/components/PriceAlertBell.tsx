import { useState } from "react";
import { Bell, BellRing } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/use-auth";
import { usePriceAlert } from "@/hooks/use-price-tracking";
import { supabase } from "@/integrations/supabase/client";
import { trackConversionEvent } from "@/lib/analytics-events";
import { openSignupDialog } from "@/lib/conversionDialogs";
import { setPendingIntent } from "@/lib/pendingIntent";
import { formatRand } from "@/lib/pricing/saRetailPrices";
import { parseTargetPrice, priceAlertErrorMessage, suggestTarget } from "@/lib/pricing/priceTracking";
import { cn } from "@/lib/utils";

interface PriceAlertBellProps {
  productSlug: string;
  productName: string;
  /** Cheapest verified price right now, if any. */
  currentLowest: number | null;
  className?: string;
}

/**
 * "Track price": a member sets a target rand price and is told in their inbox (and by push, if enabled) when a verified
 * South African retail listing reaches it. Signed-out visitors are asked to sign up and come straight back here.
 * The alert is created and evaluated server-side (set_price_alert / evaluate_price_alerts); this is only the form.
 */
const PriceAlertBell = ({ productSlug, productName, currentLowest, className }: PriceAlertBellProps) => {
  const { user } = useAuth();
  const { alert, refresh } = usePriceAlert(productSlug, user?.id);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const active = alert?.status === "active";
  const triggered = alert?.status === "triggered";

  const begin = () => {
    trackConversionEvent("price_alert_opened", { signed_in: !!user });
    if (!user) {
      setPendingIntent({ action: "unlock", returnTo: `${window.location.pathname}` });
      openSignupDialog("signup");
      return;
    }
    const start = alert?.target_price_zar ?? suggestTarget(currentLowest);
    setValue(start ? String(start) : "");
    setError(null);
    setOpen(true);
  };

  const save = async () => {
    const target = parseTargetPrice(value);
    if (target === null) {
      setError("Enter a price between R1 and R50 000.");
      return;
    }
    setSaving(true);
    setError(null);
    const { data, error: rpcError } = await supabase.rpc("set_price_alert" as never, {
      p_product_slug: productSlug,
      p_product_name: productName,
      p_target_price_zar: target,
    } as never);
    setSaving(false);
    if (rpcError) {
      setError(priceAlertErrorMessage(rpcError.message));
      return;
    }
    trackConversionEvent("price_alert_set", { already_met: !!(data as { already_met?: boolean } | null)?.already_met });
    toast.success(
      (data as { already_met?: boolean } | null)?.already_met
        ? `It's already at or below ${formatRand(target)}. We'll let you know shortly.`
        : `Price alert set for ${formatRand(target)}.`,
    );
    setOpen(false);
    void refresh();
  };

  const remove = async () => {
    setSaving(true);
    const { error: rpcError } = await supabase.rpc("remove_price_alert" as never, { p_product_slug: productSlug } as never);
    setSaving(false);
    if (rpcError) {
      setError(priceAlertErrorMessage(rpcError.message));
      return;
    }
    trackConversionEvent("price_alert_removed");
    toast.success("Price alert turned off.");
    setOpen(false);
    void refresh();
  };

  return (
    <>
      <div className={cn("mt-4 flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3", className)}>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={begin}
          aria-label={active ? `Edit price alert for ${productName}` : `Track the price of ${productName}`}
          className="gap-2 rounded-full"
        >
          {active || triggered ? <BellRing className="h-4 w-4" aria-hidden="true" /> : <Bell className="h-4 w-4" aria-hidden="true" />}
          {active ? "Tracking price" : triggered ? "Alert reached" : "Track price"}
        </Button>
        <p className="min-w-0 flex-1 text-xs text-muted-foreground" aria-live="polite">
          {active && alert
            ? `We'll tell you when it's ${formatRand(alert.target_price_zar)} or less at a South African retailer.`
            : triggered && alert?.triggered_price_zar
              ? `${alert.triggered_retailer ?? "A retailer"} listed it at ${formatRand(alert.triggered_price_zar)}. Tap to set a new alert.`
              : "Get an inbox alert (and a push, if you've enabled them) when it drops to your target price."}
        </p>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Track this price</DialogTitle>
            <DialogDescription>
              {productName}.{" "}
              {currentLowest !== null ? `The lowest verified price right now is ${formatRand(currentLowest)}.` : "We don't have a verified price yet, so we'll alert you when one appears at or below your target."}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-2">
            <Label htmlFor="price-alert-target">Alert me at or below (rand)</Label>
            <Input
              id="price-alert-target"
              inputMode="decimal"
              autoComplete="off"
              placeholder="e.g. 199"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") void save();
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby="price-alert-help"
            />
            {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
            <p id="price-alert-help" className="text-xs text-muted-foreground">
              Only prices read from a retailer's own product page count. Saving also turns on Price alerts in your notification settings; you can change that any time.
            </p>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            {(active || triggered) && (
              <Button type="button" variant="ghost" onClick={() => void remove()} disabled={saving}>
                Turn off
              </Button>
            )}
            <Button type="button" onClick={() => void save()} disabled={saving}>
              {saving ? "Saving..." : active ? "Update alert" : "Set alert"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default PriceAlertBell;
