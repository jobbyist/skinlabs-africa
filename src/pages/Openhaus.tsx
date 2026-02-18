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
import openhausImage from "/openhaus.png";

const formSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters"),
  lastName: z.string().min(2, "Last name must be at least 2 characters"),
  email: z.string().email("Please enter a valid email address"),
  phone: z.string().min(10, "Please enter a valid phone number"),
  city: z.string().min(2, "City/Town is required"),
  country: z.string().min(2, "Country is required"),
});

type FormData = z.infer<typeof formSchema>;

const Openhaus = () => {
  const { toast } = useToast();
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

  // Countdown timer - ends March 1st, 2026 at 12:00am
  useEffect(() => {
    const targetDate = new Date("2026-03-01T00:00:00").getTime();

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
    // Here you would typically send the data to your backend
    console.log("Form submitted:", data);
    
    toast({
      title: "Successfully Joined! 🎉",
      description: "You've been added to the OPENHAUS early bird waiting list. Check your email for confirmation.",
    });

    reset();
  };

  return (
    <>
      <Helmet>
        <title>OPENHAUS by Skinlabs - Coming Soon</title>
        <meta
          name="description"
          content="Join the OPENHAUS by Skinlabs waiting list and unlock exclusive rewards, free product samples, sponsored giveaways & discounts when we launch!"
        />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-12 md:py-20">
            <div className="container mx-auto px-4">
              <div className="max-w-6xl mx-auto">
                {/* Hero Image */}
                <div className="mb-12 rounded-3xl overflow-hidden shadow-2xl">
                  <img
                    src={openhausImage}
                    alt="OPENHAUS by Skinlabs - Multivendor Marketplace"
                    className="w-full h-auto object-cover"
                  />
                </div>

                {/* Countdown Timer */}
                <div className="mb-12 text-center">
                  <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
                    Launching In
                  </h2>
                  <div className="flex justify-center gap-4 md:gap-8">
                    {[
                      { label: "Days", value: timeLeft.days },
                      { label: "Hours", value: timeLeft.hours },
                      { label: "Minutes", value: timeLeft.minutes },
                      { label: "Seconds", value: timeLeft.seconds },
                    ].map((item) => (
                      <div
                        key={item.label}
                        className="bg-card border border-border rounded-2xl p-4 md:p-6 min-w-[80px] md:min-w-[120px] shadow-lg"
                      >
                        <div className="text-3xl md:text-5xl font-bold text-primary">
                          {String(item.value).padStart(2, "0")}
                        </div>
                        <div className="text-sm md:text-base text-muted-foreground mt-2">
                          {item.label}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Signup Form */}
                <div className="max-w-3xl mx-auto bg-card border border-border rounded-3xl p-8 md:p-12 shadow-xl">
                  <div className="text-center mb-8">
                    <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-4">
                      Join Our Early Bird Waiting List To Unlock Exclusive Rewards, Free Product
                      Samples, Sponsored Giveaways &amp; Discounts When We Launch 🚀
                    </h2>
                    <p className="text-sm text-muted-foreground">
                      Skinlabs Premium members are automatically added to the waiting list, no
                      opt-in required.{" "}
                      <a
                        href="/get-started"
                        className="text-primary hover:underline font-medium"
                      >
                        Click here to become a premium member for R49 per month
                      </a>
                    </p>
                  </div>

                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="firstName">First Name</Label>
                        <Input
                          id="firstName"
                          placeholder="John"
                          {...register("firstName")}
                          className={errors.firstName ? "border-destructive" : ""}
                        />
                        {errors.firstName && (
                          <p className="text-sm text-destructive">{errors.firstName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="lastName">Last Name</Label>
                        <Input
                          id="lastName"
                          placeholder="Doe"
                          {...register("lastName")}
                          className={errors.lastName ? "border-destructive" : ""}
                        />
                        {errors.lastName && (
                          <p className="text-sm text-destructive">{errors.lastName.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="email">Email Address</Label>
                        <Input
                          id="email"
                          type="email"
                          placeholder="john@example.com"
                          {...register("email")}
                          className={errors.email ? "border-destructive" : ""}
                        />
                        {errors.email && (
                          <p className="text-sm text-destructive">{errors.email.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone"
                          type="tel"
                          placeholder="+27 12 345 6789"
                          {...register("phone")}
                          className={errors.phone ? "border-destructive" : ""}
                        />
                        {errors.phone && (
                          <p className="text-sm text-destructive">{errors.phone.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="city">City/Town</Label>
                        <Input
                          id="city"
                          placeholder="Johannesburg"
                          {...register("city")}
                          className={errors.city ? "border-destructive" : ""}
                        />
                        {errors.city && (
                          <p className="text-sm text-destructive">{errors.city.message}</p>
                        )}
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor="country">Country</Label>
                        <Input
                          id="country"
                          placeholder="South Africa"
                          {...register("country")}
                          className={errors.country ? "border-destructive" : ""}
                        />
                        {errors.country && (
                          <p className="text-sm text-destructive">{errors.country.message}</p>
                        )}
                      </div>
                    </div>

                    <Button type="submit" size="lg" className="w-full text-lg">
                      Join the Waiting List
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
