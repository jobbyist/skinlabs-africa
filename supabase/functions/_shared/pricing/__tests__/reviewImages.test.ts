import { describe, expect, test } from "bun:test";
import { extractProductImages, imageResponseOk, rankProductPages, resolveImageUrl } from "../reviewImages.ts";

const shopify = `<html><head>
<meta property="og:title" content="Jelly Splash | lelive">
<meta property="og:image" content="//leliveafrica.com/cdn/shop/files/jelly-splash_1200x.jpg?v=171">
<meta name="twitter:image" content="https://leliveafrica.com/cdn/shop/files/jelly-splash_600x.jpg?v=171">
<script type="application/ld+json">{"@context":"https://schema.org","@type":"Product","name":"Jelly Splash","image":["https://leliveafrica.com/cdn/shop/files/jelly-splash-back.jpg"]}</script>
</head></html>`;

const woo = `<meta property='og:image' content='https://www.esseskincare.co.za/wp-content/uploads/2023/05/probiotic-cleanser-300x300.png' />
<meta property="og:image" content="https://www.esseskincare.co.za/wp-content/uploads/logo.png">`;

describe("extractProductImages", () => {
  test("Shopify: protocol-relative og:image, size variants collapse, json-ld added", () => {
    const imgs = extractProductImages(shopify, "https://leliveafrica.com/products/jelly-splash");
    expect(imgs.map((i) => i.via)).toEqual(["og:image", "json-ld"]);
    expect(imgs[0].url.startsWith("https://leliveafrica.com/cdn/shop/files/jelly-splash")).toBe(true);
    expect(imgs[0].alt).toBe("Jelly Splash | lelive");
  });
  test("single-quoted attributes work and logos are dropped", () => {
    const imgs = extractProductImages(woo, "https://www.esseskincare.co.za/product/probiotic-cleanser");
    expect(imgs).toHaveLength(1);
    expect(imgs[0].url).toContain("probiotic-cleanser");
  });
  test("json-ld @graph and ImageObject", () => {
    const html = `<script type="application/ld+json">{"@graph":[{"@type":"Product","name":"X","image":{"@type":"ImageObject","url":"/media/x.jpg"}}]}</script>`;
    expect(extractProductImages(html, "https://shop.example/p/x")[0].url).toBe("https://shop.example/media/x.jpg");
  });
  test("nothing usable -> empty", () => {
    expect(extractProductImages("<html><meta property='og:image' content='https://x.com/logo.svg'></html>", "https://x.com/p")).toEqual([]);
    expect(extractProductImages("<html></html>", "https://x.com/p")).toEqual([]);
  });
});

describe("page <img> fallback", () => {
  test("Clicks-style primary product image with a context URL and no extension", () => {
    const html = `<img class="clubLogoMob" src="https://clicks.co.za/medias/?context=LOGO" alt="club-card-1.jpg">
      <img class="productImagePrimaryLink" id="imageLink" href="/x/p/1/zoomImages"
        src="/medias/?context=bWFzdGVy123" alt="img_not_available"/>`;
    const imgs = extractProductImages(html, "https://www.clicks.co.za/cerave_moisturising-cream-454g/p/360501");
    expect(imgs).toHaveLength(1);
    expect(imgs[0]).toMatchObject({ via: "page-img", url: "https://www.clicks.co.za/medias/?context=bWFzdGVy123" });
  });
  test("meta image present -> the <img> scan is not used", () => {
    const imgs = extractProductImages(`<meta property="og:image" content="https://a.com/p.jpg"><img class="product-image" src="/other.jpg">`, "https://a.com/p");
    expect(imgs.map((i) => i.via)).toEqual(["og:image"]);
  });
});

describe("helpers", () => {
  test("resolveImageUrl upgrades http and rejects odd schemes", () => {
    expect(resolveImageUrl("http://a.com/i.jpg", "https://a.com/p")).toBe("https://a.com/i.jpg");
    expect(resolveImageUrl("javascript:alert(1)", "https://a.com/p")).toBeNull();
    expect(resolveImageUrl("data:image/png;base64,AAAA", "https://a.com/p")).toBeNull();
  });
  test("imageResponseOk", () => {
    expect(imageResponseOk("image/jpeg", 40_000)).toBe(true);
    expect(imageResponseOk("image/jpeg", null)).toBe(true);
    expect(imageResponseOk("text/html", 40_000)).toBe(false);
    expect(imageResponseOk("image/png", 900)).toBe(false);
  });
});

describe("rankProductPages", () => {
  const target = { brand: "Lelive", name: "Rooibos & Aloe Jelly Splash Cleanser" };
  const results = [
    { url: "https://www.faithful-to-nature.co.za/lelive-jelly-splash-cleanser-rooibos-aloe", title: "Buy Lelive. Jelly Splash Cleanser - Rooibos & Aloe Online | Faithful to Nature", text: "" },
    { url: "https://leliveafrica.com/products/jelly-splash", title: "Jelly Splash | Salicylic Acid Cleanser | lelive", text: "" },
    { url: "https://leliveafrica.com/collections/all", title: "Products | lelive", text: "" },
    { url: "https://www.dischem.co.za/featured-brands/beauty/lelive", title: "Lelive | Dis-Chem", text: "" },
  ];
  test("brand site first, categories dropped", () => {
    const pages = rankProductPages(target, results, ["leliveafrica.com"]);
    expect(pages[0].retailer).toBe("brand-direct");
    expect(pages.map((p) => p.retailer)).toEqual(["brand-direct", "faithful-to-nature"]);
  });
});
