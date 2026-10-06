import { describe, expect, test } from "bun:test";
import {
  authoriseDispatcher,
  buildPushPayload,
  classifyDelivery,
  isUuid,
  MAX_TRACK_BODY_BYTES,
  parseTrackBody,
  runPool,
  shouldClaimAnotherRound,
  subscriptionActionFor,
  summariseOutcomes,
  urgencyFor,
  type ClaimedDispatch,
} from "../../../supabase/functions/_shared/push/notificationDispatch";
import { MAX_CONSECUTIVE_FAILURES } from "../../../supabase/functions/_shared/push/dispatch";
import { notificationFromPush } from "../pwa/pushPayload";

const dispatch: ClaimedDispatch = {
  d_id: "11111111-1111-4111-8111-111111111111",
  d_user_id: "22222222-2222-4222-8222-222222222222",
  d_category: "report_ready",
  d_title: "Your SkinLabs® report is ready",
  d_body: "Tap to read it securely in the app.",
  d_url: "/dashboard?tab=analysis",
  d_tag: "report_ready_advanced",
  d_subscriptions: [],
};
const DELIVERY = "33333333-3333-4333-8333-333333333333";

describe("payload building", () => {
  test("carries exactly the fields the service worker reads, plus the delivery id", () => {
    expect(buildPushPayload(dispatch, DELIVERY)).toEqual({
      title: dispatch.d_title,
      body: dispatch.d_body,
      url: dispatch.d_url,
      tag: "report_ready_advanced",
      category: "report_ready",
      d: DELIVERY,
    });
  });
  test("never includes the user id, dispatch id or any subscription data", () => {
    const text = JSON.stringify(buildPushPayload({ ...dispatch, d_subscriptions: [{ id: "s", endpoint: "https://push.example/x", p256dh: "k", auth: "a", failure_count: 0, platform: null, browser: null }] }, DELIVERY));
    for (const secret of [dispatch.d_user_id, dispatch.d_id, "push.example", '"p256dh"', '"auth"']) expect(text).not.toContain(secret);
  });
  test("a null tag is omitted", () => {
    expect("tag" in JSON.parse(JSON.stringify(buildPushPayload({ ...dispatch, d_tag: null }, DELIVERY)))).toBe(false);
  });
  test("the service worker parser round-trips it, including the delivery id and new categories", () => {
    const n = notificationFromPush(() => JSON.parse(JSON.stringify(buildPushPayload(dispatch, DELIVERY))), "https://skinlabs.co.za");
    expect(n.deliveryId).toBe(DELIVERY);
    expect(n.category).toBe("report_ready");
    expect(n.url).toBe("/dashboard?tab=analysis");
  });
  test("a forged non-uuid delivery id is dropped by the worker", () => {
    expect(notificationFromPush(() => ({ title: "x", body: "y", d: "../../etc" })).deliveryId).toBeNull();
  });
  test("urgency: low for promotional/briefing/podcast/price alerts, normal otherwise", () => {
    for (const c of ["promotional", "briefing", "podcast_episode", "price_alert"]) expect(urgencyFor(c)).toBe("low");
    for (const c of ["account_update", "service", "report_ready", "routine_reminder", "skin_weather", "journal_reminder"]) expect(urgencyFor(c)).toBe("normal");
  });
});

