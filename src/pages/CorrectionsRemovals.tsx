import { Helmet } from "react-helmet-async";
import { FileEdit, Mail, AlertCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Button } from "@/components/ui/button";

const EFFECTIVE = "15 September 2026";

const CorrectionsRemovals = () => {
  return (
    <>
      <Helmet>
        <title>Correction & Removal Requests | SkinLabs®</title>
        <meta name="description" content="Request corrections or removal of your information from the SkinLabs Platform. Learn how to request changes to reviews, directory listings, brand profiles and editorial content." />
        <link rel="canonical" href="https://skinlabs.co.za/corrections-removals" />
      </Helmet>
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-20">
          <section className="py-20 bg-gradient-to-b from-secondary/10 to-background">
            <div className="container mx-auto px-4">
              <div className="max-w-4xl mx-auto">
                <div className="text-center mb-16">
                  <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary/10 mb-6">
                    <FileEdit className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Correction & Removal Requests
                  </h1>
                  <p className="text-xl text-muted-foreground">Effective date: {EFFECTIVE}</p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <p className="text-muted-foreground mb-4">
                    At SkinLabs®, we are committed to maintaining accurate, fair, and up-to-date information across our platform. If you believe that information about you or your brand on the SkinLabs® Platform is inaccurate, outdated, or should be removed, you can submit a correction or removal request.
                  </p>
                  <p className="text-muted-foreground mb-4">
                    This page explains how to request corrections or removal of information from SkinLabs® websites, applications, digital products, newsletters, social channels, and other properties operated or controlled by SkinLabs® (collectively, the "SkinLabs® Platform").
                  </p>
                  <p className="text-muted-foreground">
                    We review all requests carefully and handle them in accordance with our editorial policies, applicable laws, and commitment to transparency and accuracy.
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">1. What You Can Request</h2>
                    <p className="text-muted-foreground mb-3">
                      You may submit a request to correct or remove information in the following areas:
                    </p>
                    <ul className="space-y-2 text-muted-foreground mb-3">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span><strong>Product Reviews:</strong> Corrections to factual errors in reviews you submitted or removal of your review content</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span><strong>Directory Listings:</strong> Updates or removal of dermatologist and practitioner directory listings</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span><strong>Brand Profiles:</strong> Corrections to brand information, product details, or removal requests from brand representatives</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span><strong>Editorial Content:</strong> Corrections to factual errors in articles, guides, or other editorial content</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span><strong>User Comments:</strong> Removal of inappropriate comments or corrections to your own comments</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span><strong>Personal Information:</strong> Removal or correction of personal information published without proper consent</span>
                      </li>
                    </ul>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">2. Correction Requests</h2>
                    <p className="text-muted-foreground mb-3">
                      If you believe information on the SkinLabs® Platform contains a factual error, you may request a correction by providing:
                    </p>
                    <ul className="space-y-2 text-muted-foreground mb-3">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>The specific URL or location of the content</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>A clear description of the error or inaccuracy</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>The correct information with supporting documentation or evidence</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Your contact information for follow-up</span>
                      </li>
                    </ul>
                    <p className="text-muted-foreground">
                      We will review your request and make appropriate corrections if we determine the information is factually incorrect. We reserve the right to verify information independently before making changes.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">3. Removal Requests</h2>
                    <p className="text-muted-foreground mb-3">
                      You may request removal of information in the following circumstances:
                    </p>
                    <ul className="space-y-2 text-muted-foreground mb-3">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>The information is your personal data and you have a right to erasure under applicable data protection laws</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>You are the author of user-generated content (such as a review) and wish to remove it</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>The information was published without proper consent or authorization</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>The information violates our Community Guidelines or Terms of Service</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>The information infringes on your intellectual property rights</span>
                      </li>
                    </ul>
                    <p className="text-muted-foreground">
                      We may deny removal requests for editorial content if the information is accurate, lawfully published, and serves a legitimate public interest. We balance individual privacy rights with our editorial mission and transparency obligations.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">4. How to Submit a Request</h2>
                    <p className="text-muted-foreground mb-4">
                      To submit a correction or removal request, please email us at:
                    </p>
                    <div className="bg-primary/5 rounded-xl p-6 mb-4">
                      <div className="flex items-center gap-3">
                        <Mail className="h-5 w-5 text-primary" />
                        <a href="mailto:legal@skinlabs.co.za" className="text-primary font-medium hover:underline">
                          legal@skinlabs.co.za
                        </a>
                      </div>
                    </div>
                    <p className="text-muted-foreground mb-3">
                      Please include the following in your request:
                    </p>
                    <ul className="space-y-2 text-muted-foreground mb-4">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Your full name and contact information</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>The specific URL or location of the content in question</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>A detailed explanation of your request (correction or removal)</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Supporting documentation or evidence, if applicable</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Your relationship to the content (e.g., author, subject, brand representative)</span>
                      </li>
                    </ul>
                    <Button asChild className="w-full sm:w-auto">
                      <a href="mailto:legal@skinlabs.co.za">Submit a Request</a>
                    </Button>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">5. Review Process</h2>
                    <p className="text-muted-foreground mb-3">
                      When we receive your request, we will:
                    </p>
                    <ul className="space-y-2 text-muted-foreground mb-3">
                      <li className="flex items-start">
                        <span className="mr-2">1.</span>
                        <span>Acknowledge receipt of your request within 3-5 business days</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">2.</span>
                        <span>Review the request and verify the information independently</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">3.</span>
                        <span>Make a determination based on our editorial policies and applicable laws</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">4.</span>
                        <span>Notify you of our decision within 30 days</span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">5.</span>
                        <span>Implement approved corrections or removals promptly</span>
                      </li>
                    </ul>
                    <p className="text-muted-foreground">
                      Complex requests or those requiring legal review may take longer to process. We will keep you informed throughout the review process.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">6. Additional Information</h2>
                    <p className="text-muted-foreground mb-3">
                      For urgent matters or questions about this process, you may also contact us at:
                    </p>
                    <ul className="space-y-2 text-muted-foreground">
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>General inquiries: <a href="mailto:hello@skinlabs.co.za" className="text-primary hover:underline">hello@skinlabs.co.za</a></span>
                      </li>
                      <li className="flex items-start">
                        <span className="mr-2">•</span>
                        <span>Privacy and legal matters: <a href="mailto:legal@skinlabs.co.za" className="text-primary hover:underline">legal@skinlabs.co.za</a></span>
                      </li>
                    </ul>
                  </div>
                </div>

                <div className="mt-8 bg-gradient-to-r from-amber-500/10 to-orange-500/10 rounded-3xl p-8 border border-amber-500/20">
                  <div className="flex items-start gap-4">
                    <AlertCircle className="h-6 w-6 text-amber-500 flex-shrink-0 mt-1" />
                    <div>
                      <h3 className="font-semibold text-foreground mb-2">Important Note</h3>
                      <p className="text-muted-foreground text-sm">
                        We are committed to accuracy and fairness, but we also have editorial independence. Not all requests can be accommodated, particularly when content is accurate, lawfully published, and serves public interest. We will explain our reasoning if we decline your request.
                      </p>
                    </div>
                  </div>
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

export default CorrectionsRemovals;
