import { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ArrowRight, Sparkles, Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";
import heroVideo from "@/assets/hero-video.mp4";

const Hero = () => {
  const { t } = useTranslation();
  const [isPlaying, setIsPlaying] = useState(true);
  const videoRef = useRef<HTMLVideoElement>(null);

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
      {/* Video Background */}
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
        {/* Dark animated gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-background via-background/80 to-background/40" />
        <div className="absolute inset-0 bg-gradient-to-r from-background/70 via-transparent to-background/50" />
      </div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="max-w-2xl mx-auto text-center lg:text-left lg:mx-0">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-accent rounded-full text-accent-foreground text-sm font-medium">
              <Sparkles className="h-4 w-4" />
              {t("hero.badge")}
            </div>

            <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading font-extrabold text-foreground leading-tight drop-shadow-lg">
              {t("hero.titleLine1")}
              <span className="block text-primary drop-shadow-md">{t("hero.titleLine2")}</span>
            </h1>

            <p className="text-lg font-medium text-foreground/90 max-w-xl mx-auto lg:mx-0 drop-shadow-sm">
              {t("hero.subtitle")}
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start">
              <Button size="lg" className="gap-2 text-base px-8" asChild>
                <a href="/ai-formulator">
                  <Sparkles className="h-4 w-4" />
                  {t("hero.ctaPrimary")}
                </a>
              </Button>
              <Button
                variant="outline"
                size="lg"
                className="gap-2 text-base px-8"
                asChild
              >
                <a href="/newsroom">
                  {t("hero.ctaSecondary")}
                  <ArrowRight className="h-4 w-4" />
                </a>
              </Button>
            </div>

            {/* Stats */}
            <div className="flex gap-8 justify-center lg:justify-start pt-4">
              <div>
                <p className="text-3xl font-extrabold text-foreground drop-shadow-sm">3.7K+</p>
                <p className="text-sm font-semibold text-foreground/80">{t("hero.statMembersLabel")}</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-foreground drop-shadow-sm">{t("hero.statBriefingsValue")}</p>
                <p className="text-sm font-semibold text-foreground/80">{t("hero.statBriefingsLabel")}</p>
              </div>
              <div>
                <p className="text-3xl font-extrabold text-foreground drop-shadow-sm">4.75/5</p>
                <p className="text-sm font-semibold text-foreground/80">{t("hero.statRatingLabel")}</p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
