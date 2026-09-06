/**
 * CartStore — single source of truth for all cart/customer data.
 *
 * All pages read from this context. Recovery actions write to it.
 * Everything recomputes from the live array — no stale KPIs.
 */
import React, {
  createContext,
  useContext,
  useState,
  useCallback,
  useMemo,
  type ReactNode,
} from 'react';
import { mockCarts } from '../data/mockData';
import type { AbandonedCart, ActionStatus, AIDecision, DashboardStats } from '../types';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface CartStore {
  carts: AbandonedCart[];

  // Mutations
  updateCartStatus: (
    cartId: string,
    status: ActionStatus,
    recoveredRevenue?: number
  ) => void;
  updateCartDecision: (cartId: string, decision: AIDecision) => void;

  // Computed aggregates (memoised, recompute on every mutation)
  stats: DashboardStats;
  totalRecoveredRevenue: number;
  recoveredCarts: AbandonedCart[];
  pendingCarts: AbandonedCart[];
}

// ─── Context ──────────────────────────────────────────────────────────────────

const CartContext = createContext<CartStore | null>(null);

// ─── KPI computation ──────────────────────────────────────────────────────────

function computeStats(carts: AbandonedCart[]): DashboardStats {
  const total = carts.length;
  if (total === 0) {
    return {
      totalAbandonedValue: 0,
      recoverableRevenue: 0,
      recoveryRate: 0,
      totalAbandonedCarts: 0,
      aiSuccessRate: 0,
      averageCartValue: 0,
      cartsRecoveredToday: 0,
      discountsAvoided: 0,
    };
  }

  const totalAbandonedValue = carts.reduce((s, c) => s + c.cartValue, 0);

  // Recoverable = sum of (cartValue × recoveryProbability) for non-converted, non-ignored carts
  const recoverableRevenue = Math.round(
    carts
      .filter((c) => c.actionStatus !== 'converted' && c.actionStatus !== 'ignored')
      .reduce((s, c) => s + (c.cartValue * c.aiDecision.recoveryProbability) / 100, 0)
  );

  const convertedCarts = carts.filter((c) => c.actionStatus === 'converted');

  // Recovery rate = converted / total
  const recoveryRate =
    Math.round((convertedCarts.length / total) * 1000) / 10;

  // AI success rate = converted / (sent + converted + failed)  — carts where an action was taken
  const actionedCarts = carts.filter((c) =>
    ['sent', 'converted', 'failed'].includes(c.actionStatus)
  );
  const aiSuccessRate =
    actionedCarts.length > 0
      ? Math.round((convertedCarts.length / actionedCarts.length) * 1000) / 10
      : 0;

  const averageCartValue = Math.round(totalAbandonedValue / total);

  // Recovered today: converted carts abandoned within last 24 h (proxy: within today's window)
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const cartsRecoveredToday = convertedCarts.filter(
    (c) => new Date(c.abandonedAt) >= todayStart
  ).length;

  // Discounts avoided = carts where AI did NOT recommend discount and action was sent/converted
  const discountsAvoided = carts.filter(
    (c) =>
      !c.aiDecision.discountRecommended &&
      ['sent', 'converted'].includes(c.actionStatus)
  ).length;

  return {
    totalAbandonedValue,
    recoverableRevenue,
    recoveryRate,
    totalAbandonedCarts: total,
    aiSuccessRate,
    averageCartValue,
    cartsRecoveredToday,
    discountsAvoided,
  };
}

// ─── Provider ─────────────────────────────────────────────────────────────────

export function CartStoreProvider({ children }: { children: ReactNode }) {
  // Deep-clone initial data so we never mutate the imported const array
  const [carts, setCarts] = useState<AbandonedCart[]>(() =>
    mockCarts.map((c) => ({ ...c }))
  );

  const updateCartStatus = useCallback(
    (cartId: string, status: ActionStatus, recoveredRevenue?: number) => {
      setCarts((prev) =>
        prev.map((c) =>
          c.id === cartId
            ? {
                ...c,
                actionStatus: status,
                recoveredRevenue:
                  status === 'converted'
                    ? (recoveredRevenue ?? c.cartValue)
                    : c.recoveredRevenue,
              }
            : c
        )
      );
    },
    []
  );

  const updateCartDecision = useCallback(
    (cartId: string, decision: AIDecision) => {
      setCarts((prev) =>
        prev.map((c) => (c.id === cartId ? { ...c, aiDecision: decision } : c))
      );
    },
    []
  );

  const stats = useMemo(() => computeStats(carts), [carts]);

  const totalRecoveredRevenue = useMemo(
    () =>
      carts
        .filter((c) => c.actionStatus === 'converted')
        .reduce((s, c) => s + (c.recoveredRevenue ?? 0), 0),
    [carts]
  );

  const recoveredCarts = useMemo(
    () => carts.filter((c) => c.actionStatus === 'converted'),
    [carts]
  );

  const pendingCarts = useMemo(
    () => carts.filter((c) => c.actionStatus === 'pending'),
    [carts]
  );

  const value: CartStore = {
    carts,
    updateCartStatus,
    updateCartDecision,
    stats,
    totalRecoveredRevenue,
    recoveredCarts,
    pendingCarts,
  };

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useCartStore(): CartStore {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCartStore must be used inside CartStoreProvider');
  return ctx;
}
