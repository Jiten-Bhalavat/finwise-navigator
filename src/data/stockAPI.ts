import { stocks } from "@/data/stocks";

export interface OHLCVBar {
  time: string; // 'YYYY-MM-DD'
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SymbolResult {
  ticker: string;
  name: string;
  exchange: string;
}

/* ─── Seeded RNG (same as stocks.ts) ─────────────────────────── */
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

/* ─── Build realistic OHLCV from a flat price-line ───────────── */
export function generateMockOHLCV(ticker: string): OHLCVBar[] {
  const stock = stocks.find((s) => s.ticker === ticker.toUpperCase());
  const history = stock?.priceHistory ?? [];
  if (history.length === 0) return [];

  const seed = ticker.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
  const rng = seededRandom(seed * 9973);

  return history.map((point, i) => {
    const close = point.price;
    const open = i > 0 ? history[i - 1].price : close * (1 - (rng() - 0.5) * 0.01);
    const bodySize = Math.abs(close - open);
    const wick = bodySize * 0.6 + close * 0.003 * rng();
    const high = Math.max(open, close) + wick * rng();
    const low = Math.min(open, close) - wick * rng();
    const vol = Math.round((500_000 + rng() * 2_000_000) * 10) / 10;

    return {
      time: point.date,
      open: +open.toFixed(2),
      high: +high.toFixed(2),
      low: +low.toFixed(2),
      close: +close.toFixed(2),
      volume: vol,
    };
  });
}

/* ─── Alpha Vantage: OHLCV ────────────────────────────────────── */
export async function fetchOHLCV(ticker: string): Promise<OHLCVBar[]> {
  const key = import.meta.env.VITE_ALPHA_VANTAGE_KEY;

  if (!key) {
    return generateMockOHLCV(ticker);
  }

  try {
    const url =
      `https://www.alphavantage.co/query` +
      `?function=TIME_SERIES_DAILY` +
      `&symbol=${encodeURIComponent(ticker)}` +
      `&outputsize=full` +
      `&apikey=${key}`;

    const res = await fetch(url);
    const data = await res.json();

    // Rate-limit note or error
    if (data["Information"] || data["Note"] || data["Error Message"]) {
      console.warn("Alpha Vantage:", data["Information"] ?? data["Note"] ?? data["Error Message"]);
      return generateMockOHLCV(ticker);
    }

    const ts: Record<string, Record<string, string>> = data["Time Series (Daily)"];
    if (!ts) return generateMockOHLCV(ticker);

    return Object.entries(ts)
      .map(([date, v]) => ({
        time: date,
        open: parseFloat(v["1. open"]),
        high: parseFloat(v["2. high"]),
        low: parseFloat(v["3. low"]),
        close: parseFloat(v["4. close"]),
        volume: parseInt(v["5. volume"] ?? "0"),
      }))
      .sort((a, b) => a.time.localeCompare(b.time));
  } catch (e) {
    console.warn("fetchOHLCV fallback:", e);
    return generateMockOHLCV(ticker);
  }
}

/* ─── Alpha Vantage: Symbol search ───────────────────────────── */
export async function searchSymbols(query: string): Promise<SymbolResult[]> {
  const key = import.meta.env.VITE_ALPHA_VANTAGE_KEY;

  // Always include local matches first
  const q = query.toLowerCase();
  const local: SymbolResult[] = stocks
    .filter((s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q))
    .slice(0, 5)
    .map((s) => ({ ticker: s.ticker, name: s.name, exchange: "NASDAQ" }));

  if (!key || query.length < 2) return local;

  try {
    const url =
      `https://www.alphavantage.co/query` +
      `?function=SYMBOL_SEARCH` +
      `&keywords=${encodeURIComponent(query)}` +
      `&apikey=${key}`;

    const res = await fetch(url);
    const data = await res.json();
    const remote: SymbolResult[] = (data.bestMatches ?? [])
      .slice(0, 6)
      .map((m: Record<string, string>) => ({
        ticker: m["1. symbol"],
        name: m["2. name"],
        exchange: m["4. region"],
      }));

    // Merge: local first, then remote (no duplicates)
    const seen = new Set(local.map((s) => s.ticker));
    return [...local, ...remote.filter((r) => !seen.has(r.ticker))].slice(0, 8);
  } catch {
    return local;
  }
}

/* ─── Live quote (GLOBAL_QUOTE) with 5-min in-memory cache ──── */
export interface LiveQuote {
  ticker: string;
  price: number;
  change: number;
  changePercent: number;
  open: number;
  high: number;
  low: number;
  prevClose: number;
  volume: number;
  latestTradingDay: string;
}

const quoteCache = new Map<string, { data: LiveQuote; ts: number }>();
const CACHE_TTL  = 5 * 60 * 1000; // 5 minutes

/** Fetch live price for a single ticker. Falls back to mock if no key or rate-limited. */
export async function fetchQuote(ticker: string): Promise<LiveQuote> {
  // Return cached result if still fresh
  const cached = quoteCache.get(ticker);
  if (cached && Date.now() - cached.ts < CACHE_TTL) return cached.data;

  const key = import.meta.env.VITE_ALPHA_VANTAGE_KEY;

  // No key → build from local mock data
  if (!key) return mockQuote(ticker);

  try {
    const url =
      `https://www.alphavantage.co/query` +
      `?function=GLOBAL_QUOTE` +
      `&symbol=${encodeURIComponent(ticker)}` +
      `&apikey=${key}`;

    const res  = await fetch(url);
    const json = await res.json();
    const q    = json["Global Quote"];

    if (!q || !q["05. price"] || json["Information"] || json["Note"]) {
      return mockQuote(ticker);
    }

    const live: LiveQuote = {
      ticker,
      price:           parseFloat(q["05. price"]),
      change:          parseFloat(q["09. change"]),
      changePercent:   parseFloat(q["10. change percent"].replace("%", "")),
      open:            parseFloat(q["02. open"]),
      high:            parseFloat(q["03. high"]),
      low:             parseFloat(q["04. low"]),
      prevClose:       parseFloat(q["08. previous close"]),
      volume:          parseInt(q["06. volume"] ?? "0"),
      latestTradingDay: q["07. latest trading day"] ?? "",
    };

    quoteCache.set(ticker, { data: live, ts: Date.now() });
    return live;
  } catch {
    return mockQuote(ticker);
  }
}

/** Fetch quotes for multiple tickers sequentially (respects rate limit). */
export async function fetchQuotes(tickers: string[]): Promise<Map<string, LiveQuote>> {
  const result = new Map<string, LiveQuote>();
  for (const ticker of tickers) {
    result.set(ticker, await fetchQuote(ticker));
    // Small pause between calls so we don't hit AV rate limit (5 req/min on free tier)
    await new Promise((r) => setTimeout(r, 250));
  }
  return result;
}

/** Build a LiveQuote from local mock data as fallback. */
function mockQuote(ticker: string): LiveQuote {
  const s = stocks.find((x) => x.ticker === ticker.toUpperCase());
  return {
    ticker,
    price:           s?.currentPrice ?? 0,
    change:          s?.change       ?? 0,
    changePercent:   s?.changePercent ?? 0,
    open:            s?.currentPrice  ?? 0,
    high:            s?.high52w       ?? 0,
    low:             s?.low52w        ?? 0,
    prevClose:       s ? s.currentPrice - s.change : 0,
    volume:          0,
    latestTradingDay: new Date().toISOString().split("T")[0],
  };
}

/* ─── Simple Moving Average helper ───────────────────────────── */
export function calcSMA(data: OHLCVBar[], period: number): { time: string; value: number }[] {
  const result: { time: string; value: number }[] = [];
  for (let i = period - 1; i < data.length; i++) {
    const avg = data.slice(i - period + 1, i + 1).reduce((s, d) => s + d.close, 0) / period;
    result.push({ time: data[i].time, value: +avg.toFixed(2) });
  }
  return result;
}

/* ─── Period filter ───────────────────────────────────────────── */
export type TimePeriod = "1D" | "1M" | "3M" | "6M" | "1Y";

export function filterByPeriod(data: OHLCVBar[], period: TimePeriod): OHLCVBar[] {
  const days: Record<TimePeriod, number> = {
    "1D": 5,
    "1M": 22,
    "3M": 65,
    "6M": 130,
    "1Y": 260,
  };
  return data.slice(-days[period]);
}
