// Temporary edge function backing the /quote-ss-beauty client quote form
// (Siphokazi / SS Beauty). Validates the submission, computes an indicative
// ZAR pricing estimate, generates a branded PDF quotation, saves the
// submission for the record, and emails the submission + PDF to Michael for
// review before any proposal goes back to the client.
//
// Delete this function (and quote_ss_beauty_requests, the /quote-ss-beauty
// route/components) once the quote has been handled — see CLAUDE.md.
//
// Requires the RESEND_API_KEY project secret (not set as of this function's
// creation — `supabase secrets set RESEND_API_KEY=<key>`) and a verified
// sending domain in Resend for `quotes@skinlabs.co.za` (no domain is
// verified in this project's Resend account yet). Until both are done, the
// submission is still safely recorded in quote_ss_beauty_requests, but no
// email is sent — email_sent/email_error on the row reflect what happened.
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { jsPDF } from "npm:jspdf@4.2.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const NOTIFY_EMAIL = "michael@skinlabs.co.za";
const FROM_EMAIL = "SkinLabs Business Suite <quotes@skinlabs.co.za>";

// ---------------------------------------------------------------------------
// Pricing engine — mirrored from src/lib/quoteSsBeautyPricing.ts. Different
// runtimes (Deno vs Vite/React) so this is a deliberate duplicate, not an
// import. Keep the two in sync if pricing changes.
// ---------------------------------------------------------------------------

type ProductKey = "hair_growth_oil" | "hair_food" | "leave_in_conditioner";
type FormulationApproach = "stock_base" | "full_custom";

const PRODUCT_LABELS: Record<ProductKey, string> = {
  hair_growth_oil: "Hair Growth Oil",
  hair_food: "Hair Food",
  leave_in_conditioner: "Leave-In Conditioner",
};

const PRODUCT_FILL_SIZES: Record<ProductKey, string> = {
  hair_growth_oil: "100ml",
  hair_food: "200ml",
  leave_in_conditioner: "200ml",
};

const MOQ_TIERS = [
  { min: 10, max: 49, label: "10–49 units/SKU" },
  { min: 50, max: 99, label: "50–99 units/SKU" },
  { min: 100, max: 249, label: "100–249 units/SKU" },
  { min: 250, max: 499, label: "250–499 units/SKU" },
  { min: 500, max: null as number | null, label: "500+ units/SKU" },
];

function tierIndexForQuantity(qty: number): number {
  const idx = MOQ_TIERS.findIndex((t) => qty >= t.min && (t.max === null || qty <= t.max));
  return idx === -1 ? 0 : idx;
}

const STOCK_BASE_UNIT_PRICE: Record<ProductKey, number[]> = {
  hair_growth_oil: [58, 49, 42, 36, 31],
  hair_food: [72, 61, 52, 45, 39],
  leave_in_conditioner: [65, 55, 47, 41, 35],
};

const CUSTOM_UNIT_PREMIUM = 0.35;

const FEES = {
  stockBaseCustomizationPerSku: 1200,
  customFormulationDevPerSku: 4500,
  labelDesignPerSku: 1800,
  compliancePerSku: 950,
  packagingSourcingPerSku: 850,
  clientPackagingInspectionPerSku: 450,
  brandIdentityFlat: 6500,
};

const VAT_RATE = 0.15;

interface ProductSelection {
  product: ProductKey;
  quantity: number;
  formulationApproach: FormulationApproach;
}

interface QuoteInputs {
  products: ProductSelection[];
  packagingRoute: "turnkey" | "client_supplied";
  needsLogo: boolean;
  needsLabelDesign: boolean;
  needsComplianceHelp: boolean;
}

