/**
 * CartGhost AI Service
 *
 * Calls the Express backend /api/analyze endpoint.
 * The backend proxies to Gemini and keeps the API key server-side.
 * If the backend is unavailable or returns an error, this module
 * returns { source: 'fallback' } and the caller uses the local engine.
 */

import type { AbandonedCart, AIDecision } from '../types';

// What the backend returns on success
interface BackendSuccess {
  success: true;
  source: 'gemini' | 'fallback';
  reason: AIDecision['reason'];
  confidence: number;
  recoveryProbability: number;
  recommendedAction: AIDecision['recommendedAction'];
  explanation: string;
  discountRecommended: boolean;
  discountAmount?: number;
}

// What the backend returns on error
interface BackendError {
  success: false;
  error: string;
  source: 'fallback';
}

type BackendResponse = BackendSuccess | BackendError;

export type AISource = 'gemini' | 'fallback';

export interface AIServiceResult {
  decision: AIDecision;
  source: AISource;
}

// Health check result — cached for the session
let _healthCache: { geminiConfigured: boolean; checkedAt: number } | null = null;
const HEALTH_CACHE_TTL_MS = 30_000; // re-check every 30s

export async function checkBackendHealth(): Promise<{ available: boolean; geminiConfigured: boolean }> {
  // Return cache if fresh
  if (_healthCache && Date.now() - _healthCache.checkedAt < HEALTH_CACHE_TTL_MS) {
    return { available: true, geminiConfigured: _healthCache.geminiConfigured };
  }

  try {
    const res = await fetch('/api/health', { signal: AbortSignal.timeout(3000) });
    if (!res.ok) return { available: false, geminiConfigured: false };
    const data = await res.json() as { geminiConfigured: boolean };
    _healthCache = { geminiConfigured: data.geminiConfigured, checkedAt: Date.now() };
    return { available: true, geminiConfigured: data.geminiConfigured };
  } catch {
    return { available: false, geminiConfigured: false };
  }
}

export function invalidateHealthCache(): void {
  _healthCache = null;
}

/**
 * Call the backend /api/analyze endpoint.
 * Returns null on any network/parse error so the caller can fallback.
 */
export async function callBackendAnalyze(cart: AbandonedCart): Promise<BackendResponse | null> {
  const product = cart.items[0]?.product;

  const payload = {
    cartId: cart.id,
    customerName: cart.customer.name,
    customerSegment: cart.customer.segment,
    customerTotalOrders: cart.customer.totalOrders,
    customerTotalSpent: cart.customer.totalSpent,
    customerCity: cart.customer.city,
    cartValue: cart.cartValue,
    productName: product?.name ?? 'Unknown Product',
    productCategory: product?.category ?? 'Unknown',
    productBrand: product?.brand ?? 'Unknown',
    timeSpentMinutes: cart.behavior.timeSpentMinutes,
    productViews: cart.behavior.productViews,
    sizeChartViews: cart.behavior.sizeChartViews,
    reviewsRead: cart.behavior.reviewsRead,
    photosViewed: cart.behavior.photosViewed,
    compareActions: cart.behavior.compareActions,
    addToWishlist: cart.behavior.addToWishlist,
    returnVisits: cart.behavior.returnVisits,
    previousPurchases: cart.previousPurchases,
    abandonmentHistory: cart.abandonmentHistory,
    deviceType: cart.deviceType,
    source: cart.source,
  };

  try {
    const res = await fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(15_000), // 15s timeout for Gemini
    });

    const data = await res.json() as BackendResponse;
    return data;
  } catch (err) {
    console.warn('[CartGhost] Backend unreachable, will use fallback engine:', err);
    return null;
  }
}

/**
 * Convert a successful BackendResponse to an AIDecision.
 */
export function backendResponseToDecision(resp: BackendSuccess): AIDecision {
  return {
    reason: resp.reason,
    confidence: resp.confidence,
    recoveryProbability: resp.recoveryProbability,
    recommendedAction: resp.recommendedAction,
    explanation: resp.explanation,
    discountRecommended: resp.discountRecommended,
    discountAmount: resp.discountAmount,
  };
}
