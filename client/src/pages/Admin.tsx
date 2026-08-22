import { useAuth } from "@/_core/hooks/useAuth";
import DashboardLayout from "@/components/DashboardLayout";
import { formatCurrency } from "@/data/catalog";
import { trpc } from "@/lib/trpc";
import { BellRing, Boxes, CheckCircle2, EyeOff, Loader2, MessageSquareQuote, PackagePlus, Save, Send, ShieldCheck, Upload, X } from "lucide-react";
import React, { ChangeEvent, useMemo, useState } from "react";
import { toast } from "sonner";

type ProductKind = "ebook" | "course";
type ProductStatus = "draft" | "published" | "archived";
type TestimonialStatus = "pending" | "approved" | "hidden" | "rejected";
type AdminTab = "products" | "bundles" | "orders" | "testimonials" | "notifications";
type BroadcastForm = { title: string; body: string; href: string };

type BundleForm = {
  slug: string;
  status: ProductStatus;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  coverUrl: string;
  priceBaht: string;
  productIds: string[];
};

type ProductForm = {
  slug: string;
  productType: ProductKind;
  status: ProductStatus;
  title: string;
  subtitle: string;
  description: string;
  category: string;
  coverUrl: string;
  coverKey: string;
  accent: "lime" | "violet" | "rose" | "cyan";
  priceBaht: string;
  unitCount: string;
  durationLabel: string;
  content: string;
};

const ebookTemplate = JSON.stringify({ kind: "ebook", intro: "เกริ่นนำเนื้อหาของหนังสือ", chapters: [{ kicker: "บทที่ 01", title: "ชื่อบทแรก", body: ["ย่อหน้าแรกของเนื้อหา", "ย่อหน้าที่สองของเนื้อหา"] }] }, null, 2);
const courseTemplate = JSON.stringify({ kind: "course", intro: "เกริ่นนำคอร์สของคุณ", modules: [{ title: "บทเรียนที่ 1", duration: "30 นาที", summary: "สิ่งที่ผู้เรียนจะได้จากบทเรียนนี้" }] }, null, 2);

const emptyForm = (productType: ProductKind = "ebook"): ProductForm => ({
  slug: "", productType, status: "draft", title: "", subtitle: "", description: "", category: "", coverUrl: "", coverKey: "", accent: "lime", priceBaht: "", unitCount: "1", durationLabel: "", content: productType === "ebook" ? ebookTemplate : courseTemplate,
});

const emptyBundleForm = (): BundleForm => ({
  slug: "", status: "draft", title: "", subtitle: "", description: "", category: "", coverUrl: "", priceBaht: "", productIds: [],
});

function getInitialAdminTab(): AdminTab {
  if (typeof window === "undefined") return "products";
  const candidate = new URLSearchParams(window.location.search).get("tab");
  return candidate === "bundles" || candidate === "orders" || candidate === "testimonials" || candidate === "notifications" ? candidate : "products";
}

function recordToForm(product: { slug: string; productType: ProductKind; status: ProductStatus; title: string; subtitle: string | null; description: string; category: string; coverUrl: string; coverKey: string | null; accent: ProductForm["accent"]; priceSatang: number; unitCount: number; durationLabel: string; content: string }): ProductForm {
  return {
    slug: product.slug,
    productType: product.productType,
    status: product.status,
    title: product.title,
    subtitle: product.subtitle ?? "",
    description: product.description,
    category: product.category,
    coverUrl: product.coverUrl,
    coverKey: product.coverKey ?? "",
    accent: product.accent,
    priceBaht: String(product.priceSatang / 100),
    unitCount: String(product.unitCount),
    durationLabel: product.durationLabel,
    content: product.content,
  };
}

export function bundleRecordToForm(bundle: { slug: string; status: ProductStatus; title: string; subtitle: string | null; description: string; category: string; coverUrl: string; priceSatang: number; includedProductIds: string[] }): BundleForm {
  return {
    slug: bundle.slug,
    status: bundle.status,
    title: bundle.title,
    subtitle: bundle.subtitle ?? "",
    description: bundle.description,
    category: bundle.category,
    coverUrl: bundle.coverUrl,
    priceBaht: String(bundle.priceSatang / 100),
    productIds: bundle.includedProductIds,
  };
}

export function toggleBundleProductIds(productIds: string[], productId: string) {
  return productIds.includes(productId) ? productIds.filter((id) => id !== productId) : [...productIds, productId];
}

export function normalizeBroadcastPayload({ title, body, href }: BroadcastForm) {
  return { title: title.trim(), body: body.trim(), href: href.trim() || "/" };
}

