# OpenHaus Marketplace Build

## Goal
Replace the `/marketplace` placeholder with a polished, mobile-first marketplace based on the supplied landing-page mockup, and add product pages based on the supplied product-detail mockup.

## What will be built
- A distinct OpenHaus marketplace header and storefront experience under `/marketplace`.
- A responsive first viewport with OpenHaus branding, concise local-market copy, category shortcuts, and clear routes into products, brands, and SKYNN AI.
- Auto-rotating, swipeable sections for concerns, featured brands, and SkinLabs-reviewed picks, with pause controls and reduced-motion support.
- Product cards using the existing verified review catalogue, listed ZAR prices, SkinLabs scores, and credited representative photography.
- Product detail pages at `/marketplace/:productId` with gallery, product facts, ingredient and skin-fit information, retailer price comparison, related products, sticky mobile action, and structured search metadata.
- Honest calls to action: retailer purchase links where available, plus review and AI-routine links. No fabricated inventory, delivery promises, customer reviews, ratings, or checkout state.

## Visual direction
- Match the supplied mockups’ clean editorial-commerce structure: generous white space, crisp black controls, subtle peach/lilac accents, thin borders, compact category chips, and strong product-led hierarchy.
- Preserve SkinLabs’ existing semantic colour and typography system while adding only reusable marketplace-specific tokens.
- Use restrained Framer Motion reveals and carousel transitions; all motion will respect reduced-motion preferences.

## Technical details
- Add focused marketplace data helpers and reusable marketplace cards/carousels.
- Replace the `/marketplace` route target and add `/marketplace/:productId` in the app router.
- Reuse `productReviews`, `spotlightRanking`, the database-backed review-image hook, existing button controls, and Embla carousel primitives.
- Add Product and Breadcrumb JSON-LD, canonical links, Open Graph metadata, meaningful image alt text, and lazy loading below the fold.
- Resolve the existing Footer typing issue and Bun test-type configuration errors so the preview finishes with a clean build.

## Verification
- Test the landing page, carousel behaviour, product navigation, retailer actions, and missing-product state.
- Visually check desktop plus 375px and 390px mobile layouts against both supplied references.
- Confirm no horizontal overflow, overlapping controls, broken images, console errors, or build errors.
