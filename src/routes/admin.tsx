import { createFileRoute } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";
import { ImageUpload } from "@/components/ImageUpload";
import {
  BarChart3,
  Bell,
  Clock,
  Image as ImageIcon,
  LayoutList,
  LogOut,
  Package,
  Star,
  Tag,
  Timer,
  Truck,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import {
  adminDeleteCoupon,
  adminDeleteIncomplete,
  adminDeleteOrder,
  adminDeleteProduct,
  adminDeleteReview,
  adminGetData,
  adminGetExtras,
  adminSaveCoupon,
  adminSaveMeta,
  adminSaveProduct,
  adminSaveReview,
  adminSaveSettings,
  adminStatus,
  adminUpdateOrderStatus,
} from "../lib/admin.functions";
import { bdt } from "../lib/currency";
import { META_STANDARD_EVENTS } from "../lib/meta-pixel";

export const Route = createFileRoute("/admin")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "Store Admin — Control Panel | CLOTHIQ" },
      {
        name: "description",
        content:
          "CLOTHIQ store administration: orders, products, coupons, reviews, branding, delivery and analytics.",
      },
      { name: "robots", content: "noindex, nofollow" },
      { property: "og:title", content: "CLOTHIQ Store Admin" },
      {
        property: "og:description",
        content: "Manage CLOTHIQ orders, products, coupons, reviews and marketing analytics.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: AdminPage,
});

const STATUSES = ["Pending", "Processing", "Delivered", "Completed", "Cancelled"] as const;
const CATEGORIES = ["Watches", "Shirts", "Pants", "Accessories"];

type TabId =
  | "orders"
  | "incomplete"
  | "products"
  | "coupons"
  | "reviews"
  | "branding"
  | "delivery"
  | "flash"
  | "alerts"
  | "analytics";

const NAV: { id: TabId; label: string; icon: typeof Package }[] = [
  { id: "orders", label: "Orders", icon: LayoutList },
  { id: "incomplete", label: "Incomplete", icon: Clock },
  { id: "products", label: "Products", icon: Package },
  { id: "coupons", label: "Coupons", icon: Tag },
  { id: "reviews", label: "Reviews", icon: Star },
  { id: "branding", label: "Branding", icon: ImageIcon },
  { id: "delivery", label: "Delivery", icon: Truck },
  { id: "flash", label: "Flash Sale", icon: Timer },
  { id: "alerts", label: "Alerts", icon: Bell },
  { id: "analytics", label: "Analytics", icon: BarChart3 },
];

interface OrderRow {
  id: string;
  product_id?: string | null;
  product_title: string;
  size: string | null;
  color: string | null;
  color_image_url?: string | null;
  quantity: number;
  total: number;
  delivery_fee: number;
  full_name: string;
  phone: string;
  district: string;
  thana: string;
  address: string;
  status: string;
  created_at: string;
}

interface ProductRow {
  id: string;
  title: string;
  price: number;
  image_url: string;
  description: string;
  category: string;
  stock: number;
  tag: string | null;
  sort_order: number;
  color_variants?: ColorVariantRow[];
}

interface ColorVariantRow {
  name: string;
  image: string;
}

function readVariants(raw: unknown): ColorVariantRow[] {
  if (!Array.isArray(raw)) return [];
  return raw.map((v) => ({
    name: String((v as { name?: unknown })?.name ?? ""),
    image: String((v as { image?: unknown })?.image ?? ""),
  }));
}

interface CouponRow {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  min_order: number;
  usage_limit: number;
  used_count: number;
  active: boolean;
  expires_at: string | null;
}

interface ReviewRow {
  id: string;
  product_id: string | null;
  author: string;
  rating: number;
  comment: string;
  approved: boolean;
  created_at: string;
}

interface IncompleteRow {
  id: string;
  product_title: string;
  full_name: string;
  phone: string;
  district: string;
  quantity: number;
  total: number;
  created_at: string;
}

interface MetaConfig {
  pixel_id: string;
  access_token: string;
  test_event_code: string;
}

const emptyProduct: Omit<ProductRow, "id"> & { id?: string } = {
  title: "",
  price: 0,
  image_url: "",
  description: "",
  category: "Watches",
  stock: 0,
  tag: "",
  sort_order: 99,
  color_variants: [] as ColorVariantRow[],
};

const emptyCoupon: Omit<CouponRow, "id" | "used_count"> & { id?: string } = {
  code: "",
  discount_type: "percent",
  discount_value: 10,
  min_order: 0,
  usage_limit: 0,
  active: true,
  expires_at: null,
};

const inputClass =
  "w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary";

const BRANDING_KEYS = [
  "brand_logo_url",
  "brand_primary_color",
  "brand_accent_color",
  "hero_headline",
  "hero_badge",
  "hero_image_url",
  "promo_text",
  "shop_headline",
  "reviews_eyebrow",
  "reviews_title",
  "reviews_subtitle",
];
const DELIVERY_KEYS = ["delivery_inside_dhaka", "delivery_outside_dhaka"];
const FLASH_KEYS = ["flash_sale_active", "flash_sale_title", "flash_sale_ends_at"];
const ALERT_KEYS = ["alert_phone", "alert_email"];

