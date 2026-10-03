import { useId, useState } from "react";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NEWSLETTER_CONSENT_TEXT, subscribeToDigest } from "@/lib/newsletter";
import { cn } from "@/lib/utils";

interface NewsletterSignupProps {
  /** Placement id used for analytics and stored with the signup, e.g. "briefing-end". */
  source: string;
  className?: string;
}

type Status = "idle" | "submitting" | "sent" | "error" | "invalid";

/**
 * Weekly-digest signup (double opt-in): the visitor gets a confirmation email
 * and is only subscribed once they press the button in it. Never claims
 * they're "subscribed" before that.
 */
const NewsletterSignup = ({ source, className }: NewsletterSignupProps) => {
  const id = useId();
  const [email, setEmail] = useState("");
  const [honeypot, setHoneypot] = useState("");
  const [status, setStatus] = useState<Status>("idle");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === "submitting") return;
    // Bots fill the hidden field; show success without sending anything.
    if (honeypot) {
      setStatus("sent");
      return;
    }
    setStatus("submitting");
    const result = await subscribeToDigest(email, source);
    setStatus(result === "pending" ? "sent" : result === "invalid_email" ? "invalid" : "error");
  };

  return (
    <section
      aria-labelledby={`${id}-heading`}
      className={cn("my-10 rounded-2xl border border-border bg-card p-5 sm:p-6", className)}
    >
      <div className="flex items-start gap-3">
        <Mail className="mt-1 h-5 w-5 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id={`${id}-heading`} className="font-heading text-lg font-bold text-foreground">
            The SkinLabs weekly digest
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            One email a week: the best new briefings, reviews and ingredient guides. Free.
          </p>

          {status === "sent" ? (
            <p role="status" className="mt-4 flex items-start gap-2 text-sm text-foreground">
              <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
              <span>
                Check your inbox. We've sent a confirmation email; tap the button in it to finish subscribing.
              </span>
            </p>
          ) : (
            <form onSubmit={handleSubmit} noValidate className="mt-4">
              <div className="flex flex-col gap-2 sm:flex-row">
                <label htmlFor={`${id}-email`} className="sr-only">
                  Email address
                </label>
                <Input
                  id={`${id}-email`}
                  type="email"
                  inputMode="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (status === "invalid" || status === "error") setStatus("idle");
                  }}
                  aria-invalid={status === "invalid"}
                  aria-describedby={`${id}-consent ${id}-error`}
                  className="min-w-0 flex-1"
                  required
                />
                {/* Honeypot: off-screen, not focusable, ignored by assistive tech. */}
                <input
                  type="text"
                  name="website"
                  tabIndex={-1}
                  autoComplete="off"
                  aria-hidden="true"
                  value={honeypot}
                  onChange={(e) => setHoneypot(e.target.value)}
                  className="absolute -left-[9999px] h-0 w-0 opacity-0"
                />
                <Button type="submit" disabled={status === "submitting"} className="shrink-0">
                  {status === "submitting" ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden="true" /> Sending…
                    </>
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </div>
              <p id={`${id}-error`} role="alert" className="mt-2 min-h-0 text-sm text-destructive">
                {status === "invalid" && "That email address doesn't look right."}
                {status === "error" && "Something went wrong. Please try again."}
              </p>
              <p id={`${id}-consent`} className="mt-2 text-xs text-muted-foreground">
                {NEWSLETTER_CONSENT_TEXT} You'll get a confirmation email first.
              </p>
            </form>
          )}
        </div>
      </div>
    </section>
  );
};

export default NewsletterSignup;
