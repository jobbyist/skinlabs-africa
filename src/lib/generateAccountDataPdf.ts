import jsPDF from "jspdf";

export interface AccountExportData {
  fullName: string | null;
  email: string;
  createdAt: string;
  profileFields: Record<string, string>;
  recommendations: { created_at: string; skin_type: string; concerns: string[] }[];
  journeyEntries: { entry_date: string; mood: string | null; skin_condition_rating: number | null }[];
  transactions: { created_at: string; description: string; amount_zar: number; reference: string }[];
}

const BRAND = { primary: [30, 41, 59] as [number, number, number], muted: [100, 116, 139] as [number, number, number] };

/**
 * A plain-text export of everything this account has told us — the same data
 * visible in the dashboard, gathered client-side (no server round trip
 * beyond the reads already done to render the dashboard) so a member can
 * download a copy of their own data at any time.
 */
export function generateAccountDataPdf(data: AccountExportData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin) {
      doc.addPage();
      y = margin;
    }
  };

  const heading = (text: string) => {
    ensureSpace(30);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(13);
    doc.setTextColor(...BRAND.primary);
    doc.text(text, margin, y);
    y += 8;
    doc.setDrawColor(...BRAND.muted);
    doc.line(margin, y, pageWidth - margin, y);
    y += 18;
  };

  const line = (text: string) => {
    const wrapped = doc.splitTextToSize(text, contentWidth);
    ensureSpace(wrapped.length * 13 + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.primary);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 13 + 4;
  };

  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.setTextColor(...BRAND.primary);
  doc.text("SKINLABS® — Your account data export", margin, y);
  y += 18;
  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Generated ${new Date().toLocaleString("en-ZA")}`, margin, y);
  y += 30;

  heading("Profile");
  line(`Name: ${data.fullName || "—"}`);
  line(`Email: ${data.email}`);
  line(`Account created: ${new Date(data.createdAt).toLocaleDateString("en-ZA")}`);
  for (const [label, value] of Object.entries(data.profileFields)) {
    if (value) line(`${label}: ${value}`);
  }
  y += 10;

  heading(`AI skin analyses (${data.recommendations.length})`);
  if (data.recommendations.length === 0) line("None yet.");
  for (const r of data.recommendations) {
    line(`${new Date(r.created_at).toLocaleDateString("en-ZA")} — ${r.skin_type} skin — ${r.concerns.join(", ") || "no concerns listed"}`);
  }
  y += 10;

  heading(`Skin journey entries (${data.journeyEntries.length})`);
  if (data.journeyEntries.length === 0) line("None yet.");
  for (const e of data.journeyEntries) {
    line(`${new Date(e.entry_date).toLocaleDateString("en-ZA")} — rating ${e.skin_condition_rating ?? "—"}/10${e.mood ? ` — ${e.mood}` : ""}`);
  }
  y += 10;

  heading(`Transactions (${data.transactions.length})`);
  if (data.transactions.length === 0) line("None yet.");
  for (const t of data.transactions) {
    line(`${new Date(t.created_at).toLocaleDateString("en-ZA")} — ${t.description} — R${t.amount_zar.toFixed(2)} — ref ${t.reference}`);
  }

  return doc;
}

export function downloadAccountDataPdf(data: AccountExportData) {
  const doc = generateAccountDataPdf(data);
  doc.save("skinlabs-my-data-export.pdf");
}
