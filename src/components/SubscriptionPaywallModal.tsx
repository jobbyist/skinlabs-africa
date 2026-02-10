import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CheckCircle2, Sparkles, Shield, Lock, Crown, Truck, Users } from "lucide-react";

interface SubscriptionPaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewContent: string;
  skinType: string;
  concerns: string[];
  onPaymentSuccess?: () => void;
}

const SubscriptionPaywallModal = ({
  open,
  onOpenChange,
  previewContent,
  skinType,
  concerns,
  onPaymentSuccess,
}: SubscriptionPaywallModalProps) => {
  const [isProcessing, setIsProcessing] = useState(false);

  const handleSubscribe = () => {
    setIsProcessing(true);
    // PayFast integration will be connected here
    // For now, simulate and call onPaymentSuccess
    setTimeout(() => {
      setIsProcessing(false);
      if (onPaymentSuccess) {
        onPaymentSuccess();
      } else {
        window.open("https://shop.skinlabs.co.za/pages/subscribe", "_blank");
      }
    }, 500);
  };

  const benefits = [
    { icon: Sparkles, text: "AI-powered personalized skincare routine" },
    { icon: Users, text: "Dermatologist-reviewed recommendations" },
    { icon: Truck, text: "Customized skincare kits delivered to your door" },
    { icon: Shield, text: "30-day money-back guarantee" },
  ];

  const getPreviewSnippet = () => {
    const lines = previewContent.split("\n").slice(0, 6);
    return lines.join("\n") + "\n\n...";
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader className="text-center pb-2">
          <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
            <Crown className="h-8 w-8 text-primary" />
          </div>
          <DialogTitle className="text-2xl font-heading">
            Unlock Your Full Skincare Report
          </DialogTitle>
          <DialogDescription className="text-base">
            Your personalized {skinType} skin routine is ready!
          </DialogDescription>
        </DialogHeader>

        {/* Preview snippet */}
        <div className="relative bg-secondary/30 rounded-xl p-4 my-4 max-h-40 overflow-hidden">
          <div className="text-sm text-muted-foreground whitespace-pre-line">
            {getPreviewSnippet()}
          </div>
          <div className="absolute inset-0 bg-gradient-to-t from-card via-card/80 to-transparent flex items-end justify-center pb-4">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Lock className="h-4 w-4" />
              <span className="text-sm font-medium">Subscribe to unlock full report</span>
            </div>
          </div>
        </div>

        {/* Concerns */}
        <div className="flex flex-wrap gap-2 justify-center mb-4">
          {concerns.slice(0, 3).map((concern) => (
            <Badge key={concern} variant="secondary" className="text-xs">
              {concern}
            </Badge>
          ))}
          {concerns.length > 3 && (
            <Badge variant="secondary" className="text-xs">
              +{concerns.length - 3} more
            </Badge>
          )}
        </div>

        {/* Benefits */}
        <div className="space-y-3 mb-6">
          {benefits.map((benefit, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-full bg-accent flex items-center justify-center flex-shrink-0">
                <benefit.icon className="h-4 w-4 text-primary" />
              </div>
              <span className="text-sm text-card-foreground">{benefit.text}</span>
            </div>
          ))}
        </div>

        {/* Pricing */}
        <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 text-center mb-4">
          <div className="flex items-baseline justify-center gap-1">
            <span className="text-4xl font-bold text-primary">R99</span>
            <span className="text-muted-foreground">/month</span>
          </div>
          <p className="text-sm text-muted-foreground mt-1">
            Cancel anytime • 30-day money-back guarantee
          </p>
        </div>

        {/* CTA */}
        <Button
          size="lg"
          className="w-full gap-2"
          onClick={handleSubscribe}
          disabled={isProcessing}
        >
          {isProcessing ? (
            "Processing..."
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              Subscribe & Unlock My Report
            </>
          )}
        </Button>

        {/* Trust signals */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-1">
            <Shield className="h-3 w-3" />
            <span>Secure Payment</span>
          </div>
          <div className="flex items-center gap-1">
            <CheckCircle2 className="h-3 w-3" />
            <span>Dermatologist Reviewed</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPaywallModal;
