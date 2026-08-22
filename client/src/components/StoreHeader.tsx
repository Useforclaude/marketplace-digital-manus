import { useAuth } from "@/_core/hooks/useAuth";
import { startLogin } from "@/const";
import { useCart } from "@/contexts/CartContext";
import { trpc } from "@/lib/trpc";
import { getStorefrontExperience } from "@/components/storefrontAccess";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { MobileNavigationDrawer } from "@/components/MobileNavigationDrawer";
import { Menu, ShoppingBag, ShieldCheck, UserRound } from "lucide-react";
import React, { useState } from "react";
import { Link } from "wouter";

type StoreHeaderProps = {
  onOpenCart: () => void;
};

export function StoreHeader({ onOpenCart }: StoreHeaderProps) {
  const { itemCount } = useCart();
  const { user, isAuthenticated, loading, logout } = useAuth();
  const library = trpc.library.list.useQuery(undefined, {
    enabled: isAuthenticated && user?.role !== "admin",
  });
  const experience = getStorefrontExperience({
    isAuthenticated,
    role: user?.role,
    ownedItemCount: library.data?.length ?? 0,
  });
  const AccountIcon = experience.audience === "admin" ? ShieldCheck : UserRound;
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const accountName = user?.name?.trim() || user?.email?.trim() || "บัญชี Brightline";
  const avatarInitial = accountName.charAt(0).toUpperCase() || "B";

  return (
    <header className="sticky top-0 z-40 border-b border-white/8 bg-[#0b0c0d]/78 backdrop-blur-xl">
      <div className="container flex h-18 items-center justify-between gap-4">
        <Link href="/" className="group flex min-w-0 items-center gap-3" aria-label="Brightline home">
          <span className="grid h-8 w-8 shrink-0 place-items-center rounded-sm bg-[#d5ff45] text-[12px] font-black tracking-[-0.14em] text-black transition-transform duration-200 group-hover:rotate-6">
            BL
          </span>
          <span className="font-display text-sm font-semibold tracking-[0.17em] text-white">BRIGHTLINE</span>
        </Link>

        <nav className="hidden items-center gap-7 text-[11px] font-semibold tracking-[0.17em] text-white/58 md:flex">
          {experience.navigation.map((item) => (
            <Link key={item.href} className={`${item.emphasis ? "text-[#d5ff45]" : "text-white/58"} transition-colors hover:text-white`} href={item.href}>
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-3">
          <button type="button" onClick={() => setMobileMenuOpen(true)} aria-label="เปิดเมนูนำทาง" className="grid h-9 w-9 place-items-center rounded-full border border-white/12 text-white transition-colors hover:border-[#d5ff45] hover:text-[#d5ff45] md:hidden"><Menu size={17} /></button>
          {loading ? null : isAuthenticated ? (
            <>
              {experience.account && <Link href={experience.account.href} className="hidden items-center gap-2 rounded-full px-2 py-1.5 text-[11px] font-semibold tracking-wide text-white/70 transition-colors hover:bg-white/7 hover:text-white md:flex"><Avatar className="h-7 w-7 border border-[#d5ff45]/30"><AvatarFallback className="bg-[#d5ff45] text-[10px] font-black text-black">{avatarInitial}</AvatarFallback></Avatar><span className="min-w-0 text-left"><span className="block max-w-28 truncate text-[10px] font-bold text-white">{accountName}</span><span className="mt-0.5 flex items-center gap-1 text-[8px] font-bold tracking-[.08em] text-[#d5ff45]"><AccountIcon size={10} /> {experience.account.label}</span></span></Link>}
              <button
                type="button"
                title="ออกจากระบบ"
                onClick={() => void logout()}
                className="hidden items-center gap-2 rounded-full px-2.5 py-2 text-[11px] font-semibold tracking-wide text-white/70 transition-colors hover:bg-white/7 hover:text-white md:flex">
                <span className="max-w-24 truncate">ออกจากระบบ</span>
              </button>
            </>
          ) : (
            <button
              type="button"
              onClick={startLogin}
              className="hidden rounded-full border border-white/12 px-3.5 py-2 text-[10px] font-semibold tracking-[0.13em] text-white/84 transition-colors hover:border-white/28 hover:bg-white/6 md:block">
              เริ่มเลือกหมาก
            </button>
          )}
          <button
            type="button"
            onClick={onOpenCart}
            aria-label={`เปิดตะกร้าสินค้า มี ${itemCount} รายการ`}
            className="relative grid h-9 w-9 place-items-center rounded-full border border-white/12 text-white transition-colors hover:border-[#d5ff45] hover:text-[#d5ff45]"
          >
            <ShoppingBag size={16} strokeWidth={1.8} />
            {itemCount > 0 && (
              <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-[#d5ff45] px-1 text-[9px] font-black text-black">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </div>
      <MobileNavigationDrawer open={mobileMenuOpen} onOpenChange={setMobileMenuOpen} experience={experience} user={user} onLogin={startLogin} onLogout={() => void logout()} />
    </header>
  );
}
