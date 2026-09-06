import { useParams, useNavigate } from 'react-router-dom';
import { useState, useCallback } from 'react';
import {
  ArrowLeft, Eye, Clock, ShoppingBag, History,
  Smartphone, Monitor, Tablet, Brain, CheckCircle, XCircle,
  Percent, Star, MessageSquare, Send, Package, MapPin, Mail,
  TrendingUp, Zap, RefreshCw, IndianRupee, BarChart2, ShieldCheck,
  AlertCircle, Sparkles, Cpu,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Avatar from '../components/ui/Avatar';
import ProgressBar from '../components/ui/ProgressBar';
import LoadingSpinner from '../components/ui/LoadingSpinner';
import { useCartStore } from '../store/CartStore';
import {
  analyzeCart,
  computeSignals,
  computeRevenueImpact,
  type ScoringSignals,
  type RevenueImpact,
} from '../engine/aiDecisionEngine';
import type { AIDecision, AbandonedCart, ActionStatus } from '../types';
import type { AISource } from '../services/aiService';
import {
  formatCurrency, formatDate, formatTimeAgo,
  REASON_LABELS, REASON_COLORS, ACTION_LABELS,
  STATUS_COLORS, STATUS_LABELS, getRecoveryColor, getSegmentColor,
} from '../utils/formatters';

// ─── helpers ─────────────────────────────────────────────────────────────────

function DeviceIcon({ device }: { device: AbandonedCart['deviceType'] }) {
  if (device === 'mobile') return <Smartphone className="w-4 h-4" />;
  if (device === 'tablet') return <Tablet className="w-4 h-4" />;
  return <Monitor className="w-4 h-4" />;
}

function BehaviorRow({ label, value, icon, highlight = false }: {
  label: string; value: string | number; icon: React.ReactNode; highlight?: boolean;
}) {
  return (
    <div className={`flex items-center justify-between py-2.5 border-b border-slate-50 last:border-0 ${highlight ? 'bg-amber-50/60 -mx-3 px-3 rounded-lg' : ''}`}>
      <div className="flex items-center gap-2.5 text-slate-600">
        <span className={highlight ? 'text-amber-500' : 'text-slate-400'}>{icon}</span>
        <span className="text-sm">{label}</span>
      </div>
      <span className={`text-sm font-semibold ${highlight ? 'text-amber-700' : 'text-slate-900'}`}>{value}</span>
    </div>
  );
}

function SignalBar({ label, value, color, description }: {
  label: string; value: number; color: string; description: string;
}) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-slate-700">{label}</span>
        <span className="text-xs font-bold text-slate-900">{value}/100</span>
      </div>
      <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-700 ${color}`} style={{ width: `${value}%` }} />
      </div>
      <p className="text-xs text-slate-400">{description}</p>
    </div>
  );
}

function SourceBadge({ source }: { source: AISource }) {
  if (source === 'gemini') {
    return (
      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-gradient-to-r from-blue-100 to-purple-100 text-purple-700 border border-purple-200">
        <Sparkles className="w-3 h-3" />Gemini AI
      </span>
    );
  }
  return (
    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-600 border border-slate-200">
      <Cpu className="w-3 h-3" />Demo Engine
    </span>
  );
}

const BASE_STEPS = [
  { label: 'Reading browsing signals…', icon: Eye },
  { label: 'Scoring customer intent…', icon: BarChart2 },
  { label: 'Detecting abandonment reason…', icon: Brain },
  { label: 'Evaluating discount necessity…', icon: Percent },
  { label: 'Computing recovery probability…', icon: TrendingUp },
  { label: 'Generating recommendation…', icon: Zap },
];

const GEMINI_STEPS = [
  { label: 'Reading browsing signals…', icon: Eye },
  { label: 'Sending to Gemini AI…', icon: Sparkles },
  { label: 'Gemini analysing behaviour…', icon: Brain },
  { label: 'Evaluating discount necessity…', icon: Percent },
  { label: 'Computing recovery probability…', icon: TrendingUp },
  { label: 'Parsing Gemini recommendation…', icon: Zap },
];

function AnalysisAnimation({ step, isGemini }: { step: number; isGemini: boolean }) {
  const steps = isGemini ? GEMINI_STEPS : BASE_STEPS;
  return (
    <div className="space-y-2 py-2">
      {steps.map((s, i) => {
        const done = i < step;
        const active = i === step;
        const Icon = s.icon;
        return (
          <div key={i} className={`flex items-center gap-3 transition-opacity duration-300 ${i > step ? 'opacity-30' : 'opacity-100'}`}>
            <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${done ? 'bg-green-100' : active ? 'bg-brand-100 animate-pulse' : 'bg-slate-100'}`}>
              {done
                ? <CheckCircle className="w-3.5 h-3.5 text-green-500" />
                : <Icon className={`w-3.5 h-3.5 ${active ? 'text-brand-600' : 'text-slate-400'}`} />}
            </div>
            <span className={`text-sm ${active ? 'text-brand-700 font-medium' : done ? 'text-slate-500' : 'text-slate-400'}`}>
              {s.label}
            </span>
            {active && <LoadingSpinner size="sm" className="ml-auto" />}
          </div>
        );
      })}
    </div>
  );
}

