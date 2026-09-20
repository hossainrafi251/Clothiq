import { createFileRoute } from "@tanstack/react-router";

/** Streams product videos by redirecting to a short-lived signed storage URL (range-friendly). */
export const Route = createFileRoute("/api/public/media/$key")({
  server: {
    handlers: {
      GET: async ({ params }) => {
        const key = String(params.key ?? "");
        if (!/^[A-Za-z0-9._-]+$/.test(key)) return new Response("Not found", { status: 404 });

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
        const { data, error } = await supabaseAdmin.storage
          .from("product-images")
          .createSignedUrl(key, 60 * 60);
        if (error || !data?.signedUrl) return new Response("Not found", { status: 404 });

        return new Response(null, {
          status: 302,
          headers: {
            location: data.signedUrl,
            "cache-control": "public, max-age=1800",
          },
        });
      },
    },
  },
});
