import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import type { StorefrontExperience } from "@/components/storefrontAccess";
import { LogOut } from "lucide-react";
import React from "react";
import { Link, useLocation } from "wouter";

type DrawerUser = {
  name?: string | null;
  email?: string | null;
};

type DrawerContentProps = {
  experience: StorefrontExperience;
  user: DrawerUser | null;
  onNavigate: () => void;
  onLogin: () => void;
  onLogout: () => void;
  currentPath: string;
};

export function MobileNavigationDrawerContent({ experience, user, onNavigate, onLogin, onLogout, currentPath }: DrawerContentProps) {
  const accountName = user?.name?.trim() || user?.email?.trim() || "บัญชี Brightline";
  const avatarInitial = accountName.charAt(0).toUpperCase() || "B";
  return (
    <div className="flex min-h-full flex-1 flex-col bg-[#0b0c0d] text-white">
      <div className="border-b border-white/10 px-6 py-7 text-left">
        <h2 className="font-display text-xl tracking-[0.12em] text-white">BRIGHTLINE</h2>
        {experience.account ? (
          <Link href={experience.account.href} onClick={onNavigate} className="mt-6 flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[.035] p-3 transition-colors hover:border-[#d5ff45]/45">
            <Avatar className="h-10 w-10 border border-[#d5ff45]/30"><AvatarFallback className="bg-[#d5ff45] text-sm font-black text-black">{avatarInitial}</AvatarFallback></Avatar>
            <span className="min-w-0"><span className="block truncate text-sm font-bold text-white">{accountName}</span><span className="mt-0.5 block text-[10px] font-semibold tracking-[.08em] text-[#d5ff45]">{experience.account.label}</span></span>
          </Link>
        ) : (
          <button type="button" onClick={onLogin} className="gradient-cta mt-6 w-full rounded-xl px-4 py-3 text-[10px] font-extrabold tracking-[0.12em] text-black">เริ่มเลือกหมาก</button>
        )}
      </div>
      <nav className="flex flex-col gap-1 px-4 py-5" aria-label="เมนูนำทางมือถือ">
        {experience.navigation.map((item) => {
          const isActive = item.href.startsWith("/#") ? currentPath === "/" && typeof window !== "undefined" && window.location.hash === item.href.slice(1) : currentPath === item.href;
          return <Link key={item.href} href={item.href} onClick={onNavigate} aria-current={isActive ? "page" : undefined} className={`rounded-xl px-4 py-3.5 text-sm font-bold transition-colors ${isActive ? "bg-[#d5ff45] text-black shadow-[0_0_24px_rgba(213,255,69,.15)]" : item.emphasis ? "bg-[#d5ff45]/10 text-[#d5ff45]" : "text-white/78 hover:bg-white/[.05] hover:text-white"}`}>{item.label}</Link>;
        })}
      </nav>
      {experience.account && <div className="mt-auto border-t border-white/10 p-4"><button type="button" onClick={onLogout} className="flex w-full items-center gap-2 rounded-xl px-4 py-3 text-xs font-bold text-white/62 transition-colors hover:bg-white/[.05] hover:text-white"><LogOut size={15} /> ออกจากระบบ</button></div>}
    </div>
  );
}

type MobileNavigationDrawerProps = Omit<DrawerContentProps, "onNavigate" | "currentPath"> & {
  open: boolean;
  onOpenChange: (open: boolean) => void;
};

export function MobileNavigationDrawer({ open, onOpenChange, ...contentProps }: MobileNavigationDrawerProps) {
  const [currentPath] = useLocation();
  return <Sheet open={open} onOpenChange={onOpenChange}><SheetContent side="left" className="w-[min(88vw,22rem)] border-white/10 bg-[#0b0c0d] p-0"><SheetTitle className="sr-only">เมนูนำทาง Brightline</SheetTitle><MobileNavigationDrawerContent {...contentProps} currentPath={currentPath} onNavigate={() => onOpenChange(false)} /></SheetContent></Sheet>;
}
