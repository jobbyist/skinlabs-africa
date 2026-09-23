# Product Review SEO Enhancement Implementation Guide

## Overview

This guide documents the changes needed to transform product review pages into SEO-optimized, richly structured pages that follow Google's product review guidelines and provide comprehensive information to users.

## Goals

1. **Proper Structured Data**: Separate editorial Review from community AggregateRating
2. **Enhanced SEO**: Optimized titles, descriptions, and on-page content
3. **Rich Information Architecture**: At-a-glance product data, ingredients, suitability
4. **Internal Linking**: Related products, ingredients, knowledge articles
5. **User Trust**: Methodology transparency, clear editorial/community separation

## Database Schema (COMPLETED ✅)

Migration `20270115000000_add_seo_review_schema_fields.sql` adds:

```sql
-- SEO Meta
seo_title, seo_description, seo_intro

-- Editorial Content  
review_body, review_methodology

-- Product Details
product_size, product_format, country_of_origin, am_pm_usage, currency

-- Suitability (JSONB arrays)
skin_types, skin_concerns, benefits, cautions

-- Ingredients (JSONB)
key_ingredients_structured, related_ingredients_slugs

-- Media (JSONB)
primary_image, gallery_images

-- Internal Linking (JSONB)
related_reviews, related_knowledge_articles, comparison_products

-- Community Data
community_rating, community_rating_count

-- FAQ (JSONB)
faq

-- Timestamps
date_published, date_modified
```

## SEO Infrastructure (COMPLETED ✅)

### 1. Enhanced Types (`src/lib/seo/types.ts`)

Added `EnhancedProductReviewJsonLdInput` and `FAQJsonLdInput` to support:
- Separate editorial and community ratings
- Product details (size, origin, etc.)
- FAQ structured data

### 2. JSON-LD Generators (`src/lib/seo/jsonLd.ts`)

Added two new functions:

```typescript
/**
 * Enhanced Product Review JSON-LD following Schema.org guidelines.
 * Separates editorial Review from community AggregateRating.
 */
export function enhancedProductReviewJsonLd(input: EnhancedProductReviewJsonLdInput)

/**
 * FAQ JSON-LD for product-specific Q&A
 */
export function faqJsonLd(input: FAQJsonLdInput)
```

### 3. SEO Config (`src/lib/seo-config.ts`)

Enhanced generators:

```typescript
productReviewTitle(productName, brand, keyAttribute?)
productReviewDescription(productName, brand, options?)
productReviewIntro(productName, brand, category, options?)
```

## Component Structure (TODO)

Create modular components in `src/components/product-review/`:

### 1. QuickVerdict.tsx
```typescript
interface QuickVerdictProps {
  verdict: string;
  overallScore: number;
  scoreBreakdown: {
    efficacy: number;
    value: number;
    texture: number;
    climate: number;
  };
}
```

**Design**: Hero section with large verdict text, overall score badge, and 4-metric score bars.

### 2. AtAGlanceCard.tsx
```typescript
interface AtAGlanceCardProps {
  brand: string;
  productName: string;
  category: string;
  size?: string;
  priceZAR: number;
  whereAvailable: string;
  countryOfOrigin?: string;
  amPmUsage?: string;
}
```

**Design**: Compact card with icon grid showing key product facts.

### 3. SkinTypesConcerns.tsx
```typescript
interface SkinTypesConcernsProps {
  skinTypes: string[];
  skinConcerns: string[];
  benefits: string[];
  cautions?: string[];
}
```

**Design**: Two-column layout with checkmarks (✓) for matches, warning icons for cautions.

### 4. KeyIngredients.tsx
```typescript
interface KeyIngredientsProps {
  ingredients: Array<{
    name: string;
    concentration?: string;
    description?: string;
    slug?: string; // for linking to ingredient pages
  }>;
  relatedIngredientSlugs?: string[];
}
```

**Design**: Cards for each ingredient with name, concentration, description, and link to full ingredient page.

### 5. PerformanceBreakdown.tsx
```typescript
interface PerformanceBreakdownProps {
  scores: {
    efficacy: number;
    value: number;
    texture: number;
    climate: number;
  };
  reviewBody: string;
}
```

