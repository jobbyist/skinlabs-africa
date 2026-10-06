import { describe, expect, test } from "bun:test";
import {
  buildTrackBody,
  isValidIp,
  pageKeyForUrl,
  isTikTokStandardEvent,
  sha256Hex,
  validateIncomingEvent,
} from "../../../supabase/functions/_shared/tiktok/eventsApi";
import { contentForPath, newEventId, parseTtclid, tiktokEventFor } from "../tiktok/events";

const base = { event: "StartTrial", eventId: "sl_12345678-abcd", consent: true };

type Row = { user: Record<string, string | undefined>; [k: string]: unknown };

describe("validateIncomingEvent", () => {
  test("accepts a consented, whitelisted event", () => {
    const r = validateIncomingEvent({ ...base, ttclid: "abc_123", ttp: "ttp.value-1", value: 79, currency: "ZAR" });
    expect(r.ok).toBe(true);
  });
  test("refuses without explicit consent", () => {
    expect(validateIncomingEvent({ ...base, consent: false })).toEqual({ ok: false, reason: "no_consent" });
    expect(validateIncomingEvent({ event: "StartTrial", eventId: base.eventId })).toEqual({ ok: false, reason: "no_consent" });
  });
  test("refuses events outside the whitelist", () => {
    expect(validateIncomingEvent({ ...base, event: "PlaceAnOrder" })).toEqual({ ok: false, reason: "unsupported_event" });
    expect(isTikTokStandardEvent("PageView")).toBe(false);
  });
  test("refuses malformed ids and drops malformed tokens/currency", () => {
    expect(validateIncomingEvent({ ...base, eventId: "x" })).toEqual({ ok: false, reason: "invalid_event_id" });
    const r = validateIncomingEvent({ ...base, ttclid: "bad value!", currency: "rand", value: -5 });
    expect(r.ok && r.event.ttclid).toBeFalsy();
    expect(r.ok && r.event.currency).toBeUndefined();
    expect(r.ok && r.event.value).toBeUndefined();
  });
  test("non-objects are rejected", () => {
    expect(validateIncomingEvent(null)).toEqual({ ok: false, reason: "invalid_body" });
    expect(validateIncomingEvent("x")).toEqual({ ok: false, reason: "invalid_body" });
  });
});

