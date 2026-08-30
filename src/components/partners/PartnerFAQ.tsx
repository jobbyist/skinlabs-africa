import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { partnerFaqs } from "@/data/partnerPrograms";

const PartnerFAQ = () => {
  return (
    <section id="partner-faq" className="scroll-mt-20 py-20 md:py-28">
      <div className="container mx-auto max-w-3xl px-4">
        <div className="mb-14 text-center">
          <h2 className="text-balance font-heading text-3xl font-bold text-foreground md:text-4xl">
            Partnership FAQs
          </h2>
        </div>

        <Accordion type="single" collapsible className="w-full">
          {partnerFaqs.map((faq, index) => (
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

export default PartnerFAQ;
