import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "../lib/cart";
import { bdt } from "../lib/currency";

export function CartDrawer() {
  const { items, open, setOpen, updateQty, removeItem, total } = useCart();

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div
        className="absolute inset-0 bg-background/70 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <aside className="absolute top-0 right-0 flex h-full w-full max-w-md flex-col border-l border-border bg-card shadow-2xl">
        <div className="flex items-center justify-between border-b border-border px-6 py-5">
          <h2 className="font-display text-lg font-bold tracking-wide">
            Your Cart{" "}
            <span className="text-sm font-medium text-muted-foreground">
              ({items.length} {items.length === 1 ? "item" : "items"})
            </span>
          </h2>
          <button
            aria-label="Close cart"
            onClick={() => setOpen(false)}
            className="rounded-full p-2 text-muted-foreground transition-colors hover:bg-secondary hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {items.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-4 text-center">
              <div className="rounded-full bg-secondary p-5">
                <ShoppingBag className="h-8 w-8 text-muted-foreground" />
              </div>
              <p className="font-display text-lg font-semibold">Your cart is empty</p>
              <p className="text-sm text-muted-foreground">
                Discover the collection and own your vibe.
              </p>
              <button
                onClick={() => setOpen(false)}
                className="bg-gradient-teal mt-2 rounded-full px-6 py-2.5 text-sm font-bold tracking-wide text-primary-foreground transition-transform hover:scale-105"
              >
                Continue Shopping
              </button>
            </div>
          ) : (
            <ul className="flex flex-col gap-5">
              {items.map(({ product, qty }) => (
                <li key={product.id} className="flex gap-4">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-20 w-20 rounded-lg border border-border object-cover"
                  />
                  <div className="flex flex-1 flex-col">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <p className="text-sm font-semibold leading-tight">{product.name}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{product.category}</p>
                      </div>
                      <button
                        aria-label={`Remove ${product.name}`}
                        onClick={() => removeItem(product.id)}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-auto flex items-center justify-between pt-2">
                      <div className="flex items-center gap-2 rounded-full border border-border px-1.5 py-1">
                        <button
                          aria-label="Decrease quantity"
                          onClick={() => updateQty(product.id, qty - 1)}
                          className="rounded-full p-1 transition-colors hover:bg-secondary"
                        >
                          <Minus className="h-3.5 w-3.5" />
                        </button>
                        <span className="w-5 text-center text-sm font-semibold">{qty}</span>
                        <button
                          aria-label="Increase quantity"
                          onClick={() => updateQty(product.id, qty + 1)}
                          className="rounded-full p-1 transition-colors hover:bg-secondary"
                        >
                          <Plus className="h-3.5 w-3.5" />
                        </button>
                      </div>
                      <p className="text-sm font-bold text-gold">
                        {bdt(product.price * qty)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {items.length > 0 && (
          <div className="border-t border-border px-6 py-5">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Subtotal</span>
              <span className="font-display text-xl font-bold text-gold">
                {bdt(total)}
              </span>
            </div>
            <button className="bg-gradient-teal w-full rounded-full py-3.5 text-sm font-bold tracking-widest text-primary-foreground uppercase transition-transform hover:scale-[1.02]">
              Proceed to Checkout
            </button>
            <p className="mt-3 text-center text-xs text-muted-foreground">
              Cash on Delivery available — Inside Dhaka ৳80, Outside Dhaka ৳150
            </p>
          </div>
        )}
      </aside>
    </div>
  );
}
