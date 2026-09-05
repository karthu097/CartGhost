import type {
  AbandonedCart,
  AIDecision,
  AbandonmentReason,
  RecoveryAction,
} from '../types';

/**
 * CartGhost AI Decision Engine
 *
 * Deterministic local implementation — no external API required.
 * Replace analyzeCart() body with a real LLM call to go live.
 *
 * Interface contract (unchanged):
 *   analyzeCart(cart: AbandonedCart): Promise<AIDecision>
 *   analyzeCartSync(cart: AbandonedCart): AIDecision   ← for pre-population
 */

export interface ScoringSignals {
  priceSensitivityScore: number;
  intentScore: number;
  uncertaintyScore: number;
  engagementScore: number;
  loyaltyScore: number;
}

export interface RevenueImpact {
  expectedRecovery: number;       // ₹ amount expected to be recovered
  marginSaved: number;            // ₹ margin saved by not discounting
  discountCost: number;           // ₹ discount cost if applicable
  netRevenueImpact: number;       // expectedRecovery - discountCost
  roiLabel: string;               // human-readable ROI description
}

export function computeSignals(cart: AbandonedCart): ScoringSignals {
  const { behavior, customer, cartValue } = cart;

  // Price sensitivity: high cart value + new customer + zero orders
  const priceSensitivityScore =
    (cartValue > 5000 ? 30 : cartValue > 2000 ? 20 : 10) +
    (customer.segment === 'new' ? 20 : customer.segment === 'returning' ? 10 : 0) +
    (customer.totalOrders === 0 ? 15 : 0);

  // Intent: time on site, return visits, wishlist adds, product views
  const intentScore =
    Math.min(behavior.timeSpentMinutes * 2, 30) +
    (behavior.returnVisits > 1 ? 20 : behavior.returnVisits === 1 ? 10 : 0) +
    (behavior.addToWishlist ? 15 : 0) +
    (behavior.productViews > 8 ? 15 : behavior.productViews > 4 ? 8 : 0);

  // Uncertainty: size chart views, compare actions, review reading
  const uncertaintyScore =
    (behavior.sizeChartViews > 2 ? 30 : behavior.sizeChartViews > 0 ? 15 : 0) +
    (behavior.compareActions > 0 ? 20 : 0) +
    (behavior.reviewsRead > 5 ? 10 : 0);

  // Engagement depth: photos, reviews, product views
  const engagementScore =
    Math.min(behavior.photosViewed * 3, 20) +
    Math.min(behavior.reviewsRead * 2, 20) +
    (behavior.productViews > 10 ? 20 : behavior.productViews * 2);

  // Loyalty: order history + repeat category purchases
  const loyaltyScore =
    (customer.totalOrders > 5 ? 40 : customer.totalOrders > 2 ? 25 : customer.totalOrders > 0 ? 10 : 0) +
    (cart.previousPurchases > 3 ? 20 : cart.previousPurchases > 1 ? 10 : 0);

  return {
    priceSensitivityScore: Math.min(priceSensitivityScore, 100),
    intentScore: Math.min(intentScore, 100),
    uncertaintyScore: Math.min(uncertaintyScore, 100),
    engagementScore: Math.min(engagementScore, 100),
    loyaltyScore: Math.min(loyaltyScore, 100),
  };
}

function detectReason(signals: ScoringSignals, cart: AbandonedCart): AbandonmentReason {
  const { priceSensitivityScore, intentScore, uncertaintyScore, engagementScore, loyaltyScore } = signals;

  // Payment issue — very short session, near-zero engagement
  if (cart.behavior.timeSpentMinutes < 2 && engagementScore < 15) return 'payment_issue';

  // Low intent — minimal engagement across the board
  if (intentScore < 20 && engagementScore < 20) return 'low_purchase_intent';

  // Size uncertainty — heavy size chart use is the strongest signal
  if (uncertaintyScore > 35 && cart.behavior.sizeChartViews > 1) return 'size_uncertainty';

  // Comparison shopping — multiple compare actions with many product views
  if (cart.behavior.compareActions > 0 && cart.behavior.productViews > 7) return 'comparison_shopping';

  // Waiting for discount — loyal + price-sensitive + has abandoned before
  if (loyaltyScore > 30 && priceSensitivityScore > 40 && cart.abandonmentHistory > 1) return 'waiting_for_discount';

  // Price sensitivity — primary price barrier signal
  if (priceSensitivityScore > 45) return 'price_sensitivity';

  // Product confusion — many views, first-time buyer with no history
  if (cart.behavior.productViews > 10 && cart.previousPurchases === 0) return 'product_confusion';

  // Shipping cost — mobile checkout dropout
  if (cart.deviceType === 'mobile' && cart.sessionDuration < 5) return 'shipping_cost';

  return 'price_sensitivity';
}

