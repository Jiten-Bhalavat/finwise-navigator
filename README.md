# FinWise Navigator

> AI-powered stock research, trading, and financial advisory platform — built at UMD BITCAMP 2025.

---

## Demo

<!-- Upload your demo video/gif here -->
https://github.com/user-attachments/assets/6edfe61f-28af-473c-8823-fab4a584d5c1

---

## Inspiration

Most people want to invest but feel locked out. Open a brokerage app and you're immediately hit with candlestick charts, RSI indicators, P/E ratios, and analyst jargon that takes years to understand. Meanwhile, the people who already know this stuff have access to expensive Bloomberg terminals and professional advisors.

We asked a simple question: **what if anyone — regardless of their financial background — could get the same quality of research that a professional investor gets, just by asking a question in plain English?**

That's where FinWise Navigator came from. We wanted to build the financial advisor that a first-generation investor, a college student, or someone starting their investing journey actually deserves — one that explains things like a trusted friend, not a Wall Street analyst.

---

## What It Does

FinWise Navigator is a full-stack financial platform with five core sections:

### 🤖 AI Stock Advisor
The centrepiece of the app. Ask any question — *"Should I buy Apple right now?"*, *"Is Tesla overvalued?"*, *"Compare NVIDIA vs AMD"* — and a LangGraph agent powered by Claude autonomously:
- Pulls 6 months of live price history and calculates RSI, moving averages, and trend direction
- Fetches company fundamentals (P/E ratio, revenue growth, profit margins, analyst consensus)
- Searches real-time news and financial headlines
- Scans Reddit, Twitter/X, and financial forums for retail investor sentiment
- Compares multiple stocks side-by-side when asked
- Checks overall market conditions (S&P 500, VIX, sector ETFs)

Every response comes with a **live candlestick chart** of the stock, and all financial terms are explained in plain English — no jargon without an explanation. Chat history is saved for 4 hours so you can switch pages and come back.

### 🎙️ Voice Advisor
A hands-free experience powered by ElevenLabs Conversational AI. Tap the microphone, ask your question out loud, and get a spoken response from your AI financial advisor in real time — over WebRTC.

### 📊 Dashboard
A clean portfolio overview showing wallet balance, total invested, return percentage, holdings breakdown, 30-day portfolio trend, top market movers, and recent trade history.

### 📈 Trade Page
Search and trade US stocks with live TradingView candlestick charts (SMA 10/20/50 overlays), real-time price quotes from Alpha Vantage, and a mock wallet that updates your balance the moment you buy or sell.

### 📰 News Feed
Filterable financial news across categories (Market Overview, Earnings, Breaking News, Economy, Analysis), top sectors, and personalised watchlist groups.

---

## How We Built It

### Frontend
- **React 18 + TypeScript + Vite** — fast development with full type safety
- **Tailwind CSS + shadcn/ui** — Credly-inspired light lavender design system, white cards, clean typography
- **TradingView lightweight-charts v5** — candlestick charts with SMA overlays in both the Trade page and the AI Advisor
- **React Context API** — global `PortfolioContext` syncs wallet balance and holdings across every page in real time
- **localStorage persistence** — portfolio state and chat history survive page refreshes and navigation

### AI Agent Backend
- **LangGraph (ReAct pattern)** — the agent autonomously decides which tools to call and in what order, loops until it has enough data, then synthesises a structured response
- **Claude claude-sonnet-4-6 (Anthropic)** — the language model driving reasoning, tool selection, and plain-English explanation
- **6 custom LangChain tools:**
  - `analyze_stock_performance` — yfinance: 6-month OHLCV, RSI, SMA, volatility, monthly returns
  - `get_stock_fundamentals` — yfinance: P/E, EPS, revenue, margins, analyst targets
  - `search_news_and_sentiment` — DuckDuckGo News: real-time headlines (no API key needed)
  - `search_social_sentiment` — DuckDuckGo Text: Reddit/Twitter community discussion
  - `compare_stocks` — side-by-side analysis of up to 5 tickers
  - `get_market_overview` — S&P 500, NASDAQ, VIX, 11 sector ETFs
- **FastAPI + Server-Sent Events (SSE)** — streams tool call progress and the final response word-by-word to the frontend in real time

### External APIs
| Service | Used For |
|---|---|
| Anthropic Claude | AI reasoning and natural language generation |
| ElevenLabs | Voice advisor (speech-to-speech, WebRTC) |
| Alpha Vantage | Live stock quotes and OHLCV data |
| yfinance (Yahoo Finance) | Historical data, fundamentals (free, no quota) |
| Capital One Nessie | Mock banking — recording transactions |
| DuckDuckGo Search | News and social sentiment (no API key required) |

---

## Challenges We Faced

