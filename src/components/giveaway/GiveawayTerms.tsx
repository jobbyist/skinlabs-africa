import { Link } from "react-router-dom";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { giveawayTermsSections } from "@/lib/giveaway/terms";
import { trackGiveawayTermsViewed } from "@/lib/giveaway/analytics";

/** Collapsible T&Cs (one section open at a time on phones). Opening any section reports `giveaway_terms_viewed` once per session. */
const GiveawayTerms = () => {
  const sections = giveawayTermsSections();
  return (
    <section id="terms" aria-labelledby="terms-heading" className="scroll-mt-20 px-4 py-14 sm:py-20">
      <div className="mx-auto max-w-2xl">
        <p className="eyebrow">Giveaway terms</p>
        <h2 id="terms-heading" className="mt-2 text-2xl font-bold tracking-tight sm:text-3xl">
          Terms &amp; Conditions
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">Plain-language rules. Tap a section to read it.</p>
        <Accordion type="single" collapsible className="mt-6" onValueChange={(v) => v && trackGiveawayTermsViewed()}>
          {sections.map((section) => (
            <AccordionItem key={section.id} value={section.id}>
              <AccordionTrigger className="py-4 text-left text-base font-semibold">{section.title}</AccordionTrigger>
              <AccordionContent className="space-y-3 text-sm leading-relaxed text-muted-foreground">
                {section.paragraphs.map((p, i) => (
                  <p key={i}>{p}</p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="list-disc space-y-1.5 pl-5">
                    {section.bullets.map((b, i) => (
                      <li key={i}>{b}</li>
                    ))}
                  </ul>
                )}
                {section.id === "privacy" && (
                  <p>
                    Read our{" "}
                    <Link to="/privacy-policy" className="underline underline-offset-2">
                      Privacy Policy
                    </Link>{" "}
                    and{" "}
                    <Link to="/cookie-policy" className="underline underline-offset-2">
                      Cookie Policy
                    </Link>
                    .
                  </p>
                )}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default GiveawayTerms;
