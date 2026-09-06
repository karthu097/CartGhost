import { useState, useMemo, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Search, Filter, ShoppingCart, ChevronDown, ChevronUp, ArrowUpDown, Percent, ShieldCheck } from 'lucide-react';
import Header from '../components/layout/Header';
import Avatar from '../components/ui/Avatar';
import ProgressBar from '../components/ui/ProgressBar';
import EmptyState from '../components/ui/EmptyState';
import { useCartStore } from '../store/CartStore';
import {
  formatCurrency,
  formatTimeAgo,
  REASON_LABELS,
  REASON_COLORS,
  ACTION_LABELS,
  STATUS_COLORS,
  STATUS_LABELS,
  getRecoveryColor,
} from '../utils/formatters';
import type { ActionStatus, AbandonmentReason } from '../types';

type SortKey = 'cartValue' | 'abandonedAt' | 'recoveryProbability';
type SortDir = 'asc' | 'desc';

export default function AbandonedCarts() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { carts } = useCartStore();
  const [search, setSearch] = useState(() => searchParams.get('search') ?? '');

  // Sync search param from header navigation
  useEffect(() => {
    const q = searchParams.get('search');
    if (q !== null) setSearch(q);
  }, [searchParams]);
  const [statusFilter, setStatusFilter] = useState<ActionStatus | 'all'>('all');
  const [reasonFilter, setReasonFilter] = useState<AbandonmentReason | 'all'>('all');
  const [discountFilter, setDiscountFilter] = useState<'all' | 'discount' | 'no_discount'>('all');
  const [sortKey, setSortKey] = useState<SortKey>('abandonedAt');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
    else { setSortKey(key); setSortDir('desc'); }
  };

  const filtered = useMemo(() => {
    let list = [...carts];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.customer.name.toLowerCase().includes(q) ||
          c.items[0]?.product.name.toLowerCase().includes(q) ||
          c.customer.email.toLowerCase().includes(q) ||
          c.customer.city.toLowerCase().includes(q)
      );
    }
    if (statusFilter !== 'all') list = list.filter((c) => c.actionStatus === statusFilter);
    if (reasonFilter !== 'all') list = list.filter((c) => c.aiDecision.reason === reasonFilter);
    if (discountFilter === 'discount') list = list.filter((c) => c.aiDecision.discountRecommended);
    if (discountFilter === 'no_discount') list = list.filter((c) => !c.aiDecision.discountRecommended);

    list.sort((a, b) => {
      let va: number, vb: number;
      if (sortKey === 'cartValue') { va = a.cartValue; vb = b.cartValue; }
      else if (sortKey === 'recoveryProbability') { va = a.aiDecision.recoveryProbability; vb = b.aiDecision.recoveryProbability; }
      else { va = new Date(a.abandonedAt).getTime(); vb = new Date(b.abandonedAt).getTime(); }
      return sortDir === 'asc' ? va - vb : vb - va;
    });
    return list;
  }, [search, statusFilter, reasonFilter, discountFilter, sortKey, sortDir]);

  const SortIcon = ({ k }: { k: SortKey }) => {
    if (sortKey !== k) return <ArrowUpDown className="w-3.5 h-3.5 text-slate-300" />;
    return sortDir === 'asc'
      ? <ChevronUp className="w-3.5 h-3.5 text-brand-500" />
      : <ChevronDown className="w-3.5 h-3.5 text-brand-500" />;
  };

  return (
    <div>
      <Header
        title="Abandoned Carts"
        subtitle={`${carts.length} carts · ${filtered.length} shown`}
      />
      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search by customer, product, city..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-slate-50"
              />
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <Filter className="w-4 h-4 text-slate-400" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as ActionStatus | 'all')}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Status</option>
                <option value="pending">Pending</option>
                <option value="sent">Sent</option>
                <option value="converted">Converted</option>
                <option value="ignored">Ignored</option>
                <option value="failed">Failed</option>
              </select>
              <select
                value={reasonFilter}
                onChange={(e) => setReasonFilter(e.target.value as AbandonmentReason | 'all')}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All Reasons</option>
                <option value="price_sensitivity">Price Sensitivity</option>
                <option value="size_uncertainty">Size Uncertainty</option>
                <option value="product_confusion">Product Confusion</option>
                <option value="comparison_shopping">Comparison Shopping</option>
                <option value="waiting_for_discount">Waiting for Discount</option>
                <option value="payment_issue">Payment Issue</option>
                <option value="shipping_cost">Shipping Cost</option>
                <option value="low_purchase_intent">Low Intent</option>
              </select>
              <select
                value={discountFilter}
                onChange={(e) => setDiscountFilter(e.target.value as 'all' | 'discount' | 'no_discount')}
                className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
              >
                <option value="all">All (Discount)</option>
                <option value="discount">Discount Recommended</option>
                <option value="no_discount">No Discount</option>
              </select>
            </div>
            <span className="text-xs text-slate-400 ml-auto">{filtered.length} results</span>
          </div>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Product</th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none"
                    onClick={() => handleSort('cartValue')}
                  >
                    <span className="flex items-center gap-1">Cart Value <SortIcon k="cartValue" /></span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">AI Reason</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Action</th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none"
                    onClick={() => handleSort('recoveryProbability')}
                  >
                    <span className="flex items-center gap-1">Recovery <SortIcon k="recoveryProbability" /></span>
                  </th>
                  <th
                    className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide cursor-pointer select-none"
                    onClick={() => handleSort('abandonedAt')}
                  >
                    <span className="flex items-center gap-1">Time <SortIcon k="abandonedAt" /></span>
                  </th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Discount</th>
                </tr>              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={9}>
                      <EmptyState
                        icon={ShoppingCart}
                        title="No carts found"
                        description="Try adjusting your search or filters"
                      />
                    </td>
                  </tr>
                ) : (
                  filtered.map((cart) => (
                    <tr
                      key={cart.id}
                      className="table-row-hover"
                      onClick={() => navigate(`/carts/${cart.id}`)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={cart.customer.name} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{cart.customer.name}</p>
                            <p className="text-xs text-slate-400">{cart.customer.city}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <p className="text-sm text-slate-800 font-medium truncate max-w-[140px]">
                          {cart.items[0]?.product.name}
                        </p>
                        <p className="text-xs text-slate-400">{cart.items[0]?.product.brand}</p>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold text-slate-900">{formatCurrency(cart.cartValue)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`badge ${REASON_COLORS[cart.aiDecision.reason]}`}>
                          {REASON_LABELS[cart.aiDecision.reason]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md whitespace-nowrap">
                          {ACTION_LABELS[cart.aiDecision.recommendedAction]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5 min-w-[100px]">
                        <div className="space-y-1">
                          <span className={`text-xs font-semibold ${getRecoveryColor(cart.aiDecision.recoveryProbability)}`}>
                            {cart.aiDecision.recoveryProbability}%
                          </span>
                          <ProgressBar value={cart.aiDecision.recoveryProbability} colorByValue />
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-xs text-slate-500">{formatTimeAgo(cart.abandonedAt)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`badge ${STATUS_COLORS[cart.actionStatus]}`}>
                          {STATUS_LABELS[cart.actionStatus]}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        {cart.aiDecision.discountRecommended ? (
                          <span className="flex items-center gap-1 text-xs text-green-700 font-medium">
                            <Percent className="w-3.5 h-3.5" />
                            {cart.aiDecision.discountAmount}% off
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-xs text-slate-400">
                            <ShieldCheck className="w-3.5 h-3.5" />
                            None
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
