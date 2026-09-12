import { Globe } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency, SUPPORTED_CURRENCIES } from "@/contexts/CurrencyContext";

export function CurrencySelector({ className }: { className?: string }) {
  const { currency, setCurrency } = useCurrency();

  return (
    <Select value={currency} onValueChange={(v) => setCurrency(v as typeof currency)}>
      <SelectTrigger className={className ?? "h-8 w-[76px] text-[11px] rounded-full border-stone-200"}>
        <Globe className="h-3 w-3 mr-1 text-stone-400" />
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {SUPPORTED_CURRENCIES.map((c) => (
          <SelectItem key={c} value={c} className="text-xs">
            {c}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
