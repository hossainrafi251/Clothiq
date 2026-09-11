import { createServerFn } from "@tanstack/react-start";
import { getRequest } from "@tanstack/react-start/server";
import { z } from "zod";

const EVENTS = ["PageView", "ViewContent", "AddToCart", "InitiateCheckout", "Purchase"] as const;

const capiSchema = z.object({
  eventName: z.enum(EVENTS),
  eventId: z.string().trim().min(4).max(80),
  eventSourceUrl: z.string().trim().max(500).optional(),
  value: z.number().min(0).max(10_000_000).optional(),
  currency: z.string().trim().max(8).optional(),
  contentIds: z.array(z.string().trim().max(80)).max(50).optional(),
  contentName: z.string().trim().max(200).optional(),
  contents: z
    .array(
      z.object({
        id: z.string().trim().max(80),
        quantity: z.number().int().min(1).max(1000),
        itemPrice: z.number().min(0).max(10_000_000),
      }),
    )
    .max(50)
    .optional(),
  numItems: z.number().int().min(0).max(10_000).optional(),
  orderId: z.string().trim().max(80).optional(),
  userData: z
    .object({
      email: z.string().trim().max(200).optional(),
      phone: z.string().trim().max(30).optional(),
      firstName: z.string().trim().max(100).optional(),
      lastName: z.string().trim().max(100).optional(),
      city: z.string().trim().max(100).optional(),
      country: z.string().trim().max(60).optional(),
    })
    .optional(),
});

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

/**
 * Server-side Meta Conversions API event. Shares its event_id with the browser
 * pixel event so Meta deduplicates the two copies. Customer identifiers are
 * SHA-256 hashed before they leave the server (Advanced Matching).
 */
export const sendMetaEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => capiSchema.parse(input))
  .handler(async ({ data }) => {
    try {
      const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
      const { data: meta } = await supabaseAdmin
        .from("meta_settings")
        .select("pixel_id,access_token,test_event_code")
        .eq("id", 1)
        .maybeSingle();

      if (!meta?.pixel_id || !meta.access_token) return { ok: false as const, skipped: true as const };

      const req = getRequest();
      const ip =
        req?.headers.get("cf-connecting-ip") ??
        req?.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ??
        undefined;
      const userAgent = req?.headers.get("user-agent") ?? undefined;
      const cookies = req?.headers.get("cookie") ?? "";
      const readCookie = (name: string) =>
        cookies
          .split(";")
          .map((c) => c.trim())
          .find((c) => c.startsWith(`${name}=`))
          ?.slice(name.length + 1);

      const userData: Record<string, unknown> = {};
      if (ip) userData["client_ip_address"] = ip;
      if (userAgent) userData["client_user_agent"] = userAgent;

      const fbp = readCookie("_fbp");
      const fbc = readCookie("_fbc");
      if (fbp) userData["fbp"] = fbp;
      if (fbc) userData["fbc"] = fbc;

      const u = data.userData;
      if (u?.email) userData["em"] = [await sha256(u.email)];
      const phone = u?.phone ? normalizePhone(u.phone) : "";
      if (phone) userData["ph"] = [await sha256(phone)];
      if (u?.firstName) userData["fn"] = [await sha256(u.firstName)];
      if (u?.lastName) userData["ln"] = [await sha256(u.lastName)];
      if (u?.city) userData["ct"] = [await sha256(u.city.replace(/\s+/g, ""))];
      if (u?.country) userData["country"] = [await sha256(u.country)];

      const externalSeed = phone || u?.email || (ip && userAgent ? `${ip}|${userAgent}` : "");
      if (externalSeed) userData["external_id"] = [await sha256(externalSeed)];

      const payload: Record<string, unknown> = {
        data: [
          {
            event_name: data.eventName,
            event_id: data.eventId,
            event_time: Math.floor(Date.now() / 1000),
            action_source: "website",
            ...(data.eventSourceUrl ? { event_source_url: data.eventSourceUrl } : {}),
            user_data: userData,
            custom_data: {
              ...(data.value !== undefined ? { value: data.value } : {}),
              currency: data.currency ?? "BDT",
              ...(data.contentIds ? { content_ids: data.contentIds, content_type: "product" } : {}),
              ...(data.contentName ? { content_name: data.contentName } : {}),
              ...(data.contents
                ? {
                    content_type: "product",
                    contents: data.contents.map((c) => ({
                      id: c.id,
                      quantity: c.quantity,
                      item_price: c.itemPrice,
                    })),
                  }
                : {}),
              ...(data.numItems !== undefined ? { num_items: data.numItems } : {}),
              ...(data.orderId ? { order_id: data.orderId } : {}),
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
        console.error("[meta] CAPI rejected event", data.eventName, res.status);
        return { ok: false as const, skipped: false as const };
      }
      return { ok: true as const, skipped: false as const };
    } catch (error) {
      console.error("[meta] CAPI request failed", error);
      return { ok: false as const, skipped: false as const };
    }
  });
