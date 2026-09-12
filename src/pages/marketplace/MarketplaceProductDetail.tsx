import { useState } from "react";
import { useParams, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Heart,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Leaf,
  Shield,
  Award,
  CheckCircle2,
  Sparkles,
  ShoppingBag,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { MobileBottomNav } from "@/components/marketplace/MobileBottomNav";
import { MarketplaceProductCard } from "@/components/marketplace/MarketplaceProductCard";
import { ProductRatings } from "@/components/marketplace/ProductRatings";
import { SkinLabsPromiseBadge } from "@/components/SkinLabsPromiseBadge";
import SEO from "@/components/SEO";
import { useMarketplaceProduct, useMarketplaceProducts } from "@/hooks/use-marketplace-products";
import { useCart } from "@/contexts/CartContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useSavedProducts } from "@/hooks/use-saved-products";
import { formatZar } from "@/lib/marketplace/pricing";

const tabs = ["Description", "Key Actives", "How to Use", "Ratings"] as const;
type Tab = (typeof tabs)[number];

export default function MarketplaceProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const { data: product, isLoading } = useMarketplaceProduct(slug);
  const { data: allProducts } = useMarketplaceProducts();
  const { addItem } = useCart();
  const { currency, formatConverted } = useCurrency();
  const { savedIds, toggleSaved } = useSavedProducts();

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState<Tab>("Description");
  const [addedToCart, setAddedToCart] = useState(false);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#faf9f7] flex items-center justify-center">
        <p className="text-sm text-stone-400">Loading…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-[#faf9f7] font-sans">
        <MarketplaceHeader showBack />
        <div className="max-w-lg mx-auto px-4 py-16 text-center">
          <p className="text-sm text-stone-500">This product couldn't be found.</p>
          <Link to="/marketplace" className="mt-3 inline-block text-sm font-semibold text-stone-900 underline">
            Back to OpenHaus
          </Link>
        </div>
      </div>
    );
  }

  const isSaved = savedIds.has(product.id);
  const images = product.images.length > 0 ? product.images : [];
  const related = (allProducts ?? []).filter((p) => p.category === product.category && p.id !== product.id).slice(0, 6);

  const handleAddToCart = () => {
    addItem(product.id, quantity);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const canonical = `/marketplace/product/${product.slug}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Product",
        name: product.name,
        description: product.description,
        brand: { "@type": "Brand", name: product.brand.name },
        category: product.category,
        ...(images[0] ? { image: images[0].url } : {}),
        sku: product.id,
        offers: {
          "@type": "Offer",
          priceCurrency: "ZAR",
          price: product.markedUpPriceZar.toFixed(2),
          availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
          url: `https://skinlabs.co.za${canonical}`,
        },
        ...(product.externalRating?.rating && product.externalRating?.reviewCount > 0
          ? {
              aggregateRating: {
                "@type": "AggregateRating",
                ratingValue: product.externalRating.rating,
                reviewCount: product.externalRating.reviewCount,
                bestRating: 5,
              },
            }
          : {}),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "OpenHaus", item: "https://skinlabs.co.za/marketplace" },
          { "@type": "ListItem", position: 2, name: product.brand.name, item: `https://skinlabs.co.za/marketplace/brand/${product.brand.slug}` },
          { "@type": "ListItem", position: 3, name: product.name, item: `https://skinlabs.co.za${canonical}` },
        ],
      },
    ],
  };

  return (
    <>
      <SEO
        title={`${product.name} — ${product.brand.name} | OpenHaus by SkinLabs®`}
        description={`${product.name} by ${product.brand.name}. ${product.description.slice(0, 150)}`}
        canonical={canonical}
        {...(images[0] ? { ogImage: images[0].url } : {})}
        jsonLd={jsonLd}
      />

      <div className="min-h-screen bg-[#faf9f7] font-sans pb-24">
        <MarketplaceHeader showBack />

        <div className="max-w-lg lg:max-w-5xl mx-auto px-4 pt-3 pb-1">
          <nav className="flex items-center gap-1.5 text-[10px] text-stone-400 flex-wrap">
            {["Home", product.category, product.brand.name, product.name].map((crumb, i, arr) => (
              <span key={crumb} className="flex items-center gap-1.5">
                <span className={i === arr.length - 1 ? "text-stone-600 font-medium" : "hover:text-stone-600 cursor-pointer"}>
                  {crumb}
                </span>
                {i < arr.length - 1 && <ChevronRight className="h-3 w-3" />}
              </span>
            ))}
          </nav>
        </div>

        <div className="max-w-lg lg:max-w-5xl mx-auto lg:grid lg:grid-cols-2 lg:gap-10">
          {/* ── Product gallery ── */}
          <section className="px-4 pt-2 pb-4">
            <div className="relative rounded-3xl overflow-hidden bg-stone-50 h-72 lg:h-[420px]">
              <button
                onClick={() => toggleSaved(product.id)}
                className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white shadow flex items-center justify-center hover:scale-110 transition-transform"
                aria-label="Save to wishlist"
              >
                <Heart className={cn("h-4 w-4 transition-colors duration-200", isSaved ? "fill-red-400 text-red-400" : "text-stone-400")} />
              </button>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeImage}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.96 }}
                  transition={{ duration: 0.25 }}
                  className="absolute inset-0 flex items-center justify-center"
                >
                  {images[activeImage] ? (
                    <img
                      src={images[activeImage].url}
                      alt={images[activeImage].alt ?? product.name}
                      className="h-full w-full object-cover"
                    />
                  ) : (
                    <div className="flex flex-col items-center gap-1 opacity-40">
                      <div className="w-12 h-28 bg-stone-300 rounded-2xl" />
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>

              {images.length > 1 && (
                <>
                  <button
                    onClick={() => setActiveImage((prev) => (prev - 1 + images.length) % images.length)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white transition-colors"
                    aria-label="Previous image"
                  >
                    <ChevronLeft className="h-4 w-4 text-stone-600" />
                  </button>
                  <button
                    onClick={() => setActiveImage((prev) => (prev + 1) % images.length)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white transition-colors"
                    aria-label="Next image"
                  >
                    <ChevronRight className="h-4 w-4 text-stone-600" />
                  </button>
                </>
              )}
            </div>

            {images.length > 1 && (
              <div className="flex gap-2 mt-3">
                {images.map((img, i) => (
                  <button
                    key={img.url}
                    onClick={() => setActiveImage(i)}
                    className={cn(
                      "h-14 w-14 rounded-xl overflow-hidden transition-all duration-150",
                      activeImage === i ? "ring-2 ring-stone-900 ring-offset-1" : "opacity-60 hover:opacity-100",
                    )}
                    aria-label={`View image ${i + 1}`}
                  >
                    <img src={img.url} alt={img.alt ?? ""} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </section>

          {/* ── Product info ── */}
          <section className="px-4 pb-4">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, delay: 0.1 }}>
              <Link
                to={`/marketplace/brand/${product.brand.slug}`}
                className="text-[10px] font-bold tracking-[0.18em] uppercase text-stone-500 mb-1 inline-block hover:text-stone-700"
              >
                {product.brand.name}
              </Link>
              <h1 className="font-black text-[22px] leading-tight text-stone-900 tracking-tight mb-2">{product.name}</h1>

              <div className="mb-3">
                <ProductRatings productId={product.id} externalRating={product.externalRating} />
              </div>

              {(product.concern.length > 0 || product.values.length > 0) && (
                <div className="flex flex-wrap gap-1.5 mb-3">
                  {[...product.concern, ...product.values].map((tag) => (
                    <span key={tag} className="rounded-full bg-stone-100 px-2.5 py-1 text-[10px] font-medium text-stone-600">
                      {tag}
                    </span>
                  ))}
                </div>
              )}

              <div className="flex items-baseline gap-1 mb-1">
                <span className="font-black text-[28px] text-stone-900">{formatZar(product.markedUpPriceZar)}</span>
                {product.size && <span className="text-[12px] text-stone-400 ml-1">/ {product.size}</span>}
              </div>
              {currency !== "ZAR" && (
                <p className="text-[12px] text-stone-400 mb-3">≈ {formatConverted(product.markedUpPriceZar)}</p>
              )}

              <div className="flex items-center gap-3 text-[12px] mb-5">
                <div className={cn("flex items-center gap-1.5", product.inStock ? "text-emerald-600" : "text-stone-400")}>
                  <div className={cn("h-1.5 w-1.5 rounded-full", product.inStock ? "bg-emerald-500" : "bg-stone-300")} />
                  <span className="font-medium">{product.inStock ? "In stock" : "Out of stock"}</span>
                </div>
              </div>

              <div className="mb-4">
                <p className="text-[11px] font-semibold text-stone-600 mb-2 uppercase tracking-wider">Quantity</p>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                    className="h-9 w-9 rounded-xl border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors disabled:opacity-40"
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus className="h-3.5 w-3.5 text-stone-700" />
                  </button>
                  <span className="font-semibold text-[16px] text-stone-900 w-6 text-center">{quantity}</span>
                  <button
                    onClick={() => setQuantity((q) => q + 1)}
                    className="h-9 w-9 rounded-xl border border-stone-200 flex items-center justify-center hover:bg-stone-50 transition-colors"
                    aria-label="Increase quantity"
                  >
                    <Plus className="h-3.5 w-3.5 text-stone-700" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <motion.button
                  onClick={handleAddToCart}
                  whileTap={{ scale: 0.98 }}
                  disabled={!product.inStock}
                  className={cn(
                    "w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-[14px] transition-all duration-200 disabled:opacity-50",
                    addedToCart ? "bg-emerald-600 text-white" : "bg-stone-900 text-white hover:bg-stone-800",
                  )}
                >
                  {addedToCart ? (
                    <>
                      <CheckCircle2 className="h-4.5 w-4.5" /> Added to bag
                    </>
                  ) : (
                    <>
                      <ShoppingBag className="h-4.5 w-4.5" /> Add to Cart
                    </>
                  )}
                </motion.button>
                <button
                  onClick={() => toggleSaved(product.id)}
                  className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-[13px] border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors"
                >
                  <Heart className={cn("h-4 w-4", isSaved && "fill-red-400 text-red-400")} />
                  {isSaved ? "Saved to Wishlist" : "Save to Wishlist"}
                </button>
              </div>

              <SkinLabsPromiseBadge
                className="mt-5"
                description="No hype, just evidence — this is a real product from a real brand, listed at its source price plus a transparent 4% marketplace fee, with no fabricated claims or reviews."
              />
            </motion.div>
          </section>
        </div>

        {/* ── Trust row ── */}
        <section className="max-w-lg lg:max-w-5xl mx-auto px-4 pb-6">
          <div className="grid grid-cols-3 gap-2 border-t border-b border-stone-100 py-4">
            {[
              { icon: <Leaf className="h-4 w-4" />, title: "Real Product Listings", sub: "No fabricated claims" },
              { icon: <Shield className="h-4 w-4" />, title: "SkinLabs® Promise", sub: "Independently reviewed platform" },
              { icon: <Award className="h-4 w-4" />, title: "South African Brand", sub: product.brand.origin ?? "Local skincare" },
            ].map((trust) => (
              <div key={trust.title} className="flex flex-col items-center text-center gap-1">
                <div className="h-9 w-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">{trust.icon}</div>
                <p className="text-[9px] font-semibold text-stone-800 leading-tight">{trust.title}</p>
                <p className="text-[8px] text-stone-400 leading-tight">{trust.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tabs ── */}
        <section className="max-w-lg lg:max-w-5xl mx-auto px-4 pb-6">
          <div className="flex border-b border-stone-100 mb-5 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-shrink-0 pb-3 px-1 mr-5 text-[13px] font-semibold transition-colors border-b-2 -mb-px",
                  activeTab === tab ? "border-stone-900 text-stone-900" : "border-transparent text-stone-400 hover:text-stone-600",
                )}
              >
                {tab}
              </button>
            ))}
          </div>

          <AnimatePresence mode="wait">
            {activeTab === "Description" && (
              <motion.div key="description" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <p className="text-[13px] text-stone-600 leading-relaxed mb-6">{product.description}</p>
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Category", icon: <Sparkles className="h-4 w-4" />, value: product.category },
                    { label: "Size", icon: <Award className="h-4 w-4" />, value: product.size ?? "—" },
                  ].map((meta) => (
                    <div key={meta.label} className="bg-stone-50 rounded-2xl p-3">
                      <div className="flex items-center gap-1.5 text-stone-500 mb-1.5">
                        {meta.icon}
                        <span className="text-[10px] font-semibold uppercase tracking-wider">{meta.label}</span>
                      </div>
                      <p className="text-[12px] text-stone-700 font-medium leading-snug capitalize">{meta.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "Key Actives" && (
              <motion.div key="actives" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                {product.keyActives.length > 0 ? (
                  <ul className="space-y-2">
                    {product.keyActives.map((active) => (
                      <li key={active} className="flex items-center gap-2 py-2 border-b border-stone-50 last:border-0">
                        <div className="h-1.5 w-1.5 bg-stone-300 rounded-full flex-shrink-0" />
                        <span className="text-[13px] text-stone-700">{active}</span>
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="text-[13px] text-stone-400">No key actives listed for this product.</p>
                )}
              </motion.div>
            )}

            {activeTab === "How to Use" && (
              <motion.div key="how-to-use" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <p className="text-[13px] text-stone-600 leading-relaxed">{product.howToUse ?? "Directions not provided by the brand."}</p>
              </motion.div>
            )}

            {activeTab === "Ratings" && (
              <motion.div key="ratings" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} transition={{ duration: 0.2 }}>
                <div className="bg-stone-50 rounded-2xl p-4">
                  <ProductRatings productId={product.id} externalRating={product.externalRating} />
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── You might also like ── */}
        {related.length > 0 && (
          <section className="max-w-lg lg:max-w-5xl mx-auto px-4 pb-6">
            <h2 className="font-bold text-[16px] text-stone-900 mb-4">You might also like</h2>
            <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
              {related.map((item) => (
                <div key={item.id} className="flex-shrink-0 w-36">
                  <MarketplaceProductCard product={item} saved={savedIds.has(item.id)} onToggleSave={() => toggleSaved(item.id)} />
                </div>
              ))}
            </div>
          </section>
        )}

        {/* ── Sticky bottom bar ── */}
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-sm border-t border-stone-100 lg:hidden">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-4">
            <div>
              <p className="font-black text-[18px] text-stone-900">{formatZar(product.markedUpPriceZar)}</p>
              <div className={cn("flex items-center gap-1 text-[10px]", product.inStock ? "text-emerald-600" : "text-stone-400")}>
                <div className={cn("h-1.5 w-1.5 rounded-full", product.inStock ? "bg-emerald-500" : "bg-stone-300")} />
                <span>{product.inStock ? "In stock" : "Out of stock"}</span>
              </div>
            </div>
            <motion.button
              onClick={handleAddToCart}
              whileTap={{ scale: 0.97 }}
              disabled={!product.inStock}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-[14px] transition-all duration-200 disabled:opacity-50",
                addedToCart ? "bg-emerald-600 text-white" : "bg-stone-900 text-white hover:bg-stone-800",
              )}
            >
              {addedToCart ? (
                <>
                  <CheckCircle2 className="h-4 w-4" /> Added!
                </>
              ) : (
                <>
                  <ShoppingBag className="h-4 w-4" /> Add to Cart
                </>
              )}
            </motion.button>
          </div>
        </div>
        <MobileBottomNav />
      </div>
    </>
  );
}
