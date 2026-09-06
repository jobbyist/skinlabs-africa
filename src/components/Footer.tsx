import { Link } from "react-router-dom";
import { Instagram, Facebook } from "lucide-react";
import logo from "@/assets/skinlabs-logo-white.svg";
import { useMembership } from "@/hooks/use-membership";

const NewBadge = () => (
  <span className="ml-1.5 rounded-full bg-primary px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-primary-foreground align-middle">New</span>
);

const ComingSoonBadge = () => (
  <span className="ml-1.5 rounded-full bg-amber-500 px-1.5 py-0.5 text-[9px] font-bold uppercase leading-none text-white align-middle whitespace-nowrap">Coming Soon</span>
);

const AppleIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z" />
  </svg>
);

const GooglePlayIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M3.18 23.73c.28.13.6.17.93.1l12.85-7.1-2.88-2.88-10.9 9.88zm16.95-9.15 2.05-1.13c.76-.42.76-1.48 0-1.9l-2.05-1.13-2.5 2.08 2.5 2.08zM3.18.27C2.9.4 2.7.64 2.58.95l10.9 9.88 2.88-2.88L4.11.17c-.3-.07-.63-.03-.93.1zM13.96 11.5 3.06 1.37l-.01.02L14.7 12l-1.75-.5zM3.05 22.63l10.91-10.13.01.02-1.75-.5L3.05 22.63z" />
  </svg>
);

const WhatsAppIcon = ({ className = "h-5 w-5" }: { className?: string }) => (
  <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const Footer = () => {
  const { isMember, loading: membershipLoading } = useMembership();

  const links = {
    editorial: [
      { label: "The Daily Skinny", href: "/briefings" },
      { label: "Product Reviews", href: "/reviews" },
      { label: "Shelf Showdown", href: "/compare", isNew: true },
      { label: "Brand Spotlight", href: "/spotlight", isNew: true },
      { label: "Seasonal Guides", href: "/seasonals", isNew: true },
      { label: "Podcast Series", href: "/podcast" },
    ],
    platform: [
      { label: "AI Formulator", href: "/ai-formulator" },
      { label: "Knowledge Hub", href: "/knowledge-hub" },
      { label: "Consultations", href: "/consultations", isNew: true },
      { label: "Marketplace", href: "/marketplace", isComingSoon: true },
      // Already a member — a "Memberships" link back to the pricing page is redundant.
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
      icon: WhatsAppIcon,
      href: "https://whatsapp.com/channel/0029VbEAGud7oQhZSPGNPg3J",
      label: "WhatsApp Channel",
    },
  ];

  return (
    <footer id="contact" className="bg-black text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          <div className="lg:col-span-2">
            <img src={logo} alt="SKINLABS" className="w-[120px] h-auto mb-4" />
            <p className="text-background/70 text-sm max-w-xs mb-6">
              Skincare, without the nonsense. Evidence-graded product reviews, daily skin science briefings and AI-personalised routines, built for South African skin — no affiliate deals, no gifted samples.
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
                <div className="bg-background/10 border border-background/20 rounded-xl px-4 py-3 flex items-center gap-3 max-w-[220px]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/15 text-background">
                    <GooglePlayIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 leading-tight">
                    <p className="text-[10px] uppercase tracking-wide text-background/50">Get it on</p>
                    <p className="text-sm font-semibold text-background">Google Play</p>
                  </div>
                </div>
                <div className="bg-background/10 border border-background/20 rounded-xl px-4 py-3 flex items-center gap-3 max-w-[220px]">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-background/15 text-background">
                    <AppleIcon className="h-5 w-5" />
                  </span>
                  <div className="min-w-0 leading-tight">
                    <p className="text-[10px] uppercase tracking-wide text-background/50">Download on the</p>
                    <p className="text-sm font-semibold text-background">App Store</p>
                  </div>
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
