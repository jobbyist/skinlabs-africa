import jsPDF from "jspdf";

export interface SkincarePdfData {
  clientName: string;
  email: string;
  recommendation: string;
  skinType?: string;
  generatedAt?: Date;
}

const BRAND = {
  primary: [30, 41, 59] as [number, number, number], // slate-800
  accent: [99, 102, 241] as [number, number, number], // indigo-500
  muted: [100, 116, 139] as [number, number, number], // slate-500
  bg: [248, 250, 252] as [number, number, number],
};

export function generateSkincarePdf(data: SkincarePdfData): jsPDF {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 48;
  const contentWidth = pageWidth - margin * 2;
  const generatedAt = data.generatedAt ?? new Date();

  let y = margin;

  const ensureSpace = (needed: number) => {
    if (y + needed > pageHeight - margin - 30) {
      addFooter();
      doc.addPage();
      y = margin;
    }
  };

  const addFooter = () => {
    const pageNum = doc.getNumberOfPages();
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.muted);
    doc.text(
      `SKINLABS Personalized Skincare Report  •  Page ${pageNum}  •  AI-generated, dermatologist-reviewed  •  Not medical advice`,
      pageWidth / 2,
      pageHeight - 24,
      { align: "center" },
    );
  };

  // ---- Header banner ----
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, pageWidth, 110, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(22);
  doc.text("SKINLABS®", margin, 50);
  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text("Personalized AI Skincare Report", margin, 70);

  doc.setFontSize(9);
  doc.text(
    `Generated ${generatedAt.toLocaleDateString("en-ZA", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`,
    pageWidth - margin,
    50,
    { align: "right" },
  );
  doc.text("skinlabs.co.za", pageWidth - margin, 70, { align: "right" });

  y = 140;

  // ---- Client card ----
  doc.setFillColor(...BRAND.bg);
  doc.roundedRect(margin, y, contentWidth, 70, 6, 6, "F");
  doc.setTextColor(...BRAND.muted);
  doc.setFontSize(9);
  doc.setFont("helvetica", "normal");
  doc.text("PREPARED FOR", margin + 16, y + 22);
  doc.setTextColor(...BRAND.primary);
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text(data.clientName || "Client", margin + 16, y + 42);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.muted);
  doc.text(data.email, margin + 16, y + 58);

  if (data.skinType) {
    doc.setTextColor(...BRAND.accent);
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.text(
      `${data.skinType.toUpperCase()} SKIN`,
      pageWidth - margin - 16,
      y + 42,
      { align: "right" },
    );
  }
  y += 90;

  // ---- Body: render the markdown-ish recommendation ----
  const lines = data.recommendation.split("\n");

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) {
      y += 6;
      continue;
    }

    // H2 (## Section)
    if (line.startsWith("## ")) {
      ensureSpace(38);
      y += 8;
      doc.setDrawColor(...BRAND.accent);
      doc.setLineWidth(2);
      doc.line(margin, y, margin + 24, y);
      y += 16;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(13);
      doc.setTextColor(...BRAND.primary);
      doc.text(line.replace(/^##\s*/, "").replace(/\*\*/g, ""), margin, y);
      y += 14;
      continue;
    }

    // H3 (### )
    if (line.startsWith("### ")) {
      ensureSpace(26);
      y += 4;
      doc.setFont("helvetica", "bold");
      doc.setFontSize(11);
      doc.setTextColor(...BRAND.primary);
      doc.text(line.replace(/^###\s*/, "").replace(/\*\*/g, ""), margin, y);
      y += 14;
      continue;
    }

    // Bullet
    if (/^[-*•]\s/.test(line)) {
      const text = line.replace(/^[-*•]\s*/, "").replace(/\*\*/g, "");
      const wrapped = doc.splitTextToSize(text, contentWidth - 18);
      ensureSpace(wrapped.length * 13 + 4);
      doc.setFont("helvetica", "normal");
      doc.setFontSize(10);
      doc.setTextColor(...BRAND.primary);
      doc.setFillColor(...BRAND.accent);
      doc.circle(margin + 4, y - 3, 1.6, "F");
      doc.text(wrapped, margin + 14, y);
      y += wrapped.length * 13 + 2;
      continue;
    }

    // Numbered list
    const num = /^(\d+)\.\s+(.*)/.exec(line);
    if (num) {
      const text = num[2].replace(/\*\*/g, "");
      const wrapped = doc.splitTextToSize(text, contentWidth - 22);
      ensureSpace(wrapped.length * 13 + 4);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(10);
      doc.setTextColor(...BRAND.accent);
      doc.text(`${num[1]}.`, margin, y);
      doc.setFont("helvetica", "normal");
      doc.setTextColor(...BRAND.primary);
      doc.text(wrapped, margin + 18, y);
      y += wrapped.length * 13 + 2;
      continue;
    }

    // Paragraph
    const cleaned = line.replace(/\*\*/g, "");
    const wrapped = doc.splitTextToSize(cleaned, contentWidth);
    ensureSpace(wrapped.length * 13 + 4);
    doc.setFont("helvetica", "normal");
    doc.setFontSize(10);
    doc.setTextColor(...BRAND.primary);
    doc.text(wrapped, margin, y);
    y += wrapped.length * 13 + 2;
  }

  // ---- Disclaimer ----
  ensureSpace(80);
  y += 14;
  doc.setFillColor(...BRAND.bg);
  doc.roundedRect(margin, y, contentWidth, 64, 6, 6, "F");
  doc.setFont("helvetica", "bold");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.primary);
  doc.text("IMPORTANT", margin + 14, y + 18);
  doc.setFont("helvetica", "normal");
  doc.setTextColor(...BRAND.muted);
  doc.setFontSize(9);
  const disclaimer = doc.splitTextToSize(
    "This report is AI-generated, grounded in dermatology reference literature, and reviewed by SKINLABS skincare specialists. It is general skincare guidance, not medical advice. For medical skin conditions, persistent reactions, or before starting prescription actives, please consult a licensed dermatologist.",
    contentWidth - 28,
  );
  doc.text(disclaimer, margin + 14, y + 32);

  addFooter();
  return doc;
}

export function downloadSkincarePdf(data: SkincarePdfData) {
  const doc = generateSkincarePdf(data);
  const safeName = (data.clientName || "client").replace(/[^a-z0-9]+/gi, "-").toLowerCase();
  doc.save(`skinlabs-skincare-report-${safeName}.pdf`);
}
