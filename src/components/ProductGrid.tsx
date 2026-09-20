import { useState } from "react";
import { OrderModal } from "./OrderModal";
import { ProductCard } from "./ProductCard";
import type { Product } from "../lib/products";

const FILTERS = ["All", "Watches", "Shirts", "T-Shirts", "Pants", "Accessories"];

interface ProductGridProps {
  products: Product[];
  settings?: Record<string, string>;
}

export function ProductGrid({ products, settings = {} }: ProductGridProps) {
  const [filter, setFilter] = useState("All");
  const [order, setOrder] = useState<{ product: Product; color: string } | null>(null);

  const visible =
    filter === "All"
      ? products
      : products.filter(
          (p) => p.category?.toLowerCase().trim() === filter.toLowerCase().trim(),
        );

  return (
    <section id="shop" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">
            The Collection
          </p>
          <h2 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-gradient-teal">
              {settings["shop_headline"] ?? "Shop Best Sellers"}
            </span>
          </h2>
        </div>

        <div className="flex flex-wrap gap-2">
          {FILTERS.map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={
                f === filter
                  ? "bg-gradient-teal rounded-full px-4 py-2 text-xs font-bold tracking-wide text-primary-foreground uppercase"
                  : "rounded-full border border-border px-4 py-2 text-xs font-bold tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
              }
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
        {visible.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onOrder={(p, color) => setOrder({ product: p, color })}
          />
        ))}
      </div>

      {order && (
        <OrderModal
          product={order.product}
          initialColor={order.color}
          settings={settings}
          onClose={() => setOrder(null)}
        />
      )}
    </section>
  );
}
