// Paystack was removed in favour of PayFast and PayPal (2026-09-18). This stub only answers 410 so the retired
// endpoint can neither take a payment nor act on a webhook.
Deno.serve(() => new Response(JSON.stringify({ error: "gone", message: "Paystack is no longer supported." }), { status: 410, headers: { "Content-Type": "application/json" } }));
