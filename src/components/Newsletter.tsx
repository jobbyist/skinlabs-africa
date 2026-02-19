import { useState } from "react";
import { Send, Video, Calendar, Star, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";

const Newsletter = () => {
  const [email, setEmail] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (email) {
      toast.success("You'll be notified when this feature goes live!");
      setEmail("");
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

          {/* Benefits Grid */}
          <div className="grid md:grid-cols-3 gap-6 mb-10">
            {benefits.map((benefit, index) => (
              <div key={index} className="bg-card border border-border rounded-2xl p-6 text-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm text-foreground">{benefit.text}</p>
              </div>
            ))}
          </div>

          {/* Key Features */}
          <div className="bg-card border border-border rounded-2xl p-8 mb-8">
            <h3 className="text-xl font-semibold text-foreground mb-4 text-center">
              Get Informed Answers & Solutions With Ease
            </h3>
            <p className="text-muted-foreground text-center mb-6">
              Anywhere, anytime via our in-app video chat feature
            </p>
            <div className="grid md:grid-cols-2 gap-4">
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <p className="text-sm text-muted-foreground">
                  Compare rates from multiple specialists
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <p className="text-sm text-muted-foreground">
                  Discounted rates for premium members
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <p className="text-sm text-muted-foreground">
                  Book appointments in minutes
                </p>
              </div>
              <div className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2" />
                <p className="text-sm text-muted-foreground">
                  Top-rated dermatologists in our network
                </p>
              </div>
            </div>
          </div>

          {/* CTA Form */}
          <div className="text-center">
            <p className="text-foreground font-semibold mb-4">
              Be Notified When This Feature Goes Live
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
              <Button type="submit" className="gap-2">
                Notify Me
                <Send className="h-4 w-4" />
              </Button>
            </form>
            <p className="text-xs text-muted-foreground mt-4">
              By subscribing, you agree to our Privacy Policy and consent to receive updates.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Newsletter;
