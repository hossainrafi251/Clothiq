import { useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { adminUploadImage } from "@/lib/admin.functions";

function toBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result).split(",")[1] ?? "");
    reader.onerror = () => reject(new Error("Could not read the file."));
    reader.readAsDataURL(file);
  });
}

/** Direct file upload with instant preview; stores the served image URL. */
export function ImageUpload({
  value,
  onChange,
  label = "Image",
}: {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}) {
  const upload = useServerFn(adminUploadImage);
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  return (
    <div className="text-xs text-muted-foreground">
      <span>{label}</span>
      <div className="mt-1.5 flex items-center gap-3">
        {value ? (
          <img
            src={value}
            alt="Preview"
            className="h-16 w-16 rounded-lg border border-border object-cover"
          />
        ) : (
          <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-dashed border-border text-[10px]">
            No image
          </div>
        )}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => inputRef.current?.click()}
            className="rounded-full border border-border px-4 py-2 text-[11px] font-bold uppercase disabled:opacity-50"
          >
            {busy ? "Uploading…" : "Upload image"}
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
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          e.target.value = "";
          if (!file) return;
          if (file.size > 10 * 1024 * 1024) {
            toast.error("Image must be smaller than 10MB.");
            return;
          }
          setBusy(true);
          try {
            const base64 = await toBase64(file);
            const result = await upload({
              data: {
                filename: file.name,
                contentType: file.type || "image/jpeg",
                data: base64,
              },
            });
            if (!result.ok || !result.url) {
              toast.error("Upload failed. Please sign in again.");
              return;
            }
            onChange(result.url);
            toast.success("Image uploaded.");
          } catch (error) {
            console.error(error);
            toast.error("Could not upload the image.");
          } finally {
            setBusy(false);
          }
        }}
      />
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder="or paste an image URL"
        className="mt-2 w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground"
      />
    </div>
  );
}
