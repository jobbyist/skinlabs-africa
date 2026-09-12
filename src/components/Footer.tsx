import { Link } from "react-router-dom";
import {
  Instagram,
  Facebook,
  Youtube,
  MessageCircle,
} from "lucide-react";
import { SiTiktok, SiWhatsapp } from "react-icons/si";
import { useMembership } from "@/hooks/use-membership";
import logo from "@/assets/newskinlabs.png";

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
      icon: SiTiktok,
      href: "https://www.tiktok.com/@skinlabsza",
      label: "TikTok",
    },
    {
      icon: SiWhatsapp,
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
