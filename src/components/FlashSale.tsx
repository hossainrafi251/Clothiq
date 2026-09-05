import { useEffect, useState } from "react";
import { Flame } from "lucide-react";

interface Props {
  settings: Record<string, string>;
}

function remaining(endsAt: string) {
  const diff = new Date(endsAt).getTime() - Date.now();
  if (!Number.isFinite(diff) || diff <= 0) return null;
  return {
    days: Math.floor(diff / 86_400_000),
    hours: Math.floor((diff / 3_600_000) % 24),
    minutes: Math.floor((diff / 60_000) % 60),
    seconds: Math.floor((diff / 1000) % 60),
  };
}

export function FlashSale({ settings }: Props) {
  const active = settings["flash_sale_active"] === "true";
  const endsAt = settings["flash_sale_ends_at"] ?? "";
  const [left, setLeft] = useState<ReturnType<typeof remaining>>(null);

  useEffect(() => {
    if (!active || !endsAt) return;
    const tick = () => setLeft(remaining(endsAt));
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [active, endsAt]);

  if (!active || !endsAt || !left) return null;

  const cells: [string, number][] = [
    ["Days", left.days],
    ["Hours", left.hours],
    ["Mins", left.minutes],
    ["Secs", left.seconds],
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 sm:px-6">
      <div className="flex flex-wrap items-center justify-between gap-5 rounded-2xl border border-gold/40 bg-card px-6 py-5">
        <div className="flex items-center gap-3">
          <Flame className="h-6 w-6 text-gold" />
          <div>
            <p className="text-[11px] font-semibold tracking-[0.3em] text-gold uppercase">
              Limited Time
            </p>
            <h2 className="font-display text-xl font-bold">
              {settings["flash_sale_title"] || "Flash Sale"}
            </h2>
          </div>
        </div>
        <div className="flex gap-3">
          {cells.map(([label, value]) => (
            <div
              key={label}
              className="min-w-[62px] rounded-xl border border-border bg-background px-3 py-2 text-center"
            >
              <p className="font-display text-xl font-bold text-gradient-teal">
                {String(value).padStart(2, "0")}
              </p>
              <p className="text-[10px] tracking-widest text-muted-foreground uppercase">{label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
