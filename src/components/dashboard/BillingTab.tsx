import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Download, Loader2, Receipt, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAuth } from "@/hooks/use-auth";
import { useMembership, type MembershipTier } from "@/hooks/use-membership";
import { usePricingConfig } from "@/lib/pricing-config";
import { startCreditPackCheckout, type PaymentGateway } from "@/lib/payments";
import PaymentGatewayDialog from "@/components/PaymentGatewayDialog";
import MembershipCheckoutDialog from "@/components/payments/MembershipCheckoutDialog";
import { notifyAnalysisPassesUpdated } from "@/hooks/use-analysis-passes";
import { cancelPaypalSubscriptions, formatBillingDate, formatUsd, formatZar, getPaypalConfig } from "@/lib/paypal";
import { supabase } from "@/integrations/supabase/client";
import { downloadInvoicePdf } from "@/lib/generateInvoicePdf";
import { toast } from "sonner";

interface Transaction {
  id: string;
  reference: string;
  description: string;
  amount_zar: number;
  purchase_type: string;
  created_at: string;
  gateway: string;
}

const TIER_LABEL: Record<MembershipTier, string> = {
  explorer: "Glow Explorer",
  glow_lite: "Glow Lite",
  insider: "Glow Insider",
  vip: "Glow VIP",
};

interface PaymentSubscription {
  gateway_subscription_id: string;
  plan_id: string;
  billing_interval: "monthly" | "annual";
  status: string;
  first_billing_at: string | null;
  next_billing_at: string | null;
  current_period_end: string | null;
  amount_zar: number;
  amount_charged: number;
  currency: string;
}

const LIVE_SUBSCRIPTION_STATUSES = ["trialing", "active", "past_due"];

interface BillingTabProps {
  aiCredits: number | null;
}

