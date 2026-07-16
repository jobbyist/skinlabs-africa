import { Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useCurrency, CurrencyInfo } from "@/hooks/use-currency";

const currencies: CurrencyInfo[] = [
  { code: "ZAR", symbol: "R", name: "South African Rand" },
  { code: "USD", symbol: "$", name: "US Dollar" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "GBP", symbol: "£", name: "British Pound" },
];

const CurrencySelector = () => {
  const { currency } = useCurrency();

  const handleCurrencyChange = (selectedCurrency: CurrencyInfo) => {
    // Store in localStorage
    window.localStorage.setItem("selectedCurrency", JSON.stringify(selectedCurrency));
    
    // Dispatch custom event
    window.dispatchEvent(
      new CustomEvent("currency-change", { detail: selectedCurrency })
    );
    
    // Update global window object with proper typing
    const windowWithCurrency = window as Window & { selectedCurrency?: CurrencyInfo };
    windowWithCurrency.selectedCurrency = selectedCurrency;
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-2">
          <Globe className="h-4 w-4" />
          <span className="hidden sm:inline">{currency.code}</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-48">
        {currencies.map((curr) => (
          <DropdownMenuItem
            key={curr.code}
            onClick={() => handleCurrencyChange(curr)}
            className="cursor-pointer"
          >
            <span className="font-medium mr-2">{curr.symbol}</span>
            <span className="text-sm">{curr.name}</span>
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default CurrencySelector;
