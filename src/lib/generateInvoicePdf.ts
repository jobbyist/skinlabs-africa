import jsPDF from "jspdf";

export interface InvoiceData {
  reference: string;
  description: string;
  amountZar: number;
  createdAt: string;
  customerName: string;
  customerEmail: string;
}

const BRAND = {
  primary: [30, 41, 59] as [number, number, number],
  muted: [100, 116, 139] as [number, number, number],
  bg: [248, 250, 252] as [number, number, number],
};

/** A simple receipt built from the real payment_transactions row — no invoicing system, no fabricated numbers. */
export function generateInvoicePdf(data: InvoiceData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 56;

  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, pageWidth, 90, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(20);
  doc.text("SKINLABS®", margin, 44);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.text("Payment receipt", margin, 64);

  let y = 130;
  doc.setTextColor(...BRAND.muted);
  doc.setFontSize(9);
  doc.text("BILLED TO", margin, y);
  doc.setTextColor(...BRAND.primary);
  doc.setFontSize(12);
  doc.setFont("helvetica", "bold");
  doc.text(data.customerName || "SkinLabs member", margin, y + 18);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.muted);
  doc.text(data.customerEmail, margin, y + 34);

  y += 70;
  doc.setDrawColor(...BRAND.bg);
  doc.setFillColor(...BRAND.bg);
  doc.roundedRect(margin, y, pageWidth - margin * 2, 130, 8, 8, "F");

  const row = (label: string, value: string, offset: number) => {
    doc.setFontSize(9);
    doc.setTextColor(...BRAND.muted);
    doc.text(label, margin + 20, y + offset);
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.primary);
    doc.setFont("helvetica", "bold");
    doc.text(value, pageWidth - margin - 20, y + offset, { align: "right" });
    doc.setFont("helvetica", "normal");
  };

  row("Description", data.description, 30);
  row("Reference", data.reference, 58);
  row("Date", new Date(data.createdAt).toLocaleDateString("en-ZA", { day: "numeric", month: "long", year: "numeric" }), 86);
  row("Amount paid", `R${data.amountZar.toFixed(2)}`, 114);

  y += 160;
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  const disclaimer = doc.splitTextToSize(
    "Processed securely by Paystack. This receipt reflects a real, verified transaction on your SkinLabs account.",
    pageWidth - margin * 2,
  );
  doc.text(disclaimer, margin, y);

  return doc;
}

export function downloadInvoicePdf(data: InvoiceData) {
  const doc = generateInvoicePdf(data);
  doc.save(`skinlabs-receipt-${data.reference}.pdf`);
}
