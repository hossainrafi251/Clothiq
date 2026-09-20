import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminCreateVideoUpload } from "@/lib/admin.functions";
import { supabase } from "@/integrations/supabase/client";

/** Uploads a product video straight to storage; stores the served video URL. */
export function VideoUpload({
  value,
  onChange,
  label = "Product video (optional)",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const createUpload = useServerFn(adminCreateVideoUpload);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="text-xs text-muted-foreground">
      <span>{label}</span>
      <div className="mt-1.5 flex items-center gap-3">
        {value ? (
          <video
            src={value}
            muted
            playsInline
            preload="metadata"
            className="h-16 w-16 rounded-lg border border-border object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border text-center text-[10px]">
            No video
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-full border border-border px-4 py-2 text-[11px] font-bold uppercase disabled:opacity-50"
          >
            {busy ? "Uploading…" : "Upload video"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-full border border-border px-4 py-2 text-[11px] font-bold uppercase hover:text-destructive"
            >
              Remove
            </button>
          )}
        </div>
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="video/mp4,video/webm,video/quicktime,video/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          setBusy(true);
          try {
            const created = await createUpload({ data: { filename: file.name } });
            if (!created.ok || !created.token) {
              toast.error("Upload failed. Please sign in again.");
              return;
            }
            const { error } = await supabase.storage
              .from("product-images")
              .uploadToSignedUrl(created.path, created.token, file, {
                contentType: file.type || "video/mp4",
              });
            if (error) throw new Error(error.message);
            onChange(created.url);
            toast.success("Video uploaded.");
          } catch (error) {
            console.error(error);
            toast.error("Could not upload the video.");
          } finally {
            setBusy(false);
          }
        }}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="or paste a video URL (MP4/WebM)"
        className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
    </div>
  );
}
