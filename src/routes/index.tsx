import { createFileRoute } from "@tanstack/react-router";
import { CartProvider } from "../lib/cart";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { Categories } from "../components/Categories";
import { ProductGrid } from "../components/ProductGrid";
import { Footer } from "../components/Footer";
import { FlashSale } from "../components/FlashSale";
import { MetaTracker } from "../components/MetaTracker";
import { Reviews } from "../components/Reviews";
import { getStorefront, toProduct } from "../lib/store.functions";


export const Route = createFileRoute("/")({
  loader: () => getStorefront(),
  head: () => ({
    meta: [
      { title: "CLOTHIQ — Own Your Vibe | Luxury Men's Fashion" },
      {
        name: "description",
        content:
          "CLOTHIQ — modern luxury menswear. Shop tailored shirts, pants, premium watches and accessories. Own Your Vibe.",
      },
      { property: "og:title", content: "CLOTHIQ — Own Your Vibe" },
      {
        property: "og:description",
        content:
          "Modern luxury menswear: tailored shirts, pants, premium watches and accessories.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
  errorComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background px-4 text-center">
      <p className="text-sm text-muted-foreground">
        We couldn't load the collection right now. Please refresh the page.
      </p>
    </div>
  ),
});

function Index() {
  const { products, settings, reviews } = Route.useLoaderData();

  return (
    <CartProvider>
      <div className="min-h-screen bg-background text-foreground antialiased">
        <MetaTracker pixelId={settings["meta_pixel_id"] ?? ""} />
        <Header />
        <main>
          <Hero settings={settings} />
          <FlashSale settings={settings} />
          <Categories />
          <ProductGrid products={products.map(toProduct)} settings={settings} />
          <Reviews reviews={reviews} settings={settings} />
        </main>
        <Footer settings={settings} />
      </div>
    </CartProvider>
  );
}

