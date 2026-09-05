import { useEffect } from "react";
import { loadMetaPixel, trackMetaEvent } from "../lib/meta-pixel";

/** Loads the Meta Pixel (when configured in the admin panel) and fires PageView. */
export function MetaTracker({ pixelId }: { pixelId?: string }) {
  useEffect(() => {
    if (!pixelId) return;
    loadMetaPixel(pixelId);
    trackMetaEvent("PageView");
  }, [pixelId]);

  return null;
}
