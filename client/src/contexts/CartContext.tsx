import { trpc } from "@/lib/trpc";
import type { SellableProduct } from "@shared/products";
import { addCartLine, getCartSummary, setCartLineQuantity, type CartLine } from "./cartUtils";
import { createContext, useContext, useEffect, useMemo, useState } from "react";

type CartContextValue = {
  lines: CartLine[];
  items: ReturnType<typeof getCartSummary>["items"];
  itemCount: number;
  subtotal: number;
  catalogLoading: boolean;
  addItem: (productId: string) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "brightline-cart";

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [lines, setLines] = useState<CartLine[]>([]);
  const catalog = trpc.catalog.list.useQuery();

  useEffect(() => {
    try {
      const savedCart = window.localStorage.getItem(STORAGE_KEY);
      if (savedCart) setLines(JSON.parse(savedCart) as CartLine[]);
    } catch {
      setLines([]);
    }
  }, []);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(lines));
    } catch {
      // A cart still works for the current session if storage is unavailable.
    }
  }, [lines]);

  const value = useMemo<CartContextValue>(() => {
    const { items, itemCount, subtotal } = getCartSummary(lines, (catalog.data ?? []) as SellableProduct[]);

    return {
      lines,
      items,
      itemCount,
      subtotal,
      catalogLoading: catalog.isLoading,
      addItem: (productId) => {
        setLines((current) => addCartLine(current, productId));
      },
      removeItem: (productId) => {
        setLines((current) => current.filter((line) => line.productId !== productId));
      },
      setQuantity: (productId, quantity) => {
        setLines((current) => setCartLineQuantity(current, productId, quantity));
      },
      clearCart: () => setLines([]),
    };
  }, [catalog.data, catalog.isLoading, lines]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used inside CartProvider");
  return context;
}
