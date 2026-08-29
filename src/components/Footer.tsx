import { Link } from "react-router-dom";
import { Instagram, Facebook } from "lucide-react";
import logo from "@/assets/skinlabs-logo-white.svg";

const NewBadge = () => (
  <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-primary-foreground align-middle">New</span>
);

const ComingSoonBadge = () => (
  <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-white align-middle whitespace-nowrap">Coming Soon</span>
);

const Footer = () => {
  const links = {
    editorial: [
      { label: "The Daily Skinny", href: "/newsroom" },
      { label: "Product Reviews", href: "/reviews" },
      { label: "Shelf Showdown", href: "/compare", isNew: true },
      { label: "Brand Spotlight", href: "/spotlight", isNew: true },
      { label: "Seasonal Guides", href: "/seasonals", isNew: true },
      { label: "Podcast Series", href: "/podcast" },
    ],
    platform: [
      { label: "AI Formulator", href: "/ai-formulator" },
      { label: "Consultations", href: "/consultations", isNew: true },
      { label: "Marketplace", href: "/shop", isComingSoon: true },
      { label: "Memberships", href: "/pricing" },
      { label: "Announcements", href: "/announcements" },
    ],
    company: [
      { label: "About Us", href: "/about" },
      { label: "Our Science", href: "/about#science" },
      { label: "Sustainability", href: "/about#sustainability" },
      { label: "For Business", href: "/business" },
      { label: "Browse FAQs", href: "/faq" },
      { label: "Contact Us", href: "/contact" },
    ],
  };

  const socials = [
    { icon: Instagram, href: "https://instagram.com/skinlabsza", label: "@skinlabsza" },
    { icon: Facebook, href: "http://facebook.com/skinlabs.co.za/", label: "Facebook" },
    {
      icon: () => (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-5.2 1.74 2.89 2.89 0 0 1 2.31-4.64 2.93 2.93 0 0 1 .88.13V9.4a6.84 6.84 0 0 0-1-.05A6.33 6.33 0 0 0 5 20.1a6.34 6.34 0 0 0 10.86-4.43v-7a8.16 8.16 0 0 0 4.77 1.52v-3.4a4.85 4.85 0 0 1-1-.1z"/>
        </svg>
      ),
      href: "https://tiktok.com/@skinlabsza",
      label: "TikTok",
    },
    {
      icon: () => (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M4.285 7.294c.704 0 1.276-.576 1.276-1.287 0-.71-.572-1.287-1.276-1.287-.704 0-1.276.576-1.276 1.287 0 .71.572 1.287 1.276 1.287zm.14 2.042H3.01v9.372h1.415V9.336zm4.888 0H7.63v9.372h1.415v-4.906c0-2.59 3.35-2.802 3.35 0v4.906h1.415v-5.9c0-4.58-5.168-4.415-5.497-2.163V9.336zm12.393 2.42c-1.233 0-1.9.55-2.248.95v-1.37h-1.415v9.372h1.415v-4.51c0-1.16.36-2.74 2.168-2.74 1.67 0 1.67 1.56 1.67 2.79v4.46h1.415v-4.85c0-2.37-.51-4.012-2.99-4.012z"/>
        </svg>
      ),
      href: "https://skinlabsza.medium.com",
      label: "Medium",
    },
    {
      icon: () => (
        <svg className="h-5 w-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M22.539 8.242H1.46a1.3 1.3 0 0 0-1.3 1.3v5.016a1.3 1.3 0 0 0 1.3 1.3h21.078a1.3 1.3 0 0 0 1.3-1.3V9.542a1.3 1.3 0 0 0-1.3-1.3zM1.46 6.942h21.078a2.6 2.6 0 0 1 2.6 2.6v5.016a2.6 2.6 0 0 1-2.6 2.6H1.46a2.6 2.6 0 0 1-2.6-2.6V9.542a2.6 2.6 0 0 1 2.6-2.6zm5.2 3.9a.65.65 0 0 0-.65.65v1.95a.65.65 0 0 0 1.3 0v-1.95a.65.65 0 0 0-.65-.65zm4.55 0a.65.65 0 0 0-.65.65v1.95a.65.65 0 0 0 1.3 0v-1.95a.65.65 0 0 0-.65-.65zm4.55 0a.65.65 0 0 0-.65.65v1.95a.65.65 0 0 0 1.3 0v-1.95a.65.65 0 0 0-.65-.65z"/>
        </svg>
      ),
      href: "https://skinlabsza.substack.com",
      label: "Substack",
    },
  ];

  return (
    <footer id="contact" className="bg-black text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <img src={logo} alt="SKINLABS" className="w-[120px] h-auto mb-4" />
            <p className="text-background/70 text-sm max-w-xs mb-6">
              South Africa's independent skincare intelligence platform. Evidence-graded product reviews, daily skin science briefings and AI-personalised routines — no affiliate deals, no gifted samples.
            </p>
            <div className="mb-6">
              <p className="text-sm font-semibold text-background mb-3">Contact Us</p>
              <div className="space-y-2 text-sm text-background/70">
                <p>Email: <a href="mailto:support@skinlabs.co.za" className="hover:text-background">support@skinlabs.co.za</a></p>
                <p>WhatsApp: <a href="https://wa.me/27680200749" className="hover:text-background">+27 68 020 0749</a></p>
              </div>
            </div>
            <div className="mb-6">
              <p className="text-sm font-semibold text-background mb-3">Coming Soon</p>
              <div className="flex flex-col gap-3">
                <div className="bg-background/10 border border-background/20 rounded-lg px-4 py-2 flex items-center gap-3 max-w-[200px]">
                  <span className="text-xs text-background/70">Google Play</span>
                </div>
                <div className="bg-background/10 border border-background/20 rounded-lg px-4 py-2 flex items-center gap-3 max-w-[200px]">
                  <span className="text-xs text-background/70">App Store</span>
                </div>
              </div>
            </div>
            <div className="flex gap-4">
              {socials.map((social, i) => (
                <a key={i} href={social.href} target="_blank" rel="noopener noreferrer" className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors" aria-label={social.label}>
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Editorial</h4>
            <ul className="space-y-2">
              {links.editorial.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.label}
                    {link.isNew && <NewBadge />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Platform</h4>
            <ul className="space-y-2">
              {links.platform.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-background/70 hover:text-background transition-colors">
                    {link.label}
                    {link.isNew && <NewBadge />}
                    {link.isComingSoon && <ComingSoonBadge />}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {links.company.map((link) => (
                <li key={link.label}>
                  <Link to={link.href} className="text-sm text-background/70 hover:text-background transition-colors">{link.label}</Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/50">© {new Date().getFullYear()} SKINLABS. All rights reserved.</p>
          <div className="flex gap-6 text-sm text-background/50">
            <Link to="/privacy-policy" className="hover:text-background transition-colors">Privacy</Link>
            <Link to="/terms-of-service" className="hover:text-background transition-colors">Terms</Link>
            <Link to="/cookie-policy" className="hover:text-background transition-colors">Cookies</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