describe("gone vs failed classification", () => {
  test("success", () => expect(classifyDelivery(undefined)).toEqual({ status: "sent", httpStatus: null, error: null }));
  test("404 and 410 are gone", () => {
    expect(classifyDelivery({ statusCode: 410 }).status).toBe("gone");
    expect(classifyDelivery({ statusCode: 404 }).status).toBe("gone");
  });
  test("other HTTP errors are failed and keep the status", () => {
    for (const code of [400, 401, 403, 413, 429, 500, 503]) {
      expect(classifyDelivery({ statusCode: code })).toEqual({ status: "failed", httpStatus: code, error: `http_${code}` });
    }
  });
  test("network errors are failed with a short token, never the message (which can contain the endpoint)", () => {
    const out = classifyDelivery(Object.assign(new Error("connect ETIMEDOUT https://fcm.googleapis.com/fcm/send/SECRET"), { code: "ETIMEDOUT" }));
    expect(out).toEqual({ status: "failed", httpStatus: null, error: "ETIMEDOUT" });
    expect(JSON.stringify(out)).not.toContain("SECRET");
  });
  test("subscription follow-up", () => {
    expect(subscriptionActionFor(classifyDelivery(undefined), 3)).toEqual({ kind: "touch" });
    expect(subscriptionActionFor(classifyDelivery({ statusCode: 410 }), 0)).toEqual({ kind: "delete" });
    expect(subscriptionActionFor(classifyDelivery({ statusCode: 500 }), 1)).toEqual({ kind: "fail", failureCount: 2, isActive: true });
    expect(subscriptionActionFor(classifyDelivery({ statusCode: 500 }), MAX_CONSECUTIVE_FAILURES - 1)).toEqual({
      kind: "fail",
      failureCount: MAX_CONSECUTIVE_FAILURES,
      isActive: false,
    });
  });
  test("totals per dispatch", () => {
    const totals = summariseOutcomes([classifyDelivery(undefined), classifyDelivery({ statusCode: 410 }), classifyDelivery({ statusCode: 500 })]);
    expect(totals).toEqual({ sent: 1, failed: 2, error: "http_410,http_500" });
    expect(summariseOutcomes([])).toEqual({ sent: 0, failed: 0, error: null });
  });
});

describe("auth matrix", () => {
  const none = { cronSecretMatches: false, bearerIsServiceRole: false, isAdminMember: false };
  test("no credentials: refused", () => expect(authoriseDispatcher(none)).toBeNull());
  test("cron secret alone", () => expect(authoriseDispatcher({ ...none, cronSecretMatches: true })).toBe("cron"));
  test("service role alone", () => expect(authoriseDispatcher({ ...none, bearerIsServiceRole: true })).toBe("service"));
  test("admin member alone", () => expect(authoriseDispatcher({ ...none, isAdminMember: true })).toBe("admin"));
  test("a non-admin member is refused (isAdminMember false)", () => expect(authoriseDispatcher(none)).toBeNull());
  test("any one is enough; cron wins when several are present", () => {
    expect(authoriseDispatcher({ cronSecretMatches: true, bearerIsServiceRole: true, isAdminMember: true })).toBe("cron");
  });
});

describe("claim rounds", () => {
  test("continues only on a full batch, under 5 rounds and within the 40 s budget", () => {
    expect(shouldClaimAnotherRound(1, 100, 1_000)).toBe(true);
    expect(shouldClaimAnotherRound(1, 99, 1_000)).toBe(false);
    expect(shouldClaimAnotherRound(5, 100, 1_000)).toBe(false);
    expect(shouldClaimAnotherRound(2, 100, 40_000)).toBe(false);
  });
});

describe("push-track body", () => {
  test("accepts {d: uuid}", () => expect(parseTrackBody(JSON.stringify({ d: DELIVERY }))).toBe(DELIVERY));
  test("rejects malformed, non-uuid and non-object bodies", () => {
    for (const body of ["", "nope", "null", "[]", '{"d":"1"}', '{"d":123}', '{"x":1}', `{"d":"${DELIVERY}'; drop"}`]) expect(parseTrackBody(body)).toBeNull();
  });
  test("rejects bodies over 512 bytes even when valid JSON", () => {
    const big = JSON.stringify({ d: DELIVERY, pad: "x".repeat(MAX_TRACK_BODY_BYTES) });
    expect(parseTrackBody(big)).toBeNull();
  });
  test("uuid shape", () => {
    expect(isUuid(DELIVERY)).toBe(true);
    expect(isUuid("33333333-3333-4333-8333-33333333333")).toBe(false);
  });
});

describe("send pool", () => {
  test("never exceeds the pool size and returns results in input order", async () => {
    let active = 0;
    let peak = 0;
    const out = await runPool(Array.from({ length: 50 }, (_, i) => i), 20, async (i) => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 2));
      active--;
      return i * 2;
    });
    expect(peak).toBeLessThanOrEqual(20);
    expect(out).toEqual(Array.from({ length: 50 }, (_, i) => i * 2));
  });
  test("empty input", async () => expect(await runPool([], 20, async () => 1)).toEqual([]));
});
