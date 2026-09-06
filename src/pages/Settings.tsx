import { useState, useEffect } from 'react';
import { Brain, Key, Bell, Sliders, Save, CheckCircle, Sparkles, Cpu, Wifi, WifiOff } from 'lucide-react';
import Header from '../components/layout/Header';
import { checkBackendHealth } from '../services/aiService';

type Section = 'ai' | 'notifications' | 'thresholds' | 'api';
type AIMode = 'checking' | 'gemini' | 'no_key' | 'offline';

// ─── Persistent settings ─────────────────────────────────────────────────────

const STORAGE_KEY = 'cartghost_settings';

interface PersistedSettings {
  discountThreshold: number;
  recoveryThreshold: number;
  cartValueThreshold: number;
  notifHighValue: boolean;
  notifDiscount: boolean;
  notifConverted: boolean;
  notifWeekly: boolean;
  notifFailure: boolean;
}

const DEFAULTS: PersistedSettings = {
  discountThreshold: 40,
  recoveryThreshold: 50,
  cartValueThreshold: 5000,
  notifHighValue: true,
  notifDiscount: true,
  notifConverted: true,
  notifWeekly: false,
  notifFailure: true,
};

function loadSettings(): PersistedSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return { ...DEFAULTS, ...JSON.parse(raw) as Partial<PersistedSettings> };
  } catch { /* ignore */ }
  return DEFAULTS;
}

function saveSettings(s: PersistedSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
}

