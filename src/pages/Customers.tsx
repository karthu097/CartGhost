import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Users, MapPin, ShoppingBag } from 'lucide-react';
import Header from '../components/layout/Header';
import Avatar from '../components/ui/Avatar';
import EmptyState from '../components/ui/EmptyState';
import { mockCarts } from '../data/mockData';
import { formatCurrency, getSegmentColor, STATUS_COLORS, STATUS_LABELS } from '../utils/formatters';

export default function Customers() {
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [segmentFilter, setSegmentFilter] = useState<string>('all');

  // Deduplicate customers from carts
  const customers = useMemo(() => {
    const seen = new Set<string>();
    return mockCarts
      .filter((cart) => {
        if (seen.has(cart.customer.id)) return false;
        seen.add(cart.customer.id);
        return true;
      })
      .map((cart) => ({
        customer: cart.customer,
        cartValue: cart.cartValue,
        cartId: cart.id,
        actionStatus: cart.actionStatus,
        recoveryProbability: cart.aiDecision.recoveryProbability,
        abandonedAt: cart.abandonedAt,
      }));
  }, []);

  const filtered = useMemo(() => {
    let list = [...customers];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (c) =>
          c.customer.name.toLowerCase().includes(q) ||
          c.customer.email.toLowerCase().includes(q) ||
          c.customer.city.toLowerCase().includes(q)
      );
    }
    if (segmentFilter !== 'all') {
      list = list.filter((c) => c.customer.segment === segmentFilter);
    }
    return list;
  }, [customers, search, segmentFilter]);

  return (
    <div>
      <Header title="Customers" subtitle={`${customers.length} customers with abandoned carts`} />
      <div className="p-6 space-y-4">
        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Search customers..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-slate-50"
              />
            </div>
            <select
              value={segmentFilter}
              onChange={(e) => setSegmentFilter(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
            >
              <option value="all">All Segments</option>
              <option value="new">New</option>
              <option value="returning">Returning</option>
              <option value="loyal">Loyal</option>
              <option value="at_risk">At Risk</option>
            </select>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 bg-slate-50/60">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Customer</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Segment</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Location</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Orders</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Total Spent</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Cart Value</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Recovery</th>
                  <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500 uppercase tracking-wide">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={8}>
                      <EmptyState icon={Users} title="No customers found" description="Try adjusting filters" />
                    </td>
                  </tr>
                ) : (
                  filtered.map(({ customer, cartValue, cartId, actionStatus, recoveryProbability }) => (
                    <tr
                      key={customer.id}
                      className="table-row-hover"
                      onClick={() => navigate(`/carts/${cartId}`)}
                    >
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-3">
                          <Avatar name={customer.name} size="sm" />
                          <div>
                            <p className="text-sm font-medium text-slate-900">{customer.name}</p>
                            <p className="text-xs text-slate-400">{customer.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`badge ${getSegmentColor(customer.segment)}`}>
                          {customer.segment.charAt(0).toUpperCase() + customer.segment.slice(1).replace('_', ' ')}
                        </span>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <MapPin className="w-3.5 h-3.5 text-slate-400" />
                          {customer.city}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <div className="flex items-center gap-1.5 text-sm text-slate-600">
                          <ShoppingBag className="w-3.5 h-3.5 text-slate-400" />
                          {customer.totalOrders}
                        </div>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-medium text-slate-800">{formatCurrency(customer.totalSpent)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold text-slate-900">{formatCurrency(cartValue)}</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className="text-sm font-semibold text-brand-600">{recoveryProbability}%</span>
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`badge ${STATUS_COLORS[actionStatus]}`}>
                          {STATUS_LABELS[actionStatus]}
                        </span>
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