const BillingTab = ({ aiCredits }: BillingTabProps) => {
  const { user } = useAuth();
  const { tier, isTrialing, isSignedIn, trialPlan, trialEndsAt, billingInterval, isFoundingMember } = useMembership();
  const { data: config, isLoading: configLoading } = usePricingConfig();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [buyingPack, setBuyingPack] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [subscription, setSubscription] = useState<PaymentSubscription | null>(null);
  const [paypalAvailable, setPaypalAvailable] = useState(false);
  const [autoRenewOpen, setAutoRenewOpen] = useState(false);

  const loadTransactions = async () => {
    if (!user) {
      setTxLoading(false);
      return;
    }
    const { data } = await supabase
      .from("payment_transactions")
      .select("id, reference, description, amount_zar, purchase_type, created_at, gateway")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });
    setTransactions((data ?? []) as Transaction[]);
    setTxLoading(false);
  };

  useEffect(() => {
    void loadTransactions();
    if (!user) return;
    // payment_subscriptions isn't in the generated Supabase types yet.
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (supabase as unknown as { from: (t: string) => any })
      .from("payment_subscriptions")
      .select("gateway_subscription_id, plan_id, billing_interval, status, first_billing_at, next_billing_at, current_period_end, amount_zar, amount_charged, currency")
      .eq("user_id", user.id)
      .in("status", LIVE_SUBSCRIPTION_STATUSES)
      .order("created_at", { ascending: false })
      .limit(1)
      .then(({ data }: { data: PaymentSubscription[] | null }) => setSubscription(data?.[0] ?? null));
    void getPaypalConfig().then((c) => setPaypalAvailable(c.configured));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const [gatewayPackId, setGatewayPackId] = useState<string | null>(null);

  const handleBuyPack = (packId: string) => {
    setGatewayPackId(packId);
  };

  const handleGatewaySelect = async (gateway: PaymentGateway) => {
    if (!gatewayPackId) return;
    const packId = gatewayPackId;
    setBuyingPack(packId);
    const { error } = await startCreditPackCheckout(gateway, packId, config?.variantKey ?? "control");
    if (error) {
      setBuyingPack(null);
      toast.error(error.message);
    } else {
      setGatewayPackId(null);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
    // Stop PayPal billing first — never tell a member they're cancelled
    // while a recurring charge is still scheduled.
    if (subscription) {
      try {
        await cancelPaypalSubscriptions();
      } catch (err) {
        setCancelling(false);
        setCancelOpen(false);
        toast.error(err instanceof Error ? err.message : "Couldn't cancel your PayPal subscription right now.");
        return;
      }
    }
    const { error } = await supabase.rpc("cancel_subscription");
    setCancelling(false);
    setCancelOpen(false);
    if (error) {
      toast.error("Couldn't cancel right now — please try again or contact us.");
      return;
    }
    toast.success("Your membership has been cancelled — you're back on Glow Explorer.");
    window.location.reload();
  };

  const isSubscribed = tier !== "explorer";
  const nextChargeAt = subscription ? (subscription.next_billing_at ?? subscription.first_billing_at) : null;
  // A trialling member without auto-renew can add PayPal now; billing starts when the trial ends.
  const canSetUpAutoRenew = isTrialing && !subscription && paypalAvailable && !isFoundingMember && Boolean(trialEndsAt);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><ShieldCheck className="h-5 w-5 text-primary" /> Membership</CardTitle>
          <CardDescription>Manage your plan — upgrade, downgrade, or cancel any time.</CardDescription>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <Badge variant={isSubscribed ? "default" : "secondary"} className="text-sm">
              {TIER_LABEL[tier]}{isTrialing ? " (trial)" : ""}
            </Badge>
          </div>
          {subscription && (
            <p className="flex basis-full items-start gap-2 text-sm text-muted-foreground sm:order-last">
              <RefreshCw className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                Auto-renews with PayPal — {formatUsd(Number(subscription.amount_charged))} ({formatZar(Number(subscription.amount_zar))})
                {" "}per {subscription.billing_interval === "annual" ? "year" : "month"}
                {nextChargeAt ? `, next charge on ${formatBillingDate(nextChargeAt)}` : ""}.
                {subscription.status === "past_due" && (
                  <span className="text-destructive"> Your last payment didn't go through — PayPal will retry, or update your card in your PayPal account.</span>
                )}
              </span>
            </p>
          )}
          {canSetUpAutoRenew && trialEndsAt && (
            <p className="basis-full text-sm text-muted-foreground sm:order-last">
              Your free trial ends on {formatBillingDate(trialEndsAt)}. Add PayPal or a card to keep your membership
              without interruption — you won't be charged before then.
            </p>
          )}
          <div className="flex flex-wrap gap-2">
            {canSetUpAutoRenew && (
              <Button size="sm" className="gap-1.5" onClick={() => setAutoRenewOpen(true)}>
                <RefreshCw className="h-3.5 w-3.5" aria-hidden="true" /> Continue after trial
              </Button>
            )}
            <Button asChild size="sm" variant={canSetUpAutoRenew ? "outline" : "default"}>
              <Link to="/pricing">{isSubscribed ? "Change plan" : "Upgrade"}</Link>
            </Button>
            {isSubscribed && (
              <Button variant="outline" size="sm" className="gap-1.5 text-muted-foreground hover:text-destructive" onClick={() => setCancelOpen(true)}>
                <XCircle className="h-3.5 w-3.5" /> Cancel membership
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><CreditCard className="h-5 w-5 text-primary" /> Analysis Passes</CardTitle>
          <CardDescription>
            You have <span className="font-semibold text-foreground">{aiCredits ?? 0}</span> AI analysis credit{aiCredits === 1 ? "" : "s"} available.
            Buy more one-time credits any time — no subscription required.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {configLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              {(config?.creditPacks ?? []).map((pack) => (
                <div key={pack.pack_id} className="flex items-center justify-between rounded-xl border border-border bg-background p-4">
                  <div>
                    <p className="font-medium text-foreground">{pack.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {pack.credits} advanced AI Skin Analys{pack.credits === 1 ? "is" : "es"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="mb-1.5 font-heading text-lg font-bold text-foreground">R{Number(pack.price).toFixed(0)}</p>
                    <Button
                      size="sm"
                      disabled={!isSignedIn || buyingPack === pack.pack_id}
                      onClick={() => handleBuyPack(pack.pack_id)}
                    >
                      {buyingPack === pack.pack_id ? <Loader2 className="h-4 w-4 animate-spin" /> : "Buy"}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Receipt className="h-5 w-5 text-primary" /> Payment details</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Payments are processed securely by PayFast (in Rand) or PayPal (PayPal balance or any debit/credit card,
            charged in USD at the live exchange rate). SkinLabs never stores your card details. Recurring PayPal
            memberships can also be viewed or updated from your PayPal account's automatic payments settings.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Transaction history</CardTitle>
          <CardDescription>Every verified payment on your account, with a downloadable receipt.</CardDescription>
        </CardHeader>
        <CardContent>
          {txLoading ? (
            <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No transactions yet.</p>
          ) : (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between gap-3 py-3 border-b border-border last:border-0">
                  <div className="min-w-0">
                    <p className="truncate font-medium text-foreground">{tx.description}</p>
                    <p className="text-xs text-muted-foreground">{new Date(tx.created_at).toLocaleDateString("en-ZA")} · ref {tx.reference}</p>
                  </div>
                  <div className="flex shrink-0 items-center gap-3">
                    <span className="font-medium text-foreground">R{Number(tx.amount_zar).toFixed(2)}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() =>
                        downloadInvoicePdf({
                          reference: tx.reference,
                          description: tx.description,
                          amountZar: Number(tx.amount_zar),
                          createdAt: tx.created_at,
                          customerName: user?.user_metadata?.full_name ?? "",
                          customerEmail: user?.email ?? "",
                          gateway: tx.gateway,
                        })
                      }
                      aria-label={`Download invoice: ${tx.description} (ref ${tx.reference})`}
                    >
                      <Download className="h-4 w-4" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel your membership?</AlertDialogTitle>
            <AlertDialogDescription>
              You'll move back to Glow Explorer immediately{subscription ? " and your PayPal auto-renewal is stopped" : ""} —
              no more charges, and you keep everything you've already saved. You can resubscribe any time from the
              pricing page.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={cancelling}>Keep my membership</AlertDialogCancel>
            <AlertDialogAction disabled={cancelling} onClick={handleCancel}>
              {cancelling ? "Cancelling…" : "Yes, cancel"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <MembershipCheckoutDialog
        open={autoRenewOpen}
        onOpenChange={setAutoRenewOpen}
        plan={
          trialPlan && trialPlan !== "explorer"
            ? { planId: trialPlan, name: TIER_LABEL[trialPlan as MembershipTier] ?? trialPlan, interval: billingInterval }
            : null
        }
        variantKey={config?.variantKey ?? "control"}
      />

      <PaymentGatewayDialog
        open={!!gatewayPackId}
        onOpenChange={(next) => !buyingPack && !next && setGatewayPackId(null)}
        onSelect={handleGatewaySelect}
        paypal={
          gatewayPackId
            ? { purchaseType: "credit_pack", packId: gatewayPackId, variantKey: config?.variantKey ?? "control" }
            : undefined
        }
        onPaypalApproved={() => {
          toast.success("Payment confirmed — your Analysis Passes are ready.");
          setGatewayPackId(null);
          notifyAnalysisPassesUpdated();
          void loadTransactions();
        }}
      />
    </div>
  );
};

export default BillingTab;
