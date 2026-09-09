import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { createClient } from "@supabase/supabase-js";
import { z } from "zod";

type AuthResult = { userId: string; isAdmin: boolean } | null;

function authClient(token: string) {
  const key = process.env["SUPABASE_PUBLISHABLE_KEY"]!;
  return createClient(process.env["SUPABASE_URL"]!, key, {
    global: {
      fetch: (input, init) => {
        const h = new Headers(init?.headers);
        if (key.startsWith("sb_") && h.get("Authorization") === `Bearer ${key}`)
          h.delete("Authorization");
        h.set("apikey", key);
        h.set("Authorization", `Bearer ${token}`);
        return fetch(input, { ...init, headers: h });
      },
    },
    auth: { storage: undefined, persistSession: false, autoRefreshToken: false },
  });
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Verifies the bearer token and whether the caller holds the admin role. Never throws. */
async function currentUser(): Promise<AuthResult> {
  try {
    const header = getRequest()?.headers.get("authorization") ?? "";
    if (!header.startsWith("Bearer ")) return null;
    const token = header.slice(7).trim();
    if (token.split(".").length !== 3) return null;

    const { data, error } = await authClient(token).auth.getUser(token);
    if (error || !data.user) return null;

    const sb = await admin();
    const { data: roles } = await sb
      .from("user_roles")
      .select("role")
      .eq("user_id", data.user.id)
      .eq("role", "admin")
      .maybeSingle();

    return { userId: data.user.id, isAdmin: Boolean(roles) };
  } catch (error) {
    console.error("[admin] auth check failed", error);
    return null;
  }
}

const denied = { ok: false as const, unauthorized: true as const };
const granted = { ok: true as const, unauthorized: false as const };

/**
 * Returns whether the signed-in user may use the admin panel.
 * The first ever signed-up user is promoted to admin automatically so the
 * panel is never locked out; afterwards only existing admins pass.
 */
export const adminStatus = createServerFn({ method: "GET" }).handler(async () => {
  const user = await currentUser();
  if (!user) return { signedIn: false, isAdmin: false };
  if (user.isAdmin) return { signedIn: true, isAdmin: true };

  try {
    const sb = await admin();
    const { count } = await sb
      .from("user_roles")
      .select("id", { count: "exact", head: true })
      .eq("role", "admin");
    if ((count ?? 0) === 0) {
      const { error } = await sb.from("user_roles").insert({ user_id: user.userId, role: "admin" });
      if (!error) return { signedIn: true, isAdmin: true };
    }
  } catch (error) {
    console.error("[admin] bootstrap failed", error);
  }

  return { signedIn: true, isAdmin: false };
});

export const adminGetData = createServerFn({ method: "GET" }).handler(async () => {
  const user = await currentUser();
  if (!user?.isAdmin) {
    return { authorized: false as const, orders: [], products: [], settings: [] };
  }
  try {
    const sb = await admin();
    const [{ data: orders }, { data: products }, { data: settings }] = await Promise.all([
      sb.from("orders").select("*").order("created_at", { ascending: false }).limit(500),
      sb.from("products").select("*").order("sort_order", { ascending: true }),
      sb.from("site_settings").select("key,value").order("key"),
    ]);
    return {
      authorized: true as const,
      orders: orders ?? [],
      products: products ?? [],
      settings: settings ?? [],
    };
  } catch (error) {
    console.error("[admin] load failed", error);
    throw new Error("Could not load admin data.");
  }
});

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid(),
        status: z.enum(["Pending", "Processing", "Delivered", "Completed", "Cancelled"]),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const user = await currentUser();
    if (!user?.isAdmin) return denied;
    const sb = await admin();
    const { data: order } = await sb
      .from("orders")
      .select("product_title,full_name,phone")
      .eq("id", data.id)
      .maybeSingle();
    const { error } = await sb.from("orders").update({ status: data.status }).eq("id", data.id);
    if (error) throw new Error(error.message);

    try {
      const { notifyOwner } = await import("./alerts.server");
      await notifyOwner(
        `Order status: ${data.status}`,
        `Order status changed to ${data.status}. ${order?.product_title ?? "Order"} - ${order?.full_name ?? ""} ${order?.phone ?? ""}`.trim(),
      );
    } catch (alertError) {
      console.error("[admin] status alert failed", alertError);
    }
    return granted;
  });

