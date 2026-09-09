import { createServerFn } from "@tanstack/react-start";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";
import type { ColorVariant, Product } from "./products";

export function parseVariants(raw: unknown): ColorVariant[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((v) => ({
      name: String((v as { name?: unknown })?.name ?? "").trim(),
      image: String((v as { image?: unknown })?.image ?? "").trim(),
    }))
    .filter((v) => v.name.length > 0);
}

export interface DbProduct {
  id: string;
  slug: string;
  title: string;
  price: number;
  image_url: string;
  description: string;
  category: string;
  stock: number;
  tag: string | null;
  rating: number;
  reviews: number;
  sort_order: number;
  color_variants?: ColorVariant[];
}

export type SiteSettings = Record<string, string>;

export function toProduct(p: DbProduct): Product {
  return {
    id: p.id,
    slug: p.slug,
    name: p.title,
    category: p.category,
    price: Number(p.price),
    rating: Number(p.rating),
    reviews: p.reviews,
    image: p.image_url,
    ...(p.tag ? { tag: p.tag } : {}),
    colorVariants: parseVariants(p.color_variants),
  };
}

function publicClient() {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        return fetch(input, { ...init, headers: h });
      },
    },
  });
}

const PRODUCT_COLUMNS =
  "id,slug,title,price,image_url,description,category,stock,tag,rating,reviews,sort_order,color_variants";

function normalizeProduct(p: Record<string, unknown>): DbProduct {
  return {
    ...(p as unknown as DbProduct),
    price: Number(p["price"]),
    color_variants: parseVariants(p["color_variants"]),
  };
}

async function loadSettings(sb: ReturnType<typeof publicClient>): Promise<SiteSettings> {
  const { data } = await sb.from("site_settings").select("key,value");
  const map: SiteSettings = {};
  for (const row of (data ?? []) as { key: string; value: string }[]) map[row.key] = row.value;
  return map;
}

/** One product plus store settings, looked up by its permanent URL slug. */
export const getProductPage = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ slug: z.string().trim().min(1).max(200) }).parse(input),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const [{ data: product }, settings] = await Promise.all([
      sb.from("products").select(PRODUCT_COLUMNS).eq("slug", data.slug).maybeSingle(),
      loadSettings(sb),
    ]);
    if (!product) return { product: null, related: [], settings };

    const row = normalizeProduct(product as Record<string, unknown>);
    const { data: related } = await sb
      .from("products")
      .select(PRODUCT_COLUMNS)
      .eq("category", row.category)
      .neq("slug", row.slug)
      .order("sort_order", { ascending: true })
      .limit(4);

    return {
      product: row,
      related: ((related ?? []) as Record<string, unknown>[]).map(normalizeProduct),
      settings,
    };
  });

/** All products in one category, looked up by the category name. */
export const getCategoryPage = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) =>
    z.object({ category: z.string().trim().min(1).max(60) }).parse(input),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const [{ data: products }, settings] = await Promise.all([
      sb
        .from("products")
        .select(PRODUCT_COLUMNS)
        .ilike("category", data.category)
        .order("sort_order", { ascending: true }),
      loadSettings(sb),
    ]);
    return {
      products: ((products ?? []) as Record<string, unknown>[]).map(normalizeProduct),
      settings,
    };
  });

export const getStorefront = createServerFn({ method: "GET" }).handler(async () => {
  const sb = publicClient();
  const [{ data: products }, { data: settings }] = await Promise.all([
    sb
      .from("products")
      .select(PRODUCT_COLUMNS)
      .order("sort_order", { ascending: true }),
    sb.from("site_settings").select("key,value"),
  ]);

  const { data: reviews } = await sb
    .from("reviews")
    .select("id,author,rating,comment")
    .eq("approved", true)
    .order("created_at", { ascending: false })
    .limit(30);

  const settingsMap: SiteSettings = {};
  for (const row of (settings ?? []) as { key: string; value: string }[]) {
    settingsMap[row.key] = row.value;
  }

  return {
    products: ((products ?? []) as Record<string, unknown>[]).map(
      (p) =>
        ({
          ...(p as unknown as DbProduct),
          price: Number(p["price"]),
          color_variants: parseVariants(p["color_variants"]),
        }) satisfies DbProduct,
    ),
    settings: settingsMap,
    reviews: ((reviews ?? []) as { id: string; author: string; rating: number; comment: string }[]).map(
      (r) => ({ id: r.id, author: r.author, rating: Number(r.rating), comment: r.comment }),
    ),
  };
});

