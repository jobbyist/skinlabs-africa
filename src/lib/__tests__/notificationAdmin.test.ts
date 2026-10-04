import { describe, expect, test } from "bun:test";
import {
  audienceToForm,
  buildAudience,
  canCancelCampaign,
  confirmArg,
  confirmationMatches,
  describeAudience,
  emptyAudience,
  isoToSastInput,
  needsTypedConfirmation,
  parseAudiencePreview,
  parseConfirmationRequired,
  previewText,
  rpcMessage,
  sastToIso,
  validateDraft,
  type CampaignDraft,
} from "../notificationAdmin";

const draft = (over: Partial<CampaignDraft> = {}): CampaignDraft => ({ name: "Spring", category: "briefing", title: "Today’s briefing", body: "Read it now.", url: "/briefings", channels: ["inbox", "push"], ...over });

describe("audience", () => {
  test("nothing set = every active member ({}), and only the filters set are sent", () => {
    expect(buildAudience(emptyAudience())).toEqual({});
    expect(
      buildAudience({ ...emptyAudience(), tiers: ["free"], pushEnabled: "yes", installed: "no", activeWithinDays: "30", cities: ["cape-town"], signedUpAfter: "2026-10-01" }),
    ).toEqual({ tiers: ["free"], push_enabled: true, installed: false, active_within_days: 30, cities: ["cape-town"], signed_up_after: "2026-09-30T22:00:00.000Z" });
  });
  test("junk numbers are dropped, never sent", () => {
    expect(buildAudience({ ...emptyAudience(), activeWithinDays: "abc", inactiveForDays: "-3", trialEndsWithinDays: "0" })).toEqual({});
  });
  test("round trip form -> json -> form", () => {
    const form = { ...emptyAudience(), tiers: ["insider", "vip"], platforms: ["ios"], pushEnabled: "no" as const, foundingMember: "yes" as const, inactiveForDays: "14", signedUpBefore: "2026-12-31" };
    expect(audienceToForm(buildAudience(form))).toEqual(form);
  });
  test("describes it in words", () => {
    expect(describeAudience({})).toBe("Every active member");
    expect(describeAudience({ tiers: ["free"], push_enabled: true })).toBe("plan: free · push on");
  });
});

describe("campaign validation", () => {
  test("a good draft has no problems; limits are 80 and 240", () => {
    expect(validateDraft(draft())).toEqual([]);
    expect(validateDraft(draft({ title: "x".repeat(81) }))[0]).toMatch(/limited to 80/);
    expect(validateDraft(draft({ body: "x".repeat(241) }))[0]).toMatch(/limited to 240/);
    expect(validateDraft(draft({ title: "x".repeat(80), body: "y".repeat(240) }))).toEqual([]);
  });
  test("empty fields, bad link, no channel", () => {
    expect(validateDraft(draft({ name: " ", title: "", body: "" })).length).toBe(3);
    expect(validateDraft(draft({ url: "https://evil.example" }))[0]).toMatch(/inside SkinLabs/);
    expect(validateDraft(draft({ url: "//evil.example" }))[0]).toMatch(/inside SkinLabs/);
    expect(validateDraft(draft({ channels: [] }))[0]).toMatch(/channel/);
    expect(validateDraft(draft({ category: "nope" }))[0]).toMatch(/category/);
  });
});

describe("bulk confirmation", () => {
  test("above 50 recipients the audience size must be typed", () => {
    expect(needsTypedConfirmation(50)).toBe(false);
    expect(needsTypedConfirmation(51)).toBe(true);
    expect(confirmArg(50)).toBeUndefined();
    expect(confirmArg(240)).toBe(240);
    expect(confirmationMatches(" 240 ", 240)).toBe(true);
    expect(confirmationMatches("24", 240)).toBe(false);
  });
  test("reads the server's confirmation_required:N", () => {
    expect(parseConfirmationRequired("confirmation_required:312")).toBe(312);
    expect(parseConfirmationRequired("Admin access required")).toBeNull();
  });
});

describe("errors are shown verbatim", () => {
  test("rpcMessage", () => {
    expect(rpcMessage({ message: "Admin access required", code: "42501" })).toBe("Admin access required");
    expect(rpcMessage(new Error("Schedule time must be in the future"))).toBe("Schedule time must be in the future");
    expect(rpcMessage("plain")).toBe("plain");
    expect(rpcMessage(undefined)).toBe("Request failed");
  });
});

describe("South African time", () => {
  test("a typed SAST time converts to UTC and back", () => {
    expect(sastToIso("2026-10-05T09:00")).toBe("2026-10-05T07:00:00.000Z");
    expect(isoToSastInput("2026-10-05T07:00:00.000Z")).toBe("2026-10-05T09:00");
    expect(sastToIso("")).toBeNull();
    expect(sastToIso("tomorrow")).toBeNull();
  });
});

describe("previews and results", () => {
  test("OS previews clip long copy and say so", () => {
    const long = previewText("ios", "T".repeat(80), "B".repeat(240));
    expect(long.truncated).toBe(true);
    expect(long.title.length).toBeLessThanOrEqual(40);
    expect(previewText("android", "Short", "Short body").truncated).toBe(false);
  });
  test("audience preview parsing", () => {
    expect(parseAudiencePreview(null)).toBeNull();
    expect(parseAudiencePreview({ members: 3, inbox_reachable: 3, push_reachable: 1, opted_out: 2, by_platform: [{ label: "ios", count: 1 }] })).toEqual({ members: 3, inbox_reachable: 3, push_reachable: 1, opted_out: 2, by_platform: [{ label: "ios", count: 1 }] });
  });
  test("which campaigns can be cancelled", () => {
    expect(canCancelCampaign({ status: "draft" })).toBe(true);
    expect(canCancelCampaign({ status: "scheduled" })).toBe(true);
    expect(canCancelCampaign({ status: "sent", stats: { pending: 0 } })).toBe(false);
    expect(canCancelCampaign({ status: "sent", stats: { pending: 4 } })).toBe(true);
    expect(canCancelCampaign({ status: "cancelled" })).toBe(false);
  });
});
