/**
 * Pricing engine for the temporary /quote-ss-beauty client quote form.
 *
 * Produces an INDICATIVE estimate only — SkinLabs' own working numbers for
 * contract-manufactured white-label hair care, in ZAR, ex VAT. It is
 * deliberately not a binding quote: real pricing is always confirmed on a
 * consultation call once the formula/packaging/artwork are finalized (same
 * process described to Siphokazi directly). Never present these numbers as
 * final or as a third-party market quote.
 *
 * Mirrored (not imported — different runtimes) into
 * supabase/functions/quote-ss-beauty-submit/index.ts, which is the
 * authoritative copy used for the PDF actually emailed to Michael. Keep the
 * two in sync if pricing changes.
 */

export type ProductKey = "hair_growth_oil" | "hair_food" | "leave_in_conditioner";

export const PRODUCT_LABELS: Record<ProductKey, string> = {
  hair_growth_oil: "Hair Growth Oil",
  hair_food: "Hair Food",
  leave_in_conditioner: "Leave-In Conditioner",
};

export const PRODUCT_FILL_SIZES: Record<ProductKey, string> = {
  hair_growth_oil: "100ml",
  hair_food: "200ml",
  leave_in_conditioner: "200ml",
};

export type FormulationApproach = "stock_base" | "full_custom";

export interface MoqTier {
  min: number;
  max: number | null;
  label: string;
}

export const MOQ_TIERS: MoqTier[] = [
  { min: 10, max: 49, label: "10–49 units/SKU" },
  { min: 50, max: 99, label: "50–99 units/SKU" },
  { min: 100, max: 249, label: "100–249 units/SKU" },
  { min: 250, max: 499, label: "250–499 units/SKU" },
  { min: 500, max: null, label: "500+ units/SKU" },
];

function tierIndexForQuantity(qty: number): number {
  const idx = MOQ_TIERS.findIndex((t) => qty >= t.min && (t.max === null || qty <= t.max));
  return idx === -1 ? 0 : idx;
}

/** Stock-base (white-label customization) unit cost per tier, ZAR, ex VAT. */
const STOCK_BASE_UNIT_PRICE: Record<ProductKey, number[]> = {
  hair_growth_oil: [58, 49, 42, 36, 31],
  hair_food: [72, 61, 52, 45, 39],
  leave_in_conditioner: [65, 55, 47, 41, 35],
};

/** Full-custom-formulation unit cost premium over the stock-base unit price. */
const CUSTOM_UNIT_PREMIUM = 0.35;

/** One-time per-SKU fees, ZAR ex VAT. */
export const FEES = {
  stockBaseCustomizationPerSku: 1200,
  customFormulationDevPerSku: 4500,
  labelDesignPerSku: 1800,
  compliancePerSku: 950,
  packagingSourcingPerSku: 850,
  clientPackagingInspectionPerSku: 450,
  brandIdentityFlat: 6500,
};

export interface ProductSelection {
  product: ProductKey;
  quantity: number;
  formulationApproach: FormulationApproach;
}

export interface QuoteInputs {
  products: ProductSelection[];
  packagingRoute: "turnkey" | "client_supplied";
  needsLogo: boolean;
  needsLabelDesign: boolean;
  needsComplianceHelp: boolean;
}

export interface ProductLineEstimate {
  product: ProductKey;
  label: string;
  fillSize: string;
  quantity: number;
  moqTierLabel: string;
  formulationApproach: FormulationApproach;
  unitPrice: number;
  unitSubtotal: number;
  developmentFee: number;
  labelFee: number;
  complianceFee: number;
  packagingFee: number;
  lineTotal: number;
}

export interface QuoteEstimate {
  lines: ProductLineEstimate[];
  brandIdentityFee: number;
  subtotal: number;
  vat: number;
  total: number;
}

const VAT_RATE = 0.15;

export function computeQuoteEstimate(inputs: QuoteInputs): QuoteEstimate {
  const lines: ProductLineEstimate[] = inputs.products.map((sel) => {
    const qty = Math.max(10, Math.round(sel.quantity) || 10);
    const tierIdx = tierIndexForQuantity(qty);
    const baseUnit = STOCK_BASE_UNIT_PRICE[sel.product][tierIdx];
    const unitPrice =
      sel.formulationApproach === "full_custom" ? Math.round(baseUnit * (1 + CUSTOM_UNIT_PREMIUM)) : baseUnit;
    const unitSubtotal = unitPrice * qty;

    const developmentFee =
      sel.formulationApproach === "full_custom"
        ? FEES.customFormulationDevPerSku
        : FEES.stockBaseCustomizationPerSku;

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

export function formatZar(amount: number): string {
  return new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency: "ZAR",
    maximumFractionDigits: 0,
  }).format(amount);
}
