import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { trpc } from "@/lib/trpc";
import { Bell, CheckCheck, PackagePlus, Sparkles, ShoppingBag } from "lucide-react";
import React from "react";

export type NotificationItem = {
  id: number;
  kind: "product" | "purchase" | "system";
  title: string;
  body: string;
  href: string;
  readAt: Date | null;
  createdAt: Date;
};

function NotificationIcon({ kind }: { kind: NotificationItem["kind"] }) {
  const Icon = kind === "product" ? PackagePlus : kind === "purchase" ? ShoppingBag : Sparkles;
  return <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full bg-[#d5ff45]/12 text-[#d5ff45]"><Icon size={14} /></span>;
}

export function NotificationBellContent({ items, onRead, onReadAll }: { items: readonly NotificationItem[]; onRead: (id: number) => void; onReadAll: () => void }) {
  const unreadCount = items.filter((item) => !item.readAt).length;
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-[#101214] text-white shadow-2xl shadow-black/50">
      <div className="flex items-center justify-between border-b border-white/8 px-4 py-3.5">
        <div><p className="text-sm font-extrabold">การแจ้งเตือน</p><p className="mt-0.5 text-[10px] font-semibold tracking-[.08em] text-white/45">{unreadCount ? `ยังไม่อ่าน ${unreadCount} รายการ` : "อัปเดตล่าสุดของคุณ"}</p></div>
        {unreadCount > 0 && <button type="button" onClick={onReadAll} className="inline-flex items-center gap-1 text-[10px] font-bold text-[#d5ff45] hover:text-white"><CheckCheck size={13} /> อ่านทั้งหมด</button>}
      </div>
      <div className="max-h-92 overflow-y-auto p-2">
        {items.length === 0 ? <div className="px-5 py-9 text-center"><Bell className="mx-auto mb-3 text-white/22" size={22} /><p className="text-sm font-bold text-white/75">ยังไม่มีการแจ้งเตือนใหม่</p><p className="mt-1 text-xs leading-5 text-white/42">เมื่อมีสินค้าใหม่หรืออัปเดตที่เกี่ยวข้อง ระบบจะแสดงที่นี่</p></div> : items.map((item) => <a key={item.id} href={item.href} onClick={() => { if (!item.readAt) onRead(item.id); }} className={`flex gap-3 rounded-xl p-3 transition-colors hover:bg-white/[.06] ${item.readAt ? "opacity-62" : "bg-[#d5ff45]/[.045]"}`}><NotificationIcon kind={item.kind} /><span className="min-w-0 flex-1"><span className="flex items-start justify-between gap-2"><span className="text-xs font-extrabold leading-5 text-white">{item.title}</span>{!item.readAt && <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[#d5ff45]" />}</span><span className="mt-0.5 block text-[11px] leading-4 text-white/56">{item.body}</span></span></a>)}
      </div>
    </div>
  );
}

export function NotificationBell({ isAuthenticated }: { isAuthenticated: boolean }) {
  const utils = trpc.useUtils();
  const notifications = trpc.notifications.list.useQuery(undefined, { enabled: isAuthenticated, refetchOnWindowFocus: true });
  const markRead = trpc.notifications.markRead.useMutation({ onSuccess: () => void utils.notifications.list.invalidate() });
  const markAllRead = trpc.notifications.markAllRead.useMutation({ onSuccess: () => void utils.notifications.list.invalidate() });
  if (!isAuthenticated) return null;
  const items = (notifications.data ?? []) as NotificationItem[];
  const unreadCount = items.filter((item) => !item.readAt).length;
  return <Popover><PopoverTrigger asChild><button type="button" aria-label={unreadCount ? `เปิดการแจ้งเตือน มี ${unreadCount} รายการที่ยังไม่อ่าน` : "เปิดการแจ้งเตือน"} className="relative grid h-9 w-9 place-items-center rounded-full border border-white/12 text-white transition-colors hover:border-[#d5ff45] hover:text-[#d5ff45]"><Bell size={16} strokeWidth={1.8} />{unreadCount > 0 && <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#d5ff45] px-1 text-[9px] font-black text-black">{unreadCount > 9 ? "9+" : unreadCount}</span>}</button></PopoverTrigger><PopoverContent align="end" sideOffset={10} className="w-[min(23rem,calc(100vw-2rem))] border-0 bg-transparent p-0"><NotificationBellContent items={items} onRead={(id) => markRead.mutate({ id })} onReadAll={() => markAllRead.mutate()} /></PopoverContent></Popover>;
}
