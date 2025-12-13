import { useState } from "react";
import { Globe, DollarSign } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";

const languages = [
  { code: "en", name: "English", flag: "🇬🇧" },
  { code: "af", name: "Afrikaans", flag: "🇿🇦" },
  { code: "zu", name: "Zulu", flag: "🇿🇦" },
  { code: "xh", name: "Xhosa", flag: "🇿🇦" },
  { code: "fr", name: "French", flag: "🇫🇷" },
  { code: "pt", name: "Portuguese", flag: "🇵🇹" },
];

const currencies = [
  { code: "ZAR", name: "South African Rand", symbol: "R" },
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "NGN", name: "Nigerian Naira", symbol: "₦" },
  { code: "KES", name: "Kenyan Shilling", symbol: "KSh" },
];

const LanguageCurrencySelector = () => {
  const [selectedLanguage, setSelectedLanguage] = useState(languages[0]);
  const [selectedCurrency, setSelectedCurrency] = useState(currencies[0]);

  return (
    <div className="flex items-center gap-2">
      {/* Language Selector */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="gap-2">
            <Globe className="h-4 w-4" />
            <span className="hidden md:inline">{selectedLanguage.code.toUpperCase()}</span>
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-48">
          <DropdownMenuLabel>Select Language</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {languages.map((lang) => (
            <DropdownMenuItem
              key={lang.code}
              onClick={() => setSelectedLanguage(lang)}
              className="cursor-pointer"
            >
              <span className="mr-2">{lang.flag}</span>
              <span>{lang.name}</span>
              {selectedLanguage.code === lang.code && (
                <span className="ml-auto text-primary">✓</span>
              )}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Currency Selector */}
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
    </div>
  );
};

export default LanguageCurrencySelector;
