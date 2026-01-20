import { useState, useEffect, useCallback } from "react";
import { DollarSign } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const currencies = [
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
];

// Exchange rates relative to ZAR (base currency)
const exchangeRates: Record<string, number> = {
  ZAR: 1,
  USD: 0.055,
  EUR: 0.052,
  GBP: 0.044,
  NGN: 85.5,
  KES: 7.1,
};

const CurrencyConverter = () => {
  const [selectedCurrency, setSelectedCurrency] = useState(() => {
    const saved = localStorage.getItem("selectedCurrency");
    return saved ? JSON.parse(saved) : currencies[0];
  });

  useEffect(() => {
    localStorage.setItem("selectedCurrency", JSON.stringify(selectedCurrency));
  }, [selectedCurrency]);

  const convertPrice = useCallback((priceInZAR: number): string => {
    const convertedPrice = priceInZAR * exchangeRates[selectedCurrency.code];
    return `${selectedCurrency.symbol}${convertedPrice.toFixed(2)}`;
  }, [selectedCurrency]);

  // Expose conversion function globally for use in product cards
  useEffect(() => {
    interface WindowWithConversion extends Window {
      convertPrice?: (price: number) => string;
      selectedCurrency?: typeof selectedCurrency;
    }
    (window as WindowWithConversion).convertPrice = convertPrice;
    (window as WindowWithConversion).selectedCurrency = selectedCurrency;
  }, [selectedCurrency, convertPrice]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <DollarSign className="h-4 w-4" />
          <span className="hidden md:inline">{selectedCurrency.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel>Select Currency</DropdownMenuLabel>
        <DropdownMenuSeparator />
        {currencies.map((currency) => (
          <DropdownMenuItem
            key={currency.code}
            onClick={() => setSelectedCurrency(currency)}
            className="cursor-pointer"
          >
            <span className="mr-2">{currency.symbol}</span>
            <span>{currency.name}</span>
            <span className="ml-auto text-xs text-muted-foreground">
              {currency.code}
            </span>
            {selectedCurrency.code === currency.code && (
              <span className="ml-2 text-primary">✓</span>
            )}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencyConverter;
