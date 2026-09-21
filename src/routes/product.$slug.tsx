import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { Star, Zap, ShoppingBag, Play, Pause, Volume2, VolumeX, Maximize2, ImageIcon } from "lucide-react";
import { CartProvider, useCart } from "../lib/cart";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { MetaTracker } from "../components/MetaTracker";
import { OrderModal } from "../components/OrderModal";
import { ProductCard } from "../components/ProductCard";
import { Button } from "../components/ui/button";
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
              <div className="grid grid-cols-2 gap-2 sm:gap-5 lg:grid-cols-4">
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

function ProductMediaGallery({
  product,
  image,
  imageAlt,
}: {
  product: Product;
  image: string;
  imageAlt: string;
}) {
  const [view, setView] = useState<"image" | "video">("image");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const syncFullscreen = () => setIsFullscreen(document.fullscreenElement === stageRef.current);
    document.addEventListener("fullscreenchange", syncFullscreen);
    return () => document.removeEventListener("fullscreenchange", syncFullscreen);
  }, []);

  useEffect(() => {
    if (view === "image") {
      videoRef.current?.pause();
    }
  }, [view]);

  const togglePlayback = async () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      await video.play().catch(() => undefined);
    } else {
      video.pause();
    }
  };

  const toggleMute = () => {
    const video = videoRef.current;
    if (!video) return;
    video.muted = !video.muted;
    setIsMuted(video.muted);
  };

  const toggleFullscreen = async () => {
    const stage = stageRef.current;
    if (!stage) return;
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(() => undefined);
    } else {
      await stage.requestFullscreen().catch(() => undefined);
    }
  };

  return (
    <div className="space-y-3">
      <div
        ref={stageRef}
        className="group relative overflow-hidden rounded-2xl border border-border bg-card"
      >
        {view === "video" && product.video ? (
          <>
            <video
              ref={videoRef}
              key={product.video}
              src={product.video}
              playsInline
              muted={isMuted}
              preload="metadata"
              poster={image}
              aria-label={`${product.name} product video`}
              onClick={togglePlayback}
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onEnded={() => setIsPlaying(false)}
              onVolumeChange={(event) => setIsMuted(event.currentTarget.muted)}
              className="aspect-square w-full cursor-pointer bg-background object-contain"
            />

            {!isPlaying && (
              <Button
                type="button"
                size="icon"
                onClick={togglePlayback}
                aria-label="Play product video"
                className="absolute top-1/2 left-1/2 h-14 w-14 -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/95 shadow-lg hover:bg-primary"
              >
                <Play className="ml-0.5 h-6 w-6" />
              </Button>
            )}

            <div className="absolute inset-x-3 bottom-3 flex items-center justify-between rounded-lg border border-border/60 bg-background/90 p-1.5 shadow-lg backdrop-blur-md sm:inset-x-4 sm:bottom-4">
              <div className="flex items-center gap-1">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={togglePlayback}
                  aria-label={isPlaying ? "Pause product video" : "Play product video"}
                  title={isPlaying ? "Pause" : "Play"}
                  className="h-9 w-9 rounded-md"
                >
                  {isPlaying ? <Pause /> : <Play />}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={toggleMute}
                  aria-label={isMuted ? "Unmute product video" : "Mute product video"}
                  title={isMuted ? "Unmute" : "Mute"}
                  className="h-9 w-9 rounded-md"
                >
                  {isMuted ? <VolumeX /> : <Volume2 />}
                </Button>
              </div>
              <span className="hidden text-xs font-semibold text-muted-foreground sm:block">
                Product video
              </span>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={toggleFullscreen}
                aria-label={isFullscreen ? "Exit fullscreen" : "View product video fullscreen"}
                title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                className="h-9 w-9 rounded-md"
              >
                <Maximize2 />
              </Button>
            </div>
          </>
        ) : (
          <img
            key={image}
            src={image}
            alt={imageAlt}
            width={1024}
            height={1024}
            className="aspect-square w-full object-cover"
          />
        )}
      </div>

      {product.video && (
        <div className="flex items-center gap-3" role="tablist" aria-label="Product media">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setView("image")}
            role="tab"
            aria-selected={view === "image"}
            aria-label="Show product photo"
            className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 p-0 transition-colors ${
              view === "image" ? "border-primary ring-2 ring-primary/25" : "border-border hover:border-primary/60"
            }`}
          >
            <img src={image} alt="" className="h-full w-full object-cover" />
            <span className="absolute right-1 bottom-1 grid h-6 w-6 place-items-center rounded-md bg-background/90 text-foreground shadow">
              <ImageIcon className="h-3.5 w-3.5" />
            </span>
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setView("video")}
            role="tab"
            aria-selected={view === "video"}
            aria-label="Show product video"
            className={`relative h-20 w-20 overflow-hidden rounded-lg border-2 p-0 transition-colors ${
              view === "video" ? "border-primary ring-2 ring-primary/25" : "border-border hover:border-primary/60"
            }`}
          >
            <video
              src={product.video}
              muted
              playsInline
              preload="metadata"
              poster={image}
              className="h-full w-full bg-background object-cover"
            />
            <span className="absolute inset-0 grid place-items-center bg-background/35">
              <span className="grid h-8 w-8 place-items-center rounded-full bg-primary text-primary-foreground shadow">
                <Play className="ml-0.5 h-4 w-4" />
              </span>
            </span>
          </Button>
          <span className="text-xs font-medium text-muted-foreground" aria-live="polite">
            {view === "image" ? "Product photo" : "Product video"}
          </span>
        </div>
      )}
    </div>
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
        <ProductMediaGallery
          product={product}
          image={shownImage}
          imageAlt={activeVariant ? `${product.name} — ${activeVariant.name}` : product.name}
        />


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
