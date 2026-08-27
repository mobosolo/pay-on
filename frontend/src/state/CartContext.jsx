import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

const STORAGE_KEY = "payon:cart:v1";
const EVENT_STORAGE_KEY = "payon:cart-event:v1";

const CartContext = createContext(null);

function loadInitial() {
  if (typeof window === "undefined") return {};
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
  } catch {
    return {};
  }
}

export function CartProvider({ children }) {
  const [cart, setCart] = useState(loadInitial);
  const [activeEventId, setActiveEventId] = useState(() => {
    if (typeof window === "undefined") return null;
    return window.sessionStorage.getItem(EVENT_STORAGE_KEY);
  });

  useEffect(() => {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
    } catch {
      // sessionStorage indisponible — on accepte la perte
    }
  }, [cart]);

  useEffect(() => {
    try {
      if (activeEventId) {
        window.sessionStorage.setItem(EVENT_STORAGE_KEY, activeEventId);
      } else {
        window.sessionStorage.removeItem(EVENT_STORAGE_KEY);
      }
    } catch {
      // sessionStorage indisponible — le panier reste utilisable en mémoire
    }
  }, [activeEventId]);

  const setEvent = useCallback(
    (eventId) => {
      if (activeEventId && activeEventId !== eventId) setCart({});
      setActiveEventId(eventId);
    },
    [activeEventId],
  );

  const setQty = useCallback((tierId, qty) => {
    setCart((prev) => {
      const next = { ...prev };
      if (qty <= 0) {
        delete next[tierId];
      } else {
        next[tierId] = qty;
      }
      return next;
    });
  }, []);

  const clear = useCallback(() => setCart({}), []);

  const totalItems = useMemo(
    () => Object.values(cart).reduce((sum, q) => sum + q, 0),
    [cart],
  );

  const value = useMemo(
    () => ({ cart, setQty, clear, totalItems, activeEventId, setEvent }),
    [cart, setQty, clear, totalItems, activeEventId, setEvent],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart doit être utilisé dans <CartProvider>");
  return ctx;
}
