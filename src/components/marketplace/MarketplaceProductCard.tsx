import { Link } from "react-router-dom";
import { Heart, ShoppingBag } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatZar } from "@/lib/marketplace/pricing";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import type { MarketplaceProductRecord } from "@/hooks/use-marketplace-products";

export function MarketplaceProductCard({
  product,
  saved,
  onToggleSave,
}: {
  product: MarketplaceProductRecord;
  saved?: boolean;
  onToggleSave?: () => void;
}) {
  const { addItem } = useCart();
  const { currency, formatConverted } = useCurrency();
  const image = product.images[0];

  return (
    <Link to={`/marketplace/product/${product.slug}`} className="block">
      <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all duration-200">
        <div className="relative bg-stone-50 h-40 flex items-center justify-center">
          {image ? (
            <img src={image.url} alt={image.alt ?? product.name} className="h-full w-full object-cover" loading="lazy" />
          ) : (
            <div className="flex flex-col items-center gap-1 opacity-40">
              <div className="w-8 h-16 bg-stone-300 rounded-xl" />
              <div className="w-12 h-2 bg-stone-200 rounded" />
            </div>
          )}
          {onToggleSave && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onToggleSave();
              }}
              className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
            >
              <Heart className={cn("h-3.5 w-3.5 transition-colors", saved ? "fill-red-400 text-red-400" : "text-stone-400")} />
            </button>
          )}
        </div>

        <div className="p-3">
          <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wide truncate">{product.brand.name}</p>
          <p className="font-semibold text-[12px] text-stone-900 leading-snug mt-0.5 line-clamp-2">{product.name}</p>
          {product.concern.length > 0 && (
            <p className="text-[10px] text-stone-500 mt-1 truncate">{product.concern.join(" • ")}</p>
          )}
          <p className="font-bold text-[14px] text-stone-900 mt-2">{formatZar(product.markedUpPriceZar)}</p>
          {currency !== "ZAR" && (
            <p className="text-[10px] text-stone-400">≈ {formatConverted(product.markedUpPriceZar)}</p>
          )}
          <button
            onClick={(e) => {
              e.preventDefault();
              addItem(product.id);
            }}
            className="mt-2 w-full flex items-center justify-center gap-1.5 bg-stone-900 text-white rounded-xl py-2 text-[11px] font-semibold hover:bg-stone-800 transition-colors"
          >
            <ShoppingBag className="h-3 w-3" />
            Add to bag
          </button>
        </div>
      </div>
    </Link>
  );
}
