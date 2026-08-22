import { Check, Copy, Facebook, MessageCircleMore, Share2, Twitter } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";

export function buildProductShareLinks(url: string, title: string) {
  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  return {
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
    x: `https://x.com/intent/post?url=${encodedUrl}&text=${encodedTitle}`,
    line: `https://social-plugins.line.me/lineit/share?url=${encodedUrl}`,
  };
}

type Props = { title: string; description: string };

export function ProductShareActions({ title, description }: Props) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window === "undefined" ? "" : window.location.href;
  const links = buildProductShareLinks(shareUrl, title);
  const shareText = `${title} — ${description}`;

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(shareUrl);
      setCopied(true);
      toast.success("คัดลอกลิงก์แล้ว", { description: "พร้อมส่งต่อให้คนที่อยากพัฒนาทักษะเหมือนคุณ" });
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("คัดลอกลิงก์ไม่สำเร็จ", { description: "กรุณาคัดลอก URL จากแถบที่อยู่ของเบราว์เซอร์" });
    }
  };

  const nativeShare = async () => {
    if (!navigator.share) return copyLink();
    try {
      await navigator.share({ title, text: shareText, url: shareUrl });
    } catch (error) {
      if ((error as DOMException).name !== "AbortError") toast.error("เปิดเมนูแชร์ไม่สำเร็จ");
    }
  };

  const openShare = (url: string) => window.open(url, "_blank", "noopener,noreferrer,width=720,height=640");

  return <div className="mt-7 border-t border-white/10 pt-5" aria-label="แชร์หน้านี้">
    <div className="flex items-center justify-between gap-4"><span className="text-[10px] font-bold tracking-[0.12em] text-white/48">ส่งต่อให้คนที่กำลังหาทางเดินของตัวเอง</span><button type="button" onClick={nativeShare} className="inline-flex items-center gap-2 rounded-full border border-white/12 px-3 py-2 text-[10px] font-bold tracking-[0.08em] text-white/72 transition hover:border-[#d5ff45]/45 hover:text-[#d5ff45]"><Share2 size={13} /> แชร์</button></div>
    <div className="mt-3 flex flex-wrap gap-2">
      <button type="button" onClick={copyLink} className="share-action" aria-label="คัดลอกลิงก์">{copied ? <Check size={14} className="text-[#d5ff45]" /> : <Copy size={14} />}<span>{copied ? "คัดลอกแล้ว" : "คัดลอกลิงก์"}</span></button>
      <button type="button" onClick={() => openShare(links.line)} className="share-action" aria-label="แชร์ไป LINE"><MessageCircleMore size={14} className="text-[#d5ff45]" /><span>LINE</span></button>
      <button type="button" onClick={() => openShare(links.facebook)} className="share-action" aria-label="แชร์ไป Facebook"><Facebook size={14} /><span>Facebook</span></button>
      <button type="button" onClick={() => openShare(links.x)} className="share-action" aria-label="แชร์ไป X"><Twitter size={14} /><span>X</span></button>
    </div>
  </div>;
}
