import { useMemo, useState } from "react";
import { CheckCircle2, ChevronLeft, ChevronRight, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCurrency } from "@/hooks/use-currency";
import { cn } from "@/lib/utils";

export interface FeaturedProduct {
  id: number;
  name: string;
  category: string;
  price: number;
  image: string;
}

interface FeaturedCheckoutProps {
  products: FeaturedProduct[];
}

const steps = ["Choose", "Details", "Review"];

const FeaturedCheckout = ({ products }: FeaturedCheckoutProps) => {
  const [step, setStep] = useState(0);
  const [selectedProductId, setSelectedProductId] = useState(products[0]?.id ?? 0);
  const [quantity, setQuantity] = useState(1);
  const [details, setDetails] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const { formatPrice } = useCurrency();

  const selectedProduct = useMemo(
    () => products.find((product) => product.id === selectedProductId) ?? products[0],
    [products, selectedProductId],
  );

  const subtotal = selectedProduct ? selectedProduct.price * quantity : 0;
  const canProceed =
    step === 0 ||
    (step === 1 && details.name && details.email && details.address);

  return (
    <div className="mt-16 rounded-3xl border border-border bg-background p-6 shadow-sm md:p-10">
      <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            Express Checkout
          </p>
          <h3 className="text-2xl md:text-3xl font-heading font-semibold text-foreground">
            Build your Skinlabs ritual in minutes
          </h3>
          <p className="text-sm text-muted-foreground mt-2 max-w-xl">
            Select a featured product, add your delivery details, and review a secure summary before continuing to checkout.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {steps.map((label, index) => (
            <div key={label} className="flex items-center gap-2">
              <div
                className={cn(
                  "flex h-8 w-8 items-center justify-center rounded-full border text-sm font-semibold",
                  step >= index
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border text-muted-foreground",
                )}
              >
                {step > index ? <CheckCircle2 className="h-4 w-4" /> : index + 1}
              </div>
              <span className="text-xs font-medium text-muted-foreground hidden sm:inline">
                {label}
              </span>
              {index < steps.length - 1 && (
                <span className="hidden sm:inline text-muted-foreground">—</span>
              )}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[2fr_1fr]">
        <div className="space-y-6">
          {step === 0 && (
            <div className="grid gap-4 sm:grid-cols-2">
              {products.map((product) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setSelectedProductId(product.id)}
                  className={cn(
                    "flex items-center gap-4 rounded-2xl border border-border bg-card p-4 text-left transition",
                    selectedProductId === product.id
                      ? "border-primary shadow-lg"
                      : "hover:border-primary/40",
                  )}
                >
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-20 w-20 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {product.category}
                    </p>
                    <h4 className="font-semibold text-foreground">{product.name}</h4>
                    <p className="text-sm text-primary mt-1">{formatPrice(product.price)}</p>
                  </div>
                </button>
              ))}
              <div className="rounded-2xl border border-dashed border-border p-4">
                <label className="text-sm font-semibold text-foreground">Quantity</label>
                <div className="mt-2 flex items-center gap-3">
                  <input
                    type="number"
                    min={1}
                    value={quantity}
                    onChange={(event) => setQuantity(Math.max(1, Number(event.target.value)))}
                    className="w-24 rounded-md border border-border bg-background px-3 py-2 text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Multi-pack orders are bundled with free shipping.
                  </p>
                </div>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Full name</span>
                <input
                  type="text"
                  value={details.name}
                  onChange={(event) => setDetails({ ...details, name: event.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Email address</span>
                <input
                  type="email"
                  value={details.email}
                  onChange={(event) => setDetails({ ...details, email: event.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-2">
                <span className="text-sm font-medium text-foreground">Phone number</span>
                <input
                  type="tel"
                  value={details.phone}
                  onChange={(event) => setDetails({ ...details, phone: event.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
              <label className="space-y-2 sm:col-span-2">
                <span className="text-sm font-medium text-foreground">Shipping address</span>
                <input
                  type="text"
                  value={details.address}
                  onChange={(event) => setDetails({ ...details, address: event.target.value })}
                  className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm"
                />
              </label>
            </div>
          )}

          {step === 2 && selectedProduct && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border bg-card p-5">
                <div className="flex items-center gap-4">
                  <img
                    src={selectedProduct.image}
                    alt={selectedProduct.name}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                  <div>
                    <p className="text-xs uppercase tracking-wide text-muted-foreground">
                      {selectedProduct.category}
                    </p>
                    <h4 className="font-semibold text-foreground">{selectedProduct.name}</h4>
                    <p className="text-sm text-muted-foreground">Qty {quantity}</p>
                  </div>
                </div>
              </div>
              <div className="rounded-2xl border border-border bg-secondary/40 p-5">
                <div className="flex items-center justify-between text-sm text-muted-foreground">
                  <span>Subtotal</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between text-sm text-muted-foreground mt-2">
                  <span>Shipping</span>
                  <span>Included</span>
                </div>
                <div className="mt-4 flex items-center justify-between text-base font-semibold text-foreground">
                  <span>Total</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
              </div>
              <div className="flex items-start gap-3 rounded-2xl border border-border bg-background p-4">
                <ShieldCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-sm font-semibold text-foreground">Secure checkout</p>
                  <p className="text-xs text-muted-foreground">
                    You will complete payment on our encrypted store checkout.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside className="rounded-2xl border border-border bg-card p-6 space-y-4">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted-foreground">Selected</p>
            <h4 className="text-lg font-semibold text-foreground">
              {selectedProduct?.name ?? "Choose a product"}
            </h4>
            <p className="text-sm text-muted-foreground mt-1">
              {selectedProduct?.category}
            </p>
          </div>
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span>Quantity</span>
            <span>{quantity}</span>
          </div>
          <div className="flex items-center justify-between text-base font-semibold text-foreground">
            <span>Estimated total</span>
            <span>{formatPrice(subtotal)}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="h-4 w-4 text-primary" />
            Complimentary tracking updates included.
          </div>
        </aside>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:justify-between">
        <Button
          variant="ghost"
          onClick={() => setStep((current) => Math.max(0, current - 1))}
          disabled={step === 0}
        >
          <ChevronLeft className="h-4 w-4" />
          Back
        </Button>
        {step < 2 ? (
          <Button
            className="gap-2"
            onClick={() => setStep((current) => Math.min(2, current + 1))}
            disabled={!canProceed}
          >
            Continue
            <ChevronRight className="h-4 w-4" />
          </Button>
        ) : (
          <Button className="gap-2" asChild>
            <a
              href="https://shop.skinlabs.co.za/checkout"
              target="_blank"
              rel="noopener noreferrer"
            >
              Proceed to secure checkout
              <ChevronRight className="h-4 w-4" />
            </a>
          </Button>
        )}
      </div>
    </div>
  );
};

export default FeaturedCheckout;
