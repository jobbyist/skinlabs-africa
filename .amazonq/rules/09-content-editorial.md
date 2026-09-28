# 09 — Content & Editorial

## Editorial Independence

**Standing principle**: Never sacrifice editorial independence for monetization.

### Funding Model Copy (CURRENT)

Source: `src/lib/editorialIndependence.ts`

**Approved statements**:

- "Editorial that can't be bought"
- "Member-funded and partly ad-supported"
- Transparent about ads, sponsorships, affiliate links

**NEVER write**:

- "No ads"
- "No sponsored content"
- "We buy every product"
- "Member-funded, not ad-funded"

## Content Types

### AI-Generated Content (Automated Pipelines)

**Daily Skinny Briefings** (2-3/day):

- Research: Firecrawl (9 SA skincare news channels)
- Generation: Gemini (1000-1500 words)
- Quality gates: Word count, compliance scan
- Table: `news_articles`
- Pipeline: `briefings-sync` (04:00 UTC daily)

**Product Reviews** (3/day):

- Sources: OpenHaus catalog + Firecrawl (FTN, SA brands)
- Generation: Gemini (verdict, score, breakdown)
- Quality gates: Score range, verdict length, compliance
- Table: `ai_generated_product_reviews`
- Pipeline: `product-review-sync` (07:00 UTC daily)
- Sponsored: OpenHaus-sourced reviews labeled "Sponsored"

**Shelf Showdown** (2/week):

- Pairs: Same-category products never compared
- Generation: Gemini ("better for X", never universal winner)
- Table: `ai_generated_comparisons`
- Pipeline: `shelf-showdown-sync` (Thursdays 15:00 UTC)

**Ingredients** (25+/week):

- Research: PubMed + DermNet NZ (Firecrawl)
- Evidence-based content only
- Table: `ingredients`
- Pipeline: Weekly rotation (Tuesdays 04:00 UTC)
- Verification: Admin queue

### Hand-Authored Content

**Static content** in `src/data/`:

- FAQ (`faq.ts`)
- Podcast episodes (`podcast.ts`)
- Seasonals (`seasonals.ts`)
- Legacy reviews (`reviews.ts`)
- Comparisons (`comparisons*.ts`)

**Manuscript workflow**:

1. Write markdown in `content/daily-skinny/`
2. Create SQL seed migration
3. Insert into `news_articles`
4. Not generated, not pipeline

## Content Quality Gates

### Compliance Scanning

**Forbidden diagnosis terms** (`FORBIDDEN_DIAGNOSIS_TERMS`):

- Scans all generated content
- Rejects if medical diagnosis found
- Examples: psoriasis, eczema, rosacea (in diagnostic context)
- Educational context allowed

### Word Count

- **Briefings**: 1000+ words (1500+ for primary model)
- **Reviews**: Minimum verdict length
- **Ingredients**: Complete profile (not just stub)

### Evidence Requirements

**Citations required**:

- Ingredients: PubMed verified sources
- Medical claims: Peer-reviewed evidence
- Product claims: Manufacturer data or testing

**Never fabricate**:

- Citations
- Study results
- Expert quotes
- Statistics

## Sponsored Content Disclosure

**OpenHaus-sourced reviews**:

- `is_sponsored = true` in database
- "Sponsored" badge on page
- Disclosure paragraph near title
- "Sponsored" pill on cards

**Affiliate links**:

- Labeled clearly
- Disclosed in FAQ
- Not hidden or misleading

## Content Distribution

### Editorial Calendar

**Automated**:

- Daily Skinny: Daily (04:00 UTC)
- Product Reviews: Daily (07:00 UTC)
- Shelf Showdown: Weekly (Thursdays)
- Ingredients: Weekly (Tuesdays)

**Manual**:

- Podcast: Fridays 12:00 SAST
- Spotlight: Per editorial schedule

### Publication Status

**AI content goes live automatically** after passing QA gates.

**No manual editorial review** for automated content (by design).

**Manual content** requires explicit publication flag.

## Content Freshness

### Rotation

- **Spotlight editions**: Every 25 reviews
- **SkinLabs Picks**: Weekly rotation (diversity-favoring)
- **Podcast episodes**: Weekly

### Updates

- **Ingredients**: Refresh rotation (oldest first)
- **Prices**: Daily sync (OpenHaus)
- **FX rates**: Every 6h

## Known Content Gaps

1. **Review images**: Pexels API key invalid (18/37 missing images)
2. **Podcast episodes 5-9**: Transcribed, but format is NotebookLM-style (narrating site back to itself)
3. **Episode 10**: Not published (has audio, no transcript yet)
4. **VIP benefits**: Hidden (feature not ready)

