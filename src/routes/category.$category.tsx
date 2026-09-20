import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { CartProvider } from "../lib/cart";
import { Header } from "../components/Header";
import { Footer } from "../components/Footer";
import { MetaTracker } from "../components/MetaTracker";
import { ProductCard } from "../components/ProductCard";
import { OrderModal } from "../components/OrderModal";
import { CATEGORIES, categoryBySlug } from "../lib/categories";
import { getCategoryPage, toProduct } from "../lib/store.functions";
import type { Product } from "../lib/products";

export const Route = createFileRoute("/category/$category")({
  loader: async ({ params }) => {
    const category = categoryBySlug(params.category);
    const name = category?.name ?? params.category.replace(/-/g, " ");
    const data = await getCategoryPage({ data: { category: name } });
    return { ...data, categoryName: category?.name ?? name, known: Boolean(category) };
  },
  head: ({ loaderData }) => {
    const name = loaderData?.categoryName ?? "Collection";
    const title = `${name} — Shop the Collection | CLOTHIQ`;
    const description = `Shop premium ${name.toLowerCase()} at CLOTHIQ. Cash on delivery across Bangladesh.`;
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: CategoryPage,
});

function CategoryPage() {
  const { products, settings, categoryName } = Route.useLoaderData();
  const [order, setOrder] = useState<{ product: Product; color: string } | null>(null);

  return (
    <CartProvider>
      <div className="min-h-screen bg-background text-foreground antialiased">
        <MetaTracker pixelId={settings["meta_pixel_id"] ?? ""} />
        <Header />
        <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:py-16">
          <nav className="mb-6 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
            <Link to="/" className="hover:text-foreground">
              Home
            </Link>
            <span>/</span>
            <span className="text-foreground">{categoryName}</span>
          </nav>

          <h1 className="font-display text-3xl font-bold tracking-tight sm:text-4xl">
            <span className="text-gradient-teal">{categoryName}</span>
          </h1>

          <div className="mt-6 flex flex-wrap gap-2">
            {CATEGORIES.map((c) => (
              <Link
                key={c.slug}
                to="/category/$category"
                params={{ category: c.slug }}
                className={
                  c.name === categoryName
                    ? "bg-gradient-teal rounded-full px-4 py-2 text-xs font-bold tracking-wide text-primary-foreground uppercase"
                    : "rounded-full border border-border px-4 py-2 text-xs font-bold tracking-wide text-muted-foreground uppercase transition-colors hover:text-foreground"
                }
              >
                {c.name}
              </Link>
            ))}
          </div>

          {products.length === 0 ? (
            <p className="mt-12 text-sm text-muted-foreground">
              No products in this collection yet. Please check back soon.
            </p>
          ) : (
            <div className="mt-10 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={toProduct(p)}
                  onOrder={(prod, color) => setOrder({ product: prod, color })}
                />
              ))}
            </div>
          )}
        </main>
        <Footer settings={settings} />
      </div>

      {order && (
        <OrderModal
          product={order.product}
          initialColor={order.color}
          settings={settings}
          onClose={() => setOrder(null)}
        />
      )}
    </CartProvider>
  );
}
