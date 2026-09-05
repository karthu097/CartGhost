export type AbandonmentReason =
  | 'price_sensitivity'
  | 'size_uncertainty'
  | 'product_confusion'
  | 'payment_issue'
  | 'comparison_shopping'
  | 'waiting_for_discount'
  | 'low_purchase_intent'
  | 'shipping_cost'
  | 'technical_issue';

export type RecoveryAction =
  | 'send_size_recommendation'
  | 'send_price_match'
  | 'offer_discount'
  | 'answer_product_concern'
  | 'recommend_alternative'
  | 'send_personalized_reminder'
  | 'no_action'
  | 'offer_payment_options'
  | 'send_shipping_offer';

export type ActionStatus = 'pending' | 'sent' | 'converted' | 'ignored' | 'failed';

export interface AIDecision {
  reason: AbandonmentReason;
  confidence: number; // 0-100
  recoveryProbability: number; // 0-100
  recommendedAction: RecoveryAction;
  explanation: string;
  discountRecommended: boolean;
  discountAmount?: number; // percentage, only if discountRecommended
}

export interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  imageUrl?: string;
  brand: string;
  sku: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  subtotal: number;
}

export interface Customer {
  id: string;
  name: string;
  email: string;
  phone?: string;
  city: string;
  age: number;
  segment: 'new' | 'returning' | 'loyal' | 'at_risk';
  totalOrders: number;
  totalSpent: number;
  joinedDate: string;
  avatar?: string;
}

export interface BrowsingBehavior {
  timeSpentMinutes: number;
  productViews: number;
  sizeChartViews: number;
  reviewsRead: number;
  photosViewed: number;
  compareActions: number;
  addToWishlist: boolean;
  returnVisits: number;
}

export interface AbandonedCart {
  id: string;
  customer: Customer;
  items: CartItem[];
  cartValue: number;
  abandonedAt: string;
  sessionDuration: number; // minutes
  behavior: BrowsingBehavior;
  previousPurchases: number;
  abandonmentHistory: number; // how many times this customer has abandoned
  deviceType: 'mobile' | 'desktop' | 'tablet';
  source: 'organic' | 'paid' | 'email' | 'social' | 'direct';
  aiDecision: AIDecision;
  actionStatus: ActionStatus;
  recoveredRevenue?: number;
}

export interface DashboardStats {
  totalAbandonedValue: number;
  recoverableRevenue: number;
  recoveryRate: number;
  totalAbandonedCarts: number;
  aiSuccessRate: number;
  averageCartValue: number;
  cartsRecoveredToday: number;
  discountsAvoided: number;
}

export interface RevenueDataPoint {
  date: string;
  abandoned: number;
  recovered: number;
  potential: number;
}

export interface ActionBreakdown {
  action: RecoveryAction;
  count: number;
  successRate: number;
  revenueRecovered: number;
}
