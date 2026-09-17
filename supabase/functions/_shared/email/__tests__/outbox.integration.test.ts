// DB-backed idempotency tests — a new pattern for this repo (no existing
// test here talks to Supabase), justified because unique-constraint and
// concurrency correctness cannot be verified as pure functions. Skips
// entirely (via test.skip, not a thrown error) unless service-role
// credentials are present, so `bun test` stays green with no secrets
// configured. Every row this suite creates is prefixed with a per-run id
// and deleted again at the end.
import { afterAll, describe, expect, test } from "bun:test";
import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const hasCreds = Boolean(SUPABASE_URL && SERVICE_ROLE_KEY);

const it = hasCreds ? test : test.skip;
const runId = `test:${Date.now()}:${Math.random().toString(36).slice(2)}`;

const supabase = hasCreds ? createClient(SUPABASE_URL as string, SERVICE_ROLE_KEY as string) : null;

async function cleanup() {
  if (!supabase) return;
  await supabase.from("email_events").delete().like("idempotency_key", `${runId}%`);
}

afterAll(async () => {
  await cleanup();
});

describe("email outbox idempotency (requires SUPABASE_SERVICE_ROLE_KEY + SUPABASE_URL)", () => {
  it("duplicate event enqueue converges on one email_events row", async () => {
    const key = `${runId}:duplicate-event`;
    const first = await supabase!.rpc("enqueue_email_event", {
      p_event_type: "TEST_EVENT", p_idempotency_key: key, p_user_id: null,
      p_recipient_email: "test@skinlabs.co.za", p_payload: {}, p_source: "test",
    });
    const second = await supabase!.rpc("enqueue_email_event", {
      p_event_type: "TEST_EVENT", p_idempotency_key: key, p_user_id: null,
      p_recipient_email: "test@skinlabs.co.za", p_payload: {}, p_source: "test",
    });
    expect(first.error).toBeNull();
    expect(second.error).toBeNull();
    expect(first.data).toBe(second.data);

    const { count } = await supabase!
      .from("email_events")
      .select("id", { count: "exact", head: true })
      .eq("idempotency_key", key);
    expect(count).toBe(1);
  });

  it("concurrent duplicate enqueue_email calls still produce exactly one outbox job", async () => {
    const eventKey = `${runId}:concurrent-event`;
    const jobKey = `${runId}:concurrent-job`;
    const calls = Array.from({ length: 5 }, () =>
      supabase!.rpc("enqueue_email", {
        p_event_type: "TEST_EVENT", p_event_idempotency_key: eventKey,
        p_template_id: "auth_welcome", p_category: "AUTH", p_user_id: null,
        p_recipient_email: "test@skinlabs.co.za", p_payload: {}, p_source: "test",
        p_transactional: true, p_priority: 100, p_job_idempotency_key: jobKey,
      })
    );
    const results = await Promise.all(calls);
    for (const r of results) expect(r.error).toBeNull();
    const jobIds = new Set(results.map((r) => r.data));
    expect(jobIds.size).toBe(1);

    const { count } = await supabase!
      .from("email_outbox")
      .select("id", { count: "exact", head: true })
      .eq("idempotency_key", jobKey);
    expect(count).toBe(1);

    await supabase!.from("email_outbox").delete().eq("idempotency_key", jobKey);
  });

  it("a cron re-run on the same reminder date reuses the same idempotency key (one job, not one per run)", async () => {
    const today = new Date().toISOString().slice(0, 10);
    const eventKey = `${runId}:trial_expiring:fake-user:${today}`;
    const first = await supabase!.rpc("enqueue_email", {
      p_event_type: "TRIAL_EXPIRING", p_event_idempotency_key: eventKey,
      p_template_id: "trial_expiring", p_category: "TRIAL", p_user_id: null,
      p_recipient_email: "test@skinlabs.co.za", p_payload: { trial_ends_at: today }, p_source: "test",
    });
    // Simulates the hourly cron firing again within the same day.
    const secondRun = await supabase!.rpc("enqueue_email", {
      p_event_type: "TRIAL_EXPIRING", p_event_idempotency_key: eventKey,
      p_template_id: "trial_expiring", p_category: "TRIAL", p_user_id: null,
      p_recipient_email: "test@skinlabs.co.za", p_payload: { trial_ends_at: today }, p_source: "test",
    });
    expect(first.data).toBe(secondRun.data);
    await supabase!.from("email_outbox").delete().eq("idempotency_key", eventKey);
  });

  it("claim_pending_email_jobs never lets two concurrent claimants take the same row", async () => {
    const eventKey = `${runId}:claim-race-event`;
    const jobKey = `${runId}:claim-race-job`;
    await supabase!.rpc("enqueue_email", {
      p_event_type: "TEST_EVENT", p_event_idempotency_key: eventKey,
      p_template_id: "auth_welcome", p_category: "AUTH", p_user_id: null,
      p_recipient_email: "test@skinlabs.co.za", p_payload: {}, p_source: "test",
      p_job_idempotency_key: jobKey,
    });

    const [claimA, claimB] = await Promise.all([
      supabase!.rpc("claim_pending_email_jobs", { p_limit: 50 }),
      supabase!.rpc("claim_pending_email_jobs", { p_limit: 50 }),
    ]);
    const idsA = new Set((claimA.data ?? []).map((r: { id: string }) => r.id));
    const idsB = new Set((claimB.data ?? []).map((r: { id: string }) => r.id));
    const overlap = [...idsA].filter((id) => idsB.has(id));
    expect(overlap).toEqual([]);

    await supabase!.from("email_outbox").delete().eq("idempotency_key", jobKey);
  });

  it("complete_email_job rejects a stale processing_token (crash-recovery safety)", async () => {
    const eventKey = `${runId}:token-event`;
    const jobKey = `${runId}:token-job`;
    await supabase!.rpc("enqueue_email", {
      p_event_type: "TEST_EVENT", p_event_idempotency_key: eventKey,
      p_template_id: "auth_welcome", p_category: "AUTH", p_user_id: null,
      p_recipient_email: "test@skinlabs.co.za", p_payload: {}, p_source: "test",
      p_job_idempotency_key: jobKey,
    });
    const { data: claimed } = await supabase!.rpc("claim_pending_email_jobs", { p_limit: 1 });
    const job = (claimed ?? []).find((r: { idempotency_key: string }) => r.idempotency_key === jobKey);
    expect(job).toBeDefined();

    const wrongToken = "00000000-0000-0000-0000-000000000000";
    const { data: completedWithWrongToken } = await supabase!.rpc("complete_email_job", {
      p_job_id: job.id, p_processing_token: wrongToken, p_provider_message_id: "msg_1",
    });
    expect(completedWithWrongToken).toBe(false);

    const { data: completedWithRealToken } = await supabase!.rpc("complete_email_job", {
      p_job_id: job.id, p_processing_token: job.processing_token, p_provider_message_id: "msg_1",
    });
    expect(completedWithRealToken).toBe(true);

    await supabase!.from("email_outbox").delete().eq("idempotency_key", jobKey);
  });

  it("email_delivery_events dedups a redelivered webhook on resend_event_id", async () => {
    const svixId = `${runId}-svix-evt`;
    const first = await supabase!.from("email_delivery_events").insert({
      resend_event_id: svixId, event_type: "email.delivered", raw_payload: { test: true },
    });
    const second = await supabase!.from("email_delivery_events").insert({
      resend_event_id: svixId, event_type: "email.delivered", raw_payload: { test: true },
    });
    expect(first.error).toBeNull();
    expect(second.error).not.toBeNull();
    expect(second.error?.code).toBe("23505");

    await supabase!.from("email_delivery_events").delete().eq("resend_event_id", svixId);
  });
});
