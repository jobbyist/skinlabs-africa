import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { CreditCard, Download, Loader2, Receipt, ShieldCheck, XCircle } from "lucide-react";
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
import { startCreditPackCheckout } from "@/lib/paystack";
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
}

const TIER_LABEL: Record<MembershipTier, string> = {
  explorer: "Glow Explorer",
  glow_lite: "Glow Lite",
  insider: "Glow Insider",
  vip: "Glow VIP",
};

interface BillingTabProps {
  aiCredits: number | null;
}

const BillingTab = ({ aiCredits }: BillingTabProps) => {
  const { user } = useAuth();
  const { tier, isTrialing, isSignedIn } = useMembership();
  const { data: config, isLoading: configLoading } = usePricingConfig();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [txLoading, setTxLoading] = useState(true);
  const [buyingPack, setBuyingPack] = useState<string | null>(null);
  const [cancelOpen, setCancelOpen] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!user) {
      setTxLoading(false);
      return;
    }
    supabase
      .from("payment_transactions")
      .select("id, reference, description, amount_zar, purchase_type, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setTransactions((data ?? []) as Transaction[]);
        setTxLoading(false);
      });
  }, [user]);

  const handleBuyPack = async (packId: string) => {
    setBuyingPack(packId);
    const { error } = await startCreditPackCheckout(packId, config?.variantKey ?? "control");
    if (error) {
      setBuyingPack(null);
      toast.error(error.message);
    }
  };

  const handleCancel = async () => {
    setCancelling(true);
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
          <div className="flex flex-wrap gap-2">
            <Button asChild size="sm">
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
            Payments are processed securely by Paystack at checkout. SkinLabs never stores your card details — to
            update a card, simply pay again at checkout and Paystack will prompt you for fresh details.
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
                        })
                      }
                      aria-label="Download invoice"
                    >
                      <Download className="h-4 w-4" />
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
              You'll move back to Glow Explorer immediately — no more charges, and you keep everything you've
              already saved. You can resubscribe any time from the pricing page.
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
    </div>
  );
};

export default BillingTab;
