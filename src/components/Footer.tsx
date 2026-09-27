import { Link } from "react-router-dom";
import {
  Instagram,
  Facebook,
} from "lucide-react";
import { useMembership } from "@/hooks/use-membership";

const TikTokIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z" />
  </svg>
);

const WhatsAppIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const XIcon = ({ className = "w-4 h-4" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const AppleIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M16.365 1.43c0 1.14-.462 2.23-1.21 3.03-.803.86-2.11 1.52-3.19 1.43-.13-1.1.42-2.25 1.17-3.02.83-.86 2.24-1.5 3.23-1.44zM20.5 17.02c-.55 1.27-.82 1.84-1.53 2.96-.99 1.57-2.39 3.52-4.12 3.53-1.54.02-1.94-1-4.03-.99-2.09.01-2.53 1.01-4.07.99-1.73-.02-3.05-1.78-4.04-3.35C-.03 15.77-.32 10.66 1.43 7.97c1.24-1.91 3.2-3.03 5.05-3.03 1.88 0 3.06 1.03 4.61 1.03 1.51 0 2.43-1.03 4.61-1.03 1.64 0 3.39.9 4.63 2.44-4.07 2.23-3.41 8.04.17 9.64z" />
  </svg>
);

const GooglePlayIcon = ({ className = "h-6 w-6" }: { className?: string }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
    <path d="M3.61 1.81 13.79 12 3.61 22.19a1.4 1.4 0 0 1-.61-1.17V2.98c0-.48.24-.9.61-1.17zm11.6 11.6 2.3 2.3-10.95 6.32 8.65-8.62zm3.52-3.53 2.6 1.5c.84.49.84 1.75 0 2.24l-2.6 1.5L16.3 12.7l2.43-2.82zM6.56 1.97l10.95 6.32-2.3 2.3-8.65-8.62z" />
  </svg>
);

/**
 * Monochrome "Coming soon" store badges. Not links — the apps don't exist
 * yet, so nothing here may look tappable-to-install. Black badge in light
 * mode, white badge in dark mode (the footer itself is inverted, so the
 * border keeps each badge distinct from the footer behind it).
 */
const appStoreBadges = [
  { store: "Google Play", ariaStore: "Google Play", icon: GooglePlayIcon },
  { store: "App Store", ariaStore: "the App Store", icon: AppleIcon },
];

const AppStoreBadge = ({ store, ariaStore, icon: Icon }: (typeof appStoreBadges)[number]) => (
  <div
    role="img"
    aria-label={`Coming soon to ${ariaStore}`}
    className="inline-flex h-12 min-w-[156px] cursor-default select-none items-center gap-2.5 rounded-xl border border-[#A6A6A6] bg-black px-3.5 text-white dark:border-black/70 dark:bg-white dark:text-black"
  >
    <Icon className="h-6 w-6 shrink-0" />
    <span className="flex flex-col text-left leading-none">
      <span className="text-[10px] font-medium tracking-wide">Coming soon to</span>
      <span className="mt-1 text-[15px] font-semibold tracking-tight">{store}</span>
    </span>
  </div>
);

const Footer = () => {
  const { isMember, loading: membershipLoading } = useMembership();

  const footerLinks = {
    products: [
      { label: "The Daily Skinny", href: "/briefings" },
      { label: "Product Reviews", href: "/reviews" },
      { label: "Shelf Showdown", href: "/compare", isNew: true },
      { label: "Brand Spotlight", href: "/spotlight", isNew: true },
      { label: "Seasonal Guides", href: "/seasonals", isNew: true },
      { label: "Podcast Series", href: "/podcast" },
    ],
    platform: [
      { label: "Skin Analysis (SKYNN AI)", href: "/skynn-ai" },
      { label: "Knowledge Hub", href: "/knowledge-hub" },
      { label: "Consultations", href: "/consult", isComingSoon: true },
      { label: "Marketplace", href: "/marketplace", isComingSoon: true },
      { label: "Academy", href: "/learn", isComingSoon: true },
      ...(!membershipLoading && isMember ? [] : [{ label: "Memberships", href: "/pricing" }]),
      { label: "Ingredients", href: "/ingredients" },
    ],
    company: [
      { label: "About Us", href: "/about" },
      { label: "Our Science", href: "/about#science" },
      { label: "Sustainability", href: "/about#sustainability" },
      { label: "For Business", href: "/business" },
      { label: "Partnerships", href: "/partners" },
      { label: "Ambassadors", href: "/brand-ambassadors" },
      { label: "Announcements", href: "/announcements" },
      { label: "Contact Us", href: "/contact" },
    ],
  };

  const socialLinks = [
    { icon: Instagram, href: "https://instagram.com/skinlabsza", label: "@skinlabsza" },
    { icon: Facebook, href: "http://facebook.com/skinlabs.co.za/", label: "Facebook" },
    {
      icon: XIcon,
      href: "https://x.com/skinlabsza",
      label: "X",
    },
    {
      icon: TikTokIcon,
      href: "https://www.tiktok.com/@skinlabsza",
      label: "TikTok",
    },
    {
      icon: WhatsAppIcon,
      href: "https://whatsapp.com/channel/0029Vb6AAeX7YSdws80fii1m",
      label: "WhatsApp Channel",
    },
  ];

  return (
    <footer className="bg-foreground text-background">
      {/* pb-32 clears FloatingBottomNav (fixed, centered, bottom-4 on mobile) so the
          copyright row below is never hidden underneath it once scrolled to the very
          end of the page; the nav's layout no longer centers over this content from
          md up (flex-row + justify-between), so the original py-16 bottom space is
          enough there. */}
      <div className="container mx-auto px-4 pt-16 pb-32 md:pb-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-8 lg:mb-0">
            <Link to="/" className="inline-block mb-4">
              {/* Footer uses inverse of page theme: light mode → dark footer → white logo;
                  dark mode → light footer → black logo. Served from public/
                  (logosvg.png/logosvgwhite.png), not the src/assets pair. */}
              <img
                src="/logosvgwhite.png"
                alt="SkinLabs — South Africa's Skin Intelligence Platform"
                width={804}
                height={261}
                className="h-16 w-auto dark:hidden"
              />
              <img
                src="/logosvg.png"
                alt="SkinLabs — South Africa's Skin Intelligence Platform"
                width={804}
                height={261}
                className="h-16 w-auto hidden dark:block"
              />
            </Link>
            <p className="text-background/60 text-sm leading-relaxed mb-4">
              South Africa's Skin Intelligence Platform. Evidence-led skincare education,
              product intelligence and tools built for local climate, shelves and skin.
            </p>
            <div className="flex gap-3">
              {socialLinks.map((social) => (
                <a
                  key={social.label}
                  href={social.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-9 h-9 rounded-full bg-background/10 flex items-center justify-center hover:bg-primary transition-colors"
                  aria-label={social.label}
                >
                  <social.icon className="w-4 h-4" />
                </a>
              ))}
            </div>
            <div className="mt-6 flex flex-wrap gap-3">
              {appStoreBadges.map((badge) => (
                <AppStoreBadge key={badge.store} {...badge} />
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Editorial</h4>
            <ul className="space-y-2">
              {footerLinks.products.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-background/60 text-sm hover:text-background transition-colors"
                  >
                    {link.label}
                    {"isNew" in link && link.isNew ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-primary">New</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2">
              {footerLinks.platform.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-background/60 text-sm hover:text-background transition-colors"
                  >
                    {link.label}
                    {"isComingSoon" in link && link.isComingSoon ? (
                      <span className="ml-2 text-[10px] uppercase tracking-wide text-amber-400">Soon</span>
                    ) : null}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {footerLinks.company.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    className="text-background/60 text-sm hover:text-background transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="border-t border-background/10 pt-8 flex flex-col items-center gap-4 text-center">
          <p className="text-background/40 text-sm">
            © {new Date().getFullYear()} SkinLabs®. All rights reserved.
          </p>
          <div className="flex flex-wrap justify-center gap-x-4 gap-y-2 text-sm text-background/40">
            <Link to="/privacy-policy" className="hover:text-background transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="hover:text-background transition-colors">
              Terms of Service
            </Link>
            <Link to="/cookie-policy" className="hover:text-background transition-colors">
              Cookie Policy
            </Link>
            <Link to="/refund-policy" className="hover:text-background transition-colors">
              Refund Policy
            </Link>
            <Link to="/advertising-policy" className="hover:text-background transition-colors">
              Advertising Policy
            </Link>
            <Link to="/corrections-removals" className="hover:text-background transition-colors">
              Corrections/Removals
            </Link>
            <Link to="/editorial-policy" className="hover:text-background transition-colors">
              Editorial Policy
            </Link>
            <Link to="/community-guidelines" className="hover:text-background transition-colors">
              Community Guidelines
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
