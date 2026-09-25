/**
 * Server-only Meta Conversions API sender used for admin-side signals such as
 * cancelled or fraudulent orders. These events carry the store's Order ID so
 * Meta can tie them back to the original Purchase event.
 */

import { getRequest } from "@tanstack/react-start/server";

async function sha256(value: string): Promise<string> {
  const bytes = new TextEncoder().encode(value.trim().toLowerCase());
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function normalizePhone(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (!digits) return "";
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `880${digits.slice(1)}`;
  if (digits.startsWith("1")) return `880${digits}`;
  return digits;
}

export interface VerifiedPurchaseInput {
  eventId: string;
  orderId: string;
  value: number;
  productId: string;
  productTitle: string;
  quantity: number;
  unitPrice: number;
  fullName: string;
  email?: string;
  phone: string;
  city: string;
  state?: string;
  fbc?: string;
  fbp?: string;
}

function cookieValue(header: string | null | undefined, name: string): string {
  if (!header) return "";
  const m = header.match(new RegExp(`(?:^|;\\s*)${name}=([^;]*)`));
  return m ? decodeURIComponent(m[1]!) : "";
}

const norm = (v: string) => v.trim().toLowerCase().replace(/[^\p{L}\p{N}]/gu, "");

/** Sends Purchase only from server-verified product and order data. */
export async function sendMetaPurchase(
  input: VerifiedPurchaseInput,
): Promise<{ ok: boolean; skipped: boolean }> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: meta } = await supabaseAdmin
      .from("meta_settings")
      .select("pixel_id,access_token,test_event_code")
      .eq("id", 1)
      .maybeSingle();

    if (!meta?.pixel_id || !meta.access_token) return { ok: false, skipped: true };

    const request = getRequest();
    const ip =
      request?.headers.get("cf-connecting-ip") ??
      request?.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
    const userAgent = request?.headers.get("user-agent") ?? undefined;
    const cookies = request?.headers.get("cookie");
    const userData: Record<string, unknown> = {};
    if (ip) userData["client_ip_address"] = ip;
    if (userAgent) userData["client_user_agent"] = userAgent;
    const fbc = input.fbc || cookieValue(cookies, "_fbc");
    const fbp = input.fbp || cookieValue(cookies, "_fbp");
    // fbc/fbp are sent unhashed, per Meta's spec.
    if (fbc) userData["fbc"] = fbc;
    if (fbp) userData["fbp"] = fbp;

    const phone = normalizePhone(input.phone);
    if (phone) userData["ph"] = [await sha256(phone)];
    if (input.email) userData["em"] = [await sha256(input.email)];
    const parts = input.fullName.trim().split(/\s+/).filter(Boolean);
    if (parts[0]) userData["fn"] = [await sha256(norm(parts[0]))];
    if (parts.length > 1) userData["ln"] = [await sha256(norm(parts[parts.length - 1]!))];
    if (input.city) userData["ct"] = [await sha256(norm(input.city))];
    if (input.state) userData["st"] = [await sha256(norm(input.state))];
    userData["country"] = [await sha256("bd")];
    userData["external_id"] = [await sha256(phone || input.orderId)];

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: "Purchase",
          event_id: input.eventId,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "website",
          user_data: userData,
          custom_data: {
            order_id: input.orderId,
            value: input.value,
            currency: "BDT",
            content_ids: [input.productId],
            content_name: input.productTitle,
            content_type: "product",
            contents: [
              { id: input.productId, quantity: input.quantity, item_price: input.unitPrice },
            ],
            num_items: input.quantity,
          },
        },
      ],
    };
    if (meta.test_event_code) payload["test_event_code"] = meta.test_event_code;

    const response = await fetch(
      `https://graph.facebook.com/v19.0/${meta.pixel_id}/events?access_token=${encodeURIComponent(meta.access_token)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!response.ok) {
      console.error("[meta] verified Purchase rejected", response.status);
      return { ok: false, skipped: false };
    }
    return { ok: true, skipped: false };
  } catch (error) {
    console.error("[meta] verified Purchase failed", error);
    return { ok: false, skipped: false };
  }
}

export interface NegativeFeedbackInput {
  /** "OrderCancelled" or "FraudOrder". */
  eventName: string;
  orderId: string;
  value: number;
  currency?: string;
  contentIds?: string[];
  contentName?: string;
  quantity?: number;
  fullName?: string;
  phone?: string;
  city?: string;
  reason: string;
}

export async function sendMetaNegativeFeedback(
  input: NegativeFeedbackInput,
): Promise<{ ok: boolean; skipped: boolean }> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: meta } = await supabaseAdmin
      .from("meta_settings")
      .select("pixel_id,access_token,test_event_code")
      .eq("id", 1)
      .maybeSingle();

    if (!meta?.pixel_id || !meta.access_token) return { ok: false, skipped: true };

    const userData: Record<string, unknown> = {};
    const phone = input.phone ? normalizePhone(input.phone) : "";
    if (phone) userData["ph"] = [await sha256(phone)];
    const parts = (input.fullName ?? "").trim().split(/\s+/).filter(Boolean);
    if (parts[0]) userData["fn"] = [await sha256(parts[0])];
    if (parts.length > 1) userData["ln"] = [await sha256(parts[parts.length - 1]!)];
    if (input.city) userData["ct"] = [await sha256(input.city.replace(/\s+/g, ""))];
    userData["country"] = [await sha256("bd")];
    const seed = phone || input.orderId;
    userData["external_id"] = [await sha256(seed)];

    const payload: Record<string, unknown> = {
      data: [
        {
          event_name: input.eventName,
          // Deterministic id so repeated status changes are deduplicated.
          event_id: `${input.eventName}-${input.orderId}`,
          event_time: Math.floor(Date.now() / 1000),
          action_source: "system_generated",
          user_data: userData,
          custom_data: {
            order_id: input.orderId,
            value: input.value,
            currency: input.currency ?? "BDT",
            ...(input.contentIds
              ? { content_ids: input.contentIds, content_type: "product" }
              : {}),
            ...(input.contentName ? { content_name: input.contentName } : {}),
            ...(input.quantity !== undefined ? { num_items: input.quantity } : {}),
            order_status: input.reason,
          },
        },
      ],
    };
    if (meta.test_event_code) payload["test_event_code"] = meta.test_event_code;

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${meta.pixel_id}/events?access_token=${encodeURIComponent(meta.access_token)}`,
      {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      console.error("[meta] negative feedback rejected", input.eventName, res.status);
      return { ok: false, skipped: false };
    }
    return { ok: true, skipped: false };
  } catch (error) {
    console.error("[meta] negative feedback failed", error);
    return { ok: false, skipped: false };
  }
}
