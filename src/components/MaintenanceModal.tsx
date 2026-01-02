import { useState, useEffect } from "react";
import { AlertCircle, Mail, Phone, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "sonner";

const REOPEN_DATE = "7th January 2026";
const MAINTENANCE_MODAL_KEY = "skinlabs_maintenance_modal_dismissed";
const ACTIVE_BROWSING_DURATION = 30000; // 30 seconds in milliseconds

const MaintenanceModal = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [contactMethod, setContactMethod] = useState<"email" | "sms">("email");

  useEffect(() => {
    // Check if user has already dismissed the modal
    const dismissed = localStorage.getItem(MAINTENANCE_MODAL_KEY);
    
    if (dismissed) {
      return; // Don't show modal if already dismissed
    }

    let activeTime = 0;
    let lastInteractionTime = Date.now();
    let timerStarted = false;

    // Track active browsing time
    const trackActivity = () => {
      lastInteractionTime = Date.now();
      if (!timerStarted) {
        timerStarted = true;
        startTimer();
      }
    };

    const startTimer = () => {
      const interval = setInterval(() => {
        const currentTime = Date.now();
        const timeSinceLastInteraction = currentTime - lastInteractionTime;

        // Only count time if user was active in the last 5 seconds
        if (timeSinceLastInteraction < 5000) {
          activeTime += 1000;

          // Show modal after 30 seconds of active browsing
          if (activeTime >= ACTIVE_BROWSING_DURATION) {
            setIsOpen(true);
            clearInterval(interval);
            // Remove event listeners after modal is shown
            window.removeEventListener("mousemove", trackActivity);
            window.removeEventListener("keydown", trackActivity);
            window.removeEventListener("scroll", trackActivity);
            window.removeEventListener("click", trackActivity);
          }
        }
      }, 1000);

      // Cleanup interval on unmount
      return () => clearInterval(interval);
    };

    // Listen for user interactions
    window.addEventListener("mousemove", trackActivity);
    window.addEventListener("keydown", trackActivity);
    window.addEventListener("scroll", trackActivity);
    window.addEventListener("click", trackActivity);

    // Cleanup event listeners on unmount
    return () => {
      window.removeEventListener("mousemove", trackActivity);
      window.removeEventListener("keydown", trackActivity);
      window.removeEventListener("scroll", trackActivity);
      window.removeEventListener("click", trackActivity);
    };
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(MAINTENANCE_MODAL_KEY, "true");
    setIsOpen(false);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (contactMethod === "email" && email) {
      toast.success("Thank you! We'll notify you via email when we reopen.");
      localStorage.setItem(MAINTENANCE_MODAL_KEY, "true");
      setIsOpen(false);
    } else if (contactMethod === "sms" && phone) {
      toast.success("Thank you! We'll notify you via SMS when we reopen.");
      localStorage.setItem(MAINTENANCE_MODAL_KEY, "true");
      setIsOpen(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-2">
            <AlertCircle className="h-6 w-6 text-primary" />
            <DialogTitle className="text-xl">Important Update</DialogTitle>
          </div>
          <DialogDescription className="text-left space-y-3 pt-2">
            <p className="text-base">
              <strong>Site Maintenance Notice:</strong> We're currently upgrading our website, which is causing limited functionality.
            </p>
            <p className="text-base">
              We will not be accepting new orders until we reopen for business on <strong>{REOPEN_DATE}</strong>.
            </p>
            <p className="text-base">
              Find our products exclusively on{" "}
              <a 
                href="https://www.takealot.com" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-primary underline hover:text-primary/80"
              >
                Takealot
              </a>{" "}
              until we reopen.
            </p>
          </DialogDescription>
        </DialogHeader>

        <div className="mt-4 border-t pt-4">
          <h3 className="font-semibold text-foreground mb-2">
            🎁 Get Notified When We Reopen!
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Be the first to know about our grand reopening and receive an exclusive <strong>15% discount code</strong> on your first order!
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="flex gap-2 mb-3">
              <Button
                type="button"
                variant={contactMethod === "email" ? "default" : "outline"}
                size="sm"
                onClick={() => setContactMethod("email")}
                className="flex-1 gap-2"
              >
                <Mail className="h-4 w-4" />
                Email
              </Button>
              <Button
                type="button"
                variant={contactMethod === "sms" ? "default" : "outline"}
                size="sm"
                onClick={() => setContactMethod("sms")}
                className="flex-1 gap-2"
              >
                <Phone className="h-4 w-4" />
                SMS
              </Button>
            </div>

            {contactMethod === "email" ? (
              <Input
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="w-full"
              />
            ) : (
              <Input
                type="tel"
                placeholder="Enter your phone number"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
                className="w-full"
              />
            )}

            <div className="flex gap-2">
              <Button type="submit" className="flex-1">
                Notify Me
              </Button>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={handleDismiss}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </form>

          <p className="text-xs text-muted-foreground mt-3 text-center">
            No spam, just updates about our reopening and your exclusive discount!
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default MaintenanceModal;
