import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Brain,
  CheckCircle,
  XCircle,
  TrendingUp,
  Percent,
  Send,
  ArrowRight,
  Zap,
  ShieldCheck,
  AlertCircle,
  Clock,
  IndianRupee,
  Filter,
  BarChart2,
} from 'lucide-react';
import Header from '../components/layout/Header';
import Avatar from '../components/ui/Avatar';
import ProgressBar from '../components/ui/ProgressBar';
import { actionBreakdown } from '../data/mockData';
import { useCartStore } from '../store/CartStore';
import { computeRevenueImpact } from '../engine/aiDecisionEngine';
import {
  formatCurrency,
  formatTimeAgo,
  ACTION_LABELS,
  REASON_LABELS,
  REASON_COLORS,
  STATUS_COLORS,
  STATUS_LABELS,
  getRecoveryColor,
} from '../utils/formatters';
import type { RecoveryAction } from '../types';

// ─── helpers ──────────────────────────────────────────────────────────────────

function ActionIcon({ action }: { action: RecoveryAction | string }) {
  if (action === 'offer_discount') return <Percent className="w-4 h-4 text-green-500" />;
  if (action === 'no_action') return <XCircle className="w-4 h-4 text-slate-400" />;
  if (action === 'offer_payment_options') return <IndianRupee className="w-4 h-4 text-blue-500" />;
  if (action === 'send_size_recommendation') return <BarChart2 className="w-4 h-4 text-amber-500" />;
  return <Send className="w-4 h-4 text-brand-500" />;
}

// ─── Tabs ────────────────────────────────────────────────────────────────────

type Tab = 'all' | 'high_priority' | 'discount' | 'no_discount';

