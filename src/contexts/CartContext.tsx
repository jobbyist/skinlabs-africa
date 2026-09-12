import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export interface CartItem {
  productId: string;
  quantity: number;
}

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  isSyncing: boolean;
  addItem: (productId: string, quantity?: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  updateQuantity: (productId: string, quantity: number) => Promise<void>;
  clear: () => Promise<void>;
}

const CartContext = createContext<CartContextValue | null>(null);

const STORAGE_KEY = "openhaus_cart_v1";

function readLocalCart(): CartItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (i): i is CartItem => typeof i?.productId === "string" && typeof i?.quantity === "number" && i.quantity > 0,
    );
  } catch {
    return [];
  }
}

function writeLocalCart(items: CartItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // localStorage unavailable (private mode, quota) — cart just won't persist across reloads.
  }
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>(() => readLocalCart());
  const [mergedForUserId, setMergedForUserId] = useState<string | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);

  // On sign-out, drop back to whatever is in localStorage (a fresh guest cart).
  useEffect(() => {
    if (!user) {
      setItems(readLocalCart());
      setMergedForUserId(null);
    }
  }, [user]);

  // On sign-in, merge the guest's localStorage cart into their Supabase cart
  // once, then treat Supabase as the source of truth for the rest of the session.
  useEffect(() => {
    if (!user || mergedForUserId === user.id) return;
    let cancelled = false;

    (async () => {
      setIsSyncing(true);
      try {
        const local = readLocalCart();
        const { data: remote } = await supabase
          .from("marketplace_cart_items")
          .select("product_id, quantity")
          .eq("user_id", user.id);
        const remoteQtyByProduct = new Map((remote ?? []).map((r) => [r.product_id, r.quantity]));

        for (const item of local) {
          const mergedQty = (remoteQtyByProduct.get(item.productId) ?? 0) + item.quantity;
          await supabase
            .from("marketplace_cart_items")
            .upsert(
              { user_id: user.id, product_id: item.productId, quantity: mergedQty },
              { onConflict: "user_id,product_id" },
            );
        }
        if (local.length > 0) writeLocalCart([]);

        const { data: full } = await supabase
          .from("marketplace_cart_items")
          .select("product_id, quantity")
          .eq("user_id", user.id);

        if (!cancelled) {
          setItems((full ?? []).map((r) => ({ productId: r.product_id, quantity: r.quantity })));
          setMergedForUserId(user.id);
        }
      } finally {
        if (!cancelled) setIsSyncing(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, mergedForUserId]);

  const addItem = useCallback(
    async (productId: string, quantity = 1) => {
      setItems((prev) => {
        const existing = prev.find((i) => i.productId === productId);
        const next = existing
          ? prev.map((i) => (i.productId === productId ? { ...i, quantity: i.quantity + quantity } : i))
          : [...prev, { productId, quantity }];
        if (!user) writeLocalCart(next);
        return next;
      });
      if (user) {
        const existingQty = items.find((i) => i.productId === productId)?.quantity ?? 0;
        await supabase
          .from("marketplace_cart_items")
          .upsert(
            { user_id: user.id, product_id: productId, quantity: existingQty + quantity },
            { onConflict: "user_id,product_id" },
          );
      }
    },
    [user, items],
  );

  const removeItem = useCallback(
    async (productId: string) => {
      setItems((prev) => {
        const next = prev.filter((i) => i.productId !== productId);
        if (!user) writeLocalCart(next);
        return next;
      });
      if (user) {
        await supabase.from("marketplace_cart_items").delete().eq("user_id", user.id).eq("product_id", productId);
      }
    },
    [user],
  );

  const updateQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity <= 0) {
        await removeItem(productId);
        return;
      }
      setItems((prev) => {
        const next = prev.map((i) => (i.productId === productId ? { ...i, quantity } : i));
        if (!user) writeLocalCart(next);
        return next;
      });
      if (user) {
        await supabase
          .from("marketplace_cart_items")
          .upsert({ user_id: user.id, product_id: productId, quantity }, { onConflict: "user_id,product_id" });
      }
    },
    [user, removeItem],
  );

  const clear = useCallback(async () => {
    setItems([]);
    if (user) {
      await supabase.from("marketplace_cart_items").delete().eq("user_id", user.id);
    } else {
      writeLocalCart([]);
    }
  }, [user]);

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <CartContext.Provider value={{ items, itemCount, isSyncing, addItem, removeItem, updateQuantity, clear }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
