import ProductCard from "./ProductCard";
import FeaturedCheckout from "@/components/FeaturedCheckout";
import productBodyOilSerum from "@/assets/product-body-oil-serum.png";
import productBodyBarBundle from "@/assets/product-body-bar-bundle.png";
import productFoamingScrub from "@/assets/product-foaming-scrub.jpeg";
import productFacialMoisturizer from "@/assets/product-facial-moisturizer.png";

const products = [
  {
    id: 1,
    name: "SkinLabs® Classic Body Oil Serum [50ml]",
    category: "Serums",
    price: 225,
    image: productBodyOilSerum,
    rating: 5,
    badge: "Bestseller",
    variants: [
      "Butterfly Pea Flower & Chamomile",
      "Moringa",
      "Aloe Vera and Hemp",
      "Sea Salt",
      "Rosewater and Citrus",
      "Yoni, Lemongrass and Bergamot",
    ],
  },
  {
    id: 2,
    name: "SkinLabs® Organic Body Bar Bundle [100g x 3]",
    category: "Body Care",
    price: 249,
    image: productBodyBarBundle,
    rating: 4,
    variants: [
      "ACTIVATED CHARCOAL infused with LEMONGRASS",
      "LICORICE ROOT infused with COCONUT EXTRACT",
      "NIACINAMIDE infused with ROSEWATER",
    ],
  },
  {
    id: 3,
    name: "SkinLabs® Foaming Body Scrub [200ml] (Made To Order)",
    category: "Body Care",
    price: 395,
    image: productFoamingScrub,
    rating: 5,
    variants: [
      "Healing Himalayan Rose",
      "Brightening Turmeric, Papaya & Carrot",
      "Soothing Licorice Root",
    ],
    customNote:
      "Custom body scrub formulations can be requested by contacting our support team.",
  },
  {
    id: 4,
    name: "SkinLabs® Advanced Facial Moisturizer [30ml]",
    category: "Moisturizers",
    price: 295,
    image: productFacialMoisturizer,
    rating: 5,
    badge: "New!",
    variants: [
      "Pomegranate + Goji Berry enhanced with SPF30",
      "Turmeric + Sandalwood enhanced with SPF15",
      "Peppermint + Blue Chamomile enhanced with SPF10",
    ],
  },
];

const Products = () => {
  return (
    <section id="products" className="py-20 bg-secondary/30">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            Our Collection
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Premium Skincare Collection
          </h2>
          <p className="text-muted-foreground">
            Curated selection of next-generation skincare formulations
            crafted from organically sourced ingredients.
          </p>
        </div>

        {/* Products grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

        <FeaturedCheckout products={products} />

        {/* View all link */}
        <div className="text-center mt-10">
          <a
            href="#"
            className="inline-flex items-center gap-2 text-primary font-medium hover:underline"
          >
            View All Products
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Products;
