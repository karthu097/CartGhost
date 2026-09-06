<div align="center">

# 👻 CartGhost

### AI-Powered Abandoned Cart Recovery Platform

**Turn cart abandonment into recovered revenue — without throwing discounts at every customer.**

[![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white)](https://react.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.4-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-38BDF8?logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![Vite](https://img.shields.io/badge/Vite-5-646CFF?logo=vite&logoColor=white)](https://vitejs.dev)
[![Express](https://img.shields.io/badge/Express-4-000000?logo=express&logoColor=white)](https://expressjs.com)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?logo=google&logoColor=white)](https://ai.google.dev)

---

![CartGhost Dashboard](https://img.shields.io/badge/Status-Production%20Ready-22c55e?style=for-the-badge)

</div>

---

## ✨ What is CartGhost?

CartGhost is a **full-stack SaaS dashboard** that analyzes abandoned shopping carts using real behavioral signals and Google Gemini AI to decide the *best* recovery action for each customer — not just blanket discounts.

Most tools automatically fire discounts. CartGhost asks **why** the customer abandoned first.

| Signal | Question asked |
|---|---|
| 4× size chart views | → Is this a sizing concern? |
| 6 compare actions | → Are they shopping around? |
| 3-min session, mobile | → Did checkout fail? |
| 15+ orders, high cart | → Will a loyalty discount close this? |

Then it recommends the **cheapest intervention that actually converts** — a size recommendation, a product concern answer, a personalized reminder, or only if truly justified: a discount.

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Browser                              │
│                                                             │
│   ┌─────────────┐    ┌──────────────────────────────────┐  │
│   │  React SPA  │    │          CartStore (Context)      │  │
│   │  (Vite +    │◄──►│  - 50 abandoned carts (mutable)  │  │
│   │  Tailwind)  │    │  - Live KPI recomputation        │  │
│   └──────┬──────┘    │  - updateCartStatus()            │  │
│          │           │  - updateCartDecision()           │  │
│          │ /api/*    └──────────────────────────────────┘  │
└──────────┼──────────────────────────────────────────────────┘
           │ Vite Proxy (dev) / Direct (prod)
           ▼
┌──────────────────────────────────────────────────────────────┐
│                  Express Backend (port 3001)                  │
│                                                              │
│   ┌──────────────┐    ┌──────────────────────────────────┐  │
│   │ GET /health  │    │  POST /api/analyze               │  │
│   │              │    │                                  │  │
│   │ Returns:     │    │  1. Validate request fields      │  │
│   │ - status     │    │  2. Check GEMINI_API_KEY         │  │
│   │ - gemini     │    │  3. Build behavioral prompt      │  │
│   │   configured │    │  4. Call Gemini 3.5 Flash        │  │
│   └──────────────┘    │  5. Parse + validate JSON        │  │
│                       │  6. Return structured decision   │  │
│                       └──────────────┬───────────────────┘  │
│                                      │                      │
└──────────────────────────────────────┼──────────────────────┘
                                       │ GEMINI_API_KEY (env)
                                       ▼
                           ┌───────────────────────┐
                           │  Google Gemini AI     │
                           │  (gemini-3.5-flash)   │
                           │                       │
                           │  Input: customer +    │
                           │  cart + behavior data │
                           │                       │
                           │  Output: reason,      │
                           │  action, probability, │
                           │  explanation, discount│
                           └───────────────────────┘

           If Gemini fails / key missing:
           ┌────────────────────────────┐
           │  Local Fallback Engine     │
           │  (aiDecisionEngine.ts)     │
           │                           │
           │  Deterministic scoring:   │
           │  - 5 behavioral signals   │
           │  - Waterfall reason detect│
           │  - Action selection tree  │
           │  - Revenue impact calc    │
           └────────────────────────────┘
```

### Data Flow for "Analyze with AI"

```
CartDetail page
     │
     ├─ Click "Analyze with AI"
     │
     ├─ Peek GET /api/health  ──► Show Gemini or Demo animation
     │
     ├─ POST /api/analyze
     │   └─ Payload: customer profile + cart + 8 behavior signals
     │
     ├─ Backend calls Gemini with structured prompt
     │   └─ Gemini returns: reason, confidence, probability, action, explanation
     │
     ├─ Frontend receives AIDecision
     │   └─ Persisted into CartStore via updateCartDecision()
     │
     └─ UI renders:
         ├─ Recovery Probability (%)
         ├─ AI Confidence (%)
         ├─ Detected Reason (badge)
         ├─ Recommended Action
         ├─ Gemini Explanation
         ├─ Signal Score bars (5 dimensions)
         ├─ Revenue Impact (4 metrics)
         └─ Discount: Yes/No with justification
```

---

## 🚀 Features

### Dashboard
- Live KPIs computed from real cart data (not hardcoded)
- Recovery rate, AI success rate, recoverable revenue, discounts avoided
- Revenue recovery trend chart (10-day area chart)
- AI action distribution (donut chart)
- Recent AI decisions feed — click any row to view cart detail

### Abandoned Carts
- 50 realistic carts with full behavioral data
- Search by name, email, product, city
- Filter by status, abandonment reason, discount recommendation
- Sort by cart value, recovery probability, time
- Click any row → full cart + AI analysis

### Cart Detail — The Core Flow
- Full customer profile (segment, orders, spend, location)
- Browsing behavior panel (9 signals with highlighting)
- **"Analyze with AI" button** → Gemini live analysis
  - 6-step animated progress (Gemini-specific steps vs demo steps)
  - Source badge: `Gemini AI` (purple) or `Demo Engine` (grey)
  - Behavioral signal score bars (Intent, Engagement, Uncertainty, Price Sensitivity, Loyalty)
  - Revenue impact: Cart Value / Expected Recovery / Discount Cost / Net Impact
  - Functional action buttons: Send Action, Mark Converted, Mark as Lost
  - Prevents duplicate actions on already-actioned carts

### AI Recommendations
- Tabbed view: All Pending / High Priority (≥65%) / Discount / No Discount
- Action filter dropdown
- "Act Now" button updates status across all pages instantly
- Discount Intelligence banner showing margin protection stats
- Action performance table with success rates

### Analytics
- Abandonment reason breakdown (live from cart data)
- Device breakdown, traffic source, customer segment charts
- Recovery funnel: Abandoned → Analyzed → Sent → Converted
- Action effectiveness radar

### Settings
- Live Gemini connection status (checks `/api/health` on mount)
- Persistent settings (localStorage): thresholds, notification preferences
- Security note explaining server-side key storage

---

## 🤖 AI Decision Engine

Two modes, same interface:

```typescript
// Called by CartDetail — tries Gemini first, falls back automatically
analyzeCart(cart: AbandonedCart): Promise<{ decision: AIDecision; source: 'gemini' | 'fallback' }>
```

**Gemini mode** — sends customer behavioral data to Gemini 3.5 Flash with a structured prompt. Validated response with JSON extraction, type coercion, and safe defaults for every field.

**Fallback mode** — deterministic local engine with 5 scored signals:

| Signal | Driven by |
|---|---|
| `intentScore` | Time on site, return visits, wishlist |
| `engagementScore` | Photos, reviews, product views |
| `uncertaintyScore` | Size chart views, compare actions |
| `priceSensitivityScore` | Cart value vs. spend history, segment |
| `loyaltyScore` | Order count, category purchases |

Discount logic is intentionally conservative — only offered when `loyaltyScore > 40` AND the customer is genuinely price-blocked.

---

## 📦 Project Structure

```
CartGhost/
├── src/                          # React frontend
│   ├── App.tsx                   # Router + CartStoreProvider
│   ├── store/
│   │   └── CartStore.tsx         # Global state (Context + mutations + live KPIs)
│   ├── engine/
│   │   └── aiDecisionEngine.ts   # Local AI + Gemini gateway
│   ├── services/
│   │   └── aiService.ts          # Backend HTTP client + health check
│   ├── data/
│   │   └── mockData.ts           # 50 carts, pre-computed AI decisions
│   ├── types/
│   │   └── index.ts              # All shared TypeScript types
│   ├── utils/
│   │   └── formatters.ts         # Labels, colors, currency, dates
│   ├── components/
│   │   ├── layout/               # AppLayout, Header, Sidebar
│   │   └── ui/                   # StatCard, Badge, Avatar, ProgressBar, etc.
│   └── pages/
│       ├── Dashboard.tsx
│       ├── AbandonedCarts.tsx
│       ├── CartDetail.tsx         # ← Main AI analysis page
│       ├── Customers.tsx
│       ├── AIRecommendations.tsx
│       ├── Analytics.tsx
│       └── Settings.tsx
│
├── server/                       # Express backend
│   └── src/
│       ├── index.ts              # Express server, CORS, /api/health, /api/analyze
│       ├── geminiService.ts      # Prompt builder, response parser, validation
│       └── types.ts              # Shared API contract types
│
├── .env                          # GEMINI_API_KEY (never committed)
├── .env.example                  # Template for new developers
├── .gitignore                    # Excludes .env, dist/, node_modules
├── vite.config.ts                # Vite + proxy config
└── package.json                  # Scripts: dev, build, dev:server, dev:full
```

---

## ⚡ Quick Start

### Prerequisites
- Node.js ≥ 18
- A [Google Gemini API key](https://aistudio.google.com/app/apikey) (free tier works)

### 1. Clone & Install

```bash
git clone https://github.com/karthu097/CartGhost.git
cd CartGhost

# Install frontend + backend dependencies
npm install
cd server && npm install && cd ..
```

### 2. Configure Environment

```bash
cp .env.example .env
```

Edit `.env`:
```env
GEMINI_API_KEY=your_gemini_api_key_here
PORT=3001
```

### 3. Run (Development)

**Option A — Two terminals:**
```bash
# Terminal 1: Frontend
npm run dev

# Terminal 2: Backend
npm run dev:server
```

**Option B — Single command:**
```bash
npm run dev:full
```

Open **http://localhost:5173**

> Without a Gemini API key the app still works fully — it uses the local deterministic AI engine. The sidebar shows "Demo Engine Active" instead of "Gemini AI Active".

### 4. Production Build

```bash
npm run build
```

---

## 🧪 Testing the AI Flow

1. Open **http://localhost:5173**
2. Click **Abandoned Carts** in the sidebar
3. Click any customer row
4. Click the **"Analyze with AI"** button
5. Watch the 6-step Gemini analysis animation
6. See the structured result:
   - Abandonment reason (badge)
   - Recovery probability + AI confidence
   - Recommended action with explanation
   - 5 behavioral signal score bars
   - Revenue impact (cart value / expected recovery / discount cost / net)
   - Discount decision with justification

### Sample Results Across 3 Customer Types

| Customer | Behavior | Gemini Reason | Action | Discount |
|---|---|---|---|---|
| Rahul Sharma | 18min, 4× size chart, 12 views | `size_uncertainty` | Size Recommendation | ❌ Not needed |
| Ananya Krishnan | 3min, mobile, ₹24,900 cart | `price_sensitivity` | Personalized Reminder | ❌ Not needed |
| Manish Joshi | 30min, 15 orders, 4 compares | `comparison_shopping` | Personalized Reminder | ❌ Not needed |
| Vikram Singh | Loyal, high value, abandoned before | `waiting_for_discount` | Offer Discount | ✅ 8% off |

---

## 🛡️ Security

- **API key never touches the browser** — stored in `.env`, read only by the Express server
- **`.env` is in `.gitignore`** — cannot be accidentally committed
- **Frontend bundle contains zero secrets** — Vite proxy forwards `/api/*` to the backend at runtime
- **Gemini key rotation** — edit `.env` and restart `npm run dev:server`, no frontend redeploy needed

---

## 📋 Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start Vite frontend dev server (port 5173) |
| `npm run dev:server` | Start Express backend (port 3001) |
| `npm run dev:full` | Start both concurrently |
| `npm run build` | TypeScript check + Vite production build |
| `npm run typecheck` | TypeScript check only (no emit) |
| `npm run preview` | Preview production build locally |

---

## 🗺️ Roadmap

- [ ] Real e-commerce platform webhook integration (Shopify, WooCommerce)
- [ ] Email/SMS action dispatch (SendGrid, Twilio)
- [ ] Multi-store support
- [ ] A/B testing for recovery actions
- [ ] Gemini fine-tuning on store-specific conversion data
- [ ] Historical trend tracking with persistent database

---

## 🏆 Built For

**Buildathon MVP** — CartGhost demonstrates that AI-powered cart recovery doesn't need to be a discount machine. By analyzing behavioral signals, it finds the cheapest intervention with the highest conversion probability — protecting margins while recovering revenue.

---

<div align="center">

Built with ❤️ using React · TypeScript · Tailwind CSS · Express · Google Gemini AI

</div>
