import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Star, Zap, ShoppingBag } from "lucide-react";
import { CartProvider, useCart } from "../lib/cart";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { MetaTracker } from "../components/MetaTracker";
import { OrderModal } from "../components/OrderModal";
import { ProductCard } from "../components/ProductCard";
import { bdt } from "../lib/currency";
import { slugifyCategory } from "../lib/categories";
import { trackMetaEvent } from "../lib/meta-pixel";
import { getProductPage, toProduct } from "../lib/store.functions";
import type { DbProduct } from "../lib/store.functions";
import type { Product } from "../lib/products";

export const Route = createFileRoute("/product/$slug")({
  loader: ({ params }) => getProductPage({ data: { slug: params.slug } }),
  head: ({ loaderData }) => {
    const product = loaderData?.product;
    if (!product) {
      return {
        meta: [
          { title: "Product not found — CLOTHIQ" },
          { name: "robots", content: "noindex" },
        ],
      };
    }
    const description =
      product.description?.slice(0, 155) ||
      `Buy ${product.title} at CLOTHIQ. Cash on delivery across Bangladesh.`;
    return {
      meta: [
        { title: `${product.title} — ৳${Number(product.price)} | CLOTHIQ` },
        { name: "description", content: description },
        { property: "og:title", content: `${product.title} | CLOTHIQ` },
        { property: "og:description", content: description },
        { property: "og:type", content: "product" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: ProductPage,
});

function ProductPage() {
  const { product, related, settings } = Route.useLoaderData();

  if (!product) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background px-4 text-center text-foreground">
        <h1 className="font-display text-2xl font-bold">This product is no longer available</h1>
        <Link to="/" className="text-sm font-semibold text-primary hover:underline">
          Back to the store
        </Link>
      </div>
    );
  }

  return (
    <CartProvider>
      <div className="min-h-screen bg-background text-foreground antialiased">
        <MetaTracker pixelId={settings["meta_pixel_id"] ?? ""} />
        <Header />
        <main>
          <ProductDetail product={toProduct(product)} settings={settings} />
          {related.length > 0 && (
            <section className="mx-auto max-w-7xl px-4 pb-20 sm:px-6">
              <h2 className="font-display mb-6 text-2xl font-bold">You may also like</h2>
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
                {related.map((r) => (
                  <RelatedCard key={r.id} product={toProduct(r)} settings={settings} />
                ))}
              </div>
            </section>
          )}
        </main>
        <Footer />
      </div>
    </CartProvider>
  );
}

function RelatedCard({ product, settings }: { product: Product; settings: Record<string, string> }) {
  const [order, setOrder] = useState<{ product: Product; color: string } | null>(null);
  return (
    <>
      <ProductCard product={product} onOrder={(p, color) => setOrder({ product: p, color })} />
      {order && (
        <OrderModal
          product={order.product}
          initialColor={order.color}
          settings={settings}
          onClose={() => setOrder(null)}
        />
      )}
    </>
  );
}

function ProductDetail({
  product,
  settings,
}: {
  product: Product;
  settings: Record<string, string>;
}) {
  const { addItem } = useCart();
  const variants = (product.colorVariants ?? []).filter((v) => v.name);
  const [selected, setSelected] = useState(variants[0]?.name ?? "");
  const [ordering, setOrdering] = useState(false);
  const activeVariant = variants.find((v) => v.name === selected);
  const shownImage = activeVariant?.image || product.image;

  return (
    <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:py-14">
      <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
        <Link to="/" className="hover:text-foreground">
          Home
        </Link>
        <span>/</span>
        <Link
          to="/category/$category"
          params={{ category: slugifyCategory(product.category) }}
          className="hover:text-foreground"
        >
          {product.category}
        </Link>
        <span>/</span>
        <span className="text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2">
        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <img
            key={shownImage}
            src={shownImage}
            alt={activeVariant ? `${product.name} — ${activeVariant.name}` : product.name}
            width={1024}
            height={1024}
            className="aspect-square w-full object-cover"
          />
        </div>

        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">
            {product.category}
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          <div className="mt-3 flex items-center gap-1.5">
            <div className="flex">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={
                    i < Math.round(product.rating)
                      ? "h-4 w-4 fill-gold text-gold"
                      : "h-4 w-4 text-muted-foreground"
                  }
                />
              ))}
            </div>
            <span className="text-sm text-muted-foreground">
              {product.rating} ({product.reviews} reviews)
            </span>
          </div>

          <p className="font-display mt-5 text-3xl font-bold text-gold">{bdt(product.price)}</p>

          {variants.length > 0 && (
            <div className="mt-6">
              <p className="text-[11px] font-semibold tracking-[0.2em] text-muted-foreground uppercase">
                Color: <span className="text-foreground">{selected}</span>
              </p>
              <div className="mt-2 flex flex-wrap gap-2">
                {variants.map((v) => (
                  <button
                    key={v.name}
                    type="button"
                    aria-pressed={v.name === selected}
                    onClick={() => setSelected(v.name)}
                    className={
                      v.name === selected
                        ? "rounded-full border border-gold px-4 py-1.5 text-xs font-bold tracking-wide text-gold uppercase"
                        : "rounded-full border border-border px-4 py-1.5 text-xs font-bold tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
                    }
                  >
                    {v.name}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <button
              onClick={() => setOrdering(true)}
              className="bg-gradient-teal inline-flex flex-1 items-center justify-center gap-2 rounded-full px-6 py-3.5 text-sm font-bold tracking-wide text-primary-foreground uppercase transition-transform hover:scale-105"
            >
              <Zap className="h-4 w-4" />
              Order Now — Cash on Delivery
            </button>
            <button
              onClick={() => addItem({ ...product, image: shownImage })}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-border px-6 py-3.5 text-sm font-bold tracking-wide text-foreground uppercase transition-colors hover:border-primary hover:text-primary"
            >
              <ShoppingBag className="h-4 w-4" />
              Add to Cart
            </button>
          </div>

          {product.name && (
            <div className="mt-8 rounded-2xl border border-border bg-card p-5 text-sm leading-relaxed text-muted-foreground">
              {settings["product_note"] ??
                "Free size exchange within 3 days. Delivery across Bangladesh with cash on delivery."}
            </div>
          )}
        </div>
      </div>

      {ordering && (
        <OrderModal
          product={product}
          initialColor={selected}
          settings={settings}
          onClose={() => setOrdering(false)}
        />
      )}
    </section>
  );
}
