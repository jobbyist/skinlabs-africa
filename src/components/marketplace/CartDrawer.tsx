import { Link } from "react-router-dom";
import { Minus, Plus, X, ShoppingBag } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { useCart } from "@/contexts/CartContext";
import { useMarketplaceProducts } from "@/hooks/use-marketplace-products";
import { formatZar } from "@/lib/marketplace/pricing";

export function CartDrawer({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { items, updateQuantity, removeItem } = useCart();
  const { data: products } = useMarketplaceProducts();

  const lines = items
    .map((item) => {
      const product = products?.find((p) => p.id === item.productId);
      return product ? { ...item, product } : null;
    })
    .filter((l): l is NonNullable<typeof l> => l !== null);

  const subtotal = lines.reduce((sum, l) => sum + l.product.markedUpPriceZar * l.quantity, 0);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-stone-100 px-5 py-4">
          <SheetTitle className="flex items-center gap-2 text-left text-base font-bold text-stone-900">
            <ShoppingBag className="h-4 w-4" /> Your bag
          </SheetTitle>
        </SheetHeader>

        {lines.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-2 px-6 text-center">
            <ShoppingBag className="h-8 w-8 text-stone-300" />
            <p className="text-sm font-medium text-stone-700">Your bag is empty</p>
            <p className="text-xs text-stone-400">Add products from the marketplace to see them here.</p>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-5 py-4">
            <ul className="flex flex-col gap-4">
              {lines.map((line) => (
                <li key={line.productId} className="flex gap-3">
                  <Link
                    to={`/marketplace/product/${line.product.slug}`}
                    className="h-16 w-16 shrink-0 overflow-hidden rounded-xl bg-stone-50"
                  >
                    {line.product.images[0] && (
                      <img
                        src={line.product.images[0].url}
                        alt={line.product.images[0].alt ?? line.product.name}
                        className="h-full w-full object-cover"
                        loading="lazy"
                      />
                    )}
                  </Link>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-[10px] font-medium uppercase tracking-wide text-stone-400">
                      {line.product.brand.name}
                    </p>
                    <Link
                      to={`/marketplace/product/${line.product.slug}`}
                      className="line-clamp-2 text-[13px] font-semibold text-stone-900 hover:underline"
                    >
                      {line.product.name}
                    </Link>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-2 rounded-full border border-stone-200 px-1.5 py-1">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() => updateQuantity(line.productId, line.quantity - 1)}
                          className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-stone-100"
                        >
                          <Minus className="h-3 w-3" />
                        </button>
                        <span className="w-4 text-center text-xs font-semibold">{line.quantity}</span>
                        <button
                          aria-label="Increase quantity"
                          onClick={() => updateQuantity(line.productId, line.quantity + 1)}
                          className="flex h-5 w-5 items-center justify-center rounded-full hover:bg-stone-100"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      </div>
                      <span className="text-[13px] font-bold text-stone-900">
                        {formatZar(line.product.markedUpPriceZar * line.quantity)}
                      </span>
                    </div>
                  </div>
                  <button
                    aria-label="Remove from bag"
                    onClick={() => removeItem(line.productId)}
                    className="h-6 w-6 shrink-0 self-start text-stone-300 hover:text-stone-600"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </li>
              ))}
            </ul>
          </div>
        )}

        {lines.length > 0 && (
          <div className="border-t border-stone-100 px-5 py-4">
            <div className="mb-3 flex items-center justify-between text-sm">
              <span className="text-stone-500">Subtotal</span>
              <span className="font-bold text-stone-900">{formatZar(subtotal)}</span>
            </div>
            <Button disabled className="w-full rounded-full bg-stone-900 text-white opacity-60">
              Checkout — coming soon
            </Button>
            <p className="mt-2 text-center text-[10px] text-stone-400">
              Your bag is saved. Payment isn't live yet — we'll let you know the moment it is.
            </p>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