// ─── Status label helpers ─────────────────────────────────────────────────────

const ALREADY_ACTIONED_STATUSES: ActionStatus[] = ['sent', 'converted', 'failed', 'ignored'];

function actionButtonLabel(status: ActionStatus, defaultLabel: string): string {
  if (status === 'sent') return 'Already Sent';
  if (status === 'converted') return 'Already Converted';
  if (status === 'ignored') return 'Marked Ignored';
  if (status === 'failed') return 'Action Failed';
  return defaultLabel;
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type AnalysisState = 'idle' | 'running' | 'done' | 'error';

export default function CartDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { carts, updateCartStatus, updateCartDecision } = useCartStore();

  const [analysisState, setAnalysisState] = useState<AnalysisState>('idle');
  const [analysisStep, setAnalysisStep] = useState(0);
  const [liveDecision, setLiveDecision] = useState<AIDecision | null>(null);
  const [aiSource, setAiSource] = useState<AISource>('fallback');
  const [isGeminiMode, setIsGeminiMode] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  // Read from store (live, reflects any mutations)
  const cart = carts.find((c) => c.id === id);

  const handleAnalyze = useCallback(async () => {
    if (!cart) return;
    setAnalysisState('running');
    setAnalysisStep(0);
    setLiveDecision(null);
    setErrorMsg('');

    let usingGemini = false;
    try {
      const hRes = await fetch('/api/health', { signal: AbortSignal.timeout(2000) });
      if (hRes.ok) {
        const h = await hRes.json() as { geminiConfigured?: boolean };
        usingGemini = h.geminiConfigured === true;
      }
    } catch { /* fallback */ }
    setIsGeminiMode(usingGemini);

    let step = 0;
    const stepMs = usingGemini ? 500 : 180;
    const stepInterval = setInterval(() => {
      step = Math.min(step + 1, BASE_STEPS.length - 1);
      setAnalysisStep(step);
    }, stepMs);

    try {
      const { decision, source } = await analyzeCart(cart);
      clearInterval(stepInterval);
      setAnalysisStep(BASE_STEPS.length);
      await new Promise((r) => setTimeout(r, 250));
      setLiveDecision(decision);
      setAiSource(source);
      // Persist the live Gemini decision back into the store
      updateCartDecision(cart.id, decision);
      setAnalysisState('done');
    } catch (err) {
      clearInterval(stepInterval);
      const msg = err instanceof Error ? err.message : 'Unknown error';
      setErrorMsg(`Analysis failed: ${msg}. Please try again.`);
      setAnalysisState('error');
    }
  }, [cart, updateCartDecision]);

  if (!cart) {
    return (
      <div className="p-6">
        <button onClick={() => navigate('/carts')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-700 mb-4">
          <ArrowLeft className="w-4 h-4" /> Back to carts
        </button>
        <div className="card p-12 text-center">
          <AlertCircle className="w-8 h-8 text-slate-300 mx-auto mb-3" />
          <p className="text-slate-500">Cart not found.</p>
        </div>
      </div>
    );
  }

  const { customer, items, behavior } = cart;
  const product = items[0]?.product;
  const decision = liveDecision ?? cart.aiDecision;
  const signals: ScoringSignals = computeSignals(cart);
  const impact: RevenueImpact = computeRevenueImpact(cart, decision);
  const isAnalyzing = analysisState === 'running';
  const hasAnalyzed = analysisState === 'done';
  const displaySource: AISource = hasAnalyzed ? aiSource : 'fallback';

  const isAlreadyActioned = ALREADY_ACTIONED_STATUSES.includes(cart.actionStatus);

  const handleSendAction = () => {
    if (isAlreadyActioned) return;
    updateCartStatus(cart.id, 'sent');
  };

  const handleSendDiscount = () => {
    if (isAlreadyActioned) return;
    updateCartStatus(cart.id, 'sent');
  };

  const handleMarkConverted = () => {
    if (cart.actionStatus === 'converted') return;
    updateCartStatus(cart.id, 'converted', cart.cartValue);
  };

  const handleMarkLost = () => {
    if (cart.actionStatus === 'ignored') return;
    updateCartStatus(cart.id, 'ignored');
  };

  return (
    <div>
      <Header title="Cart Analysis" subtitle={`${customer.name} · ${product?.name}`} />
      <div className="p-6 space-y-6">
        <button onClick={() => navigate('/carts')} className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-900 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to Abandoned Carts
        </button>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left column ───────────────────────────────────── */}
          <div className="lg:col-span-1 space-y-5">

            {/* Customer */}
            <div className="card p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Customer Profile</h3>
              <div className="flex items-center gap-3 mb-4">
                <Avatar name={customer.name} size="lg" />
                <div>
                  <p className="font-semibold text-slate-900">{customer.name}</p>
                  <span className={`badge text-xs ${getSegmentColor(customer.segment)}`}>
                    {customer.segment.replace('_', ' ').replace(/\b\w/g, (l) => l.toUpperCase())} Customer
                  </span>
                </div>
              </div>
              <div className="space-y-2.5">
                {[
                  { icon: <Mail className="w-3.5 h-3.5 text-slate-400" />, text: customer.email },
                  { icon: <MapPin className="w-3.5 h-3.5 text-slate-400" />, text: `${customer.city} · Age ${customer.age}` },
                  { icon: <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />, text: `${customer.totalOrders} orders · ${formatCurrency(customer.totalSpent)} spent` },
                  { icon: <History className="w-3.5 h-3.5 text-slate-400" />, text: `${cart.abandonmentHistory} previous abandonment${cart.abandonmentHistory !== 1 ? 's' : ''}` },
                  { icon: <DeviceIcon device={cart.deviceType} />, text: `${cart.deviceType} · ${cart.source} traffic` },
                  { icon: <Clock className="w-3.5 h-3.5 text-slate-400" />, text: `Member since ${formatDate(customer.joinedDate)}` },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 text-sm text-slate-600">
                    {item.icon}<span className="truncate">{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart contents */}
            <div className="card p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-4">Cart Contents</h3>
              {items.map((item) => (
                <div key={item.product.id} className="flex gap-3">
                  <div className="w-12 h-12 bg-slate-100 rounded-lg flex items-center justify-center shrink-0">
                    <Package className="w-6 h-6 text-slate-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-slate-900">{item.product.name}</p>
                    <p className="text-xs text-slate-500">{item.product.brand} · {item.product.category}</p>
                    <p className="text-xs text-slate-400 mt-0.5">SKU: {item.product.sku}</p>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-xs text-slate-500">Qty: {item.quantity}</span>
                      <span className="text-sm font-bold text-slate-900">{formatCurrency(item.subtotal)}</span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="mt-4 pt-3 border-t border-slate-100 flex justify-between">
                <span className="text-sm font-medium text-slate-600">Cart Total</span>
                <span className="text-base font-bold text-slate-900">{formatCurrency(cart.cartValue)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-slate-400">
                <span>Abandoned {formatTimeAgo(cart.abandonedAt)}</span>
                <span className={`badge ${STATUS_COLORS[cart.actionStatus]}`}>{STATUS_LABELS[cart.actionStatus]}</span>
              </div>
            </div>

            {/* Browsing behavior */}
            <div className="card p-5">
              <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Browsing Behavior</h3>
              <BehaviorRow label="Time on site" value={`${behavior.timeSpentMinutes} min`} icon={<Clock className="w-4 h-4" />} highlight={behavior.timeSpentMinutes > 15} />
              <BehaviorRow label="Product views" value={behavior.productViews} icon={<Eye className="w-4 h-4" />} highlight={behavior.productViews > 10} />
              <BehaviorRow label="Size chart views" value={behavior.sizeChartViews} icon={<Eye className="w-4 h-4" />} highlight={behavior.sizeChartViews > 2} />
              <BehaviorRow label="Reviews read" value={behavior.reviewsRead} icon={<Star className="w-4 h-4" />} highlight={behavior.reviewsRead > 5} />
              <BehaviorRow label="Photos viewed" value={behavior.photosViewed} icon={<Eye className="w-4 h-4" />} />
              <BehaviorRow label="Compare actions" value={behavior.compareActions} icon={<MessageSquare className="w-4 h-4" />} highlight={behavior.compareActions > 0} />
              <BehaviorRow label="Return visits" value={behavior.returnVisits} icon={<History className="w-4 h-4" />} highlight={behavior.returnVisits > 1} />
              <BehaviorRow label="Added to wishlist" value={behavior.addToWishlist ? 'Yes' : 'No'} icon={<Star className="w-4 h-4" />} highlight={behavior.addToWishlist} />
              <BehaviorRow label="Previous purchases" value={cart.previousPurchases} icon={<ShoppingBag className="w-4 h-4" />} />
            </div>
          </div>

          {/* ── Right column ────────────────────────────────── */}
          <div className="lg:col-span-2 space-y-5">

            {/* AI Analysis */}
            <div className="card p-5">
              <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
                <div className="flex items-center gap-2 flex-wrap">
                  <Brain className="w-5 h-5 text-brand-600" />
                  <h3 className="text-sm font-semibold text-slate-900">AI Analysis</h3>
                  {!isAnalyzing && <SourceBadge source={displaySource} />}
                  {isAnalyzing && (
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold bg-brand-50 text-brand-600 border border-brand-100 animate-pulse">
                      {isGeminiMode ? <Sparkles className="w-3 h-3" /> : <Cpu className="w-3 h-3" />}
                      {isGeminiMode ? 'Calling Gemini…' : 'Analysing…'}
                    </span>
                  )}
                </div>
                <button
                  onClick={handleAnalyze}
                  disabled={isAnalyzing}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    isAnalyzing
                      ? 'bg-brand-100 text-brand-400 cursor-not-allowed'
                      : hasAnalyzed
                      ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      : 'bg-brand-600 text-white hover:bg-brand-700 shadow-sm shadow-brand-200'
                  }`}
                >
                  {isAnalyzing
                    ? <><LoadingSpinner size="sm" /> Analyzing…</>
                    : hasAnalyzed
                    ? <><RefreshCw className="w-4 h-4" /> Re-analyze</>
                    : <><Zap className="w-4 h-4" /> Analyze with AI</>}
                </button>
              </div>

              {isAnalyzing && <AnalysisAnimation step={analysisStep} isGemini={isGeminiMode} />}

              {analysisState === 'error' && (
                <div className="flex items-start gap-3 p-4 bg-red-50 border border-red-100 rounded-xl mb-4">
                  <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-700">Analysis failed</p>
                    <p className="text-xs text-red-600 mt-0.5">{errorMsg}</p>
                    <p className="text-xs text-slate-500 mt-1">Showing pre-computed results.</p>
                  </div>
                </div>
              )}

              {!isAnalyzing && (
                <>
                  {hasAnalyzed && aiSource === 'gemini' && (
                    <div className="mb-4 flex items-center gap-2 p-3 bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-100 rounded-xl">
                      <Sparkles className="w-4 h-4 text-purple-500 shrink-0" />
                      <p className="text-xs text-purple-700 font-medium">
                        Generated live by Google Gemini based on this customer's actual behavioral data.
                      </p>
                    </div>
                  )}
                  {hasAnalyzed && aiSource === 'fallback' && (
                    <div className="mb-4 flex items-center gap-2 p-3 bg-slate-50 border border-slate-200 rounded-xl">
                      <Cpu className="w-4 h-4 text-slate-400 shrink-0" />
                      <p className="text-xs text-slate-500">
                        Using local demo engine. Add <code className="bg-white px-1 rounded text-xs border">GEMINI_API_KEY</code> in <code className="bg-white px-1 rounded text-xs border">.env</code> to enable Gemini.
                      </p>
                    </div>
                  )}

                  <div className="grid grid-cols-3 gap-4 mb-5">
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <p className={`text-2xl font-bold ${getRecoveryColor(decision.recoveryProbability)}`}>
                        {decision.recoveryProbability}%
                      </p>
                      <p className="text-xs text-slate-500 mt-0.5">Recovery Probability</p>
                      <ProgressBar value={decision.recoveryProbability} colorByValue className="mt-2" />
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <p className="text-2xl font-bold text-slate-900">{decision.confidence}%</p>
                      <p className="text-xs text-slate-500 mt-0.5">AI Confidence</p>
                      <ProgressBar value={decision.confidence} color="bg-brand-500" className="mt-2" />
                    </div>
                    <div className="text-center p-3 bg-slate-50 rounded-xl">
                      <p className="text-2xl font-bold text-slate-900">{customer.totalOrders}</p>
                      <p className="text-xs text-slate-500 mt-0.5">Total Orders</p>
                      <div className="flex justify-center gap-0.5 mt-2">
                        {Array.from({ length: Math.min(5, customer.totalOrders) }).map((_, i) => (
                          <div key={i} className="w-2 h-2 bg-brand-400 rounded-full" />
                        ))}
                        {Array.from({ length: Math.max(0, 5 - Math.min(5, customer.totalOrders)) }).map((_, i) => (
                          <div key={i} className="w-2 h-2 bg-slate-200 rounded-full" />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 p-3 bg-orange-50 border border-orange-100 rounded-xl">
                    <AlertCircle className="w-4 h-4 text-orange-500 shrink-0" />
                    <span className={`badge mr-2 ${REASON_COLORS[decision.reason]}`}>
                      {REASON_LABELS[decision.reason]}
                    </span>
                    <span className="text-sm text-slate-700 font-medium">Detected abandonment reason</span>
                  </div>
                </>
              )}
            </div>

            {/* Signal scores */}
            {!isAnalyzing && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <BarChart2 className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Behavioral Signal Scores</h3>
                  <span className="text-xs text-slate-400 ml-1">Computed from raw browsing data</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  <SignalBar label="Purchase Intent" value={signals.intentScore} color="bg-brand-500" description="Browsing time, return visits, wishlist activity" />
                  <SignalBar label="Engagement Depth" value={signals.engagementScore} color="bg-purple-500" description="Photos viewed, reviews read, product views" />
                  <SignalBar label="Size / Product Uncertainty" value={signals.uncertaintyScore} color="bg-amber-500" description="Size chart opens, compare actions, review depth" />
                  <SignalBar label="Price Sensitivity" value={signals.priceSensitivityScore} color="bg-red-400" description="Cart value vs. spend history, customer segment" />
                  <SignalBar label="Customer Loyalty" value={signals.loyaltyScore} color="bg-green-500" description="Total orders, previous category purchases" />
                  <div className="flex flex-col justify-center space-y-2">
                    <p className="text-xs font-semibold text-slate-600">Signal Summary</p>
                    <div className="grid grid-cols-2 gap-1.5 text-xs">
                      {[
                        { label: 'High intent', val: signals.intentScore >= 50 },
                        { label: 'Size concern', val: signals.uncertaintyScore >= 30 },
                        { label: 'Price barrier', val: signals.priceSensitivityScore >= 50 },
                        { label: 'Loyal buyer', val: signals.loyaltyScore >= 40 },
                      ].map((f) => (
                        <span key={f.label} className={`flex items-center gap-1 px-2 py-1 rounded-md ${f.val ? 'bg-green-50 text-green-700' : 'bg-slate-50 text-slate-400'}`}>
                          {f.val ? <CheckCircle className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {f.label}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Recommendation */}
            {!isAnalyzing && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <Send className="w-5 h-5 text-brand-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Recommended Action</h3>
                  {hasAnalyzed && <SourceBadge source={aiSource} />}
                </div>
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 mb-4">
                  <p className="text-base font-bold text-brand-700 mb-1.5">{ACTION_LABELS[decision.recommendedAction]}</p>
                  <p className="text-sm text-brand-800 leading-relaxed">{decision.explanation}</p>
                </div>
                <div className={`flex items-start gap-3 p-4 rounded-xl border ${decision.discountRecommended ? 'bg-green-50 border-green-100' : 'bg-slate-50 border-slate-100'}`}>
                  {decision.discountRecommended ? (
                    <>
                      <CheckCircle className="w-5 h-5 text-green-500 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-green-800">Discount recommended — {decision.discountAmount}% off</p>
                        <p className="text-xs text-green-700 mt-0.5">
                          Customer loyalty (score {signals.loyaltyScore}) and cart value justify a limited-time {decision.discountAmount}% discount.
                          Estimated cost: {formatCurrency(impact.discountCost)}.
                        </p>
                      </div>
                    </>
                  ) : (
                    <>
                      <ShieldCheck className="w-5 h-5 text-slate-400 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-semibold text-slate-700">No discount required</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          AI determined recovery is achievable without a price concession — preserving ~{formatCurrency(impact.marginSaved)} in gross margin.
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
            )}

            {/* Revenue impact */}
            {!isAnalyzing && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <IndianRupee className="w-5 h-5 text-green-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Expected Revenue Impact</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                  {[
                    { label: 'Cart Value', value: formatCurrency(cart.cartValue), color: 'text-slate-900' },
                    { label: 'Expected Recovery', value: formatCurrency(impact.expectedRecovery), color: 'text-brand-600' },
                    { label: 'Discount Cost', value: formatCurrency(impact.discountCost), color: impact.discountCost > 0 ? 'text-red-500' : 'text-slate-400' },
                    { label: 'Net Impact', value: formatCurrency(impact.netRevenueImpact), color: 'text-green-600' },
                  ].map((m) => (
                    <div key={m.label} className="bg-slate-50 rounded-xl p-3 text-center">
                      <p className={`text-lg font-bold ${m.color}`}>{m.value}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{m.label}</p>
                    </div>
                  ))}
                </div>
                <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm ${decision.recoveryProbability >= 60 ? 'bg-green-50 text-green-700' : decision.recoveryProbability >= 35 ? 'bg-yellow-50 text-yellow-700' : 'bg-red-50 text-red-600'}`}>
                  <TrendingUp className="w-4 h-4 shrink-0" />
                  <span className="font-medium">{impact.roiLabel}</span>
                  <span className="text-slate-400 mx-1">·</span>
                  <span>{decision.recoveryProbability}% recovery probability</span>
                </div>
              </div>
            )}

            {/* Why this action */}
            {!isAnalyzing && (
              <div className="card p-5">
                <div className="flex items-center gap-2 mb-4">
                  <MessageSquare className="w-5 h-5 text-purple-600" />
                  <h3 className="text-sm font-semibold text-slate-900">Why This Action?</h3>
                </div>
                <div className="space-y-3">
                  {[
                    { icon: <Eye className="w-4 h-4 text-blue-500" />, label: 'Browsing signals', desc: `${behavior.productViews} product views · ${behavior.timeSpentMinutes} min session · ${behavior.sizeChartViews} size chart checks · ${behavior.compareActions} comparisons` },
                    { icon: <History className="w-4 h-4 text-orange-500" />, label: 'Purchase history', desc: `${customer.totalOrders} lifetime orders · ${cart.previousPurchases} purchases in category · ${cart.abandonmentHistory} previous abandonments` },
                    { icon: <Star className="w-4 h-4 text-yellow-500" />, label: 'Engagement depth', desc: `${behavior.reviewsRead} reviews read · ${behavior.photosViewed} photos viewed · Wishlist: ${behavior.addToWishlist ? 'Yes ✓' : 'No'} · ${behavior.returnVisits} return visits` },
                    { icon: <Percent className="w-4 h-4 text-green-500" />, label: 'Revenue optimization', desc: decision.discountRecommended ? `Discount justified — loyalty ${signals.loyaltyScore}. ${decision.discountAmount}% off recovers ${formatCurrency(impact.expectedRecovery)} at cost ${formatCurrency(impact.discountCost)}.` : `No discount — non-price barrier. Preserves ~${formatCurrency(impact.marginSaved)} margin targeting ${decision.recoveryProbability}% recovery.` },
                  ].map((item, i) => (
                    <div key={i} className="flex items-start gap-3 p-3 bg-slate-50 rounded-lg">
                      <span className="mt-0.5 shrink-0">{item.icon}</span>
                      <div>
                        <p className="text-xs font-semibold text-slate-700">{item.label}</p>
                        <p className="text-xs text-slate-500 mt-0.5 leading-relaxed">{item.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Action buttons */}
            {!isAnalyzing && (
              <div className="card p-5">
                <h3 className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Take Action</h3>

                {/* Already converted banner */}
                {cart.actionStatus === 'converted' && (
                  <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-100 rounded-xl text-sm text-green-700">
                    <CheckCircle className="w-5 h-5 shrink-0" />
                    <div>
                      <p className="font-semibold">Cart Recovered — Revenue: {formatCurrency(cart.recoveredRevenue ?? cart.cartValue)}</p>
                      <p className="text-xs text-green-600 mt-0.5">This cart has been successfully converted to an order.</p>
                    </div>
                  </div>
                )}

                {/* Ignored banner */}
                {cart.actionStatus === 'ignored' && (
                  <div className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm text-slate-600">
                    <XCircle className="w-5 h-5 shrink-0 text-slate-400" />
                    <div>
                      <p className="font-semibold">Marked as Lost</p>
                      <p className="text-xs text-slate-500 mt-0.5">This cart has been excluded from recovery tracking.</p>
                    </div>
                  </div>
                )}

                {/* Action buttons — only for pending */}
                {!isAlreadyActioned && (
                  <div className="flex flex-wrap gap-3">
                    <button
                      onClick={handleSendAction}
                      className="btn-primary flex items-center gap-2"
                    >
                      <Send className="w-4 h-4" />
                      Send: {ACTION_LABELS[decision.recommendedAction]}
                    </button>
                    {decision.discountRecommended && (
                      <button
                        onClick={handleSendDiscount}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                      >
                        <Percent className="w-4 h-4" />
                        Send {decision.discountAmount}% Discount
                      </button>
                    )}
                    <button
                      onClick={handleMarkConverted}
                      className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-emerald-600 hover:bg-emerald-700 text-white transition-colors"
                    >
                      <CheckCircle className="w-4 h-4" />
                      Mark Converted
                    </button>
                    <button
                      onClick={handleMarkLost}
                      className="btn-secondary flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                    >
                      Mark as Lost
                    </button>
                  </div>
                )}

                {/* Sent state — allow marking as converted */}
                {cart.actionStatus === 'sent' && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-100 rounded-xl text-sm text-blue-700">
                      <Send className="w-4 h-4 shrink-0" />
                      <p>Action sent to {customer.name}. Mark the outcome:</p>
                    </div>
                    <div className="flex gap-3">
                      <button
                        onClick={handleMarkConverted}
                        className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-green-600 hover:bg-green-700 text-white transition-colors"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Mark Converted
                      </button>
                      <button
                        onClick={handleMarkLost}
                        className="btn-secondary flex items-center gap-2 text-red-600 border-red-200 hover:bg-red-50"
                      >
                        Mark as Lost
                      </button>
                    </div>
                  </div>
                )}

              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
