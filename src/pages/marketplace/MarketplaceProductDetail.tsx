import { useState } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowLeft,
  Search,
  ShoppingBag,
  Menu,
  Star,
  Heart,
  ChevronLeft,
  ChevronRight,
  Minus,
  Plus,
  Leaf,
  Truck,
  Shield,
  Award,
  CheckCircle2,
  Share2,
  Sparkles,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { skinLabsPicks, youMightAlsoLike } from "./marketplaceData";

const tabs = ["Description", "Ingredients", "How to Use", "Reviews"] as const;
type Tab = (typeof tabs)[number];

const ingredientsList = [
  "Aqua (Water)", "Ascorbic Acid (Vitamin C) 3%", "Niacinamide 5%",
  "Sodium Hyaluronate", "Panthenol (Vitamin B5)", "Glycerin",
  "Centella Asiatica Extract", "Tocopherol (Vitamin E)",
  "Aloe Barbadensis Leaf Juice", "Phenoxyethanol", "Sodium PCA",
];

const howToUseSteps = [
  "Apply 2–3 drops to clean, dry skin morning and evening.",
  "Gently press and pat into skin — avoid rubbing.",
  "Follow with your moisturiser and SPF 50+ during the day.",
  "For best results, use consistently for 4–6 weeks.",
];

function StarRating({ rating, size = "sm" }: { rating: number; size?: "sm" | "md" }) {
  const h = size === "md" ? "h-4 w-4" : "h-3 w-3";
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn(h, s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-stone-200 text-stone-200")}
        />
      ))}
    </div>
  );
}

const mockReviews = [
  {
    id: "r1",
    name: "Thandi M.",
    rating: 5,
    date: "August 2026",
    body: "Finally found a Vitamin C serum that doesn't irritate my sensitive skin. Noticeable improvement in brightness after 3 weeks.",
    verified: true,
  },
  {
    id: "r2",
    name: "Karabo S.",
    rating: 5,
    date: "July 2026",
    body: "Lightweight, absorbs quickly, and works brilliantly under my SPF. The niacinamide combo really helps with my PIH.",
    verified: true,
  },
  {
    id: "r3",
    name: "Lerato D.",
    rating: 4,
    date: "June 2026",
    body: "Great value for the actives included. I noticed less dark spots within the first month. Scent is neutral which I appreciate.",
    verified: true,
  },
];

