import { useState, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Helmet } from "react-helmet-async";
import { motion, AnimatePresence } from "framer-motion";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import {
  Search,
  ShoppingBag,
  Menu,
  Star,
  Heart,
  ChevronRight,
  ArrowRight,
  Leaf,
  Truck,
  Shield,
  Users,
  Sparkles,
  Home,
  Tag,
  Bookmark,
  User,
  MapPin,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { skinLabsPicks, featuredBrands, concerns, categories } from "./marketplaceData";
import { cn } from "@/lib/utils";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.25, 0.1, 0.25, 1] } },
};

const stagger = {
  visible: { transition: { staggerChildren: 0.08 } },
};

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((s) => (
        <Star
          key={s}
          className={cn("h-3 w-3", s <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "fill-muted text-muted")}
        />
      ))}
    </div>
  );
}

const badgeColors: Record<string, string> = {
  BESTSELLER: "bg-amber-100 text-amber-800",
  NEW: "bg-emerald-100 text-emerald-800",
  POPULAR: "bg-orange-100 text-orange-800",
};

export default function MarketplaceLanding() {
  const navigate = useNavigate();
  const [cartCount] = useState(0);
  const [savedProducts, setSavedProducts] = useState<Set<string>>(new Set());
  const [activeCategory, setActiveCategory] = useState("face");

  const [emblaRef, emblaApi] = useEmblaCarousel(
    { loop: true, align: "start" },
    [Autoplay({ delay: 3800, stopOnInteraction: true })]
  );

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  const toggleSaved = (id: string) => {
    setSavedProducts((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  return (
    <>
      <Helmet>
        <title>OpenHaus Marketplace | Curated South African Skincare — SkinLabs®</title>
        <meta
          name="description"
          content="Discover trusted skincare from South African brands, curated by SkinLabs®. Shop serums, moisturisers, SPF and more — all independently reviewed."
        />
      </Helmet>

      <div className="min-h-screen bg-[#faf9f7] font-sans">
        {/* ── Header ── */}
        <header className="sticky top-0 z-40 bg-[#faf9f7]/95 backdrop-blur-sm border-b border-stone-100">
          <div className="flex items-center justify-between px-4 h-14 max-w-lg mx-auto">
            <Link to="/marketplace" className="flex items-center gap-2 min-w-0">
              <div className="flex flex-col leading-none">
                <span className="font-black text-[13px] tracking-[0.12em] uppercase text-stone-900">OPENHAUS</span>
                <span className="text-[10px] text-stone-500 tracking-wide font-light">by skinlabs®</span>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <button
                aria-label="Search products"
                className="p-2 rounded-full hover:bg-stone-100 transition-colors"
                onClick={() => navigate("/reviews")}
              >
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

        {/* ── Hero ── */}
        <section className="relative overflow-hidden">
          <div className="max-w-lg mx-auto px-4 pt-8 pb-6 flex items-start gap-4">
            <motion.div
              className="flex-1 min-w-0 z-10"
              initial="hidden"
              animate="visible"
              variants={stagger}
            >
              <motion.div variants={fadeUp}>
                <span className="inline-block text-[10px] font-semibold tracking-[0.2em] uppercase text-stone-600 border border-stone-200 rounded-full px-3 py-1 bg-white mb-4">
                  SkinLabs® Marketplace
                </span>
              </motion.div>
              <motion.h1
                variants={fadeUp}
                className="font-black text-[2.1rem] leading-[1.08] tracking-tight text-stone-900 mb-3"
              >
                Your skincare shelf,{" "}
                <span className="italic font-light">reimagined.</span>
              </motion.h1>
              <motion.p variants={fadeUp} className="text-[13px] text-stone-500 leading-relaxed mb-6 max-w-[240px]">
                Discover trusted skincare from South African brands, curated by SkinLabs®.
              </motion.p>
              <motion.div variants={fadeUp} className="flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="bg-stone-900 text-white hover:bg-stone-800 rounded-full px-5 h-10 text-[13px] font-semibold gap-1"
                  onClick={() => document.getElementById("skinlabs-picks")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Shop skincare <ArrowRight className="h-3.5 w-3.5" />
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-stone-300 text-stone-700 hover:bg-stone-50 rounded-full px-5 h-10 text-[13px] font-medium"
                  onClick={() => document.getElementById("featured-brands")?.scrollIntoView({ behavior: "smooth" })}
                >
                  Explore brands
                </Button>
              </motion.div>
            </motion.div>

            {/* Hero visual */}
            <motion.div
              className="relative w-[160px] h-[180px] flex-shrink-0"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.7, delay: 0.2, ease: [0.25, 0.1, 0.25, 1] }}
            >
              <div className="absolute inset-0 rounded-3xl bg-gradient-to-br from-purple-100 via-pink-50 to-amber-50" />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="relative flex gap-2 items-end">
                  <motion.div
                    animate={{ y: [0, -6, 0] }}
                    transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    className="w-9 h-20 bg-stone-900 rounded-2xl shadow-lg"
                  />
                  <motion.div
                    animate={{ y: [0, -4, 0] }}
                    transition={{ duration: 3.4, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                    className="w-7 h-14 bg-stone-200 rounded-xl shadow-md"
                  />
                  <motion.div
                    animate={{ y: [0, -8, 0] }}
                    transition={{ duration: 2.8, repeat: Infinity, ease: "easeInOut", delay: 0.6 }}
                    className="w-8 h-16 bg-stone-100 rounded-xl border border-stone-200 shadow-sm"
                  />
                  <motion.div
                    animate={{ y: [0, -5, 0] }}
                    transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.9 }}
                    className="w-5 h-12 bg-amber-100 rounded-lg shadow"
                  />
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* ── Category pills ── */}
        <section className="max-w-lg mx-auto px-4 pb-6">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide pb-1">
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id)}
                className={cn(
                  "flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-full text-[12px] font-medium border transition-all duration-200",
                  activeCategory === cat.id
                    ? "bg-stone-900 text-white border-stone-900"
                    : "bg-white text-stone-700 border-stone-200 hover:border-stone-400"
                )}
              >
                <span className="text-[14px]">{cat.icon}</span>
                {cat.label}
              </button>
            ))}
          </div>
        </section>

        {/* ── Shop by concern ── */}
        <section className="max-w-lg mx-auto px-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[18px] text-stone-900 tracking-tight">Shop by concern</h2>
            <button className="text-[12px] text-stone-500 font-medium flex items-center gap-1 hover:text-stone-700 transition-colors">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>
          <motion.div
            className="grid grid-cols-2 gap-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
          >
            {concerns.map((concern) => (
              <motion.div key={concern.id} variants={fadeUp}>
                <Link
                  to={`/marketplace/concern/${concern.slug}`}
                  className={cn(
                    "block rounded-2xl p-4 min-h-[100px] relative overflow-hidden group cursor-pointer",
                    concern.colorClass
                  )}
                >
                  <div className="absolute inset-0 bg-white/0 group-hover:bg-white/20 transition-colors duration-200" />
                  <div className="h-8 w-8 rounded-full bg-white/50 mb-6" />
                  <div>
                    <p className="font-semibold text-[13px] text-stone-800 leading-tight">{concern.label}</p>
                    <ArrowRight className="h-4 w-4 text-stone-600 mt-1" />
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── Featured brands ── */}
        <section id="featured-brands" className="max-w-lg mx-auto px-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[18px] text-stone-900 tracking-tight">Featured brands</h2>
            <button className="text-[12px] text-stone-500 font-medium flex items-center gap-1 hover:text-stone-700 transition-colors">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Autoplay brand carousel */}
          <div className="overflow-hidden" ref={emblaRef}>
            <div className="flex gap-3">
              {[...featuredBrands, ...featuredBrands].map((brand, i) => (
                <motion.div
                  key={`${brand.id}-${i}`}
                  className="flex-shrink-0 w-[calc(50%-6px)]"
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Link
                    to={`/marketplace/brand/${brand.slug}`}
                    className="block rounded-2xl bg-stone-900 overflow-hidden"
                  >
                    <div className="h-20 flex items-center justify-center">
                      <span
                        className={cn(
                          "text-xl text-white",
                          brand.id === "standard-beauty" ? "font-light text-lg" :
                          brand.id === "esse" ? "italic font-thin text-2xl tracking-widest" :
                          brand.id === "lelive" ? "font-light text-xl tracking-widest" :
                          "font-black text-xl tracking-widest"
                        )}
                      >
                        {brand.logoText}
                      </span>
                    </div>
                    <div className="px-3 pb-3 flex items-center justify-between">
                      <div className="flex items-center gap-1 text-stone-400 text-[10px]">
                        <MapPin className="h-3 w-3" />
                        {brand.origin}
                      </div>
                      <ChevronRight className="h-3.5 w-3.5 text-stone-500" />
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-3">
            <button
              onClick={scrollPrev}
              className="h-7 w-7 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-colors"
            >
              <ChevronLeft className="h-4 w-4 text-stone-600" />
            </button>
            <button
              onClick={scrollNext}
              className="h-7 w-7 rounded-full border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-colors"
            >
              <ChevronRight className="h-4 w-4 text-stone-600" />
            </button>
          </div>
        </section>

        {/* ── SkinLabs picks ── */}
        <section id="skinlabs-picks" className="max-w-lg mx-auto px-4 pb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-bold text-[18px] text-stone-900 tracking-tight">SkinLabs picks</h2>
            <button className="text-[12px] text-stone-500 font-medium flex items-center gap-1 hover:text-stone-700 transition-colors">
              View all <ChevronRight className="h-3.5 w-3.5" />
            </button>
          </div>

          <motion.div
            className="grid grid-cols-2 gap-3"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-40px" }}
            variants={stagger}
          >
            {skinLabsPicks.map((product) => (
              <motion.div key={product.id} variants={fadeUp}>
                <Link to={`/marketplace/product/${product.slug}`} className="block">
                  <div className="bg-white rounded-2xl overflow-hidden border border-stone-100 hover:border-stone-200 hover:shadow-md transition-all duration-200">
                    {/* Product image area */}
                    <div className="relative bg-stone-50 h-40 flex items-center justify-center">
                      {product.badge && (
                        <span
                          className={cn(
                            "absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full",
                            badgeColors[product.badge]
                          )}
                        >
                          {product.badge}
                        </span>
                      )}
                      <button
                        onClick={(e) => { e.preventDefault(); toggleSaved(product.id); }}
                        className="absolute top-2 right-2 h-7 w-7 rounded-full bg-white shadow-sm flex items-center justify-center hover:scale-110 transition-transform"
                      >
                        <Heart
                          className={cn(
                            "h-3.5 w-3.5 transition-colors",
                            savedProducts.has(product.id) ? "fill-red-400 text-red-400" : "text-stone-400"
                          )}
                        />
                      </button>
                      {/* Product visual placeholder */}
                      <div className="flex flex-col items-center gap-1 opacity-40">
                        <div className="w-8 h-16 bg-stone-300 rounded-xl" />
                        <div className="w-12 h-2 bg-stone-200 rounded" />
                      </div>
                    </div>

                    {/* Product info */}
                    <div className="p-3">
                      <div className="flex items-center gap-1 mb-1">
                        <StarRating rating={product.rating} />
                        <span className="text-[10px] text-stone-500">({product.reviewCount})</span>
                      </div>
                      <p className="text-[10px] text-stone-400 font-medium uppercase tracking-wide truncate">{product.brand}</p>
                      <p className="font-semibold text-[12px] text-stone-900 leading-snug mt-0.5 line-clamp-2">{product.name}</p>
                      <p className="text-[10px] text-stone-500 mt-1 truncate">{product.benefits.join(" • ")}</p>
                      <p className="font-bold text-[14px] text-stone-900 mt-2">R {product.price}</p>
                      <button
                        onClick={(e) => e.preventDefault()}
                        className="mt-2 w-full flex items-center justify-center gap-1.5 bg-stone-900 text-white rounded-xl py-2 text-[11px] font-semibold hover:bg-stone-800 transition-colors"
                      >
                        <ShoppingBag className="h-3 w-3" />
                        Add to bag
                      </button>
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </motion.div>
        </section>

        {/* ── AI Routine builder promo ── */}
        <section className="max-w-lg mx-auto px-4 pb-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="rounded-3xl bg-gradient-to-br from-stone-900 via-stone-800 to-stone-700 p-6 relative overflow-hidden"
          >
            {/* bg decoration */}
            <div className="absolute top-0 right-0 w-40 h-40 rounded-full bg-white/5 -translate-y-8 translate-x-8" />
            <div className="absolute bottom-0 left-0 w-24 h-24 rounded-full bg-white/5 translate-y-8 -translate-x-8" />

            <div className="relative flex items-start gap-4">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  <Sparkles className="h-4 w-4 text-amber-400" />
                  <span className="text-amber-400 text-[10px] font-semibold tracking-wider uppercase">SkinLabs® AI</span>
                </div>
                <h3 className="font-bold text-white text-[16px] leading-snug mb-2">
                  Build your smart routine with AI
                </h3>
                <p className="text-stone-300 text-[12px] leading-relaxed mb-4">
                  Get personalised skincare routines based on your skin type, South African climate and budget.
                </p>
                <Link
                  to="/skynn-ai"
                  className="inline-flex items-center gap-2 bg-white text-stone-900 rounded-full px-4 py-2.5 text-[12px] font-bold hover:bg-stone-100 transition-colors"
                >
                  Build my routine <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              {/* mini card visual */}
              <div className="flex-shrink-0 w-28 bg-white/10 backdrop-blur rounded-2xl p-3 border border-white/10">
                <p className="text-[9px] font-semibold text-white/80 mb-2">SkinLabs® AI</p>
                {["Your skin type", "SA climate", "Your budget"].map((item) => (
                  <div key={item} className="flex items-center gap-1.5 mb-1.5">
                    <div className="h-3 w-3 rounded-full bg-emerald-400 flex items-center justify-center flex-shrink-0">
                      <span className="text-[6px] text-white font-bold">✓</span>
                    </div>
                    <span className="text-[9px] text-white/70">{item}</span>
                  </div>
                ))}
                <Sparkles className="h-3 w-3 text-amber-400 mt-1 ml-auto" />
              </div>
            </div>
          </motion.div>
        </section>

        {/* ── Trust badges ── */}
        <section className="max-w-lg mx-auto px-4 pb-24">
          <div className="grid grid-cols-4 gap-3">
            {[
              { icon: <Shield className="h-4 w-4" />, label: "Curated by SkinLabs®" },
              { icon: <Leaf className="h-4 w-4" />, label: "South African skin & climate" },
              { icon: <Shield className="h-4 w-4" />, label: "Secure checkout" },
              { icon: <Users className="h-4 w-4" />, label: "Multiple trusted brands" },
            ].map((trust) => (
              <div key={trust.label} className="flex flex-col items-center gap-1.5 text-center">
                <div className="h-9 w-9 rounded-full bg-stone-100 flex items-center justify-center text-stone-600">
                  {trust.icon}
                </div>
                <p className="text-[9px] text-stone-500 leading-tight font-medium">{trust.label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── Mobile bottom nav ── */}
        <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-stone-100">
          <div className="max-w-lg mx-auto flex items-center justify-around h-16">
            {[
              { icon: <Home className="h-5 w-5" />, label: "Home", href: "/marketplace", active: true },
              { icon: <Tag className="h-5 w-5" />, label: "Brands", href: "/marketplace/brands" },
              { icon: <Menu className="h-5 w-5" />, label: "Categories", href: "/marketplace/categories" },
              { icon: <Bookmark className="h-5 w-5" />, label: "Saved", href: "/marketplace/saved" },
              { icon: <User className="h-5 w-5" />, label: "Account", href: "/dashboard" },
            ].map((item) => (
              <Link
                key={item.label}
                to={item.href}
                className={cn(
                  "flex flex-col items-center gap-1 px-3 py-1 transition-colors",
                  item.active ? "text-stone-900" : "text-stone-400 hover:text-stone-600"
                )}
              >
                {item.icon}
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </>
  );
}
