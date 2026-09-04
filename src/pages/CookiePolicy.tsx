import { Helmet } from "react-helmet-async";
import { Cookie, Settings, CheckCircle, XCircle } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieSettingsPanel from "@/components/CookieSettingsPanel";

/** Bump when this policy's substance changes — not on every deploy. */
const COOKIE_POLICY_LAST_UPDATED = "September 2026";

const CookiePolicy = () => {
  const cookieTypes = [
    {
      name: "Essential Cookies",
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      required: true,
      description: "Necessary for the website to function properly. These cookies enable basic functions like page navigation and access to secure areas.",
      examples: ["Session cookies", "Security cookies", "Load balancing cookies"]
    },
    {
      name: "Analytics Cookies",
      icon: <Settings className="h-6 w-6 text-blue-500" />,
      required: false,
      description: "Help us understand how visitors interact with our website by collecting and reporting information anonymously.",
      examples: ["Google Analytics", "Page view tracking", "User behavior analysis"]
    },
    {
      name: "Marketing Cookies",
      icon: <Settings className="h-6 w-6 text-purple-500" />,
      required: false,
      description: "Used to track visitors across websites to display relevant advertisements and measure campaign effectiveness.",
      examples: ["Facebook Pixel", "Google Ads", "Retargeting cookies"]
    },
    {
      name: "Preference Cookies",
      icon: <Settings className="h-6 w-6 text-orange-500" />,
      required: false,
      description: "Enable the website to remember your preferences and provide enhanced, personalized features.",
      examples: ["Language preference", "Theme selection", "Region settings"]
    }
  ];

  return (
    <>
      <Helmet>
        <title>Cookie Policy — How We Use Cookies | SkinLabs®</title>
        <meta
          name="description"
          content="Which cookies SkinLabs uses, what each type does, and how to manage or delete them from your browser."
        />
        <link rel="canonical" href="https://skinlabs.co.za/cookie-policy" />
        <meta property="og:title" content="Cookie Policy | SkinLabs®" />
        <meta property="og:description" content="Which cookies SkinLabs uses and how to manage your preferences." />
        <meta property="og:url" content="https://skinlabs.co.za/cookie-policy" />
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
                    <Cookie className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">
                    Cookie Policy
                  </h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Last updated: {COOKIE_POLICY_LAST_UPDATED}
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">What are cookies?</h2>
                  <p className="text-muted-foreground mb-4">
                    Cookies are small text files placed on your device when you visit our website. Nothing sinister —
                    they help us remember your preferences, understand how you use the site, and improve it over time.
                  </p>
                  <p className="text-muted-foreground">
                    We use session cookies (gone when you close your browser) and persistent cookies (which stick
                    around until they expire or you delete them).
                  </p>
                </div>

                <div className="space-y-6 mb-8">
                  <h2 className="text-2xl font-bold text-foreground text-center mb-8">Types of Cookies We Use</h2>
                  {cookieTypes.map((type, index) => (
                    <div key={index} className="bg-card border border-border rounded-2xl p-8">
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {type.icon}
                          <h3 className="text-xl font-semibold text-foreground">
                            {type.name}
                          </h3>
                        </div>
                        <div className="flex items-center gap-2">
                          {type.required ? (
                            <span className="px-3 py-1 bg-green-500/10 text-green-600 text-xs font-medium rounded-full">
                              Required
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-600 text-xs font-medium rounded-full">
                              Optional
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4">
                        {type.description}
                      </p>
                      <div>
                        <p className="text-sm font-semibold text-foreground mb-2">Examples:</p>
                        <ul className="space-y-1">
                          {type.examples.map((example, idx) => (
                            <li key={idx} className="text-sm text-muted-foreground flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                              {example}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Managing Your Cookie Preferences</h2>
                  <div className="space-y-4 text-muted-foreground">
                    <p>
                      You can control and manage cookies in several ways:
                    </p>
                    <div className="space-y-3">
                      <div className="flex items-start gap-3">
                        <Settings className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">Browser Settings</h3>
                          <p className="text-sm">
                            Most browsers allow you to refuse or accept cookies through their settings. Check your browser's help section for instructions.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <Cookie className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">Cookie Banner</h3>
                          <p className="text-sm">
                            When you first visit our site, you can choose which types of cookies to accept through our cookie consent banner.
                          </p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3">
                        <XCircle className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
                        <div>
                          <h3 className="font-semibold text-foreground mb-1">Delete Existing Cookies</h3>
                          <p className="text-sm">
                            You can delete cookies that are already stored on your device through your browser settings.
                          </p>
                        </div>
                      </div>
                    </div>
                    <p className="mt-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-sm">
                      <strong>Note:</strong> Blocking or deleting essential cookies may affect your ability to use certain features of our website.
                    </p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Third-Party Cookies</h2>
                  <p className="text-muted-foreground mb-4">
                    We use services from trusted third parties that may also set cookies on your device. These include:
                  </p>
                  <ul className="space-y-2 text-muted-foreground">
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span><strong>Google Analytics:</strong> To understand how visitors use our website</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span><strong>Payment Processors:</strong> To securely process your transactions</span>
                    </li>
                    <li className="flex items-start gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary mt-2" />
                      <span><strong>Social Media:</strong> To enable social sharing and track engagement</span>
                    </li>
                  </ul>
                  <p className="text-muted-foreground mt-4">
                    These third parties have their own privacy policies governing the use of cookies. We recommend reviewing their policies for more information.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">Updates to This Policy</h2>
                  <p className="text-muted-foreground">
                    We may update this Cookie Policy from time to time to reflect changes in our practices or for other operational, legal, or regulatory reasons. We encourage you to review this policy periodically to stay informed about how we use cookies.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <div className="text-center mb-8">
                    <Cookie className="h-10 w-10 text-primary mx-auto mb-3" />
                    <h2 className="text-2xl font-bold text-foreground mb-2">Manage Your Cookie & Storage Preferences</h2>
                    <p className="text-muted-foreground">
                      Update your choices below at any time — changes apply immediately, on this device.
                    </p>
                  </div>
                  <CookieSettingsPanel />
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    Questions about cookies, storage or your data? Contact us at{" "}
                    <a href="mailto:privacy@skinlabs.co.za" className="text-primary hover:underline">
                      privacy@skinlabs.co.za
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

export default CookiePolicy;