**Design**: Detailed breakdown with score bars and editorial commentary for each metric.

### 6. ProsConsLists.tsx
```typescript
interface ProsConsListsProps {
  pros: string[];
  cons: string[];
}
```

**Design**: Side-by-side lists with checkmarks and X icons.

### 7. ReviewMethodology.tsx
```typescript
interface ReviewMethodologyProps {
  methodology?: string;
  editorialScore: number;
  communityRating?: number;
  communityCount?: number;
}
```

**Design**: Accordion or collapsible section explaining how reviews are conducted. Clearly separates editorial vs. community.

### 8. ProductFAQ.tsx
```typescript
interface ProductFAQProps {
  faqs: Array<{
    question: string;
    answer: string;
  }>;
}
```

**Design**: Accordion with question/answer pairs. Emits FAQ JSON-LD.

### 9. RelatedContent.tsx
```typescript
interface RelatedContentProps {
  relatedReviews?: string[]; // slugs
  relatedKnowledge?: string[]; // slugs or IDs
  comparisonProducts?: string[]; // slugs
  relatedIngredients?: string[]; // slugs
}
```

**Design**: Cards grid showing related products, comparisons, ingredients, and knowledge articles.

### 10. SAClimateSection.tsx
```typescript
interface SAClimateSectionProps {
  climateScore: number;
  climateCommentary: string;
}
```

**Design**: Highlight how the product performs specifically in South African conditions (heat, UV, humidity).

## Page Structure (ProductReview.tsx Updates)

### Current Issues to Fix:

1. ❌ Uses old `productReviewJsonLd()` with editorial score as AggregateRating
2. ❌ Generic SEO titles/descriptions
3. ❌ Minimal on-page product information
4. ❌ No breadcrumbs
5. ❌ No FAQ structured data
6. ❌ Limited ingredient information
7. ❌ No related content section
8. ❌ No methodology transparency

### Target Page Structure:

```
<SEO> (Enhanced metadata + JSON-LD)
  - Optimized title: "Brand Product — Key Benefit Review | SkinLabs®"
  - Rich description with score, ingredients, skin types
  - BreadcrumbList JSON-LD
  - Enhanced Product + Review JSON-LD (separate editorial/community)
  - FAQ JSON-LD (if FAQs exist)
</SEO>

<Breadcrumbs>
  Home > Reviews > [Category] > [Product]
</Breadcrumbs>

<Header>
  <h1>{brand} {productName}</h1>
  <p className="lead">{seo_intro or generated intro}</p>
</Header>

<QuickVerdict>
  {verdict, overallScore, scoreBreakdown}
</QuickVerdict>

<AtAGlanceCard>
  {product facts: size, price, category, origin, etc.}
</AtAGlanceCard>

<SkinTypesConcerns>
  {suitable skin types, addresses concerns, benefits, cautions}
</SkinTypesConcerns>

<KeyIngredients>
  {structured ingredients with descriptions and links}
</KeyIngredients>

<PerformanceBreakdown>
  {detailed score commentary}
</PerformanceBreakdown>

<SAClimateSection>
  {SA-specific performance notes}
</SAClimateSection>

<ProsConsLists>
  {extracted or defined pros/cons}
</ProsConsLists>

<WhereAvailable>
  {existing retailer cards - keep as is}
</WhereAvailable>

<ReviewMethodology>
  {how we review, editorial vs community}
</ReviewMethodology>

<ProductFAQ>
  {product-specific Q&A if available}
</ProductFAQ>

<RelatedContent>
  {related reviews, comparisons, ingredients, knowledge}
</RelatedContent>

<CommunitySection>
  {existing comments, ratings - keep member-gated}
</CommunitySection>
```

## Implementation Steps

### Phase 1: Component Development

1. Create each component in `src/components/product-review/`
2. Use existing UI components (Card, Badge, Progress, Accordion, etc.)
3. Follow accessibility best practices (ARIA labels, semantic HTML)
4. Mobile-first responsive design

### Phase 2: Type Extensions

Update `src/data/reviews.ts` interface if needed to support new fields:

