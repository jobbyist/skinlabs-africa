import { Link } from "react-router-dom";
import { Instagram, Twitter, Facebook, Youtube } from "lucide-react";
import logo from "@/assets/skinlabs-logo-white.svg";

const Footer = () => {
  const links = {
    shop: ["All Products", "Devices", "Serums", "Custom Formulas", "Gift Sets"],
    company: ["About Us", "Our Science", "Sustainability", "Careers", "Press"],
    support: ["Contact", "FAQ", "Shipping", "Returns", "Track Order"],
  };

  const socials = [
    { icon: Instagram, href: "#" },
    { icon: Twitter, href: "#" },
    { icon: Facebook, href: "#" },
    { icon: Youtube, href: "#" },
  ];

  return (
    <footer id="contact" className="bg-foreground text-background py-16">
      <div className="container mx-auto px-4">
        <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-10 mb-12">
          {/* Brand */}
          <div className="lg:col-span-2">
            <img src={logo} alt="SKINLABS" className="w-[120px] h-auto mb-4" />
            <p className="text-background/70 text-sm max-w-xs mb-6">
              Next generation skincare technology for radiant, healthy skin. 
              Powered by science and AI.
            </p>
            
            {/* App Store Badges */}
            <div className="mb-6">
              <p className="text-sm font-semibold text-background mb-3">Coming Soon</p>
              <div className="flex flex-col gap-3">
                <div className="bg-background/10 border border-background/20 rounded-lg px-4 py-2 flex items-center gap-3 max-w-[200px]">
                  <svg className="w-6 h-6 text-background" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.523 15.3414c-.5511-.0001-.9993-.4483-.9993-.9993 0-.5511.4483-.9993.9993-.9993.5511 0 .9993.4483.9993.9993 0 .5511-.4482.9993-.9993.9993m-11.046 0c-.5511 0-.9993-.4483-.9993-.9993 0-.5511.4482-.9993.9993-.9993.5511 0 .9993.4483.9993.9993 0 .5511-.4482.9993-.9993.9993m11.4045-6.02154l1.9973-3.4616c.1086-.1882.0441-.4288-.1441-.5374-.1881-.1087-.4288-.0442-.5373.1441l-2.0223 3.5076c-1.3252-.6074-2.8059-.9483-4.3735-.9483s-3.0483.3409-4.3736.9483L6.4241 5.9145c-.1086-.1883-.3491-.2528-.5373-.1441-.1882.1086-.2527.3492-.1441.5374l1.9973 3.4616C5.2945 10.9863 3.5 13.2363 3.5 15.9493v.0507h17v-.0507c0-2.713-1.7945-4.963-4.2385-6.62884" />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-xs text-background/70">Google Play</span>
                  </div>
                </div>
                <div className="bg-background/10 border border-background/20 rounded-lg px-4 py-2 flex items-center gap-3 max-w-[200px]">
                  <svg className="w-6 h-6 text-background" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                  <div className="flex flex-col">
                    <span className="text-xs text-background/70">App Store</span>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex gap-4">
              {socials.map((social, i) => (
                <a
                  key={i}
                  href={social.href}
                  className="w-10 h-10 rounded-full bg-background/10 flex items-center justify-center hover:bg-background/20 transition-colors"
                >
                  <social.icon className="h-5 w-5" />
                </a>
              ))}
            </div>
          </div>

          {/* Shop links */}
          <div>
            <h4 className="font-semibold mb-4">Shop</h4>
            <ul className="space-y-2">
              {links.shop.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-background/70 hover:text-background transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Company links */}
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2">
              {links.company.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-background/70 hover:text-background transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>

          {/* Support links */}
          <div>
            <h4 className="font-semibold mb-4">Support</h4>
            <ul className="space-y-2">
              {links.support.map((link) => (
                <li key={link}>
                  <a href="#" className="text-sm text-background/70 hover:text-background transition-colors">
                    {link}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-8 border-t border-background/10 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-sm text-background/50">
            © {new Date().getFullYear()} SKINLABS. All rights reserved.
          </p>
          <div className="flex gap-6 text-sm text-background/50">
            <a href="#" className="hover:text-background transition-colors">Privacy Policy</a>
            <a href="#" className="hover:text-background transition-colors">Terms of Service</a>
            <a href="#" className="hover:text-background transition-colors">Cookie Policy</a>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
