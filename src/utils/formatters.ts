import type { AbandonmentReason, RecoveryAction, ActionStatus } from '../types';

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('en-IN').format(n);
}

export function formatTimeAgo(isoString: string): string {
  const diff = Date.now() - new Date(isoString).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  const days = Math.floor(hrs / 24);
  return `${days}d ago`;
}

export function formatDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export const REASON_LABELS: Record<AbandonmentReason, string> = {
  price_sensitivity: 'Price Sensitivity',
  size_uncertainty: 'Size Uncertainty',
  product_confusion: 'Product Confusion',
  payment_issue: 'Payment Issue',
  comparison_shopping: 'Comparison Shopping',
  waiting_for_discount: 'Waiting for Discount',
  low_purchase_intent: 'Low Intent',
  shipping_cost: 'Shipping Cost',
  technical_issue: 'Technical Issue',
};

export const ACTION_LABELS: Record<RecoveryAction, string> = {
  send_size_recommendation: 'Size Recommendation',
  send_price_match: 'Price Match',
  offer_discount: 'Offer Discount',
  answer_product_concern: 'Answer Concern',
  recommend_alternative: 'Recommend Alternative',
  send_personalized_reminder: 'Personalized Reminder',
  no_action: 'No Action',
  offer_payment_options: 'Payment Options',
  send_shipping_offer: 'Free Shipping',
};

export const STATUS_LABELS: Record<ActionStatus, string> = {
  pending: 'Pending',
  sent: 'Sent',
  converted: 'Converted',
  ignored: 'Ignored',
  failed: 'Failed',
};

export const REASON_COLORS: Record<AbandonmentReason, string> = {
  price_sensitivity: 'bg-orange-100 text-orange-700',
  size_uncertainty: 'bg-blue-100 text-blue-700',
  product_confusion: 'bg-purple-100 text-purple-700',
  payment_issue: 'bg-red-100 text-red-700',
  comparison_shopping: 'bg-yellow-100 text-yellow-700',
  waiting_for_discount: 'bg-pink-100 text-pink-700',
  low_purchase_intent: 'bg-gray-100 text-gray-600',
  shipping_cost: 'bg-teal-100 text-teal-700',
  technical_issue: 'bg-red-100 text-red-700',
};

export const STATUS_COLORS: Record<ActionStatus, string> = {
  pending: 'bg-yellow-100 text-yellow-700',
  sent: 'bg-blue-100 text-blue-700',
  converted: 'bg-green-100 text-green-700',
  ignored: 'bg-gray-100 text-gray-500',
  failed: 'bg-red-100 text-red-700',
};

export function getRecoveryColor(prob: number): string {
  if (prob >= 75) return 'text-green-600';
  if (prob >= 50) return 'text-yellow-600';
  if (prob >= 30) return 'text-orange-600';
  return 'text-red-600';
}

export function getRecoveryBgColor(prob: number): string {
  if (prob >= 75) return 'bg-green-500';
  if (prob >= 50) return 'bg-yellow-500';
  if (prob >= 30) return 'bg-orange-500';
  return 'bg-red-500';
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

export function getSegmentColor(segment: string): string {
  switch (segment) {
    case 'loyal': return 'bg-brand-100 text-brand-700';
    case 'returning': return 'bg-green-100 text-green-700';
    case 'new': return 'bg-blue-100 text-blue-700';
    case 'at_risk': return 'bg-red-100 text-red-700';
    default: return 'bg-gray-100 text-gray-700';
  }
}