function chooseAction(
  reason: AbandonmentReason,
  signals: ScoringSignals,
  cart: AbandonedCart
): { action: RecoveryAction; discountRecommended: boolean; discountAmount?: number } {
  const { loyaltyScore, intentScore, priceSensitivityScore } = signals;

  switch (reason) {
    case 'size_uncertainty':
      return { action: 'send_size_recommendation', discountRecommended: false };

    case 'product_confusion':
      return intentScore > 40
        ? { action: 'answer_product_concern', discountRecommended: false }
        : { action: 'recommend_alternative', discountRecommended: false };

    case 'comparison_shopping':
      if (loyaltyScore > 35 && cart.cartValue > 3000) {
        return { action: 'offer_discount', discountRecommended: true, discountAmount: 10 };
      }
      return { action: 'send_personalized_reminder', discountRecommended: false };

    case 'price_sensitivity':
      if (priceSensitivityScore > 60 && cart.cartValue > 4000) {
        return { action: 'recommend_alternative', discountRecommended: false };
      }
      if (loyaltyScore > 40) {
        return { action: 'offer_discount', discountRecommended: true, discountAmount: 5 };
      }
      return { action: 'send_personalized_reminder', discountRecommended: false };

    case 'waiting_for_discount':
      if (loyaltyScore > 50 && cart.abandonmentHistory < 3) {
        return { action: 'offer_discount', discountRecommended: true, discountAmount: 8 };
      }
      return { action: 'send_personalized_reminder', discountRecommended: false };

    case 'payment_issue':
      return { action: 'offer_payment_options', discountRecommended: false };

    case 'shipping_cost':
      return { action: 'send_shipping_offer', discountRecommended: false };

    case 'low_purchase_intent':
      return intentScore < 10
        ? { action: 'no_action', discountRecommended: false }
        : { action: 'send_personalized_reminder', discountRecommended: false };

    default:
      return { action: 'send_personalized_reminder', discountRecommended: false };
  }
}

function computeRecoveryProbability(
  reason: AbandonmentReason,
  signals: ScoringSignals,
  action: RecoveryAction
): number {
  const baseProbability: Record<AbandonmentReason, number> = {
    size_uncertainty: 75,
    product_confusion: 60,
    comparison_shopping: 55,
    price_sensitivity: 50,
    waiting_for_discount: 65,
    payment_issue: 70,
    shipping_cost: 60,
    low_purchase_intent: 20,
    technical_issue: 80,
  };

  let prob = baseProbability[reason] ?? 50;
  prob += signals.intentScore * 0.15;
  prob += signals.loyaltyScore * 0.1;
  prob -= signals.priceSensitivityScore * 0.05;

  if (action === 'no_action') prob *= 0.3;
  if (action === 'offer_discount') prob *= 1.1;

  return Math.max(5, Math.min(97, Math.round(prob)));
}

function buildExplanation(
  reason: AbandonmentReason,
  action: RecoveryAction,
  cart: AbandonedCart,
  signals: ScoringSignals
): string {
  const name = cart.customer.name.split(' ')[0];

  const explanations: Record<AbandonmentReason, string> = {
    size_uncertainty: `${name} viewed the size chart ${cart.behavior.sizeChartViews} times and spent ${cart.behavior.timeSpentMinutes} minutes browsing — a clear signal of genuine interest blocked by sizing uncertainty. A personalized size recommendation based on purchase history will remove this barrier without any price concession.`,

    product_confusion: `${name} viewed ${cart.behavior.productViews} product images and read ${cart.behavior.reviewsRead} reviews but didn't purchase — indicating confusion about specifications or fit for their use case. ${action === 'answer_product_concern' ? 'Answering their likely product questions directly will convert this cart.' : 'Recommending a better-matched alternative removes the decision friction.'}`,

    comparison_shopping: `${name} performed ${cart.behavior.compareActions} comparison action${cart.behavior.compareActions !== 1 ? 's' : ''} across ${cart.behavior.productViews} product views — actively evaluating alternatives. ${signals.loyaltyScore > 35 ? `Their loyalty score of ${signals.loyaltyScore} justifies highlighting unique product value. ${action === 'offer_discount' ? 'A targeted loyalty discount will close this against competitors.' : 'A well-timed reminder emphasizing quality and trust will re-engage them.'}` : 'A personalized reminder emphasizing product uniqueness and availability may bring them back.'}`,

    price_sensitivity: `${name} is a ${cart.customer.segment} customer with a ₹${cart.cartValue.toLocaleString('en-IN')} cart. ${signals.priceSensitivityScore > 60 ? `Price sensitivity score of ${signals.priceSensitivityScore} is high — this cart value exceeds their typical spend pattern. ${action === 'recommend_alternative' ? 'Recommending a comparable product at a lower price point will convert without margin loss.' : 'A loyalty-based discount is warranted given their purchase history.'}` : 'A timely reminder about product quality and limited availability should be sufficient to convert.'}`,

    waiting_for_discount: `${name} has ${cart.abandonmentHistory} recorded abandonment${cart.abandonmentHistory !== 1 ? 's' : ''} — a behavioral pattern suggesting they wait for offers. ${signals.loyaltyScore > 50 ? `Loyalty score ${signals.loyaltyScore} confirms genuine purchase intent. A modest one-time loyalty discount will convert this cart and reinforce positive behavior.` : `Loyalty score ${signals.loyaltyScore} is insufficient to justify a discount. A value-focused reminder — not a discount — avoids training further discount-seeking behavior.`}`,

    payment_issue: `${name}'s session lasted only ${cart.behavior.timeSpentMinutes} minutes with minimal browsing engagement (${cart.behavior.productViews} product views) — indicating the abandonment likely occurred at the payment step due to a technical or payment method issue, not a purchase decision. Offering alternative payment options or a direct checkout link will recover this cart immediately.`,

    shipping_cost: `${name} browsed on ${cart.deviceType} and dropped off after a short session — a strong signal of checkout abandonment due to unexpected shipping costs. A free shipping offer removes the final barrier to purchase for this ₹${cart.cartValue.toLocaleString('en-IN')} cart.`,

    low_purchase_intent: `${name} showed low engagement signals — ${cart.behavior.productViews} product views, ${cart.behavior.timeSpentMinutes} minutes on site, no wishlist add. The intent score of ${signals.intentScore} suggests this was exploratory browsing rather than purchase intent. ${action === 'no_action' ? 'Outreach cost would likely exceed the expected conversion value at this stage.' : 'A lightweight, non-intrusive reminder may catch them if intent returns.'}`,

    technical_issue: `${name} likely experienced a technical issue during checkout. An immediate follow-up with a direct purchase link will recover this cart efficiently.`,
  };

  return explanations[reason] ?? `${name} abandoned their cart. A personalized recovery outreach is recommended.`;
}

