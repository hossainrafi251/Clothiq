export interface StoreCategory {
  name: string;
  slug: string;
  blurb: string;
}

/** Every shoppable category, in the order they appear in navigation and filters. */
export const CATEGORIES: StoreCategory[] = [
  { name: "Watches", slug: "watches", blurb: "Statement timepieces" },
  { name: "Shirts", slug: "shirts", blurb: "Tailored fits, premium fabrics" },
  { name: "T-Shirts", slug: "t-shirts", blurb: "Everyday premium cotton tees" },
  { name: "Pants", slug: "pants", blurb: "Trousers & chinos" },
  { name: "Accessories", slug: "accessories", blurb: "Wallets, ties & belts" },
];

export function slugifyCategory(value: string): string {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function categoryBySlug(slug: string): StoreCategory | undefined {
  const wanted = slugifyCategory(slug);
  return CATEGORIES.find((c) => c.slug === wanted);
}
