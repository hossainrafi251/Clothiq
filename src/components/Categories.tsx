import { ArrowUpRight } from "lucide-react";
import { Link } from "@tanstack/react-router";
import catShirts from "../assets/cat-shirts.jpg";
import catWatches from "../assets/cat-watches.jpg";
import catAccessories from "../assets/cat-accessories.jpg";
import catTshirts from "../assets/cat-tshirts.jpg";

const TILES = [
  {
    name: "Men's Shirts",
    slug: "shirts",
    description: "Tailored fits, premium fabrics",
    image: catShirts,
  },
  {
    name: "Men's Watches",
    slug: "watches",
    description: "Statement timepieces",
    image: catWatches,
  },
  {
    name: "Accessories",
    slug: "accessories",
    description: "Wallets, ties & belts",
    image: catAccessories,
  },
  {
    name: "T-Shirts",
    slug: "t-shirts",
    description: "Premium casual tees",
    image: catTshirts,
  },
];

export function Categories() {
  return (
    <section id="categories" className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:py-20">
      <div className="mb-10 flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="text-xs font-semibold tracking-[0.3em] text-gold uppercase">
            Curated For You
          </p>
          <h2 className="font-display mt-2 text-3xl font-bold tracking-tight sm:text-4xl">
            Shop by <span className="text-gradient-teal">Category</span>
          </h2>
        </div>
        <a
          href="#shop"
          className="gold-underline text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          View All Products
        </a>
      </div>

      <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {TILES.map((cat) => (
          <Link
            key={cat.name}
            to="/category/$category"
            params={{ category: cat.slug }}
            className="card-sheen group relative block overflow-hidden rounded-2xl border border-border"
          >
            <img
              src={cat.image}
              alt={cat.name}
              loading="lazy"
              width={800}
              height={1000}
              className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
            <div className="absolute right-0 bottom-0 left-0 flex items-end justify-between p-6">
              <div>
                <h3 className="font-display text-xl font-bold">{cat.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{cat.description}</p>
              </div>
              <span className="bg-gradient-teal rounded-full p-2.5 text-primary-foreground transition-transform group-hover:rotate-45">
                <ArrowUpRight className="h-4 w-4" />
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
