import { Helmet } from "react-helmet-async";
import { Shield, Lock, Eye, Database } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const PrivacyPolicy = () => {
  return (
    <>
      <Helmet>
        <title>Privacy Policy — Your Data Protection | SkinLabs®</title>
        <meta
          name="description"
          content="What SkinLabs collects, why, and how we protect it — including your rights over your own data and our approach to cookies."
        />
        <link rel="canonical" href="https://skinlabs.co.za/privacy-policy" />
        <meta property="og:title" content="Privacy Policy | SkinLabs®" />
        <meta property="og:description" content="How SkinLabs collects, uses and protects your personal information." />
        <meta property="og:url" content="https://skinlabs.co.za/privacy-policy" />
        <meta property="og:type" content="website" />
        <meta property="og:image" content="https://skinlabs.co.za/og-image.png" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:image" content="https://skinlabs.co.za/og-image.png" />
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
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Privacy Policy
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Last updated: December 2024
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Introduction</h2>
                  <p className="text-muted-foreground mb-4">
                    At SkinLabs ("we", "our", or "us"), protecting your privacy and personal information isn't an
                    afterthought — it's part of how we're built. This Privacy Policy explains, in plain terms, how we
                    collect, use, disclose and safeguard your information when you use our website and services.
                  </p>
                  <p className="text-muted-foreground">
                    By using our services, you're agreeing to the collection and use of information as set out below.
                  </p>
                </div>

                <div className="space-y-8">
                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Database className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">Information We Collect</h2>
                    </div>
                    <div className="space-y-4 text-muted-foreground">
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Personal Information</h3>
                        <p className="mb-2">When you use our services, we may collect:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Name, email address, phone number</li>
                          <li>Billing and shipping address</li>
                          <li>Payment information (processed securely)</li>
                          <li>Skin profile data (type, concerns, goals)</li>
                          <li>Account credentials</li>
                        </ul>
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground mb-2">Usage Information</h3>
                        <p className="mb-2">We automatically collect:</p>
                        <ul className="list-disc list-inside space-y-1 ml-4">
                          <li>Device and browser information</li>
                          <li>IP address and location data</li>
                          <li>Pages visited and interactions</li>
                          <li>Cookies and similar tracking technologies</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Eye className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">How We Use Your Information</h2>
                    </div>
                    <div className="space-y-2 text-muted-foreground">
                      <p>We use your information to:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Process orders and deliver products</li>
                        <li>Provide personalized skincare recommendations</li>
                        <li>Communicate about your orders and account</li>
                        <li>Send marketing communications (with your consent)</li>
                        <li>Improve our products and services</li>
                        <li>Prevent fraud and ensure security</li>
                        <li>Comply with legal obligations</li>
                      </ul>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <div className="flex items-start gap-3 mb-4">
                      <Lock className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                      <h2 className="text-2xl font-bold text-foreground">Data Security</h2>
                    </div>
                    <p className="text-muted-foreground mb-4">
                      We implement appropriate technical and organizational security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
                    </p>
                    <p className="text-muted-foreground">
                      However, no method of transmission over the internet or electronic storage is 100% secure. While we strive to use commercially acceptable means to protect your data, we cannot guarantee absolute security.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Your Rights</h2>
                    <div className="space-y-2 text-muted-foreground">
                      <p>You have the right to:</p>
                      <ul className="list-disc list-inside space-y-1 ml-4">
                        <li>Access your personal data</li>
                        <li>Correct inaccurate data</li>
                        <li>Request deletion of your data</li>
                        <li>Object to processing of your data</li>
                        <li>Request data portability</li>
                        <li>Withdraw consent at any time</li>
                      </ul>
                      <p className="mt-4">
                        To exercise these rights, contact us at privacy@skinlabs.co.za
                      </p>
                    </div>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Cookies</h2>
                    <p className="text-muted-foreground mb-4">
                      We use cookies and similar tracking technologies to track activity on our service and hold certain information. You can instruct your browser to refuse all cookies or indicate when a cookie is being sent.
                    </p>
                    <p className="text-muted-foreground">
                      For more information, see our Cookie Policy.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Third-Party Services</h2>
                    <p className="text-muted-foreground mb-4">
                      We may employ third-party companies and individuals to facilitate our service, provide service on our behalf, or assist us in analyzing how our service is used. These third parties have access to your personal information only to perform these tasks and are obligated not to disclose or use it for any other purpose.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Children's Privacy</h2>
                    <p className="text-muted-foreground">
                      Our service is not intended for children under 18 years of age. We do not knowingly collect personal information from children under 18. If you become aware that a child has provided us with personal information, please contact us immediately.
                    </p>
                  </div>

                  <div className="bg-card border border-border rounded-3xl p-8 md:p-12">
                    <h2 className="text-2xl font-bold text-foreground mb-4">Changes to This Policy</h2>
                    <p className="text-muted-foreground">
                      We may update our Privacy Policy from time to time. We will notify you of any changes by posting the new Privacy Policy on this page and updating the "Last updated" date. You are advised to review this Privacy Policy periodically for any changes.
                    </p>
                  </div>
                </div>

                <div className="mt-8 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 text-center">
                  <h2 className="text-2xl font-bold text-foreground mb-4">
                    Questions About Privacy?
                  </h2>
                  <p className="text-muted-foreground mb-6">
                    If you have any questions about this Privacy Policy, please contact us
                  </p>
                  <a href="mailto:privacy@skinlabs.co.za" className="text-primary font-medium hover:underline text-lg">
                    privacy@skinlabs.co.za
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
