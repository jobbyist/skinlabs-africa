import { Helmet } from "react-helmet-async";
import { Megaphone } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const EFFECTIVE = "1 September 2026";

const AdvertisingPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Advertising & Sponsored Content Policy | SkinLabs®</title>
        <meta name="description" content="SkinLabs Advertising & Sponsored Content Policy governing commercial relationships, disclosures, and advertising standards on the SkinLabs Platform." />
        <link rel="canonical" href="https://skinlabs.co.za/advertising-policy" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <Megaphone className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Advertising & Sponsored Content Policy
                  </h1>
                  <p className="text-xl text-muted-foreground">Effective date: {EFFECTIVE}</p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <p className="text-muted-foreground mb-4">
                    SkinLabs® may accept advertising, sponsorships, affiliate promotions, branded content, partnerships and other paid or commercial promotions from third parties ("Advertisers"). These materials may include display advertisements, banners, sponsored articles, sponsored reviews, product placements, promotional modules, affiliate links, brand profiles, partner content, social promotions, newsletters, native advertisements, microsites, promotional offers and other content created, supplied or funded by an Advertiser (collectively, "Advertising").
                  </p>
                  <p className="text-muted-foreground mb-4">
                    This Advertising & Sponsored Content Policy ("Policy") applies to Advertising displayed through SkinLabs® websites, applications, digital products, newsletters, social channels and other properties operated or controlled by SkinLabs® (collectively, the "SkinLabs® Platform").
                  </p>
                  <p className="text-muted-foreground mb-4">
                    Advertisers are responsible for ensuring that their Advertising, including all claims, disclosures, images, product information and promotional materials, is accurate, lawful, properly substantiated, clearly disclosed and compliant with all applicable laws, regulations and industry codes.
                  </p>
                  <p className="text-muted-foreground">
                    SkinLabs® has sole discretion to accept, reject, place, present, modify, suspend or remove Advertising from the SkinLabs® Platform.
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">1. Advertising Is Not an Endorsement</h2>
                    <p className="text-muted-foreground mb-3">
                      SkinLabs® may accept Advertising from brands, retailers, manufacturers, service providers, agencies, affiliate partners and other commercial entities.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Accepting or publishing Advertising does not mean that SkinLabs® endorses, recommends, certifies or guarantees the advertised product, service, brand, company, ingredient, treatment, claim or Advertiser.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      If SkinLabs® independently reviews, evaluates or discusses a product, any Advertising or commercial relationship with that brand will not determine the review's outcome, rating, opinion or conclusion.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      SkinLabs® may reject Advertising from any Advertiser or business category at its sole discretion.
                    </p>
                    <p className="text-muted-foreground">
                      Advertisers must not state or imply that SkinLabs®, its employees, contributors, reviewers, healthcare professionals, AI systems or editorial teams endorse or recommend an Advertiser or product unless SkinLabs® has expressly authorised that representation in writing.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">2. Accuracy, Evidence and Responsible Claims</h2>
                    <p className="text-muted-foreground mb-3">
                      SkinLabs® aims to provide useful, responsible and evidence-informed skincare information.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Advertising must be accurate, clear, understandable and reasonably supported by reliable evidence. Claims must be truthful when made and remain accurate for the duration of the campaign.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Advertising must not contain claims that, in SkinLabs®'s reasonable opinion, are false, materially misleading or deceptive; unsupported by appropriate evidence; exaggerated or missing necessary qualifications; likely to create unreasonable expectations about skincare, cosmetic or wellness results; or otherwise inconsistent with applicable laws or regulations.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Advertisers must maintain complete and current substantiation for all objective claims, including claims about efficacy, safety, performance, ingredients, testing, clinical results, consumer results, environmental benefits and comparative performance.
                    </p>
                    <p className="text-muted-foreground">
                      Substantiation must be appropriate to the nature of the claim and may include valid clinical studies, laboratory testing, consumer research, expert evidence, product specifications, regulatory documentation or other reliable supporting material.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">3. Prohibited Advertising Categories</h2>
                    <p className="text-muted-foreground mb-3">
                      SkinLabs® may reject Advertising that promotes products, services or activities that are illegal, unsafe, fraudulent, deceptive, objectionable or inconsistent with the SkinLabs® brand or community standards.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Prohibited or restricted categories may include: illegal products, services or activities; fraudulent, deceptive, misleading, offensive or unlawful material; products making unsupported "miracle", guaranteed or extraordinary skincare, health or beauty claims; unapproved medicines or pharmaceutical products; counterfeit or unlawfully distributed products; tobacco, alcohol, firearms, gambling services; pornographic or sexually explicit content; hate, extremist or discriminatory material; and any other category that SkinLabs® reasonably considers inappropriate for its audience, platform or brand.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">4. Skincare, Beauty and Cosmetic Advertising</h2>
                    <p className="text-muted-foreground mb-3">
                      Because SkinLabs® focuses on skincare, beauty and related consumer education, Advertisers must take particular care with claims about product performance and skin outcomes.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Advertising must not imply that a cosmetic or skincare product can diagnose, prevent, treat or cure a disease or medical condition unless the Advertiser is legally authorised to make that claim and the Advertising meets all applicable requirements.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Advertisers must accurately distinguish cosmetic, wellness and appearance-related claims from medical or therapeutic claims. Terms such as "treats," "heals," "cures," "prevents," "clinically proven," "doctor recommended," "medical-grade," "non-toxic," "hypoallergenic," "safe for sensitive skin," "dermatologist tested" and similar claims may be used only where properly substantiated and legally permissible.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Testimonials, before-and-after images and user-generated content must reflect genuine experiences, must not be materially altered or misleadingly presented, and must not create a misleading impression of typical or guaranteed results.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">5. Separation of Advertising and Editorial Content</h2>
                    <p className="text-muted-foreground mb-3">
                      SkinLabs® keeps commercial Advertising separate from independent editorial, educational and informational content.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Advertising will be clearly and prominently labelled with terms such as: Advertisement, Sponsored, Sponsored Content, Paid Partnership, Brand Partner, Affiliate, or another disclosure that clearly communicates the commercial nature of the content.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Disclosures must be: clear and easy to understand; prominent and reasonably close to the Advertising; visible before or at the time a user engages with the commercial content; presented in the same language and medium as the Advertising where appropriate; readable on mobile devices and accessible to users with disabilities; and maintained wherever the Advertising is republished, shared or distributed.
                    </p>
                    <p className="text-muted-foreground">
                      Advertising must not be presented in a way that would reasonably lead users to believe that commercial content is independent SkinLabs® editorial content.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">6. Sponsored Reviews and Product Coverage</h2>
                    <p className="text-muted-foreground mb-3">
                      SkinLabs® may receive products, compensation, affiliate commissions, sponsorships or other commercial benefits from brands.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      A commercial relationship does not guarantee a positive review, rating, recommendation or editorial result.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      SkinLabs® will provide an appropriate disclosure when a review or other editorial feature involves a material commercial relationship.
                    </p>
                    <p className="text-muted-foreground">
                      Advertisers may not require SkinLabs® to publish a positive review or hide legitimate negative findings as a condition of Advertising, sponsorship or providing products.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">7. Affiliate Advertising</h2>
                    <p className="text-muted-foreground mb-3">
                      SkinLabs® may participate in affiliate programs under which SkinLabs® receives a commission or other commercial benefit when a user clicks a link, buys a product or completes another qualifying action.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      SkinLabs® will disclose affiliate relationships clearly and prominently where required by law and under its applicable disclosure practices.
                    </p>
                    <p className="text-muted-foreground">
                      An affiliate relationship does not necessarily mean that SkinLabs® endorses a product or guarantees its quality, suitability, safety or effectiveness.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">8. Links and Destination Pages</h2>
                    <p className="text-muted-foreground mb-3">
                      Advertising may link to an Advertiser's website, product page, retailer, marketplace, sponsored content page or other destination.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      SkinLabs® may review an advertising destination and reject or remove Advertising if the destination contains misleading, unlawful, unsafe or otherwise prohibited material.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Advertisers must ensure that destination pages are consistent with the claims, prices, offers, disclosures and terms presented in the Advertising.
                    </p>
                    <p className="text-muted-foreground">
                      SkinLabs® does not control third-party websites and is not responsible for their content, privacy practices, security, availability, products or services.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">9. Search Results and Recommendations</h2>
                    <p className="text-muted-foreground mb-3">
                      SkinLabs® may display commercial results, sponsored placements, affiliate recommendations and other paid promotional content in or alongside search, discovery and recommendation features.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Advertising in search results, product recommendations or other discovery features will be identified as Advertising, Sponsored, Affiliate or another appropriate designation.
                    </p>
                    <p className="text-muted-foreground">
                      Payment or sponsorship will not automatically determine the independent editorial ranking of products, educational resources or other non-sponsored content.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">10. SkinLabs® AI Systems and Personalised Experiences</h2>
                    <p className="text-muted-foreground mb-3">
                      Advertising must not manipulate, exploit or interfere with SkinLabs® AI systems or personalised experiences in a way that could mislead users.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Advertisers may not claim that their products are recommended, prescribed, diagnosed or endorsed by SKYNN AI or another SkinLabs® AI system unless SkinLabs® has expressly authorised that claim in writing.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Where Advertising appears in an AI-generated routine, recommendation, analysis or response, SkinLabs® will clearly explain that the placement is commercial and distinguish sponsored content from recommendations generated using independent criteria.
                    </p>
                    <p className="text-muted-foreground">
                      SkinLabs® may restrict commercial placements within AI-generated analyses, recommendations, routines and other personalised experiences to protect user trust, transparency and system integrity.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">11. User Data, Tracking and Privacy</h2>
                    <p className="text-muted-foreground mb-3">
                      Advertisers may not collect, access, sell, share or otherwise process SkinLabs® user information through Advertising unless SkinLabs® expressly authorises it in writing and applicable law permits it.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Advertising must not include tracking technologies, pixels, tags, scripts, cookies, SDKs or other data-collection tools unless SkinLabs® has expressly approved them in writing and they are properly disclosed.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Advertisers must collect only the information necessary for the approved purpose, retain it only for as long as necessary, protect it using appropriate technical and organisational safeguards and delete or return it when required by SkinLabs® or applicable law.
                    </p>
                    <p className="text-muted-foreground">
                      Advertisers must promptly notify SkinLabs® of any actual or suspected unauthorised access, disclosure, loss, misuse or security incident involving SkinLabs® data.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">12. Advertising to Children</h2>
                    <p className="text-muted-foreground mb-3">
                      SkinLabs® does not knowingly permit Advertising designed to exploit, manipulate or improperly target children.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Advertisers must comply with all applicable laws and regulations concerning advertising to children, age-restricted products and the collection or processing of children's personal information.
                    </p>
                    <p className="text-muted-foreground">
                      Advertising for products containing active ingredients, exfoliants, retinoids, bleaching agents, prescription substances, strong acids or other products that may be unsuitable for children must not be directed at children and must include appropriate age or safety restrictions where relevant.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">13. Regulatory and Legal Compliance</h2>
                    <p className="text-muted-foreground mb-3">
                      Advertisers are solely responsible for ensuring that their Advertising complies with all applicable laws, regulations, industry codes and regulatory requirements in every jurisdiction where it appears.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      These requirements may relate to consumer protection, advertising standards, cosmetics and personal-care products, medicines and health claims, data protection and privacy, influencer and sponsored-content disclosures, intellectual property, competition and fair trading, environmental or sustainability claims, product safety, promotional competitions, pricing and discounts, affiliate marketing, and requirements concerning artificial intelligence, automated decision-making or personalised advertising.
                    </p>
                    <p className="text-muted-foreground">
                      For Advertising displayed in South Africa, Advertisers must comply with applicable South African laws, regulations and advertising standards, including requirements relating to consumer protection, data protection, cosmetics, health claims and advertising disclosures.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">14. Advertising Review and Removal</h2>
                    <p className="text-muted-foreground mb-3">
                      At its sole discretion, SkinLabs® may accept or reject Advertising; request changes; require additional disclosures or disclaimers; require substantiation or regulatory documentation; limit the placement, frequency or audience of Advertising; suspend Advertising; remove Advertising; disable links or promotional destinations; restrict an Advertiser from future Advertising; or take any other action reasonably necessary to protect SkinLabs®, its users or the integrity of the SkinLabs® Platform.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      SkinLabs® may take these actions if Advertising violates this Policy, applicable law, platform requirements, contractual obligations, community standards or SkinLabs® editorial or brand standards.
                    </p>
                    <p className="text-muted-foreground">
                      Advertisers must cooperate promptly with requests for corrections, clarifications, disclosures, substantiation, safety information or removal.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">15. Advertising Performance</h2>
                    <p className="text-muted-foreground mb-3">
                      SkinLabs® does not guarantee that Advertising will generate clicks, impressions, sales, leads, conversions, engagement, revenue or any other commercial result.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Performance may vary because of the device, browser, operating system, network conditions, ad-blocking technology, available inventory, user behaviour and other factors outside SkinLabs®'s control.
                    </p>
                    <p className="text-muted-foreground">
                      Advertisers must not represent SkinLabs® performance data, audience information, user behaviour or campaign results publicly without SkinLabs®'s prior written permission.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">16. Intellectual Property</h2>
                    <p className="text-muted-foreground mb-3">
                      Advertisers are responsible for obtaining all rights, licences and permissions needed to use trademarks, logos, photographs, videos, music, text, product images, testimonials, user-generated content and other intellectual property included in their Advertising.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      Advertisers must obtain any required consent from individuals appearing in Advertising and must ensure that testimonials, endorsements and user-generated content are genuine, authorised and not misleading.
                    </p>
                    <p className="text-muted-foreground">
                      By submitting Advertising to SkinLabs®, the Advertiser confirms that it has the necessary rights to allow SkinLabs® to display, reproduce, distribute and otherwise use the Advertising for the agreed promotional purposes.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">17. Changes to This Policy</h2>
                    <p className="text-muted-foreground mb-3">
                      SkinLabs® may update this Policy to reflect changes in its services, advertising practices, technology, legal requirements or business operations.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      The updated Policy will be published on the SkinLabs® Platform with a new effective date.
                    </p>
                    <p className="text-muted-foreground">
                      Unless stated otherwise, the updated Policy will apply to Advertising published after the new effective date.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">18. SkinLabs®'s Discretion</h2>
                    <p className="text-muted-foreground mb-3">
                      SkinLabs® has sole discretion to interpret and enforce this Policy and to decide all other matters relating to Advertising on the SkinLabs® Platform.
                    </p>
                    <p className="text-muted-foreground mb-3">
                      An Advertising relationship does not limit SkinLabs®'s ability to publish independent editorial content, product reviews, educational resources, research, opinions or other information about an Advertiser or its products.
                    </p>
                    <p className="text-muted-foreground">
                      SkinLabs® intends to keep its commercial relationships and editorial decisions separate so users can distinguish paid promotion from independent SkinLabs® editorial content.
                    </p>
                  </div>
                </div>

                <div className="mt-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 text-center">
                  <p className="text-muted-foreground">
                    Questions about this policy? Contact{" "}
                    <a href="mailto:legal@skinlabs.co.za" className="text-primary font-medium hover:underline">
                      legal@skinlabs.co.za
                    </a>
                  </p>
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

export default AdvertisingPolicy;
