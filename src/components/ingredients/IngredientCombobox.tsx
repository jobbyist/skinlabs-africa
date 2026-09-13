import { useState } from "react";
import { Check, ChevronsUpDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { useIngredientOptions, type IngredientOption } from "@/hooks/use-ingredient-compatibility";

interface Props {
  value: IngredientOption | null;
  onChange: (value: IngredientOption | null) => void;
  placeholder?: string;
}

/** Alias-aware ingredient picker (searches by INCI name, common name, or a
 *  known alias like "vit c") for the Combination Checker. */
const IngredientCombobox = ({ value, onChange, placeholder = "Select an ingredient…" }: Props) => {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const { data: options, isFetching } = useIngredientOptions(query);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between font-normal"
        >
          {value ? value.label : placeholder}
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
        <Command shouldFilter={false}>
          <CommandInput placeholder="Search ingredients…" value={query} onValueChange={setQuery} />
          <CommandList>
            {query.trim().length < 2 ? (
              <CommandEmpty>Type at least 2 characters…</CommandEmpty>
            ) : isFetching ? (
              <CommandEmpty>Searching…</CommandEmpty>
            ) : (
              <CommandEmpty>No ingredient found.</CommandEmpty>
            )}
            <CommandGroup>
              {(options ?? []).map((opt) => (
                <CommandItem
                  key={opt.id}
                  value={opt.id}
                  onSelect={() => {
                    onChange(opt);
                    setOpen(false);
                  }}
                >
                  <Check className={cn("mr-2 h-4 w-4", value?.id === opt.id ? "opacity-100" : "opacity-0")} />
                  {opt.label}
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

export default IngredientCombobox;