const productSchema = z.object({
  id: z.string().uuid().optional(),
  title: z.string().trim().min(1).max(200),
  price: z.number().min(0).max(10_000_000),
  image_url: z.string().trim().max(1000),
  description: z.string().trim().max(2000),
  category: z.string().trim().min(1).max(60),
  stock: z.number().int().min(0).max(1_000_000),
  tag: z.string().trim().max(40).nullable(),
  sort_order: z.number().int().min(0).max(9999),
  color_variants: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        image: z.string().trim().max(1000),
      }),
    )
    .max(30)
    .default([]),
});

export const adminSaveProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => productSchema.parse(input))
  .handler(async ({ data }) => {
    const user = await currentUser();
    if (!user?.isAdmin) return denied;
    const sb = await admin();
    const { id, ...fields } = data;
    const payload = { ...fields, updated_at: new Date().toISOString() };
    const { error } = id
      ? await sb.from("products").update(payload).eq("id", id)
      : await sb
          .from("products")
          .insert({ ...payload, slug: slugifyCategory(fields.title) || "product" });
    if (error) throw new Error(error.message);
    return granted;
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const user = await currentUser();
    if (!user?.isAdmin) return denied;
    const sb = await admin();
    const { error } = await sb.from("products").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return granted;
  });

export const adminSaveSettings = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        settings: z
          .array(z.object({ key: z.string().trim().min(1).max(60), value: z.string().max(2000) }))
          .max(50),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const user = await currentUser();
    if (!user?.isAdmin) return denied;
    const sb = await admin();
    const { error } = await sb.from("site_settings").upsert(
      data.settings.map((s) => ({ ...s, updated_at: new Date().toISOString() })),
      { onConflict: "key" },
    );
    if (error) throw new Error(error.message);
    return granted;
  });

/* ------------------------------------------------------------------ */
/* Coupons, reviews, incomplete orders, branding & Meta configuration  */
/* ------------------------------------------------------------------ */

export const adminGetExtras = createServerFn({ method: "GET" }).handler(async () => {
  const user = await currentUser();
  if (!user?.isAdmin) {
    return {
      authorized: false as const,
      coupons: [],
      reviews: [],
      incomplete: [],
      meta: { pixel_id: "", access_token: "", test_event_code: "" },
    };
  }
  try {
    const sb = await admin();
    const [{ data: coupons }, { data: reviews }, { data: incomplete }, { data: meta }] =
      await Promise.all([
        sb.from("coupons").select("*").order("created_at", { ascending: false }),
        sb.from("reviews").select("*").order("created_at", { ascending: false }).limit(300),
        sb
          .from("incomplete_orders")
          .select("*")
          .order("created_at", { ascending: false })
          .limit(300),
        sb.from("meta_settings").select("pixel_id,access_token,test_event_code").eq("id", 1).maybeSingle(),
      ]);
    return {
      authorized: true as const,
      coupons: coupons ?? [],
      reviews: reviews ?? [],
      incomplete: incomplete ?? [],
      meta: meta ?? { pixel_id: "", access_token: "", test_event_code: "" },
    };
  } catch (error) {
    console.error("[admin] extras load failed", error);
    throw new Error("Could not load admin data.");
  }
});

const couponSchema = z.object({
  id: z.string().uuid().optional(),
  code: z.string().trim().min(2).max(40),
  discount_type: z.enum(["percent", "fixed"]),
  discount_value: z.number().min(0).max(1_000_000),
  min_order: z.number().min(0).max(10_000_000),
  usage_limit: z.number().int().min(0).max(1_000_000),
  active: z.boolean(),
  expires_at: z.string().trim().max(40).nullable(),
});

