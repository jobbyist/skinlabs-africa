import { useEffect, useState } from "react";

export type CurrencyInfo = {
  code: string;
  name?: string;
  symbol: string;
};

type WindowWithCurrency = Window & {
  convertPrice?: (price: number) => string;
  selectedCurrency?: CurrencyInfo;
};

const fallbackCurrency: CurrencyInfo = {
  code: "ZAR",
  symbol: "R",
};

export const useCurrency = () => {
  const [currency, setCurrency] = useState<CurrencyInfo>(() => {
    if (typeof window === "undefined") {
      return fallbackCurrency;
    }

    const stored = window.localStorage.getItem("selectedCurrency");
    if (stored) {
      try {
        return JSON.parse(stored) as CurrencyInfo;
      } catch {
        return fallbackCurrency;
      }
    }

    return (window as WindowWithCurrency).selectedCurrency ?? fallbackCurrency;
  });

  useEffect(() => {
    const handleCurrencyChange = (event: Event) => {
      const customEvent = event as CustomEvent<CurrencyInfo>;
      if (customEvent.detail) {
        setCurrency(customEvent.detail);
      }
    };

    window.addEventListener("currency-change", handleCurrencyChange);

    return () => {
      window.removeEventListener("currency-change", handleCurrencyChange);
    };
  }, []);

  const formatPrice = (price: number) => {
    if (typeof window !== "undefined") {
      const convertPrice = (window as WindowWithCurrency).convertPrice;
      if (convertPrice) {
        return convertPrice(price);
      }
    }

    return `${currency.symbol}${price.toFixed(2)}`;
  };

  return { currency, formatPrice };
};
