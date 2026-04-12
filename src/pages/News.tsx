import { useState, useEffect } from "react";
import { usePortfolio } from "@/context/PortfolioContext";
import {
  TrendingUp, TrendingDown, Search, BarChart2, Calendar,
  LineChart, Layers, Microscope, Globe, ChevronDown, ChevronUp,
  Plus, Check, RefreshCw,
} from "lucide-react";
import { stocks } from "@/data/stocks";
import { mockNews, type NewsItem } from "@/data/news";
import { fetchQuotes, type LiveQuote } from "@/data/stockAPI";

/* ─── Tickers to fetch live ──────────────────────────────────── */
const TICKER_BAR  = ["AAPL", "NVDA", "TSLA", "META", "AMZN", "GOOGL"];
const CARD_STOCKS = ["NVDA", "AAPL", "TSLA"];
const WATCH_STOCKS = ["AAPL", "MSFT", "NVDA"];
const ALL_LIVE = [...new Set([...TICKER_BAR, ...WATCH_STOCKS])]; // 7 unique

/* ─── Helpers ────────────────────────────────────────────────── */
function getTimeAgo(timestamp: string) {
  const diff = Date.now() - new Date(timestamp).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const h = Math.floor(mins / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

function Sparkline({ ticker, up }: { ticker: string; up: boolean }) {
  const stock = stocks.find((s) => s.ticker === ticker);
  const pts = stock?.priceHistory.slice(-20) ?? [];
  if (pts.length < 2) return null;
  const prices = pts.map((p) => p.price);
  const mn = Math.min(...prices), mx = Math.max(...prices), rng = mx - mn || 1;
  const W = 80, H = 36;
  const points = prices
    .map((p, i) => `${(i / (prices.length - 1)) * W},${H - ((p - mn) / rng) * (H - 4) - 2}`)
    .join(" ");
  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      <polyline points={points} fill="none"
        stroke={up ? "#16a34a" : "#dc2626"} strokeWidth="1.5"
        strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const logoColors: Record<string, string> = {
  NVDA: "#76b900", AAPL: "#555", MSFT: "#00a4ef", TSLA: "#cc0000",
  META: "#0082fb", AMZN: "#ff9900", GOOGL: "#4285f4", JPM: "#003087",
  V: "#1a1f71", JNJ: "#ca0028",
};

function PriceSkeleton() {
  return <span className="inline-block h-4 w-14 rounded bg-muted/60 animate-pulse" />;
}

/* ─── Ticker Bar ─────────────────────────────────────────────── */
function TickerBar({ quotes, loading }: { quotes: Map<string, LiveQuote>; loading: boolean }) {
  return (
    <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: "none" }}>
      {TICKER_BAR.map((ticker) => {
        const q   = quotes.get(ticker);
        const up  = (q?.changePercent ?? 0) >= 0;
        const s   = stocks.find((x) => x.ticker === ticker);
        return (
          <div
            key={ticker}
            className="flex items-center gap-3 bg-white border border-border rounded-2xl px-4 py-3 shrink-0 hover:border-primary/30 hover:shadow-sm transition-all duration-200 cursor-pointer"
          >
            <div>
              <div className="font-bold text-xs text-foreground tracking-wide">{ticker}</div>
              <div className="text-xs text-muted-foreground mt-0.5">
                {loading ? <PriceSkeleton /> : `$${(q?.price ?? s?.currentPrice ?? 0).toFixed(2)}`}
              </div>
            </div>
            <span className={`text-xs font-semibold flex items-center gap-1 px-2 py-1 rounded-full ${
              up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
            }`}>
              {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
              {loading ? "—" : `${up ? "+" : ""}${(q?.changePercent ?? 0).toFixed(2)}%`}
            </span>
          </div>
        );
      })}
    </div>
  );
}

/* ─── Most Traded Stock Card ─────────────────────────────────── */
function StockCard({ ticker, quotes, loading }: { ticker: string; quotes: Map<string, LiveQuote>; loading: boolean }) {
  const q     = quotes.get(ticker);
  const local = stocks.find((s) => s.ticker === ticker);
  const price = q?.price ?? local?.currentPrice ?? 0;
  const pct   = q?.changePercent ?? local?.changePercent ?? 0;
  const up    = pct >= 0;
  const color = logoColors[ticker] ?? "#6366f1";
  const name  = local?.name ?? ticker;

  return (
    <div className="bg-white rounded-2xl border border-border p-4 flex flex-col gap-3 hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-full flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: color }}>
            {ticker.slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold text-sm text-foreground leading-tight">
              {name.split(" ").slice(0, 2).join(" ")}
            </div>
            <div className="text-xs text-muted-foreground">{ticker}</div>
          </div>
        </div>
        {loading ? (
          <PriceSkeleton />
        ) : (
          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${
            up ? "bg-green-50 text-green-600" : "bg-red-50 text-red-500"
          }`}>
            {up ? "+" : ""}{pct.toFixed(2)}%
          </span>
        )}
      </div>
      <div className="flex items-end justify-between">
        <div>
          <div className="text-[11px] text-muted-foreground">Current Value</div>
          <div className="text-lg font-bold text-foreground">
            {loading ? <PriceSkeleton /> : `$${price.toFixed(2)}`}
          </div>
          {q?.latestTradingDay && (
            <div className="text-[10px] text-muted-foreground mt-0.5 flex items-center gap-1">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live · {q.latestTradingDay}
            </div>
          )}
        </div>
        <Sparkline ticker={ticker} up={up} />
      </div>
    </div>
  );
}

/* ─── News Category Tool Cards ───────────────────────────────── */
// Maps tool label → news category filter value
const toolFilterMap: Record<string, string> = {
  "Market Overview": "Market Overview",
  "Earnings":        "Earnings",
  "Breaking News":   "Breaking News",
  "Top Movers":      "Top Movers",
  "Analysis":        "Top Movers",     // map to closest existing category
  "Economy":         "Market Overview", // map to closest existing category
};

const newsTools = [
  { label: "Market Overview", icon: Globe,       color: "#6366f1", bg: "#eef2ff" },
  { label: "Earnings",        icon: BarChart2,   color: "#f59e0b", bg: "#fffbeb" },
  { label: "Breaking News",   icon: Layers,      color: "#ef4444", bg: "#fef2f2" },
  { label: "Top Movers",      icon: TrendingUp,  color: "#10b981", bg: "#f0fdf4" },
  { label: "Analysis",        icon: Microscope,  color: "#3b82f6", bg: "#eff6ff" },
  { label: "Economy",         icon: LineChart,   color: "#8b5cf6", bg: "#f5f3ff" },
];

function ToolCard({
  tool,
  active,
  onClick,
}: {
  tool: typeof newsTools[0];
  active: boolean;
  onClick: () => void;
}) {
  const Icon = tool.icon;
  return (
    <button
      onClick={onClick}
      className={`bg-white rounded-2xl border p-4 flex flex-col items-center gap-2 hover:shadow-md transition-all cursor-pointer w-full ${
        active ? "border-primary shadow-sm shadow-primary/10" : "border-border hover:border-primary/20"
      }`}
    >
      <div
        className="h-12 w-12 rounded-xl flex items-center justify-center transition-transform hover:scale-105"
        style={{ background: active ? tool.color : tool.bg }}
      >
        <Icon className="h-6 w-6" style={{ color: active ? "#fff" : tool.color }} />
      </div>
      <span className={`text-xs font-semibold text-center leading-tight ${active ? "text-primary" : "text-foreground/80"}`}>
        {tool.label}
      </span>
    </button>
  );
}

/* ─── Top Sectors ────────────────────────────────────────────── */
// Maps sector → news tickers to filter by
const sectorTickerMap: Record<string, string[]> = {
  "Technology":    ["NVDA", "AAPL", "MSFT", "META", "GOOGL", "ORCL", "CRM"],
  "Finance":       ["JPM", "BAC", "V"],
  "Healthcare":    ["JNJ", "UNH"],
  "Consumer":      ["AMZN", "WMT", "PG", "HD"],
  "Energy":        ["XOM"],
  "Entertainment": ["DIS", "NFLX"],
  "Automotive":    ["TSLA"],
};

const sectorData = [
  { name: "Technology",    count: 263, color: "#6366f1" },
  { name: "Finance",       count: 189, color: "#f59e0b" },
  { name: "Healthcare",    count: 257, color: "#10b981" },
  { name: "Consumer",      count: 248, color: "#3b82f6" },
  { name: "Energy",        count: 154, color: "#ef4444" },
  { name: "Entertainment", count: 101, color: "#8b5cf6" },
  { name: "Automotive",    count: 57,  color: "#06b6d4" },
];

/* ─── Sentiment badge ────────────────────────────────────────── */
function SentimentBadge({ sentiment }: { sentiment: NewsItem["sentiment"] }) {
  const map = {
    bullish: "bg-green-50 text-green-600 border-green-100",
    bearish: "bg-red-50 text-red-500 border-red-100",
    neutral: "bg-gray-50 text-gray-500 border-gray-100",
  };
  return (
    <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${map[sentiment]}`}>
      {sentiment}
    </span>
  );
}

/* ─── Watchlist (right panel) ────────────────────────────────── */
const watchlistGroups = [
  {
    name: "Top 10 hot", count: 10,
    tickers: ["AAPL", "NVDA", "TSLA", "META", "AMZN", "GOOGL", "MSFT", "JPM", "V", "NFLX"],
  },
  {
    name: "Technology", count: 7, expand: true,
    tickers: ["AAPL", "MSFT", "NVDA", "GOOGL", "META", "ORCL", "CRM"],
  },
  {
    name: "Green Energy", count: 3,
    tickers: ["XOM", "WMT", "JNJ"],
  },
  {
    name: "Healthcare Trending", count: 2,
    tickers: ["JNJ", "UNH"],
  },
  {
    name: "High Risk-High Return", count: 4,
    tickers: ["TSLA", "NVDA", "NFLX", "META"],
  },
  {
    name: "Finance Stocks", count: 3,
    tickers: ["JPM", "BAC", "V"],
  },
];

function WatchlistRow({
  group,
  quotes,
  loading,
}: {
  group: typeof watchlistGroups[0];
  quotes: Map<string, LiveQuote>;
  loading: boolean;
}) {
  const [open, setOpen] = useState(group.expand ?? false);
  return (
    <div>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between py-2.5 hover:bg-muted/30 px-1 rounded-lg transition-colors"
      >
        <div className="text-sm font-medium text-foreground">{group.name}</div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">{group.count} items</span>
          {open ? <ChevronUp className="h-3.5 w-3.5 text-muted-foreground" />
                : <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />}
        </div>
      </button>

      {open && group.tickers && (
        <div className="flex flex-col gap-1 pb-1">
          {group.tickers.map((ticker) => {
            const q     = quotes.get(ticker);
            const local = stocks.find((s) => s.ticker === ticker);
            const price = q?.price ?? local?.currentPrice ?? 0;
            const chg   = q?.change ?? local?.change ?? 0;
            const up    = chg >= 0;
            return (
              <div key={ticker} className="flex items-center justify-between px-1 py-1.5">
                <div className="flex items-center gap-2">
                  <div
                    className="h-6 w-6 rounded-md flex items-center justify-center text-white text-[9px] font-bold"
                    style={{ background: logoColors[ticker] ?? "#6366f1" }}
                  >
                    {ticker.slice(0, 2)}
                  </div>
                  <div>
                    <div className="text-xs font-medium text-foreground leading-tight">
                      {local?.name.split(" ")[0] ?? ticker}
                    </div>
                    <div className="text-[10px] text-muted-foreground">{ticker}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-xs font-semibold text-foreground">
                    {loading ? <PriceSkeleton /> : `$${price.toFixed(2)}`}
                  </div>
                  <div className={`text-[10px] font-medium ${up ? "text-green-600" : "text-red-500"}`}>
                    {loading ? "—" : `${up ? "+" : ""}${chg.toFixed(2)}`}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ─── News table row ─────────────────────────────────────────── */
function NewsRow({ item, last }: { item: NewsItem; last: boolean }) {
  return (
    <tr className={`hover:bg-muted/30 transition-colors ${!last ? "border-b border-border/60" : ""}`}>
      <td className="px-5 py-3">
        <div className="flex items-center gap-3">
          <div
            className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
            style={{ background: logoColors[item.ticker ?? ""] ?? "#6366f1" }}
          >
            {item.ticker ? item.ticker.slice(0, 2) : item.source[0]}
          </div>
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground leading-tight line-clamp-1">{item.headline}</div>
            {item.ticker && <div className="text-xs text-muted-foreground mt-0.5">{item.ticker}</div>}
          </div>
        </div>
      </td>
      <td className="px-3 py-3 hidden md:table-cell">
        <span className="text-xs text-muted-foreground whitespace-nowrap">{item.category}</span>
      </td>
      <td className="px-3 py-3 hidden sm:table-cell">
        <SentimentBadge sentiment={item.sentiment} />
      </td>
      <td className="px-3 py-3 hidden lg:table-cell">
        <span className="text-xs text-muted-foreground">{item.source}</span>
      </td>
      <td className="px-5 py-3">
        <div className="flex items-center justify-end gap-2">
          <span className="text-xs text-muted-foreground whitespace-nowrap">{getTimeAgo(item.timestamp)}</span>
          <button className="h-6 w-6 rounded-full border-2 border-primary/30 flex items-center justify-center hover:bg-primary hover:border-primary group transition-all">
            {item.sentiment === "bullish"
              ? <Check className="h-3 w-3 text-primary group-hover:text-white" />
              : <Plus  className="h-3 w-3 text-primary group-hover:text-white" />}
          </button>
        </div>
      </td>
    </tr>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
const categories = ["All", "Market Overview", "Top Movers", "Earnings", "Breaking News"] as const;

export default function NewsPage() {
  const { walletBalance, totalCurrent, totalReturns, tradeCount } = usePortfolio();

  const [category,      setCategory]      = useState<string>("All");
  const [activeSector,  setActiveSector]  = useState<string | null>(null);
  const [search,        setSearch]        = useState("");
  const [quotes,        setQuotes]        = useState<Map<string, LiveQuote>>(new Map());
  const [quotesLoading, setQuotesLoading] = useState(true);
  const [lastUpdated,   setLastUpdated]   = useState<string>("");

  const loadQuotes = async () => {
    setQuotesLoading(true);
    const map = await fetchQuotes(ALL_LIVE);
    setQuotes(map);
    setLastUpdated(new Date().toLocaleTimeString());
    setQuotesLoading(false);
  };

  useEffect(() => { loadQuotes(); }, []);

  // When a sector is selected, reset category filter (and vice-versa)
  function handleSectorClick(name: string) {
    setActiveSector((prev) => (prev === name ? null : name));
    setCategory("All");
  }

  function handleCategoryTool(label: string) {
    const mapped = toolFilterMap[label] ?? "All";
    setCategory((prev) => (prev === mapped ? "All" : mapped));
    setActiveSector(null);
  }

  const sectorTickers = activeSector ? (sectorTickerMap[activeSector] ?? []) : null;

  const filtered = mockNews.filter((n) => {
    // Sector filter takes priority
    if (sectorTickers) {
      return n.ticker ? sectorTickers.includes(n.ticker) : false;
    }
    if (category !== "All" && n.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return (
        n.headline.toLowerCase().includes(q) ||
        n.summary.toLowerCase().includes(q) ||
        n.ticker?.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div className="flex gap-0 min-h-full">
      {/* ── Main content ── */}
      <div className="flex-1 min-w-0 px-6 py-5 space-y-6 overflow-auto">

        {/* Page header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">Market News</h1>
            <p className="text-xs text-muted-foreground mt-0.5">Real-time prices · Live financial news</p>
          </div>
          <div className="flex items-center gap-3">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">Updated {lastUpdated}</span>
            )}
            <button
              onClick={loadQuotes}
              disabled={quotesLoading}
              className="flex items-center gap-1.5 text-xs text-primary bg-secondary/50 border border-secondary px-3 py-1.5 rounded-xl hover:bg-secondary transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`h-3 w-3 ${quotesLoading ? "animate-spin" : ""}`} />
              {quotesLoading ? "Fetching…" : "Refresh"}
            </button>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-white border border-border rounded-xl px-3 py-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
              Live · Alpha Vantage
            </div>
          </div>
        </div>

        {/* Ticker strip */}
        <TickerBar quotes={quotes} loading={quotesLoading} />

        {/* Section 1: Most traded */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-base text-foreground">Most traded on FinWise</h2>
            <button className="text-sm text-primary hover:underline">See more</button>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {CARD_STOCKS.map((ticker) => (
              <StockCard key={ticker} ticker={ticker} quotes={quotes} loading={quotesLoading} />
            ))}
          </div>
        </section>

        {/* Section 2: News Categories */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-base text-foreground">News Categories</h2>
            {category !== "All" && (
              <button
                onClick={() => setCategory("All")}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Clear filter ×
              </button>
            )}
          </div>
          <div className="grid grid-cols-3 sm:grid-cols-6 gap-3">
            {newsTools.map((t) => (
              <ToolCard
                key={t.label}
                tool={t}
                active={category === toolFilterMap[t.label] && category !== "All"}
                onClick={() => handleCategoryTool(t.label)}
              />
            ))}
          </div>
        </section>

        {/* Section 3: Top Sectors */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-base text-foreground">Top Sectors</h2>
            {activeSector && (
              <button
                onClick={() => setActiveSector(null)}
                className="text-xs text-muted-foreground hover:text-primary transition-colors"
              >
                Clear filter ×
              </button>
            )}
          </div>
          <div className="bg-white rounded-2xl border border-border p-4 flex flex-wrap gap-x-4 gap-y-2.5">
            {sectorData.map((s) => (
              <button
                key={s.name}
                onClick={() => handleSectorClick(s.name)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border transition-all text-sm ${
                  activeSector === s.name
                    ? "border-transparent text-white font-semibold"
                    : "border-border/60 text-foreground/80 hover:border-primary/30 hover:bg-muted/30"
                }`}
                style={activeSector === s.name ? { background: s.color } : {}}
              >
                <span className="h-2 w-2 rounded-full shrink-0" style={{ background: s.color }} />
                {s.name}
                <span className={`font-semibold ml-0.5 ${activeSector === s.name ? "text-white" : "text-primary"}`}>
                  {s.count}
                </span>
              </button>
            ))}
          </div>
        </section>

        {/* Section 4: Latest News table */}
        <section>
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-base text-foreground">Latest News</h2>
              {activeSector && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary text-white font-medium">
                  {activeSector} sector
                </span>
              )}
              {category !== "All" && !activeSector && (
                <span className="text-xs px-2.5 py-1 rounded-full bg-primary text-white font-medium">
                  {category}
                </span>
              )}
            </div>
            <span className="text-xs text-muted-foreground">{filtered.length} articles</span>
          </div>
          <div className="flex items-center gap-3 mb-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground/60" />
              <input
                placeholder="Search news..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="h-9 w-full pl-8 pr-3 rounded-xl bg-muted/60 border border-border text-sm placeholder:text-muted-foreground/60 focus:outline-none focus:ring-2 focus:ring-primary/20 transition-all"
              />
            </div>
            <div className="flex gap-1.5 flex-wrap">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                    category === c
                      ? "bg-primary text-white shadow-sm shadow-primary/25"
                      : "bg-white border border-border text-muted-foreground hover:border-primary/30 hover:text-foreground"
                  }`}
                >
                  {c}
                </button>
              ))}
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-border overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">Article</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-3 hidden md:table-cell">Category</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-3 hidden sm:table-cell">Sentiment</th>
                  <th className="text-left text-xs font-semibold text-muted-foreground px-3 py-3 hidden lg:table-cell">Source</th>
                  <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Time</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="text-center text-muted-foreground py-10 text-sm">
                      No news matching your criteria.
                    </td>
                  </tr>
                ) : (
                  filtered.map((item, i) => (
                    <NewsRow key={item.id} item={item} last={i === filtered.length - 1} />
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* ── Right panel ── */}
      <aside className="w-[268px] shrink-0 border-l border-border bg-white flex flex-col overflow-auto hidden xl:flex">
        {/* Portfolio card */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-foreground">Your Investments</h3>
            <button className="text-xs text-primary hover:underline">Dashboard</button>
          </div>
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #c084fc 0%, #a78bfa 15%, #60a5fa 30%, #34d399 45%, #fbbf24 60%, #f87171 75%, #c084fc 100%)",
            }}
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="text-white/80 text-[10px] font-medium">
                  {new Date().toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                </div>
                <div className="text-white text-xs font-semibold mt-3">Jiten Bhalavat</div>
                <div className="text-white/70 text-[10px]">@jiten_finwise</div>
              </div>
              <div className="grid grid-cols-2 gap-0.5 h-7 w-7 mt-1">
                <div className="rounded-sm bg-white/40" />
                <div className="rounded-sm bg-white/60" />
                <div className="rounded-sm bg-white/30" />
                <div className="rounded-sm bg-white/50" />
              </div>
            </div>
            <div className="mt-3">
              <div className="text-white/70 text-[10px] font-medium">Portfolio Value</div>
              <div className="text-white text-2xl font-bold mt-0.5">
                ${totalCurrent.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-white/80 text-xs mt-0.5 font-medium">
                {totalReturns >= 0 ? "+" : ""}${Math.abs(totalReturns).toFixed(2)} total returns
              </div>
            </div>
            <div className="mt-2 flex items-center gap-3">
              <div className="text-white/70 text-[10px]">
                Wallet: ${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 0 })}
              </div>
              <div className="text-white/70 text-[10px]">
                Trades: {tradeCount}
              </div>
            </div>
          </div>
        </div>

        {/* Watchlists with live prices */}
        <div className="flex-1 p-4 overflow-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-semibold text-sm text-foreground">All Watchlists</h3>
            <button className="text-xs text-primary hover:underline">View all</button>
          </div>
          <div className="divide-y divide-border">
            {watchlistGroups.map((g) => (
              <WatchlistRow key={g.name} group={g} quotes={quotes} loading={quotesLoading} />
            ))}
          </div>
          <button
            className="mt-4 w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-semibold text-foreground transition-colors hover:bg-muted/30"
            style={{
              border: "2px solid transparent",
              background:
                "linear-gradient(white, white) padding-box, linear-gradient(135deg, #c084fc, #60a5fa, #34d399, #fbbf24) border-box",
            }}
          >
            <Plus className="h-4 w-4 text-primary" />
            Create new watchlist
          </button>
        </div>
      </aside>
    </div>
  );
}
