// Shared types used by the Express server.
// These mirror the frontend types exactly so the API contract is type-safe on both sides.

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

// What the frontend sends to /api/analyze
export interface AnalyzeRequest {
  cartId: string;
  customerName: string;
  customerSegment: 'new' | 'returning' | 'loyal' | 'at_risk';
  customerTotalOrders: number;
  customerTotalSpent: number;
  customerCity: string;
  cartValue: number;
  productName: string;
  productCategory: string;
  productBrand: string;
  timeSpentMinutes: number;
  productViews: number;
  sizeChartViews: number;
  reviewsRead: number;
  photosViewed: number;
  compareActions: number;
  addToWishlist: boolean;
  returnVisits: number;
  previousPurchases: number;
  abandonmentHistory: number;
  deviceType: 'mobile' | 'desktop' | 'tablet';
  source: 'organic' | 'paid' | 'email' | 'social' | 'direct';
}

// What the server returns
export interface AnalyzeResponse {
  success: true;
  source: 'gemini' | 'fallback';
  reason: AbandonmentReason;
  confidence: number;
  recoveryProbability: number;
  recommendedAction: RecoveryAction;
  explanation: string;
  discountRecommended: boolean;
  discountAmount?: number;
}

export interface AnalyzeErrorResponse {
  success: false;
  error: string;
  source: 'fallback';
}
