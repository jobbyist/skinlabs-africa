# SkinLabs (v1.0) Production Readiness Plan

## Target: Live by 23 February 2026 | OPENHAUS Soft Launch: 1 March 2026

---

## Critical Build Fix (Immediate)

The platform currently has a **build error** that must be resolved first. The PWA service worker is rejecting large image assets (over 2MB). The fix is to increase the `maximumFileSizeToCacheInBytes` threshold in the Vite PWA config or exclude large assets from precaching.

---

## Outstanding Tasks

### 1. Fix PWA Build Error (Blocker)

The `vite-plugin-pwa` workbox config rejects assets over 2MB. Several product images and the hero video exceed this limit. We need to set `maximumFileSizeToCacheInBytes` to a higher value (e.g., 5MB) or exclude video/large images from the precache manifest.

### 2. OPENHAUS Marketplace - Backend Persistence

The OPENHAUS waiting list form (`/openhaus`) currently logs to console only -- submissions are not saved anywhere. We need:

- A database table (`openhaus_waitlist`) to store signups
- Wire the form to save to the database
- Update the admin dashboard to display waitlist entries
- Update the pricing reference on the page from "R49/month" to "R99/month" to match the current subscription price

### 3. Newsletter Signup - Backend Persistence

The newsletter form on the homepage does not save subscriptions. We need:

- A `newsletter_subscribers` table
- Wire the form to save emails to the database
- Optionally display subscriber count in the admin dashboard

### 4. Edible Pouches Pre-Order - Payment Integration

The "Back This Campaign" button on `/edible-pouches` is not wired to any payment flow. We need to:

- Connect it to the existing PayFast edge function (which already supports `type: "preorder"`)
- Require authentication before placing a pre-order
- Create a `preorders` table to track backers and update the live backer count
- Make the backer count dynamic instead of the hardcoded value of 47

### 5. Subscription Paywall - Payment Integration

The `SubscriptionPaywallModal` (shown after AI Formulator results) currently uses a `setTimeout` simulation instead of calling the PayFast edge function. Wire it to the real PayFast payment flow so users can subscribe directly from the paywall modal.

### 6. Admin Dashboard Enhancements

The admin dashboard currently only shows skincare recommendation submissions. For production and campaign management, add:

- Subscriber management (view premium subscribers, status)
- OPENHAUS waitlist entries
- Edible Pouches backer count and list
- Newsletter subscriber list
- Basic analytics (signups over time, revenue)

### 7. User Profile and Dashboard

There is no user-facing dashboard. Users need a way to:

- View their subscription status
- Track their edible pouches pre-order (as promised on the campaign page)
- View their AI skincare recommendation history
- Manage their account settings

### 8. Authentication UI in Header

The header shows a "Get Started" button but no sign-in/sign-out state. When a user is logged in:

- Show their avatar or initials
- Add a dropdown with links to Dashboard, Settings, Sign Out
- Replace "Get Started" with the dashboard link for subscribers

### 9. SEO and Meta Tags

- The canonical URL on the homepage points to `https://skinlabs.com` but the actual domain appears to be `skinlabs.co.za` or `skinlabsza.lovable.app`. This needs to be corrected.
- Ensure all pages have proper Open Graph tags for social sharing (important for paid campaigns)
- Add structured data (JSON-LD) for products to improve search visibility

### 10. OPENHAUS Multivendor Marketplace Structure

For the March 1st soft launch, the OPENHAUS page needs to go beyond a waiting list:

- Define a vendor onboarding flow or at minimum a "Partner with Us" contact form
- Create a basic marketplace product listing page that can show products from multiple brands
- Decide if third-party brand products will be listed on Shopify or as separate catalog entries

### 11. Mobile Responsiveness Audit

- Verify all pages render correctly on common mobile viewports (375px, 390px, 414px)
- The Express Checkout cart sidebar may stack poorly on small screens
- Cookie consent and PWA install prompt should not overlap

### 12. Error Handling and Edge Cases

- The Shopify Storefront API calls have no retry logic or user-friendly error states
- The PayFast edge function should validate inputs more thoroughly
- Add loading states and error boundaries throughout the app

### 13. Legal and Compliance

- Cookie consent "Learn more" link points to `#` instead of `/cookie-policy`
- Ensure POPIA compliance notice is present during account signup
- Verify all legal pages (Privacy Policy, Terms of Service, Cookie Policy) are up to date for the products and services being offered

### 14. Performance Optimization

- Several product images are 1-2MB+ (PNG format). Convert to WebP for significant size reduction.
- The hero video is 2.6MB. Consider compressing it further or serving it from a CDN.
- Consider lazy loading for below-the-fold images and the podcast section.

### 15. Domain and Deployment

- Verify the custom domain (`skinlabs.co.za`) is properly configured
- Ensure the `CNAME` file in `/public` matches the deployment target
- Set up proper redirects (www to non-www or vice versa)

---

## Priority Ranking for 23 February Deadline


| Priority | Task                                           | Effort    |
| -------- | ---------------------------------------------- | --------- |
| P0       | Fix PWA build error                            | 15 min    |
| P0       | Edible Pouches payment integration             | 1-2 hours |
| P0       | Subscription paywall payment wiring            | 1 hour    |
| P0       | Auth state in header (sign in/out)             | 1-2 hours |
| P1       | OPENHAUS waitlist persistence                  | 1 hour    |
| P1       | Newsletter signup persistence                  | 30 min    |
| P1       | User dashboard (subscription + order tracking) | 2-3 hours |
| P1       | SEO fixes (canonical URL, OG tags)             | 1 hour    |
| P1       | Cookie consent "Learn more" link fix           | 5 min     |
| P1       | OPENHAUS price update (R49 to R99)             | 5 min     |
| P2       | Admin dashboard enhancements                   | 2-3 hours |
| P2       | Image optimization (WebP conversion)           | 1 hour    |
| P2       | Mobile responsiveness audit                    | 1-2 hours |
| P2       | Error handling improvements                    | 1-2 hours |
| P3       | OPENHAUS marketplace product structure         | 3-4 hours |
| P3       | Vendor onboarding flow                         | 2-3 hours |
| P3       | Structured data (JSON-LD)                      | 1 hour    |


---

## Technical Details

**Database tables to create:**

- `openhaus_waitlist` (id, first_name, last_name, email, phone, city, country, created_at) with RLS
- `newsletter_subscribers` (id, email, subscribed_at, is_active) with RLS for admin reads
- `preorders` (id, user_id, type, amount, status, payment_id, created_at) with RLS

**Edge function updates:**

- `payfast-payment`: Already supports subscription and preorder types -- just needs frontend wiring

**Files requiring changes:**

- `vite.config.ts` -- PWA workbox config fix
- `src/components/Header.tsx` -- Auth state, user menu
- `src/pages/Openhaus.tsx` -- Backend persistence, price update
- `src/components/Newsletter.tsx` -- Backend persistence
- `src/pages/EdiblePouches.tsx` -- PayFast integration, dynamic backer count
- `src/components/SubscriptionPaywallModal.tsx` -- PayFast integration
- `src/components/CookieConsent.tsx` -- Fix "Learn more" link
- `src/pages/Index.tsx` -- SEO canonical URL fix
- New: `src/pages/UserDashboard.tsx` -- User-facing dashboard