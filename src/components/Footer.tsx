import { Link } from "react-router-dom";
import { Instagram, Linkedin, Youtube, MessageCircle } from "lucide-react";
import { useMembership } from "@/hooks/use-membership";
import logo from "@/assets/newskinlabs.png";

const Footer = () => {
  const { isMember, loading: membershipLoading } = useMembership();

  const footerLinks = {
    products: [
      { label: "The Daily Skinny", href: "/briefings" },
      { label: "Product Reviews", href: "/reviews" },
      { label: "Shelf Showdowns", href: "/compare", isNew: true },
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
    { icon: Instagram, href: "https://instagram.com/skinlabs.africa", label: "Instagram" },
    { icon: Linkedin, href: "https://www.linkedin.com/company/skinlabssa/", label: "LinkedIn" },
    { icon: Youtube, href: "https://www.youtube.com/@skinlabssa", label: "YouTube" },
    { icon: MessageCircle, href: "https://wa.me/27600000000", label: "WhatsApp" },
  ];

  return (
    <footer className="border-t border-border bg-card">
      <div className="container mx-auto px-4 py-12">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          <div className="lg:col-span-2">
            <Link to="/" className="inline-flex items-center gap-2">
              <img src={logo} alt="SkinLabs" className="h-8 w-auto" />
            </Link>
            <p className="mt-4 max-w-sm text-sm text-muted-foreground">
              South Africa&apos;s Skin Intelligence Platform — briefings, reviews and tools built for local climate, shelves and skin.
            </p>
            <div className="mt-6 flex gap-3">
              {socialLinks.map(({ icon: Icon, href, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer noopener"
                  aria-label={label}
                  className="rounded-full border border-border p-2 text-muted-foreground transition-colors hover:text-foreground"
                >
                  <Icon className="h-4 w-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h4 className="font-semibold mb-4">Editorial</h4>
            <ul className="space-y-2">
              {footerLinks.products.map((link) => (
                <li key={link.href + link.label}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {link.label}
                    {"isNew" in link && link.isNew ? (
                      <span className="ml-2 rounded-full bg-primary/10 px-1.5 py-0.5 text-[10px] font-semibold text-primary">NEW</span>
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
                <li key={link.href + link.label}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {link.label}
                    {"isComingSoon" in link && link.isComingSoon ? (
                      <span className="ml-2 rounded-full bg-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-amber-700 dark:text-amber-400">Soon</span>
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
                <li key={link.href + link.label}>
                  <Link to={link.href} className="text-sm text-muted-foreground hover:text-foreground">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div className="mt-10 flex flex-col gap-3 border-t border-border pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} SkinLabs®. All rights reserved.</p>
          <div className="flex flex-wrap gap-4">
            <Link to="/privacy-policy" className="hover:text-foreground">Privacy</Link>
            <Link to="/terms-of-service" className="hover:text-foreground">Terms</Link>
            <Link to="/cookie-policy" className="hover:text-foreground">Cookies</Link>
            <Link to="/editorial-policy" className="hover:text-foreground">Editorial</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
