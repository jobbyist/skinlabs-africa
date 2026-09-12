import { Link } from "react-router-dom";
import {
  Instagram,
  Facebook,
  Youtube,
  MessageCircle,
} from "lucide-react";
import { useMembership } from "@/hooks/use-membership";
import logo from "@/assets/newskinlabs.png";

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
      { label: "Ingredients", href: "/ingredients", isComingSoon: true },
      ...(!membershipLoading && isMember ? [] : [{ label: "Memberships", href: "/pricing" }]),
      { label: "Announcements", href: "/announcements" },
    ],
    company: [
      { label: "About Us", href: "/about" },
      { label: "Our Science", href: "/about#science" },
      { label: "Sustainability", href: "/about#sustainability" },
      { label: "For Business", href: "/business" },
      { label: "Partnerships", href: "/partners" },
      { label: "Contact Us", href: "/contact" },
    ],
  };

  const socialLinks = [
    { icon: Instagram, href: "https://instagram.com/skinlabsza", label: "@skinlabsza" },
    { icon: Facebook, href: "http://facebook.com/skinlabs.co.za/", label: "Facebook" },
    {
      icon: Youtube,
      href: "https://www.youtube.com/channel/UCcKSyVsu6Ip6bnHOBJZ5PLg",
      label: "YouTube",
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
      <div className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-8 mb-12">
          <div className="col-span-2 md:col-span-4 lg:col-span-1 mb-8 lg:mb-0">
            <Link to="/" className="inline-block mb-4">
              <img
                src={logo}
                alt="SkinLabs — South Africa's Skin Intelligence Platform"
                className="h-16 w-auto brightness-0 invert"
              />
            </Link>
            <p className="text-background/60 text-sm leading-relaxed mb-4">
              South Africa&apos;s Skin Intelligence Platform. Evidence-led skincare education,
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

        <div className="border-t border-background/10 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-background/40 text-sm">
            © {new Date().getFullYear()} SkinLabs®. All rights reserved.
          </p>
          <div className="flex flex-wrap gap-4 text-sm text-background/40">
            <Link to="/privacy-policy" className="hover:text-background transition-colors">
              Privacy Policy
            </Link>
            <Link to="/terms-of-service" className="hover:text-background transition-colors">
              Terms of Service
            </Link>
            <Link to="/cookie-policy" className="hover:text-background transition-colors">
              Cookie Policy
            </Link>
            <Link to="/editorial-policy" className="hover:text-background transition-colors">
              Editorial Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
