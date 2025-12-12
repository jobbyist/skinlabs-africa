import ProductCard from "./ProductCard";
import productLedMask from "@/assets/product-led-mask.jpg";
import productUltrasonic from "@/assets/product-ultrasonic.jpg";
import productMicrocurrent from "@/assets/product-microcurrent.jpg";
import productSerum from "@/assets/product-serum.jpg";

const products = [
  {
    id: 1,
    name: "LED Phototherapy Mask Pro",
    category: "Devices",
    price: 299.99,
    originalPrice: 399.99,
    image: productLedMask,
    rating: 5,
    badge: "Bestseller",
  },
  {
    id: 2,
    name: "Ultrasonic Skin Scrubber",
    category: "Devices",
    price: 89.99,
    image: productUltrasonic,
    rating: 4,
  },
  {
    id: 3,
    name: "Microcurrent Face Sculptor",
    category: "Devices",
    price: 199.99,
    image: productMicrocurrent,
    rating: 5,
    badge: "New",
  },
  {
    id: 4,
    name: "Vitamin C Brightening Serum",
    category: "Serums",
    price: 64.99,
    image: productSerum,
    rating: 5,
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
            Premium Skincare Technology
          </h2>
          <p className="text-muted-foreground">
            Curated selection of next-generation skincare devices and formulations
            imported from leading laboratories worldwide.
          </p>
        </div>

        {/* Category tabs */}
        <div className="flex justify-center gap-4 mb-10">
          {["All", "Devices", "Serums", "Custom"].map((tab, index) => (
            <button
              key={tab}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                index === 0
                  ? "bg-primary text-primary-foreground"
                  : "bg-card text-muted-foreground hover:text-foreground border border-border"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Products grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {products.map((product) => (
            <ProductCard key={product.id} {...product} />
          ))}
        </div>

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
