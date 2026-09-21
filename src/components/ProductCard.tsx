import { Heart, ShoppingBag, Star, Zap } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { useCart } from "@/lib/cart";
import { bdt } from "@/lib/currency";
import type { Product } from "@/lib/products";
import { trackMetaEvent } from "@/lib/meta-pixel";

interface Props {
  product: Product;
  onOrder: (product: Product, color: string) => void;
}

export function ProductCard({ product, onOrder }: Props) {
  const { addItem } = useCart();
  const slug = product.slug ?? product.id;
  const variants = (product.colorVariants ?? []).filter((v) => v.name);
  const [selected, setSelected] = useState(variants[0]?.name ?? "");

  const activeVariant = variants.find((v) => v.name === selected);
  const shownImage = activeVariant?.image || product.image;

  return (
    <article className="card-sheen group flex flex-col overflow-hidden rounded-2xl border border-border bg-card">
      <div className="relative overflow-hidden">
        <Link to="/product/$slug" params={{ slug }}>
          <img
            key={shownImage}
            src={shownImage}
            alt={product.name}
            loading="lazy"
            width={800}
            height={800}
            className="aspect-square w-full object-cover transition-transform duration-700 group-hover:scale-105"
          />
        </Link>
        {product.tag && (
          <span className="absolute top-3 left-3 rounded-full bg-gold px-3 py-1 text-[10px] font-bold tracking-widest text-gold-foreground uppercase">
            {product.tag}
          </span>
        )}
        <button
          aria-label={`Add ${product.name} to wishlist`}
          className="absolute top-3 right-3 rounded-full border border-border bg-background/70 p-2 text-muted-foreground opacity-0 backdrop-blur-md transition-all group-hover:opacity-100 hover:text-gold"
        >
          <Heart className="h-4 w-4" />
        </button>
      </div>

      <div className="flex min-w-0 flex-1 flex-col p-3 sm:p-5">
        <p className="truncate text-[9px] font-semibold tracking-[0.16em] text-accent uppercase sm:text-[11px] sm:tracking-[0.2em]">{product.category}</p>
        <Link to="/product/$slug" params={{ slug }}>
          <h3 className="font-display mt-1.5 line-clamp-2 min-h-10 text-sm leading-5 font-bold transition-colors hover:text-gold sm:min-h-0 sm:text-base sm:leading-snug">
            {product.name}
          </h3>
        </Link>
        <div className="mt-2 flex min-w-0 flex-wrap items-center gap-x-1.5 gap-y-1">
          <div className="flex">
            {Array.from({ length: 5 }).map((_, i) => (
              <Star
                key={i}
                className={
                  i < Math.round(product.rating)
                    ? "h-3.5 w-3.5 fill-gold text-gold"
                    : "h-3.5 w-3.5 text-muted-foreground"
                }
              />
            ))}
          </div>
          <span className="text-[10px] text-muted-foreground sm:text-xs">
            {product.rating} ({product.reviews})
          </span>
        </div>

        {variants.length > 0 && (
          <div className="mt-3 hidden min-w-0 sm:block">
            <p className="text-[10px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
              Color: <span className="text-foreground">{selected}</span>
            </p>
            <div className="mt-2 flex min-w-0 flex-wrap gap-1.5">
              {variants.map((v) => (
                <button
                  key={v.name}
                  type="button"
                  aria-pressed={v.name === selected}
                  onClick={() => setSelected(v.name)}
                  className={
                    v.name === selected
                      ? "max-w-full truncate rounded-full border border-gold px-2 py-1 text-[9px] font-bold tracking-wide text-gold uppercase sm:px-3 sm:text-[10px]"
                      : "max-w-full truncate rounded-full border border-border px-2 py-1 text-[9px] font-bold tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground sm:px-3 sm:text-[10px]"
                  }
                >
                  {v.name}
                </button>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-2">
          <p className="font-display text-base font-bold text-gold sm:text-lg">{bdt(product.price)}</p>
          <div className="mt-3 flex flex-col gap-2 md:flex-row">
            <button
              onClick={() => {
                addItem({ ...product, image: shownImage });
                trackMetaEvent("AddToCart", {
                  value: product.price,
                  contentIds: [product.id],
                  contentName: product.name,
                });
              }}
              className="inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full border border-border px-2 py-2.5 text-[10px] font-bold tracking-wide whitespace-nowrap text-foreground uppercase transition-colors hover:border-primary hover:text-primary sm:px-3 sm:text-xs md:w-auto md:flex-1"
            >
              <ShoppingBag className="h-3.5 w-3.5" />
              Add to Cart
            </button>
            <button
              onClick={() => {
                onOrder(product, selected);
                trackMetaEvent("ViewContent", {
                  value: product.price,
                  contentIds: [product.id],
                  contentName: product.name,
                });
              }}
              className="bg-gradient-teal inline-flex min-h-11 w-full items-center justify-center gap-1.5 rounded-full px-2 py-2.5 text-[10px] font-bold tracking-wide whitespace-nowrap text-primary-foreground uppercase shadow-[0_0_24px_-8px_oklch(0.85_0.13_200/70%)] transition-transform hover:scale-105 sm:px-3 sm:text-xs md:w-auto md:flex-1"
            >
              <Zap className="h-3.5 w-3.5" />
              Order Now
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
