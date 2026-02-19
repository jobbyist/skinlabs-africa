import bannerImage from "@/assets/banner-skincare.png";

const BrandCarousel = () => {
  return (
    <section className="w-full">
      <img
        src={bannerImage}
        alt="Natural & Nourishing Skincare – For All Skin Types, Vegan, Cruelty Free"
        className="w-full h-auto object-cover"
      />
    </section>
  );
};

export default BrandCarousel;
