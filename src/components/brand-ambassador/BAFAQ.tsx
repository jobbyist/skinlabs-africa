import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { brandAmbassadorFaqs } from "@/data/brandAmbassador";

const BAFAQ = () => {
  return (
    <section id="faq" className="scroll-mt-32 py-16 sm:py-24">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="mb-10 text-center">
          <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">FAQ</p>
          <h2 className="mt-2 text-balance font-heading text-3xl font-bold text-foreground sm:text-4xl">
            Frequently asked questions
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {brandAmbassadorFaqs.map((faq, index) => (
            <AccordionItem key={faq.q} value={`item-${index}`}>
              <AccordionTrigger className="text-left font-heading text-base font-semibold text-foreground hover:no-underline">
                {faq.q}
              </AccordionTrigger>
              <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
                {faq.a}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
};

export default BAFAQ;
