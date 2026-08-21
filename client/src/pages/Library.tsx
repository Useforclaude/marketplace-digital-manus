import { useAuth } from "@/_core/hooks/useAuth";
import { StoreHeader } from "@/components/StoreHeader";
import { formatProductType } from "@/data/catalog";
import { trpc } from "@/lib/trpc";
import { ArrowUpRight, BookOpenCheck, Library as LibraryIcon, LockKeyhole } from "lucide-react";
import { Link } from "wouter";

export default function Library() {
  const { isAuthenticated, loading, user } = useAuth({ redirectOnUnauthenticated: true });
  const purchases = trpc.library.list.useQuery(undefined, { enabled: isAuthenticated });
  return (
    <div className="min-h-screen bg-[#0b0c0d] text-white">
      <StoreHeader onOpenCart={() => (window.location.href = "/#editions")} />
      <main className="container py-12 sm:py-18">
        <div className="border-b border-white/10 pb-8 sm:pb-10">
          <div className="eyebrow text-[#d5ff45]">คลังส่วนตัวของคุณ</div>
          <div className="mt-4 flex flex-col justify-between gap-6 sm:flex-row sm:items-end">
            <div><h1 className="font-display text-5xl tracking-[-0.06em] sm:text-6xl">กลับมาเรียนต่อได้เสมอ</h1><p className="mt-3 text-sm text-white/56">{user?.name ? `${user.name.split(" ")[0]} มี` : "คุณมี"} หนังสือและคอร์สที่ซื้อไว้ในที่เดียว</p></div>
            <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-[#d5ff45]">เลือกดูสินค้าเพิ่ม <ArrowUpRight size={14} /></Link>
          </div>
        </div>

        {loading || purchases.isLoading ? (
          <div className="grid min-h-72 place-items-center text-sm text-white/46">กำลังเปิดคลังของคุณ…</div>
        ) : purchases.data?.length ? (
          <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {purchases.data.map(({ product, purchasedAt }) => (
              <article key={product.slug} className="group overflow-hidden rounded-2xl border border-white/10 bg-white/[0.025]">
                <img src={product.coverUrl} alt="" className="aspect-[3/2.25] w-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-[1.04]" />
                <div className="p-5"><div className="eyebrow text-[9px] text-[#d5ff45]">เป็นเจ้าของแล้ว · {new Date(purchasedAt).toLocaleDateString("th-TH")}</div><h2 className="font-display mt-2 text-3xl tracking-[-0.045em]">{product.title}</h2><p className="mt-2 text-xs leading-5 text-white/54">{formatProductType(product.productType)} · {product.unitCount} {product.productType === "course" ? "บทเรียน" : "บท"} · {product.durationLabel}</p><Link href={`/read/${product.slug}`} className="mt-6 inline-flex items-center gap-2 rounded-full bg-[#d5ff45] px-4 py-2.5 text-[10px] font-extrabold tracking-[0.13em] text-black">เปิดเนื้อหา <BookOpenCheck size={14} /></Link></div>
              </article>
            ))}
          </div>
        ) : (
          <div className="grid min-h-90 place-items-center rounded-3xl border border-dashed border-white/13 bg-white/[0.018] p-8 text-center">
            <div><LibraryIcon className="mx-auto text-[#d5ff45]" size={30} /><h2 className="font-display mt-5 text-4xl tracking-[-0.05em]">ชั้นของคุณกำลังรออยู่</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/54">เมื่อระบบยืนยันการชำระเงินแล้ว หนังสือหรือคอร์สจะปรากฏที่นี่โดยอัตโนมัติ</p><Link href="/#editions" className="mt-6 inline-flex items-center gap-2 text-[10px] font-bold tracking-[0.14em] text-[#d5ff45]">เลือกดูสินค้า <ArrowUpRight size={14} /></Link></div>
          </div>
        )}

        <div className="mt-16 grid gap-4 border-t border-white/10 pt-7 text-xs text-white/42 sm:grid-cols-2"><div className="flex gap-3"><LockKeyhole className="mt-0.5 shrink-0 text-[#d5ff45]" size={15} /><p>เนื้อหาทุกชิ้นถูกผูกกับบัญชีที่ซื้อเท่านั้น และกลับมาเปิดได้จากทุกอุปกรณ์ที่ลงชื่อเข้าใช้</p></div><div className="flex gap-3"><BookOpenCheck className="mt-0.5 shrink-0 text-[#d5ff45]" size={15} /><p>หนังสือและคอร์สเปิดเรียนบนเว็บได้ทันที โดยไม่ต้องดาวน์โหลดไฟล์หรือใช้แอปเพิ่มเติม</p></div></div>
      </main>
    </div>
  );
}
