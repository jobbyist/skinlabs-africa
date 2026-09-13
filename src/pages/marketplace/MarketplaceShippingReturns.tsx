import { Helmet } from "react-helmet-async";
import { MarketplaceHeader } from "@/components/marketplace/MarketplaceHeader";
import { MobileBottomNav } from "@/components/marketplace/MobileBottomNav";
import { MarketplaceBreadcrumbs } from "@/components/marketplace/MarketplaceBreadcrumbs";

/**
 * OpenHaus shipping & returns policy.
 * Modelled on Faithful to Nature’s published customer-support terms
 * (7-day unopened returns, courier fees, processing timelines) adapted for
 * the OpenHaus multi-vendor marketplace operated by SkinLabs®.
 */
export default function MarketplaceShippingReturns() {
  return (
    <>
      <Helmet>
        <title>Shipping & returns | OpenHaus by SkinLabs®</title>
        <meta
          name="description"
          content="OpenHaus shipping times, free-delivery threshold, and 7-day returns policy for unopened products."
        />
      </Helmet>
      <div className="min-h-screen bg-[#faf9f7] font-sans pb-24 lg:pb-16">
        <MarketplaceHeader />
        <article className="max-w-lg lg:max-w-3xl mx-auto px-4 lg:px-8 py-6 lg:py-10">
          <MarketplaceBreadcrumbs items={[{ label: "Shipping & returns" }]} />
          <h1 className="font-black text-[22px] lg:text-[32px] text-stone-900 tracking-tight mb-6">
            Shipping & returns
          </h1>

          <div className="prose prose-stone prose-sm max-w-none space-y-8 text-stone-700">
            <section>
              <h2 className="font-bold text-lg text-stone-900">Delivery</h2>
              <ul className="list-disc pl-5 space-y-2 mt-3">
                <li>
                  Standard courier delivery within South Africa typically takes{" "}
                  <strong>2–7 working days</strong> after dispatch.
                </li>
                <li>
                  Orders to neighbouring countries (e.g. Namibia, Botswana, Eswatini) may take{" "}
                  <strong>7–15 working days</strong>.
                </li>
                <li>
                  Free standard delivery applies on qualifying orders over{" "}
                  <strong>R400</strong> (before shipping). Below that threshold, courier fees are
                  calculated at checkout.
                </li>
                <li>
                  Unforeseen events (weather, road closures, strikes) can extend delivery times. A
                  late delivery alone is not grounds for cancellation or a full refund, but if your
                  order has not arrived after the estimated window, contact us with your order
                  number so we can follow up.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-lg text-stone-900">Returns & refunds</h2>
              <p className="mt-3">
                You may return eligible goods within <strong>7 days</strong> of receiving them,
                provided items remain in their <strong>original, unopened packaging</strong> and in
                saleable condition.
              </p>
              <ul className="list-disc pl-5 space-y-2 mt-3">
                <li>
                  Change of mind / not suitable: we refund the product value less the outbound
                  courier fee once the item is received back and inspected.
                </li>
                <li>
                  Misrepresentation on the OpenHaus listing: we refund in full (including reasonable
                  return shipping) after the item is received.
                </li>
                <li>
                  Damaged or broken on arrival: notify us within <strong>one working day</strong> of
                  receipt. We will arrange a replacement or a full refund.
                </li>
                <li>
                  Refunds are issued to the original payment method and are typically processed
                  within <strong>3 working days</strong> after warehouse confirmation.
                </li>
                <li>We do not offer product exchanges — please return and place a new order.</li>
                <li>
                  Intimate / personal-care items that cannot be resold for hygiene reasons are not
                  returnable once opened.
                </li>
              </ul>
            </section>

            <section>
              <h2 className="font-bold text-lg text-stone-900">How to log a return</h2>
              <p className="mt-3">
                Email <a href="mailto:hello@skinlabs.co.za">hello@skinlabs.co.za</a> with your order
                number and reason. We will issue a return authorisation and warehouse address.
                Return shipping is for your account unless the return is due to our error or a
                damaged shipment.
              </p>
            </section>

            <section>
              <h2 className="font-bold text-lg text-stone-900">Cancellations</h2>
              <p className="mt-3">
                Orders can be cancelled before payment, or after payment only if the order has not
                yet been dispatched. Once dispatched, the returns process above applies.
              </p>
            </section>

            <p className="text-xs text-stone-500 border-t border-stone-200 pt-4">
              OpenHaus is operated by SkinLabs®. This policy applies to marketplace purchases
              fulfilled through OpenHaus. Individual brand partners may offer additional remedies at
              their discretion for opened products; those remedies are not guaranteed by SkinLabs®.
            </p>
          </div>
        </article>
        <MobileBottomNav />
      </div>
    </>
  );
}
