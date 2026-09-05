import { ArrowRight, Star } from "lucide-react";
import heroFallback from "../assets/hero.jpg";

interface HeroProps {
  settings?: Record<string, string>;
}

export function Hero({ settings = {} }: HeroProps) {
  const headline = settings["hero_headline"] ?? "THE ESSENTIAL COLLECTION";
  const [line1, ...rest] = headline.split(" COLLECTION");
  const sub = settings["hero_subheadline"] ?? "ELEVATE YOUR VIBE";
  const subWords = sub.split(" ");
  const heroImage = settings["hero_image_url"] || heroFallback;

  return (
    <section id="top" className="relative overflow-hidden">
      {settings["promo_text"] && (
        <p className="border-b border-border bg-secondary/40 px-4 py-2 text-center text-xs font-semibold tracking-wide text-gold">
          {settings["promo_text"]}
        </p>
      )}
      <div className="mx-auto grid max-w-7xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-2 lg:py-20">
        <div className="relative z-10 order-2 lg:order-1">
          <p className="mb-4 inline-flex items-center gap-2 rounded-full border border-gold/40 px-4 py-1.5 text-xs font-semibold tracking-[0.25em] text-gold uppercase">
            <Star className="h-3.5 w-3.5 fill-current" />
            {settings["hero_badge"] ?? "New Season Drop"}
          </p>
          <h1 className="font-display text-4xl leading-[1.05] font-bold tracking-tight sm:text-5xl xl:text-6xl">
            {line1}
            {rest.length > 0 && (
              <>
                <br />
                COLLECTION
              </>
            )}
            <span className="mt-3 block text-xl font-medium tracking-[0.2em] sm:text-2xl">
              <span className="text-gradient-teal">{subWords[0]}</span>{" "}
              <span className="text-gradient-gold">{subWords.slice(1).join(" ")}</span>
            </span>
          </h1>
          <p className="mt-6 max-w-md text-base leading-relaxed text-muted-foreground">
            {settings["hero_text"] ??
              "Precision tailoring, statement timepieces, and refined accessories — curated for the man who dresses with intent."}
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-4">
            <a
              href="#shop"
              className="bg-gradient-teal inline-flex items-center gap-2 rounded-full px-8 py-4 text-sm font-bold tracking-widest text-primary-foreground uppercase shadow-lg transition-transform hover:scale-105"
            >
              {settings["hero_cta"] ?? "Explore Collection"}
              <ArrowRight className="h-4 w-4" />
            </a>
            <a
              href="#categories"
              className="gold-underline text-sm font-semibold tracking-wide text-foreground"
            >
              Shop by Category
            </a>
          </div>
          <div className="mt-10 flex gap-10 border-t border-border pt-6">
            <div>
              <p className="font-display text-2xl font-bold text-gradient-teal">500+</p>
              <p className="text-xs tracking-wide text-muted-foreground">Premium Pieces</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold text-gradient-gold">4.9★</p>
              <p className="text-xs tracking-wide text-muted-foreground">Customer Rating</p>
            </div>
            <div>
              <p className="font-display text-2xl font-bold">24h</p>
              <p className="text-xs tracking-wide text-muted-foreground">Fast Dispatch</p>
            </div>
          </div>
        </div>

        <div className="relative order-1 lg:order-2">
          <div className="absolute -inset-6 rounded-[2rem] bg-gradient-to-tr from-accent/30 via-transparent to-gold/20 blur-2xl" />
          <div className="relative overflow-hidden rounded-3xl border border-border shadow-2xl">
            <img
              src={heroImage}
              alt="Man in tailored navy suit wearing a gold CLOTHIQ chronograph watch"
              width={1600}
              height={1000}
              className="h-full w-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            <div className="absolute bottom-5 left-5 rounded-xl border border-border bg-background/80 px-5 py-3 backdrop-blur-md">
              <p className="text-xs tracking-[0.2em] text-gold uppercase">Signature Piece</p>
              <p className="font-display text-sm font-bold">Aurelius Gold Chronograph — ৳12,500</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