**1. LangGraph API changes across versions**
The `create_react_agent` function had breaking changes between minor versions — `state_modifier` was removed in favour of `prompt`, which then also changed. We ended up writing a three-level fallback that tries each parameter name in order, making it compatible across versions.

**2. Backend port collision**
The Vite dev server was running on port 8081 (our chosen backend port), so the frontend's health check was hitting Vite and getting an HTML response back with status 200 — making it look like the backend was online. The actual `/advisor/chat` POST endpoint returned 404 from Vite. Took careful debugging to trace: the fix was checking `response.json()` instead of just `response.ok`.

**3. Real-time streaming UX**
Making the agent feel alive — showing which tools it's calling as it calls them, streaming the response word-by-word — required careful Server-Sent Event parsing with a line buffer, and managing rapid React state updates for each streamed word without causing UI jank.

**4. Cross-page portfolio sync**
Early on, the News page showed a hardcoded `$5,837`, the Trade page showed `$10,000`, and the Dashboard had its own separate state. Building a single React Context that correctly initialises from localStorage, handles concurrent buy/sell operations, and immediately reflects everywhere required careful design of derived vs stored state.

**5. Explaining finance without losing accuracy**
Getting Claude to explain RSI, P/E ratios, and beta in plain English — while still being technically accurate and data-driven — required a lot of prompt engineering. The system prompt has specific examples of how to phrase each term, like *"Beta of 1.4 — when the market drops 1%, this stock tends to drop 1.4%. It moves more than the market."*

---

## What We Learned

- **LangGraph's ReAct loop is powerful but fragile** — the agent will call tools in the right order, but the system prompt has to be explicit about *when* to call each tool and what to do with the results. Vague instructions produce vague analysis.

- **SSE is underrated for AI streaming** — compared to WebSockets, Server-Sent Events are simpler to implement, work with standard `fetch`, and are perfectly suited for one-way AI response streaming. We'd use them again.

- **Free data sources are surprisingly good** — yfinance gives you 10+ years of OHLCV data, full fundamentals, and analyst targets for any US stock, for free, with no API key. DuckDuckGo search gives usable news and social results without rate limits. You don't need to pay for data to build something impressive.

- **Plain English is a design decision** — financial apps default to jargon because the people who build them already understand it. Deciding that every technical term needs an immediate plain-English explanation changed the entire tone of the product.

- **localStorage is a surprisingly capable database** — for a hackathon-scale app, localStorage with a timestamp-based TTL replaces a whole backend database for user state. Portfolio, chat history, and session data all persist without a single database query.

---

## GitHub Pages

The repo includes [`.github/workflows/deploy-github-pages.yml`](.github/workflows/deploy-github-pages.yml). On each push to `main` or `master`, it builds the Vite app and publishes the `dist` folder to GitHub Pages.

1. In the GitHub repo, go to **Settings → Pages → Build and deployment**, set **Source** to **GitHub Actions** (not “Deploy from a branch”).
2. Push to `main` (or `master`). After the workflow finishes, the site is at  
   `https://<your-username>.github.io/<repository-name>/`  
   (for example `https://your-org.github.io/finwise-navigator/`).

**Optional build secrets** (Settings → Secrets and variables → Actions): add any of these so the static build embeds keys the browser needs: `VITE_ALPHA_VANTAGE_KEY`, `VITE_NESSIE_API_KEY`, `VITE_ELEVENLABS_API_KEY`, `VITE_ELEVENLABS_AGENT_ID`. For the AI advisor chat, host the FastAPI backend somewhere reachable from the browser, allow CORS for your Pages origin, and set `VITE_ADVISOR_API_URL` to that base URL (no trailing slash), for example `https://api.example.com`.

**Note:** If the repository name is `<user>.github.io` (a user/org site served from the domain root), change `VITE_BASE_PATH` in the workflow to `/` instead of `/${{ github.event.repository.name }}/`.

---

## Running the Project

### Frontend
```bash
npm install
npm run dev
```

### Backend
```bash
cd backend
pip install -r requirements.txt

# Add your Anthropic API key
cp .env.example .env   # then edit .env

uvicorn main:app --reload --port 8000
```

### Environment Variables

**`.env` (project root):**
```env
VITE_ELEVENLABS_API_KEY=your_key
VITE_ELEVENLABS_AGENT_ID=your_agent_id
VITE_ALPHA_VANTAGE_KEY=your_key
VITE_NESSIE_API_KEY=your_key
```

**`backend/.env`:**
```env
ANTHROPIC_API_KEY=your_key
```

---

## Built With

React · TypeScript · Vite · Tailwind CSS · shadcn/ui · LangGraph · Claude claude-sonnet-4-6 · FastAPI · Python · yfinance · ElevenLabs · TradingView lightweight-charts · Alpha Vantage · Capital One Nessie
