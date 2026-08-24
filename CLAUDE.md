# FX Journal (Zenith Guide) — Project Guidelines & Architecture

## Overview
**Zenith FX Journal** is a high-performance, futuristic cyberpunk-themed Forex & Prop Firm Trading Journal web application. It combines automated trade analytics, AI coaching, prop firm challenge tracking, and risk management with a rich visual interface (HUDs, audio cues, theme engine, custom cursor).

---

## 🚀 Complete Feature & Module Breakdown

### 1. 📊 Advanced Trade Logging & History
- **Comprehensive Trade Entry ([src/pages/AddTrade.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/pages/AddTrade.tsx))**:
  - Pair / Asset selector (Forex pairs, Indices, Crypto, Commodities).
  - Order direction (Buy / Sell / Long / Short).
  - Exact entry price, exit price, stop loss, take profit, lot size, and commission.
  - Automatic P&L and Risk-to-Reward (R:R) computation.
  - Multi-image screenshot upload for trade setups, execution, and exit.
  - Emotional state tracking (Disciplined, FOMO, Revenge, Hesitant, Greedy, Anxious).
  - Trading session tagging (Asian, London, New York, London Close).
  - Strategy setup tagging and mistake categorization (early exit, wide stop, chasing).
- **Interactive Trade History ([src/pages/TradeHistory.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/pages/TradeHistory.tsx))**:
  - Full-featured data grid with pagination, sorting, and fast search.
  - Multi-criteria filtering (date ranges, pairs, win/loss/break-even, strategy tags, sessions).
  - CSV Import & Export powered by PapaParse for MetaTrader (MT4/MT5) and cTrader reports.
  - Detailed modal view for reviewing individual trade setups and metrics.

### 2. 🏆 Prop Firm Challenge Tracker & Rule Engine
- **Challenge Lifecycle Monitor ([src/pages/ChallengeTracker.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/pages/ChallengeTracker.tsx), [src/lib/challengeEngine.ts](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/lib/challengeEngine.ts))**:
  - Out-of-the-box templates for top prop firms: **FTMO, FundedNext, The Funded Trader, MFF, E8, Alpha Capital**.
  - Multi-phase progression: Phase 1 (Student/Evaluation), Phase 2 (Verification), and Funded Account.
  - **Daily Drawdown Monitor**: Real-time tracking against starting-of-day equity with violation thresholds.
  - **Max Trailing & Static Drawdown Engine**: Trailing high-water mark vs fixed initial balance logic.
  - **Profit Target Progress Bar**: Dynamic visual target percentage indicator.
  - **Trading Days Verification**: Minimum and maximum trading day requirement tracker.
  - **Hard & Soft Breach Alerts**: Visual and audio warning triggers when risk limits are approached.

### 3. 📈 In-Depth Analytics & Metrics
- **Performance Intelligence ([src/pages/Analytics.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/pages/Analytics.tsx))**:
  - High-level KPIs: Net Profit, Win Rate %, Loss Rate %, Profit Factor, Expectancy, Total Trades.
  - Interactive cumulative P&L and equity curves with drawdown overlays.
  - Risk-to-Reward distribution and realized vs planned R:R analysis.
  - Pair & Asset performance breakdown (identifying most profitable vs leaking pairs).
  - Session performance matrix (London vs New York vs Asian profitability).
  - Day-of-week and time-of-day edge analysis.
  - Long vs. Short win rate and volume comparisons.

### 4. 🧠 AI Trading Coach & Machine Learning Engine
- **Behavioral Leak Detection ([src/pages/AICoach.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/pages/AICoach.tsx), [src/lib/aiCoach.ts](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/lib/aiCoach.ts))**:
  - Automated detection of revenge trading (rapid consecutive losses with increased lot size).
  - Overtrading warnings and emotional tilt detection based on trade frequency.
  - Trade execution grading (A+, A, B, C, F) based on rule compliance.
- **Predictive ML Quality Scoring ([src/lib/mlEngine.ts](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/lib/mlEngine.ts))**:
  - Trade outcome probability estimation based on historical confluence matches.
  - Actionable improvement insights and psychology coaching suggestions.

