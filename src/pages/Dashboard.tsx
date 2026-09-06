import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, TrendingUp, DollarSign, Target,
  Brain, ShieldCheck, ArrowRight, Clock,
} from 'lucide-react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, PieChart, Pie, Cell, Legend,
} from 'recharts';
import Header from '../components/layout/Header';
import StatCard from '../components/ui/StatCard';
import Avatar from '../components/ui/Avatar';
import Badge from '../components/ui/Badge';
import { revenueData, actionBreakdown } from '../data/mockData';
import { useCartStore } from '../store/CartStore';
import {
  formatCurrency, formatTimeAgo,
  ACTION_LABELS, STATUS_COLORS, STATUS_LABELS,
  REASON_LABELS, REASON_COLORS,
} from '../utils/formatters';

const PIE_COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316'];

function formatYAxis(value: number) {
  if (value >= 100000) return `₹${(value / 100000).toFixed(0)}L`;
  if (value >= 1000) return `₹${(value / 1000).toFixed(0)}K`;
  return `₹${value}`;
}

export default function Dashboard() {
  const navigate = useNavigate();
  const { carts, stats } = useCartStore();

  const recentCarts = [...carts]
    .sort((a, b) => new Date(b.abandonedAt).getTime() - new Date(a.abandonedAt).getTime())
    .slice(0, 8);

  const pieData = actionBreakdown.map((a) => ({
    name: ACTION_LABELS[a.action],
    value: a.count,
  }));

  return (
    <div>
      <Header title="Dashboard" subtitle="Real-time AI cart recovery overview" />
      <div className="p-6 space-y-6">

        {/* Stats Row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Abandoned Value"
            value={formatCurrency(stats.totalAbandonedValue)}
            subtitle={`${stats.totalAbandonedCarts} carts`}
            icon={ShoppingCart}
            iconBg="bg-red-50"
            iconColor="text-red-500"
          />
          <StatCard
            title="Recoverable Revenue"
            value={formatCurrency(stats.recoverableRevenue)}
            subtitle="Based on AI recovery scores"
            icon={DollarSign}
            iconBg="bg-green-50"
            iconColor="text-green-500"
          />
          <StatCard
            title="Recovery Rate"
            value={`${stats.recoveryRate}%`}
            subtitle={`${stats.cartsRecoveredToday > 0 ? `${stats.cartsRecoveredToday} recovered today` : 'Carts converted'}`}
            icon={TrendingUp}
            iconBg="bg-brand-50"
            iconColor="text-brand-600"
          />
          <StatCard
            title="AI Success Rate"
            value={`${stats.aiSuccessRate}%`}
            subtitle="Actioned carts converted"
            icon={Brain}
            iconBg="bg-purple-50"
            iconColor="text-purple-600"
          />
        </div>

        {/* Stats Row 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Abandoned Carts"
            value={String(stats.totalAbandonedCarts)}
            subtitle={`${carts.filter(c=>c.actionStatus==='pending').length} pending action`}
            icon={ShoppingCart}
            iconBg="bg-orange-50"
            iconColor="text-orange-500"
          />
          <StatCard
            title="Avg Cart Value"
            value={formatCurrency(stats.averageCartValue)}
            subtitle="Per abandoned cart"
            icon={Target}
            iconBg="bg-teal-50"
            iconColor="text-teal-600"
          />
          <StatCard
            title="Carts Recovered"
            value={String(carts.filter(c => c.actionStatus === 'converted').length)}
            subtitle="Total conversions"
            icon={ShieldCheck}
            iconBg="bg-green-50"
            iconColor="text-green-600"
          />
          <StatCard
            title="Discounts Avoided"
            value={String(stats.discountsAvoided)}
            subtitle="Non-discount recoveries"
            icon={ShieldCheck}
            iconBg="bg-yellow-50"
            iconColor="text-yellow-600"
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Revenue Chart */}
          <div className="card p-5 lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-sm font-semibold text-slate-900">Revenue Recovery Trend</h2>
                <p className="text-xs text-slate-500">10-day historical window</p>
              </div>
              <div className="flex items-center gap-4 text-xs">
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-red-400 inline-block" />Abandoned</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-brand-500 inline-block" />Recovered</span>
                <span className="flex items-center gap-1.5"><span className="w-2.5 h-2.5 rounded-full bg-green-400 inline-block" />Potential</span>
              </div>
            </div>
            <ResponsiveContainer width="100%" height={220}>
              <AreaChart data={revenueData} margin={{ top: 4, right: 4, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="abandonGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="recoveredGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="potentialGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.15} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip
                  formatter={(v: number) => formatCurrency(v)}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0', boxShadow: '0 4px 6px -1px rgb(0 0 0/0.1)' }}
                />
                <Area type="monotone" dataKey="abandoned" stroke="#ef4444" strokeWidth={2} fill="url(#abandonGrad)" name="Abandoned" />
                <Area type="monotone" dataKey="recovered" stroke="#6366f1" strokeWidth={2} fill="url(#recoveredGrad)" name="Recovered" />
                <Area type="monotone" dataKey="potential" stroke="#22c55e" strokeWidth={2} fill="url(#potentialGrad)" name="Potential" />
              </AreaChart>
            </ResponsiveContainer>
          </div>

          {/* AI Action Distribution */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-1">AI Action Distribution</h2>
            <p className="text-xs text-slate-500 mb-3">Recommended actions across all carts</p>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={2}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Legend
                  iconType="circle"
                  iconSize={8}
                  formatter={(value) => <span style={{ fontSize: 10, color: '#64748b' }}>{value}</span>}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent AI Decisions */}
        <div className="card">
          <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
            <div>
              <h2 className="text-sm font-semibold text-slate-900">Recent AI Decisions</h2>
              <p className="text-xs text-slate-500">Latest cart analyses and recommendations</p>
            </div>
            <button
              onClick={() => navigate('/carts')}
              className="flex items-center gap-1.5 text-xs font-medium text-brand-600 hover:text-brand-700 transition-colors"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="divide-y divide-slate-50">
            {recentCarts.map((cart) => (
              <div
                key={cart.id}
                className="flex items-center gap-4 px-5 py-3.5 hover:bg-slate-50/80 transition-colors cursor-pointer"
                onClick={() => navigate(`/carts/${cart.id}`)}
              >
                <Avatar name={cart.customer.name} size="md" />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-sm font-medium text-slate-900 truncate">{cart.customer.name}</span>
                    <span className="text-xs text-slate-400 shrink-0 flex items-center gap-1">
                      <Clock className="w-3 h-3" />{formatTimeAgo(cart.abandonedAt)}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 truncate">
                    {cart.items[0]?.product.name} · {formatCurrency(cart.cartValue)}
                  </p>
                </div>
                <div className="hidden sm:flex items-center gap-2">
                  <span className={`badge ${REASON_COLORS[cart.aiDecision.reason]}`}>
                    {REASON_LABELS[cart.aiDecision.reason]}
                  </span>
                </div>
                <div className="hidden md:flex items-center gap-2">
                  <span className="text-xs text-slate-600 bg-slate-100 px-2 py-1 rounded-md">
                    {ACTION_LABELS[cart.aiDecision.recommendedAction]}
                  </span>
                </div>
                <Badge className={STATUS_COLORS[cart.actionStatus]}>
                  {STATUS_LABELS[cart.actionStatus]}
                </Badge>
              </div>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
