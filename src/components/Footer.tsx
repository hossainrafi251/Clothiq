import { Facebook, Instagram, Mail, MapPin, MessageCircle, Phone, Clock } from "lucide-react";
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

const DEFAULTS = {
  site_name: "CLOTHIQ",
  site_tagline: "Own Your Vibe",
  footer_about:
    "Modern luxury menswear — tailored clothing, timepieces and accessories for men who own their vibe.",
  contact_phone: "+880 17 0000 0000",
  support_email: "care@clothiq.com",
  contact_address: "124 Gulshan Avenue, Dhaka 1212, Bangladesh",
  whatsapp_number: "8801700000000",
  facebook_url: "https://facebook.com",
  instagram_url: "https://instagram.com",
};

function telHref(value: string) {
  return `tel:${value.replace(/[^\d+]/g, "")}`;
}

function whatsappHref(value: string) {
  const digits = value.replace(/\D/g, "");
  return `https://wa.me/${digits || DEFAULTS.whatsapp_number}`;
}

export function Footer({ settings = {} }: { settings?: Record<string, string> }) {
  const get = (key: keyof typeof DEFAULTS) => {
    const value = (settings[key] ?? "").trim();
    return value || DEFAULTS[key];
  };
  const raw = (key: string) => (settings[key] ?? "").trim();

  const siteName = get("site_name");
  const tagline = get("site_tagline");
  const phone = get("contact_phone");
  const phone2 = raw("contact_phone_2");
  const hours = raw("business_hours");

  return (
    <footer className="border-t border-border bg-card">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-14 sm:px-6 md:grid-cols-2 lg:grid-cols-4">
        <div>
          <img
            src={logoMark.url}
            alt={`${siteName} — ${tagline}`}
            loading="lazy"
            className="h-12 w-auto rounded-sm object-cover"
          />
          <p className="mt-5 max-w-xs text-sm leading-relaxed text-muted-foreground">
            {get("footer_about")}
          </p>
          <div className="mt-6 flex gap-3">
            <a
              href={get("facebook_url")}
              aria-label="Facebook"
              className="rounded-full border border-border p-2.5 text-muted-foreground transition-colors hover:border-gold hover:text-gold"
            >
              <Facebook className="h-4 w-4" />
            </a>
            <a
              href={get("instagram_url")}
              aria-label="Instagram"
              className="rounded-full border border-border p-2.5 text-muted-foreground transition-colors hover:border-gold hover:text-gold"
            >
              <Instagram className="h-4 w-4" />
            </a>
            <a
              href={whatsappHref(get("whatsapp_number"))}
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
              {get("contact_address")}
            </li>
            <li className="flex gap-3">
              <Phone className="h-4 w-4 shrink-0 text-accent" />
              <span className="flex flex-col gap-1">
                <a href={telHref(phone)} className="hover:text-gold">
                  {phone}
                </a>
                {phone2 && (
                  <a href={telHref(phone2)} className="hover:text-gold">
                    {phone2}
                  </a>
                )}
              </span>
            </li>
            <li className="flex gap-3">
              <Mail className="h-4 w-4 shrink-0 text-accent" />
              <a href={`mailto:${get("support_email")}`} className="hover:text-gold">
                {get("support_email")}
              </a>
            </li>
            {hours && (
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-accent" />
                {hours}
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-border">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-6 sm:px-6">
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} {siteName}. All rights reserved.
          </p>
          <p className="text-xs tracking-[0.3em] text-gold uppercase">{tagline}</p>
        </div>
      </div>
    </footer>
  );
}