### 5. 📅 Interactive P&L Calendar
- **Day-by-Day Visualizer ([src/pages/Calendar.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/pages/Calendar.tsx))**:
  - Monthly and weekly grid calendar displaying daily net profit/loss and trade count.
  - Color-coded profit/loss day cards with win/loss ratio for each day.
  - Click-to-inspect daily trade breakdown modal.

### 6. 📖 Trading Playbook & Strategy Builder
- **Strategy Management ([src/pages/Playbook.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/pages/Playbook.tsx))**:
  - Repository of personalized trading models (e.g. ICT Silver Bullet, Order Block Retest, Breakout).
  - Pre-trade checklist items and mandatory confluence rules.
  - High-probability setup screenshot galleries for visual benchmarking.

### 7. 🛡️ Risk Management & Sizing Calculator
- **Capital Protection Hub ([src/pages/Risk.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/pages/Risk.tsx), [src/lib/riskEngine.ts](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/lib/riskEngine.ts))**:
  - Precision lot size and position sizing calculator based on account balance & risk %.
  - Pip value calculator across major, minor, and exotic Forex pairs.
  - Risk-of-ruin simulator and daily loss stop guardrails.

### 8. 👤 User Profile, Account Tiers & Subscriptions
- **Trader Settings ([src/pages/Profile.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/pages/Profile.tsx))**:
  - User profile details, avatar, rank badges, and trading goals.
  - Linked prop firm account management and active account switcher.
  - Data management (clear cache, sample data generator, export all data).
- **Subscription Plans & Billing ([src/pages/Plans.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/pages/Plans.tsx), [src/pages/Payment.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/pages/Payment.tsx))**:
  - Free, Pro, and Zenith Elite subscription tier plans with feature gates and checkout flow.

### 9. 🛠️ Admin Multi-Trader Oversight
- **Admin Dashboard ([src/pages/AdminDashboard.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/pages/AdminDashboard.tsx), [src/pages/AdminTraderView.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/pages/AdminTraderView.tsx))**:
  - System-wide metrics, active traders list, challenge pass/fail statistics.
  - Deep-dive view into individual trader logs for prop firm managers or mentors.

### 10. ⚡ Futuristic Zenith OS Aesthetics & UI Engine
- **Cyberpunk Tactical HUD ([src/components/JarvisHUD.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/components/JarvisHUD.tsx))**: Live system metrics, audio feedback, and tactical overlay.
- **Interactive Cursor ([src/components/CustomCursor.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/components/CustomCursor.tsx))**: Fluid particle trails, magnetic snapping to buttons, and customizable glow.
- **Dynamic Backgrounds ([src/components/FuturisticBackground.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/components/FuturisticBackground.tsx))**: Scanlines, dynamic cyber grid, and canvas particle nodes.
- **Theme & Audio Control ([src/contexts/ThemeSettingsContext.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/contexts/ThemeSettingsContext.tsx))**: Neon color palette switches, sound effect toggles, animation speed settings.

### 11. 🔒 Authentication & Cloud Security
- **Firebase Auth ([src/pages/Auth.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/pages/Auth.tsx), [src/contexts/AuthContext.tsx](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/contexts/AuthContext.tsx))**: Email/password, Google OAuth, session persistence.
- **Firestore Security Rules ([firestore.rules](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/firestore.rules))**: Strict user data isolation preventing cross-user data access.

---

## Technical Stack
- **Framework & Build**: React 18 (TypeScript), Vite
- **UI & Styling**: Tailwind CSS, Radix UI primitives (`shadcn/ui`), Framer Motion, Lucide React icons
- **State Management & Data Fetching**: TanStack Query (`@tanstack/react-query`), React Context API (`ThemeSettingsContext`, `AuthContext`), custom hooks
- **Backend & Persistence**: Firebase Firestore (`firebase@^12`), Firebase Authentication
- **Data Parsing & Utilities**: PapaParse (CSV imports/exports), `date-fns`, `clsx`, `tailwind-merge`
- **Testing**: Vitest (`vitest run`)

---

## Common Development Commands
```bash
# Start local development server
npm run dev

# Run TypeScript & ESLint checks
npm run lint

# Build for production
npm run build

# Run unit tests
npm test

# Run tests in watch mode
npm run test:watch
```

---

## Codebase Architecture & Structure