export function computeRevenueImpact(
  cart: AbandonedCart,
  decision: Pick<AIDecision, 'recoveryProbability' | 'discountRecommended' | 'discountAmount'>
): RevenueImpact {
  const expectedRecovery = Math.round((cart.cartValue * decision.recoveryProbability) / 100);
  const discountCost = decision.discountRecommended && decision.discountAmount
    ? Math.round((cart.cartValue * decision.discountAmount) / 100)
    : 0;
  const marginSaved = decision.discountRecommended ? 0 : Math.round(cart.cartValue * 0.12);
  const netRevenueImpact = expectedRecovery - discountCost;

  let roiLabel: string;
  if (decision.recoveryProbability >= 75) {
    roiLabel = 'High ROI — strong recovery signal';
  } else if (decision.recoveryProbability >= 50) {
    roiLabel = 'Moderate ROI — worth pursuing';
  } else if (decision.recoveryProbability >= 30) {
    roiLabel = 'Low ROI — proceed selectively';
  } else {
    roiLabel = 'Minimal ROI — consider skipping';
  }

  return { expectedRecovery, marginSaved, discountCost, netRevenueImpact, roiLabel };
}

/**
 * Synchronous version — used to pre-populate mockData at module load time.
 * Identical logic to analyzeCart() but synchronous (no await).
 */
export function analyzeCartSync(cart: AbandonedCart): AIDecision {
  const signals = computeSignals(cart);
  const reason = detectReason(signals, cart);
  const { action, discountRecommended, discountAmount } = chooseAction(reason, signals, cart);
  const recoveryProbability = computeRecoveryProbability(reason, signals, action);
  const explanation = buildExplanation(reason, action, cart, signals);

  // Deterministic confidence — based purely on signals, no Math.random()
  const confidence = Math.min(
    97,
    Math.round(60 + signals.engagementScore * 0.15 + signals.intentScore * 0.1)
  );

  return {
    reason,
    confidence,
    recoveryProbability,
    recommendedAction: action,
    explanation,
    discountRecommended,
    discountAmount,
  };
}

/**
 * Async entry point — kept for CartDetail "Analyze with AI" button.
 * Simulates a real API call with a realistic delay.
 * Replace body with: return await callLLMAPI(cart);
 */
export async function analyzeCart(cart: AbandonedCart): Promise<AIDecision> {
  // Simulate API latency (800ms–1.4s feels realistic for an AI call)
  const delay = 800 + Math.floor((cart.cartValue % 7) * 89);
  await new Promise((resolve) => setTimeout(resolve, delay));
  return analyzeCartSync(cart);
}

export const ACTION_LABELS: Record<RecoveryAction, string> = {
  send_size_recommendation: 'Size Recommendation',
  send_price_match: 'Price Match Alert',
  offer_discount: 'Offer Discount',
  answer_product_concern: 'Answer Concern',
  recommend_alternative: 'Recommend Alternative',
  send_personalized_reminder: 'Personalized Reminder',
  no_action: 'No Action',
  offer_payment_options: 'Payment Options',
  send_shipping_offer: 'Free Shipping Offer',
};

export const REASON_LABELS: Record<AbandonmentReason, string> = {
  price_sensitivity: 'Price Sensitivity',
  size_uncertainty: 'Size Uncertainty',
  product_confusion: 'Product Confusion',
  payment_issue: 'Payment Issue',
  comparison_shopping: 'Comparison Shopping',
  waiting_for_discount: 'Waiting for Discount',
  low_purchase_intent: 'Low Purchase Intent',
  shipping_cost: 'Shipping Cost',
  technical_issue: 'Technical Issue',
};
