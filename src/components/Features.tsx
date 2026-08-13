import { useTranslation } from "react-i18next";
import { Sparkles, Newspaper, Star, Mic } from "lucide-react";

const Features = () => {
  const { t } = useTranslation();

  const features = [
    { icon: Sparkles, title: t("features.item1Title"), description: t("features.item1Desc") },
    { icon: Newspaper, title: t("features.item2Title"), description: t("features.item2Desc") },
    { icon: Star, title: t("features.item3Title"), description: t("features.item3Desc") },
    { icon: Mic, title: t("features.item4Title"), description: t("features.item4Desc") },
  ];

  return (
    <section id="about" className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            {t("features.eyebrow")}
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground">
            {t("features.title")}
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="bg-card p-6 rounded-2xl border border-border hover:shadow-md transition-shadow"
            >
              <div className="w-12 h-12 bg-accent rounded-xl flex items-center justify-center mb-4">
                <feature.icon className="h-6 w-6 text-accent-foreground" />
              </div>
              <h3 className="font-heading font-semibold text-card-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
