import { useState, useEffect } from "react";
import { Helmet } from "react-helmet-async";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import openhausImage from "/openhaus.png";
import AdSlot from "@/components/AdSlot";
import { trialLength } from "@/lib/promo";

const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number").regex(/^\+?[0-9\s\-()]+$/, "Phone number can only contain numbers, spaces, hyphens, parentheses, and optional leading +"),
  city: z.string().min(2, "City/Town is required"),
  country: z.string().min(2, "Country is required"),
});

type FormData = z.infer<typeof formSchema>;

const WAITLIST_FIELDS: {
  name: keyof FormData;
  label: string;
  placeholder: string;
  autoComplete: string;
  type?: string;
}[] = [
  { name: "firstName", label: "First Name", placeholder: "John", autoComplete: "given-name" },
  { name: "lastName", label: "Last Name", placeholder: "Doe", autoComplete: "family-name" },
  { name: "email", label: "Email Address", placeholder: "john@example.com", autoComplete: "email", type: "email" },
  { name: "phone", label: "Phone Number", placeholder: "+27 12 345 6789", autoComplete: "tel", type: "tel" },
  { name: "city", label: "City/Town", placeholder: "Johannesburg", autoComplete: "address-level2" },
  { name: "country", label: "Country", placeholder: "South Africa", autoComplete: "country-name" },
];

const Openhaus = () => {
  const { toast } = useToast();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>({
    resolver: zodResolver(formSchema),
  });

  // Countdown timer — Marketplace launch: 1 December 2026 at 00:00 SAST
  useEffect(() => {
    const targetDate = new Date("2026-12-01T00:00:00+02:00").getTime();

    const updateCountdown = () => {
      const now = new Date().getTime();
      const distance = targetDate - now;

      if (distance > 0) {
        setTimeLeft({
          days: Math.floor(distance / (1000 * 60 * 60 * 24)),
          hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
          minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
          seconds: Math.floor((distance % (1000 * 60)) / 1000),
        });
      } else {
        setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, []);

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true);
    try {
      const { error } = await supabase.from("openhaus_waitlist").insert({
        first_name: data.firstName,
        last_name: data.lastName,
        email: data.email,
        phone: data.phone,
        city: data.city,
        country: data.country,
      });

      if (error) throw error;

      toast({
        title: "You're on the list",
        description: "Check your email for confirmation — we'll be in touch closer to launch.",
      });

      reset();
    } catch (err) {
      console.error("Waitlist submission error:", err);
      toast({
        title: "That didn't go through",
        description: "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Helmet>
        <title>Marketplace by Openhaus — Coming Soon | SkinLabs®</title>
        <meta name="description" content="Openhaus by SkinLabs® is our upcoming multivendor marketplace. Join the early bird waiting list for launch samples, giveaways and discounts. Launching 1 December 2026." />
        <link rel="canonical" href="https://skinlabs.co.za/shop" />
        <meta property="og:title" content="Marketplace by Openhaus — Coming Soon" />
        <meta property="og:description" content="Join the Openhaus waiting list for launch samples, giveaways and discounts. Launching 1 December 2026." />
        <meta property="og:url" content="https://skinlabs.co.za/shop" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://skinlabs.co.za/openhaus.png" />
        <meta name="twitter:card" content="summary_large_image" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-12 md:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                <div className="mx-auto mb-8 max-w-2xl text-center">
                  <p className="mb-2 text-sm font-medium uppercase tracking-wider text-primary">Coming soon</p>
                  <h1 className="font-heading text-3xl font-bold leading-tight text-foreground md:text-5xl">
                    Marketplace by Openhaus
                  </h1>
                  <p className="mt-3 text-muted-foreground">
                    SkinLabs&apos; multivendor skincare marketplace — join the early bird list for launch samples,
                    giveaways and discounts.
                  </p>
                </div>

                {/* openhaus.png has a transparent background — keep it on white in both themes. */}
                <div className="mb-12 rounded-3xl overflow-hidden border border-border bg-white shadow-md">
                  <img
                    src={openhausImage}
                    alt="OPENHAUS by Skinlabs - Multivendor Marketplace"
                    className="w-full h-auto object-cover"
                  />
                </div>

                <AdSlot placement="shop-mid" compact />

                <div className="mb-12 text-center">
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-2">
                    Launching 1 December 2026
                  </h2>
                  <p className="text-muted-foreground mb-6">Countdown to Marketplace by Openhaus</p>
                  <div className="flex justify-center gap-2 sm:gap-4 md:gap-8">
                    {[
                      { label: "Days", value: timeLeft.days },
                      { label: "Hours", value: timeLeft.hours },
                      { label: "Minutes", value: timeLeft.minutes },
                      { label: "Seconds", value: timeLeft.seconds },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-card border border-border rounded-2xl p-3 sm:p-4 md:p-6 min-w-[72px] sm:min-w-[80px] md:min-w-[120px] shadow-sm"
                      >
                        <div className="font-heading text-3xl md:text-5xl font-bold tabular-nums text-primary">
                          {String(item.value).padStart(2, "0")}
                        </div>
                        <div className="text-sm md:text-base text-muted-foreground mt-2">{item.label}</div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="max-w-3xl mx-auto bg-card border border-border rounded-3xl p-6 sm:p-8 md:p-12 shadow-sm">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
                      Join the early bird waiting list for launch samples, giveaways and discounts
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Paid SkinLabs members are added automatically — no opt-in needed.{" "}
                      <a href="/pricing" className="text-primary hover:underline font-medium">
                        Or try Glow Insider free {trialLength()}
                      </a>
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      {WAITLIST_FIELDS.map((field) => {
                        const error = errors[field.name]?.message;
                        const errorId = `${field.name}-error`;
                        return (
                          <div key={field.name} className="space-y-2">
                            <Label htmlFor={field.name}>{field.label}</Label>
                            <Input
                              id={field.name}
                              type={field.type ?? "text"}
                              autoComplete={field.autoComplete}
                              placeholder={field.placeholder}
                              aria-invalid={error ? true : undefined}
                              aria-describedby={error ? errorId : undefined}
                              {...register(field.name)}
                              className={error ? "border-destructive" : ""}
                            />
                            {error && (
                              <p id={errorId} className="text-sm text-destructive">
                                {error}
                              </p>
                            )}
                          </div>
                        );
                      })}
                    </div>

                    <Button type="submit" size="lg" className="w-full text-lg" disabled={isSubmitting}>
                      {isSubmitting ? "Submitting..." : "Join the Waiting List"}
                    </Button>
                  </form>
                </div>
              </div>
            </div>
          </section>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default Openhaus;