export const adminSaveCoupon = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => couponSchema.parse(input))
  .handler(async ({ data }) => {
    const user = await currentUser();
    if (!user?.isAdmin) return denied;
    const sb = await admin();
    const { id, ...fields } = data;
    const payload = {
      ...fields,
      code: fields.code.toUpperCase(),
      expires_at: fields.expires_at ? new Date(fields.expires_at).toISOString() : null,
    };
    const { error } = id
      ? await sb.from("coupons").update(payload).eq("id", id)
      : await sb.from("coupons").insert(payload);
    if (error) throw new Error(error.message);
    return granted;
  });

export const adminDeleteCoupon = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const user = await currentUser();
    if (!user?.isAdmin) return denied;
    const sb = await admin();
    const { error } = await sb.from("coupons").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return granted;
  });

export const adminSaveReview = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        id: z.string().uuid().optional(),
        product_id: z.string().uuid().nullable(),
        author: z.string().trim().min(1).max(80),
        rating: z.number().int().min(1).max(5),
        comment: z.string().trim().max(1000),
        approved: z.boolean(),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const user = await currentUser();
    if (!user?.isAdmin) return denied;
    const sb = await admin();
    const { id, ...fields } = data;
    const { error } = id
      ? await sb.from("reviews").update(fields).eq("id", id)
      : await sb.from("reviews").insert(fields);
    if (error) throw new Error(error.message);
    return granted;
  });

export const adminDeleteReview = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const user = await currentUser();
    if (!user?.isAdmin) return denied;
    const sb = await admin();
    const { error } = await sb.from("reviews").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return granted;
  });

export const adminDeleteIncomplete = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => z.object({ id: z.string().uuid() }).parse(input))
  .handler(async ({ data }) => {
    const user = await currentUser();
    if (!user?.isAdmin) return denied;
    const sb = await admin();
    const { error } = await sb.from("incomplete_orders").delete().eq("id", data.id);
    if (error) throw new Error(error.message);
    return granted;
  });

export const adminSaveMeta = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        pixel_id: z.string().trim().max(60),
        access_token: z.string().trim().max(500),
        test_event_code: z.string().trim().max(60),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const user = await currentUser();
    if (!user?.isAdmin) return denied;
    const sb = await admin();
    const { error } = await sb
      .from("meta_settings")
      .upsert({ id: 1, ...data, updated_at: new Date().toISOString() });
    if (error) throw new Error(error.message);
    // Mirror the public pixel id so the storefront can load the browser pixel.
    await sb
      .from("site_settings")
      .upsert({ key: "meta_pixel_id", value: data.pixel_id, updated_at: new Date().toISOString() }, { onConflict: "key" });
    return granted;
  });

/* ------------------------------------------------------------------ */
/* Direct image upload (stored in the 'product-images' bucket)         */
/* ------------------------------------------------------------------ */

export const adminUploadImage = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        filename: z.string().trim().min(1).max(200),
        contentType: z.string().trim().min(3).max(100),
        // base64 payload without the data: prefix (max ~10MB binary)
        data: z.string().min(10).max(15_000_000),
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const user = await currentUser();
    if (!user?.isAdmin) return { ...denied, url: "" };
    if (!/^image\//.test(data.contentType)) throw new Error("Only image files are allowed.");

    const ext = (data.filename.split(".").pop() ?? "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
    const key = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext || "jpg"}`;
    const binary = Buffer.from(data.data, "base64");
    if (binary.byteLength > 10 * 1024 * 1024) throw new Error("Image must be smaller than 10MB.");

    const sb = await admin();
    const { error } = await sb.storage
      .from("product-images")
      .upload(key, binary, { contentType: data.contentType, upsert: false });
    if (error) throw new Error(error.message);

    return { ...granted, url: `/api/public/img/${key}` };
  });
