import { Helmet } from "react-helmet-async";
import { Shield, Lock, Eye, Database, Camera, Scale, UserCheck, Globe } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const EFFECTIVE = "28 August 2026";

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy | SkinLabs®</title>
        <meta
          name="description"
          content="How SkinLabs collects, uses and protects personal information under POPIA, including special personal information for SKYNN AI skin analysis. Privacy by default. Non-diagnostic."
        />
        <link rel="canonical" href="https://skinlabs.co.za/privacy-policy" />
        <meta property="og:title" content="Privacy Policy | SkinLabs®" />
        <meta property="og:description" content="POPIA-aligned privacy practices for SkinLabs and SKYNN AI." />
        <meta property="og:url" content="https://skinlabs.co.za/privacy-policy" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://skinlabs.co.za/og-image.png" />
      </Helmet>

      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <Shield className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">Privacy Policy</h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Effective date: {EFFECTIVE} · Version 1.0
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Governing law: Republic of South Africa (POPIA, CPA, ECTA, SAHPRA guidance) · Contact: legal@skinlabs.co.za
                  </p>
                </div>

                {/* Foundational notice */}
                <div className="bg-primary/5 border border-primary/20 rounded-3xl p-6 md:p-8 mb-8">
                  <p className="text-sm text-foreground leading-relaxed">
                    <strong>Foundational criteria.</strong> SkinLabs operates on two non-negotiable foundations:
                    (1) <strong>privacy by default</strong> under the Protection of Personal Information Act 4 of 2013 (POPIA),
                    including strict handling of special personal information; and
                    (2) a <strong>strictly non-diagnostic methodology</strong> aligned with SAHPRA cosmetic boundaries.
                    SKYNN AI and all related features provide cosmetic-oriented skin assessment and educational information only.
                    They do <strong>not</strong> constitute medical diagnosis, treatment or advice, and are not medical devices
                    under SAHPRA frameworks for diagnostic purposes. Always consult an HPCSA-registered healthcare practitioner
                    for medical concerns.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction and scope</h2>
                  <p className="text-muted-foreground mb-4">
                    SkinLabs® (“SkinLabs”, “we”, “us” or “our”) respects your privacy and is committed to protecting personal
                    information in accordance with POPIA, the Consumer Protection Act 68 of 2008 (CPA), the Electronic
                    Communications and Transactions Act 25 of 2002 (ECTA), applicable SAHPRA guidance on cosmetic products and
                    claims, and the Health Professions Council of South Africa (HPCSA) ethical framework where relevant to
                    third-party practitioner services.
                  </p>
                  <p className="text-muted-foreground">
                    This Privacy Policy describes how we collect, use, store, share and protect personal information when you
                    visit skinlabs.co.za, use SKYNN AI, create an account, subscribe, purchase credit packs, interact with our
                    content, or use any related services (collectively, the “Platform”). It also explains your rights as a data
                    subject and how you can exercise them.
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">2. Responsible party and Information Officer</h2>
                    <p className="text-muted-foreground">
                      The responsible party (as defined in POPIA) for the processing described in this Policy is the legal entity
                      operating the SkinLabs Platform. Communications may be directed to the Information Officer (or Deputy) at{" "}
                      <a href="mailto:legal@skinlabs.co.za" className="text-primary hover:underline">legal@skinlabs.co.za</a>.
                      We will update this section with full registered-company particulars as they become publicly available on the Platform.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Database className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">3. Personal information we collect</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      We collect only personal information that is adequate, relevant and not excessive for the purposes set out
                      in this Policy (privacy by default / data minimisation).
                    </p>
                    <div className="space-y-4 text-muted-foreground">
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">3.1 Ordinary personal information</h3>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Identity and contact data: name, email address, phone number (where provided), account credentials</li>
                          <li>Transaction and billing data: subscription tier, payment tokens (we do not store full card numbers), transaction history, invoices</li>
                          <li>Usage and technical data: IP address, device type, browser, pages visited, feature usage, referring URLs, approximate location derived from IP (city/region level)</li>
                          <li>Communications: messages you send to support, feedback, survey responses</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">3.2 Special personal information (health-adjacent / biometric-related)</h3>
                        <p className="mb-2">
                          Under POPIA, information concerning a data subject’s health, and biometric information, is “special
                          personal information”. The following may constitute special personal information:
                        </p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Photographs or images of your face or skin that you upload or capture for SKYNN AI analysis</li>
                          <li>AI-derived skin metrics, scores, concerns, skin-type classifications and routine recommendations generated from those images</li>
                          <li>Self-reported skin concerns, lifestyle factors or product history that you voluntarily provide</li>
                        </ul>
                        <p className="mt-3">
                          We process special personal information only with your <strong className="text-foreground">explicit, informed consent</strong>{" "}
                          (or another lawful ground under section 27 of POPIA where applicable) and only for the limited purposes
                          described below. We do not use images for facial recognition, identity verification, or any purpose other
                          than the cosmetic skin assessment and personalisation services you request.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Camera className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">4. Photographic data and SKYNN AI — specific rules</h2>
                    </div>
                    <div className="space-y-4 text-muted-foreground">
                      <p>
                        <strong className="text-foreground">4.1 Purpose limitation (SAHPRA-aligned).</strong> Images are collected
                        solely to perform AI-powered cosmetic skin assessment (visible characteristics such as texture, tone
                        uniformity, hydration indicators, pigmentation patterns, etc.) and to generate personalised routine
                        suggestions and educational content. The processing is <strong className="text-foreground">not</strong>{" "}
                        intended to diagnose, treat or prevent any medical condition and is not a medical-device service under
                        SAHPRA frameworks.
                      </p>
                      <p>
                        <strong className="text-foreground">4.2 Consent.</strong> Before any image is captured or uploaded for
                        analysis, you will be presented with a clear consent mechanism that explains the purpose, the special nature
                        of the data, retention, and your rights. Consent is specific, voluntary and can be withdrawn.
                      </p>
                      <p>
                        <strong className="text-foreground">4.3 Anonymisation and minimisation.</strong> Where technically feasible
                        we apply privacy-enhancing techniques (including segmentation or transformation of non-skin regions) so that
                        the analytical pipeline focuses on skin attributes rather than identifiable facial features. We do not
                        attempt to re-identify individuals from analysis outputs.
                      </p>
                      <p>
                        <strong className="text-foreground">4.4 Retention of images.</strong> Raw or near-raw images are retained
                        only for the short period necessary to complete the requested analysis and deliver results to you (typically
                        measured in hours, not days, unless you explicitly save results to your account). Thereafter images are
                        securely deleted or irreversibly anonymised. Derived, non-identifying metrics and scores may be retained
                        longer in your account for progress tracking, subject to your rights of deletion.
                      </p>
                      <p>
                        <strong className="text-foreground">4.5 Security.</strong> Images and related special personal information
                        are transmitted over encrypted channels (TLS) and stored with appropriate technical and organisational
                        measures (access controls, encryption at rest where applicable, logging, and least-privilege principles).
                      </p>
                      <p>
                        <strong className="text-foreground">4.6 Processors.</strong> If we engage a third-party AI or computer-vision
                        provider to assist with analysis, that provider acts as an operator (processor) under a written agreement that
                        imposes POPIA-equivalent obligations, purpose limitation, security and deletion duties. Images are not used by
                        the processor for their own training or commercial purposes without separate lawful basis and transparency.
                      </p>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Scale className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">5. Lawful bases for processing (POPIA)</h2>
                    </div>
                    <ul className="list-disc list-inside space-y-2 ml-4 text-muted-foreground">
                      <li><strong className="text-foreground">Consent</strong> — for special personal information (skin images and derived health-adjacent data) and for non-essential cookies/marketing</li>
                      <li><strong className="text-foreground">Contract</strong> — to perform our agreement with you (account creation, subscription fulfilment, delivery of paid features)</li>
                      <li><strong className="text-foreground">Legitimate interests</strong> — for ordinary analytics, security, fraud prevention and Platform improvement, balanced against your rights</li>
                      <li><strong className="text-foreground">Legal obligation</strong> — where required by South African law</li>
                    </ul>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Eye className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">6. How we use personal information</h2>
                    </div>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                      <li>Provide, operate and improve the Platform and SKYNN AI features</li>
                      <li>Generate and deliver personalised skin-assessment results and routine suggestions</li>
                      <li>Manage accounts, subscriptions, credit packs and payments</li>
                      <li>Communicate with you about your account, service updates and (with consent) marketing</li>
                      <li>Ensure security, prevent abuse and comply with law</li>
                      <li>Conduct aggregated or anonymised research and analytics to improve our models and content (never re-identifying individuals)</li>
                    </ul>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">7. Sharing and disclosure</h2>
                    <div className="space-y-3 text-muted-foreground">
                      <p>We do not sell personal information. We share personal information only in the following circumstances:</p>
                      <p><strong className="text-foreground">7.1 With your consent</strong> — for example when you request a feature that requires sharing, or when you opt in to a partner offering.</p>
                      <p><strong className="text-foreground">7.2 Service providers / operators</strong> — trusted processors who assist with hosting, analytics, payment processing, email delivery or AI analysis, bound by written contracts and POPIA obligations.</p>
                      <p><strong className="text-foreground">7.3 Independent practitioners</strong> — if you book a virtual dermatologist consultation through the Platform, limited necessary information is shared with the HPCSA-registered practitioner solely to enable the consultation. Those practitioners are independent responsible parties for their clinical records.</p>
                      <p><strong className="text-foreground">7.4 Legal and safety</strong> — when required by law, court order, or to protect the rights, safety or property of SkinLabs, our users or the public.</p>
                      <p>
                        <strong className="text-foreground">7.5 Business transfers / acquisition or sale of the Platform or IP.</strong>{" "}
                        In the event of a merger, acquisition, corporate reorganisation, or sale of all or substantially all of the
                        assets or intellectual property of SkinLabs (including proprietary databases of aggregated or user-derived
                        skin-profile data), personal information may be transferred to the successor entity. We will ensure that any
                        such transfer is subject to appropriate safeguards so that the receiving party continues to protect the
                        information in a manner consistent with this Policy and POPIA. Where practicable we will provide notice to
                        affected data subjects and, for special personal information, ensure a continuing lawful basis. You retain
                        your data-subject rights against the new responsible party.
                      </p>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Globe className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">8. Cross-border transfers</h2>
                    </div>
                    <p className="text-muted-foreground">
                      Personal information is primarily processed in South Africa. If we transfer personal information outside the
                      Republic (for example to a cloud or AI provider), we will do so only in accordance with section 72 of POPIA —
                      either to a jurisdiction with adequate protection, or under a binding agreement that provides an adequate level
                      of protection, or with your consent, or another permitted ground.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">9. Retention and deletion policy</h2>
                    <div className="space-y-3 text-muted-foreground">
                      <p>We retain personal information only for as long as necessary to fulfil the purposes for which it was collected, or as required by law:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Account data: retained while your account is active and for a reasonable period thereafter (or longer if required for legal claims or accounting)</li>
                        <li>Raw skin images: short retention — deleted or anonymised after analysis completion unless you explicitly save results</li>
                        <li>Derived metrics and routine history: retained in your account until you delete them or close the account</li>
                        <li>Transaction records: retained for tax and consumer-law periods (typically 5–7 years)</li>
                      </ul>
                      <p>
                        You may request deletion of your personal information (right to erasure) at any time by contacting{" "}
                        <a href="mailto:legal@skinlabs.co.za" className="text-primary hover:underline">legal@skinlabs.co.za</a>{" "}
                        or using in-account tools where available. We will comply unless we have a lawful basis to retain certain data.
                      </p>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Lock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">10. Security framework</h2>
                    </div>
                    <p className="text-muted-foreground">
                      We implement appropriate, reasonable technical and organisational measures to protect personal information
                      against loss, damage, unauthorised destruction and unlawful access or processing. These measures include
                      encryption in transit, access controls, least-privilege principles, secure development practices, logging and
                      monitoring, staff awareness, and contractual safeguards with operators. No method of transmission or storage is
                      completely secure; we continuously review and improve our controls in line with POPIA’s security condition.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <UserCheck className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">11. Your rights as a data subject</h2>
                    </div>
                    <p className="text-muted-foreground mb-3">Under POPIA you have the right to:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4 text-muted-foreground">
                      <li>Be notified that personal information is being collected</li>
                      <li>Access the personal information we hold about you</li>
                      <li>Request correction, destruction or deletion of inaccurate, irrelevant or excessive information</li>
                      <li>Object to processing on reasonable grounds</li>
                      <li>Object to processing for direct marketing</li>
                      <li>Not be subject to a decision based solely on automated processing that produces legal or similarly significant effects (subject to the limited exceptions in section 71)</li>
                      <li>Lodge a complaint with the Information Regulator</li>
                    </ul>
                    <p className="text-muted-foreground mt-4">
                      To exercise any of these rights, email{" "}
                      <a href="mailto:legal@skinlabs.co.za" className="text-primary hover:underline">legal@skinlabs.co.za</a>{" "}
                      with sufficient detail to identify you and the request. We may need to verify your identity. We will respond
                      within the timeframes required by POPIA.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">12. Children</h2>
                    <p className="text-muted-foreground">
                      The Platform is not directed at children under 18. We do not knowingly collect personal information from
                      children. If we become aware that we have collected personal information from a child without appropriate
                      consent, we will take steps to delete it.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">13. Automated decision-making and profiling</h2>
                    <p className="text-muted-foreground">
                      SKYNN AI generates skin-assessment scores and routine suggestions using automated processing. These outputs
                      are advisory and educational only; they do not produce legal effects or similarly significant effects on you
                      within the meaning of section 71 of POPIA. You remain free to disregard any recommendation and to seek
                      professional medical advice. You may contact us if you wish to obtain human review of a particular automated
                      output that concerns you.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">14. Changes to this Privacy Policy</h2>
                    <p className="text-muted-foreground">
                      We may update this Policy periodically. Material changes will be notified by updating the Effective Date,
                      posting a notice on the Platform, and/or emailing registered users. Continued use after the effective date
                      constitutes acceptance of the revised Policy, subject always to your ongoing rights under POPIA.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">15. Contact and complaints</h2>
                    <p className="text-muted-foreground mb-4">
                      For any privacy-related enquiry, request or complaint:
                    </p>
                    <p className="text-muted-foreground mb-2">
                      <strong className="text-foreground">Email:</strong>{" "}
                      <a href="mailto:legal@skinlabs.co.za" className="text-primary hover:underline">legal@skinlabs.co.za</a>
                      <br />
                      <strong className="text-foreground">Subject:</strong> Privacy / Data Subject Request
                    </p>
                    <p className="text-muted-foreground mt-4">
                      You also have the right to lodge a complaint with the Information Regulator (South Africa):
                      <br />
                      Website:{" "}
                      <a href="https://inforegulator.org.za" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
                        https://inforegulator.org.za
                      </a>
                    </p>
                  </div>
                </div>

                <div className="mt-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Questions about privacy?</h2>
                  <p className="text-muted-foreground mb-6">
                    Contact our Information Officer channel
                  </p>
                  <a href="mailto:legal@skinlabs.co.za" className="text-primary font-medium hover:underline text-lg">
                    legal@skinlabs.co.za
                  </a>
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

export default PrivacyPolicy;
