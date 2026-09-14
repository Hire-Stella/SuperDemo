"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  useSyncExternalStore,
  type ReactNode,
} from "react";

const STORAGE_KEY = "lignepure.cart.v1";

export type CartLine = {
  /** slug + serialised options, so each variant is its own line */
  id: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  options: Record<string, string>;
  quantity: number;
};

// ---------------------------------------------------------------------------
// localStorage-backed external store. Read through useSyncExternalStore so the
// server snapshot stays empty and hydration never mismatches.
// ---------------------------------------------------------------------------

const EMPTY: CartLine[] = [];

let snapshot: CartLine[] = EMPTY;
let loaded = false;
const listeners = new Set<() => void>();

function readStored(): CartLine[] {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return EMPTY;
    return parsed.filter(
      (l): l is CartLine =>
        Boolean(l) &&
        typeof l.slug === "string" &&
        typeof l.price === "number" &&
        typeof l.quantity === "number" &&
        l.quantity > 0,
    );
  } catch {
    // private mode, blocked site data, or corrupt payload
    return EMPTY;
  }
}

function ensureLoaded() {
  if (loaded || typeof window === "undefined") return;
  loaded = true;
  snapshot = readStored();
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(onChange: () => void) {
  ensureLoaded();
  listeners.add(onChange);

  // Keep other tabs of the same browser in sync.
  const onStorage = (e: StorageEvent) => {
    if (e.key !== STORAGE_KEY) return;
    snapshot = readStored();
    emit();
  };
  window.addEventListener("storage", onStorage);

  return () => {
    listeners.delete(onChange);
    window.removeEventListener("storage", onStorage);
  };
}

function getSnapshot() {
  ensureLoaded();
  return snapshot;
}

function getServerSnapshot() {
  return EMPTY;
}

function commit(next: CartLine[]) {
  snapshot = next;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* storage unavailable — cart still works for this page view */
  }
  emit();
}

const lineId = (slug: string, options: Record<string, string>) =>
  [slug, ...Object.entries(options).sort().map(([k, v]) => `${k}:${v}`)].join("|");

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

type CartContextValue = {
  lines: CartLine[];
  count: number;
  subtotal: number;
  isOpen: boolean;
  /** false during SSR and the hydration pass */
  ready: boolean;
  open: () => void;
  close: () => void;
  add: (line: Omit<CartLine, "id">) => void;
  setQuantity: (id: string, quantity: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

const CartContext = createContext<CartContextValue | null>(null);

const CLIENT = () => true;
const SERVER = () => false;

export function CartProvider({ children }: { children: ReactNode }) {
  const lines = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const ready = useSyncExternalStore(subscribe, CLIENT, SERVER);
  const [isOpen, setIsOpen] = useState(false);

  // Lock page scroll and wire Escape while the drawer is open.
  useEffect(() => {
    if (!isOpen) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener("keydown", onKey);
    };
  }, [isOpen]);

  const add = useCallback((line: Omit<CartLine, "id">) => {
    const id = lineId(line.slug, line.options);
    const current = getSnapshot();
    const existing = current.find((l) => l.id === id);
    commit(
      existing
        ? current.map((l) =>
            l.id === id ? { ...l, quantity: Math.min(99, l.quantity + line.quantity) } : l,
          )
        : [...current, { ...line, id }],
    );
    setIsOpen(true);
  }, []);

  const setQuantity = useCallback((id: string, quantity: number) => {
    const current = getSnapshot();
    commit(
      quantity <= 0
        ? current.filter((l) => l.id !== id)
        : current.map((l) => (l.id === id ? { ...l, quantity: Math.min(99, quantity) } : l)),
    );
  }, []);

  const remove = useCallback((id: string) => {
    commit(getSnapshot().filter((l) => l.id !== id));
  }, []);

  const clear = useCallback(() => commit(EMPTY), []);
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);

  const value = useMemo<CartContextValue>(
    () => ({
      lines,
      count: lines.reduce((sum, l) => sum + l.quantity, 0),
      subtotal: lines.reduce((sum, l) => sum + l.price * l.quantity, 0),
      isOpen,
      ready,
      open,
      close,
      add,
      setQuantity,
      remove,
      clear,
    }),
    [lines, isOpen, ready, open, close, add, setQuantity, remove, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside <CartProvider>");
  return ctx;
}