function label(key: string) {
  return key.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function AdminPage() {
  const getData = useServerFn(adminGetData);
  const getExtras = useServerFn(adminGetExtras);
  const status = useServerFn(adminStatus);
  const setStatus = useServerFn(adminUpdateOrderStatus);
  const deleteOrder = useServerFn(adminDeleteOrder);
  const saveProduct = useServerFn(adminSaveProduct);
  const deleteProduct = useServerFn(adminDeleteProduct);
  const saveSettings = useServerFn(adminSaveSettings);
  const saveCoupon = useServerFn(adminSaveCoupon);
  const deleteCoupon = useServerFn(adminDeleteCoupon);
  const saveReview = useServerFn(adminSaveReview);
  const deleteReview = useServerFn(adminDeleteReview);
  const deleteIncomplete = useServerFn(adminDeleteIncomplete);
  const saveMeta = useServerFn(adminSaveMeta);

  const [checking, setChecking] = useState(true);
  const [signedIn, setSignedIn] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [authTab, setAuthTab] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);

  const [tab, setTab] = useState<TabId>("orders");
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [settings, setSettings] = useState<{ key: string; value: string }[]>([]);
  const [coupons, setCoupons] = useState<CouponRow[]>([]);
  const [reviews, setReviews] = useState<ReviewRow[]>([]);
  const [incomplete, setIncomplete] = useState<IncompleteRow[]>([]);
  const [meta, setMeta] = useState<MetaConfig>({
    pixel_id: "",
    access_token: "",
    test_event_code: "",
  });
  const [draft, setDraft] = useState<typeof emptyProduct | null>(null);
  const [couponDraft, setCouponDraft] = useState<typeof emptyCoupon | null>(null);

  const setSetting = (key: string, value: string) =>
    setSettings((prev) =>
      prev.some((s) => s.key === key)
        ? prev.map((s) => (s.key === key ? { ...s, value } : s))
        : [...prev, { key, value }],
    );
  const getSetting = (key: string) => settings.find((s) => s.key === key)?.value ?? "";

  const clearData = useCallback(() => {
    setOrders([]);
    setProducts([]);
    setSettings([]);
    setCoupons([]);
    setReviews([]);
    setIncomplete([]);
    setMeta({ pixel_id: "", access_token: "", test_event_code: "" });
    setDraft(null);
    setCouponDraft(null);
  }, []);

  const refresh = useCallback(async () => {
    try {
      const [data, extras] = await Promise.all([getData({}), getExtras({})]);
      if (!data.authorized || !extras.authorized) {
        setIsAdmin(false);
        clearData();
        return false;
      }
      setOrders(data.orders as OrderRow[]);
      setProducts(
        (data.products as unknown[]).map((p) => ({
          ...(p as ProductRow),
          color_variants: readVariants((p as { color_variants?: unknown }).color_variants),
        })),
      );
      setSettings(data.settings as { key: string; value: string }[]);
      setCoupons(extras.coupons as CouponRow[]);
      setReviews(extras.reviews as ReviewRow[]);
      setIncomplete(extras.incomplete as IncompleteRow[]);
      setMeta(extras.meta as MetaConfig);
      return true;
    } catch (error) {
      console.error(error);
      toast.error("Could not load admin data.");
      return false;
    }
  }, [clearData, getData, getExtras]);

  const syncSession = useCallback(
    async (hasSession: boolean) => {
      if (!hasSession) {
        setSignedIn(false);
        setIsAdmin(false);
        clearData();
        setChecking(false);
        return;
      }
      setSignedIn(true);
      try {
        const result = await status({});
        setIsAdmin(result.isAdmin);
        if (result.isAdmin) await refresh();
        else clearData();
      } catch (error) {
        console.error(error);
        setIsAdmin(false);
        clearData();
      } finally {
        setChecking(false);
      }
    },
    [clearData, refresh, status],
  );

  useEffect(() => {
    let active = true;

    const { data: sub } = supabase.auth.onAuthStateChange((event, session) => {
      if (!active) return;
      if (event !== "SIGNED_IN" && event !== "SIGNED_OUT" && event !== "INITIAL_SESSION") return;
      void syncSession(Boolean(session));
    });

    void (async () => {
      try {
        const { data } = await supabase.auth.getSession();
        if (active) await syncSession(Boolean(data.session));
      } catch (error) {
        console.error(error);
        if (active) setChecking(false);
      }
    })();

    return () => {
      active = false;
      sub.subscription.unsubscribe();
    };
  }, [syncSession]);

  const expired = () => {
    toast.error("Session expired. Please log in again.");
    setIsAdmin(false);
  };

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (busy) return;
    setBusy(true);
    try {
      if (authTab === "login") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Signed in successfully!");
        setPassword("");
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/admin` },
        });
        if (error) throw error;
        setPassword("");
        if (data.session) toast.success("Signed up successfully!");
        else toast.success("Signed up! Check your email to confirm your account.");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setBusy(false);
    }
  };

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
    } catch (error) {
      console.error(error);
    }
    setSignedIn(false);
    setIsAdmin(false);
    clearData();
    toast.success("Signed out.");
  };

  const persistSettings = async (keys: string[], successMessage: string) => {
    try {
      const payload = keys.map((key) => ({ key, value: getSetting(key) }));
      const result = await saveSettings({ data: { settings: payload } });
      if (!result.ok) return expired();
      toast.success(successMessage);
    } catch (error) {
      console.error(error);
      toast.error("Could not save the settings.");
    }
  };

  if (checking) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <p className="text-sm text-muted-foreground">Loading control panel…</p>
      </div>
    );
  }

  if (!signedIn) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <form
          onSubmit={handleAuth}
          className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 shadow-2xl"
        >
          <div className="bg-gradient-teal mb-6 h-1 w-16 rounded-full" />
          <h1 className="font-display text-2xl font-bold">
            CLOTHIQ <span className="text-gradient-teal">Admin</span>
          </h1>

          <div className="mt-6 grid grid-cols-2 gap-2 rounded-full border border-border p-1">
            {(["login", "signup"] as const).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setAuthTab(t)}
                className={
                  t === authTab
                    ? "bg-gradient-teal rounded-full py-2 text-xs font-bold tracking-wide text-primary-foreground uppercase"
                    : "rounded-full py-2 text-xs font-bold tracking-wide text-muted-foreground uppercase hover:text-foreground"
                }
              >
                {t === "login" ? "Log In" : "Sign Up"}
              </button>
            ))}
          </div>

          <input
            type="email"
            required
            value={email}
            autoComplete="email"
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className={`${inputClass} mt-5`}
          />
          <input
            type="password"
            required
            minLength={6}
            maxLength={200}
            value={password}
            autoComplete={authTab === "login" ? "current-password" : "new-password"}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className={`${inputClass} mt-3`}
          />
          <button
            type="submit"
            disabled={busy}
            className="bg-gradient-teal mt-5 w-full rounded-full py-3 text-sm font-bold tracking-widest text-primary-foreground uppercase disabled:opacity-60"
          >
            {busy ? "Please wait…" : authTab === "login" ? "Log In" : "Sign Up"}
          </button>
        </form>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="w-full max-w-sm rounded-2xl border border-border bg-card p-8 text-center shadow-2xl">
          <h1 className="font-display text-xl font-bold">Access denied</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This account does not have administrator access.
          </p>
          <button
            onClick={handleLogout}
            className="mt-6 w-full rounded-full border border-border py-3 text-xs font-bold tracking-widest uppercase hover:text-destructive"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  const pending = orders.filter((o) => o.status === "Pending").length;
  const revenue = orders
    .filter((o) => o.status !== "Cancelled")
    .reduce((sum, o) => sum + Number(o.total), 0);

  return (
    <div className="min-h-screen bg-background text-foreground lg:flex">
      {/* Sidebar */}
      <aside className="border-b border-border bg-card lg:min-h-screen lg:w-64 lg:shrink-0 lg:border-r lg:border-b-0">
        <div className="px-5 py-5">
          <p className="text-[10px] font-semibold tracking-[0.3em] text-gold uppercase">CLOTHIQ</p>
          <h1 className="font-display text-sm leading-tight font-bold">
            STORE ADMIN — <span className="text-gradient-teal">CONTROL PANEL</span>
          </h1>
        </div>
        <nav className="flex gap-2 overflow-x-auto px-3 pb-3 lg:flex-col lg:overflow-visible lg:pb-6">
          {NAV.map(({ id, label: text, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide uppercase transition-colors ${
                tab === id
                  ? "bg-gradient-teal text-primary-foreground"
                  : "text-muted-foreground hover:bg-secondary hover:text-foreground"
              }`}
            >
              <Icon className="h-4 w-4" />
              {text}
            </button>
          ))}
          <button
            onClick={handleLogout}
            className="flex shrink-0 items-center gap-2 rounded-xl px-4 py-2.5 text-xs font-bold tracking-wide text-muted-foreground uppercase hover:text-destructive"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </nav>
      </aside>

      <main className="min-w-0 flex-1 px-4 py-8 sm:px-8">
        {/* ORDERS */}
        {tab === "orders" && (
          <div className="space-y-5">
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["Total Orders", String(orders.length)],
                ["Pending", String(pending)],
                ["Revenue (excl. cancelled)", bdt(revenue)],
              ].map(([title, value]) => (
                <div key={title} className="rounded-2xl border border-border bg-card p-5">
                  <p className="text-[11px] tracking-[0.2em] text-muted-foreground uppercase">
                    {title}
                  </p>
                  <p className="font-display mt-2 text-2xl font-bold text-gold">{value}</p>
                </div>
              ))}
            </div>

            <h2 className="font-display text-xl font-bold">Orders ({orders.length})</h2>
            {orders.length === 0 && <p className="text-sm text-muted-foreground">No orders yet.</p>}
            {orders.map((o) => {
              const orderImage =
                o.color_image_url ||
                products.find((p) => p.id === o.product_id)?.image_url ||
                "";
              return (
              <article key={o.id} className="rounded-2xl border border-border bg-card p-5">
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="flex gap-3">
                    {orderImage ? (
                      <img
                        src={orderImage}
                        alt={`${o.product_title} ${o.color ?? ""}`}
                        className="h-20 w-20 rounded-lg border border-border object-cover"
                      />
                    ) : (
                      <div className="flex h-20 w-20 items-center justify-center rounded-lg border border-border text-[10px] text-muted-foreground">
                        No image
                      </div>
                    )}
                    <div>
                    <p className="font-display font-bold">{o.product_title}</p>
                    <p className="text-xs text-muted-foreground">
                      {o.size} · {o.color} · Qty {o.quantity} ·{" "}
                      {new Date(o.created_at).toLocaleString()}
                    </p>
                    <p className="mt-2 text-sm">
                      {o.full_name} — {o.phone}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {o.address}, {o.thana}, {o.district} · Delivery {bdt(Number(o.delivery_fee))}
                    </p>
                    </div>
                  </div>

                  <div className="text-right">
                    <p className="font-display text-lg font-bold text-gold">
                      {bdt(Number(o.total))}
                    </p>
                    <select
                      value={o.status}
                      onChange={async (e) => {
                        const next = e.target.value as (typeof STATUSES)[number];
                        try {
                          const result = await setStatus({ data: { id: o.id, status: next } });
                          if (!result.ok) return expired();
                          setOrders((prev) =>
                            prev.map((x) => (x.id === o.id ? { ...x, status: next } : x)),
                          );
                          toast.success("Order status updated.");
                        } catch (error) {
                          console.error(error);
                          toast.error("Could not update the order.");
                        }
                      }}
                      className="mt-2 rounded-lg border border-border bg-background px-3 py-2 text-xs"
                    >
                      {STATUSES.map((s) => (
                        <option key={s} value={s}>
                          {s}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </article>
              );
            })}
          </div>
        )}

        {/* INCOMPLETE */}
        {tab === "incomplete" && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold">Incomplete Checkouts ({incomplete.length})</h2>
            <p className="text-sm text-muted-foreground">
              Customers who started an order but never confirmed it. Call them to close the sale.
            </p>
            {incomplete.map((i) => (
              <article
                key={i.id}
                className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5"
              >
                <div>
                  <p className="font-display font-bold">{i.product_title || "Unknown product"}</p>
                  <p className="text-sm">
                    {i.full_name || "—"} — {i.phone || "no phone"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {i.district || "no district"} · Qty {i.quantity} ·{" "}
                    {new Date(i.created_at).toLocaleString()}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <span className="font-display font-bold text-gold">{bdt(Number(i.total))}</span>
                  <button
                    onClick={async () => {
                      try {
                        const result = await deleteIncomplete({ data: { id: i.id } });
                        if (!result.ok) return expired();
                        setIncomplete((prev) => prev.filter((x) => x.id !== i.id));
                      } catch (error) {
                        console.error(error);
                        toast.error("Could not remove the entry.");
                      }
                    }}
                    className="rounded-full border border-border px-3 py-1 text-[11px] font-bold uppercase hover:text-destructive"
                  >
                    Remove
                  </button>
                </div>
              </article>
            ))}
            {incomplete.length === 0 && (
              <p className="text-sm text-muted-foreground">No incomplete checkouts.</p>
            )}
          </div>
        )}

        {/* PRODUCTS */}
        {tab === "products" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Products ({products.length})</h2>
              <button
                onClick={() => setDraft({ ...emptyProduct })}
                className="bg-gradient-teal rounded-full px-5 py-2.5 text-xs font-bold tracking-wide text-primary-foreground uppercase"
              >
                Add Product
              </button>
            </div>

            {draft && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const result = await saveProduct({
                      data: {
                        ...(draft.id ? { id: draft.id } : {}),
                        title: draft.title,
                        price: Number(draft.price),
                        image_url: draft.image_url,
                        description: draft.description,
                        category: draft.category,
                        stock: Number(draft.stock),
                        tag: draft.tag ? draft.tag : null,
                        sort_order: Number(draft.sort_order),
                        color_variants: readVariants(draft.color_variants).filter((v) =>
                          v.name.trim(),
                        ),
                      },
                    });
                    if (!result.ok) return expired();
                    setDraft(null);
                    await refresh();
                    toast.success("Product saved.");
                  } catch (error) {
                    console.error(error);
                    toast.error("Could not save the product.");
                  }
                }}
                className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2"
              >
                <label className="text-xs text-muted-foreground">
                  Title
                  <input
                    required
                    maxLength={200}
                    value={draft.title}
                    onChange={(e) => setDraft({ ...draft, title: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Price (BDT)
                  <input
                    required
                    type="number"
                    min={0}
                    value={draft.price}
                    onChange={(e) => setDraft({ ...draft, price: Number(e.target.value) })}
                    className={inputClass}
                  />
                </label>
                <ImageUpload
                  label="Product image"
                  value={draft.image_url}
                  onChange={(url) => setDraft({ ...draft, image_url: url })}
                />
                <label className="text-xs text-muted-foreground">
                  Category
                  <select
                    value={draft.category}
                    onChange={(e) => setDraft({ ...draft, category: e.target.value })}
                    className={inputClass}
                  >
                    {CATEGORIES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </label>
                <label className="text-xs text-muted-foreground">
                  Stock
                  <input
                    type="number"
                    min={0}
                    value={draft.stock}
                    onChange={(e) => setDraft({ ...draft, stock: Number(e.target.value) })}
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Tag (optional)
                  <input
                    maxLength={40}
                    value={draft.tag ?? ""}
                    onChange={(e) => setDraft({ ...draft, tag: e.target.value })}
                    placeholder="Best Seller"
                    className={inputClass}
                  />
                </label>
                <div className="rounded-xl border border-border p-4 sm:col-span-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold tracking-wide uppercase">Color variants</p>
                    <button
                      type="button"
                      onClick={() =>
                        setDraft({
                          ...draft,
                          color_variants: [...readVariants(draft.color_variants), { name: "", image: "" }],
                        })
                      }
                      className="rounded-full border border-border px-4 py-1.5 text-[11px] font-bold uppercase hover:text-primary"
                    >
                      Add color
                    </button>
                  </div>
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    Type any color name (e.g. Off-White, Olive Green) and upload the photo shown when
                    that color is selected.
                  </p>
                  <div className="mt-3 space-y-3">
                    {readVariants(draft.color_variants).map((variant, index) => (
                      <div key={index} className="rounded-lg border border-border p-3">
                        <div className="flex items-center gap-2">
                          <input
                            maxLength={60}
                            value={variant.name}
                            placeholder="Color name"
                            onChange={(e) => {
                              const next = readVariants(draft.color_variants);
                              next[index] = { ...next[index]!, name: e.target.value };
                              setDraft({ ...draft, color_variants: next });
                            }}
                            className="flex-1 rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
                          />
                          <button
                            type="button"
                            onClick={() =>
                              setDraft({
                                ...draft,
                                color_variants: readVariants(draft.color_variants).filter(
                                  (_, i) => i !== index,
                                ),
                              })
                            }
                            className="rounded-full border border-border px-3 py-2 text-[11px] font-bold uppercase hover:text-destructive"
                          >
                            Remove
                          </button>
                        </div>
                        <div className="mt-2">
                          <ImageUpload
                            label={`${variant.name || "Color"} image`}
                            value={variant.image}
                            onChange={(url) => {
                              const next = readVariants(draft.color_variants);
                              next[index] = { ...next[index]!, image: url };
                              setDraft({ ...draft, color_variants: next });
                            }}
                          />
                        </div>
                      </div>
                    ))}
                    {readVariants(draft.color_variants).length === 0 && (
                      <p className="text-[11px] text-muted-foreground">No color variants yet.</p>
                    )}
                  </div>
                </div>

                <label className="text-xs text-muted-foreground sm:col-span-2">
                  Description
                  <textarea
                    maxLength={2000}
                    rows={2}
                    value={draft.description}
                    onChange={(e) => setDraft({ ...draft, description: e.target.value })}
                    className={inputClass}
                  />
                </label>
                <div className="flex gap-3 sm:col-span-2">
                  <button
                    type="submit"
                    className="bg-gradient-teal rounded-full px-6 py-2.5 text-xs font-bold tracking-wide text-primary-foreground uppercase"
                  >
                    Save Product
                  </button>
                  <button
                    type="button"
                    onClick={() => setDraft(null)}
                    className="rounded-full border border-border px-6 py-2.5 text-xs font-bold tracking-wide text-muted-foreground uppercase"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {products.map((p) => (
                <article
                  key={p.id}
                  className="flex gap-4 rounded-2xl border border-border bg-card p-4"
                >
                  {p.image_url && (
                    <img
                      src={p.image_url}
                      alt={p.title}
                      className="h-20 w-20 rounded-xl object-cover"
                    />
                  )}
                  <div className="flex-1">
                    <p className="font-display text-sm font-bold">{p.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {p.category} · Stock {p.stock}
                    </p>
                    <p className="font-display text-sm font-bold text-gold">
                      {bdt(Number(p.price))}
                    </p>
                    <div className="mt-2 flex gap-2">
                      <button
                        onClick={() => setDraft({ ...p, tag: p.tag ?? "" })}
                        className="rounded-full border border-border px-3 py-1 text-[11px] font-bold uppercase hover:text-primary"
                      >
                        Edit
                      </button>
                      <button
                        onClick={async () => {
                          try {
                            const result = await deleteProduct({ data: { id: p.id } });
                            if (!result.ok) return expired();
                            await refresh();
                            toast.success("Product deleted.");
                          } catch (error) {
                            console.error(error);
                            toast.error("Could not delete the product.");
                          }
                        }}
                        className="rounded-full border border-border px-3 py-1 text-[11px] font-bold uppercase hover:text-destructive"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          </div>
        )}

        {/* COUPONS */}
        {tab === "coupons" && (
          <div className="space-y-5">
            <div className="flex items-center justify-between">
              <h2 className="font-display text-xl font-bold">Coupons ({coupons.length})</h2>
              <button
                onClick={() => setCouponDraft({ ...emptyCoupon })}
                className="bg-gradient-teal rounded-full px-5 py-2.5 text-xs font-bold tracking-wide text-primary-foreground uppercase"
              >
                Add Coupon
              </button>
            </div>

            {couponDraft && (
              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  try {
                    const result = await saveCoupon({
                      data: {
                        ...(couponDraft.id ? { id: couponDraft.id } : {}),
                        code: couponDraft.code,
                        discount_type: couponDraft.discount_type as "percent" | "fixed",
                        discount_value: Number(couponDraft.discount_value),
                        min_order: Number(couponDraft.min_order),
                        usage_limit: Number(couponDraft.usage_limit),
                        active: couponDraft.active,
                        expires_at: couponDraft.expires_at || null,
                      },
                    });
                    if (!result.ok) return expired();
                    setCouponDraft(null);
                    await refresh();
                    toast.success("Coupon saved.");
                  } catch (error) {
                    console.error(error);
                    toast.error("Could not save the coupon.");
                  }
                }}
                className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2"
              >
                <label className="text-xs text-muted-foreground">
                  Code
                  <input
                    required
                    maxLength={40}
                    value={couponDraft.code}
                    onChange={(e) => setCouponDraft({ ...couponDraft, code: e.target.value })}
                    placeholder="VIBE10"
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Discount Type
                  <select
                    value={couponDraft.discount_type}
                    onChange={(e) =>
                      setCouponDraft({ ...couponDraft, discount_type: e.target.value })
                    }
                    className={inputClass}
                  >
                    <option value="percent">Percentage (%)</option>
                    <option value="fixed">Fixed amount (৳)</option>
                  </select>
                </label>
                <label className="text-xs text-muted-foreground">
                  Discount Value
                  <input
                    type="number"
                    min={0}
                    value={couponDraft.discount_value}
                    onChange={(e) =>
                      setCouponDraft({ ...couponDraft, discount_value: Number(e.target.value) })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Minimum Order (৳)
                  <input
                    type="number"
                    min={0}
                    value={couponDraft.min_order}
                    onChange={(e) =>
                      setCouponDraft({ ...couponDraft, min_order: Number(e.target.value) })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Usage Limit (0 = unlimited)
                  <input
                    type="number"
                    min={0}
                    value={couponDraft.usage_limit}
                    onChange={(e) =>
                      setCouponDraft({ ...couponDraft, usage_limit: Number(e.target.value) })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="text-xs text-muted-foreground">
                  Expires At (optional)
                  <input
                    type="date"
                    value={couponDraft.expires_at ? couponDraft.expires_at.slice(0, 10) : ""}
                    onChange={(e) =>
                      setCouponDraft({ ...couponDraft, expires_at: e.target.value || null })
                    }
                    className={inputClass}
                  />
                </label>
                <label className="flex items-center gap-2 text-xs text-muted-foreground">
                  <input
                    type="checkbox"
                    checked={couponDraft.active}
                    onChange={(e) => setCouponDraft({ ...couponDraft, active: e.target.checked })}
                  />
                  Active
                </label>
                <div className="flex gap-3 sm:col-span-2">
                  <button
                    type="submit"
                    className="bg-gradient-teal rounded-full px-6 py-2.5 text-xs font-bold tracking-wide text-primary-foreground uppercase"
                  >
                    Save Coupon
                  </button>
                  <button
                    type="button"
                    onClick={() => setCouponDraft(null)}
                    className="rounded-full border border-border px-6 py-2.5 text-xs font-bold tracking-wide text-muted-foreground uppercase"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {coupons.map((c) => (
                <article key={c.id} className="rounded-2xl border border-border bg-card p-5">
                  <div className="flex items-center justify-between">
                    <p className="font-display text-base font-bold text-gradient-teal">{c.code}</p>
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase ${
                        c.active ? "bg-gold text-gold-foreground" : "border border-border text-muted-foreground"
                      }`}
                    >
                      {c.active ? "Active" : "Off"}
                    </span>
                  </div>
                  <p className="mt-1 text-sm">
                    {c.discount_type === "percent"
                      ? `${Number(c.discount_value)}% off`
                      : `${bdt(Number(c.discount_value))} off`}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Min {bdt(Number(c.min_order))} · Used {c.used_count}
                    {c.usage_limit > 0 ? ` / ${c.usage_limit}` : ""}
                    {c.expires_at ? ` · Expires ${new Date(c.expires_at).toLocaleDateString()}` : ""}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setCouponDraft({ ...c })}
                      className="rounded-full border border-border px-3 py-1 text-[11px] font-bold uppercase hover:text-primary"
                    >
                      Edit
                    </button>
                    <button
                      onClick={async () => {
                        try {
                          const result = await deleteCoupon({ data: { id: c.id } });
                          if (!result.ok) return expired();
                          setCoupons((prev) => prev.filter((x) => x.id !== c.id));
                          toast.success("Coupon deleted.");
                        } catch (error) {
                          console.error(error);
                          toast.error("Could not delete the coupon.");
                        }
                      }}
                      className="rounded-full border border-border px-3 py-1 text-[11px] font-bold uppercase hover:text-destructive"
                    >
                      Delete
                    </button>
                  </div>
                </article>
              ))}
              {coupons.length === 0 && (
                <p className="text-sm text-muted-foreground">No coupons yet.</p>
              )}
            </div>
          </div>
        )}

        {/* REVIEWS */}
        {tab === "reviews" && (
          <div className="space-y-4">
            <h2 className="font-display text-xl font-bold">Reviews ({reviews.length})</h2>
            <p className="text-sm text-muted-foreground">
              Approved reviews scroll automatically on the homepage. Edit the text, the star
              rating or the customer name at any time.
            </p>
            <ReviewEditor
              key="new-review"
              onSave={async (draft) => {
                const result = await saveReview({
                  data: { ...draft, product_id: null },
                });
                if (!result.ok) return expired();
                await refresh();
                toast.success("Review added.");
              }}
            />
            {reviews.length === 0 && (
              <p className="text-sm text-muted-foreground">No reviews yet.</p>
            )}
            {reviews.map((r) => (
              <ReviewEditor
                key={r.id}
                review={r}
                onSave={async (draft) => {
                  const result = await saveReview({
                    data: { id: r.id, product_id: r.product_id, ...draft },
                  });
                  if (!result.ok) return expired();
                  setReviews((prev) =>
                    prev.map((x) => (x.id === r.id ? { ...x, ...draft } : x)),
                  );
                  toast.success("Review saved.");
                }}
                onDelete={async () => {
                  const result = await deleteReview({ data: { id: r.id } });
                  if (!result.ok) return expired();
                  setReviews((prev) => prev.filter((x) => x.id !== r.id));
                  toast.success("Review deleted.");
                }}
              />
            ))}
          </div>
        )}

        {/* BRANDING */}
        {tab === "branding" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void persistSettings(BRANDING_KEYS, "Branding saved.");
            }}
            className="max-w-3xl space-y-4"
          >
            <h2 className="font-display text-xl font-bold">Branding</h2>
            <p className="text-sm text-muted-foreground">
              Logo, brand colours and the homepage headlines shown on the storefront.
            </p>
            {BRANDING_KEYS.map((key) =>
              key.endsWith("_image_url") || key.endsWith("_logo_url") ? (
                <ImageUpload
                  key={key}
                  label={label(key)}
                  value={getSetting(key)}
                  onChange={(url) => setSetting(key, url)}
                />
              ) : (
              <label key={key} className="block text-xs text-muted-foreground">
                {label(key)}
                <div className="flex gap-3">
                  <input
                    maxLength={2000}
                    value={getSetting(key)}
                    onChange={(e) => setSetting(key, e.target.value)}
                    className={inputClass}
                  />
                  {key.endsWith("_color") && (
                    <input
                      type="color"
                      value={/^#[0-9a-fA-F]{6}$/.test(getSetting(key)) ? getSetting(key) : "#00E5FF"}
                      onChange={(e) => setSetting(key, e.target.value)}
                      className="h-11 w-14 rounded-lg border border-border bg-background"
                    />
                  )}
                </div>
              </label>
              ),
            )}
            <button
              type="submit"
              className="bg-gradient-teal rounded-full px-6 py-3 text-xs font-bold tracking-widest text-primary-foreground uppercase"
            >
              Save Branding
            </button>
          </form>
        )}

        {/* DELIVERY */}
        {tab === "delivery" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void persistSettings(DELIVERY_KEYS, "Delivery charges saved.");
            }}
            className="max-w-md space-y-4"
          >
            <h2 className="font-display text-xl font-bold">Delivery Charges</h2>
            <label className="block text-xs text-muted-foreground">
              Inside Dhaka (৳)
              <input
                type="number"
                min={0}
                value={getSetting("delivery_inside_dhaka")}
                onChange={(e) => setSetting("delivery_inside_dhaka", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              Outside Dhaka (৳)
              <input
                type="number"
                min={0}
                value={getSetting("delivery_outside_dhaka")}
                onChange={(e) => setSetting("delivery_outside_dhaka", e.target.value)}
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              className="bg-gradient-teal rounded-full px-6 py-3 text-xs font-bold tracking-widest text-primary-foreground uppercase"
            >
              Save Delivery
            </button>
          </form>
        )}

        {/* ALERTS */}
        {tab === "alerts" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void persistSettings(ALERT_KEYS, "Alert settings saved.");
            }}
            className="max-w-md space-y-4"
          >
            <h2 className="font-display text-xl font-bold">Order Alerts</h2>
            <p className="text-xs text-muted-foreground">
              Get an SMS and email every time a new order arrives or an order status changes.
            </p>
            <label className="block text-xs text-muted-foreground">
              Alert phone number (SMS)
              <input
                value={getSetting("alert_phone")}
                onChange={(e) => setSetting("alert_phone", e.target.value)}
                placeholder="01XXXXXXXXX"
                className={inputClass}
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              Alert email address
              <input
                type="email"
                value={getSetting("alert_email")}
                onChange={(e) => setSetting("alert_email", e.target.value)}
                placeholder="you@example.com"
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              className="bg-gradient-teal rounded-full px-6 py-3 text-xs font-bold tracking-widest text-primary-foreground uppercase"
            >
              Save Alerts
            </button>
          </form>
        )}

        {/* FLASH SALE */}
        {tab === "flash" && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              void persistSettings(FLASH_KEYS, "Flash sale saved.");
            }}
            className="max-w-md space-y-4"
          >
            <h2 className="font-display text-xl font-bold">Flash Sale Countdown</h2>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={getSetting("flash_sale_active") === "true"}
                onChange={(e) => setSetting("flash_sale_active", e.target.checked ? "true" : "false")}
              />
              Show flash sale banner on the homepage
            </label>
            <label className="block text-xs text-muted-foreground">
              Title
              <input
                maxLength={120}
                value={getSetting("flash_sale_title")}
                onChange={(e) => setSetting("flash_sale_title", e.target.value)}
                className={inputClass}
              />
            </label>
            <label className="block text-xs text-muted-foreground">
              Ends At
              <input
                type="datetime-local"
                value={getSetting("flash_sale_ends_at").slice(0, 16)}
                onChange={(e) => setSetting("flash_sale_ends_at", e.target.value)}
                className={inputClass}
              />
            </label>
            <button
              type="submit"
              className="bg-gradient-teal rounded-full px-6 py-3 text-xs font-bold tracking-widest text-primary-foreground uppercase"
            >
              Save Flash Sale
            </button>
          </form>
        )}

        {/* ANALYTICS */}
        {tab === "analytics" && (
          <div className="max-w-2xl space-y-6">
            <div>
              <h2 className="font-display text-xl font-bold">Analytics</h2>
              <p className="text-sm text-muted-foreground">
                Connect Meta Ads so browser pixel events and server-side Conversions API events are
                sent with a shared event ID for deduplication.
              </p>
            </div>

            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  const result = await saveMeta({ data: meta });
                  if (!result.ok) return expired();
                  setSetting("meta_pixel_id", meta.pixel_id);
                  toast.success("Meta settings saved.");
                } catch (error) {
                  console.error(error);
                  toast.error("Could not save the Meta settings.");
                }
              }}
              className="space-y-4 rounded-2xl border border-border bg-card p-6"
            >
              <h3 className="font-display text-sm font-bold tracking-widest uppercase">
                Meta Ads / Pixel
              </h3>
              <label className="block text-xs text-muted-foreground">
                Pixel ID
                <input
                  maxLength={60}
                  value={meta.pixel_id}
                  onChange={(e) => setMeta({ ...meta, pixel_id: e.target.value })}
                  placeholder="1234567890"
                  className={inputClass}
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Conversions API access token
                <input
                  type="password"
                  maxLength={500}
                  value={meta.access_token}
                  onChange={(e) => setMeta({ ...meta, access_token: e.target.value })}
                  placeholder="EAAG…"
                  className={inputClass}
                />
              </label>
              <label className="block text-xs text-muted-foreground">
                Test event code (optional)
                <input
                  maxLength={60}
                  value={meta.test_event_code}
                  onChange={(e) => setMeta({ ...meta, test_event_code: e.target.value })}
                  placeholder="TEST12345"
                  className={inputClass}
                />
              </label>
              <button
                type="submit"
                className="bg-gradient-teal rounded-full px-6 py-3 text-xs font-bold tracking-widest text-primary-foreground uppercase"
              >
                Save Meta settings
              </button>
            </form>

            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="font-display text-sm font-bold tracking-widest uppercase">
                Automatically tracked standard events
              </h3>
              <ul className="mt-3 flex flex-wrap gap-2">
                {META_STANDARD_EVENTS.map((event) => (
                  <li
                    key={event}
                    className="rounded-full border border-primary/40 px-3 py-1 text-xs font-semibold text-primary"
                  >
                    {event}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted-foreground">
                Each event fires in the browser and again from the server with the same event ID, so
                Meta counts it once.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

interface ReviewDraft {
  author: string;
  rating: number;
  comment: string;
  approved: boolean;
}

function ReviewEditor({
  review,
  onSave,
  onDelete,
}: {
  review?: ReviewRow;
  onSave: (draft: ReviewDraft) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [draft, setDraft] = useState<ReviewDraft>({
    author: review?.author ?? "",
    rating: review?.rating ?? 5,
    comment: review?.comment ?? "",
    approved: review?.approved ?? true,
  });
  const [busy, setBusy] = useState(false);

  const run = async (fn: () => Promise<void>) => {
    setBusy(true);
    try {
      await fn();
      if (!review) setDraft({ author: "", rating: 5, comment: "", approved: true });
    } catch (error) {
      console.error(error);
      toast.error("Could not save the review.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!draft.author.trim()) {
          toast.error("Customer name is required.");
          return;
        }
        void run(() => onSave({ ...draft, author: draft.author.trim(), comment: draft.comment.trim() }));
      }}
      className="space-y-3 rounded-2xl border border-border bg-card p-5"
    >
      <p className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
        {review ? "Edit review" : "Add a new review"}
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="block text-xs text-muted-foreground">
          Customer name
          <input
            maxLength={80}
            value={draft.author}
            onChange={(e) => setDraft((d) => ({ ...d, author: e.target.value }))}
            className={inputClass}
          />
        </label>
        <label className="block text-xs text-muted-foreground">
          Rating (1-5)
          <input
            type="number"
            min={1}
            max={5}
            value={draft.rating}
            onChange={(e) =>
              setDraft((d) => ({
                ...d,
                rating: Math.max(1, Math.min(5, Number(e.target.value) || 5)),
              }))
            }
            className={inputClass}
          />
        </label>
      </div>
      <label className="block text-xs text-muted-foreground">
        Review text
        <textarea
          maxLength={1000}
          rows={3}
          value={draft.comment}
          onChange={(e) => setDraft((d) => ({ ...d, comment: e.target.value }))}
          className={inputClass}
        />
      </label>
      <div className="flex flex-wrap items-center gap-3">
        <label className="flex items-center gap-2 text-xs text-muted-foreground">
          <input
            type="checkbox"
            checked={draft.approved}
            onChange={(e) => setDraft((d) => ({ ...d, approved: e.target.checked }))}
            className="h-4 w-4 accent-[var(--color-gold)]"
          />
          Show on website
        </label>
        <button
          type="submit"
          disabled={busy}
          className="bg-gradient-teal rounded-full px-5 py-2 text-[11px] font-bold uppercase tracking-widest text-primary-foreground disabled:opacity-60"
        >
          {review ? "Save changes" : "Add review"}
        </button>
        {onDelete && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void run(onDelete)}
            className="rounded-full border border-border px-5 py-2 text-[11px] font-bold uppercase hover:text-destructive"
          >
            Delete
          </button>
        )}
      </div>
    </form>
  );
}
