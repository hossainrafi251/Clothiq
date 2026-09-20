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
        <ProductViewContent
          product={product}
          pixelId={settings["meta_pixel_id"] ?? ""}
        />
        <Header />
        <main>
          <ProductDetail
            product={toProduct(product)}
            offerNote={product.offer_note}
            settings={settings}
          />
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
        <Footer settings={settings} />
      </div>
    </CartProvider>
  );
}

/** Fires the Meta `ViewContent` standard event for the product being viewed, so
 *  Meta Ads can attribute and optimize conversions for traffic landing here. */
function ProductViewContent({ product, pixelId }: { product: DbProduct; pixelId: string }) {
  useEffect(() => {
    if (!pixelId) return;
    trackMetaEvent("ViewContent", {
      contentIds: [product.id],
      contentName: product.title,
      value: Number(product.price),
    });
  }, [pixelId, product.id, product.title, product.price]);
  return null;
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
  offerNote,
  settings,
}: {
  product: Product;
  offerNote: string;
  settings: Record<string, string>;
}) {
  const { addItem } = useCart();
  const variants = (product.colorVariants ?? []).filter((v) => v.name);
  const [selected, setSelected] = useState(variants[0]?.name ?? "");
  const [ordering, setOrdering] = useState(false);
  const [view, setView] = useState<"image" | "video">("image");
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
        <div className="space-y-3">
          <div className="overflow-hidden rounded-2xl border border-border bg-card">
            {view === "video" && product.video ? (
              <video
                key={product.video}
                src={product.video}
                controls
                playsInline
                autoPlay
                muted
                loop
                preload="metadata"
                poster={shownImage}
                className="aspect-square w-full bg-black object-contain"
              />
            ) : (
              <img
                key={shownImage}
                src={shownImage}
                alt={activeVariant ? `${product.name} — ${activeVariant.name}` : product.name}
                width={1024}
                height={1024}
                className="aspect-square w-full object-cover"
              />
            )}
          </div>

          {product.video && (
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setView("image")}
                aria-label="Show product photo"
                className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 transition ${
                  view === "image" ? "border-accent" : "border-border hover:border-accent/60"
                }`}
              >
                <img src={shownImage} alt="" className="h-full w-full object-cover" />
              </button>
              <button
                type="button"
                onClick={() => setView("video")}
                aria-label="Play product video"
                className={`relative h-20 w-20 overflow-hidden rounded-xl border-2 transition ${
                  view === "video" ? "border-accent" : "border-border hover:border-accent/60"
                }`}
              >
                <video
                  src={product.video}
                  muted
                  playsInline
                  preload="metadata"
                  poster={shownImage}
                  className="h-full w-full bg-black object-cover"
                />
                <span className="absolute inset-0 flex items-center justify-center bg-black/35">
                  <Play className="h-6 w-6 text-white" />
                </span>
              </button>
            </div>
          )}
        </div>


        <div>
          <p className="text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">
            {product.category}
          </p>
          <h1 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            {product.name}
          </h1>
          {offerNote.trim() && (
            <p className="mt-2 text-base font-semibold text-muted-foreground sm:text-lg">
              {offerNote.trim()}
            </p>
          )}
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