describe("buildTrackBody", () => {
  test("sha256 matches a known vector and normalises case/whitespace", async () => {
    expect(await sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
    expect(await sha256Hex("  ABC ")).toBe(await sha256Hex("abc"));
  });

  test("hashes email + id, strips query strings, keeps the shared event_id", async () => {
    const parsed = validateIncomingEvent({
      ...base,
      url: "https://skinlabs.co.za/reset-password?token=SECRET&ttclid=x",
      referrer: "https://www.tiktok.com/foo?a=1",
      value: 79,
      currency: "ZAR",
      eventTime: 1_000,
    });
    if (!parsed.ok) throw new Error("should validate");
    const body = await buildTrackBody({
      pixelCode: "PIXEL",
      event: parsed.event,
      context: { email: " Person@Example.com ", userId: "u-1", ip: "1.2.3.4", userAgent: "UA" },
      testEventCode: "TEST1",
      nowSeconds: 1_100,
    });
    expect(body.event_source).toBe("web");
    expect(body.event_source_id).toBe("PIXEL");
    expect(body.test_event_code).toBe("TEST1");
    const d = body.data[0] as Row;
    expect(d.event).toBe("StartTrial");
    expect(d.event_id).toBe(base.eventId);
    expect(d.event_time).toBe(1_000);
    expect(d.user.email).toBe(await sha256Hex("person@example.com"));
    expect(d.user.external_id).toBe(await sha256Hex("u-1"));
    expect(JSON.stringify(body)).not.toContain("Person@Example.com");
    expect(JSON.stringify(body)).not.toContain("SECRET");
    expect(d.page.url).toBe("https://skinlabs.co.za/reset-password");
    expect(d.properties).toEqual({ value: 79, currency: "ZAR" });
  });

  test("anonymous events carry no email, and stale/future times fall back to now", async () => {
    const parsed = validateIncomingEvent({ ...base, eventTime: 5 });
    if (!parsed.ok) throw new Error("should validate");
    const body = await buildTrackBody({ pixelCode: "P", event: parsed.event, context: {}, nowSeconds: 10 * 86400 });
    const d = body.data[0] as Row;
    expect(d.user.email).toBeUndefined();
    expect(d.event_time).toBe(10 * 86400);
    expect(body.test_event_code).toBeUndefined();
  });
});

describe("client event mapping", () => {
  test("maps funnel moments and ignores everything else", () => {
    expect(tiktokEventFor("signup_completed")).toBe("CompleteRegistration");
    expect(tiktokEventFor("trial_started")).toBe("StartTrial");
    expect(tiktokEventFor("checkout_started")).toBe("InitiateCheckout");
    expect(tiktokEventFor("keep_membership_completed")).toBe("Subscribe");
    expect(tiktokEventFor("starter_question_answered")).toBeNull();
    expect(tiktokEventFor("analysis_generated")).toBeNull();
    expect(tiktokEventFor("admin_login_success")).toBeNull();
  });
  test("every mapped event is one the server accepts", () => {
    for (const e of ["pricing_view", "marketplace_add_to_cart", "signup_completed", "trial_started", "checkout_started", "checkout_completed", "subscription_started", "newsletter_confirmed"]) {
      expect(isTikTokStandardEvent(tiktokEventFor(e))).toBe(true);
    }
  });
  test("event ids are unique and valid; ttclid parsing is strict", () => {
    const a = newEventId();
    expect(a).not.toBe(newEventId());
    expect(validateIncomingEvent({ ...base, eventId: a }).ok).toBe(true);
    expect(parseTtclid("?ttclid=E.C.P.abc-1")).toBe("E.C.P.abc-1");
    expect(parseTtclid("?ttclid=<script>")).toBeNull();
    expect(parseTtclid("")).toBeNull();
  });
});

describe("consent guard", () => {
  test("the pixel is never hard-coded in index.html (it loads only after advertising consent)", async () => {
    const html = await Bun.file(new URL("../../../index.html", import.meta.url)).text();
    expect(html).not.toContain("analytics.tiktok.com");
    expect(html).not.toContain("ttq.load");
  });
});

describe("isValidIp", () => {
  test("accepts IPv4 and IPv6 literals", () => {
    for (const ip of ["1.2.3.4", "255.255.255.255", "::1", "2001:db8::1", "2001:0db8:85a3:0000:0000:8a2e:0370:7334"]) {
      expect(isValidIp(ip)).toBe(true);
    }
  });
  test("rejects anything else", () => {
    for (const ip of ["", "256.1.1.1", "1.2.3", "01.2.3.4", "abc", "1.2.3.4, 5.6.7.8", "<script>", "12345::1", "1:2:3:4:5:6:7", "::1::2"]) {
      expect(isValidIp(ip)).toBe(false);
    }
  });
  test("an invalid ip is dropped from the payload", async () => {
    const parsed = validateIncomingEvent({ event: "StartTrial", eventId: "sl_12345678-abcd", consent: true });
    if (!parsed.ok) throw new Error("should validate");
    const body = await buildTrackBody({ pixelCode: "P", event: parsed.event, context: { ip: "evil\nip" } });
    expect((body.data[0] as Row).user.ip).toBeUndefined();
  });
});

describe("key event pages", () => {
  test("home, SKYNN AI and pricing describe themselves; private pages are never reported", () => {
    expect(contentForPath("/")?.content_id).toBe("home");
    expect(contentForPath("/skynn-ai")?.content_name).toBe("Basic AI Skin Analysis");
    expect(contentForPath("/skynn-ai/advanced")?.content_id).toBe("skynn-ai-advanced");
    expect(contentForPath("/pricing/")?.content_id).toBe("membership-plans");
    for (const p of ["/dashboard", "/admin", "/welcome", "/reset-password", "/privacy-policy", "/newsletter/confirm"]) {
      expect(contentForPath(p)).toBeNull();
    }
  });
  test("slug pages use the public slug only and reject odd paths", () => {
    expect(contentForPath("/reviews/geve-earthmoss-serum")).toEqual({
      content_id: "review:geve-earthmoss-serum",
      content_type: "product",
      content_name: "geve earthmoss serum",
    });
    expect(contentForPath("/reviews/a/b")).toBeNull();
    expect(contentForPath("/reviews/<x>")).toBeNull();
  });
  test("new event mappings and contents reach the server payload", async () => {
    expect(tiktokEventFor("keep_membership_gateway_selected")).toBe("AddPaymentInfo");
    expect(tiktokEventFor("checkout_completed")).toBe("Purchase");
    expect(tiktokEventFor("site_search_result_clicked")).toBe("Search");
    const parsed = validateIncomingEvent({
      event: "ViewContent",
      eventId: "sl_12345678-abcd",
      consent: true,
      contentId: "home",
      contentType: "product_group",
      contentName: "Home",
    });
    if (!parsed.ok) throw new Error("should validate");
    const body = await buildTrackBody({ pixelCode: "P", event: parsed.event, context: {} });
    expect((body.data[0] as { properties: Record<string, unknown> }).properties.contents).toEqual([
      { content_id: "home", content_type: "product_group", content_name: "Home" },
    ]);
  });
});

describe("pageKeyForUrl", () => {
  test("classifies the tracked pages and drops query strings", () => {
    expect(pageKeyForUrl("https://skinlabs.co.za/?ttclid=x")).toEqual({ pageKey: "home", path: "/" });
    expect(pageKeyForUrl("https://skinlabs.co.za/skynn-ai/")).toEqual({ pageKey: "skynn-ai", path: "/skynn-ai" });
    expect(pageKeyForUrl("https://skinlabs.co.za/skynn-ai/advanced?x=1").pageKey).toBe("skynn-ai-advanced");
    expect(pageKeyForUrl("https://skinlabs.co.za/giveaways/october-2026?ttclid=x&utm_source=tiktok")).toEqual({ pageKey: "giveaway", path: "/giveaways/october-2026" });
    expect(pageKeyForUrl("https://skinlabs.co.za/pricing")).toEqual({ pageKey: "other", path: "/pricing" });
    expect(pageKeyForUrl("not a url")).toEqual({ pageKey: "other", path: null });
    expect(pageKeyForUrl(undefined)).toEqual({ pageKey: "other", path: null });
  });
});

describe("ClickButton (giveaway CTAs)", () => {
  test("is a whitelisted event and builds a contents-only payload with a shared event id", async () => {
    const parsed = validateIncomingEvent({
      consent: true, event: "ClickButton", eventId: "sl_abcdef123456", url: "https://skinlabs.co.za/giveaways/october-2026?ttclid=abc&utm_source=tiktok",
      contentId: "giveaway-october-2026", contentType: "product", contentName: "October 2026 Skin Story Giveaway",
    });
    expect(parsed.ok).toBe(true);
    if (!parsed.ok) return;
    const body = await buildTrackBody({ pixelCode: "PIX", event: parsed.event, context: {} });
    const row = body.data[0] as { event: string; event_id: string; properties: Record<string, unknown>; page: Record<string, string> };
    expect(row.event).toBe("ClickButton");
    expect(row.event_id).toBe("sl_abcdef123456");
    expect(JSON.stringify(row.properties)).toBe(JSON.stringify({ contents: [{ content_id: "giveaway-october-2026", content_type: "product", content_name: "October 2026 Skin Story Giveaway" }] }));
    expect(row.page.url).toBe("https://skinlabs.co.za/giveaways/october-2026");
  });
});
