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
            <img src={logo} alt="SKINLABS" className="w-[150px] h-auto mb-4" />
            <p className="text-background/70 text-sm max-w-xs mb-6">
              Next generation skincare technology for radiant, healthy skin. 
              Powered by science and AI.
            </p>
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
