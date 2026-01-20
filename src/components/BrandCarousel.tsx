import { useEffect, useState } from "react";

const BrandCarousel = () => {
  const [currentIndex, setCurrentIndex] = useState(0);

  // Popular South African skincare brands
  const brands = [
    { name: "SKOON.", color: "#E8D5C4" },
    { name: "Standard Skin", color: "#F5E6D3" },
    { name: "Lelive", color: "#D4E4D8" },
    { name: "Suki Suki Naturals", color: "#F4E4D4" },
    { name: "Esse", color: "#E5DDD5" },
    { name: "African Botanics", color: "#D9E5D6" },
    { name: "Umalusi", color: "#E8E0D5" },
    { name: "Skin Creamery", color: "#F0E5DA" },
    { name: "L'Organiq", color: "#DDE5E0" },
    { name: "Africology", color: "#E7E3D8" },
  ];

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => (prevIndex + 1) % brands.length);
    }, 3000); // Rotate every 3 seconds

    return () => clearInterval(interval);
  }, [brands.length]);

  const getVisibleBrands = () => {
    const visible = [];
    for (let i = 0; i < 5; i++) {
      visible.push(brands[(currentIndex + i) % brands.length]);
    }
    return visible;
  };

  return (
    <section className="py-16 bg-gradient-to-b from-background to-secondary/10">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <p className="text-sm font-medium text-primary uppercase tracking-wider mb-2">
            Curated Brands
          </p>
          <h2 className="text-3xl md:text-4xl font-heading font-bold text-foreground mb-4">
            Premium South African Skincare
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            We partner with the finest South African skincare brands to curate personalized 
            skincare kits tailored to your unique needs. Available through our online marketplace.
          </p>
        </div>

        <div className="relative overflow-hidden">
          <div className="flex gap-6 justify-center items-center">
            {getVisibleBrands().map((brand, index) => (
              <div
                key={`${brand.name}-${index}`}
                className="flex-shrink-0 w-48 h-32 rounded-xl shadow-lg flex items-center justify-center transition-all duration-500 hover:scale-105"
                style={{ backgroundColor: brand.color }}
              >
                <span className="text-xl font-semibold text-gray-800 text-center px-4">
                  {brand.name}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div className="flex justify-center gap-2 mt-8">
          {brands.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? "bg-primary w-8"
                  : "bg-muted-foreground/30 hover:bg-muted-foreground/50"
              }`}
              aria-label={`Go to slide ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default BrandCarousel;