function computeQuoteEstimate(inputs: QuoteInputs) {
  const lines = inputs.products.map((sel) => {
    const qty = Math.max(10, Math.round(sel.quantity) || 10);
    const tierIdx = tierIndexForQuantity(qty);
    const baseUnit = STOCK_BASE_UNIT_PRICE[sel.product][tierIdx];
    const unitPrice =
      sel.formulationApproach === "full_custom" ? Math.round(baseUnit * (1 + CUSTOM_UNIT_PREMIUM)) : baseUnit;
    const unitSubtotal = unitPrice * qty;
    const developmentFee =
      sel.formulationApproach === "full_custom" ? FEES.customFormulationDevPerSku : FEES.stockBaseCustomizationPerSku;
    const labelFee = inputs.needsLabelDesign ? FEES.labelDesignPerSku : 0;
    const complianceFee = inputs.needsComplianceHelp ? FEES.compliancePerSku : 0;
    const packagingFee =
      inputs.packagingRoute === "turnkey" ? FEES.packagingSourcingPerSku : FEES.clientPackagingInspectionPerSku;
    const lineTotal = unitSubtotal + developmentFee + labelFee + complianceFee + packagingFee;
    return {
      product: sel.product,
      label: PRODUCT_LABELS[sel.product],
      fillSize: PRODUCT_FILL_SIZES[sel.product],
      quantity: qty,
      moqTierLabel: MOQ_TIERS[tierIdx].label,
      formulationApproach: sel.formulationApproach,
      unitPrice,
      unitSubtotal,
      developmentFee,
      labelFee,
      complianceFee,
      packagingFee,
      lineTotal,
    };
  });
  const brandIdentityFee = inputs.needsLogo ? FEES.brandIdentityFlat : 0;
  const subtotal = lines.reduce((sum, l) => sum + l.lineTotal, 0) + brandIdentityFee;
  const vat = Math.round(subtotal * VAT_RATE);
  const total = subtotal + vat;
  return { lines, brandIdentityFee, subtotal, vat, total };
}

function formatZar(amount: number): string {
  return new Intl.NumberFormat("en-ZA", { style: "currency", currency: "ZAR", maximumFractionDigits: 0 }).format(
    amount,
  );
}

// ---------------------------------------------------------------------------
// Request payload validation
// ---------------------------------------------------------------------------

const PRODUCT_KEYS: ProductKey[] = ["hair_growth_oil", "hair_food", "leave_in_conditioner"];

interface QuoteSubmission {
  fullName: string;
  businessName?: string;
  email: string;
  phone?: string;
  products: ProductSelection[];
  hairConcerns: string[];
  formulationNotes?: string;
  hasBranding: string;
  needsLogo: boolean;
  needsLabelDesign: boolean;
  needsComplianceHelp: boolean;
  packagingRoute: "turnkey" | "client_supplied";
  whiteLabelInterest: string;
  timeline: string;
  budgetRange?: string;
  additionalNotes?: string;
  website?: string;
}

function validate(body: unknown): { ok: true; data: QuoteSubmission } | { ok: false; error: string } {
  if (typeof body !== "object" || body === null) return { ok: false, error: "Invalid payload" };
  const b = body as Record<string, unknown>;

  if (typeof b.website === "string" && b.website.trim() !== "") {
    // Honeypot tripped — pretend success without doing anything.
    return { ok: false, error: "spam" };
  }
  if (typeof b.fullName !== "string" || b.fullName.trim().length < 2 || b.fullName.length > 200) {
    return { ok: false, error: "Missing or invalid full name" };
  }
  if (typeof b.email !== "string" || !/\S+@\S+\.\S+/.test(b.email) || b.email.length > 200) {
    return { ok: false, error: "Missing or invalid email" };
  }
  if (!Array.isArray(b.products) || b.products.length === 0 || b.products.length > PRODUCT_KEYS.length) {
    return { ok: false, error: "Select at least one product" };
  }
  const products: ProductSelection[] = [];
  for (const raw of b.products) {
    if (typeof raw !== "object" || raw === null) return { ok: false, error: "Invalid product selection" };
    const r = raw as Record<string, unknown>;
    if (!PRODUCT_KEYS.includes(r.product as ProductKey)) return { ok: false, error: "Invalid product" };
    const quantity = Number(r.quantity);
    if (!Number.isFinite(quantity) || quantity < 10 || quantity > 100000) {
      return { ok: false, error: "Invalid quantity" };
    }
    const formulationApproach = r.formulationApproach === "full_custom" ? "full_custom" : "stock_base";
    products.push({ product: r.product as ProductKey, quantity, formulationApproach });
  }
  if (b.packagingRoute !== "turnkey" && b.packagingRoute !== "client_supplied") {
    return { ok: false, error: "Invalid packaging route" };
  }

  return {
    ok: true,
    data: {
      fullName: b.fullName.trim().slice(0, 200),
      businessName: typeof b.businessName === "string" ? b.businessName.trim().slice(0, 200) : undefined,
      email: b.email.trim().slice(0, 200),
      phone: typeof b.phone === "string" ? b.phone.trim().slice(0, 60) : undefined,
      products,
      hairConcerns: Array.isArray(b.hairConcerns) ? (b.hairConcerns as unknown[]).filter((x) => typeof x === "string").slice(0, 10) as string[] : [],
      formulationNotes: typeof b.formulationNotes === "string" ? b.formulationNotes.slice(0, 2000) : undefined,
      hasBranding: typeof b.hasBranding === "string" ? b.hasBranding.slice(0, 40) : "",
      needsLogo: !!b.needsLogo,
      needsLabelDesign: !!b.needsLabelDesign,
      needsComplianceHelp: !!b.needsComplianceHelp,
      packagingRoute: b.packagingRoute,
      whiteLabelInterest: typeof b.whiteLabelInterest === "string" ? b.whiteLabelInterest.slice(0, 40) : "",
      timeline: typeof b.timeline === "string" ? b.timeline.slice(0, 40) : "",
      budgetRange: typeof b.budgetRange === "string" ? b.budgetRange.slice(0, 60) : undefined,
      additionalNotes: typeof b.additionalNotes === "string" ? b.additionalNotes.slice(0, 2000) : undefined,
    },
  };
}

