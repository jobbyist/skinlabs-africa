import { useState } from "react";
import { Link } from "react-router-dom";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Sparkles, Shield, Lock, Crown, Truck, Users, Mail, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks/use-auth";

interface SubscriptionPaywallModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  previewContent: string;
  skinType: string;
  concerns: string[];
  age?: string;
  lifestyle?: string;
  environment?: string;
  currentProducts?: string;
  allergies?: string;
  onSubscriptionComplete?: () => void;
}

const SubscriptionPaywallModal = ({
  open,
  onOpenChange,
  previewContent,
  skinType,
  concerns,
  age,
  lifestyle,
  environment,
  currentProducts,
  allergies,
  onSubscriptionComplete,
}: SubscriptionPaywallModalProps) => {
  const { user } = useAuth();
  const [step, setStep] = useState<'preview' | 'email'>('preview');
  const [email, setEmail] = useState(user?.email || '');
  const [name, setName] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);

  const benefits = [
    { icon: Sparkles, text: "AI-powered personalized skincare routine" },
    { icon: Mail, text: "Email delivery of your full routine" },
    { icon: Users, text: "Dermatologist approved recommendations" },
    { icon: Truck, text: "Customized skincare kits delivered monthly" },
    { icon: Shield, text: "30-day money-back guarantee" },
  ];

  const getPreviewSnippet = () => {
    const lines = previewContent.split('\n').slice(0, 6);
    return lines.join('\n') + '\n\n...';
  };

  const handleSubscribe = async () => {
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    if (!email.includes('@')) {
      toast.error("Please enter a valid email address");
      return;
    }

    setIsProcessing(true);
    
    try {
      // Save recommendation to database
      if (user) {
        const { error: dbError } = await supabase
          .from('skincare_recommendations')
          .insert({
            user_id: user.id,
            skin_type: skinType,
            concerns: concerns,
            age_range: age,
            lifestyle: lifestyle,
            environment: environment,
            current_products: currentProducts,
            allergies: allergies,
            recommendation: previewContent,
            email_sent_to: email,
          });

        if (dbError) {
          console.error("Error saving recommendation:", dbError);
        }

        // Update profile subscription status
        const { error: profileError } = await supabase
          .from('profiles')
          .update({
            subscription_status: 'active',
            subscription_started_at: new Date().toISOString(),
            email: email,
            full_name: name || null,
          })
          .eq('user_id', user.id);

        if (profileError) {
          console.error("Error updating profile:", profileError);
        }
      }

      // Send email with skincare routine
      const { data, error } = await supabase.functions.invoke('send-skincare-email', {
        body: {
          email,
          name,
          skinType,
          concerns,
          recommendation: previewContent,
        },
      });

      if (error) {
        console.error("Error sending email:", error);
        toast.error("Failed to send email. Your routine has been saved to your dashboard.");
      } else {
        toast.success("Your personalized skincare routine has been sent to your email!");
      }

      onSubscriptionComplete?.();
      onOpenChange(false);
    } catch (error) {
      console.error("Error:", error);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        {step === 'preview' ? (
          <>
            <DialogHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Crown className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-heading">
                Unlock Your Full Skincare Routine
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
                  <span className="text-sm font-medium">Subscribe to unlock full routine</span>
                </div>
              </div>
            </div>

            {/* Concerns addressed */}
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

            {/* Benefits list */}
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
                <span className="text-4xl font-bold text-primary">$4.99</span>
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
              onClick={() => setStep('email')}
            >
              <Sparkles className="h-4 w-4" />
              Subscribe & Unlock My Routine
            </Button>

            {/* Trust signals */}
            <div className="flex items-center justify-center gap-4 mt-4 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                <span>Secure Payment</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle2 className="h-3 w-3" />
                <span>Dermatologist Approved</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <DialogHeader className="text-center pb-2">
              <div className="mx-auto w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mb-4">
                <Mail className="h-8 w-8 text-primary" />
              </div>
              <DialogTitle className="text-2xl font-heading">
                Where should we send your routine?
              </DialogTitle>
              <DialogDescription className="text-base">
                We'll email your personalized skincare routine so you can access it anytime.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 my-6">
              <div className="space-y-2">
                <Label htmlFor="name">Your Name (Optional)</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Enter your name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Summary */}
            <div className="bg-secondary/30 rounded-xl p-4 mb-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Monthly Subscription</span>
                <span className="font-bold text-primary">$4.99/mo</span>
              </div>
              <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                <CheckCircle2 className="h-3 w-3 text-green-500" />
                <span>30-day money-back guarantee included</span>
              </div>
            </div>

            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setStep('preview')}
                className="flex-1"
              >
                Back
              </Button>
              <Button 
                size="lg" 
                className="flex-1 gap-2" 
                onClick={handleSubscribe}
                disabled={isProcessing || !email}
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Processing...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="h-4 w-4" />
                    Complete Subscription
                  </>
                )}
              </Button>
            </div>

            <p className="text-xs text-center text-muted-foreground mt-4">
              By subscribing, you agree to our{" "}
              <Link to="/terms-of-service" className="text-primary hover:underline">
                Terms of Service
              </Link>{" "}
              and{" "}
              <Link to="/privacy-policy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
              .
            </p>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default SubscriptionPaywallModal;
