import { useState, useEffect } from "react";
import { X, Info } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const ANNOUNCEMENT_KEY = "skinlabs_pivot_announcement_seen";

const PivotAnnouncementModal = () => {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if user has already seen the announcement
    const hasSeenAnnouncement = localStorage.getItem(ANNOUNCEMENT_KEY);
    
    if (!hasSeenAnnouncement) {
      // Show modal after 30 seconds for new visitors
      const timer = setTimeout(() => {
        setIsOpen(true);
      }, 30000); // 30 seconds

      return () => clearTimeout(timer);
    }
  }, []);

  const handleClose = () => {
    setIsOpen(false);
    // Mark announcement as seen
    localStorage.setItem(ANNOUNCEMENT_KEY, "true");
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                <Info className="h-6 w-6 text-primary" />
              </div>
              <DialogTitle className="text-xl font-heading font-bold text-foreground">
                Important Update
              </DialogTitle>
            </div>
          </div>
        </DialogHeader>
        
        <div className="space-y-4 pt-4">
          <div className="space-y-3">
            <h3 className="text-lg font-semibold text-foreground">
              SkinLabs® is Evolving
            </h3>
            <p className="text-muted-foreground leading-relaxed">
              We've pivoted from an AI-powered e-commerce platform to a{" "}
              <strong className="text-foreground">content and community-first ecosystem</strong>.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Our focus is now on delivering independent skincare education, daily science briefings, 
              honest product reviews, and AI-powered personalized routines—all designed specifically 
              for South African skin and climate.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            <Button onClick={handleClose} variant="outline" className="flex-1">
              Got it
            </Button>
            <Button asChild className="flex-1">
              <a href="/about">Learn More</a>
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default PivotAnnouncementModal;