const orderSchema = z.object({
  productId: z.string().uuid(),
  productTitle: z.string().trim().min(1).max(200),
  size: z.string().trim().max(40),
  color: z.string().trim().max(40),
  quantity: z.number().int().min(1).max(50),
  unitPrice: z.number().min(0).max(10_000_000),
  fullName: z.string().trim().min(1).max(100),
  phone: z.string().trim().regex(/^01[3-9]\d{8}$/),
  district: z.string().trim().min(1).max(60),
  thana: z.string().trim().min(1).max(80),
  address: z.string().trim().min(1).max(300),
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => orderSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const { data: product, error: pErr } = await supabaseAdmin
      .from("products")
      .select("id,title,price,image_url,color_variants")
      .eq("id", data.productId)
      .maybeSingle();
    if (pErr || !product) throw new Error("Product not found");

    const variants = parseVariants((product as { color_variants?: unknown }).color_variants);
    const matched = variants.find(
      (v) => v.name.toLowerCase() === data.color.trim().toLowerCase(),
    );
    const colorImage = matched?.image || String((product as { image_url?: string }).image_url ?? "");

    const unitPrice = Number(product.price);
    const { data: feeRows } = await supabaseAdmin
      .from("site_settings")
      .select("key,value")
      .in("key", ["delivery_inside_dhaka", "delivery_outside_dhaka"]);
    const fees = Object.fromEntries((feeRows ?? []).map((r) => [r.key, Number(r.value)]));
    const inside = Number.isFinite(fees["delivery_inside_dhaka"]) ? fees["delivery_inside_dhaka"]! : 80;
    const outside = Number.isFinite(fees["delivery_outside_dhaka"]) ? fees["delivery_outside_dhaka"]! : 150;
    const deliveryFee = data.district === "Dhaka" ? inside : outside;
    const total = unitPrice * data.quantity + deliveryFee;

    const { error } = await supabaseAdmin.from("orders").insert({
      product_id: product.id,
      product_title: product.title,
      size: data.size,
      color: data.color,
      color_image_url: colorImage,
      quantity: data.quantity,
      unit_price: unitPrice,
      delivery_fee: deliveryFee,
      total,
      full_name: data.fullName,
      phone: data.phone,
      district: data.district,
      thana: data.thana,
      address: data.address,
    });
    if (error) throw new Error("Could not save your order. Please try again.");

    try {
      const { notifyOwner } = await import("./alerts.server");
      await notifyOwner(
        `New order: ${product.title}`,
        `New order! ${product.title} x${data.quantity} = Tk ${total}. ${data.fullName}, ${data.phone}, ${data.thana}, ${data.district}.`,
      );
    } catch (alertError) {
      console.error("[store] owner alert failed", alertError);
    }

    return { ok: true as const, total };
  });

/** Records an abandoned checkout so the admin can follow up. */
export const trackIncompleteCheckout = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        productId: z.string().uuid().nullable(),
        productTitle: z.string().trim().max(200),
        fullName: z.string().trim().max(100),
        phone: z.string().trim().max(20),
        district: z.string().trim().max(60),
        color: z.string().trim().max(60).optional(),
        quantity: z.number().int().min(1).max(50),
        total: z.number().min(0).max(10_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      await supabaseAdmin.from("incomplete_orders").insert({
        product_id: data.productId,
        product_title: data.productTitle,
        full_name: data.fullName,
        phone: data.phone,
        district: data.district,
        color: data.color ?? "",
        quantity: data.quantity,
        total: data.total,
      });
    } catch (error) {
      console.error("[store] could not record incomplete checkout", error);
    }
    return { ok: true as const };
  });

/** Validates a coupon code and returns the discount it grants for a subtotal. */
export const validateCoupon = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ code: z.string().trim().min(2).max(40), subtotal: z.number().min(0) }).parse(input),
  )
  .handler(async ({ data }) => {
    const sb = publicClient();
    const { data: coupon } = await sb
      .from("coupons")
      .select("code,discount_type,discount_value,min_order,usage_limit,used_count,expires_at")
      .eq("code", data.code.toUpperCase())
      .eq("active", true)
      .maybeSingle();

    if (!coupon) return { valid: false as const, discount: 0, message: "Coupon not found." };
    if (coupon.expires_at && new Date(coupon.expires_at) < new Date())
      return { valid: false as const, discount: 0, message: "This coupon has expired." };
    if (coupon.usage_limit > 0 && coupon.used_count >= coupon.usage_limit)
      return { valid: false as const, discount: 0, message: "This coupon is no longer available." };
    if (data.subtotal < Number(coupon.min_order))
      return {
        valid: false as const,
        discount: 0,
        message: `Minimum order for this coupon is ৳${Number(coupon.min_order)}.`,
      };

    const discount =
      coupon.discount_type === "percent"
        ? Math.round((data.subtotal * Number(coupon.discount_value)) / 100)
        : Number(coupon.discount_value);

    return {
      valid: true as const,
      discount: Math.min(discount, data.subtotal),
      message: "Coupon applied.",
    };
  });