export default function AIRecommendations() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<Tab>('all');
  const [actionFilter, setActionFilter] = useState<RecoveryAction | 'all'>('all');
  const { carts, updateCartStatus } = useCartStore();

  // Pre-compute derived lists from real AI decisions
  const highPriority = useMemo(
    () =>
      [...carts]
        .filter((c) => c.aiDecision.recoveryProbability >= 65 && c.actionStatus === 'pending')
        .sort((a, b) => b.aiDecision.recoveryProbability - a.aiDecision.recoveryProbability || b.cartValue - a.cartValue),
    [carts]
  );

  const discountCarts = useMemo(
    () => carts.filter((c) => c.aiDecision.discountRecommended),
    [carts]
  );

  const noDiscountCarts = useMemo(
    () =>
      carts.filter(
        (c) => !c.aiDecision.discountRecommended && c.actionStatus === 'pending'
      ),
    [carts]
  );

  const tabCarts = useMemo(() => {
    let base =
      activeTab === 'high_priority'
        ? highPriority
        : activeTab === 'discount'
        ? discountCarts
        : activeTab === 'no_discount'
        ? noDiscountCarts
        : carts.filter((c) => c.actionStatus === 'pending');

    if (actionFilter !== 'all') {
      base = base.filter((c) => c.aiDecision.recommendedAction === actionFilter);
    }
    return base;
  }, [activeTab, actionFilter, highPriority, discountCarts, noDiscountCarts, carts]);

  // Unique action types present in pending carts (for filter dropdown)
  const pendingActions = useMemo(() => {
    const seen = new Set<RecoveryAction>();
    for (const c of carts) {
      if (c.actionStatus === 'pending') seen.add(c.aiDecision.recommendedAction);
    }
    return [...seen];
  }, [carts]);

  const totalExpectedRecovery = useMemo(
    () =>
      carts.reduce((sum, c) => {
        const imp = computeRevenueImpact(c, c.aiDecision);
        return sum + imp.expectedRecovery;
      }, 0),
    [carts]
  );

  const handleSend = (cartId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    updateCartStatus(cartId, 'sent');
  };

  // ─── render ────────────────────────────────────────────────────────────────
  return (
    <div>
      <Header
        title="AI Recommendations"
        subtitle="Intelligent cart recovery decisions from the local AI engine"
      />
      <div className="p-6 space-y-6">

        {/* ── KPI row ─────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              label: 'Total Analyzed',
              value: carts.length,
              icon: Brain,
              color: 'text-brand-600',
              bg: 'bg-brand-50',
            },
            {
              label: 'High Priority',
              value: highPriority.length,
              icon: AlertCircle,
              color: 'text-orange-500',
              bg: 'bg-orange-50',
            },
            {
              label: 'Discounts Recommended',
              value: discountCarts.length,
              icon: Percent,
              color: 'text-red-500',
              bg: 'bg-red-50',
              sub: `${carts.length - discountCarts.length} avoided`,
            },
            {
              label: 'Expected Recovery',
              value: formatCurrency(totalExpectedRecovery),
              icon: TrendingUp,
              color: 'text-green-600',
              bg: 'bg-green-50',
            },
          ].map((item) => (
            <div key={item.label} className="card p-5">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-xs text-slate-500">{item.label}</p>
                  <p className="text-2xl font-bold text-slate-900 mt-1">{item.value}</p>
                  {item.sub && <p className="text-xs text-slate-400 mt-0.5">{item.sub}</p>}
                </div>
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${item.bg}`}>
                  <item.icon className={`w-5 h-5 ${item.color}`} />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ── Discount intelligence banner ───────────────────────────────── */}
        <div className="card p-4 border-brand-100 bg-gradient-to-r from-brand-50 to-slate-50">
          <div className="flex items-start gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-brand-600 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-slate-900">
                  Discount Intelligence Active
                </p>
                <p className="text-xs text-slate-500 mt-0.5">
                  CartGhost only recommends discounts when customer loyalty and cart value justify
                  the cost. {carts.length - discountCarts.length} out of {carts.length} carts
                  will be recovered without any discount — protecting your margins.
                </p>
              </div>
            </div>
            <div className="flex items-center gap-6 ml-auto flex-wrap">
              <div className="text-center">
                <p className="text-lg font-bold text-green-600">{carts.length - discountCarts.length}</p>
                <p className="text-xs text-slate-500">No discount</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-orange-500">{discountCarts.length}</p>
                <p className="text-xs text-slate-500">Discount justified</p>
              </div>
              <div className="text-center">
                <p className="text-lg font-bold text-brand-600">
                  {Math.round(((carts.length - discountCarts.length) / carts.length) * 100)}%
                </p>
                <p className="text-xs text-slate-500">Margin protected</p>
              </div>
            </div>
          </div>
        </div>

        {/* ── Action performance table ───────────────────────────────────── */}
        <div className="card p-5">
          <h2 className="text-sm font-semibold text-slate-900 mb-4">Action Performance</h2>
          <div className="space-y-3">
            {actionBreakdown.map((item) => (
              <div key={item.action} className="flex items-center gap-4">
                <div className="flex items-center gap-2 w-48 shrink-0">
                  <ActionIcon action={item.action} />
                  <span className="text-xs text-slate-700 font-medium truncate">
                    {ACTION_LABELS[item.action as RecoveryAction] ?? item.action}
                  </span>
                </div>
                <div className="flex-1">
                  <ProgressBar value={item.successRate} color="bg-brand-500" showLabel />
                </div>
                <span className="text-xs text-slate-500 w-8 shrink-0 text-right">{item.count}×</span>
                <span className="text-xs font-medium text-slate-700 w-24 shrink-0 text-right">
                  {formatCurrency(item.revenueRecovered)}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Tabs + filter ─────────────────────────────────────────────── */}
        <div className="card overflow-hidden">
          {/* Tab bar */}
          <div className="flex items-center justify-between border-b border-slate-100 px-5 py-0 flex-wrap gap-2">
            <div className="flex">
              {(
                [
                  { key: 'all', label: 'All Pending', count: carts.filter((c) => c.actionStatus === 'pending').length },
                  { key: 'high_priority', label: 'High Priority', count: highPriority.length },
                  { key: 'discount', label: 'Discount', count: discountCarts.length },
                  { key: 'no_discount', label: 'No Discount', count: noDiscountCarts.length },
                ] as { key: Tab; label: string; count: number }[]
              ).map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key)}
                  className={`flex items-center gap-1.5 px-4 py-3.5 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
                    activeTab === tab.key
                      ? 'border-brand-600 text-brand-700'
                      : 'border-transparent text-slate-500 hover:text-slate-700'
                  }`}
                >
                  {tab.label}
                  <span
                    className={`px-1.5 py-0.5 rounded-full text-xs ${
                      activeTab === tab.key
                        ? 'bg-brand-100 text-brand-700'
                        : 'bg-slate-100 text-slate-500'
                    }`}
                  >
                    {tab.count}
                  </span>
                </button>
              ))}
            </div>
            {/* Action filter */}
            <div className="flex items-center gap-2 py-2 pr-1">
              <Filter className="w-3.5 h-3.5 text-slate-400" />
              <select
                value={actionFilter}
                onChange={(e) => setActionFilter(e.target.value as RecoveryAction | 'all')}
                className="text-xs border border-slate-200 rounded-lg px-2.5 py-1.5 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Actions</option>
                {pendingActions.map((a) => (
                  <option key={a} value={a}>
                    {ACTION_LABELS[a]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* High priority alert */}
          {activeTab === 'high_priority' && highPriority.length > 0 && (
            <div className="mx-5 mt-4 flex items-center gap-2 p-3 bg-orange-50 border border-orange-100 rounded-xl text-sm text-orange-700">
              <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse shrink-0" />
              <strong>{highPriority.length} carts</strong> with ≥65% recovery probability are waiting for action.
              Expected recovery if actioned now:{' '}
              <strong>
                {formatCurrency(
                  highPriority.reduce((s, c) => s + computeRevenueImpact(c, c.aiDecision).expectedRecovery, 0)
                )}
              </strong>
            </div>
          )}

          {/* Empty state */}
          {tabCarts.length === 0 && (
            <div className="py-16 text-center">
              <CheckCircle className="w-10 h-10 text-green-300 mx-auto mb-3" />
              <p className="text-sm font-medium text-slate-600">No carts in this category</p>
              <p className="text-xs text-slate-400 mt-1">Try a different tab or clear the action filter</p>
            </div>
          )}

          {/* Cart list */}
          <div className="divide-y divide-slate-50">
            {tabCarts.map((cart) => {
              const impact = computeRevenueImpact(cart, cart.aiDecision);
              const wasSent = cart.actionStatus !== 'pending';
              return (
                <div
                  key={cart.id}
                  className="flex items-start gap-4 px-5 py-4 hover:bg-slate-50/80 cursor-pointer transition-colors"
                  onClick={() => navigate(`/carts/${cart.id}`)}
                >
                  {/* Avatar */}
                  <Avatar name={cart.customer.name} size="md" />

                  {/* Main content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5 flex-wrap">
                      <span className="text-sm font-semibold text-slate-900">{cart.customer.name}</span>
                      <span className="text-xs text-slate-400 flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {formatTimeAgo(cart.abandonedAt)}
                      </span>
                      <span className="text-xs font-semibold text-slate-700 ml-auto">
                        {formatCurrency(cart.cartValue)}
                      </span>
                    </div>

                    <p className="text-xs text-slate-500 mb-2 truncate">
                      {cart.items[0]?.product.name} · {cart.items[0]?.product.brand}
                    </p>

                    {/* AI explanation */}
                    <p className="text-xs text-slate-600 leading-relaxed line-clamp-2 mb-2">
                      {cart.aiDecision.explanation}
                    </p>

                    {/* Tags row */}
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`badge ${REASON_COLORS[cart.aiDecision.reason]}`}>
                        {REASON_LABELS[cart.aiDecision.reason]}
                      </span>
                      <span className="flex items-center gap-1 badge bg-brand-50 text-brand-700">
                        <ActionIcon action={cart.aiDecision.recommendedAction} />
                        {ACTION_LABELS[cart.aiDecision.recommendedAction]}
                      </span>
                      {cart.aiDecision.discountRecommended ? (
                        <span className="flex items-center gap-1 badge bg-green-100 text-green-700">
                          <CheckCircle className="w-3 h-3" />
                          {cart.aiDecision.discountAmount}% discount
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 badge bg-slate-100 text-slate-500">
                          <ShieldCheck className="w-3 h-3" />
                          No discount
                        </span>
                      )}
                      <span className="text-xs text-slate-400">
                        Expected: {formatCurrency(impact.expectedRecovery)}
                      </span>
                    </div>
                  </div>

                  {/* Right column: recovery % + action button */}
                  <div className="flex flex-col items-end gap-2 shrink-0 ml-2">
                    <div className="text-right">
                      <span className={`text-base font-bold ${getRecoveryColor(cart.aiDecision.recoveryProbability)}`}>
                        {cart.aiDecision.recoveryProbability}%
                      </span>
                      <ProgressBar
                        value={cart.aiDecision.recoveryProbability}
                        colorByValue
                        className="w-20 mt-1"
                      />
                    </div>

                    {wasSent ? (
                      <span className={`badge ${STATUS_COLORS['sent']}`}>
                        {STATUS_LABELS['sent']}
                      </span>
                    ) : (
                      <button
                        onClick={(e) => handleSend(cart.id, e)}
                        className="flex items-center gap-1.5 text-xs font-medium px-3 py-1.5 bg-brand-600 text-white rounded-lg hover:bg-brand-700 transition-colors whitespace-nowrap"
                      >
                        <Zap className="w-3 h-3" />
                        Act Now
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Footer */}
          {tabCarts.length > 0 && (
            <div className="px-5 py-3 border-t border-slate-100 bg-slate-50/60 flex items-center justify-between">
              <span className="text-xs text-slate-500">
                {tabCarts.length} recommendation{tabCarts.length !== 1 ? 's' : ''}
              </span>
              <button
                onClick={() => navigate('/carts')}
                className="flex items-center gap-1 text-xs text-brand-600 hover:text-brand-700 font-medium"
              >
                View all carts <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
