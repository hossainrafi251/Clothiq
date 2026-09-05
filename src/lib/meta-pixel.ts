import { sendMetaEvent } from "./meta.functions";

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

  window.fbq?.("init", pixelId);
}

export function newEventId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `evt-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export interface MetaEventOptions {
  value?: number;
  currency?: string;
  contentIds?: string[];
  contentName?: string;
}

/**
 * Fires the browser pixel event and the server-side Conversions API event with
 * one shared event id so Meta deduplicates them.
 */
export function trackMetaEvent(name: MetaEventName, options: MetaEventOptions = {}): void {
  if (typeof window === "undefined") return;
  const eventId = newEventId();

  try {
    window.fbq?.(
      "track",
      name,
      {
        currency: options.currency ?? "BDT",
        ...(options.value !== undefined ? { value: options.value } : {}),
        ...(options.contentIds ? { content_ids: options.contentIds, content_type: "product" } : {}),
        ...(options.contentName ? { content_name: options.contentName } : {}),
      },
      { eventID: eventId },
    );
  } catch (error) {
    console.error("[meta] browser pixel event failed", error);
  }

  void sendMetaEvent({
    data: {
      eventName: name,
      eventId,
      eventSourceUrl: window.location.href,
      currency: options.currency ?? "BDT",
      ...(options.value !== undefined ? { value: options.value } : {}),
      ...(options.contentIds ? { contentIds: options.contentIds } : {}),
      ...(options.contentName ? { contentName: options.contentName } : {}),
    },
  }).catch((error: unknown) => console.error("[meta] CAPI call failed", error));
}