// ---------------------------------------------------------------------------
// PDF generation
// ---------------------------------------------------------------------------

const BRAND = {
  primary: [30, 41, 59] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  bg: [248, 250, 252] as [number, number, number],
};

function buildQuotePdf(
  submission: QuoteSubmission,
  estimate: ReturnType<typeof computeQuoteEstimate>,
): Uint8Array {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 56;

  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, pageWidth, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("SKINLABS®", margin, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Business Suite — Indicative Quotation", margin, 64);

  let y = 122;
  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - 60) {
      doc.addPage();
      y = 56;
    }
  };

  doc.setTextColor(...BRAND.muted);
  doc.setFontSize(9);
  doc.text("PREPARED FOR", margin, y);
  doc.setTextColor(...BRAND.primary);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(submission.fullName + (submission.businessName ? ` — ${submission.businessName}` : ""), margin, y + 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.muted);
  doc.text(submission.email + (submission.phone ? ` · ${submission.phone}` : ""), margin, y + 34);
  doc.text(`Date: ${new Date().toLocaleDateString("en-ZA")}`, margin, y + 48);

  y += 80;

  for (const line of estimate.lines) {
    ensureSpace(110);
    doc.setDrawColor(...BRAND.bg);
    doc.setFillColor(...BRAND.bg);
    doc.roundedRect(margin, y, pageWidth - margin * 2, 96, 8, 8, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(12);
    doc.setTextColor(...BRAND.primary);
    doc.text(`${line.label} (${line.fillSize})`, margin + 16, y + 22);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.muted);
    const approach = line.formulationApproach === "full_custom" ? "Full custom formulation" : "Stock-base customization";
    doc.text(`${line.quantity} units · ${line.moqTierLabel} · ${approach}`, margin + 16, y + 36);

    const rows: [string, string][] = [
      [`Unit price × ${line.quantity}`, formatZar(line.unitSubtotal)],
      ["Formulation development fee", formatZar(line.developmentFee)],
    ];
    if (line.labelFee) rows.push(["Label design", formatZar(line.labelFee)]);
    if (line.complianceFee) rows.push(["Compliance & labelling review", formatZar(line.complianceFee)]);
    rows.push([
      line.packagingFee === FEES.packagingSourcingPerSku ? "Packaging sourcing (turnkey)" : "Packaging compatibility check",
      formatZar(line.packagingFee),
    ]);

    let ry = y + 50;
    doc.setFontSize(8.5);
    for (const [label, value] of rows) {
      doc.setTextColor(...BRAND.muted);
      doc.text(label, margin + 16, ry);
      doc.setTextColor(...BRAND.primary);
      doc.text(value, pageWidth - margin - 16, ry, { align: "right" });
      ry += 11;
    }

    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.primary);
    doc.text("Line total", margin + 16, y + 88);
    doc.text(formatZar(line.lineTotal), pageWidth - margin - 16, y + 88, { align: "right" });
    doc.setFont("helvetica", "normal");

    y += 110;
  }

  if (estimate.brandIdentityFee > 0) {
    ensureSpace(30);
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.muted);
    doc.text("Brand identity / logo design", margin, y);
    doc.setTextColor(...BRAND.primary);
    doc.text(formatZar(estimate.brandIdentityFee), pageWidth - margin, y, { align: "right" });
    y += 24;
  }

  ensureSpace(90);
  doc.setDrawColor(...BRAND.muted);
  doc.line(margin, y, pageWidth - margin, y);
  y += 20;
  const totalsRow = (label: string, value: string, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal");
    doc.setFontSize(bold ? 13 : 10);
    doc.setTextColor(...BRAND.primary);
    doc.text(label, margin, y);
    doc.text(value, pageWidth - margin, y, { align: "right" });
    y += bold ? 22 : 18;
  };
  totalsRow("Subtotal (ex VAT)", formatZar(estimate.subtotal));
  totalsRow("VAT (15%)", formatZar(estimate.vat));
  totalsRow("Estimated total", formatZar(estimate.total), true);

  ensureSpace(140);
  y += 10;
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.primary);
  doc.text("Submission details", margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  const details: [string, string][] = [
    ["Hair concerns", submission.hairConcerns.length ? submission.hairConcerns.join(", ") : "—"],
    ["Formulation notes", submission.formulationNotes || "—"],
    ["Existing branding", submission.hasBranding || "—"],
    [
      "Needs",
      [
        submission.needsLogo && "logo/brand identity",
        submission.needsLabelDesign && "label design",
        submission.needsComplianceHelp && "compliance/labelling help",
      ]
        .filter(Boolean)
        .join(", ") || "—",
    ],
    ["Packaging", submission.packagingRoute === "turnkey" ? "Turnkey (SkinLabs sources & applies)" : "Client-supplied"],
    ["White-labelling interest", submission.whiteLabelInterest || "—"],
    ["Timeline", submission.timeline || "—"],
    ["Budget range", submission.budgetRange || "—"],
    ["Additional notes", submission.additionalNotes || "—"],
  ];
  for (const [label, value] of details) {
    ensureSpace(28);
    doc.setFont("helvetica", "bold");
    doc.text(label, margin, y);
    doc.setFont("helvetica", "normal");
    const wrapped = doc.splitTextToSize(value, pageWidth - margin * 2 - 140);
    doc.text(wrapped, margin + 140, y);
    y += Math.max(14, wrapped.length * 12);
  }

  ensureSpace(50);
  y += 10;
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  const disclaimer = doc.splitTextToSize(
    "This is a preliminary, indicative estimate generated from the client's self-reported requirements. Final pricing is confirmed following a consultation call, formula-sample approval (typically 2–4 weeks) and a production lead time of 2–4 weeks. Not a binding quotation.",
    pageWidth - margin * 2,
  );
  doc.text(disclaimer, margin, y);

  return new Uint8Array(doc.output("arraybuffer"));
}

