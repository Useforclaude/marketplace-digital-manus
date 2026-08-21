import { useAuth } from "@/_core/hooks/useAuth";
import { StoreHeader } from "@/components/StoreHeader";
import { formatCurrency, products } from "@/data/catalog";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, BookOpenCheck, Library as LibraryIcon, LockKeyhole } from "lucide-react";
import { Link } from "wouter";

export default function Library() {
  const { isAuthenticated, loading, user } = useAuth({ redirectOnUnauthenticated: true });
  const purchases = trpc.library.list.useQuery(undefined, { enabled: isAuthenticated });
  const ownedIds = new Set((purchases.data ?? []).map((purchase) => purchase.product.id));

  return (
    <div className="min-h-screen bg-[#0b0c0d] text-white">
      <StoreHeader onOpenCart={() => (window.location.href = "/#editions")} />
      <main className="container py-12 sm:py-18">
        <div className="border-b border-white/10 pb-8 sm:pb-10">
          <div className="eyebrow text-[#d5ff45]">YOUR PRIVATE LIBRARY</div>
          <div className="mt-4 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div><h1 className="font-display text-5xl tracking-[-0.06em] sm:text-6xl">Keep reading.</h1><p className="mt-3 text-sm text-white/56">{user?.name ? `${user.name.split(" ")[0]}'s` : "Your"} paid editions, held in one quiet place.</p></div>
            <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-[#d5ff45]">BROWSE MORE EDITIONS <ArrowUpRight size={14} /></Link>
          </div>
        </div>

        {loading || purchases.isLoading ? (
          <div className="grid min-h-72 place-items-center text-sm text-white/46">Opening your library…</div>
        ) : purchases.data?.length ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {purchases.data.map(({ product, purchasedAt }) => (
              <article key={product.id} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
                <img src={product.coverUrl} alt="" className="aspect-[3/2.25] w-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-[1.04]" />
                <div className="p-5"><div className="eyebrow text-[9px] text-[#d5ff45]">OWNED · {new Date(purchasedAt).toLocaleDateString()}</div><h2 className="font-display mt-2 text-3xl tracking-[-0.045em]">{product.title}</h2><p className="mt-2 text-xs leading-5 text-white/54">{product.chapters} chapters · {product.readingTime}</p><Link href={`/read/${product.id}`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d5ff45] px-4 py-2.5 text-[10px] font-extrabold tracking-[0.13em] text-black">OPEN EDITION <BookOpenCheck size={14} /></Link></div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-90 place-items-center rounded-3xl border border-dashed border-white/13 bg-white/[0.018] p-8 text-center">
            <div><LibraryIcon className="mx-auto text-[#d5ff45]" size={30} /><h2 className="font-display mt-5 text-4xl tracking-[-0.05em]">Your shelf is waiting.</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/54">When a payment is confirmed, the edition appears here automatically—ready to open in your browser.</p><Link href="/#editions" className="mt-6 inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-[#d5ff45]">EXPLORE EDITIONS <ArrowUpRight size={14} /></Link></div>
          </div>
        )}

        <div className="mt-16 grid gap-4 border-t border-white/10 pt-7 text-xs text-white/42 sm:grid-cols-2"><div className="flex gap-3"><LockKeyhole className="mt-0.5 shrink-0 text-[#d5ff45]" size={15} /><p>Every title is locked to the account that purchased it. You can return from any signed-in device.</p></div><div className="flex gap-3"><BookOpenCheck className="mt-0.5 shrink-0 text-[#d5ff45]" size={15} /><p>HTML editions load in the reader—no PDF downloads or extra reader application required.</p></div></div>
      </main>
    </div>
  );
}
