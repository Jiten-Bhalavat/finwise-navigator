

# Updated Plan: FinanceHub with Capital One Nessie API

## What changes with Nessie

Instead of generating all mock stock/transaction data locally, we'll use Capital One's Nessie API (`api.nessieisreal.com`) to provide realistic mock banking data for accounts, transactions, purchases, and merchants. Stock price data will still be locally generated (Nessie doesn't cover stock prices), but all portfolio/transaction operations will flow through Nessie.

Nessie requires a free API key (obtained via GitHub login at api.nessieisreal.com). This is a **public hackathon API key** — safe to store as a project secret.

## Architecture

```text
┌─────────────────────────────────────────────────┐
│  React Frontend (Dashboard Layout)              │
│  ┌──────┐ ┌──────────────────────────────────┐  │
│  │Sidebar│ │  Learn | Advisor | News | Trade  │  │
│  │      │ │                                  │  │
│  └──────┘ └──────────────────────────────────┘  │
│         ↕ Supabase Edge Functions               │
│  ┌──────────────┬───────────────────────────┐   │
│  │ nessie-proxy │ elevenlabs-voice (future)  │   │
│  │ (accounts,   │                           │   │
│  │  purchases,  │                           │   │
│  │  transfers)  │                           │   │
│  └──────┬───────┴───────────────────────────┘   │
│         ↓                                       │
│  Capital One Nessie API                         │
└─────────────────────────────────────────────────┘
```

## Implementation Steps

### Step 1: Design System Setup
- Update `index.css` with Navy Trust palette (HSL values for navy/blue tones)
- Add Libre Baskerville + IBM Plex Sans via Google Fonts in `index.html`
- Update Tailwind config with custom colors

### Step 2: Dashboard Layout Shell
- Create `AppLayout.tsx` with collapsible sidebar (Learn, Advisor, News, Trade sections)
- Add routes for `/learn`, `/advisor`, `/news`, `/trade`
- Sidebar with icons (GraduationCap, Brain, Newspaper, TrendingUp)
- Top header bar with section title and user area

### Step 3: Nessie API Integration
- Store the Nessie API key as a project secret
- Create a Supabase Edge Function `nessie-proxy` that proxies requests to `api.nessieisreal.com`
- Endpoints to support:
  - `GET /customers` — list/create mock customers
  - `GET /accounts` — fetch accounts with balances
  - `POST /accounts/{id}/purchases` — create a purchase (buy stock)
  - `GET /accounts/{id}/purchases` — get purchase history (portfolio)
  - `GET /merchants` — stock "merchants" representing companies (AAPL, GOOGL, etc.)
- Create React hooks (`useAccounts`, `usePurchases`, `useMerchants`) for data fetching

### Step 4: Mock Stock Data Layer
- Create `src/data/stocks.ts` with ~20 popular US stocks (AAPL, GOOGL, MSFT, NVDA, TSLA, AMZN, META, etc.)
- Each stock has: ticker, name, sector, generated 6-month daily price history (realistic random walk)
- Key metrics: current price, change %, 52-week high/low, P/E ratio, market cap
- This data powers charts and the Advisor section

### Step 5: Learn Section (Voice AI Placeholder)
- Build the UI for the voice learning section
- Conversation-style interface with suggested starter questions
- Placeholder for ElevenLabs integration (will need API key later)
- Display pre-written educational content as fallback cards (What is a Stock?, How to Analyze Stocks, Understanding P/E Ratio, etc.)

### Step 6: Advisor Section (AI Chat)
- Text chatbot interface with message input
- When user asks about a stock, display:
  - 6-month price chart (Recharts line/area chart)
  - Key metrics card
  - Mock sentiment analysis (bullish/bearish/neutral)
  - Buy/Hold/Sell recommendation
- Pre-built response templates for common queries
- Placeholder for real AI integration later

### Step 7: News Section
- Mock news feed with financial news cards
- Ticker bar showing top 5 stocks with price movement
- Categories: Market Overview, Top Movers, Earnings, Breaking News
- Each card: headline, summary, timestamp, sentiment badge, related ticker
- Filter/search functionality

### Step 8: Trade Section (Buy & Sell with Nessie)
- Stock search with autocomplete from the mock stock list
- Stock detail view with interactive price chart
- Buy/Sell forms that create purchases via Nessie API
- Portfolio view showing all holdings from Nessie accounts:
  - Current value, cost basis, gain/loss (green/red)
  - Total portfolio value and daily change
- Transaction history table from Nessie purchase data

### Step 9: Dashboard Home
- Overview page at `/` showing:
  - Portfolio summary card (total value, daily change)
  - Top movers widget
  - Recent transactions
  - Quick action buttons to each section

## Technical Details

- **Nessie API base**: `http://api.nessieisreal.com` — all calls need `?key={API_KEY}` query param
- **Nessie data mapping**: We'll create "merchant" entries for each stock ticker, and use "purchases" as stock buy transactions
- **Charts**: Recharts (already available) for all data visualization
- **State management**: React Query for server state, local state for UI
- **Routing**: React Router with nested routes under the dashboard layout

## What We'll Need From You
- A Nessie API key (free, from api.nessieisreal.com after GitHub login) — we'll prompt you to add it as a secret when we get to that step

