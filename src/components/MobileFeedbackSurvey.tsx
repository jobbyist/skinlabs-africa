import { useEffect, useState } from "react";
import { Loader2, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { trackConversionEvent } from "@/lib/analytics-events";
import { cn } from "@/lib/utils";
import {
  FEEDBACK_COMMENT_MAX,
  FEEDBACK_SURVEY_CUTOFF_MS,
  getFeedbackSurvey,
  type FeedbackSurvey,
} from "@/lib/feedback-surveys";
import { submitFeedbackSurvey } from "@/lib/feedbackSubmit";
import { useLocation } from "react-router-dom";

const SESSION_SHOWN_KEY = "skinlabs-feedback-survey-session-shown-v1";
const USER_SHOWN_PREFIX = "skinlabs-feedback-survey-shown-v1";
const USER_VISITED_PREFIX = "skinlabs-feedback-survey-visited-v1";
const PENDING_KEY = "skinlabs-feedback-survey-pending-v1";
const MAX_COMMENT_LENGTH = FEEDBACK_COMMENT_MAX;

let sessionShownFallback = false;

const safeGet = (storage: Storage, key: string) => {
  try {
    return storage.getItem(key);
  } catch {
    return null;
  }
};

const safeSet = (storage: Storage, key: string) => {
  try {
    storage.setItem(key, "1");
  } catch {
    // Storage can be unavailable in private browsing; the module-level fallback
    // still enforces the one-survey-per-rendered-session rule.
  }
};

const isMobile = () =>
  typeof window !== "undefined" && window.matchMedia("(max-width: 767px)").matches;

const FeedbackSurveyModal = ({
  survey,
  open,
  submitting,
  onClose,
  onSubmit,
}: {
  survey: FeedbackSurvey | null;
  open: boolean;
  submitting: boolean;
  onClose: () => void;
  onSubmit: (answer: string, comment: string) => void;
}) => {
  const [answer, setAnswer] = useState("");
  const [comment, setComment] = useState("");

  useEffect(() => {
    if (!open) {
      setAnswer("");
      setComment("");
    }
  }, [open]);

  if (!survey) return null;

  return (
    <Dialog open={open} onOpenChange={(nextOpen) => !nextOpen && onClose()}>
      <DialogContent className="w-[calc(100%-24px)] max-w-md rounded-3xl border-border/70 bg-card/95 p-5 shadow-2xl backdrop-blur-xl sm:rounded-3xl">
        <DialogHeader className="pr-8 text-left">
          <div className="mb-2 inline-flex w-fit items-center gap-2 rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.12em] text-primary">
            <MessageCircle className="h-3 w-3" aria-hidden="true" />
            {survey.eyebrow}
          </div>
          <DialogTitle className="font-heading text-xl font-extrabold leading-tight tracking-tight">
            {survey.title}
          </DialogTitle>
          <DialogDescription className="text-sm leading-relaxed">
            {survey.description}
          </DialogDescription>
        </DialogHeader>

        <fieldset className="space-y-2">
          <legend className="mb-2 text-sm font-semibold text-foreground">{survey.question}</legend>
          <div className="grid gap-2">
            {survey.options.map((option) => {
              const selected = answer === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => setAnswer(option.value)}
                  className={cn(
                    "min-h-11 w-full rounded-2xl border px-3.5 py-3 text-left text-sm font-medium transition-[transform,background-color,border-color,box-shadow] duration-150 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    selected
                      ? "border-foreground bg-foreground text-background shadow-md"
                      : "border-border bg-background/70 text-foreground hover:border-foreground/30 hover:bg-background",
                  )}
                >
                  {option.label}
                </button>
              );
            })}
          </div>
        </fieldset>

        <div className="space-y-2">
          <label htmlFor={`feedback-comment-${survey.id}`} className="text-xs font-semibold text-foreground">
            {survey.followUpLabel} <span className="font-normal text-muted-foreground">(optional)</span>
          </label>
          <Textarea
            id={`feedback-comment-${survey.id}`}
            value={comment}
            onChange={(event) => setComment(event.target.value.slice(0, MAX_COMMENT_LENGTH))}
            rows={3}
            maxLength={MAX_COMMENT_LENGTH}
            placeholder="A sentence or two is plenty."
            className="min-h-20 resize-none rounded-2xl bg-background/70 text-sm"
          />
          <p className="text-right text-[10px] text-muted-foreground">{comment.length}/{MAX_COMMENT_LENGTH}</p>
        </div>

        <DialogFooter className="grid grid-cols-2 gap-2 sm:flex sm:justify-end">
          <Button type="button" variant="ghost" className="min-h-11 rounded-2xl" onClick={onClose} disabled={submitting}>
            Not now
          </Button>
          <Button
            type="button"
            className="min-h-11 rounded-2xl gap-2"
            disabled={!answer || submitting}
            onClick={() => onSubmit(answer, comment.trim())}
          >
            {submitting ? "Sending…" : "Send feedback"}
            {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden="true" /> : <Send className="h-3.5 w-3.5" aria-hidden="true" />}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export const MobileFeedbackSurvey = () => {
  const { user, loading: authLoading } = useAuth();
  // The id, not the user object: supabase-js hands back a new object on every token
  // refresh, which would otherwise cancel the pending timer after the first-visit
  // flag was already spent.
  const userId = user?.id;
  const { pathname } = useLocation();
  const [mobile, setMobile] = useState(false);
  const [survey, setSurvey] = useState<FeedbackSurvey | null>(null);
  const [open, setOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const media = window.matchMedia("(max-width: 767px)");
    const sync = () => setMobile(media.matches);
    sync();
    media.addEventListener?.("change", sync);
    return () => media.removeEventListener?.("change", sync);
  }, []);

  useEffect(() => {
    setOpen(false);
    setSurvey(null);
    setSubmitted(false);
    setSubmitting(false);
  }, [pathname]);

  useEffect(() => {
    if (!mobile || authLoading || !userId) return;
    if (Date.now() >= FEEDBACK_SURVEY_CUTOFF_MS) return;

    const current = getFeedbackSurvey(pathname);
    if (!current) return;

    const userShownKey = USER_SHOWN_PREFIX + ":" + userId + ":" + current.id;
    const userVisitedKey = USER_VISITED_PREFIX + ":" + userId + ":" + current.id;
    if (safeGet(localStorage, userShownKey)) return;
    if (safeGet(sessionStorage, SESSION_SHOWN_KEY) === "1" || sessionShownFallback) return;

    // "First time on this surface": the first arrival records the visit and leaves a
    // session-scoped note, so a reader who goes hub -> article inside the delay is
    // still asked once, on the page they're actually reading. A later visit, or a
    // later session, never is.
    const firstArrival = !safeGet(localStorage, userVisitedKey);
    if (firstArrival) {
      safeSet(localStorage, userVisitedKey);
      try {
        sessionStorage.setItem(PENDING_KEY, current.id);
      } catch {
        // ignore: the same-route timer below still works
      }
    }
    if (!firstArrival && safeGet(sessionStorage, PENDING_KEY) !== current.id) return;

    let cancelled = false;
    const timer = window.setTimeout(() => {
      if (cancelled || !isMobile() || Date.now() >= FEEDBACK_SURVEY_CUTOFF_MS) return;

      const sessionBlocked =
        safeGet(sessionStorage, SESSION_SHOWN_KEY) === "1" || sessionShownFallback;
      if (safeGet(localStorage, userShownKey) || sessionBlocked) return;

      safeSet(localStorage, userShownKey);
      safeSet(sessionStorage, SESSION_SHOWN_KEY);
      sessionShownFallback = true;

      setSurvey(current);
      setSubmitted(false);
      setOpen(true);
      trackConversionEvent("feedback_survey_shown", {
        survey_id: current.id,
        surface: current.surface,
      });
    }, 7000);

    // No separate timer for the cutoff date: it is ~88 days away, and setTimeout delays above
    // 2^31-1 ms (~24.8 days) overflow and fire immediately, which used to cancel every survey
    // before it showed. The checks above and in the callback, plus the `open &&` guard on the
    // modal below, already enforce it.
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [mobile, authLoading, userId, pathname]);

  const handleClose = () => {
    if (submitting) return;
    if (survey && !submitted) {
      trackConversionEvent("feedback_survey_dismissed", {
        survey_id: survey.id,
        surface: survey.surface,
      });
    }
    setOpen(false);
  };

  const handleSubmit = async (answer: string, comment: string) => {
    if (!survey || submitting) return;

    setSubmitting(true);
    const result = await submitFeedbackSurvey(survey, answer, comment, pathname);
    setSubmitting(false);

    if (result === "failed") {
      // Stay open so the answer isn't lost; never claim it was sent.
      toast.error("Couldn't send your feedback. Please try again.");
      return;
    }

    setSubmitted(true);
    // Analytics carry tokens and counts only. The comment itself goes to feedback@ via the
    // database, never into analytics_events.
    trackConversionEvent("feedback_survey_submitted", {
      survey_id: survey.id,
      surface: survey.surface,
      answer,
      has_comment: comment.length > 0,
      comment_length: comment.length,
    });
    toast.success("Thanks, that really helps.");
    setOpen(false);
  };

  return (
    <FeedbackSurveyModal
      survey={survey}
      open={open && mobile && Date.now() < FEEDBACK_SURVEY_CUTOFF_MS}
      submitting={submitting}
      onClose={handleClose}
      onSubmit={(answer, comment) => void handleSubmit(answer, comment)}
    />
  );
};

export default MobileFeedbackSurvey;
