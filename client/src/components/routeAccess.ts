export type RouteAccessInput = {
  target: "admin" | "member";
  isAuthenticated: boolean;
  role?: string | null;
};

export type RedirectNotice = {
  to: string;
  title: string;
  description: string;
};

export function getRouteRedirectNotice({ target, isAuthenticated, role }: RouteAccessInput): RedirectNotice | null {
  if (target === "admin") {
    if (!isAuthenticated) {
      return {
        to: "/",
        title: "เข้าสู่ระบบก่อนใช้งานหลังบ้าน",
        description: "พื้นที่นี้เปิดให้ผู้ดูแล Brightline เท่านั้น",
      };
    }
    if (role !== "admin") {
      return {
        to: "/dashboard",
        title: "หน้านี้สำหรับผู้ดูแลระบบ",
        description: "เราพาคุณกลับไปยังพื้นที่สมาชิกของคุณแล้ว",
      };
    }
    return null;
  }

  if (!isAuthenticated) {
    return {
      to: "/",
      title: "เข้าสู่ระบบเพื่อเปิดพื้นที่สมาชิก",
      description: "คลัง eBook และคอร์สจะผูกกับบัญชีที่ซื้อเท่านั้น",
    };
  }
  if (role === "admin") {
    return {
      to: "/admin",
      title: "บัญชีนี้เป็นผู้ดูแลระบบ",
      description: "เราพาคุณไปยังกระดานผู้ดูแลแทนพื้นที่สมาชิก",
    };
  }
  return null;
}