```typescript
export interface ProductReview {
  // Existing fields...
  
  // New optional fields (will be null for static reviews until populated)
  seo_title?: string;
  seo_description?: string;
  seo_intro?: string;
  review_body?: string;
  product_size?: string;
  country_of_origin?: string;
  skin_types?: string[];
  skin_concerns?: string[];
  key_ingredients_structured?: Array<{
    name: string;
    concentration?: string;
    description?: string;
    slug?: string;
  }>;
  faq?: Array<{
    question: string;
    answer: string;
  }>;
  related_reviews?: string[];
  related_knowledge?: string[];
  // ... etc
}
```

### Phase 3: Page Updates

Update `src/pages/ProductReview.tsx`:

1. **SEO Section**:
   ```typescript
   const seoTitle = review.seo_title || productReviewTitle(
     review.product_name, 
     review.brand, 
     extractKeyAttribute(review)
   );
   
   const seoDescription = review.seo_description || productReviewDescription(
     review.product_name,
     review.brand,
     {
       score: overallScore(review),
       keyIngredients: review.key_ingredients?.slice(0, 2),
       skinTypes: review.skin_type_match?.slice(0, 2),
     }
   );
   ```

2. **JSON-LD**:
   ```typescript
   const jsonLdBlocks = [
     breadcrumbJsonLd([...breadcrumbItems]),
     enhancedProductReviewJsonLd({
       canonicalUrl: `${SITE_URL}/reviews/${slug}`,
       productName: review.product_name,
       brand: review.brand,
       category: review.category,
       editorialScore: overallScore(review),
       reviewBody: review.verdict,
       // Include community rating only if it exists
       ...(review.community_rating && review.community_rating_count ? {
         communityRating: review.community_rating,
         communityReviewCount: review.community_rating_count,
       } : {}),
     }),
     ...(review.faq && review.faq.length > 0 ? [
       faqJsonLd({ canonicalUrl, faqs: review.faq })
     ] : []),
   ];
   ```

3. **Component Integration**:
   - Replace inline verdict display with `<QuickVerdict />`
   - Add `<AtAGlanceCard />` after header
   - Add all new components in logical order
   - Keep existing member-gated sections (comments, ratings, routine builder)

### Phase 4: Data Population

The review pipeline (`api/product-review-sync.ts`) will need updates to populate new fields. This can be done gradually:

1. Start with core SEO fields (title, description, intro)
2. Add product details (size, origin)
3. Expand to structured ingredients
4. Add FAQs and related content

## SEO Checklist

- [ ] H1 contains brand + product name
- [ ] SEO title is unique and descriptive (<60 chars)
- [ ] Meta description is compelling (150-160 chars)
- [ ] Canonical URL is set correctly
- [ ] BreadcrumbList JSON-LD is present
- [ ] Product JSON-LD with separate Review (editorial) and AggregateRating (community)
- [ ] FAQ JSON-LD if FAQs exist
- [ ] Internal links to ingredients, related products, knowledge articles
- [ ] Images have proper alt text
- [ ] Mobile-responsive
- [ ] Page loads in <3s

## Testing

1. **Structured Data Testing**: Use Google's Rich Results Test
2. **SEO Preview**: Check in SERP simulator
3. **Mobile**: Test on actual devices
4. **Performance**: Lighthouse audit
5. **Accessibility**: WAVE tool, screen reader testing

## Example: Lelive AM/PM Serum Kit Review

Using `/reviews/aigen-lelive-am-pm-serum-kit-multi-benefit-duo`:

- SEO Title: "Lelive AM PM Serum Kit — Multi-Benefit Duo Review | SkinLabs®"
- Description: "Independent review of AM PM Serum Kit by Lelive (7.8/10) — niacinamide, peptides for combination & oily skin in South African climate."
- Structured data: Product + Editorial Review (7.8/10) + No community rating yet
- Breadcrumbs: Home > Reviews > Serum > Lelive AM PM Serum Kit
- Components: All sections populated with available data
- Related: Link to niacinamide ingredient page, other Lelive reviews

---

This guide should be treated as the source of truth for implementing SEO enhancements across product review pages.
