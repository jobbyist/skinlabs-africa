import { Helmet } from "react-helmet-async";
import { Cookie, Settings, CheckCircle, XCircle, Shield } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import CookieSettingsPanel from "@/components/CookieSettingsPanel";

const EFFECTIVE = "28 August 2026";

const CookiePolicy = () => {
  const cookieTypes = [
    {
      name: "Essential / Strictly Necessary",
      icon: <CheckCircle className="h-6 w-6 text-green-500" />,
      required: true,
      description:
        "Required for the Platform to function: security, session management, load balancing, storing your cookie-consent choices, account login and payment initiation. Without these cookies core features (including login and SKYNN AI session state) cannot operate.",
      examples: ["Session cookies", "Security / CSRF tokens", "Cookie-consent storage", "Load-balancing cookies"],
    },
    {
      name: "Analytics / Performance",
      icon: <Settings className="h-6 w-6 text-blue-500" />,
      required: false,
      description:
        "Help us understand how visitors use the Platform (page views, navigation paths, feature usage, error rates) so we can improve performance and content. Data is aggregated or pseudonymised where practicable.",
      examples: ["Aggregated usage metrics", "Page-view tracking", "Performance monitoring"],
    },
    {
      name: "Personalisation / Functionality",
      icon: <Settings className="h-6 w-6 text-orange-500" />,
      required: false,
      description:
        "Remember choices you make (language, display preferences, previously viewed content, partial skin-analysis progress) and deliver a more tailored experience.",
      examples: ["Preference storage", "Partial analysis progress", "Display / theme settings"],
    },
    {
      name: "Advertising / Targeting",
      icon: <Settings className="h-6 w-6 text-purple-500" />,
      required: false,
      description:
        "Used only if activated to deliver relevant advertising on our Platform or third-party sites, measure ad effectiveness and limit ad frequency. Currently limited; any activation is reflected in the preference centre.",
      examples: ["Ad-measurement cookies", "Frequency capping"],
    },
  ];

  return (
    <>
      <Helmet>
        <title>Cookie Policy | SkinLabs®</title>
        <meta
          name="description"
          content="How SkinLabs uses cookies and similar technologies, how you control non-essential cookies, and how preferences persist across sessions. POPIA-aligned."
        />
        <link rel="canonical" href="https://skinlabs.co.za/cookie-policy" />
        <meta property="og:title" content="Cookie Policy | SkinLabs®" />
        <meta property="og:description" content="Cookie use and preference controls on SkinLabs." />
        <meta property="og:url" content="https://skinlabs.co.za/cookie-policy" />
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
                    <Cookie className="h-8 w-8 text-primary" />
                  </div>
                  <h1 className="text-4xl md:text-5xl font-heading font-bold text-foreground mb-4">Cookie Policy</h1>
                  <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                    Effective date: {EFFECTIVE} · Version 1.0
                  </p>
                  <p className="text-sm text-muted-foreground mt-2">
                    Governing law: Republic of South Africa · Contact: legal@skinlabs.co.za
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">1. Introduction</h2>
                  <p className="text-muted-foreground mb-4">
                    This Cookie Policy explains how SkinLabs® (“SkinLabs”, “we”, “us” or “our”) uses cookies and similar
                    technologies on skinlabs.co.za and within our SKYNN AI skin-analysis tools and related services
                    (collectively, the “Platform”). It should be read together with our Privacy Policy.
                  </p>
                  <p className="text-muted-foreground">
                    We are committed to transparency and to giving you meaningful control over non-essential cookies. Our
                    cookie preference centre allows you to customise settings; those choices are stored in a first-party
                    cookie so that they persist across browser sessions on the same device.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">2. What are cookies and similar technologies?</h2>
                  <p className="text-muted-foreground">
                    Cookies are small text files placed on your device when you visit a website. Similar technologies include
                    local storage, session storage, pixels and software development kits (SDKs). They help the Platform
                    function, remember your preferences, measure performance and (with your consent) deliver personalised
                    experiences.
                  </p>
                </div>

                <div className="space-y-6 mb-8">
                  <h2 className="text-2xl font-bold text-foreground text-center mb-8">3. Categories of cookies we use</h2>
                  <p className="text-muted-foreground text-center mb-6 max-w-2xl mx-auto">
                    Essential cookies do not require consent. All other categories are disabled by default until you enable
                    them via the cookie banner or preference centre (privacy by default).
                  </p>
                  {cookieTypes.map((type, index) => (
                    <div key={index} className="bg-card border border-border rounded-2xl p-8">
                      <div className="flex items-start justify-between mb-4 gap-4">
                        <div className="flex items-center gap-3">
                          {type.icon}
                          <h3 className="text-xl font-semibold text-foreground">{type.name}</h3>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          {type.required ? (
                            <span className="px-3 py-1 bg-green-500/10 text-green-600 text-xs font-medium rounded-full">
                              No consent required
                            </span>
                          ) : (
                            <span className="px-3 py-1 bg-blue-500/10 text-blue-600 text-xs font-medium rounded-full">
                              Consent required
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-muted-foreground mb-4">{type.description}</p>
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
                  <h2 className="text-2xl font-bold text-foreground mb-4">4. First-party and third-party cookies</h2>
                  <p className="text-muted-foreground">
                    Most cookies set by SkinLabs are first-party cookies (placed by skinlabs.co.za). We may also allow carefully
                    selected third-party service providers (for example analytics or payment processors) to set cookies. Any
                    third-party cookies are activated only after you grant the relevant consent category. We require such
                    providers to process data only for the agreed purpose and in accordance with POPIA and any applicable Data
                    Processing Agreement.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <div className="flex items-start gap-3 mb-4">
                    <Shield className="h-6 w-6 text-primary flex-shrink-0 mt-1" />
                    <h2 className="text-2xl font-bold text-foreground">5. Managing your cookie preferences (customisable & persistent)</h2>
                  </div>
                  <div className="space-y-4 text-muted-foreground">
                    <p>When you first visit the Platform you will see a cookie banner that allows you to:</p>
                    <ul className="list-disc list-inside space-y-1 ml-4">
                      <li>Accept all non-essential cookies;</li>
                      <li>Reject all non-essential cookies; or</li>
                      <li>Open the preference centre and toggle individual categories on or off.</li>
                    </ul>
                    <p>
                      Your choices are stored in a first-party cookie (or equivalent local storage) so that they persist for
                      subsequent visits from the same browser and device. You can reopen the preference centre at any time via
                      the “Cookie Settings” or “Storage Preferences” link in the website footer or cookie banner. Clearing
                      cookies through your browser may reset stored preferences.
                    </p>
                    <p className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4 text-sm">
                      <strong className="text-foreground">Note:</strong> Essential cookies cannot be disabled through the
                      preference centre. Blocking them via browser settings may make login, SKYNN AI analysis and payment
                      unavailable.
                    </p>
                  </div>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">6. Cookies and local storage used by SKYNN AI</h2>
                  <p className="text-muted-foreground">
                    The SKYNN AI skin-analysis feature may use local storage or session storage to temporarily hold
                    image-capture state, quality-check results and consent flags during an active analysis session. These items
                    are cleared when the session ends or after a short period. Any longer-term storage of analysis results
                    occurs only after you create an account or explicitly save results, and is governed by our Privacy Policy
                    (including special personal information rules under POPIA).
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">7. Do Not Track and browser signals</h2>
                  <p className="text-muted-foreground">
                    Some browsers transmit “Do Not Track” (DNT) signals. Because there is no uniform industry standard for
                    responding to DNT, the Platform does not currently alter its behaviour solely on the basis of a DNT signal.
                    We rely instead on the explicit choices you make in our cookie preference centre.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <h2 className="text-2xl font-bold text-foreground mb-4">8. Changes to this Cookie Policy</h2>
                  <p className="text-muted-foreground">
                    We may update this Cookie Policy from time to time. The “Effective date” at the top will be revised and,
                    where material changes affect your rights, we will provide additional notice. Continued use after the
                    effective date constitutes acceptance of the updated Policy, subject always to your rights under POPIA.
                  </p>
                </div>

                <div className="bg-card border border-border rounded-3xl p-8 md:p-12 mb-8">
                  <div className="text-center mb-8">
                    <Cookie className="h-10 w-10 text-primary mx-auto mb-3" />
                    <h2 className="text-2xl font-bold text-foreground mb-2">Manage your cookie & storage preferences</h2>
                    <p className="text-muted-foreground">
                      Update your choices below at any time — changes apply immediately on this device and persist across sessions.
                    </p>
                  </div>
                  <CookieSettingsPanel />
                </div>

                <div className="bg-gradient-to-r from-primary/10 to-secondary/10 rounded-3xl p-8 md:p-12 text-center">
                  <p className="text-sm text-muted-foreground">
                    Questions about cookies or your data? Contact us at{" "}
                    <a href="mailto:legal@skinlabs.co.za" className="text-primary hover:underline">
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

export default CookiePolicy;
