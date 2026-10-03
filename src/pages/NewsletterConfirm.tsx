import { useEffect, useState } from "react";
import { Helmet } from "react-helmet-async";
import { Link, useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { confirmDigest, type ConfirmResult } from "@/lib/newsletter";

/**
 * Step 2 of the weekly-digest double opt-in. The emailed link lands here and
 * the visitor presses a button: confirming on page load would let mail
 * scanners that open links subscribe people who never asked.
 */
const NewsletterConfirm = () => {
  const [params] = useSearchParams();
  // Read the token once, then take it out of the address bar (history, copied URLs)
  // and send no Referer from this page. The token only ever confirms the subscription
  // it was issued for, but there's no reason to leave it lying around.
  const [token] = useState(() => params.get("token") ?? "");
  useEffect(() => {
    if (window.location.search) window.history.replaceState(window.history.state, "", window.location.pathname);
  }, []);
  const [state, setState] = useState<"idle" | "working" | ConfirmResult>("idle");

  const confirm = async () => {
    setState("working");
    setState(await confirmDigest(token));
  };

  const ok = state === "confirmed" || state === "already";

  return (
    <>
      <Helmet>
        <meta name="referrer" content="no-referrer" />
      </Helmet>
      <SEO title="Confirm your subscription" description="Confirm your SkinLabs weekly digest subscription." canonical="/newsletter/confirm" noindex />
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto max-w-lg px-4 pb-20 pt-32 text-center">
          {ok ? (
            <>
              <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-primary" aria-hidden="true" />
              <h1 className="font-heading text-2xl font-bold text-foreground">
                {state === "already" ? "You're already confirmed" : "You're subscribed"}
              </h1>
              <p role="status" className="mt-3 text-muted-foreground">
                The weekly digest will reach you every Monday. Every email has a one-click unsubscribe link.
              </p>
              <Button asChild className="mt-6">
                <Link to="/briefings">Read today's briefings</Link>
              </Button>
            </>
          ) : state === "invalid" || state === "error" || !token ? (
            <>
              <AlertCircle className="mx-auto mb-4 h-10 w-10 text-destructive" aria-hidden="true" />
              <h1 className="font-heading text-2xl font-bold text-foreground">
                {state === "error" ? "Something went wrong" : "This link isn't valid"}
              </h1>
              <p role="alert" className="mt-3 text-muted-foreground">
                {state === "error"
                  ? "We couldn't confirm your subscription. Please try again in a moment."
                  : "It may have expired (links last 7 days) or been replaced by a newer one. You can sign up again from any article."}
              </p>
              {state === "error" && token && (
                <Button className="mt-6" onClick={confirm}>
                  Try again
                </Button>
              )}
            </>
          ) : (
            <>
              <h1 className="font-heading text-2xl font-bold text-foreground">Confirm your subscription</h1>
              <p className="mt-3 text-muted-foreground">
                One tap and the SkinLabs weekly digest is on its way to you.
              </p>
              <Button className="mt-6" onClick={confirm} disabled={state === "working"}>
                {state === "working" ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Confirming…
                  </>
                ) : (
                  "Confirm my subscription"
                )}
              </Button>
            </>
          )}
        </main>
        <Footer />
      </div>
    </>
  );
};

export default NewsletterConfirm;
