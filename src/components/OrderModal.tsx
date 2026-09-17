import { Minus, Plus, X } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import type { Product } from "../lib/products";
import { bdt, DELIVERY_INSIDE_DHAKA, DELIVERY_OUTSIDE_DHAKA } from "../lib/currency";
import { DISTRICTS, DISTRICT_NAMES } from "../lib/bd-locations";
import { placeOrder, trackIncompleteCheckout } from "../lib/store.functions";
import { setMetaUserData, trackMetaEvent } from "../lib/meta-pixel";

const DEFAULT_SIZES = ["S", "M", "L", "XL"];
const DEFAULT_COLORS = ["Black", "White", "Teal", "Charcoal"];

interface Props {
  product: Product;
  onClose: () => void;
  initialColor?: string;
  settings?: Record<string, string>;
}

export function OrderModal({ product, onClose, initialColor = "", settings = {} }: Props) {
  const sizes = product.sizes ?? (product.category === "Watches" ? ["One Size"] : DEFAULT_SIZES);
  const variants = (product.colorVariants ?? []).filter((v) => v.name);
  const colors = variants.length ? variants.map((v) => v.name) : product.colors ?? DEFAULT_COLORS;
  const submitOrder = useServerFn(placeOrder);
  const saveIncomplete = useServerFn(trackIncompleteCheckout);

  const [size, setSize] = useState(sizes[0]);
  const [color, setColor] = useState(
    initialColor && colors.includes(initialColor) ? initialColor : colors[0],
  );
  const [qty, setQty] = useState(1);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [district, setDistrict] = useState("");
  const [thana, setThana] = useState("");
  const [address, setAddress] = useState("");
  const [placed, setPlaced] = useState(false);
  const [orderNumber, setOrderNumber] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const insideFee = Number(settings["delivery_inside_dhaka"] ?? DELIVERY_INSIDE_DHAKA) || DELIVERY_INSIDE_DHAKA;
  const outsideFee = Number(settings["delivery_outside_dhaka"] ?? DELIVERY_OUTSIDE_DHAKA) || DELIVERY_OUTSIDE_DHAKA;

  const thanas = district ? DISTRICTS[district] ?? [] : [];
  const subtotal = product.price * qty;
  const shipping = useMemo(
    () => (district ? (district === "Dhaka" ? insideFee : outsideFee) : 0),
    [district, insideFee, outsideFee],
  );
  const grandTotal = subtotal + shipping;

  // Track checkout start once, and record the checkout as incomplete if the
  // customer leaves without confirming.
  const state = useRef({ placed: false, fullName: "", phone: "", district: "", color: "", qty: 1, total: 0 });
  state.current = { ...state.current, fullName, phone, district, color: color ?? "", qty, total: grandTotal };

  useEffect(() => {
    trackMetaEvent("InitiateCheckout", {
      value: product.price * qty,
      currency: "BDT",
      contentIds: [product.id],
      contentName: product.name,
      contents: [{ id: product.id, quantity: qty, itemPrice: product.price }],
      numItems: qty,
    });
    return () => {
      const s = state.current;
      if (s.placed || (!s.fullName.trim() && !s.phone.trim())) return;
      void saveIncomplete({
        data: {
          productId: product.id,
          productTitle: product.name,
          fullName: s.fullName.trim().slice(0, 100),
          phone: s.phone.trim().slice(0, 20),
          district: s.district,
          color: s.color,
          quantity: s.qty,
          total: s.total,
        },
      }).catch(() => undefined);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product.id]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fullName.trim() || fullName.trim().length > 100) return setError("Please enter your full name.");
    if (!/^01[3-9]\d{8}$/.test(phone.trim()))
      return setError("Please enter a valid 11-digit Bangladeshi phone number (e.g. 01712345678).");
    if (!district) return setError("Please select your district.");
    if (!thana) return setError("Please select your thana / upazila.");
    if (!address.trim() || address.trim().length > 300) return setError("Please enter your street address.");
    setError("");
    setSaving(true);
    try {
      const result = await submitOrder({
        data: {
          productId: product.id,
          productTitle: product.name,
          size: size ?? "",
          color: color ?? "",
          quantity: qty,
          unitPrice: product.price,
          fullName: fullName.trim(),
          phone: phone.trim(),
          district,
          thana,
          address: address.trim(),
        },
      });
      state.current.placed = true;
      setOrderNumber(result.orderNumber);
      setPlaced(true);
      const nameParts = fullName.trim().split(/\s+/);
      trackMetaEvent("Purchase", {
        value: grandTotal,
        currency: "BDT",
        contentIds: [product.id],
        contentName: product.name,
        contents: [{ id: product.id, quantity: qty, itemPrice: product.price }],
        numItems: qty,
        userData: {
          ...(email.trim() ? { email: email.trim() } : {}),
          phone: phone.trim(),
          firstName: nameParts[0] ?? "",
          ...(nameParts.length > 1 ? { lastName: nameParts[nameParts.length - 1] ?? "" } : {}),
          city: district,
          country: "bd",
        },
      });
    } catch {
      setError("We couldn't place your order. Please try again.");
    } finally {
      setSaving(false);
    }
  };


  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto p-4 sm:p-8">
      <div className="fixed inset-0 bg-background/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative my-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-border bg-card shadow-2xl">
        <div className="bg-gradient-teal h-1 w-full" />
        <button
          aria-label="Close order form"
          onClick={onClose}
          className="absolute top-4 right-4 rounded-full bg-background/70 p-2 text-muted-foreground transition-colors hover:text-foreground"
        >
          <X className="h-5 w-5" />
        </button>

        {placed ? (
          <div className="flex flex-col items-center gap-3 px-6 py-14 text-center">
            <h2 className="font-display text-2xl font-bold text-gradient-teal">Order Confirmed</h2>
            <p className="text-sm text-muted-foreground">
              Thank you, {fullName}. We will call {phone} shortly to confirm your Cash on Delivery order.
            </p>
            <p className="font-display text-xl font-bold text-gold">{bdt(grandTotal)}</p>
            <button
              onClick={onClose}
              className="bg-gradient-teal mt-2 rounded-full px-6 py-2.5 text-sm font-bold tracking-wide text-primary-foreground"
            >
              Continue Shopping
            </button>
          </div>
        ) : (
          <>
            {/* Top section — product summary */}
            <div className="flex gap-4 border-b border-border px-6 py-5">
              <img
                src={variants.find((v) => v.name === color)?.image || product.image}
                alt={color ? `${product.name} — ${color}` : product.name}
                className="h-28 w-28 rounded-xl border border-border object-cover"
              />
              <div className="flex-1">
                <p className="text-[11px] font-semibold tracking-[0.2em] text-accent uppercase">
                  {product.category}
                </p>
                <h2 className="font-display text-lg leading-snug font-bold">{product.name}</h2>

                <div className="mt-3 flex flex-wrap items-center gap-3">
                  <label className="flex items-center gap-2 text-xs text-muted-foreground">
                    Size
                    <select
                      value={size}
                      onChange={(e) => setSize(e.target.value)}
                      className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                    >
                      {sizes.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  </label>
                  {variants.length > 0 ? (
                    <div className="flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
                      Color
                      {colors.map((c) => (
                        <button
                          key={c}
                          type="button"
                          aria-pressed={c === color}
                          onClick={() => setColor(c)}
                          className={
                            c === color
                              ? "rounded-full border border-gold px-3 py-1 text-[10px] font-bold tracking-wide text-gold uppercase"
                              : "rounded-full border border-border px-3 py-1 text-[10px] font-bold tracking-wide text-muted-foreground uppercase hover:text-foreground"
                          }
                        >
                          {c}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <label className="flex items-center gap-2 text-xs text-muted-foreground">
                      Color
                      <select
                        value={color}
                        onChange={(e) => setColor(e.target.value)}
                        className="rounded-md border border-border bg-background px-2 py-1 text-xs text-foreground"
                      >
                        {colors.map((c) => (
                          <option key={c} value={c}>{c}</option>
                        ))}
                      </select>
                    </label>
                  )}
                  <div className="flex items-center gap-2 rounded-full border border-border px-1.5 py-1">
                    <button type="button" aria-label="Decrease quantity" onClick={() => setQty(Math.max(1, qty - 1))} className="rounded-full p-1 hover:bg-secondary">
                      <Minus className="h-3.5 w-3.5" />
                    </button>
                    <span className="w-5 text-center text-sm font-semibold">{qty}</span>
                    <button type="button" aria-label="Increase quantity" onClick={() => setQty(qty + 1)} className="rounded-full p-1 hover:bg-secondary">
                      <Plus className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <p className="font-display mt-3 text-xl font-bold text-gold">{bdt(subtotal)}</p>
              </div>
            </div>

            {/* Bottom section — order form */}
            <form onSubmit={submit} className="flex flex-col gap-4 px-6 py-5">
              <h3 className="font-display text-sm font-bold tracking-widest uppercase">Delivery Details</h3>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ord-name" className="text-xs text-muted-foreground">Full Name</label>
                  <input
                    id="ord-name"
                    value={fullName}
                    maxLength={100}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Your full name"
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ord-phone" className="text-xs text-muted-foreground">Phone Number</label>
                  <input
                    id="ord-phone"
                    value={phone}
                    maxLength={14}
                    inputMode="tel"
                    onChange={(e) => setPhone(e.target.value)}
                    onBlur={() => phone.trim() && setMetaUserData({ phone: phone.trim(), country: "bd" })}
                    placeholder="01XXXXXXXXX"
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ord-email" className="text-xs text-muted-foreground">
                    Email <span className="opacity-70">(optional)</span>
                  </label>
                  <input
                    id="ord-email"
                    type="email"
                    value={email}
                    maxLength={200}
                    inputMode="email"
                    onChange={(e) => setEmail(e.target.value)}
                    onBlur={() => email.trim() && setMetaUserData({ email: email.trim() })}
                    placeholder="you@example.com"
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ord-district" className="text-xs text-muted-foreground">Select District</label>
                  <select
                    id="ord-district"
                    value={district}
                    onChange={(e) => { setDistrict(e.target.value); setThana(""); }}
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                  >
                    <option value="">Select District</option>
                    {DISTRICT_NAMES.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label htmlFor="ord-thana" className="text-xs text-muted-foreground">Select Thana / Upazila</label>
                  <select
                    id="ord-thana"
                    value={thana}
                    disabled={!district}
                    onChange={(e) => setThana(e.target.value)}
                    className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary disabled:opacity-50"
                  >
                    <option value="">{district ? "Select Thana / Upazila" : "Select a district first"}</option>
                    {thanas.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label htmlFor="ord-address" className="text-xs text-muted-foreground">
                  Street Address / Village / House No.
                </label>
                <input
                  id="ord-address"
                  value={address}
                  maxLength={300}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="House 12, Road 5, Block C, Village / Area"
                  className="rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-primary"
                />
              </div>

              <div className="rounded-xl border border-border bg-background/50 px-4 py-3 text-sm">
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span className="font-semibold">{bdt(subtotal)}</span>
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-muted-foreground">
                    Delivery Fee{" "}
                    {district ? `(${district === "Dhaka" ? `Inside Dhaka — ${bdt(insideFee)}` : `Outside Dhaka — ${bdt(outsideFee)}`})` : "(select district)"}
                  </span>
                  <span className="font-semibold">{district ? bdt(shipping) : "—"}</span>
                </div>
                <div className="mt-1 flex items-center justify-between border-t border-border pt-2">
                  <span className="font-display font-bold">Total Payable</span>
                  <span className="font-display text-xl font-bold text-gold">{bdt(grandTotal)}</span>
                </div>
                <p className="mt-2 text-xs text-muted-foreground">Payment Method: Cash on Delivery</p>
              </div>

              {error && <p className="text-xs font-medium text-destructive">{error}</p>}

              <button
                type="submit"
                className="bg-gradient-teal w-full rounded-full py-3.5 text-sm font-bold tracking-widest text-primary-foreground uppercase shadow-[0_0_30px_-8px_oklch(0.85_0.13_200/60%)] transition-transform hover:scale-[1.02]"
              >
                Confirm Order
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}
