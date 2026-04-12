# FinWise Navigator

> AI-powered stock trading and financial advisory platform built for UMD BITCAMP Hackathon.

---

## Demo

<!-- Upload your demo video/gif here -->
https://github.com/user-attachments/assets/6edfe61f-28af-473c-8823-fab4a584d5c1

---

## Features

- **AI Stock Advisor** — LangGraph agent powered by Claude. Asks 6 live data sources (price history, fundamentals, news, social sentiment, market overview, stock comparison) and explains everything in plain English with a live candlestick chart
- **Voice Advisor** — ElevenLabs conversational AI for hands-free financial questions
- **Trading Dashboard** — Portfolio tracking, holdings, trade history, market preview
- **Trade Page** — Buy/sell US stocks with live Alpha Vantage price charts
- **News Feed** — Filterable financial news by category, sector, and watchlist
- **Portfolio Sync** — Wallet balance and holdings synced across all pages via React Context + localStorage

---

## Running the Project

### Frontend

**Requirements:** Node.js 18+

```bash
# Install dependencies
npm install

# Start dev server
npm run dev
```

The app runs at `http://localhost:5173` (or the next available port).

---

### Backend (AI Advisor Agent)

**Requirements:** Python 3.10+

```bash
cd backend

# Install dependencies
pip install -r requirements.txt

# Add your Anthropic API key
cp .env.example .env
# then edit .env and paste your ANTHROPIC_API_KEY

# Start the server
uvicorn main:app --reload --port 8000
```

The backend runs at `http://localhost:8000`. You can verify it's live at `http://localhost:8000/health`.

---

### Environment Variables

**Frontend** — create `.env` in the project root:

```env
VITE_ELEVENLABS_API_KEY=your_key
VITE_ELEVENLABS_AGENT_ID=your_agent_id
VITE_ALPHA_VANTAGE_KEY=your_key
VITE_NESSIE_API_KEY=your_key
```

**Backend** — create `backend/.env`:

```env
ANTHROPIC_API_KEY=your_key
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, TypeScript, Vite, Tailwind CSS |
| UI Components | shadcn/ui, Radix UI |
| Charts | TradingView lightweight-charts v5 |
| AI Agent | LangGraph + Claude claude-sonnet-4-6 (Anthropic) |
| Agent Tools | yfinance, DuckDuckGo Search |
| Backend | FastAPI, Python 3.10+ |
| Voice | ElevenLabs Conversational AI |
| Mock Banking | Capital One Nessie API |
| Stock Data | Alpha Vantage |