function uint8ToBase64(bytes: Uint8Array): string {
  let binary = "";
  const chunkSize = 0x8000;
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize));
  }
  return btoa(binary);
}

// ---------------------------------------------------------------------------
// Email
// ---------------------------------------------------------------------------

function buildNotificationHtml(submission: QuoteSubmission, estimate: ReturnType<typeof computeQuoteEstimate>): string {
  const rows = estimate.lines
    .map(
      (l) =>
        `<tr><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${l.label} (${l.fillSize})</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${l.quantity} units</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;">${l.formulationApproach === "full_custom" ? "Full custom" : "Stock-base"}</td><td style="padding:6px 8px;border-bottom:1px solid #e2e8f0;text-align:right;">${formatZar(l.lineTotal)}</td></tr>`,
    )
    .join("");

  return `
  <div style="font-family:Arial,sans-serif;color:#1e293b;max-width:640px;margin:0 auto;">
    <div style="background:#1e293b;color:#fff;padding:20px 24px;border-radius:8px 8px 0 0;">
      <h1 style="margin:0;font-size:18px;">SKINLABS® Business Suite</h1>
      <p style="margin:4px 0 0;font-size:13px;opacity:0.85;">New quote request — ${submission.fullName}${submission.businessName ? ` (${submission.businessName})` : ""}</p>
    </div>
    <div style="border:1px solid #e2e8f0;border-top:none;padding:24px;border-radius:0 0 8px 8px;">
      <p style="font-size:13px;color:#64748b;margin-top:0;">
        Submitted via <strong>/quote-ss-beauty</strong>. Full branded PDF quotation attached.
      </p>
      <table style="border-collapse:collapse;width:100%;font-size:13px;margin:16px 0;">
        <thead>
          <tr style="text-align:left;color:#64748b;font-size:11px;text-transform:uppercase;">
            <th style="padding:6px 8px;">Product</th><th style="padding:6px 8px;">Qty</th><th style="padding:6px 8px;">Approach</th><th style="padding:6px 8px;text-align:right;">Line total</th>
          </tr>
        </thead>
        <tbody>${rows}</tbody>
      </table>
      <p style="font-size:14px;font-weight:bold;">Estimated total (incl. VAT): ${formatZar(estimate.total)}</p>
      <hr style="border:none;border-top:1px solid #e2e8f0;margin:16px 0;" />
      <table style="font-size:13px;width:100%;">
        <tr><td style="padding:4px 0;color:#64748b;width:160px;">Email</td><td>${submission.email}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Phone</td><td>${submission.phone || "—"}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Hair concerns</td><td>${submission.hairConcerns.join(", ") || "—"}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Formulation notes</td><td>${submission.formulationNotes || "—"}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Existing branding</td><td>${submission.hasBranding || "—"}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Needs logo</td><td>${submission.needsLogo ? "Yes" : "No"}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Needs label design</td><td>${submission.needsLabelDesign ? "Yes" : "No"}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Needs compliance help</td><td>${submission.needsComplianceHelp ? "Yes" : "No"}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Packaging</td><td>${submission.packagingRoute}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">White-labelling</td><td>${submission.whiteLabelInterest || "—"}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Timeline</td><td>${submission.timeline || "—"}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Budget range</td><td>${submission.budgetRange || "—"}</td></tr>
        <tr><td style="padding:4px 0;color:#64748b;">Additional notes</td><td>${submission.additionalNotes || "—"}</td></tr>
      </table>
    </div>
  </div>`;
}

