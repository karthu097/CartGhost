import { Bell, Search, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useCartStore } from '../../store/CartStore';

interface HeaderProps {
  title: string;
  subtitle?: string;
}

export default function Header({ title, subtitle }: HeaderProps) {
  const navigate = useNavigate();
  const { carts } = useCartStore();

  // Notification count = carts that are still pending (need action)
  const pendingCount = carts.filter((c) => c.actionStatus === 'pending').length;

  const handleSearch = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      const query = (e.target as HTMLInputElement).value.trim();
      if (query) navigate(`/carts?search=${encodeURIComponent(query)}`);
    }
  };

  return (
    <header className="sticky top-0 z-20 bg-white/95 backdrop-blur-sm border-b border-slate-200 px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-slate-900">{title}</h1>
          {subtitle && <p className="text-sm text-slate-500 mt-0.5">{subtitle}</p>}
        </div>
        <div className="flex items-center gap-3">
          {/* Search — navigates to /carts with query param */}
          <div className="relative hidden md:block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder="Search carts, customers… (Enter)"
              onKeyDown={handleSearch}
              className="pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg w-64 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition"
            />
          </div>

          {/* Refresh */}
          <button
            onClick={() => window.location.reload()}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors"
            title="Refresh page"
          >
            <RefreshCw className="w-4 h-4" />
          </button>

          {/* Notifications — count reflects live pending carts */}
          <button
            onClick={() => navigate('/ai-recommendations')}
            className="w-9 h-9 flex items-center justify-center rounded-lg border border-slate-200 text-slate-500 hover:bg-slate-50 transition-colors relative"
            title={`${pendingCount} carts pending action`}
          >
            <Bell className="w-4 h-4" />
            {pendingCount > 0 && (
              <span className="absolute -top-1 -right-1 min-w-[16px] h-4 bg-brand-600 rounded-full text-white text-[9px] flex items-center justify-center font-bold px-0.5">
                {pendingCount > 99 ? '99+' : pendingCount}
              </span>
            )}
          </button>

          {/* Avatar */}
          <div className="w-9 h-9 bg-brand-600 rounded-full flex items-center justify-center text-white text-sm font-semibold cursor-pointer">
            AD
          </div>
        </div>
      </div>
    </header>
  );
}