```
journal-zenith-guide-main/
├── public/                 # Static assets, sounds, audio effects
├── src/
│   ├── assets/             # Images, logos, lottie animations
│   ├── components/         # Reusable UI components, HUD widgets, Layouts
│   │   ├── ui/             # Radix / shadcn UI primitive wrappers
│   │   ├── CustomCursor.tsx # Cyberpunk interactive cursor with particle trails
│   │   ├── JarvisHUD.tsx    # Sci-fi tactical HUD overlay
│   │   ├── Sidebar.tsx      # Collapsible navigation with active routes
│   │   └── FuturisticBackground.tsx # Canvas / animated grid backdrop
│   ├── contexts/           # Global React Contexts
│   │   ├── AuthContext.tsx          # Firebase authentication session & user profile
│   │   └── ThemeSettingsContext.tsx # Futuristic OS theme, sound toggles, cursor config
│   ├── hooks/              # Custom React hooks (useToast, useTrades, etc.)
│   ├── lib/                # Core business logic & engines
│   │   ├── challengeEngine.ts       # Prop firm rule evaluator & drawdown engine
│   │   ├── aiCoach.ts              # Trading psychology & pattern analysis engine
│   │   ├── mlEngine.ts             # Trade outcome prediction & trade quality scoring
│   │   ├── riskEngine.ts           # Lot size calculations & risk limits
│   │   ├── tradeStore.ts           # Firestore sync and local trade state management
│   │   ├── tradeTypes.ts           # TypeScript interfaces for trades, accounts, challenges
│   │   └── firebase.ts             # Firebase app initialization
│   ├── pages/              # Routed page views
│   │   ├── Index.tsx               # Main Dashboard with metrics & live equity curve
│   │   ├── TradeHistory.tsx        # Comprehensive trade table, filters, CSV exports
│   │   ├── AddTrade.tsx            # Manual trade logging & screenshot uploads
│   │   ├── ChallengeTracker.tsx    # Prop firm phase & violation monitoring
│   │   ├── Analytics.tsx           # Deep dive stats (Win rate, R:R, Pair performance)
│   │   ├── AICoach.tsx             # AI trading mentor & behavioral feedback
│   │   ├── Profile.tsx             # User profile, account tiers & preferences
│   │   ├── Calendar.tsx            # P&L trading calendar view
│   │   ├── Playbook.tsx            # Trading setups & rule checklists
│   │   ├── Risk.tsx                # Risk calculator & daily limit checker
│   │   ├── Plans.tsx               # Subscription tiers & pricing
│   │   ├── Payment.tsx             # Payment gateway integration
│   │   ├── AdminDashboard.tsx      # Admin overview of all traders
│   │   └── AdminTraderView.tsx     # Admin specific trader log viewer
│   ├── test/               # Test setup and unit test suites
│   ├── App.tsx             # Root router, query client provider, route guards
│   ├── index.css           # Global Tailwind tokens, custom scrollbars, animations
│   └── main.tsx            # React DOM mounting
├── firestore.rules         # Cloud Firestore security rules
└── tailwind.config.ts      # Custom cyber/zenith theme colors and keyframes
```

---

## Coding Standards & Guidelines

### 1. TypeScript & Type Safety
- Always define explicit types in [src/lib/tradeTypes.ts](file:///Users/abhijeetkhaire/Downloads/WEB%20PROJECTS/journal-zenith-guide-main/src/lib/tradeTypes.ts) for any new trading, metric, or user entities.
- Avoid `any` types wherever possible. Use discriminated unions for trade statuses and challenge phases.

### 2. UI & Design System
- Maintain the **Zenith OS** aesthetic: neon accents (`cyan`, `emerald`, `amber`, `rose`), subtle glassmorphism (`backdrop-blur-md`), and dark futuristic backdrops.
- Keep animations performant using Framer Motion with `layout` and hardware-accelerated transforms.
- Respect accessibility and mobile responsiveness across all viewports.

### 3. Financial & Trading Math Precision
- Avoid standard floating-point precision pitfalls when calculating P&L, lot sizes, percentages, and drawdowns. Round values appropriately for display (e.g. `2` decimal places for currency, `4` for forex pips).
- Distinguish clearly between **Trailing Drawdown** and **Static Balance Drawdown** in `challengeEngine.ts`.

### 4. Firestore Security & Optimization
- Client-side queries should strictly filter by the authenticated user's `userId`.
- Keep Firestore read/write operations batch-optimized and cache-friendly via TanStack Query.
