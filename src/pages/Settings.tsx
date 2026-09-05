import { useState } from 'react';
import { Brain, Key, Bell, Sliders, Save, CheckCircle } from 'lucide-react';
import Header from '../components/layout/Header';

type Section = 'ai' | 'notifications' | 'thresholds' | 'api';

export default function Settings() {
  const [activeSection, setActiveSection] = useState<Section>('ai');
  const [saved, setSaved] = useState(false);
  const [apiKey, setApiKey] = useState('');
  const [discountThreshold, setDiscountThreshold] = useState(40);
  const [recoveryThreshold, setRecoveryThreshold] = useState(50);
  const [aiMode, setAiMode] = useState<'mock' | 'openai' | 'gemini'>('mock');

  const handleSave = () => {
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
          {/* Sidebar Nav */}
          <div className="card p-3 h-fit">
            <nav className="space-y-0.5">
              {sections.map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setActiveSection(id)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                    activeSection === id
                      ? 'bg-brand-50 text-brand-700'
                      : 'text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </nav>
          </div>

          {/* Content */}
          <div className="lg:col-span-3 space-y-5">
            {activeSection === 'ai' && (
              <div className="card p-6 space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">AI Engine Configuration</h2>
                  <p className="text-sm text-slate-500">Configure how CartGhost makes recovery decisions.</p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">AI Mode</label>
                  <div className="grid grid-cols-3 gap-3">
                    {(['mock', 'openai', 'gemini'] as const).map((mode) => (
                      <button
                        key={mode}
                        onClick={() => setAiMode(mode)}
                        className={`p-4 rounded-xl border-2 text-left transition-all ${
                          aiMode === mode
                            ? 'border-brand-500 bg-brand-50'
                            : 'border-slate-200 hover:border-brand-200'
                        }`}
                      >
                        <p className="text-sm font-semibold text-slate-900 capitalize">{mode === 'mock' ? 'Mock (Demo)' : mode === 'openai' ? 'OpenAI GPT-4' : 'Google Gemini'}</p>
                        <p className="text-xs text-slate-500 mt-0.5">
                          {mode === 'mock' ? 'Deterministic demo mode' : mode === 'openai' ? 'Requires OpenAI API key' : 'Requires Gemini API key'}
                        </p>
                        {aiMode === mode && <CheckCircle className="w-4 h-4 text-brand-600 mt-2" />}
                      </button>
                    ))}
                  </div>
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

            {activeSection === 'api' && (
              <div className="card p-6 space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">API Configuration</h2>
                  <p className="text-sm text-slate-500">Connect a real LLM to power AI decisions.</p>
                </div>
                <div className="bg-brand-50 border border-brand-100 rounded-xl p-4 text-sm text-brand-800">
                  <strong>Currently in Mock Mode.</strong> The AI engine is running deterministically without any external API calls. Add an API key below to switch to a real LLM.
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">OpenAI API Key</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      placeholder="sk-..."
                      value={apiKey}
                      onChange={(e) => setApiKey(e.target.value)}
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">Your API key is stored locally and never sent to our servers.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Google Gemini API Key</label>
                  <div className="relative">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="password"
                      placeholder="AIza..."
                      className="w-full pl-9 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Webhook URL (optional)</label>
                  <input
                    type="url"
                    placeholder="https://your-app.com/webhooks/cartghost"
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent bg-white"
                  />
                  <p className="text-xs text-slate-400 mt-1">CartGhost will POST to this URL after each AI decision.</p>
                </div>
              </div>
            )}

            {activeSection === 'thresholds' && (
              <div className="card p-6 space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">Decision Thresholds</h2>
                  <p className="text-sm text-slate-500">Fine-tune when the AI takes action.</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Minimum recovery probability to trigger action: <strong>{recoveryThreshold}%</strong>
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={90}
                    value={recoveryThreshold}
                    onChange={(e) => setRecoveryThreshold(Number(e.target.value))}
                    className="w-full accent-brand-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>10% (aggressive)</span>
                    <span>90% (conservative)</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Loyalty score required for discount: <strong>{discountThreshold}</strong>
                  </label>
                  <input
                    type="range"
                    min={10}
                    max={80}
                    value={discountThreshold}
                    onChange={(e) => setDiscountThreshold(Number(e.target.value))}
                    className="w-full accent-brand-600"
                  />
                  <div className="flex justify-between text-xs text-slate-400 mt-1">
                    <span>10 (give discounts freely)</span>
                    <span>80 (rarely discount)</span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-2">Cart value threshold for premium treatment</label>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">₹</span>
                    <input
                      type="number"
                      defaultValue={5000}
                      className="w-full pl-7 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white"
                    />
                  </div>
                </div>
              </div>
            )}

            {activeSection === 'notifications' && (
              <div className="card p-6 space-y-6">
                <div>
                  <h2 className="text-base font-semibold text-slate-900 mb-1">Notification Preferences</h2>
                  <p className="text-sm text-slate-500">Choose when and how to be notified.</p>
                </div>
                <div className="space-y-3">
                  {[
                    { label: 'New high-value cart abandoned', desc: 'Cart value above ₹10,000' },
                    { label: 'AI recommends discount', desc: 'Before sending discount offers' },
                    { label: 'Cart successfully recovered', desc: 'When a cart converts to order' },
                    { label: 'Weekly recovery report', desc: 'Sent every Monday morning' },
                    { label: 'Action send failures', desc: 'When email or SMS delivery fails' },
                  ].map((item) => (
                    <label key={item.label} className="flex items-center justify-between p-4 border border-slate-200 rounded-xl cursor-pointer hover:bg-slate-50">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{item.label}</p>
                        <p className="text-xs text-slate-500">{item.desc}</p>
                      </div>
                      <input type="checkbox" defaultChecked className="w-4 h-4 accent-brand-600" />
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Save Button */}
            <div className="flex justify-end">
              <button
                onClick={handleSave}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  saved
                    ? 'bg-green-500 text-white'
                    : 'bg-brand-600 hover:bg-brand-700 text-white'
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
