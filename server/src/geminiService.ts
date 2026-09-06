import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  AbandonmentReason,
  RecoveryAction,
} from './types';

// ─── Constants ────────────────────────────────────────────────────────────────

const VALID_REASONS: AbandonmentReason[] = [
  'price_sensitivity', 'size_uncertainty', 'product_confusion',
  'payment_issue', 'comparison_shopping', 'waiting_for_discount',
  'low_purchase_intent', 'shipping_cost', 'technical_issue',
];

const VALID_ACTIONS: RecoveryAction[] = [
  'send_size_recommendation', 'send_price_match', 'offer_discount',
  'answer_product_concern', 'recommend_alternative', 'send_personalized_reminder',
  'no_action', 'offer_payment_options', 'send_shipping_offer',
];

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// ─── Prompt ───────────────────────────────────────────────────────────────────

function buildPrompt(req: AnalyzeRequest): string {
  const firstName = req.customerName.split(' ')[0];

  return `You are CartGhost, an e-commerce cart recovery AI. Analyze this abandoned cart data and return ONLY a raw JSON object with no markdown, no code fences, no explanation text — just the JSON.

CUSTOMER:
Name: ${req.customerName} (call them "${firstName}" in the explanation)
Segment: ${req.customerSegment} | Orders: ${req.customerTotalOrders} | Lifetime spend: Rs.${req.customerTotalSpent} | City: ${req.customerCity}

CART:
Product: ${req.productName} by ${req.productBrand} (${req.productCategory})
Value: Rs.${req.cartValue} | Device: ${req.deviceType} | Source: ${req.source}

BEHAVIOR THIS SESSION:
Time on site: ${req.timeSpentMinutes} min | Product views: ${req.productViews} | Size chart views: ${req.sizeChartViews}
Reviews read: ${req.reviewsRead} | Photos viewed: ${req.photosViewed} | Comparison actions: ${req.compareActions}
Added to wishlist: ${req.addToWishlist} | Return visits: ${req.returnVisits}

HISTORY:
Category purchases: ${req.previousPurchases} | Abandonment history: ${req.abandonmentHistory}

RULES:
- reason: exactly one of: price_sensitivity, size_uncertainty, product_confusion, payment_issue, comparison_shopping, waiting_for_discount, low_purchase_intent, shipping_cost, technical_issue
- recommendedAction: exactly one of: send_personalized_reminder, send_size_recommendation, recommend_alternative, answer_product_concern, offer_discount, offer_payment_options, send_shipping_offer, no_action
- Only set discountRecommended=true if customer has 5+ orders AND is clearly price-blocked. Prefer non-discount actions.
- discountAmount: only 5, 8, or 10 (integer) if discount recommended, otherwise null
- confidence: integer 50–97
- recoveryProbability: integer 5–97
- explanation: 1 concise sentence (max 25 words) referencing the customer by first name and 1-2 specific data points

Return ONLY this JSON and nothing else:
{"reason":"...","confidence":0,"recoveryProbability":0,"recommendedAction":"...","explanation":"...","discountRecommended":false,"discountAmount":null}`;
}

// ─── Response parser ──────────────────────────────────────────────────────────

interface RawGeminiOutput {
  reason?: unknown;
  confidence?: unknown;
  recoveryProbability?: unknown;
  recommendedAction?: unknown;
  explanation?: unknown;
  discountRecommended?: unknown;
  discountAmount?: unknown;
}

/**
 * Extract the first complete JSON object from a string.
 * Handles cases where Gemini prepends/appends text, adds markdown fences,
 * or includes thinking tokens before the JSON.
 */
function extractJSON(raw: string): string {
  // 1. Strip markdown code fences (```json ... ``` or ``` ... ```)
  let text = raw
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/gi, '')
    .trim();

  // 2. Find the first { and the matching last } in the string
  const start = text.indexOf('{');
  const end = text.lastIndexOf('}');

  if (start === -1 || end === -1 || end <= start) {
    throw new Error(`No JSON object found in response: ${raw.slice(0, 300)}`);
  }

  return text.slice(start, end + 1);
}

