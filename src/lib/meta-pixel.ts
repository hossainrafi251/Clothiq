export type MetaEventName =
  | "PageView"
  | "ViewContent"
  | "AddToCart"
  | "InitiateCheckout"
  | "Purchase";

export const META_STANDARD_EVENTS: MetaEventName[] = [
  "PageView",
  "ViewContent",
  "AddToCart",
  "InitiateCheckout",
  "Purchase",
];

interface Fbq {
  (...args: unknown[]): void;
  queue?: unknown[];
  loaded?: boolean;
  version?: string;
  push?: unknown;
  callMethod?: (...args: unknown[]) => void;
}

declare global {
  interface Window {
    fbq?: Fbq;
    _fbq?: Fbq;
  }
}

let loadedPixelId: string | null = null;

/** Customer details used for Advanced Matching / CAPI user_data. */
export interface MetaUserData {
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  city?: string;
  country?: string;
}

let advancedMatch: MetaUserData = {};

/** Normalises a Bangladeshi phone number to E.164 digits (8801XXXXXXXXX). */
export function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `880${digits.slice(1)}`;
  if (digits.startsWith("1")) return `880${digits}`;
  return digits;
}

function pixelUserData(data: MetaUserData): Record<string, string> {
  // The browser pixel hashes these values itself, so they are sent in the
  // plain, normalised form Meta expects.
  const out: Record<string, string> = {};
  if (data.email) out["em"] = data.email.trim().toLowerCase();
  const ph = data.phone ? normalizePhone(data.phone) : "";
  if (ph) out["ph"] = ph;
  if (data.firstName) out["fn"] = data.firstName.trim().toLowerCase();
  if (data.lastName) out["ln"] = data.lastName.trim().toLowerCase();
  if (data.city) out["ct"] = data.city.trim().toLowerCase().replace(/\s+/g, "");
  if (data.country) out["country"] = data.country.trim().toLowerCase();
  return out;
}

/**
 * Stores customer details for Advanced Matching and re-initialises the pixel so
 * subsequent events carry the matched user parameters.
 */
export function setMetaUserData(data: MetaUserData): void {
  advancedMatch = { ...advancedMatch, ...data };
  if (typeof window === "undefined" || !loadedPixelId) return;
  const matched = pixelUserData(advancedMatch);
  if (Object.keys(matched).length === 0) return;
  try {
    window.fbq?.("init", loadedPixelId, matched);
  } catch (error) {
    console.error("[meta] advanced matching init failed", error);
  }
}

/** Injects the Meta Pixel base code once and fires the initial PageView. */
export function loadMetaPixel(pixelId: string): void {
  if (typeof window === "undefined" || !pixelId || loadedPixelId === pixelId) return;
  loadedPixelId = pixelId;

  if (!window.fbq) {
    const fbq: Fbq = function (...args: unknown[]) {
      if (fbq.callMethod) fbq.callMethod(...args);
      else (fbq.queue ??= []).push(args);
    } as Fbq;
    fbq.queue = [];
    fbq.loaded = true;
    fbq.version = "2.0";
    window.fbq = fbq;
    window._fbq = fbq;

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://connect.facebook.net/en_US/fbevents.js";
    document.head.appendChild(script);
  }

  const matched = pixelUserData(advancedMatch);
  if (Object.keys(matched).length > 0) window.fbq?.("init", pixelId, matched);
  else window.fbq?.("init", pixelId);
}

function readCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const m = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]!) : "";
}

const FBC_STORE = "clothiq_fbc";

/** Captures fbclid from the landing URL so fbc survives navigation. */
export function captureFbclid(): void {
  if (typeof window === "undefined") return;
  const fbclid = new URLSearchParams(window.location.search).get("fbclid");
  if (!fbclid) return;
  const fbc = `fb.1.${Date.now()}.${fbclid}`;
  try {
    localStorage.setItem(FBC_STORE, fbc);
  } catch {}
  if (!readCookie("_fbc")) {
    document.cookie = `_fbc=${encodeURIComponent(fbc)}; path=/; max-age=${90 * 86400}; SameSite=Lax`;
  }
}

/** Returns Meta browser (fbp) and click (fbc) identifiers for CAPI matching. */
export function getMetaClickIds(): { fbc?: string; fbp?: string } {
  if (typeof window === "undefined") return {};
  captureFbclid();
  let fbc = readCookie("_fbc");
  if (!fbc) {
    try {
      fbc = localStorage.getItem(FBC_STORE) ?? "";
    } catch {}
  }
  const fbp = readCookie("_fbp");
  return { ...(fbc ? { fbc: fbc.slice(0, 500) } : {}), ...(fbp ? { fbp: fbp.slice(0, 200) } : {}) };
}

export function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface MetaContent {
  id: string;
  quantity: number;
  itemPrice: number;
}

export interface MetaEventOptions {
  value?: number;
  currency?: string;
  contentIds?: string[];
  contentName?: string;
  contents?: MetaContent[];
  numItems?: number;
  orderId?: string;
  userData?: MetaUserData;
  /** Server-issued ID used to deduplicate a verified Purchase event. */
  eventId?: string;
}

/**
 * Fires a browser pixel event. Purchase events can use the server-issued event
 * ID returned after a real order is stored, allowing safe CAPI deduplication.
 */
export function trackMetaEvent(name: MetaEventName, options: MetaEventOptions = {}): void {
  if (typeof window === "undefined") return;
  const eventId = options.eventId ?? newEventId();
  const currency = options.currency ?? "BDT";

  if (options.userData) setMetaUserData(options.userData);

  const contents = options.contents?.map((c) => ({
    id: c.id,
    quantity: c.quantity,
    item_price: c.itemPrice,
  }));

  try {
    window.fbq?.(
      "track",
      name,
      {
        currency,
        ...(options.value !== undefined ? { value: options.value } : {}),
        ...(options.contentIds ? { content_ids: options.contentIds, content_type: "product" } : {}),
        ...(options.contentName ? { content_name: options.contentName } : {}),
        ...(contents ? { contents, content_type: "product" } : {}),
        ...(options.numItems !== undefined ? { num_items: options.numItems } : {}),
        ...(options.orderId ? { order_id: options.orderId } : {}),
      },
      { eventID: eventId },
    );
  } catch (error) {
    console.error("[meta] browser pixel event failed", error);
  }

}