export default function Settings() {
  const [activeSection, setActiveSection] = useState<Section>('ai');
  const [saved, setSaved] = useState(false);
  const [aiMode, setAiMode] = useState<AIMode>('checking');
  const [settings, setSettings] = useState<PersistedSettings>(loadSettings);

  // Check backend health on mount
  useEffect(() => {
    checkBackendHealth().then(({ available, geminiConfigured }) => {
      if (!available) setAiMode('offline');
      else if (geminiConfigured) setAiMode('gemini');
      else setAiMode('no_key');
    });
  }, []);

  const update = (patch: Partial<PersistedSettings>) =>
    setSettings((prev) => ({ ...prev, ...patch }));

  const handleSave = () => {
    saveSettings(settings);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const sections: { id: Section; label: string; icon: typeof Brain }[] = [
    { id: 'ai', label: 'AI Engine', icon: Brain },
    { id: 'api', label: 'API Keys', icon: Key },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'thresholds', label: 'Thresholds', icon: Sliders },
  ];

  return (
    <div>
      <Header title="Settings" subtitle="Configure CartGhost AI engine and preferences" />
      <div className="p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar */}
          <div className="card p-3 h-fit">
            <nav className="space-y-0.5">
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === id ? 'bg-brand-50 text-brand-700' : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          <div className="lg:col-span-3 space-y-5">

            {/* AI Engine */}
            {activeSection === 'ai' && (
              <div className="card p-6 space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">AI Engine Configuration</h2>
                  <p className="text-sm text-slate-500">Current AI mode and engine status.</p>
                </div>

                {/* Live status */}
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-3">Current AI Mode</label>
                  {aiMode === 'checking' && (
                    <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
                      <div className="w-2 h-2 rounded-full bg-slate-300 animate-pulse" />
                      <span className="text-sm text-slate-500">Checking backend status…</span>
                    </div>
                  )}
                  {aiMode === 'gemini' && (
                    <div className="flex items-center gap-3 p-4 bg-gradient-to-r from-blue-50 to-purple-50 border border-purple-200 rounded-xl">
                      <Sparkles className="w-5 h-5 text-purple-500 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-purple-800">Gemini AI Active</p>
                        <p className="text-xs text-purple-600 mt-0.5">GEMINI_API_KEY is configured. All "Analyze with AI" requests use Google Gemini.</p>
                      </div>
                      <Wifi className="w-5 h-5 text-green-500 ml-auto shrink-0" />
                    </div>
                  )}
                  {aiMode === 'no_key' && (
                    <div className="flex items-center gap-3 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
                      <Cpu className="w-5 h-5 text-yellow-600 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-yellow-800">Demo Engine Active</p>
                        <p className="text-xs text-yellow-700 mt-0.5">Backend is running but GEMINI_API_KEY is not set. Add it to <code className="bg-white px-1 rounded border text-xs">.env</code> to enable Gemini.</p>
                      </div>
                    </div>
                  )}
                  {aiMode === 'offline' && (
                    <div className="flex items-center gap-3 p-4 bg-red-50 border border-red-200 rounded-xl">
                      <WifiOff className="w-5 h-5 text-red-500 shrink-0" />
                      <div>
                        <p className="text-sm font-semibold text-red-700">Backend Offline</p>
                        <p className="text-xs text-red-600 mt-0.5">The CartGhost backend server is not running. Start it with <code className="bg-white px-1 rounded border text-xs">npm run dev:server</code>.</p>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Discount Strategy</label>
                  <div className="space-y-3">
                    {[
                      { value: 'conservative', label: 'Conservative', desc: 'Only offer discounts to high-loyalty customers with high-value carts' },
                      { value: 'balanced', label: 'Balanced', desc: 'Balance revenue optimization with conversion rate' },
                      { value: 'aggressive', label: 'Aggressive', desc: 'Prioritize conversion over margin' },
                    ].map((opt) => (
                      <label key={opt.value} className="flex items-start gap-3 p-3 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                        <input type="radio" name="strategy" defaultChecked={opt.value === 'conservative'} className="mt-0.5" />
                        <div>
                          <p className="text-sm font-medium text-slate-800">{opt.label}</p>
                          <p className="text-xs text-slate-500">{opt.desc}</p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* API Keys */}
            {activeSection === 'api' && (
              <div className="card p-6 space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">API Configuration</h2>
                  <p className="text-sm text-slate-500">The API key is stored server-side in the <code className="bg-slate-100 px-1.5 py-0.5 rounded text-xs">.env</code> file, never in the browser.</p>
                </div>

                {aiMode === 'gemini' ? (
                  <div className="flex items-center gap-3 p-4 bg-green-50 border border-green-100 rounded-xl">
                    <CheckCircle className="w-5 h-5 text-green-500 shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-green-800">Gemini API key is configured and active</p>
                      <p className="text-xs text-green-700 mt-0.5">To rotate the key, edit <code className="bg-white px-1 rounded border text-xs">.env</code> → <code className="bg-white px-1 rounded border text-xs">GEMINI_API_KEY=your_new_key</code> and restart the server.</p>
                    </div>
                  </div>
                ) : (
                  <div className="bg-yellow-50 border border-yellow-100 rounded-xl p-4 text-sm text-yellow-800">
                    <strong>No API key detected.</strong> To enable Gemini AI:
                    <ol className="mt-2 space-y-1 text-xs list-decimal list-inside text-yellow-700">
                      <li>Get a key at <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer" className="underline">aistudio.google.com</a></li>
                      <li>Edit <code className="bg-white px-1 rounded border">.env</code> in the project root</li>
                      <li>Set <code className="bg-white px-1 rounded border">GEMINI_API_KEY=your_key_here</code></li>
                      <li>Restart the backend: <code className="bg-white px-1 rounded border">npm run dev:server</code></li>
                    </ol>
                  </div>
                )}

                <div className="text-sm text-slate-500 bg-slate-50 border border-slate-200 rounded-xl p-4">
                  <p className="font-medium text-slate-700 mb-1">Security note</p>
                  <p className="text-xs">API keys are stored in <code className="bg-white px-1 rounded border text-xs">.env</code> which is excluded from git via <code className="bg-white px-1 rounded border text-xs">.gitignore</code>. They are never sent to the browser or included in the frontend bundle.</p>
                </div>
              </div>
            )}

            {/* Thresholds */}
            {activeSection === 'thresholds' && (
              <div className="card p-6 space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">Decision Thresholds</h2>
                  <p className="text-sm text-slate-500">These settings are persisted in your browser and applied to the local engine.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Min recovery probability to trigger action: <strong>{settings.recoveryThreshold}%</strong>
                  </label>
                  <input
                    type="range" min={10} max={90}
                    value={settings.recoveryThreshold}
                    onChange={(e) => update({ recoveryThreshold: Number(e.target.value) })}
                    className="w-full accent-brand-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>10% (aggressive)</span><span>90% (conservative)</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Loyalty score required for discount: <strong>{settings.discountThreshold}</strong>
                  </label>
                  <input
                    type="range" min={10} max={80}
                    value={settings.discountThreshold}
                    onChange={(e) => update({ discountThreshold: Number(e.target.value) })}
                    className="w-full accent-brand-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>10 (discount freely)</span><span>80 (rarely discount)</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cart value threshold for premium treatment</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                    <input
                      type="number"
                      value={settings.cartValueThreshold}
                      onChange={(e) => update({ cartValueThreshold: Number(e.target.value) })}
                      className="w-full pl-7 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* Notifications */}
            {activeSection === 'notifications' && (
              <div className="card p-6 space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">Notification Preferences</h2>
                  <p className="text-sm text-slate-500">Preferences are saved to your browser.</p>
                </div>
                <div className="space-y-3">
                  {[
                    { key: 'notifHighValue' as const, label: 'New high-value cart abandoned', desc: `Cart value above ₹${settings.cartValueThreshold.toLocaleString('en-IN')}` },
                    { key: 'notifDiscount' as const, label: 'AI recommends discount', desc: 'Before sending discount offers' },
                    { key: 'notifConverted' as const, label: 'Cart successfully recovered', desc: 'When a cart converts to order' },
                    { key: 'notifWeekly' as const, label: 'Weekly recovery report', desc: 'Sent every Monday morning' },
                    { key: 'notifFailure' as const, label: 'Action send failures', desc: 'When email or SMS delivery fails' },
                  ].map((item) => (
                    <label key={item.key} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <input
                        type="checkbox"
                        checked={settings[item.key]}
                        onChange={(e) => update({ [item.key]: e.target.checked })}
                        className="w-4 h-4 accent-brand-600"
                      />
                    </label>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  saved ? 'bg-green-500 text-white' : 'bg-brand-600 hover:bg-brand-700 text-white'
                }`}
              >
                {saved ? <CheckCircle className="w-4 h-4" /> : <Save className="w-4 h-4" />}
                {saved ? 'Saved!' : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
