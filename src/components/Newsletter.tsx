import { useState } from "react";
import { Send, Video, Calendar, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from("newsletter_subscribers")
        .insert({ email });

      if (error) {
        if (error.code === "23505") {
          toast.info("You're already subscribed!");
        } else {
          throw error;
        }
      } else {
        toast.success("Thank you for subscribing!");
      }
      setEmail("");
    } catch (err) {
      console.error(err);
      toast.error("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const benefits = [
    { icon: Video, text: "In-app video chat with licensed dermatologists" },
    { icon: Calendar, text: "Book appointments in minutes at discounted rates" },
    { icon: Star, text: "Browse directory of top-rated specialists" },
  ];

  return (
    <section className="py-20 bg-gradient-to-b from-primary/5 to-background">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Badge */}
          <div className="flex justify-center mb-6">
            <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-4 py-2 rounded-full">
              <CheckCircle2 className="h-4 w-4" />
              <span className="text-sm font-semibold">Exclusive for Premium Members</span>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4 text-center">
            Book A Virtual Consultation With A Licensed Dermatologist
          </h2>
          <p className="text-lg text-muted-foreground mb-8 text-center max-w-2xl mx-auto">
            We're introducing an exclusive feature for premium users to connect with qualified specialists. 
            Browse our directory, compare rates, and book appointments with top-rated dermatologists in our 
            network at discounted rates.
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" className="gap-2" disabled={loading}>
              {loading ? "Subscribing..." : "Subscribe"}
              <Send className="h-4 w-4" />
            </Button>
          </form>

          <p className="text-xs text-muted-foreground mt-4">
            By subscribing, you agree to our Privacy Policy and consent to receive updates.
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
