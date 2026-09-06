import Header from '../components/layout/Header';
import { revenueData, actionBreakdown } from '../data/mockData';
import { useCartStore } from '../store/CartStore';
import { formatCurrency, REASON_LABELS, ACTION_LABELS } from '../utils/formatters';
import type { AbandonmentReason, RecoveryAction } from '../types';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  Legend,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from 'recharts';

const COLORS = ['#6366f1', '#22c55e', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#f97316', '#ec4899', '#84cc16'];

function formatYAxis(v: number) {
  if (v >= 100000) return `₹${(v / 100000).toFixed(0)}L`;
  if (v >= 1000) return `₹${(v / 1000).toFixed(0)}K`;
  return `₹${v}`;
}

export default function Analytics() {
  const { carts, stats, totalRecoveredRevenue } = useCartStore();
  // Reason breakdown
  const reasonCounts = carts.reduce<Record<string, number>>((acc, cart) => {
    const r = cart.aiDecision.reason;
    acc[r] = (acc[r] ?? 0) + 1;
    return acc;
  }, {});

  const reasonData = (Object.entries(reasonCounts) as [AbandonmentReason, number][]).map(([reason, count]) => ({
    name: REASON_LABELS[reason],
    count,
    value: carts.filter((c) => c.aiDecision.reason === reason).reduce((s, c) => s + c.cartValue, 0),
  })).sort((a, b) => b.count - a.count);

  // Device breakdown
  const deviceCounts = carts.reduce<Record<string, { count: number; value: number }>>((acc, cart) => {
    if (!acc[cart.deviceType]) acc[cart.deviceType] = { count: 0, value: 0 };
    acc[cart.deviceType].count++;
    acc[cart.deviceType].value += cart.cartValue;
    return acc;
  }, {});

  const deviceData = Object.entries(deviceCounts).map(([device, d]) => ({
    name: device.charAt(0).toUpperCase() + device.slice(1),
    count: d.count,
    value: d.value,
  }));

  // Source breakdown
  const sourceCounts = carts.reduce<Record<string, number>>((acc, cart) => {
    acc[cart.source] = (acc[cart.source] ?? 0) + 1;
    return acc;
  }, {});
  const sourceData = Object.entries(sourceCounts).map(([source, count]) => ({
    name: source.charAt(0).toUpperCase() + source.slice(1),
    value: count,
  }));

  // Segment breakdown
  const segmentCounts = carts.reduce<Record<string, number>>((acc, cart) => {
    const s = cart.customer.segment;
    acc[s] = (acc[s] ?? 0) + 1;
    return acc;
  }, {});
  const segmentData = Object.entries(segmentCounts).map(([seg, count]) => ({
    name: seg.charAt(0).toUpperCase() + seg.slice(1).replace('_', ' '),
    value: count,
  }));

  // Action performance radar
  const radarData = actionBreakdown.slice(0, 6).map((a) => ({
    action: ACTION_LABELS[a.action as RecoveryAction].split(' ').slice(0, 2).join(' '),
    successRate: a.successRate,
    count: a.count * 5,
  }));

  // Conversion funnel
  const total = carts.length;
  const sent = carts.filter((c) => ['sent', 'converted', 'failed'].includes(c.actionStatus)).length;
  const converted = carts.filter((c) => c.actionStatus === 'converted').length;
  const funnelData = [
    { stage: 'Abandoned', value: total, fill: '#ef4444' },
    { stage: 'AI Analyzed', value: total, fill: '#6366f1' },
    { stage: 'Action Sent', value: sent, fill: '#f59e0b' },
    { stage: 'Converted', value: converted, fill: '#22c55e' },
  ];

  return (
    <div>
      <Header title="Analytics" subtitle="Deep insights into cart abandonment and recovery" />
      <div className="p-6 space-y-6">
        {/* KPI Row */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Total Abandoned Value', value: formatCurrency(stats.totalAbandonedValue) },
            { label: 'Total Recovered', value: formatCurrency(totalRecoveredRevenue) },
            { label: 'Avg Recovery Probability', value: `${Math.round(carts.reduce((s, c) => s + c.aiDecision.recoveryProbability, 0) / Math.max(carts.length, 1))}%` },
            { label: 'Discount Rate', value: `${Math.round((carts.filter(c => c.aiDecision.discountRecommended).length / Math.max(carts.length, 1)) * 100)}%` },
          ].map((kpi) => (
            <div key={kpi.label} className="card p-5">
              <p className="text-xs text-slate-500 mb-1">{kpi.label}</p>
              <p className="text-xl font-bold text-slate-900">{kpi.value}</p>
            </div>
          ))}
        </div>

        {/* Charts Row 1 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Abandonment Reasons */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Abandonment Reasons</h2>
            <ResponsiveContainer width="100%" height={240}>
              <BarChart data={reasonData} layout="vertical" margin={{ left: 0, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                <XAxis type="number" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tick={{ fontSize: 10, fill: '#64748b' }} tickLine={false} axisLine={false} width={120} />
                <Tooltip
                  formatter={(v: number) => [`${v} carts`, 'Count']}
                  contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }}
                />
                <Bar dataKey="count" fill="#6366f1" radius={[0, 4, 4, 0]} barSize={14}>
                  {reasonData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Revenue Trend */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Revenue Recovery (10 days)</h2>
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={revenueData}>
                <defs>
                  <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#22c55e" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#22c55e" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tickFormatter={formatYAxis} tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(v: number) => formatCurrency(v)} contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Area type="monotone" dataKey="recovered" stroke="#6366f1" fill="url(#g1)" strokeWidth={2} name="Recovered" />
                <Area type="monotone" dataKey="potential" stroke="#22c55e" fill="url(#g2)" strokeWidth={2} name="Potential" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 2 */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Device Breakdown */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Device Breakdown</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={deviceData} cx="50%" cy="50%" outerRadius={70} dataKey="count" nameKey="name" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {deviceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Traffic Source */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Traffic Sources</h2>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie data={sourceData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" paddingAngle={3}>
                  {sourceData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie>
                <Legend iconType="circle" iconSize={8} formatter={(v) => <span style={{ fontSize: 11, color: '#64748b' }}>{v}</span>} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Customer Segments */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Customer Segments</h2>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={segmentData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="name" tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
                <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={28}>
                  {segmentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Charts Row 3 */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Conversion Funnel */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Recovery Funnel</h2>
            <div className="space-y-3">
              {funnelData.map((item, i) => (
                <div key={item.stage} className="flex items-center gap-3">
                  <span className="text-xs text-slate-500 w-24 shrink-0">{item.stage}</span>
                  <div className="flex-1 h-7 bg-slate-100 rounded-lg overflow-hidden relative">
                    <div
                      className="h-full rounded-lg flex items-center pl-3 transition-all"
                      style={{
                        width: `${(item.value / total) * 100}%`,
                        backgroundColor: item.fill,
                        opacity: 0.85,
                      }}
                    >
                      <span className="text-white text-xs font-semibold">{item.value}</span>
                    </div>
                  </div>
                  <span className="text-xs text-slate-500 w-10 shrink-0 text-right">
                    {Math.round((item.value / total) * 100)}%
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Action Radar */}
          <div className="card p-5">
            <h2 className="text-sm font-semibold text-slate-900 mb-4">Action Effectiveness Radar</h2>
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#e2e8f0" />
                <PolarAngleAxis dataKey="action" tick={{ fontSize: 10, fill: '#64748b' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fontSize: 9, fill: '#94a3b8' }} />
                <Radar name="Success Rate" dataKey="successRate" stroke="#6366f1" fill="#6366f1" fillOpacity={0.25} />
                <Tooltip contentStyle={{ fontSize: 12, borderRadius: 8, border: '1px solid #e2e8f0' }} />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
