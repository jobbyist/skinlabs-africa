import { useEffect, useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, Loader2, Mail, MessageCircle, Minus, Phone, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCartStore } from "@/stores/cartStore";
import { fetchShopifyProducts, type ShopifyProduct } from "@/lib/shopify";
import { cn } from "@/lib/utils";

const FeaturedCheckout = () => {
  const [products, setProducts] = useState<ShopifyProduct[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const { items, isLoading, addItem, updateQuantity, removeItem, getCheckoutUrl } = useCartStore();

  useEffect(() => {
    fetchShopifyProducts(10).then(p => { setProducts(p); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const totalItems = useMemo(() => items.reduce((s, i) => s + i.quantity, 0), [items]);
  const subtotal = useMemo(() => items.reduce((s, i) => s + parseFloat(i.price.amount) * i.quantity, 0), [items]);
  const currency = items[0]?.price.currencyCode || "ZAR";

  const handleAddToCart = async (product: ShopifyProduct) => {
    const variantId = selectedVariants[product.node.id];
    const variant = variantId
      ? product.node.variants.edges.find(v => v.node.id === variantId)?.node
      : product.node.variants.edges[0]?.node;
    if (!variant) return;

    await addItem({
      product,
      variantId: variant.id,
      variantTitle: variant.title,
      price: variant.price,
      quantity: 1,
      selectedOptions: variant.selectedOptions || [],
    });
  };

  const handleCheckout = () => {
    const url = getCheckoutUrl();
    if (url) window.open(url, '_blank');
  };

  if (loading) {
    return (
      <div className="mt-16 flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mt-16 rounded-3xl border border-border bg-background p-4 sm:p-6 shadow-sm md:p-10 mx-0 sm:mx-2">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">Express Checkout</p>
        <h3 className="text-2xl md:text-3xl font-heading font-semibold text-foreground">Build your Skinlabs ritual</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">Add products to your cart and checkout directly via Shopify.</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((product) => {
            const p = product.node;
            const currentVariantId = selectedVariants[p.id] || p.variants.edges[0]?.node.id;
            const currentVariant = p.variants.edges.find(v => v.node.id === currentVariantId)?.node;
            const inCart = items.find(i => i.variantId === currentVariantId);
            const imageUrl = p.images.edges[0]?.node.url;
            const isMadeToOrder = p.title.toLowerCase().includes('made to order');

            return (
              <div
                key={p.id}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition",
                  inCart ? "border-primary shadow-lg" : "hover:border-primary/40"
                )}
              >
                <div className="flex items-center gap-4">
                  {imageUrl && (
                    <img src={imageUrl} alt={p.title} className="h-20 w-20 rounded-xl object-cover" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {p.tags?.includes('new') ? 'New!' : (p.tags?.[0] || '')}
                    </p>
                    <h4 className="font-semibold text-foreground text-sm line-clamp-2">{p.title}</h4>
                    <p className="text-sm text-primary mt-1">
                      {currentVariant?.price.currencyCode} {parseFloat(currentVariant?.price.amount || '0').toFixed(2)}
                    </p>
                  </div>
                </div>

                {p.variants.edges.length > 1 && (
                  <Select
                    value={currentVariantId}
                    onValueChange={(v) => setSelectedVariants(prev => ({ ...prev, [p.id]: v }))}
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select variant" />
                    </SelectTrigger>
                    <SelectContent>
                      {p.variants.edges.map((v) => (
                        <SelectItem key={v.node.id} value={v.node.id} className="text-xs">
                          {v.node.title}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {isMadeToOrder && (
                  <div className="rounded-lg bg-secondary/50 p-2.5 text-xs text-muted-foreground space-y-1">
                    <p>Custom body scrub formulations can be requested by contacting our support team.</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a href="mailto:support@skinlabs.co.za" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <Mail className="h-3 w-3" /> Email
                      </a>
                      <a href="tel:0128806560" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <Phone className="h-3 w-3" /> 012 880 6560
                      </a>
                      <a href="https://wa.me/27128806560" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-primary hover:underline">
                        <MessageCircle className="h-3 w-3" /> WhatsApp
                      </a>
                    </div>
                  </div>
                )}

                {inCart ? (
                  <div className="flex items-center gap-2">
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(currentVariantId, inCart.quantity - 1)}>
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-semibold w-6 text-center text-foreground">{inCart.quantity}</span>
                    <Button size="icon" variant="outline" className="h-7 w-7" onClick={() => updateQuantity(currentVariantId, inCart.quantity + 1)}>
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 ml-auto text-muted-foreground hover:text-destructive" onClick={() => removeItem(currentVariantId)}>
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button size="sm" variant="outline" className="gap-1 h-8 text-xs w-full" onClick={() => handleAddToCart(product)} disabled={isLoading}>
                    {isLoading ? <Loader2 className="h-3 w-3 animate-spin" /> : <ShoppingBag className="h-3 w-3" />}
                    Add to Cart
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        <aside className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Your Cart</p>
            <h4 className="text-lg font-semibold text-foreground">
              {totalItems === 0 ? "No items yet" : `${totalItems} item${totalItems > 1 ? "s" : ""}`}
            </h4>
          </div>

          {items.length > 0 && (
            <div className="space-y-3 border-t border-border pt-3">
              {items.map((item) => (
                <div key={item.variantId} className="flex items-center justify-between text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate">{item.product.node.title}</p>
                    {item.variantTitle !== "Default Title" && (
                      <p className="text-muted-foreground text-xs truncate">{item.variantTitle}</p>
                    )}
                    <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-foreground font-medium ml-2 whitespace-nowrap">
                    {item.price.currencyCode} {(parseFloat(item.price.amount) * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          )}

          <div className="border-t border-border pt-3">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Shipping</span>
              <span>{totalItems > 0 ? "Calculated at checkout" : "—"}</span>
            </div>
            <div className="flex items-center justify-between text-base font-semibold text-foreground mt-2">
              <span>Subtotal</span>
              <span>{currency} {subtotal.toFixed(2)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Secure checkout powered by Shopify.
          </div>

          <Button className="w-full gap-2" disabled={items.length === 0 || isLoading} onClick={handleCheckout}>
            {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <>Checkout <ChevronRight className="h-4 w-4" /></>}
          </Button>
        </aside>
      </div>
    </div>
  );
};

export default FeaturedCheckout;
