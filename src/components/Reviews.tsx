import { Star, Quote } from "lucide-react";

export interface PublicReview {
  id: string;
  author: string;
  rating: number;
  comment: string;
}

interface Props {
  reviews: PublicReview[];
  settings: Record<string, string>;
}

function Card({ r }: { r: PublicReview }) {
  return (
    <article className="w-[320px] shrink-0 rounded-2xl border border-border bg-card p-6 card-sheen">
      <Quote className="h-6 w-6 text-gold" aria-hidden="true" />
      <p className="mt-3 line-clamp-4 text-sm leading-relaxed text-muted-foreground">
        {r.comment}
      </p>
      <div className="mt-4 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={`h-4 w-4 ${i < r.rating ? "fill-gold text-gold" : "text-border"}`}
            aria-hidden="true"
          />
        ))}
      </div>
      <p className="mt-2 font-display text-sm font-bold">{r.author}</p>
    </article>
  );
}

export function Reviews({ reviews, settings }: Props) {
  if (reviews.length === 0) return null;
  const loop = [...reviews, ...reviews];

  return (
    <section className="border-t border-border/60 py-16" aria-labelledby="reviews-heading">
      <div className="mx-auto max-w-7xl px-4 text-center">
        <p className="text-xs font-bold uppercase tracking-[0.3em] text-gold">
          {settings["reviews_eyebrow"] ?? "Customer Love"}
        </p>
        <h2
          id="reviews-heading"
          className="mt-3 font-display text-3xl font-black uppercase tracking-tight sm:text-4xl"
        >
          {settings["reviews_title"] ?? "What Our Customers Say"}
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-sm text-muted-foreground">
          {settings["reviews_subtitle"] ??
            "Real words from people who own their vibe with CLOTHIQ."}
        </p>
      </div>

      <div className="group relative mt-10 overflow-hidden">
        <div className="review-track group-hover:[animation-play-state:paused] motion-reduce:animate-none">
          {loop.map((r, i) => (
            <Card key={`${r.id}-${i}`} r={r} />
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent" />
      </div>
    </section>
  );
}
