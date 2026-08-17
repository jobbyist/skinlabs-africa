import { useState } from "react";
import { Video, Calendar, Star, Sparkles } from "lucide-react";
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
        toast.success("You're on the early access list! We'll notify you when consultations launch.");
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
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-semibold">Coming Soon - Early Access</span>
            </div>
          </div>

          {/* Heading */}
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4 text-center">
            Get Early Access to Virtual Dermatologist Consultations
          </h2>
          <p className="text-lg text-muted-foreground mb-8 text-center max-w-2xl mx-auto">
            Sign up now for priority access to our upcoming virtual consultation platform. Connect with 
            HPCSA-registered dermatologists through secure video sessions at exclusive member rates.
          </p>

          {/* Benefits Grid */}
          <div className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto mb-8">
            {benefits.map((benefit, i) => (
              <div key={i} className="bg-card border border-border rounded-xl p-4 text-center">
                <benefit.icon className="h-6 w-6 text-primary mx-auto mb-2" />
                <p className="text-sm text-card-foreground">{benefit.text}</p>
              </div>
            ))}
          </div>

          <form onSubmit={handleSubmit} className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
            <Input
              type="email"
              placeholder="Enter your email for early access"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="flex-1"
              required
            />
            <Button type="submit" className="gap-2" disabled={loading}>
              {loading ? "Subscribing..." : "Subscribe"}
              <Send className="h-4 w-4" />
              <Sparkles className="h-4 w-4" />
          </form>

          <p className="text-xs text-muted-foreground mt-4">
          <p className="text-xs text-muted-foreground mt-4 text-center">
          </p>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
