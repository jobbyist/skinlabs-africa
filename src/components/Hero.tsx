import { useState, useRef, useEffect } from "react";
import { ArrowRight, Atom, Users, Newspaper, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroVideo from "@/assets/hero-video.mp4";
import { useMembership } from "@/hooks/use-membership";

const stats = [
  {
    icon: Users,
    value: "3.7K+",
    label: "Community Members",
  },
  {
    icon: Newspaper,
    value: "Daily",
    label: "SA Skin Briefings",
  },
  {
    icon: Star,
    value: "4.75/5",
    label: "Member Rating",
  },
];

const Hero = () => {
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { isMember, trialUsed, loading: membershipLoading } = useMembership();

  // Respect prefers-reduced-motion and skip forcing an autoplaying background video onto that traffic.
  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches && videoRef.current) {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const togglePlay = () => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  return (
    <section className="relative min-h-screen flex items-center overflow-hidden pt-20">
      <div className="absolute inset-0 z-0">
        <video
          ref={videoRef}
          src={heroVideo}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/50" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center lg:text-left lg:mx-0">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full text-accent-foreground text-sm font-medium">
              {/* SA flag on mobile; Atom icon on larger screens */}
              <span className="text-base leading-none md:hidden" aria-hidden="true">
                🇿🇦
              </span>
              <Atom className="hidden h-4 w-4 md:inline" />
              SA’s Premier Skincare Intelligence Hub
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-foreground leading-tight drop-shadow-lg">
              Skincare, without the nonsense.
            </h1>

            <p className="text-lg font-medium text-foreground/90 max-w-xl mx-auto lg:mx-0 drop-shadow-sm">
              We read the ingredient list so you don't have to. Evidence-graded product reviews, daily skin
              science briefings and an AI formulator that builds your routine around your skin, our climate
              and your budget — no affiliate deals, no gifted samples.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" className="gap-2 text-base px-8" asChild>
                <a href="/ai-formulator">
                  <Atom className="h-4 w-4" />
                  Start Your Skin Analysis
                </a>
              </Button>
              {/* Already a paying member — offering a free trial they can't use is redundant/misleading. */}
              {!(!membershipLoading && isMember) && (
                <Button variant="outline" size="lg" className="gap-2 text-base px-8" asChild>
                  <a href="/pricing">
                    {!membershipLoading && trialUsed ? "See membership plans" : "Try Insider free for 7 days"}
                    <ArrowRight className="h-4 w-4" />
                  </a>
                </Button>
              )}
            </div>

            <div className="grid grid-cols-3 gap-3 pt-2 sm:gap-4">
              {stats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-border/60 bg-background/55 px-2 py-3 text-center shadow-sm backdrop-blur-md sm:px-4 sm:py-4"
                >
                  <span className="mx-auto mb-1.5 flex h-8 w-8 items-center justify-center rounded-full bg-primary/10 text-primary sm:h-9 sm:w-9">
                    <stat.icon className="h-3.5 w-3.5 sm:h-4 sm:w-4" aria-hidden />
                  </span>
                  <p className="font-heading text-xl font-extrabold tracking-tight text-foreground drop-shadow-sm sm:text-2xl md:text-3xl">
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-[10px] font-semibold uppercase tracking-wide text-foreground/75 sm:text-xs">
                    {stat.label}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
