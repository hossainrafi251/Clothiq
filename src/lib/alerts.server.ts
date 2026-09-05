/**
 * Owner alerts: sends an SMS (BulkSMSBD) and, when app email is configured,
 * an email to the shop owner. Never throws — alerts must not break an order.
 */

async function ownerContacts(): Promise<{ phone: string; email: string }> {
  try {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data } = await supabaseAdmin
      .from("site_settings")
      .select("key,value")
      .in("key", ["alert_phone", "alert_email"]);
    const map = Object.fromEntries((data ?? []).map((r) => [r.key, String(r.value ?? "").trim()]));
    return { phone: map["alert_phone"] ?? "", email: map["alert_email"] ?? "" };
  } catch (error) {
    console.error("[alerts] could not read owner contacts", error);
    return { phone: "", email: "" };
  }
}

/** Normalises a Bangladeshi number to the 8801XXXXXXXXX form BulkSMSBD expects. */
function normalisePhone(raw: string): string {
  const digits = raw.replace(/\D/g, "");
  if (digits.startsWith("880")) return digits;
  if (digits.startsWith("0")) return `88${digits}`;
  if (digits.startsWith("1")) return `880${digits}`;
  return digits;
}

async function sendSms(to: string, message: string) {
  const apiKey = process.env["BULKSMSBD_API_KEY"];
  const senderId = process.env["BULKSMSBD_SENDER_ID"];
  if (!apiKey || !senderId || !to) return;

  try {
    const res = await fetch("https://bulksmsbd.net/api/smsapi", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        api_key: apiKey,
        senderid: senderId,
        number: normalisePhone(to),
        message,
      }),
    });
    const body = await res.text();
    if (!res.ok) console.error("[alerts] sms failed", res.status, body);
  } catch (error) {
    console.error("[alerts] sms error", error);
  }
}

async function sendEmail(to: string, subject: string, message: string) {
  if (!to) return;
  try {
    const path = "@/lib/email-templates/send-email";
    const mod = (await import(/* @vite-ignore */ path).catch(() => null)) as {
      sendTemplateEmail?: (
        template: string,
        to: string,
        opts: { templateData: Record<string, unknown>; idempotencyKey?: string },
      ) => Promise<unknown>;
    } | null;
    if (!mod?.sendTemplateEmail) return;
    await mod.sendTemplateEmail("owner-order-alert", to, {
      templateData: { subject, message },
    });
  } catch (error) {
    console.error("[alerts] email error", error);
  }
}

/** Fire-and-forget owner alert for a new order or a status change. */
export async function notifyOwner(subject: string, message: string) {
  const { phone, email } = await ownerContacts();
  await Promise.all([sendSms(phone, message), sendEmail(email, subject, message)]);
}
