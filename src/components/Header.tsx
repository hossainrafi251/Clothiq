import { Heart, Menu, Search, ShoppingBag, X } from "lucide-react";
import { useState } from "react";
import { Link } from "@tanstack/react-router";
import logoMark from "../assets/clothiq-mark.jpg.asset.json";
import { useCart } from "../lib/cart";
import { CATEGORIES } from "../lib/categories";
import { CartDrawer } from "./CartDrawer";

const NAV_LINKS = CATEGORIES.map((c) => ({ label: c.name, slug: c.slug }));

export function Header() {
  const { count, setOpen } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  return (
    <>
      <header className="sticky top-0 z-40 border-b border-border bg-background/90 backdrop-blur-md">
        <div className="bg-gradient-teal h-1 w-full" />
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" className="flex items-center gap-3">
            <img
              src={logoMark.url}
              alt="CLOTHIQ — Own Your Vibe"
              className="h-11 w-auto rounded-sm object-cover sm:h-12"
            />
          </Link>

          <nav className="hidden items-center gap-7 lg:flex">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.label}
                to="/category/$category"
                params={{ category: link.slug }}
                activeProps={{ className: "text-foreground" }}
                className="gold-underline text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:text-foreground"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              aria-label="Search"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Search className="h-5 w-5" />
            </button>
            <button
              aria-label="Wishlist"
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <Heart className="h-5 w-5" />
            </button>
            <button
              aria-label="Shopping cart"
              onClick={() => setOpen(true)}
              className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
            >
              <ShoppingBag className="h-5 w-5" />
              {count > 0 && (
                <span className="bg-gradient-teal absolute -top-0.5 -right-0.5 flex h-5 w-5 items-center justify-center rounded-full text-[11px] font-bold text-primary-foreground">
                  {count}
                </span>
              )}
            </button>
            <button
              aria-label="Menu"
              onClick={() => setMobileOpen(!mobileOpen)}
              className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground lg:hidden"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {mobileOpen && (
          <nav className="border-t border-border px-4 py-4 lg:hidden">
            <div className="flex flex-col gap-1">
              {NAV_LINKS.map((link) => (
                <a
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-3 py-2.5 text-sm font-medium text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
                >
                  {link.label}
                </a>
              ))}
            </div>
          </nav>
        )}
      </header>
      <CartDrawer />
    </>
  );
}
