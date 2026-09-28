import { describe, expect, test } from "bun:test";
import {
  addBillingPeriod,
  apiSignature,
  formParamString,
  formSignature,
  itnParamString,
  itnSignature,
  payfastFrequency,
  payfastHost,
  payfastTimestamp,
  phpUrlencode,
  safeEqual,
  sastDate,
  sastMidnightIso,
} from "../payfast";

// Expected hashes computed independently in Python (quote_plus + ~ → %7E, hashlib.md5).
const PASSPHRASE = "jt7NOE43FZPn";

describe("phpUrlencode", () => {
  test("matches PHP urlencode", () => {
    expect(phpUrlencode("a b")).toBe("a+b");
    expect(phpUrlencode("O'Neil (x)*!~")).toBe("O%27Neil+%28x%29%2A%21%7E");
    expect(phpUrlencode("https://a.co/?x=1&y=2")).toBe("https%3A%2F%2Fa.co%2F%3Fx%3D1%26y%3D2");
  });
});

describe("form signature", () => {
  const form = {
    // Deliberately out of order: signing must follow PayFast's documented order.
    cycles: "0",
    frequency: "3",
    recurring_amount: "79.00",
    billing_date: "2026-11-01",
    subscription_type: "1",
    item_name: "Glow Insider (monthly) ~ test",
    amount: "0.00",
    m_payment_id: "sub_1",
    email_address: "t@example.com",
    name_first: "Thandi O'Neil",
    notify_url: "https://x.supabase.co/functions/v1/payfast-payment?notify=true",
    return_url: "https://skinlabs.co.za/dashboard?tab=billing&keep=done",
    merchant_key: "46f0cd694581a",
    merchant_id: "10000100",
    cancel_url: "",
    signature: "ignored",
    not_a_payfast_field: "ignored",
  };

  test("uses the documented field order, skips empty and unknown fields, appends the passphrase", () => {
    const s = formParamString(form, PASSPHRASE);
    expect(s.startsWith("merchant_id=10000100&merchant_key=46f0cd694581a&return_url=")).toBe(true);
    expect(s).not.toContain("cancel_url");
    expect(s).not.toContain("signature");
    expect(s).not.toContain("not_a_payfast_field");
    expect(s.endsWith("&cycles=0&passphrase=jt7NOE43FZPn")).toBe(true);
  });

  test("matches an independently computed signature", () => {
    expect(formSignature(form, PASSPHRASE)).toBe("2b78ffaa6c0094483b3e743f12ad5e64");
  });
});

describe("ITN signature", () => {
  const raw =
    "m_payment_id=sub_1&pf_payment_id=123&payment_status=COMPLETE&item_name=Glow+Insider&amount_gross=0.00&name_last=&custom_str1=%7B%22a%22%3A1%7D&token=abc&signature=zzz";

  test("keeps the received order and empty fields, drops the signature", () => {
    expect(itnParamString(raw)).toBe(
      "m_payment_id=sub_1&pf_payment_id=123&payment_status=COMPLETE&item_name=Glow+Insider&amount_gross=0.00&name_last=&custom_str1=%7B%22a%22%3A1%7D&token=abc",
    );
  });

  test("matches an independently computed signature", () => {
    expect(itnSignature(raw, PASSPHRASE)).toBe("e01492df38a0c14f8a13e5c3abe97037");
  });
});

describe("API signature", () => {
  test("sorts headers + passphrase alphabetically", () => {
    expect(
      apiSignature({ "merchant-id": "10000100", version: "v1", timestamp: "2026-09-28T08:00:00+0000" }, PASSPHRASE),
    ).toBe("1949a2c2a971ac23b58a6e8beadac379");
  });

  test("timestamp format matches the PHP SDK", () => {
    expect(payfastTimestamp(new Date("2026-09-28T08:00:00.123Z"))).toBe("2026-09-28T08:00:00+0000");
  });
});

describe("billing dates", () => {
  test("the promo trial end (22:00 UTC) is 1 November in SAST", () => {
    expect(sastDate("2026-10-31T22:00:00Z")).toBe("2026-11-01");
    expect(sastMidnightIso("2026-11-01")).toBe("2026-10-31T22:00:00.000Z");
  });

  test("adds a period with month-end clamping", () => {
    expect(addBillingPeriod("2026-11-01", "monthly")).toBe("2026-12-01");
    expect(addBillingPeriod("2027-01-31", "monthly")).toBe("2027-02-28");
    expect(addBillingPeriod("2026-11-01", "annual")).toBe("2027-11-01");
  });

  test("frequency codes and hosts", () => {
    expect(payfastFrequency("monthly")).toBe("3");
    expect(payfastFrequency("annual")).toBe("6");
    expect(payfastHost(undefined)).toBe("sandbox.payfast.co.za");
    expect(payfastHost("live")).toBe("www.payfast.co.za");
  });
});

describe("hardening", () => {
  test("safeEqual is false for different lengths and true for equal strings", () => {
    expect(safeEqual("abc", "abcd")).toBe(false);
    expect(safeEqual("abcd", "abcd")).toBe(true);
    expect(safeEqual("", "")).toBe(true);
  });
  test("addBillingPeriod rejects malformed dates", () => {
    expect(() => addBillingPeriod("2026-1-5", "monthly")).toThrow();
  });
});
