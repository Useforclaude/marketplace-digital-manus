export type StorefrontAudience = "visitor" | "user" | "member" | "admin";

export type StorefrontAccessInput = {
  isAuthenticated: boolean;
  role?: string | null;
  ownedItemCount?: number;
};

type NavigationItem = {
  href: string;
  label: string;
  emphasis?: boolean;
};

type StorefrontAction = {
  label: string;
  href: string;
  requiresLogin?: boolean;
};

export type StorefrontExperience = {
  audience: StorefrontAudience;
  navigation: readonly NavigationItem[];
  account: StorefrontAction | null;
  primaryCta: StorefrontAction;
  secondaryCta: StorefrontAction;
};

const sharedNavigation = [
  { href: "/#editions", label: "สินค้า" },
  { href: "/#membership", label: "วิธีใช้งาน" },
] as const;

export function getStorefrontExperience({
  isAuthenticated,
  role,
  ownedItemCount = 0,
}: StorefrontAccessInput): StorefrontExperience {
  if (isAuthenticated && role === "admin") {
    return {
      audience: "admin",
      navigation: [...sharedNavigation, { href: "/admin", label: "จัดการร้าน", emphasis: true }],
      account: { href: "/admin", label: "กระดานผู้ดูแล" },
      primaryCta: { href: "/admin", label: "เข้าสู่กระดานผู้ดูแล" },
      secondaryCta: { href: "/#editions", label: "ดูหน้าร้าน" },
    };
  }

  if (!isAuthenticated) {
    return {
      audience: "visitor",
      navigation: sharedNavigation,
      account: null,
      primaryCta: { href: "/#editions", label: "เลือกหมากตัวแรกของคุณ", requiresLogin: true },
      secondaryCta: { href: "/#membership", label: "ดูวิธีเริ่มเกม" },
    };
  }

  if (ownedItemCount > 0) {
    return {
      audience: "member",
      navigation: [...sharedNavigation, { href: "/dashboard", label: "คลังของฉัน", emphasis: true }],
      account: { href: "/dashboard", label: "คลังของฉัน" },
      primaryCta: { href: "/dashboard", label: "เดินหมากต่อในคลังของคุณ" },
      secondaryCta: { href: "/#editions", label: "เลือกหมากเพิ่ม" },
    };
  }

  return {
    audience: "user",
    navigation: sharedNavigation,
    account: { href: "/dashboard", label: "บัญชีของฉัน" },
    primaryCta: { href: "/#editions", label: "เลือกหมากตัวแรกของคุณ" },
    secondaryCta: { href: "/#editions", label: "ดูตำแหน่งทั้งหมด" },
  };
}