export default function MarketplaceProductDetail() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const product = skinLabsPicks.find((p) => p.slug === slug) ?? skinLabsPicks[0];

  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [isSaved, setIsSaved] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>("Description");
  const [addedToCart, setAddedToCart] = useState(false);
  const [cartCount] = useState(2);

  const handleAddToCart = () => {
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const thumbnailColors = ["bg-stone-100", "bg-stone-200", "bg-amber-50", "bg-rose-50"];

  return (
    <>
      <Helmet>
        <title>{product.name} — {product.brand} | OpenHaus by SkinLabs®</title>
        <meta
          name="description"
          content={`${product.name} by ${product.brand}. ${product.description.slice(0, 155)}`}
        />
      </Helmet>

      <div className="min-h-screen bg-[#faf9f7] font-sans pb-24">
        {/* ── Header ── */}
        <header className="sticky top-0 z-40 bg-[#faf9f7]/95 backdrop-blur-sm border-b border-stone-100">
          <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
            <button
              onClick={() => navigate(-1)}
              className="p-2 -ml-2 rounded-full hover:bg-stone-100 transition-colors"
              aria-label="Go back"
            >
              <ArrowLeft className="h-5 w-5 text-stone-700" />
            </button>
            <Link to="/marketplace" className="flex flex-col items-center leading-none">
              <span className="font-black text-[13px] tracking-[0.12em] uppercase text-stone-900">OPENHAUS</span>
              <span className="text-[9px] text-stone-500 tracking-wide font-light">by skinlabs®</span>
            </Link>
            <div className="flex items-center gap-2">
              <button aria-label="Search" className="p-2 rounded-full hover:bg-stone-100 transition-colors">
                <Search className="h-5 w-5 text-stone-700" />
              </button>
              <button aria-label="Shopping bag" className="relative p-2 rounded-full hover:bg-stone-100 transition-colors">
                <ShoppingBag className="h-5 w-5 text-stone-700" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 h-4 w-4 bg-stone-900 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    {cartCount}
                  </span>
                )}
              </button>
              <button aria-label="Menu" className="p-2 rounded-full hover:bg-stone-100 transition-colors">
                <Menu className="h-5 w-5 text-stone-700" />
              </button>
            </div>
          </div>
        </header>

        {/* ── Breadcrumb ── */}
        <div className="max-w-lg mx-auto px-4 pt-3 pb-1">
          <nav className="flex items-center gap-1.5 text-[10px] text-stone-400 flex-wrap">
            {["Home", "Skincare", product.category + "s", product.brand].map((crumb, i, arr) => (
              <span key={crumb} className="flex items-center gap-1.5">
                <span className={i === arr.length - 1 ? "text-stone-600 font-medium" : "hover:text-stone-600 cursor-pointer"}>
                  {crumb}
                </span>
                {i < arr.length - 1 && <ChevronRight className="h-3 w-3" />}
              </span>
            ))}
          </nav>
        </div>

        {/* ── Product gallery ── */}
        <section className="max-w-lg mx-auto px-4 pt-2 pb-4">
          <div className="relative rounded-3xl overflow-hidden bg-stone-50 h-72">
            {/* badge */}
            {product.badge && (
              <div className="absolute top-3 left-3 z-10">
                <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-3 py-1 rounded-full">
                  {product.badge}
                </span>
              </div>
            )}
            {/* save */}
            <button
              onClick={() => setIsSaved(!isSaved)}
              className="absolute top-3 right-3 z-10 h-9 w-9 rounded-full bg-white shadow flex items-center justify-center hover:scale-110 transition-transform"
              aria-label="Save to wishlist"
            >
              <Heart
                className={cn(
                  "h-4 w-4 transition-colors duration-200",
                  isSaved ? "fill-red-400 text-red-400" : "text-stone-400"
                )}
              />
            </button>

            {/* Main image (placeholder — animated bottle shapes) */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeImage}
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.96 }}
                transition={{ duration: 0.25 }}
                className="absolute inset-0 flex items-center justify-center"
              >
                <div className="flex gap-4 items-end opacity-50">
                  {activeImage === 0 && (
                    <>
                      <div className="w-12 h-28 bg-stone-300 rounded-2xl shadow-lg" />
                      <div className="w-8 h-20 bg-stone-200 rounded-xl" />
                    </>
                  )}
                  {activeImage === 1 && (
                    <div className="w-16 h-16 bg-stone-300 rounded-full shadow-lg" />
                  )}
                  {activeImage === 2 && (
                    <>
                      <div className="w-10 h-24 bg-stone-300 rounded-2xl" />
                      <div className="w-10 h-24 bg-stone-200 rounded-2xl" />
                    </>
                  )}
                  {activeImage === 3 && (
                    <div className="relative w-20 h-24">
                      <div className="absolute inset-0 bg-stone-300 rounded-2xl" />
                      <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-3 bg-stone-400 rounded-b-xl" />
                    </div>
                  )}
                </div>
              </motion.div>
            </AnimatePresence>

            {/* prev/next */}
            <button
              onClick={() => setActiveImage((prev) => (prev - 1 + 4) % 4)}
              className="absolute left-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white transition-colors"
              aria-label="Previous image"
            >
              <ChevronLeft className="h-4 w-4 text-stone-600" />
            </button>
            <button
              onClick={() => setActiveImage((prev) => (prev + 1) % 4)}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white transition-colors"
              aria-label="Next image"
            >
              <ChevronRight className="h-4 w-4 text-stone-600" />
            </button>
          </div>

          {/* Thumbnails */}
          <div className="flex gap-2 mt-3">
            {thumbnailColors.map((color, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={cn(
                  "h-14 w-14 rounded-xl flex items-center justify-center transition-all duration-150",
                  color,
                  activeImage === i
                    ? "ring-2 ring-stone-900 ring-offset-1"
                    : "opacity-60 hover:opacity-100"
                )}
                aria-label={`View image ${i + 1}`}
              >
                <div className="w-4 h-8 bg-stone-300/70 rounded-lg" />
              </button>
            ))}
          </div>
        </section>

        {/* ── Product info ── */}
        <section className="max-w-lg mx-auto px-4 pb-4">
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
          >
            <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-stone-500 mb-1">{product.brand}</p>
            <h1 className="font-black text-[22px] leading-tight text-stone-900 tracking-tight mb-1">{product.name}</h1>
            <p className="text-[12px] text-stone-400 font-medium mb-3">{product.benefits.join(" • ")}</p>

            <div className="flex items-center gap-2 mb-4">
              <StarRating rating={product.rating} size="md" />
              <span className="text-[12px] text-stone-600 font-medium">
                {product.rating} ({product.reviewCount} reviews)
              </span>
            </div>

            <div className="flex items-baseline gap-1 mb-3">
              <span className="font-black text-[28px] text-stone-900">R {product.price}</span>
            </div>

            <div className="flex items-center gap-3 text-[12px] mb-5">
              <div className="flex items-center gap-1.5 text-emerald-600">
                <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                <span className="font-medium">In stock</span>
              </div>
              <span className="text-stone-300">•</span>
              <span className="text-stone-500">Free delivery over R800</span>
            </div>

            {/* Quantity */}
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

            {/* CTAs */}
            <div className="flex flex-col gap-2">
              <motion.button
                onClick={handleAddToCart}
                whileTap={{ scale: 0.98 }}
                className={cn(
                  "w-full flex items-center justify-center gap-2 rounded-2xl py-4 font-bold text-[14px] transition-all duration-200",
                  addedToCart
                    ? "bg-emerald-600 text-white"
                    : "bg-stone-900 text-white hover:bg-stone-800"
                )}
              >
                {addedToCart ? (
                  <>
                    <CheckCircle2 className="h-4.5 w-4.5" />
                    Added to cart
                  </>
                ) : (
                  <>
                    <ShoppingBag className="h-4.5 w-4.5" />
                    Add to Cart
                  </>
                )}
              </motion.button>
              <button
                onClick={() => setIsSaved(!isSaved)}
                className="w-full flex items-center justify-center gap-2 rounded-2xl py-3.5 font-semibold text-[13px] border border-stone-200 text-stone-700 hover:bg-stone-50 transition-colors"
              >
                <Heart className={cn("h-4 w-4", isSaved ? "fill-red-400 text-red-400" : "")} />
                {isSaved ? "Saved to Wishlist" : "Save to Wishlist"}
              </button>
            </div>
          </motion.div>
        </section>

        {/* ── Trust row ── */}
        <section className="max-w-lg mx-auto px-4 pb-6">
          <div className="grid grid-cols-4 gap-2 border-t border-b border-stone-100 py-4">
            {[
              { icon: <Leaf className="h-4 w-4" />, title: "Clean & Scientific", sub: "High-performance formulas" },
              { icon: <Truck className="h-4 w-4" />, title: "Fast Shipping", sub: "2–5 working days (SA)" },
              { icon: <Shield className="h-4 w-4" />, title: "Secure Checkout", sub: "Multiple payment options" },
              { icon: <Award className="h-4 w-4" />, title: "Trusted Brand", sub: "Loved by 50k+ customers" },
            ].map((trust) => (
              <div key={trust.title} className="flex flex-col items-center text-center gap-1">
                <div className="h-9 w-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                  {trust.icon}
                </div>
                <p className="text-[9px] font-semibold text-stone-800 leading-tight">{trust.title}</p>
                <p className="text-[8px] text-stone-400 leading-tight">{trust.sub}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Tabs ── */}
        <section className="max-w-lg mx-auto px-4 pb-6">
          {/* Tab bar */}
          <div className="flex border-b border-stone-100 mb-5 overflow-x-auto scrollbar-hide">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-shrink-0 pb-3 px-1 mr-5 text-[13px] font-semibold transition-colors border-b-2 -mb-px",
                  activeTab === tab
                    ? "border-stone-900 text-stone-900"
                    : "border-transparent text-stone-400 hover:text-stone-600"
                )}
              >
                {tab === "Reviews" ? `Reviews (${product.reviewCount})` : tab}
              </button>
            ))}
          </div>

          {/* Tab content */}
          <AnimatePresence mode="wait">
            {activeTab === "Description" && (
              <motion.div
                key="description"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <h3 className="font-bold text-[16px] text-stone-900 mb-3">Healthy, radiant skin — naturally.</h3>
                <p className="text-[13px] text-stone-600 leading-relaxed mb-3">{product.description}</p>
                <p className="text-[13px] text-stone-500 leading-relaxed mb-6">
                  Suitable for daily use morning and evening. Layers beautifully under moisturiser and SPF. Compatible with all skin types, including sensitive and reactive skin.
                </p>

                {/* Metadata grid */}
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { label: "Key Actives", icon: <Sparkles className="h-4 w-4" />, value: product.keyActives.join(", ") },
                    { label: "Targets", icon: <Leaf className="h-4 w-4" />, value: product.targets },
                    { label: "Skin Type", icon: <Shield className="h-4 w-4" />, value: product.skinType },
                    { label: "Size", icon: <Award className="h-4 w-4" />, value: product.size },
                  ].map((meta) => (
                    <div key={meta.label} className="bg-stone-50 rounded-2xl p-3">
                      <div className="flex items-center gap-1.5 text-stone-500 mb-1.5">
                        {meta.icon}
                        <span className="text-[10px] font-semibold uppercase tracking-wider">{meta.label}</span>
                      </div>
                      <p className="text-[12px] text-stone-700 font-medium leading-snug">{meta.value}</p>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {activeTab === "Ingredients" && (
              <motion.div
                key="ingredients"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="bg-amber-50 border border-amber-100 rounded-2xl p-3 mb-4 flex items-start gap-2">
                  <Shield className="h-4 w-4 text-amber-600 flex-shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-700 leading-relaxed">
                    Ingredient lists are provided by the brand and may change with reformulations. Always patch test new products.
                  </p>
                </div>
                <ul className="space-y-2">
                  {ingredientsList.map((ingredient) => (
                    <li key={ingredient} className="flex items-center gap-2 py-2 border-b border-stone-50 last:border-0">
                      <div className="h-1.5 w-1.5 bg-stone-300 rounded-full flex-shrink-0" />
                      <span className="text-[13px] text-stone-700">{ingredient}</span>
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {activeTab === "How to Use" && (
              <motion.div
                key="how-to-use"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                <div className="space-y-4">
                  {howToUseSteps.map((step, i) => (
                    <div key={i} className="flex gap-3 items-start">
                      <div className="h-7 w-7 rounded-full bg-stone-900 text-white flex items-center justify-center flex-shrink-0 text-[12px] font-bold">
                        {i + 1}
                      </div>
                      <p className="text-[13px] text-stone-600 leading-relaxed pt-0.5">{step}</p>
                    </div>
                  ))}
                </div>
                <div className="mt-6 bg-stone-50 rounded-2xl p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-[11px] font-semibold text-stone-700">SkinLabs® Tip</span>
                  </div>
                  <p className="text-[12px] text-stone-500 leading-relaxed">
                    For best results in South Africa's climate, apply on slightly damp skin after cleansing to boost absorption. Follow with a broad-spectrum SPF 50+ every morning.
                  </p>
                </div>
              </motion.div>
            )}

            {activeTab === "Reviews" && (
              <motion.div
                key="reviews"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={{ duration: 0.2 }}
              >
                {/* Summary */}
                <div className="flex items-center gap-4 mb-5 p-4 bg-stone-50 rounded-2xl">
                  <div className="text-center">
                    <p className="font-black text-[36px] text-stone-900 leading-none">{product.rating}</p>
                    <StarRating rating={product.rating} size="md" />
                    <p className="text-[10px] text-stone-400 mt-1">{product.reviewCount} reviews</p>
                  </div>
                  <div className="flex-1 space-y-1.5">
                    {[5, 4, 3, 2, 1].map((stars) => {
                      const pct = stars === 5 ? 71 : stars === 4 ? 20 : stars === 3 ? 6 : stars === 2 ? 2 : 1;
                      return (
                        <div key={stars} className="flex items-center gap-2">
                          <span className="text-[10px] text-stone-500 w-3">{stars}</span>
                          <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                            <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                          </div>
                          <span className="text-[10px] text-stone-400 w-6 text-right">{pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Review cards */}
                <div className="space-y-4">
                  {mockReviews.map((review) => (
                    <div key={review.id} className="border border-stone-100 rounded-2xl p-4">
                      <div className="flex items-center justify-between mb-2">
                        <div>
                          <p className="font-semibold text-[13px] text-stone-900">{review.name}</p>
                          <p className="text-[10px] text-stone-400">{review.date}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          <StarRating rating={review.rating} />
                          {review.verified && (
                            <span className="text-[9px] text-emerald-600 font-medium flex items-center gap-0.5">
                              <CheckCircle2 className="h-2.5 w-2.5" /> Verified
                            </span>
                          )}
                        </div>
                      </div>
                      <p className="text-[12px] text-stone-600 leading-relaxed">{review.body}</p>
                    </div>
                  ))}
                  <button className="w-full py-3 border border-stone-200 rounded-2xl text-[13px] font-semibold text-stone-700 hover:bg-stone-50 transition-colors">
                    Load more reviews
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </section>

        {/* ── You might also like ── */}
        <section className="max-w-lg mx-auto px-4 pb-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[16px] text-stone-900">You might also like</h2>
            <button className="text-[12px] text-stone-500 font-medium flex items-center gap-1">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="flex gap-3 overflow-x-auto scrollbar-hide pb-2">
            {youMightAlsoLike.map((item) => (
              <Link
                key={item.id}
                to={`/marketplace/product/${item.slug}`}
                className="flex-shrink-0 w-36 bg-white rounded-2xl border border-stone-100 overflow-hidden hover:border-stone-200 hover:shadow-md transition-all"
              >
                <div className="h-28 bg-stone-50 flex items-center justify-center relative">
                  <div className="w-8 h-16 bg-stone-200 rounded-xl opacity-50" />
                  <button
                    onClick={(e) => e.preventDefault()}
                    className="absolute top-2 right-2 h-6 w-6 bg-white rounded-full flex items-center justify-center shadow"
                  >
                    <Heart className="h-3 w-3 text-stone-400" />
                  </button>
                </div>
                <div className="p-2.5">
                  <p className="text-[9px] font-bold uppercase tracking-wide text-stone-400 truncate">{item.brand}</p>
                  <p className="font-semibold text-[11px] text-stone-900 leading-snug line-clamp-2 mt-0.5">{item.name}</p>
                  <div className="flex items-center justify-between mt-2">
                    <span className="font-bold text-[13px] text-stone-900">R {item.price}</span>
                    <button
                      onClick={(e) => e.preventDefault()}
                      className="h-7 w-7 bg-stone-900 rounded-lg flex items-center justify-center hover:bg-stone-700 transition-colors"
                      aria-label="Add to bag"
                    >
                      <ShoppingBag className="h-3.5 w-3.5 text-white" />
                    </button>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Sticky bottom bar ── */}
        <div className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-t border-stone-100">
          <div className="max-w-lg mx-auto px-4 py-3 flex items-center gap-4">
            <div>
              <p className="font-black text-[18px] text-stone-900">R {product.price}</p>
              <div className="flex items-center gap-1 text-[10px] text-emerald-600">
                <div className="h-1.5 w-1.5 bg-emerald-500 rounded-full" />
                <span>In stock • Free delivery over R800</span>
              </div>
            </div>
            <motion.button
              onClick={handleAddToCart}
              whileTap={{ scale: 0.97 }}
              className={cn(
                "flex-1 flex items-center justify-center gap-2 rounded-2xl py-3.5 font-bold text-[14px] transition-all duration-200",
                addedToCart ? "bg-emerald-600 text-white" : "bg-stone-900 text-white hover:bg-stone-800"
              )}
            >
              {addedToCart ? (
                <><CheckCircle2 className="h-4 w-4" /> Added!</>
              ) : (
                <><ShoppingBag className="h-4 w-4" /> Add to Cart</>
              )}
            </motion.button>
          </div>
        </div>
      </div>
    </>
  );
}
