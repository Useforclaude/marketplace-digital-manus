import { useAuth } from "@/_core/hooks/useAuth";
import { productById } from "@/data/catalog";
import { trpc } from "@/lib/trpc";
import { ArrowLeft, ChevronDown, LockKeyhole, Menu, X } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";

export default function Reader() {
  const { productId } = useParams<{ productId: string }>();
  const [contentsOpen, setContentsOpen] = useState(false);
  const { isAuthenticated, loading } = useAuth({ redirectOnUnauthenticated: true });
  const reader = trpc.library.reader.useQuery({ productId }, { enabled: isAuthenticated && Boolean(productId), retry: false });
  const product = productById[productId];

  if (!product) {
    return <div className="grid min-h-screen place-items-center bg-[#0b0c0d] text-white"><Link href="/library" className="text-[#d5ff45]">Return to library</Link></div>;
  }

  if (loading || reader.isLoading) {
    return <div className="grid min-h-screen place-items-center bg-[#0b0c0d] text-sm text-white/48">Opening edition…</div>;
  }

  if (reader.error) {
    return <div className="grid min-h-screen place-items-center bg-[#0b0c0d] px-6 text-center text-white"><div><LockKeyhole className="mx-auto text-[#d5ff45]" size={28} /><h1 className="font-display mt-5 text-4xl">This edition is kept for its buyers.</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/54">Sign in with the account that purchased this title, or return to the shelf to choose an edition.</p><Link href="/library" className="mt-7 inline-flex rounded-full bg-[#d5ff45] px-5 py-3 text-[10px] font-bold tracking-[0.14em] text-black">RETURN TO LIBRARY</Link></div></div>;
  }

  const edition = reader.data?.edition;
  if (!edition) return null;

  return (
    <div className="min-h-screen bg-[#eeece5] text-[#151816]">
      <header className="sticky top-0 z-30 border-b border-black/10 bg-[#eeece5]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-5 sm:px-8"><Link href="/library" className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.13em] text-black/70"><ArrowLeft size={14} /> LIBRARY</Link><div className="hidden text-center sm:block"><div className="font-mono text-[9px] tracking-[0.16em] text-black/44">{product.category}</div><div className="font-display text-lg leading-none">{product.title}</div></div><button type="button" onClick={() => setContentsOpen(true)} className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.13em] text-black/70">CONTENTS <Menu size={15} /></button></div>
      </header>
      <main className="mx-auto max-w-3xl px-5 pb-24 pt-16 sm:px-8 sm:pt-24">
        <div className="mx-auto max-w-2xl"><div className="font-mono text-[10px] font-medium tracking-[0.16em] text-[#63751c]">BRIGHTLINE EDITION / {product.format.toUpperCase()}</div><h1 className="font-display mt-6 text-6xl leading-[0.9] tracking-[-0.06em] sm:text-8xl">{product.title}</h1><div className="mt-10 border-l-2 border-[#adca26] pl-6 font-display text-2xl leading-[1.3] tracking-[-0.025em] text-black/72 sm:text-3xl">{edition.intro}</div><div className="mt-16 space-y-18">{edition.chapters.map((chapter, index) => <section key={chapter.title} id={`chapter-${index + 1}`}><div className="font-mono text-[10px] font-medium tracking-[0.16em] text-[#63751c]">{chapter.kicker}</div><h2 className="font-display mt-3 text-4xl tracking-[-0.05em] sm:text-5xl">{chapter.title}</h2><div className="mt-7 space-y-5 text-[1.05rem] leading-8 text-black/70 sm:text-lg">{chapter.body.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}</div></section>)}</div><div className="mt-20 border-t border-black/12 pt-8 text-center"><p className="font-display text-3xl tracking-[-0.045em]">Keep this close.</p><Link href="/library" className="mt-5 inline-flex text-[10px] font-bold tracking-[0.14em] text-[#63751c]">RETURN TO YOUR LIBRARY</Link></div></div>
      </main>
      {contentsOpen && <div className="fixed inset-0 z-50 bg-black/40 p-4 backdrop-blur-sm"><div className="ml-auto flex h-full w-full max-w-sm flex-col rounded-2xl bg-[#151816] p-6 text-white shadow-2xl"><div className="flex items-center justify-between"><div className="font-mono text-[10px] tracking-[0.15em] text-[#d5ff45]">CONTENTS</div><button type="button" onClick={() => setContentsOpen(false)}><X size={18} /></button></div><div className="mt-8 space-y-1">{edition.chapters.map((chapter, index) => <a key={chapter.title} href={`#chapter-${index + 1}`} onClick={() => setContentsOpen(false)} className="flex items-center justify-between rounded-lg px-3 py-3 text-sm text-white/78 transition-colors hover:bg-white/7 hover:text-white"><span><span className="mr-3 font-mono text-[10px] text-[#d5ff45]">0{index + 1}</span>{chapter.title}</span><ChevronDown size={14} className="-rotate-90" /></a>)}</div></div></div>}
    </div>
  );
}
