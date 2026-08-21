import { useAuth } from "@/_core/hooks/useAuth";
import { StoreHeader } from "@/components/StoreHeader";
import { formatProductType } from "@/data/catalog";
import { useScrollReveal } from "@/hooks/useScrollReveal";
import { trpc } from "@/lib/trpc";
import { getMemberDashboardStats, getMemberDashboardView } from "./memberDashboardUtils";
import { ArrowRight, ArrowUpRight, BookOpen, CalendarDays, CheckCircle2, Clock3, GraduationCap, LayoutDashboard, LibraryBig, ReceiptText, ShieldCheck, ShoppingBag, Sparkles } from "lucide-react";
import React from "react";
import { Link } from "wouter";

function formatThaiDate(value: Date) {
  return new Intl.DateTimeFormat("th-TH", { day: "numeric", month: "short", year: "numeric" }).format(new Date(value));
}

export default function MemberDashboard() {
  const { isAuthenticated, loading, user } = useAuth({ redirectOnUnauthenticated: true });
  const purchases = trpc.library.list.useQuery(undefined, { enabled: isAuthenticated });
  const library = purchases.data ?? [];
  const stats = getMemberDashboardStats(library);
  const dashboardView = getMemberDashboardView(library);
  useScrollReveal(library.length);

  return (
    <div className="min-h-screen bg-[#0a0d0c] text-white">
      <StoreHeader onOpenCart={() => (window.location.href = "/#editions")} />
      <main className="container py-10 sm:py-16">
        <section className="reveal relative overflow-hidden rounded-[2rem] border border-white/10 bg-[#101512] px-6 py-8 sm:px-10 sm:py-11">
          <div className="absolute -right-24 -top-28 h-80 w-80 rounded-full bg-[#d5ff45]/10 blur-[100px]" />
          <div className="relative grid gap-9 lg:grid-cols-[1.35fr_.65fr] lg:items-end">
            <div>
              <div className="flex items-center gap-3"><span className="grid h-9 w-9 place-items-center rounded-xl bg-[#d5ff45] text-black"><LayoutDashboard size={17} /></span><span className="eyebrow text-[#d5ff45]">DASHBOARD สมาชิก</span></div>
              <h1 className="font-display mt-7 max-w-3xl text-5xl leading-[.92] tracking-[-.06em] sm:text-6xl">{user?.name ? `${user.name.split(" ")[0]}, เรื่องสำคัญของคุณ` : "เรื่องสำคัญของคุณ"}<br /><em className="text-white/48">พร้อมให้กลับมาใช้แล้ว</em></h1>
              <p className="mt-5 max-w-xl text-sm leading-6 text-white/58 sm:text-base">รวมทุกสิ่งที่คุณเป็นเจ้าของไว้ที่เดียว เปิดอ่าน eBook หรือเรียนคอร์สต่อจากจังหวะที่เหมาะกับคุณ</p>
            </div>
            <div className="grid grid-cols-3 gap-2 rounded-2xl border border-white/10 bg-black/20 p-3 text-center">
              <div className="rounded-xl bg-white/[.045] px-2 py-4"><div className="font-display text-3xl text-[#d5ff45]">{stats.total}</div><div className="mt-1 text-[9px] font-bold tracking-[.1em] text-white/48">ทั้งหมด</div></div>
              <div className="rounded-xl bg-white/[.045] px-2 py-4"><div className="font-display text-3xl text-white">{stats.ebooks}</div><div className="mt-1 text-[9px] font-bold tracking-[.1em] text-white/48">EBOOK</div></div>
              <div className="rounded-xl bg-white/[.045] px-2 py-4"><div className="font-display text-3xl text-white">{stats.courses}</div><div className="mt-1 text-[9px] font-bold tracking-[.1em] text-white/48">คอร์ส</div></div>
            </div>
          </div>
        </section>

        {loading || purchases.isLoading ? (
          <div className="grid min-h-80 place-items-center text-sm text-white/46">กำลังเตรียมพื้นที่เรียนของคุณ…</div>
        ) : !dashboardView.isEmpty ? (
          <>
            <section className="mt-14">
              <div className="reveal flex flex-col justify-between gap-4 border-b border-white/10 pb-6 sm:flex-row sm:items-end"><div><div className="eyebrow text-[#d5ff45]">คลังของฉัน</div><h2 className="font-display mt-3 text-4xl tracking-[-.05em] sm:text-5xl">เลือกสิ่งที่อยากไปต่อ</h2></div><p className="max-w-sm text-sm leading-6 text-white/52">ทุกชิ้นเปิดจากบัญชีนี้เท่านั้น สิทธิ์ของคุณจะอยู่พร้อมใช้งานเสมอ</p></div>
              <div className="mt-8 grid gap-5 md:grid-cols-2 xl:grid-cols-3">
                {library.map(({ product, purchasedAt }, index) => {
                  const action = dashboardView.entries[index];
                  const ActionIcon = product.productType === "course" ? GraduationCap : BookOpen;
                  return <article key={product.slug} className="reveal group overflow-hidden rounded-[1.35rem] border border-white/10 bg-white/[.026]" style={{ transitionDelay: `${Math.min(index * 65, 195)}ms` }}>
                    <div className="relative overflow-hidden"><img src={product.coverUrl} alt={`หน้าปก ${product.title}`} className="aspect-[16/9.5] w-full object-cover opacity-85 transition-transform duration-500 group-hover:scale-[1.045]" /><div className="absolute inset-0 bg-gradient-to-t from-[#0a0d0c] via-transparent to-transparent" /><span className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full border border-[#d5ff45]/30 bg-[#0b120d]/85 px-2.5 py-1 text-[9px] font-bold tracking-[.08em] text-[#d5ff45]"><CheckCircle2 size={11} /> สิทธิ์พร้อมใช้</span></div>
                    <div className="p-5"><div className="eyebrow text-[9px] text-[#d5ff45]">{formatProductType(product.productType)} · ซื้อเมื่อ {formatThaiDate(purchasedAt)}</div><h3 className="font-display mt-2 text-3xl tracking-[-.045em]">{product.title}</h3><p className="mt-2 line-clamp-2 text-xs leading-5 text-white/52">{product.subtitle || product.description}</p><div className="mt-5 flex items-center justify-between border-t border-white/10 pt-4"><span className="inline-flex items-center gap-1.5 text-[10px] font-semibold text-white/48"><Clock3 size={12} /> {product.durationLabel}</span><Link href={action.href} className="lime-cta inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[10px] font-extrabold tracking-[.1em] text-black">{action.actionLabel} <ActionIcon size={13} /></Link></div></div>
                  </article>;
                })}
              </div>
            </section>

            <section className="mt-16">
              <div className="reveal flex items-end justify-between gap-4 border-b border-white/10 pb-6"><div><div className="eyebrow text-[#d5ff45]">ประวัติการสั่งซื้อ</div><h2 className="font-display mt-3 text-4xl tracking-[-.05em] sm:text-5xl">ทุกสิทธิ์ที่คุณมี</h2></div><ReceiptText className="mb-1 text-white/30" size={24} /></div>
              <div className="reveal mt-6 overflow-hidden rounded-2xl border border-white/10 bg-white/[.02]">
                <div className="hidden grid-cols-[1.4fr_.8fr_.8fr_auto] gap-4 border-b border-white/10 px-6 py-4 text-[9px] font-bold tracking-[.13em] text-white/42 md:grid"><span>รายการ</span><span>ประเภท</span><span>วันที่สั่งซื้อ</span><span>สถานะ</span></div>
                {library.map(({ product, purchasedAt }) => <div key={`history-${product.slug}`} className="grid gap-3 border-b border-white/8 px-5 py-5 last:border-b-0 md:grid-cols-[1.4fr_.8fr_.8fr_auto] md:items-center md:gap-4 md:px-6"><div className="flex items-center gap-3"><img src={product.coverUrl} alt="" className="h-11 w-9 rounded-md object-cover" /><div><div className="text-sm font-bold text-white">{product.title}</div><div className="mt-1 text-[10px] text-white/44">สิทธิ์ผูกกับบัญชีของคุณ</div></div></div><div className="text-xs text-white/62">{formatProductType(product.productType)}</div><div className="flex items-center gap-1.5 text-xs text-white/52"><CalendarDays size={13} /> {formatThaiDate(purchasedAt)}</div><div className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[#d5ff45]/10 px-2.5 py-1 text-[9px] font-bold tracking-[.08em] text-[#d5ff45]"><ShieldCheck size={11} /> พร้อมใช้</div></div>)}
              </div>
            </section>
          </>
        ) : (
          <section className="reveal mt-14 grid min-h-95 place-items-center rounded-[2rem] border border-dashed border-white/13 bg-white/[.018] p-8 text-center"><div><Sparkles className="mx-auto text-[#d5ff45]" size={30} /><h2 className="font-display mt-5 text-4xl tracking-[-.05em]">พื้นที่นี้พร้อมรอสิ่งแรกของคุณ</h2><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-white/54">เลือกหนึ่งเรื่องที่ตรงกับงานตอนนี้ เมื่อชำระเงินสำเร็จ เนื้อหาจะเข้ามาอยู่ใน Dashboard ทันที</p><Link href="/#editions" className="lime-cta mt-7 inline-flex items-center gap-2 rounded-full px-5 py-3 text-[10px] font-extrabold tracking-[.12em] text-black">เลือกดูสินค้า <ArrowRight size={14} /></Link></div></section>
        )}

        <section className="reveal mt-14 grid gap-4 border-t border-white/10 pt-7 text-xs text-white/42 sm:grid-cols-2"><div className="flex gap-3"><ShieldCheck className="mt-0.5 shrink-0 text-[#d5ff45]" size={15} /><p>สิทธิ์การอ่านและเรียนตรวจจากฝั่ง server ทุกครั้ง การแก้หน้าจอใน browser ไม่สามารถเพิ่มสิทธิ์ให้บัญชีได้</p></div><div className="flex gap-3"><ShoppingBag className="mt-0.5 shrink-0 text-[#d5ff45]" size={15} /><p>กำลังมองหาเรื่องใหม่อยู่หรือเปล่า? เลือกเพิ่มได้ทุกเมื่อ แล้วทุกอย่างจะอยู่ในที่เดียวกัน</p><Link href="/#editions" className="ml-auto inline-flex shrink-0 items-center gap-1 font-bold text-[#d5ff45]">ดูสินค้า <ArrowUpRight size={13} /></Link></div></section>
      </main>
    </div>
  );
}
