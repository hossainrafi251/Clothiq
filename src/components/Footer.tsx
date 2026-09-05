import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone } from "lucide-react";
import logoMark from "../assets/clothiq-mark.jpg.asset.json";

const QUICK_LINKS = [
  "Men's Clothing",
  "Accessories",
  "Watches",
  "Best Sellers",
  "New Arrivals",
];

const SUPPORT_LINKS = [
  "Shipping & Delivery",
  "Returns & Exchanges",
  "Size Guide",
  "Privacy Policy",
  "Terms of Service",
];

export function Footer() {
  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <img
            src={logoMark.url}
            alt="CLOTHIQ — Own Your Vibe"
            loading="lazy"
            className="h-12 w-auto rounded-sm object-cover"
          />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            Modern luxury menswear — tailored clothing, timepieces and accessories
            for men who own their vibe.
          </p>
          <div className="mt-6 flex gap-3">
            <a
              href="https://facebook.com"
              aria-label="Facebook"
              className="rounded-full border border-border p-2.5 text-muted-foreground transition-colors hover:border-gold hover:text-gold"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href="https://instagram.com"
              aria-label="Instagram"
              className="rounded-full border border-border p-2.5 text-muted-foreground transition-colors hover:border-gold hover:text-gold"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href="https://wa.me/8801700000000"
              aria-label="WhatsApp"
              className="rounded-full border border-border p-2.5 text-muted-foreground transition-colors hover:border-gold hover:text-gold"
            >
              <MessageCircle className="h-4 w-4" />
            </a>
          </div>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold tracking-[0.2em] uppercase">
            Quick Links
          </h3>
          <ul className="mt-5 flex flex-col gap-3">
            {QUICK_LINKS.map((link) => (
              <li key={link}>
                <a
                  href="#shop"
                  className="text-sm text-muted-foreground transition-colors hover:text-gold"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold tracking-[0.2em] uppercase">
            Customer Care
          </h3>
          <ul className="mt-5 flex flex-col gap-3">
            {SUPPORT_LINKS.map((link) => (
              <li key={link}>
                <a
                  href="#top"
                  className="text-sm text-muted-foreground transition-colors hover:text-gold"
                >
                  {link}
                </a>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="font-display text-sm font-bold tracking-[0.2em] uppercase">
            Contact
          </h3>
          <ul className="mt-5 flex flex-col gap-4 text-sm text-muted-foreground">
            <li className="flex gap-3">
              <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
              124 Gulshan Avenue, Dhaka 1212, Bangladesh
            </li>
            <li className="flex gap-3">
              <Phone className="h-4 w-4 shrink-0 text-accent" />
              <a href="tel:+8801700000000" className="hover:text-gold">
                +880 17 0000 0000
              </a>
            </li>
            <li className="flex gap-3">
              <Mail className="h-4 w-4 shrink-0 text-accent" />
              <a href="mailto:care@clothiq.com" className="hover:text-gold">
                care@clothiq.com
              </a>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} CLOTHIQ. All rights reserved.
          </p>
          <p className="text-xs tracking-[0.3em] text-gold uppercase">Own Your Vibe</p>
        </div>
      </div>
    </footer>
  );
}
