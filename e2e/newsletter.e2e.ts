import { expect, test } from "@playwright/test";
import { mockSupabase } from "./support/mockSupabase";

/**
 * Weekly-digest double opt-in. Supabase is mocked (e2e/support/mockSupabase.ts);
 * the two newsletter RPCs are stubbed per test (later routes win).
 */
const TOKEN = "11111111-1111-4111-8111-111111111111";

test("the emailed link only confirms after the button is pressed", async ({ page, context }) => {
  await mockSupabase(context);
  const calls: string[] = [];
  await page.route(/rest\/v1\/rpc\/confirm_newsletter/, (r) => {
    calls.push(String(r.request().postData()));
    return r.fulfill({ json: "confirmed" });
  });

  await page.goto(`/newsletter/confirm?token=${TOKEN}`);
  await expect(page.getByRole("heading", { name: "Confirm your subscription" })).toBeVisible();
  // A mail scanner opening the link must not subscribe anyone.
  await page.waitForTimeout(500);
  expect(calls).toHaveLength(0);

  // The token is taken out of the address bar but still used for the confirmation.
  await expect.poll(() => new URL(page.url()).search).toBe("");
  await page.getByRole("button", { name: "Confirm my subscription" }).click();
  await expect(page.getByRole("heading", { name: "You're subscribed" })).toBeVisible();
  expect(calls).toHaveLength(1);
  expect(calls[0]).toContain(TOKEN);
});

test("an expired or malformed link explains itself and calls nothing", async ({ page, context }) => {
  await mockSupabase(context);
  let called = false;
  await page.route(/rest\/v1\/rpc\/confirm_newsletter/, (r) => {
    called = true;
    return r.fulfill({ json: "invalid" });
  });

  await page.goto("/newsletter/confirm?token=not-a-uuid");
  await page.getByRole("button", { name: "Confirm my subscription" }).click();
  await expect(page.getByRole("heading", { name: "This link isn't valid" })).toBeVisible();
  expect(called).toBe(false);

  await page.goto("/newsletter/confirm");
  await expect(page.getByRole("heading", { name: "This link isn't valid" })).toBeVisible();
});

test("signing up from a review asks for confirmation and never says 'subscribed'", async ({ page, context }) => {
  await mockSupabase(context);
  const bodies: Record<string, unknown>[] = [];
  await page.route(/rest\/v1\/rpc\/subscribe_newsletter/, (r) => {
    bodies.push(r.request().postDataJSON() as Record<string, unknown>);
    return r.fulfill({ json: true });
  });

  await page.goto("/reviews/sb-glow-glaze-serum");
  const form = page.getByRole("region", { name: "The SkinLabs weekly digest" });
  await form.scrollIntoViewIfNeeded();
  await expect(form).toContainText("You'll get a confirmation email first");

  await form.getByLabel("Email address").fill("Reader@Example.com");
  await form.getByRole("button", { name: "Subscribe" }).click();

  await expect(form.getByRole("status")).toContainText("Check your inbox");
  await expect(form).not.toContainText("You're subscribed");
  expect(bodies).toHaveLength(1);
  expect(bodies[0]).toMatchObject({ p_email: "reader@example.com", p_source: "review-end" });
});

test("a bad address is caught before anything is sent", async ({ page, context }) => {
  await mockSupabase(context);
  let called = false;
  await page.route(/rest\/v1\/rpc\/subscribe_newsletter/, (r) => {
    called = true;
    return r.fulfill({ json: true });
  });

  await page.goto("/reviews/sb-glow-glaze-serum");
  const form = page.getByRole("region", { name: "The SkinLabs weekly digest" });
  await form.getByLabel("Email address").fill("nope");
  await form.getByRole("button", { name: "Subscribe" }).click();
  await expect(form.getByRole("alert")).toContainText("doesn't look right");
  expect(called).toBe(false);
});
