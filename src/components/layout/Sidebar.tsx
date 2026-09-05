import { NavLink, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  ShoppingCart,
  Users,
  Brain,
  BarChart3,
  Settings,
  Ghost,
  Zap,
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/carts', label: 'Abandoned Carts', icon: ShoppingCart },
  { path: '/customers', label: 'Customers', icon: Users },
  { path: '/ai-recommendations', label: 'AI Recommendations', icon: Brain },
  { path: '/analytics', label: 'Analytics', icon: BarChart3 },
  { path: '/settings', label: 'Settings', icon: Settings },
];

export default function Sidebar() {
  const location = useLocation();

  return (
    <aside className="fixed left-0 top-0 h-full w-64 bg-white border-r border-slate-200 flex flex-col z-30">
      {/* Logo */}
      <div className="flex items-center gap-3 px-5 py-5 border-b border-slate-100">
        <div className="w-9 h-9 bg-brand-600 rounded-xl flex items-center justify-center shadow-md">
          <Ghost className="w-5 h-5 text-white" />
        </div>
        <div>
          <span className="text-lg font-bold text-slate-900">CartGhost</span>
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-brand-500" />
            <span className="text-xs text-brand-600 font-medium">AI Powered</span>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ path, label, icon: Icon }) => {
          const isActive = path === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(path);
          return (
            <NavLink
              key={path}
              to={path}
              className={clsx(
                'sidebar-link',
                isActive ? 'sidebar-link-active' : 'sidebar-link-inactive'
              )}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{label}</span>
              {isActive && (
                <span className="ml-auto w-1.5 h-1.5 rounded-full bg-brand-600" />
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-slate-100">
        <div className="bg-brand-50 rounded-xl p-3">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs font-semibold text-slate-700">AI Engine Active</span>
          </div>
          <p className="text-xs text-slate-500">Local engine · No API key required</p>
          <p className="text-xs text-slate-400 mt-0.5">Upgrade to LLM in Settings</p>
        </div>
      </div>
    </aside>
  );
}
