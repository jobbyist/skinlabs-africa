// The only piece of this system that ever calls Resend (via send-email).
// Invoked every minute by the 'email-outbox-processor' pg_cron job
// (supabase/migrations/20260916101000_email_system_triggers.sql), never
// synchronously from a database trigger — see docs/
// email-automation-system.md for why.
//
// Flow per job: claim atomically -> resolve template -> run its guard
// against CURRENT state if one exists -> render -> send via send-email
// with the outbox row id as Resend's Idempotency-Key -> record the
// outcome. A permanently-failed TRANSACTIONAL job raises its own admin
// alert (see fail_email_job() in the core migration).
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getTemplate, missingRequiredVars } from "../_shared/email/templates/index.ts";
import { getGuard } from "../_shared/email/guards.ts";
import { renderEmailLayout } from "../_shared/email/layout.ts";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const EMAIL_CRON_SECRET = Deno.env.get("EMAIL_CRON_SECRET");
const ADMIN_NOTIFICATION_EMAIL = Deno.env.get("ADMIN_NOTIFICATION_EMAIL") || "support@skinlabs.co.za";
const BATCH_SIZE = 20;

// Extra recipients CC'd onto specific ADMIN templates alongside
// ADMIN_NOTIFICATION_EMAIL, for forms whose lead belongs to a specific
// department mailbox as well as general support. Additive only — never
// replaces the support@ notification, since support@ is the one confirmed-
// monitored inbox every admin lead must always reach.
const ADMIN_TEMPLATE_EXTRA_RECIPIENTS: Record<string, string[]> = {
  admin_form_notification_partner: ["partners@skinlabs.co.za"],
};

interface OutboxJob {
  id: string;
  event_id: string;
  template_id: string;
  category: string;
  transactional: boolean;
  recipient_email: string | null;
  user_id: string | null;
  payload: Record<string, unknown>;
  processing_token: string;
  attempt_count: number;
}

function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: { "Content-Type": "application/json" } });
}

async function sendViaResend(
  supabaseAdmin: ReturnType<typeof createClient>,
  to: string | string[],
  subject: string,
  html: string,
  idempotencyKey: string,
  headers?: Record<string, string>,
) {
  const resp = await fetch(`${SUPABASE_URL}/functions/v1/send-email`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ to, subject, html, idempotency_key: idempotencyKey, headers }),
  });
  const body = await resp.json().catch(() => ({}));
  if (!resp.ok) {
    throw new Error(`send-email ${resp.status}: ${JSON.stringify(body)}`);
  }
  return body?.data?.id as string | undefined;
}

async function processJob(supabaseAdmin: ReturnType<typeof createClient>, job: OutboxJob) {
  const template = getTemplate(job.template_id);
  if (!template) {
    await supabaseAdmin.rpc("fail_email_job", {
      p_job_id: job.id,
      p_processing_token: job.processing_token,
      p_error: `Unknown template_id: ${job.template_id}`,
    });
    return;
  }

  let vars: Record<string, unknown> = { ...job.payload };
  let recipient: string | string[] | null = job.recipient_email;

  const guard = getGuard(job.template_id);
  if (guard) {
    const result = await guard(supabaseAdmin, { user_id: job.user_id, payload: job.payload });
    if (!result.send) {
      await supabaseAdmin.rpc("cancel_email_job", {
        p_job_id: job.id,
        p_reason: result.reason ?? "guard rejected send",
      });
      return;
    }
    vars = { ...vars, ...(result.vars ?? {}) };
  }

  if (!recipient) {
    if (job.category === "ADMIN") {
      const extra = ADMIN_TEMPLATE_EXTRA_RECIPIENTS[job.template_id];
      recipient = extra ? [ADMIN_NOTIFICATION_EMAIL, ...extra] : ADMIN_NOTIFICATION_EMAIL;
    } else {
      await supabaseAdmin.rpc("fail_email_job", {
        p_job_id: job.id,
        p_processing_token: job.processing_token,
        p_error: "No recipient_email and category is not ADMIN",
      });
      return;
    }
  }

  const missing = missingRequiredVars(template, vars);
  if (missing.length > 0) {
    await supabaseAdmin.rpc("fail_email_job", {
      p_job_id: job.id,
      p_processing_token: job.processing_token,
      p_error: `Missing required template vars: ${missing.join(", ")}`,
    });
    return;
  }

  const subject = template.subject(vars);
  const preheader = template.preheader(vars);
  const bodyHtml = template.render(vars);
  const html = renderEmailLayout({ preheader, bodyHtml });

  // Gmail/Yahoo's 2024 bulk-sender requirements make one-click
  // List-Unsubscribe mandatory for marketing mail — required here, not
  // optional polish. unsubscribe_url is always present on a MARKETING job
  // (set by enqueue_weekly_newsletter_digest()); mailto falls back to the
  // one confirmed-monitored inbox rather than a guessed address.
  let resendHeaders: Record<string, string> | undefined;
  if (job.category === "MARKETING" && typeof vars.unsubscribe_url === "string") {
    resendHeaders = {
      "List-Unsubscribe": `<mailto:support@skinlabs.co.za?subject=unsubscribe>, <${vars.unsubscribe_url}>`,
      "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
    };
  }

  try {
    const providerMessageId = await sendViaResend(supabaseAdmin, recipient, subject, html, job.id, resendHeaders);
    await supabaseAdmin.rpc("complete_email_job", {
      p_job_id: job.id,
      p_processing_token: job.processing_token,
      p_provider_message_id: providerMessageId ?? null,
    });
  } catch (err) {
    await supabaseAdmin.rpc("fail_email_job", {
      p_job_id: job.id,
      p_processing_token: job.processing_token,
      p_error: err instanceof Error ? err.message : String(err),
    });
  }
}

Deno.serve(async (req: Request) => {
  if (req.method !== "POST") {
    return json({ error: "Method not allowed" }, 405);
  }
  if (!EMAIL_CRON_SECRET || req.headers.get("x-cron-secret") !== EMAIL_CRON_SECRET) {
    return json({ error: "Unauthorized" }, 401);
  }

  const supabaseAdmin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  const { data: jobs, error } = await supabaseAdmin.rpc("claim_pending_email_jobs", { p_limit: BATCH_SIZE });
  if (error) {
    console.error("claim_pending_email_jobs failed", error);
    return json({ error: "Failed to claim jobs" }, 500);
  }

  const claimed = (jobs ?? []) as OutboxJob[];
  for (const job of claimed) {
    try {
      await processJob(supabaseAdmin, job);
    } catch (err) {
      console.error("Unhandled error processing email job", job.id, err);
      await supabaseAdmin.rpc("fail_email_job", {
        p_job_id: job.id,
        p_processing_token: job.processing_token,
        p_error: err instanceof Error ? err.message : String(err),
      });
    }
  }

  return json({ processed: claimed.length });
});
