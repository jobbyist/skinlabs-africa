import { useState, useEffect } from "react";
import { X, Cookie } from "lucide-react";
import { Button } from "@/components/ui/button";

const COOKIE_CONSENT_KEY = "skinlabs_cookie_consent";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has previously consented
    const consentData = localStorage.getItem(COOKIE_CONSENT_KEY);
    
    if (!consentData) {
      // First visit - show banner
      setIsVisible(true);
    } else {
      try {
        const { timestamp } = JSON.parse(consentData);
        const daysSinceConsent = Date.now() - timestamp;
        
        // Show banner again after 30 days
        if (daysSinceConsent >= THIRTY_DAYS) {
          setIsVisible(true);
        }
      } catch (error) {
        // If there's an error parsing, show the banner
        setIsVisible(true);
      }
    }
  }, []);

  const handleAccept = () => {
    const consentData = {
      accepted: true,
      timestamp: Date.now(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    setIsVisible(false);
  };

  const handleDecline = () => {
    const consentData = {
      accepted: false,
      timestamp: Date.now(),
    };
    localStorage.setItem(COOKIE_CONSENT_KEY, JSON.stringify(consentData));
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border shadow-lg">
      <div className="container mx-auto px-4 py-4">
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-start gap-3 flex-1">
            <Cookie className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
            <div className="flex-1">
              <h3 className="font-semibold text-foreground mb-1">
                Cookie Consent
              </h3>
              <p className="text-sm text-muted-foreground">
                We use cookies to enhance your experience, analyze site traffic, and for marketing purposes. 
                By clicking "Accept", you consent to our use of cookies.{" "}
                <a href="#" className="text-primary hover:underline">
                  Learn more
                </a>
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-2 w-full md:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={handleDecline}
              className="flex-1 md:flex-none"
            >
              Decline
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleAccept}
              className="flex-1 md:flex-none"
            >
              Accept
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleDecline}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CookieConsent;
