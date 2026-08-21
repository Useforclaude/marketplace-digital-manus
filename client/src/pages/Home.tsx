import { StoreHeader } from "@/components/StoreHeader";
import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { formatCurrency, products } from "@/data/catalog";
import { useCart } from "@/contexts/CartContext";
import { ArrowDownRight, ArrowUpRight, Check, ChevronRight, Minus, Plus, ShoppingBag, Sparkles, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

/**
 * All content in this page are only for example, replace with your own feature implementation
 * When building pages, remember your instructions in Frontend Workflow, Frontend Best Practices, Design Guide and Common Pitfalls
 */
export default function Home() {
  const [cartOpen, setCartOpen] = useState(false);
  const { addItem, itemCount, items, removeItem, setQuantity, subtotal } = useCart();
  const { isAuthenticated } = useAuth();
  const checkout = trpc.commerce.createCheckoutSession.useMutation({
    onSuccess: ({ url }) => {
      window.open(url, "_blank", "noopener,noreferrer");
      toast.success("Opening secure checkout", { description: "Complete payment in the Stripe checkout tab." });
    },
    onError: () => toast.error("Checkout could not be opened", { description: "Please try again in a moment." }),
  });

  const addToCart = (productId: string) => {
    addItem(productId);
    toast.success("Added to your collection", { description: "Review your cart whenever you are ready." });
  };

  const beginCheckout = () => {
    if (items.length === 0) return;
    if (!isAuthenticated) {
      toast.message("Sign in to keep your editions", { description: "Your purchase will unlock in the signed-in account library." });
      startLogin();
      return;
    }
    checkout.mutate({ items: items.map(({ productId, quantity }) => ({ productId, quantity })) });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#0b0c0d] text-white">
      <StoreHeader onOpenCart={() => setCartOpen(true)} />
      <main>
        <section className="relative isolate overflow-hidden">
          <div className="container grid min-h-[670px] items-center gap-12 py-18 lg:grid-cols-[1.08fr_0.92fr] lg:py-22">
            <div className="relative z-10 max-w-3xl">
              <div className="mb-7 flex items-center gap-3">
                <span className="h-px w-9 bg-[#d5ff45]" />
                <span className="eyebrow text-[#d5ff45]">DIGITAL EDITIONS / 2026</span>
              </div>
              <h1 className="font-display max-w-3xl text-[clamp(3.35rem,7.6vw,7.5rem)] font-semibold leading-[0.9] tracking-[-0.06em] text-white">
                Work worth
                <br />
                <em className="text-[#d5ff45]">keeping open.</em>
              </h1>
              <p className="mt-8 max-w-xl text-base leading-7 text-white/58 sm:text-lg">
                Brightline makes compact, useful editions for people building thoughtful work in a noisy digital world.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-3">
                <a
                  href="#editions"
                  className="group inline-flex items-center gap-3 rounded-full bg-[#d5ff45] px-5 py-3 text-[11px] font-extrabold tracking-[0.14em] text-[#141510] transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97]"
                >
                  EXPLORE EDITIONS
                  <ArrowDownRight size={15} className="transition-transform group-hover:translate-y-0.5 group-hover:translate-x-0.5" />
                </a>
                <a
                  href="#membership"
                  className="inline-flex items-center gap-2 rounded-full px-4 py-3 text-[11px] font-bold tracking-[0.12em] text-white/70 transition-colors hover:text-white"
                >
                  HOW IT WORKS <ChevronRight size={14} />
                </a>
              </div>
              <div className="mt-16 grid max-w-md grid-cols-3 border-t border-white/12 pt-5 text-white/55">
                <div><div className="font-display text-2xl text-white">03</div><div className="mt-1 text-[9px] font-semibold tracking-[0.14em]">CURRENT EDITIONS</div></div>
                <div><div className="font-display text-2xl text-white">HTML</div><div className="mt-1 text-[9px] font-semibold tracking-[0.14em]">READING FORMAT</div></div>
                <div><div className="font-display text-2xl text-white">∞</div><div className="mt-1 text-[9px] font-semibold tracking-[0.14em]">YOUR LIBRARY</div></div>
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[520px] lg:mx-0">
              <div className="absolute -inset-10 rounded-full bg-[#d5ff45]/8 blur-3xl" />
              <div className="relative overflow-hidden rounded-[2rem] border border-white/12 bg-white/[0.035] p-3 shadow-[0_32px_90px_rgba(0,0,0,0.38)]">
                <div className="relative overflow-hidden rounded-[1.45rem] bg-[#1a1c1b]">
                  <img src={products[0].coverUrl} alt="Abstract artwork for Atlas of Attention" className="aspect-[4/4.35] w-full object-cover opacity-90" />
                  <div className="absolute inset-0 bg-gradient-to-t from-[#0b0c0d] via-transparent to-transparent" />
                  <div className="absolute inset-x-0 bottom-0 p-7 sm:p-9">
                    <div className="mb-3 flex items-center justify-between text-[9px] font-bold tracking-[0.15em] text-white/60">
                      <span>FEATURED EDITION</span><span>01 / 03</span>
                    </div>
                    <div className="font-display text-4xl leading-none tracking-[-0.05em] sm:text-5xl">Atlas of<br />Attention</div>
                    <div className="mt-5 flex items-center justify-between border-t border-white/15 pt-4 text-[11px] font-semibold tracking-[0.12em]">
                      <span className="text-[#d5ff45]">{formatCurrency(products[0].priceCents)}</span>
                      <button onClick={() => addToCart(products[0].id)} className="inline-flex items-center gap-2 text-white transition-colors hover:text-[#d5ff45]">ADD TO CART <Plus size={13} /></button>
                    </div>
                  </div>
                </div>
              </div>
              <div className="absolute -bottom-5 -left-5 hidden max-w-48 rounded-xl border border-white/10 bg-[#161819]/95 p-4 shadow-2xl backdrop-blur md:block">
                <div className="eyebrow mb-2 text-[#d5ff45]">DESIGNED TO LAST</div>
                <p className="text-xs leading-5 text-white/70">Buy once. Read in your private library, at your own pace.</p>
              </div>
            </div>
          </div>
        </section>

        <section id="editions" className="container scroll-mt-20 py-16 sm:py-24">
          <div className="flex flex-col justify-between gap-5 border-b border-white/12 pb-7 md:flex-row md:items-end">
            <div>
              <div className="eyebrow text-[#d5ff45]">THE SHELF</div>
              <h2 className="font-display mt-3 text-4xl tracking-[-0.045em] sm:text-5xl">Current editions.</h2>
            </div>
            <p className="max-w-sm text-sm leading-6 text-white/55">Original guides made to be used, annotated, revisited—and kept close.</p>
          </div>

          <div className="mt-9 grid gap-x-6 gap-y-12 md:grid-cols-3">
            {products.map((product, index) => (
              <article key={product.id} className="group">
                <div className="relative overflow-hidden rounded-2xl bg-[#161819]">
                  <img src={product.coverUrl} alt={`Artwork for ${product.title}`} className="aspect-[3/3.8] w-full object-cover transition-transform duration-500 group-hover:scale-[1.035]" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/72 via-transparent to-transparent opacity-70" />
                  <span className="absolute left-4 top-4 rounded-full border border-white/18 bg-black/20 px-3 py-1.5 text-[9px] font-semibold tracking-[0.12em] text-white/85 backdrop-blur-sm">{product.format}</span>
                  <button
                    type="button"
                    onClick={() => addToCart(product.id)}
                    className="absolute bottom-4 right-4 grid h-11 w-11 place-items-center rounded-full bg-[#d5ff45] text-black opacity-100 transition-transform duration-200 hover:scale-105 active:scale-95 sm:translate-y-3 sm:opacity-0 sm:group-hover:translate-y-0 sm:group-hover:opacity-100"
                    aria-label={`Add ${product.title} to cart`}
                  >
                    <Plus size={19} strokeWidth={2.2} />
                  </button>
                </div>
                <div className="mt-5 flex items-start justify-between gap-5">
                  <div>
                    <div className="eyebrow mb-2">{String(index + 1).padStart(2, "0")} / {product.category}</div>
                    <h3 className="font-display text-3xl tracking-[-0.045em] text-white">{product.title}</h3>
                  </div>
                  <span className="pt-1 font-mono text-xs text-[#d5ff45]">{formatCurrency(product.priceCents)}</span>
                </div>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/55">{product.description}</p>
                <div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4 text-[10px] font-bold tracking-[0.12em] text-white/54">
                  <span>{product.chapters} CHAPTERS · {product.readingTime.toUpperCase()}</span>
                  <button type="button" onClick={() => addToCart(product.id)} className="inline-flex items-center gap-2 text-white transition-colors hover:text-[#d5ff45]">ADD <ArrowUpRight size={13} /></button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <section id="membership" className="relative mt-4 overflow-hidden border-y border-white/10 bg-[#121413] py-16 sm:py-24">
          <div className="absolute right-[9%] top-0 h-64 w-64 rounded-full bg-[#5a6ff5]/10 blur-[100px]" />
          <div className="container relative grid gap-12 lg:grid-cols-[0.8fr_1.2fr] lg:items-center">
            <div>
              <div className="eyebrow text-[#d5ff45]">YOUR PRIVATE LIBRARY</div>
              <h2 className="font-display mt-4 text-5xl leading-[0.96] tracking-[-0.06em] sm:text-6xl">Not a download.<br /><em className="text-white/45">A place to return to.</em></h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-3">
              {[
                ["01", "Choose an edition", "Browse focused digital guides, designed as easy-to-read web experiences."],
                ["02", "Secure checkout", "Sign in once, pay securely, and your purchase is verified against your account."],
                ["03", "Read anytime", "Your paid editions unlock in a personal library, chapter by chapter."],
              ].map(([number, title, copy]) => (
                <div key={number} className="rounded-2xl border border-white/10 bg-white/[0.025] p-5">
                  <div className="font-mono text-xs text-[#d5ff45]">{number}</div>
                  <h3 className="mt-8 text-sm font-bold tracking-tight text-white">{title}</h3>
                  <p className="mt-3 text-xs leading-5 text-white/52">{copy}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="container py-16 sm:py-24">
          <div className="flex flex-col justify-between gap-8 rounded-[2rem] border border-[#d5ff45]/22 bg-[#d5ff45] px-7 py-10 text-black sm:flex-row sm:items-end sm:px-10 sm:py-12">
            <div>
              <div className="font-mono text-[10px] font-bold tracking-[0.16em] text-black/58">A SMALLER, CLEARER SHELF</div>
              <p className="font-display mt-3 max-w-2xl text-4xl leading-[0.98] tracking-[-0.055em] sm:text-5xl">Ideas for making the next good thing.</p>
            </div>
            <a href="#editions" className="inline-flex shrink-0 items-center gap-3 self-start rounded-full bg-black px-5 py-3 text-[11px] font-bold tracking-[0.14em] text-white transition-transform duration-200 hover:-translate-y-0.5 active:scale-[0.97] sm:self-auto">VIEW THE SHELF <ArrowDownRight size={15} /></a>
          </div>
        </section>
      </main>

      <footer className="border-t border-white/10 py-7">
        <div className="container flex flex-col gap-3 text-[10px] font-semibold tracking-[0.13em] text-white/40 sm:flex-row sm:items-center sm:justify-between">
          <span>BRIGHTLINE © 2026</span><span>ORIGINAL DIGITAL EDITIONS</span><span>BUILT FOR READING</span>
        </div>
      </footer>

      {cartOpen && (
        <div className="fixed inset-0 z-50 flex justify-end" role="dialog" aria-modal="true" aria-label="Shopping cart">
          <button type="button" onClick={() => setCartOpen(false)} className="absolute inset-0 bg-black/70 backdrop-blur-sm" aria-label="Close cart" />
          <aside className="relative flex h-full w-full max-w-md flex-col border-l border-white/10 bg-[#101211] shadow-2xl animate-in slide-in-from-right duration-300">
            <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
              <div className="flex items-center gap-3"><ShoppingBag size={18} className="text-[#d5ff45]" /><h2 className="font-display text-2xl tracking-[-0.04em]">Your selection <span className="font-mono text-xs text-white/40">({itemCount})</span></h2></div>
              <button type="button" onClick={() => setCartOpen(false)} className="grid h-9 w-9 place-items-center rounded-full border border-white/10 text-white/70 transition-colors hover:text-white"><X size={17} /></button>
            </div>
            <div className="flex-1 overflow-y-auto px-6 py-5">
              {items.length === 0 ? (
                <div className="grid h-full place-items-center text-center"><div><Sparkles className="mx-auto mb-4 text-[#d5ff45]" size={24} /><h3 className="font-display text-3xl">Your shelf is open.</h3><p className="mx-auto mt-3 max-w-xs text-sm leading-6 text-white/52">Choose an edition that meets your work where it is.</p><button type="button" onClick={() => setCartOpen(false)} className="mt-6 text-[10px] font-bold tracking-[0.14em] text-[#d5ff45]">BROWSE EDITIONS</button></div></div>
              ) : (
                <div className="space-y-5">
                  {items.map(({ product, quantity }) => (
                    <div key={product.id} className="flex gap-4">
                      <img src={product.coverUrl} alt="" className="h-28 w-[74px] rounded-lg object-cover" />
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-3"><div><div className="eyebrow text-[8px]">{product.format}</div><h3 className="font-display mt-1 text-xl tracking-[-0.04em]">{product.title}</h3></div><button type="button" onClick={() => removeItem(product.id)} className="text-[10px] font-bold tracking-[0.1em] text-white/38 transition-colors hover:text-white">REMOVE</button></div>
                        <div className="mt-auto flex items-center justify-between"><div className="flex items-center rounded-full border border-white/12"><button type="button" onClick={() => setQuantity(product.id, quantity - 1)} className="grid h-7 w-7 place-items-center text-white/62 hover:text-white"><Minus size={12} /></button><span className="w-5 text-center font-mono text-[11px]">{quantity}</span><button type="button" onClick={() => setQuantity(product.id, quantity + 1)} className="grid h-7 w-7 place-items-center text-white/62 hover:text-white"><Plus size={12} /></button></div><span className="font-mono text-xs text-[#d5ff45]">{formatCurrency(product.priceCents * quantity)}</span></div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {items.length > 0 && (
              <div className="border-t border-white/10 px-6 py-5">
                <div className="mb-5 flex items-center justify-between text-sm text-white/64"><span>Subtotal</span><span className="font-mono text-base text-white">{formatCurrency(subtotal)}</span></div>
                <button type="button" disabled={checkout.isPending} onClick={beginCheckout} className="flex w-full items-center justify-center gap-3 rounded-full bg-[#d5ff45] px-5 py-3.5 text-[11px] font-extrabold tracking-[0.13em] text-black transition-transform hover:-translate-y-0.5 active:scale-[0.97] disabled:cursor-wait disabled:opacity-70">{checkout.isPending ? "OPENING CHECKOUT…" : "CONTINUE TO CHECKOUT"} <ArrowUpRight size={15} /></button>
                <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-[10px] leading-4 text-white/42"><Check size={12} className="text-[#d5ff45]" /> Secure payment · Instant library access</p>
              </div>
            )}
          </aside>
        </div>
      )}
    </div>
  );
}
