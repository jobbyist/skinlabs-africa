import { useMemo, useState } from "react";
import { CheckCircle2, ChevronRight, Mail, MessageCircle, Minus, Phone, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrency } from "@/hooks/use-currency";
import { cn } from "@/lib/utils";

export interface FeaturedProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
  variants?: string[];
  customNote?: string;
}

interface CartItem {
  productId: number;
  variant: string;
  quantity: number;
}

interface FeaturedCheckoutProps {
  products: FeaturedProduct[];
}

const FeaturedCheckout = ({ products }: FeaturedCheckoutProps) => {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedVariants, setSelectedVariants] = useState<Record<number, string>>({});
  const { formatPrice } = useCurrency();

  const cartKey = (productId: number, variant: string) => `${productId}__${variant}`;

  const addToCart = (productId: number) => {
    const product = products.find((p) => p.id === productId);
    if (!product) return;
    const variant = product.variants?.length
      ? selectedVariants[productId] || product.variants[0]
      : "default";

    setCart((prev) => {
      const existing = prev.find(
        (item) => item.productId === productId && item.variant === variant
      );
      if (existing) {
        return prev.map((item) =>
          item.productId === productId && item.variant === variant
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...prev, { productId, variant, quantity: 1 }];
    });
  };

  const updateQuantity = (productId: number, variant: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((item) =>
          item.productId === productId && item.variant === variant
            ? { ...item, quantity: Math.max(0, item.quantity + delta) }
            : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const removeFromCart = (productId: number, variant: string) => {
    setCart((prev) =>
      prev.filter((item) => !(item.productId === productId && item.variant === variant))
    );
  };

  const cartItems = useMemo(
    () =>
      cart
        .map((item) => ({
          ...item,
          product: products.find((p) => p.id === item.productId)!,
        }))
        .filter((item) => item.product),
    [cart, products]
  );

  const subtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );

  const totalItems = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.quantity, 0),
    [cartItems]
  );

  const handleCheckout = () => {
    const shopifyStoreUrl = "https://skinlabs.myshopify.com/cart";
    window.open(shopifyStoreUrl, "_blank");
  };

  return (
    <div className="mt-16 rounded-3xl border border-border bg-background p-6 shadow-sm md:p-10">
      <div className="mb-8">
        <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
          Express Checkout
        </p>
        <h3 className="text-2xl md:text-3xl font-heading font-semibold text-foreground">
          Build your Skinlabs ritual
        </h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-xl">
          Add products to your cart and checkout directly via our secure store.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        {/* Product grid */}
        <div className="grid gap-4 sm:grid-cols-2">
          {products.map((product) => {
            const currentVariant = product.variants?.length
              ? selectedVariants[product.id] || product.variants[0]
              : "default";
            const inCart = cart.find(
              (item) => item.productId === product.id && item.variant === currentVariant
            );

            return (
              <div
                key={product.id}
                className={cn(
                  "flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 transition",
                  inCart ? "border-primary shadow-lg" : "hover:border-primary/40"
                )}
              >
                <div className="flex items-center gap-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {product.category}
                    </p>
                    <h4 className="font-semibold text-foreground text-sm line-clamp-2">
                      {product.name}
                    </h4>
                    <p className="text-sm text-primary mt-1">{formatPrice(product.price)}</p>
                  </div>
                </div>

                {/* Variant selector */}
                {product.variants && product.variants.length > 0 && (
                  <Select
                    value={selectedVariants[product.id] || product.variants[0]}
                    onValueChange={(value) =>
                      setSelectedVariants((prev) => ({ ...prev, [product.id]: value }))
                    }
                  >
                    <SelectTrigger className="h-8 text-xs">
                      <SelectValue placeholder="Select variant" />
                    </SelectTrigger>
                    <SelectContent>
                      {product.variants.map((variant) => (
                        <SelectItem key={variant} value={variant} className="text-xs">
                          {variant}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}

                {/* Custom note */}
                {product.customNote && (
                  <div className="rounded-lg bg-secondary/50 p-2.5 text-xs text-muted-foreground space-y-1">
                    <p>{product.customNote}</p>
                    <div className="flex flex-wrap gap-2 pt-1">
                      <a
                        href="mailto:support@skinlabs.co.za"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Mail className="h-3 w-3" /> Email
                      </a>
                      <a
                        href="tel:0128806560"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <Phone className="h-3 w-3" /> 012 880 6560
                      </a>
                      <a
                        href="https://wa.me/27128806560"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 text-primary hover:underline"
                      >
                        <MessageCircle className="h-3 w-3" /> WhatsApp
                      </a>
                    </div>
                  </div>
                )}

                {/* Add / quantity controls */}
                {inCart ? (
                  <div className="flex items-center gap-2">
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(product.id, currentVariant, -1)}
                    >
                      <Minus className="h-3 w-3" />
                    </Button>
                    <span className="text-sm font-semibold w-6 text-center text-foreground">
                      {inCart.quantity}
                    </span>
                    <Button
                      size="icon"
                      variant="outline"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(product.id, currentVariant, 1)}
                    >
                      <Plus className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-7 w-7 ml-auto text-muted-foreground hover:text-destructive"
                      onClick={() => removeFromCart(product.id, currentVariant)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ) : (
                  <Button
                    size="sm"
                    variant="outline"
                    className="gap-1 h-8 text-xs w-full"
                    onClick={() => addToCart(product.id)}
                  >
                    <ShoppingBag className="h-3 w-3" />
                    Add to Cart
                  </Button>
                )}
              </div>
            );
          })}
        </div>

        {/* Cart sidebar */}
        <aside className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Your Cart</p>
            <h4 className="text-lg font-semibold text-foreground">
              {totalItems === 0 ? "No items yet" : `${totalItems} item${totalItems > 1 ? "s" : ""}`}
            </h4>
          </div>

          {cartItems.length > 0 && (
            <div className="space-y-3 border-t border-border pt-3">
              {cartItems.map((item) => (
                <div key={cartKey(item.productId, item.variant)} className="flex items-center justify-between text-sm">
                  <div className="min-w-0 flex-1">
                    <p className="text-foreground truncate">{item.product.name}</p>
                    {item.variant !== "default" && (
                      <p className="text-muted-foreground text-xs truncate">{item.variant}</p>
                    )}
                    <p className="text-muted-foreground text-xs">Qty: {item.quantity}</p>
                  </div>
                  <span className="text-foreground font-medium ml-2 whitespace-nowrap">
                    {formatPrice(item.product.price * item.quantity)}
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
              <span>{formatPrice(subtotal)}</span>
            </div>
          </div>

          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Secure checkout powered by Shopify.
          </div>

          <Button
            className="w-full gap-2"
            disabled={cart.length === 0}
            onClick={handleCheckout}
          >
            Checkout
            <ChevronRight className="h-4 w-4" />
          </Button>
        </aside>
      </div>
    </div>
  );
};

export default FeaturedCheckout;