function parseAndValidate(raw: string, req: AnalyzeRequest): AnalyzeResponse {
  // Log the raw response for debugging (truncated to avoid noise)
  console.log(`[CartGhost] Gemini raw response (${raw.length} chars):`, raw.slice(0, 500));

  let jsonStr: string;
  try {
    jsonStr = extractJSON(raw);
  } catch (e) {
    throw new Error(`Could not extract JSON: ${(e as Error).message}`);
  }

  let parsed: RawGeminiOutput;
  try {
    parsed = JSON.parse(jsonStr) as RawGeminiOutput;
  } catch (e) {
    throw new Error(`JSON parse failed on: ${jsonStr.slice(0, 300)}\nError: ${(e as Error).message}`);
  }

  // Validate reason
  const reason: AbandonmentReason =
    typeof parsed.reason === 'string' && VALID_REASONS.includes(parsed.reason as AbandonmentReason)
      ? (parsed.reason as AbandonmentReason)
      : 'price_sensitivity';

  if (reason !== parsed.reason) {
    console.warn(`[CartGhost] Invalid reason "${String(parsed.reason)}", defaulting to price_sensitivity`);
  }

  // Validate action
  const recommendedAction: RecoveryAction =
    typeof parsed.recommendedAction === 'string' && VALID_ACTIONS.includes(parsed.recommendedAction as RecoveryAction)
      ? (parsed.recommendedAction as RecoveryAction)
      : 'send_personalized_reminder';

  // Validate numbers — Gemini sometimes returns strings like "85"
  const rawConfidence = typeof parsed.confidence === 'number'
    ? parsed.confidence
    : typeof parsed.confidence === 'string' ? parseInt(parsed.confidence as string, 10) : 72;
  const confidence = isNaN(rawConfidence) ? 72 : clamp(Math.round(rawConfidence), 50, 97);

  const rawProb = typeof parsed.recoveryProbability === 'number'
    ? parsed.recoveryProbability
    : typeof parsed.recoveryProbability === 'string' ? parseInt(parsed.recoveryProbability as string, 10) : 55;
  const recoveryProbability = isNaN(rawProb) ? 55 : clamp(Math.round(rawProb), 5, 97);

  // Validate explanation
  const explanation =
    typeof parsed.explanation === 'string' && parsed.explanation.trim().length > 10
      ? parsed.explanation.trim()
      : `${req.customerName.split(' ')[0]} abandoned the cart. A personalized recovery outreach is recommended.`;

  // Validate discount — only allow if explicitly true
  const discountRecommended = parsed.discountRecommended === true || parsed.discountRecommended === 'true';

  const rawAmount =
    typeof parsed.discountAmount === 'number'
      ? parsed.discountAmount
      : typeof parsed.discountAmount === 'string' && parsed.discountAmount !== 'null'
      ? parseInt(parsed.discountAmount as string, 10)
      : null;

  const discountAmount: number | undefined =
    discountRecommended && rawAmount !== null && !isNaN(rawAmount as number) && [5, 8, 10].includes(rawAmount as number)
      ? (rawAmount as number)
      : discountRecommended
      ? 5        // default to minimum if value is missing/invalid
      : undefined;

  console.log(`[CartGhost] Parsed decision: reason=${reason}, action=${recommendedAction}, prob=${recoveryProbability}%, discount=${discountRecommended}`);

  return {
    success: true,
    source: 'gemini',
    reason,
    confidence,
    recoveryProbability,
    recommendedAction,
    explanation,
    discountRecommended,
    discountAmount,
  };
}

// ─── Main export ──────────────────────────────────────────────────────────────

export async function analyzeWithGemini(
  req: AnalyzeRequest,
  apiKey: string
): Promise<AnalyzeResponse> {
  const genAI = new GoogleGenerativeAI(apiKey);

  const model = genAI.getGenerativeModel({
    model: 'gemini-3.5-flash',
    generationConfig: {
      temperature: 0.2,
      maxOutputTokens: 2048,   // must be large enough for the full JSON + explanation
    },
  });

  const prompt = buildPrompt(req);
  const result = await model.generateContent(prompt);
  const text = result.response.text();

  return parseAndValidate(text, req);
}
