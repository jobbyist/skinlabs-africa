import { expect, test, type Page } from "@playwright/test";
import { mockSupabase } from "./support/mockSupabase";

/**
 * Admin → Analysis Passes: issue passes to a member by email. The admin gate
 * (/api/admin-auth) and the admin RPCs are mocked; what's under test is the tab:
 * lookup, the confirm step, the exact payload sent, and idempotency ids.
 */

const MEMBER = { user_id: "11111111-1111-4111-8111-111111111111", email: "michael@skinlabs.co.za", full_name: "Michael", subscription_status: "free" };

async function openTab(page: Page, issued: Record<string, unknown>[]) {
  let balance = 0;
  await page.route("**/api/admin-auth", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ ok: true, tokenHash: null }) }),
  );
  await page.route("**/rest/v1/rpc/has_role*", (route) => route.fulfill({ json: true }));
  await page.route("**/rest/v1/rpc/admin_lookup_analysis_pass_account*", async (route) => {
    const { p_email } = route.request().postDataJSON() as { p_email: string };
    const known = p_email.trim().toLowerCase() === MEMBER.email;
    await route.fulfill({ json: known ? [{ ...MEMBER, pass_balance: balance }] : [] });
  });
  await page.route("**/rest/v1/rpc/admin_issue_analysis_passes*", async (route) => {
    const body = route.request().postDataJSON() as Record<string, unknown>;
    issued.push(body);
    balance += Number(body.p_credits);
    await route.fulfill({
      json: [{ user_id: MEMBER.user_id, email: MEMBER.email, credits_issued: body.p_credits, pass_balance: balance, already_issued: false }],
    });
  });
  await page.route("**/rest/v1/analysis_pass_grants*", (route) =>
    route.fulfill({
      json: issued.map((g, i) => ({ id: `g${i}`, created_at: "2026-10-03T09:00:00Z", target_email: MEMBER.email, credits: g.p_credits, note: g.p_note })),
    }),
  );
  await page.goto("/admin");
  // force: on phones the tab strip scrolls and re-lays out as the dashboard's counts load, which
  // keeps Playwright's "element is stable" check waiting. The click itself is a plain tab switch.
  await page.getByRole("tab", { name: "Analysis Passes" }).click({ force: true });
  await expect(page.getByLabel("Member email")).toBeVisible();
}

test("issues a pass by email: lookup, confirm, exact payload, balance, fresh request id each time", async ({ page, context }) => {
  await mockSupabase(context, { signedIn: true });
  const issued: Record<string, unknown>[] = [];
  await openTab(page, issued);

  await expect(page.getByText("No passes have been issued manually yet.")).toBeVisible();
  // Nothing can be issued before a lookup finds an account.
  await expect(page.getByRole("button", { name: /^Issue \d+ Analysis Pass/ })).toHaveCount(0);

  await page.getByLabel("Member email").fill("ghost@example.com");
  await page.getByRole("button", { name: "Look up account" }).click();
  await expect(page.getByText(/No account found for/)).toBeVisible();
  await expect(page.getByRole("button", { name: /^Issue \d+ Analysis Pass/ })).toHaveCount(0);

  await page.getByLabel("Member email").fill("  Michael@SkinLabs.co.za ");
  await page.getByRole("button", { name: "Look up account" }).click();
  await expect(page.getByText("michael@skinlabs.co.za").first()).toBeVisible();
  await expect(page.getByLabel("Passes held", { exact: false }).or(page.getByText("Passes held"))).toBeVisible();

  await page.getByLabel("Reason (kept in the audit trail)").fill("Advanced analysis pass for Michael");
  await page.getByRole("button", { name: "Issue 1 Analysis Pass" }).click();
  // Confirm step: nothing is sent until it's accepted.
  expect(issued).toHaveLength(0);
  await expect(page.getByRole("alertdialog").getByText(/at no charge/)).toBeVisible();
  await page.getByRole("alertdialog").getByRole("button", { name: "Issue", exact: true }).click();

  await expect(page.getByText("Issued 1 Analysis Pass to michael@skinlabs.co.za")).toBeVisible();
  expect(issued).toHaveLength(1);
  expect(issued[0]).toMatchObject({ p_email: "michael@skinlabs.co.za", p_credits: 1, p_note: "Advanced analysis pass for Michael" });
  expect(String(issued[0].p_request_id)).toMatch(/^[0-9a-f-]{36}$/);
  await expect(page.getByRole("cell", { name: "Advanced analysis pass for Michael" })).toBeVisible();

  // A second issue is a new grant with its own request id.
  await page.getByRole("button", { name: "Issue 1 Analysis Pass" }).click();
  await page.getByRole("alertdialog").getByRole("button", { name: "Issue", exact: true }).click();
  await expect.poll(() => issued.length).toBe(2);
  expect(issued[1].p_request_id).not.toBe(issued[0].p_request_id);
  expect(issued[1].p_note).toBe("Manual issue"); // note resets to the default after each grant
});

test("changing the email clears the loaded account so a stale lookup can't be issued against", async ({ page, context }) => {
  await mockSupabase(context, { signedIn: true });
  await openTab(page, []);
  await page.getByLabel("Member email").fill("michael@skinlabs.co.za");
  await page.getByRole("button", { name: "Look up account" }).click();
  await expect(page.getByRole("button", { name: "Issue 1 Analysis Pass" })).toBeVisible();
  await page.getByLabel("Member email").fill("someone.else@example.com");
  await expect(page.getByRole("button", { name: /^Issue \d+ Analysis Pass/ })).toHaveCount(0);
});

test("a blank reason blocks issuing", async ({ page, context }) => {
  await mockSupabase(context, { signedIn: true });
  await openTab(page, []);
  await page.getByLabel("Member email").fill("michael@skinlabs.co.za");
  await page.getByRole("button", { name: "Look up account" }).click();
  await page.getByLabel("Reason (kept in the audit trail)").fill("   ");
  await expect(page.getByRole("button", { name: "Issue 1 Analysis Pass" })).toBeDisabled();
});