function TestimonialStatusBadge({ status }: { status: TestimonialStatus }) {
  const details = status === "approved"
    ? { label: "อนุมัติแล้ว", className: "bg-[#d5ff45]/14 text-[#d5ff45]", icon: <CheckCircle2 size={11} /> }
    : status === "hidden"
      ? { label: "ซ่อนอยู่", className: "bg-white/10 text-white/56", icon: <EyeOff size={11} /> }
      : status === "rejected"
        ? { label: "ปฏิเสธ", className: "bg-rose-300/12 text-rose-200", icon: <X size={11} /> }
        : { label: "รอตรวจสอบ", className: "bg-amber-300/12 text-amber-200", icon: <Send size={11} /> };
  return <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] font-bold ${details.className}`}>{details.icon}{details.label}</span>;
}

export default function Admin() {
  const { user } = useAuth({ redirectOnUnauthenticated: true });
  const utils = trpc.useUtils();
  const products = trpc.admin.listProducts.useQuery(undefined, { enabled: user?.role === "admin" });
  const bundles = trpc.admin.listBundles.useQuery(undefined, { enabled: user?.role === "admin" });
  const orders = trpc.admin.listOrders.useQuery(undefined, { enabled: user?.role === "admin" });
  const testimonials = trpc.admin.listTestimonials.useQuery(undefined, { enabled: user?.role === "admin" });
  const [activeTab, setActiveTab] = useState<AdminTab>(getInitialAdminTab);
  const [editingSlug, setEditingSlug] = useState<string | null>(null);
  const [form, setForm] = useState<ProductForm>(() => emptyForm());
  const [editingBundleSlug, setEditingBundleSlug] = useState<string | null>(null);
  const [bundleForm, setBundleForm] = useState<BundleForm>(() => emptyBundleForm());
  const [broadcastForm, setBroadcastForm] = useState<BroadcastForm>({ title: "", body: "", href: "/" });

  const productMap = useMemo(() => new Map((products.data ?? []).map((product) => [product.slug, product])), [products.data]);
  const bundleMap = useMemo(() => new Map((bundles.data ?? []).map((bundle) => [bundle.slug, bundle])), [bundles.data]);
  const saveProduct = trpc.admin.createProduct.useMutation({
    onSuccess: async () => { await utils.admin.listProducts.invalidate(); setEditingSlug(null); setForm(emptyForm()); toast.success("บันทึกสินค้าแล้ว"); },
    onError: (error) => toast.error("บันทึกสินค้าไม่สำเร็จ", { description: error.message }),
  });
  const updateProduct = trpc.admin.updateProduct.useMutation({
    onSuccess: async () => { await utils.admin.listProducts.invalidate(); toast.success("อัปเดตสินค้าแล้ว"); },
    onError: (error) => toast.error("อัปเดตสินค้าไม่สำเร็จ", { description: error.message }),
  });
  const uploadCover = trpc.admin.uploadCover.useMutation({
    onSuccess: ({ url, key }) => { setForm((current) => ({ ...current, coverUrl: url, coverKey: key })); toast.success("อัปโหลดรูปปกแล้ว"); },
    onError: (error) => toast.error("อัปโหลดรูปปกไม่สำเร็จ", { description: error.message }),
  });
  const uploadBundleCover = trpc.admin.uploadCover.useMutation({
    onSuccess: ({ url }) => { setBundleForm((current) => ({ ...current, coverUrl: url })); toast.success("อัปโหลดรูปปก Bundle แล้ว"); },
    onError: (error) => toast.error("อัปโหลดรูปปกไม่สำเร็จ", { description: error.message }),
  });
  const saveBundle = trpc.admin.createBundle.useMutation({
    onSuccess: async () => { await utils.admin.listBundles.invalidate(); await utils.catalog.list.invalidate(); setEditingBundleSlug(null); setBundleForm(emptyBundleForm()); toast.success("บันทึก Bundle แล้ว"); },
    onError: (error) => toast.error("บันทึก Bundle ไม่สำเร็จ", { description: error.message }),
  });
  const updateBundle = trpc.admin.updateBundle.useMutation({
    onSuccess: async () => { await utils.admin.listBundles.invalidate(); await utils.catalog.list.invalidate(); toast.success("อัปเดต Bundle แล้ว"); },
    onError: (error) => toast.error("อัปเดต Bundle ไม่สำเร็จ", { description: error.message }),
  });
  const broadcastNotification = trpc.admin.broadcastNotification.useMutation({
    onSuccess: () => { setBroadcastForm({ title: "", body: "", href: "/" }); toast.success("ส่งประกาศไปยังผู้ใช้ที่เลือกเปิดรับแล้ว"); },
    onError: (error) => toast.error("ส่งประกาศไม่สำเร็จ", { description: error.message }),
  });
  const updateTestimonialStatus = trpc.admin.updateTestimonialStatus.useMutation({
    onSuccess: async (_, variables) => {
      await utils.admin.listTestimonials.invalidate();
      const copy = variables.status === "approved" ? "อนุมัติให้แสดงบนหน้าแรกแล้ว" : variables.status === "hidden" ? "ซ่อนเสียงสะท้อนแล้ว" : variables.status === "rejected" ? "ปฏิเสธการเผยแพร่แล้ว" : "ย้ายกลับเป็นรอตรวจสอบแล้ว";
      toast.success(copy);
    },
    onError: (error) => toast.error("อัปเดตสถานะไม่สำเร็จ", { description: error.message }),
  });

  const patch = (value: Partial<ProductForm>) => setForm((current) => ({ ...current, ...value }));
  const patchBundle = (value: Partial<BundleForm>) => setBundleForm((current) => ({ ...current, ...value }));
  const handleCoverFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/image\/(png|jpeg|webp)/.test(file.type) || file.size > 3 * 1024 * 1024) {
      toast.error("ใช้ได้เฉพาะ PNG, JPG หรือ WebP ขนาดไม่เกิน 3 MB");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => uploadCover.mutate({ dataUrl: String(reader.result), filename: file.name });
    reader.readAsDataURL(file);
  };
  const handleBundleCoverFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!/image\/(png|jpeg|webp)/.test(file.type) || file.size > 3 * 1024 * 1024) {
      toast.error("ใช้ได้เฉพาะ PNG, JPG หรือ WebP ขนาดไม่เกิน 3 MB");
      event.target.value = "";
      return;
    }
    const reader = new FileReader();
    reader.onload = () => uploadBundleCover.mutate({ dataUrl: String(reader.result), filename: file.name });
    reader.readAsDataURL(file);
  };
  const submit = () => {
    const payload = {
      slug: form.slug.trim(), productType: form.productType, status: form.status, title: form.title.trim(), subtitle: form.subtitle.trim() || null,
      description: form.description.trim(), category: form.category.trim(), coverUrl: form.coverUrl.trim(), coverKey: form.coverKey.trim() || null,
      accent: form.accent, priceSatang: Math.round(Number(form.priceBaht) * 100), currency: "thb" as const, unitCount: Number(form.unitCount), durationLabel: form.durationLabel.trim(), content: form.content.trim(),
    };
    if (editingSlug) updateProduct.mutate({ slug: editingSlug, product: payload });
    else saveProduct.mutate(payload);
  };
  const openEdit = (slug: string) => {
    const product = productMap.get(slug);
    if (!product) return;
    setEditingSlug(slug);
    setForm(recordToForm(product));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const submitBundle = () => {
    const payload = {
      slug: bundleForm.slug.trim(), status: bundleForm.status, title: bundleForm.title.trim(), subtitle: bundleForm.subtitle.trim() || null,
      description: bundleForm.description.trim(), category: bundleForm.category.trim(), coverUrl: bundleForm.coverUrl.trim(),
      priceSatang: Math.round(Number(bundleForm.priceBaht) * 100), currency: "thb" as const, productIds: bundleForm.productIds,
    };
    if (editingBundleSlug) updateBundle.mutate({ slug: editingBundleSlug, bundle: payload });
    else saveBundle.mutate(payload);
  };
  const openBundleEdit = (slug: string) => {
    const bundle = bundleMap.get(slug);
    if (!bundle) return;
    setEditingBundleSlug(slug);
    setBundleForm(bundleRecordToForm(bundle));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };
  const toggleBundleProduct = (productId: string) => {
    setBundleForm((current) => ({ ...current, productIds: toggleBundleProductIds(current.productIds, productId) }));
  };
  const submitBroadcast = () => broadcastNotification.mutate(normalizeBroadcastPayload(broadcastForm));
  const isSaving = saveProduct.isPending || updateProduct.isPending;
  const isSavingBundle = saveBundle.isPending || updateBundle.isPending;
  const tabClass = (tab: typeof activeTab) => `rounded-full px-4 py-2.5 text-[10px] font-bold tracking-[0.1em] ${activeTab === tab ? "gradient-cta text-black" : "border border-white/13 text-white/70"}`;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-[#0a0b0d] text-white">
        <div className="mx-auto max-w-7xl px-4 py-7 sm:px-7">
          <header className="flex flex-col justify-between gap-5 border-b border-white/10 pb-7 lg:flex-row lg:items-end">
            <div>
              <div className="eyebrow text-[#d5ff45]">พื้นที่ผู้ดูแล</div>
              <h1 className="font-display mt-3 text-4xl tracking-[-0.06em] sm:text-5xl">จัดการร้านของคุณ</h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-white/56">ตั้งราคาบาทไทย อัปโหลดหน้าปก จัดการ eBook และคอร์ส ตรวจสอบสิทธิ์ และกลั่นกรองเสียงจากผู้เรียนจริงก่อนเผยแพร่</p>
            </div>
            <nav className="flex flex-wrap gap-2" aria-label="เมนูจัดการร้าน">
              <button type="button" onClick={() => setActiveTab("products")} className={tabClass("products")}>สินค้า</button>
              <button type="button" onClick={() => setActiveTab("bundles")} className={`${tabClass("bundles")} inline-flex items-center gap-2`}><Boxes size={13} /> Bundle</button>
              <button type="button" onClick={() => setActiveTab("orders")} className={tabClass("orders")}>คำสั่งซื้อ</button>
              <button type="button" onClick={() => setActiveTab("testimonials")} className={`${tabClass("testimonials")} inline-flex items-center gap-2`}><MessageSquareQuote size={13} /> เสียงผู้เรียน</button>
              <button type="button" onClick={() => setActiveTab("notifications")} className={`${tabClass("notifications")} inline-flex items-center gap-2`}><BellRing size={13} /> ประกาศ</button>
            </nav>
          </header>

          {activeTab === "products" && (
            <div className="grid gap-8 py-8 xl:grid-cols-[minmax(0,1fr)_420px]">
              <section className="order-2 xl:order-1">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div><h2 className="font-display text-3xl tracking-[-0.045em]">สินค้าในร้าน</h2><p className="mt-1 text-xs text-white/48">ราคาและสถานะที่แสดงต่อผู้ซื้อเป็นข้อมูลจากฐานข้อมูล</p></div>
                  <button type="button" onClick={() => { setEditingSlug(null); setForm(emptyForm()); }} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/16 px-4 py-2 text-[10px] font-bold tracking-[0.1em] transition hover:border-white/40"><PackagePlus size={14} /> สร้างสินค้าใหม่</button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <div className="grid grid-cols-[1.4fr_.6fr_.55fr_.7fr] gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-3 text-[9px] font-bold tracking-[0.13em] text-white/42"><span>สินค้า</span><span>ประเภท</span><span>สถานะ</span><span className="text-right">จัดการ</span></div>
                  {products.isLoading ? <div className="grid h-48 place-items-center text-sm text-white/42"><Loader2 className="animate-spin" size={18} /></div> : products.data?.map((product) => (
                    <div key={product.slug} className="grid grid-cols-[1.4fr_.6fr_.55fr_.7fr] items-center gap-3 border-b border-white/7 px-5 py-4 last:border-0">
                      <div className="flex min-w-0 items-center gap-3"><img src={product.coverUrl} alt="" className="h-11 w-9 rounded-md object-cover" /><div className="min-w-0"><div className="truncate text-sm font-semibold">{product.title}</div><div className="mt-1 font-mono text-[9px] text-white/42">{formatCurrency(product.priceSatang)}</div></div></div>
                      <span className="text-xs text-white/62">{product.productType === "ebook" ? "eBook" : "คอร์ส"}</span>
                      <span className={`w-fit rounded-full px-2 py-1 text-[9px] font-bold ${product.status === "published" ? "bg-lime-300/14 text-lime-200" : product.status === "draft" ? "bg-amber-300/14 text-amber-200" : "bg-white/10 text-white/52"}`}>{product.status === "published" ? "เผยแพร่" : product.status === "draft" ? "ฉบับร่าง" : "เก็บถาวร"}</span>
                      <button type="button" onClick={() => openEdit(product.slug)} className="justify-self-end rounded-lg border border-white/12 px-3 py-2 text-[9px] font-bold tracking-[0.08em] text-white/75 transition hover:border-white/35">แก้ไข</button>
                    </div>
                  ))}
                </div>
              </section>

              <aside className="order-1 rounded-2xl border border-white/10 bg-white/[0.025] p-5 xl:order-2">
                <div className="flex items-start justify-between gap-3"><div><div className="eyebrow text-[#d5ff45]">{editingSlug ? "แก้ไขสินค้า" : "สร้างสินค้า"}</div><h2 className="font-display mt-2 text-3xl tracking-[-0.045em]">{editingSlug ? form.title || "สินค้า" : "สินค้าใหม่"}</h2></div>{editingSlug && <button type="button" onClick={() => { setEditingSlug(null); setForm(emptyForm()); }} className="grid h-8 w-8 place-items-center rounded-full border border-white/12 text-white/60"><X size={15} /></button>}</div>
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3"><label className="admin-field">ประเภท<select value={form.productType} onChange={(event) => patch({ productType: event.target.value as ProductKind, content: event.target.value === "ebook" ? ebookTemplate : courseTemplate })}><option value="ebook">eBook HTML</option><option value="course">คอร์ส</option></select></label><label className="admin-field">สถานะ<select value={form.status} onChange={(event) => patch({ status: event.target.value as ProductStatus })}><option value="draft">ฉบับร่าง</option><option value="published">เผยแพร่</option><option value="archived">เก็บถาวร</option></select></label></div>
                  <label className="admin-field">Slug (ห้ามเปลี่ยนหลังมีผู้ซื้อ)<input value={form.slug} disabled={Boolean(editingSlug)} onChange={(event) => patch({ slug: event.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="ชื่อสินค้าภาษาอังกฤษ" /></label>
                  <label className="admin-field">ชื่อสินค้า<input value={form.title} onChange={(event) => patch({ title: event.target.value })} placeholder="เช่น ระบบงานที่เบาขึ้น" /></label>
                  <label className="admin-field">คำโปรย<input value={form.subtitle} onChange={(event) => patch({ subtitle: event.target.value })} placeholder="คำโปรยสั้น ๆ" /></label>
                  <label className="admin-field">รายละเอียด<textarea rows={3} value={form.description} onChange={(event) => patch({ description: event.target.value })} placeholder="อธิบายประโยชน์ของสินค้า" /></label>
                  <div className="grid grid-cols-2 gap-3"><label className="admin-field">หมวดหมู่<input value={form.category} onChange={(event) => patch({ category: event.target.value })} /></label><label className="admin-field">จำนวนบท/บทเรียน<input type="number" min="1" value={form.unitCount} onChange={(event) => patch({ unitCount: event.target.value })} /></label></div>
                  <div className="grid grid-cols-2 gap-3"><label className="admin-field">ราคา (บาท)<input type="number" min="5" value={form.priceBaht} onChange={(event) => patch({ priceBaht: event.target.value })} /></label><label className="admin-field">ระยะเวลา<input value={form.durationLabel} onChange={(event) => patch({ durationLabel: event.target.value })} placeholder="เช่น 4 ชั่วโมง" /></label></div>
                  <label className="admin-field">โทนสี<select value={form.accent} onChange={(event) => patch({ accent: event.target.value as ProductForm["accent"] })}><option value="lime">Lime</option><option value="violet">Violet</option><option value="rose">Rose</option><option value="cyan">Cyan</option></select></label>
                  <div className="rounded-xl border border-dashed border-white/16 p-4"><div className="flex items-center justify-between gap-3"><div><div className="text-xs font-bold">รูปหน้าปก</div><p className="mt-1 text-[10px] leading-4 text-white/45">PNG, JPG หรือ WebP ขนาดไม่เกิน 3 MB</p></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/14 px-3 py-2 text-[9px] font-bold tracking-[0.08em] transition hover:border-white/35"><Upload size={13} /> {uploadCover.isPending ? "กำลังอัปโหลด" : "อัปโหลด"}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleCoverFile} /></label></div>{form.coverUrl && <div className="mt-3 flex gap-3"><img src={form.coverUrl} alt="ตัวอย่างรูปปก" className="h-16 w-12 rounded-md object-cover" /><input className="min-w-0 flex-1 rounded-lg border border-white/12 bg-black/20 px-3 text-[10px] text-white/62" value={form.coverUrl} onChange={(event) => patch({ coverUrl: event.target.value })} /></div>}</div>
                  <label className="admin-field">เนื้อหาแบบ JSON<textarea className="font-mono text-[10px] leading-5" rows={10} value={form.content} onChange={(event) => patch({ content: event.target.value })} /></label>
                  <button type="button" disabled={isSaving || uploadCover.isPending} onClick={submit} className="gradient-cta flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[10px] font-extrabold tracking-[0.1em] text-black disabled:opacity-60"><Save size={14} /> {isSaving ? "กำลังบันทึก…" : editingSlug ? "บันทึกการแก้ไข" : "สร้างสินค้า"}</button>
                </div>
              </aside>
            </div>
          )}

          {activeTab === "bundles" && (
            <div className="grid gap-8 py-8 xl:grid-cols-[minmax(0,1fr)_420px]">
              <section className="order-2 xl:order-1">
                <div className="mb-4 flex items-center justify-between gap-4">
                  <div><div className="eyebrow text-[#d5ff45]">Package commerce</div><h2 className="font-display mt-2 text-3xl tracking-[-0.045em]">Bundle ในร้าน</h2><p className="mt-1 text-xs text-white/48">ผู้ซื้อจ่ายครั้งเดียว แต่สิทธิ์จะปลดล็อกเฉพาะสินค้าทุกชิ้นในชุดหลัง Stripe ยืนยันแล้ว</p></div>
                  <button type="button" onClick={() => { setEditingBundleSlug(null); setBundleForm(emptyBundleForm()); }} className="inline-flex shrink-0 items-center gap-2 rounded-full border border-white/16 px-4 py-2 text-[10px] font-bold tracking-[0.1em] transition hover:border-white/40"><PackagePlus size={14} /> สร้าง Bundle</button>
                </div>
                <div className="overflow-hidden rounded-2xl border border-white/10">
                  <div className="grid grid-cols-[1.4fr_.6fr_.55fr_.7fr] gap-3 border-b border-white/10 bg-white/[0.03] px-5 py-3 text-[9px] font-bold tracking-[0.13em] text-white/42"><span>ชุดสินค้า</span><span>จำนวน</span><span>สถานะ</span><span className="text-right">จัดการ</span></div>
                  {bundles.isLoading ? <div className="grid h-48 place-items-center text-sm text-white/42"><Loader2 className="animate-spin" size={18} /></div> : bundles.data?.length ? bundles.data.map((bundle) => <div key={bundle.slug} className="grid grid-cols-[1.4fr_.6fr_.55fr_.7fr] items-center gap-3 border-b border-white/7 px-5 py-4 last:border-0"><div className="flex min-w-0 items-center gap-3"><img src={bundle.coverUrl} alt="" className="h-11 w-9 rounded-md object-cover" /><div className="min-w-0"><div className="truncate text-sm font-semibold">{bundle.title}</div><div className="mt-1 font-mono text-[9px] text-white/42">{formatCurrency(bundle.priceSatang)}</div></div></div><span className="text-xs text-white/62">{bundle.includedProductIds.length} สินค้า</span><span className={`w-fit rounded-full px-2 py-1 text-[9px] font-bold ${bundle.status === "published" ? "bg-lime-300/14 text-lime-200" : bundle.status === "draft" ? "bg-amber-300/14 text-amber-200" : "bg-white/10 text-white/52"}`}>{bundle.status === "published" ? "เผยแพร่" : bundle.status === "draft" ? "ฉบับร่าง" : "เก็บถาวร"}</span><button type="button" onClick={() => openBundleEdit(bundle.slug)} className="justify-self-end rounded-lg border border-white/12 px-3 py-2 text-[9px] font-bold tracking-[0.08em] text-white/75 transition hover:border-white/35">แก้ไข</button></div>) : <div className="grid min-h-48 place-items-center p-7 text-center text-sm text-white/48">ยังไม่มี Bundle — เริ่มจัดชุดสินค้าที่ช่วยให้ผู้เรียนเลือกเส้นทางได้ง่ายขึ้น</div>}
                </div>
              </section>
              <aside className="order-1 rounded-2xl border border-white/10 bg-white/[0.025] p-5 xl:order-2">
                <div className="flex items-start justify-between gap-3"><div><div className="eyebrow text-[#d5ff45]">{editingBundleSlug ? "แก้ไข Bundle" : "สร้าง Bundle"}</div><h2 className="font-display mt-2 text-3xl tracking-[-0.045em]">{editingBundleSlug ? bundleForm.title || "Bundle" : "ชุดใหม่"}</h2></div>{editingBundleSlug && <button type="button" onClick={() => { setEditingBundleSlug(null); setBundleForm(emptyBundleForm()); }} className="grid h-8 w-8 place-items-center rounded-full border border-white/12 text-white/60"><X size={15} /></button>}</div>
                <div className="mt-6 space-y-4">
                  <div className="grid grid-cols-2 gap-3"><label className="admin-field">สถานะ<select value={bundleForm.status} onChange={(event) => patchBundle({ status: event.target.value as ProductStatus })}><option value="draft">ฉบับร่าง</option><option value="published">เผยแพร่</option><option value="archived">เก็บถาวร</option></select></label><label className="admin-field">ราคา Bundle (บาท)<input type="number" min="5" value={bundleForm.priceBaht} onChange={(event) => patchBundle({ priceBaht: event.target.value })} /></label></div>
                  <label className="admin-field">Slug (ห้ามเปลี่ยนหลังบันทึก)<input value={bundleForm.slug} disabled={Boolean(editingBundleSlug)} onChange={(event) => patchBundle({ slug: event.target.value.toLowerCase().replace(/\s+/g, "-") })} placeholder="focus-foundation" /></label>
                  <label className="admin-field">ชื่อ Bundle<input value={bundleForm.title} onChange={(event) => patchBundle({ title: event.target.value })} placeholder="เช่น ชุดตั้งหลักโฟกัส" /></label>
                  <label className="admin-field">คำโปรย<input value={bundleForm.subtitle} onChange={(event) => patchBundle({ subtitle: event.target.value })} placeholder="สิ่งที่ผู้เรียนจะได้ในชุดนี้" /></label>
                  <label className="admin-field">รายละเอียด<textarea rows={3} value={bundleForm.description} onChange={(event) => patchBundle({ description: event.target.value })} placeholder="อธิบายเส้นทางและความคุ้มค่าของชุด" /></label>
                  <label className="admin-field">หมวดหมู่<input value={bundleForm.category} onChange={(event) => patchBundle({ category: event.target.value })} placeholder="เช่น การทำงานเชิงกลยุทธ์" /></label>
                  <div className="rounded-xl border border-dashed border-white/16 p-4"><div className="flex items-center justify-between gap-3"><div><div className="text-xs font-bold">รูปปก Bundle</div><p className="mt-1 text-[10px] leading-4 text-white/45">PNG, JPG หรือ WebP ขนาดไม่เกิน 3 MB</p></div><label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/14 px-3 py-2 text-[9px] font-bold tracking-[0.08em] transition hover:border-white/35"><Upload size={13} /> {uploadBundleCover.isPending ? "กำลังอัปโหลด" : "อัปโหลด"}<input type="file" accept="image/png,image/jpeg,image/webp" className="hidden" onChange={handleBundleCoverFile} /></label></div>{bundleForm.coverUrl && <div className="mt-3 flex gap-3"><img src={bundleForm.coverUrl} alt="ตัวอย่างรูปปก Bundle" className="h-16 w-12 rounded-md object-cover" /><input className="min-w-0 flex-1 rounded-lg border border-white/12 bg-black/20 px-3 text-[10px] text-white/62" value={bundleForm.coverUrl} onChange={(event) => patchBundle({ coverUrl: event.target.value })} /></div>}</div>
                  <fieldset className="rounded-xl border border-white/10 p-4"><legend className="px-1 text-xs font-bold">สินค้าใน Bundle <span className="ml-1 text-[#d5ff45]">{bundleForm.productIds.length} รายการ</span></legend><p className="mb-3 text-[10px] leading-4 text-white/45">เลือกอย่างน้อย 2 รายการ และหากเผยแพร่ Bundle สินค้าทุกชิ้นต้องเผยแพร่แล้ว</p><div className="max-h-52 space-y-2 overflow-y-auto pr-1">{products.data?.map((product) => <label key={product.slug} className="flex cursor-pointer items-center gap-3 rounded-lg border border-white/8 bg-black/10 px-3 py-2.5 transition hover:border-white/22"><input type="checkbox" checked={bundleForm.productIds.includes(product.slug)} onChange={() => toggleBundleProduct(product.slug)} className="accent-[#d5ff45]" /><img src={product.coverUrl} alt="" className="h-8 w-6 rounded object-cover" /><span className="min-w-0 flex-1 truncate text-xs text-white/78">{product.title}</span><span className="text-[9px] text-white/40">{product.status === "published" ? "เผยแพร่" : "ยังไม่เผยแพร่"}</span></label>)}</div></fieldset>
                  <button type="button" disabled={isSavingBundle || uploadBundleCover.isPending} onClick={submitBundle} className="gradient-cta flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[10px] font-extrabold tracking-[0.1em] text-black disabled:opacity-60"><Save size={14} /> {isSavingBundle ? "กำลังบันทึก…" : editingBundleSlug ? "บันทึก Bundle" : "สร้าง Bundle"}</button>
                </div>
              </aside>
            </div>
          )}

          {activeTab === "orders" && (
            <section className="py-8">
              <div className="mb-5"><div className="eyebrow text-[#d5ff45]">สิทธิ์ที่ได้รับการยืนยันแล้ว</div><h2 className="font-display mt-3 text-4xl tracking-[-0.05em]">คำสั่งซื้อ</h2><p className="mt-2 text-sm text-white/52">แสดงเฉพาะสินค้าที่ Stripe ยืนยันการชำระเงินและปลดล็อกสิทธิ์เรียบร้อยแล้ว</p></div>
              <div className="overflow-x-auto rounded-2xl border border-white/10"><table className="w-full min-w-[760px] text-left"><thead className="border-b border-white/10 bg-white/[0.03] text-[9px] font-bold tracking-[0.13em] text-white/42"><tr><th className="px-5 py-3">ผู้ซื้อ</th><th className="px-5 py-3">สินค้า</th><th className="px-5 py-3">วันที่</th><th className="px-5 py-3">สถานะ</th><th className="px-5 py-3">Stripe</th></tr></thead><tbody>{orders.isLoading ? <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-white/42">กำลังโหลดคำสั่งซื้อ…</td></tr> : orders.data?.length ? orders.data.map((order) => <tr key={order.id} className="border-b border-white/7 last:border-0"><td className="px-5 py-4"><div className="text-sm font-semibold">{order.buyerName ?? "ผู้ซื้อ"}</div><div className="mt-1 text-xs text-white/43">{order.buyerEmail ?? "ไม่ระบุอีเมล"}</div></td><td className="px-5 py-4 text-sm text-white/76">{productMap.get(order.productId)?.title ?? order.productId}</td><td className="px-5 py-4 text-xs text-white/54">{new Date(order.purchasedAt).toLocaleString("th-TH")}</td><td className="px-5 py-4"><span className="inline-flex items-center gap-1.5 rounded-full bg-lime-300/14 px-2.5 py-1 text-[9px] font-bold text-lime-200"><CheckCircle2 size={12} /> ปลดล็อกแล้ว</span></td><td className="px-5 py-4 font-mono text-[9px] text-white/40">{order.stripeCheckoutSessionId.slice(0, 18)}…</td></tr>) : <tr><td colSpan={5} className="px-5 py-12 text-center text-sm text-white/42">ยังไม่มีคำสั่งซื้อที่ยืนยันแล้ว</td></tr>}</tbody></table></div>
            </section>
          )}

          {activeTab === "testimonials" && (
            <section className="py-8">
              <div className="mb-6 grid gap-5 border-b border-white/10 pb-7 lg:grid-cols-[1fr_auto] lg:items-end"><div><div className="eyebrow text-[#d5ff45]">Social proof moderation</div><h2 className="font-display mt-3 text-4xl tracking-[-0.05em]">เสียงจากผู้เรียนจริง</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/52">แสดงเฉพาะข้อความที่ผู้ซื้อส่งเอง ยินยอมให้เผยแพร่ และคุณอนุมัติแล้วเท่านั้น การซ่อนหรือปฏิเสธจะเอาข้อความออกจากหน้าแรกทันที</p></div><div className="inline-flex items-center gap-2 rounded-full border border-white/12 bg-white/[.025] px-4 py-2 text-[10px] font-bold tracking-[.08em] text-white/58"><ShieldCheck size={14} className="text-[#d5ff45]" /> ไม่มีข้อมูลตัวอย่าง</div></div>
              <div className="space-y-3">
                {testimonials.isLoading ? <div className="grid h-52 place-items-center rounded-2xl border border-white/10 text-sm text-white/42"><Loader2 className="animate-spin" size={18} /></div> : testimonials.data?.length ? testimonials.data.map((testimonial) => (
                  <article key={testimonial.id} className="rounded-2xl border border-white/10 bg-white/[.025] p-5">
                    <div className="grid gap-5 lg:grid-cols-[.85fr_1.25fr_.7fr] lg:items-start">
                      <div><div className="text-sm font-bold text-white">{testimonial.displayName}</div><div className="mt-1 text-xs text-white/45">บัญชี: {testimonial.learnerName ?? "ไม่ระบุชื่อ"}</div><div className="mt-1 text-xs text-white/45">{testimonial.learnerEmail ?? "ไม่ระบุอีเมล"}</div><div className="mt-4 text-[10px] font-bold tracking-[.1em] text-[#d5ff45]">{testimonial.productTitle ?? testimonial.productId}</div></div>
                      <blockquote className="border-l border-[#d5ff45]/50 pl-4 text-sm leading-6 text-white/76">“{testimonial.feedback}”</blockquote>
                      <div className="flex flex-col items-start gap-3 lg:items-end"><TestimonialStatusBadge status={testimonial.status} /><span className="text-[10px] text-white/40">{testimonial.consentToPublish ? "ยินยอมให้เผยแพร่แล้ว" : "ยังไม่มี consent"}</span><div className="flex flex-wrap gap-2 lg:justify-end"><button type="button" disabled={updateTestimonialStatus.isPending || !testimonial.consentToPublish} onClick={() => updateTestimonialStatus.mutate({ id: testimonial.id, status: "approved" })} className="rounded-lg border border-[#d5ff45]/35 px-3 py-2 text-[9px] font-bold tracking-[.08em] text-[#d5ff45] transition hover:bg-[#d5ff45]/10 disabled:opacity-40">อนุมัติ</button><button type="button" disabled={updateTestimonialStatus.isPending} onClick={() => updateTestimonialStatus.mutate({ id: testimonial.id, status: "hidden" })} className="rounded-lg border border-white/14 px-3 py-2 text-[9px] font-bold tracking-[.08em] text-white/62 transition hover:border-white/35">ซ่อน</button><button type="button" disabled={updateTestimonialStatus.isPending} onClick={() => updateTestimonialStatus.mutate({ id: testimonial.id, status: "rejected" })} className="rounded-lg border border-rose-300/25 px-3 py-2 text-[9px] font-bold tracking-[.08em] text-rose-200 transition hover:border-rose-200/50">ปฏิเสธ</button><button type="button" disabled={updateTestimonialStatus.isPending} onClick={() => updateTestimonialStatus.mutate({ id: testimonial.id, status: "pending" })} className="rounded-lg border border-white/14 px-3 py-2 text-[9px] font-bold tracking-[.08em] text-white/62 transition hover:border-white/35">รอตรวจ</button></div></div>
                    </div>
                  </article>
                )) : <div className="grid min-h-52 place-items-center rounded-2xl border border-dashed border-white/14 bg-white/[.018] p-7 text-center"><div><MessageSquareQuote className="mx-auto text-[#d5ff45]" size={24} /><h3 className="font-display mt-4 text-3xl">ยังไม่มีเสียงจากผู้เรียน</h3><p className="mx-auto mt-2 max-w-md text-sm leading-6 text-white/48">เมื่อผู้ซื้อส่งประสบการณ์จริงพร้อม consent ข้อความจะมาปรากฏที่นี่เพื่อให้คุณอนุมัติ ซ่อน หรือปฏิเสธได้</p></div></div>}
              </div>
            </section>
          )}

          {activeTab === "notifications" && (
            <section className="mx-auto max-w-3xl py-8">
              <div className="mb-6"><div className="eyebrow text-[#d5ff45]">System communication</div><h2 className="font-display mt-3 text-4xl tracking-[-0.05em]">ส่งประกาศถึงผู้ใช้</h2><p className="mt-2 max-w-2xl text-sm leading-6 text-white/52">ส่งเฉพาะผู้ใช้ที่เลือกเปิดรับการแจ้งเตือนระบบไว้ โดยระบบจำกัดการส่ง 12 ครั้งต่อชั่วโมงต่อผู้ดูแลเพื่อป้องกัน spam</p></div>
              <div className="rounded-2xl border border-white/10 bg-white/[0.025] p-5 sm:p-7">
                <div className="space-y-4">
                  <label className="admin-field">หัวข้อประกาศ<input value={broadcastForm.title} onChange={(event) => setBroadcastForm((current) => ({ ...current, title: event.target.value }))} placeholder="เช่น อัปเดตรายการใหม่ในสัปดาห์นี้" maxLength={180} /></label>
                  <label className="admin-field">ข้อความ<textarea rows={5} value={broadcastForm.body} onChange={(event) => setBroadcastForm((current) => ({ ...current, body: event.target.value }))} placeholder="อธิบายสิ่งที่ผู้ใช้ควรรู้หรือทำต่อ" maxLength={600} /></label>
                  <label className="admin-field">ลิงก์ปลายทางภายในเว็บไซต์<input value={broadcastForm.href} onChange={(event) => setBroadcastForm((current) => ({ ...current, href: event.target.value }))} placeholder="/dashboard หรือ /#editions" /><span className="mt-2 block text-[10px] font-normal leading-4 text-white/42">ใช้เฉพาะ path ที่ขึ้นต้นด้วย / เช่น <code>/dashboard</code>, <code>/read/slug</code> หรือ <code>/#editions</code></span></label>
                  <button type="button" disabled={broadcastNotification.isPending} onClick={submitBroadcast} className="gradient-cta flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3.5 text-[10px] font-extrabold tracking-[0.1em] text-black disabled:opacity-60"><Send size={14} /> {broadcastNotification.isPending ? "กำลังส่ง…" : "ส่งประกาศระบบ"}</button>
                </div>
              </div>
            </section>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