async function sendEmail(html: string, pdfBase64: string, subject: string): Promise<{ ok: boolean; error?: string }> {
  const apiKey = Deno.env.get("RESEND_API_KEY");
  if (!apiKey) {
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }
  try {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [NOTIFY_EMAIL],
        subject,
        html,
        attachments: [
          {
            filename: "SkinLabs-Business-Suite-Quote.pdf",
            content: pdfBase64,
          },
        ],
      }),
    });
    if (!res.ok) {
      const text = await res.text();
      return { ok: false, error: `Resend ${res.status}: ${text.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err).slice(0, 300) };
  }
}

// ---------------------------------------------------------------------------
// Handler
// ---------------------------------------------------------------------------

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }
  if (req.method !== "POST") {
    return new Response(JSON.stringify({ error: "Method not allowed" }), {
      status: 405,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const validated = validate(body);
    if (!validated.ok) {
      if (validated.error === "spam") {
        // Silently succeed for bots that filled the honeypot.
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      return new Response(JSON.stringify({ error: validated.error }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const submission = validated.data;

    const estimate = computeQuoteEstimate({
      products: submission.products,
      packagingRoute: submission.packagingRoute,
      needsLogo: submission.needsLogo,
      needsLabelDesign: submission.needsLabelDesign,
      needsComplianceHelp: submission.needsComplianceHelp,
    });

    const pdfBytes = buildQuotePdf(submission, estimate);
    const pdfBase64 = uint8ToBase64(pdfBytes);

    const emailResult = await sendEmail(
      buildNotificationHtml(submission, estimate),
      pdfBase64,
      `New Business Suite quote request — ${submission.fullName}`,
    );

    const supabase = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!);
    const { error: dbError } = await supabase.from("quote_ss_beauty_requests").insert({
      full_name: submission.fullName,
      business_name: submission.businessName ?? null,
      email: submission.email,
      phone: submission.phone ?? null,
      products: submission.products,
      hair_concerns: submission.hairConcerns,
      formulation_notes: submission.formulationNotes ?? null,
      has_branding: submission.hasBranding || null,
      needs_logo: submission.needsLogo,
      needs_label_design: submission.needsLabelDesign,
      needs_compliance_help: submission.needsComplianceHelp,
      packaging_route: submission.packagingRoute,
      white_label_interest: submission.whiteLabelInterest || null,
      timeline: submission.timeline || null,
      budget_range: submission.budgetRange ?? null,
      additional_notes: submission.additionalNotes ?? null,
      estimate,
      email_sent: emailResult.ok,
      email_error: emailResult.error ?? null,
    });

    if (dbError) {
      console.error("quote_ss_beauty_requests insert failed:", dbError);
    }
    if (!emailResult.ok) {
      console.error("quote-ss-beauty-submit email failed:", emailResult.error);
    }

    return new Response(JSON.stringify({ ok: true, emailSent: emailResult.ok }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    console.error("quote-ss-beauty-submit error:", err);
    return new Response(JSON.stringify({ error: "Internal error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
