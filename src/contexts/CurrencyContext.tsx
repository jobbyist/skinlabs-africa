import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

const STORAGE_KEY = "openhaus_currency_v1";
export const SUPPORTED_CURRENCIES = ["ZAR", "USD", "EUR", "GBP"] as const;
export type CurrencyCode = (typeof SUPPORTED_CURRENCIES)[number];

interface CurrencyContextValue {
  currency: CurrencyCode;
  setCurrency: (c: CurrencyCode) => void;
  /** Converts a ZAR amount to the selected display currency. ZAR stays canonical everywhere else (cart, checkout). */
  convert: (zarAmount: number) => number;
  formatConverted: (zarAmount: number) => string;
  ratesLoaded: boolean;
}

const CurrencyContext = createContext<CurrencyContextValue | null>(null);

const CURRENCY_SYMBOLS: Record<CurrencyCode, string> = { ZAR: "R", USD: "$", EUR: "€", GBP: "£" };

export function CurrencyProvider({ children }: { children: ReactNode }) {
  const [currency, setCurrencyState] = useState<CurrencyCode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return (SUPPORTED_CURRENCIES as readonly string[]).includes(stored ?? "") ? (stored as CurrencyCode) : "ZAR";
    } catch {
      return "ZAR";
    }
  });

  const { data: rates } = useQuery({
    queryKey: ["marketplace-fx-rates"],
    queryFn: async () => {
      const { data, error } = await supabase.from("marketplace_fx_rates").select("currency_code, rate_from_zar");
      if (error) throw error;
      return Object.fromEntries((data ?? []).map((r) => [r.currency_code, Number(r.rate_from_zar)]));
    },
    staleTime: 60 * 60 * 1000,
  });

  const setCurrency = (c: CurrencyCode) => {
    setCurrencyState(c);
    try {
      localStorage.setItem(STORAGE_KEY, c);
    } catch {
      // ignore
    }
  };

  const convert = (zarAmount: number) => {
    if (currency === "ZAR") return zarAmount;
    const rate = rates?.[currency];
    return rate ? zarAmount * rate : zarAmount;
  };

  const formatConverted = (zarAmount: number) => {
    const value = convert(zarAmount);
    return `${CURRENCY_SYMBOLS[currency]}${value.toFixed(2)}`;
  };

  return (
    <CurrencyContext.Provider value={{ currency, setCurrency, convert, formatConverted, ratesLoaded: Boolean(rates) }}>
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  const ctx = useContext(CurrencyContext);
  if (!ctx) throw new Error("useCurrency must be used within a CurrencyProvider");
  return ctx;
}
