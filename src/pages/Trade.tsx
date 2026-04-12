import { useState, useEffect, useRef, useCallback } from "react";
import {
  createChart,
  CandlestickSeries,
  LineSeries,
  LineStyle,
  ColorType,
  type IChartApi,
  type ISeriesApi,
  type CandlestickSeriesOptions,
} from "lightweight-charts";
import {
  Search, X, Settings, Info, Zap, ChevronDown,
  TrendingUp, TrendingDown, RefreshCw, Calendar, Plus, Minus,
  CheckCircle2, AlertCircle, Wallet,
} from "lucide-react";
import { usePortfolio } from "@/context/PortfolioContext";
import {
  fetchOHLCV,
  searchSymbols,
  calcSMA,
  filterByPeriod,
  type OHLCVBar,
  type TimePeriod,
  type SymbolResult,
} from "@/data/stockAPI";
import { stocks } from "@/data/stocks";

/* ─── Colour constants ───────────────────────────────────────── */
const UP_COLOR   = "#16a34a";
const DOWN_COLOR = "#dc2626";

const logoColors: Record<string, string> = {
  NVDA: "#76b900", AAPL: "#555", MSFT: "#00a4ef", TSLA: "#cc0000",
  META: "#0082fb", AMZN: "#ff9900", GOOGL: "#4285f4", JPM: "#003087",
  V: "#1a1f71", JNJ: "#ca0028", WMT: "#0071ce", BAC: "#e31837",
  XOM: "#e71d23", DIS: "#0053a0", NFLX: "#e50914", AMD: "#ed1c24",
};

function CompanyBadge({ ticker, size = 8 }: { ticker: string; size?: number }) {
  const bg = logoColors[ticker] ?? "#6366f1";
  return (
    <div
      className={`h-${size} w-${size} rounded-lg flex items-center justify-center text-white font-bold shrink-0`}
      style={{ background: bg, fontSize: size <= 6 ? 9 : size <= 8 ? 11 : 13 }}
    >
      {ticker.slice(0, 2)}
    </div>
  );
}

/* ─── Sparkline (SVG) ────────────────────────────────────────── */
function MiniSparkline({ ticker, up }: { ticker: string; up: boolean }) {
  const stock = stocks.find((s) => s.ticker === ticker);
  if (!stock) return null;
  const pts = stock.priceHistory.slice(-15).map((p) => p.price);
  const mn = Math.min(...pts), mx = Math.max(...pts), rng = mx - mn || 1;
  const W = 60, H = 24;
  const points = pts.map((p, i) => `${(i / (pts.length - 1)) * W},${H - ((p - mn) / rng) * (H - 4) - 2}`).join(" ");
  return (
    <svg width={W} height={H}>
      <polyline points={points} fill="none" stroke={up ? UP_COLOR : DOWN_COLOR} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Candlestick chart (lightweight-charts v5) ──────────────── */
function CandlestickChart({
  data,
  period,
  onPeriodChange,
  loading,
}: {
  data: OHLCVBar[];
  period: TimePeriod;
  onPeriodChange: (p: TimePeriod) => void;
  loading: boolean;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#9ca3af",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#f0f4ff", style: LineStyle.Solid },
        horzLines: { color: "#f0f4ff", style: LineStyle.Solid },
      },
      crosshair: { vertLine: { color: "#6366f1" }, horzLine: { color: "#6366f1" } },
      rightPriceScale: { borderColor: "#e8eaf5" },
      timeScale: { borderColor: "#e8eaf5", timeVisible: true },
      width: containerRef.current.clientWidth,
      height: 280,
    });

    chartRef.current = chart;

    // Candles
    const candleSeries = chart.addSeries(CandlestickSeries as unknown as new () => ISeriesApi<"Candlestick">, {
      upColor: UP_COLOR,
      downColor: DOWN_COLOR,
      borderUpColor: UP_COLOR,
      borderDownColor: DOWN_COLOR,
      wickUpColor: UP_COLOR,
      wickDownColor: DOWN_COLOR,
    } as Partial<CandlestickSeriesOptions>);

    const filtered = filterByPeriod(data, period);
    candleSeries.setData(filtered as Parameters<typeof candleSeries.setData>[0]);

    // SMA overlays
    const sma10 = calcSMA(filtered, 10);
    const sma20 = calcSMA(filtered, 20);
    const sma50 = calcSMA(filtered, 50);

    const s10 = chart.addSeries(LineSeries as unknown as new () => ISeriesApi<"Line">, {
      color: "#ef4444", lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false,
    });
    s10.setData(sma10 as Parameters<typeof s10.setData>[0]);

    const s20 = chart.addSeries(LineSeries as unknown as new () => ISeriesApi<"Line">, {
      color: "#f59e0b", lineWidth: 1, lineStyle: LineStyle.Dotted, priceLineVisible: false, lastValueVisible: false,
    });
    s20.setData(sma20 as Parameters<typeof s20.setData>[0]);

    const s50 = chart.addSeries(LineSeries as unknown as new () => ISeriesApi<"Line">, {
      color: "#6366f1", lineWidth: 1, lineStyle: LineStyle.Dashed, priceLineVisible: false, lastValueVisible: false,
    });
    s50.setData(sma50 as Parameters<typeof s50.setData>[0]);

    chart.timeScale().fitContent();

    // Resize observer
    const ro = new ResizeObserver(() => {
      if (containerRef.current) {
        chart.applyOptions({ width: containerRef.current.clientWidth });
      }
    });
    if (containerRef.current) ro.observe(containerRef.current);

    return () => {
      ro.disconnect();
      chart.remove();
      chartRef.current = null;
    };
  }, [data, period]);

  const periods: TimePeriod[] = ["1D", "1M", "3M", "6M", "1Y"];

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-sm text-foreground">Performance</h2>
        <div className="flex items-center gap-1">
          {periods.map((p) => (
            <button
              key={p}
              onClick={() => onPeriodChange(p)}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                period === p
                  ? "bg-primary text-white shadow-sm"
                  : "text-muted-foreground hover:bg-muted/60"
              }`}
            >
              {p}
            </button>
          ))}
          <button className="ml-1 p-1.5 rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors">
            <Calendar className="h-3.5 w-3.5" />
          </button>
          <button className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted/60 transition-colors">
            <RefreshCw className="h-3.5 w-3.5" />
          </button>
        </div>
      </div>

      {/* MA legend */}
      <div className="flex items-center gap-4 mb-2 text-[10px] font-medium text-muted-foreground">
        <span className="flex items-center gap-1"><span className="h-px w-5 bg-red-400 inline-block border-t border-dashed border-red-400" />SMA 10</span>
        <span className="flex items-center gap-1"><span className="h-px w-5 bg-amber-400 inline-block border-t border-dotted border-amber-400" />SMA 20</span>
        <span className="flex items-center gap-1"><span className="h-px w-5 bg-indigo-400 inline-block border-t border-dashed border-indigo-400" />SMA 50</span>
      </div>

      <div className="relative bg-white rounded-xl border border-border overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
            <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        <div ref={containerRef} className="w-full" />
      </div>
    </div>
  );
}

/* ─── Types ──────────────────────────────────────────────────── */
type OrderType = "Delivery" | "MTF" | "Intraday";
type TradeTab  = "Buy" | "Sell";


/* ─── Page ───────────────────────────────────────────────────── */
export default function TradePage() {
  /* ── Context: shared portfolio state across all pages ── */
  const {
    nessieAcct, nessieLoading, txHistory, walletBalance,
    holdings, totalCurrent, totalInvested, totalReturns, dayReturns,
    refreshBalance, buyStock, sellStock,
  } = usePortfolio();

  const [query,          setQuery]          = useState("");
  const [searchOpen,     setSearchOpen]     = useState(false);
  const [searchResults,  setSearchResults]  = useState<SymbolResult[]>([]);
  const [selectedTicker, setSelectedTicker] = useState<string>("TSLA");
  const [ohlcv,          setOhlcv]          = useState<OHLCVBar[]>([]);
  const [period,         setPeriod]         = useState<TimePeriod>("6M");
  const [loading,        setLoading]        = useState(true);
  const [tradeTab,       setTradeTab]       = useState<TradeTab>("Buy");
  const [orderType,      setOrderType]      = useState<OrderType>("Delivery");
  const [quantity,       setQuantity]       = useState(1);
  const [page,           setPage]           = useState(1);
  const [orderDone,      setOrderDone]      = useState<{ msg: string; ok: boolean } | null>(null);
  const searchRef = useRef<HTMLDivElement>(null);
  const ROWS_PER_PAGE = 5;

  /* Load OHLCV whenever ticker changes */
  const loadChart = useCallback(async (ticker: string) => {
    setLoading(true);
    const data = await fetchOHLCV(ticker);
    setOhlcv(data);
    setLoading(false);
  }, []);

  useEffect(() => { loadChart(selectedTicker); }, [selectedTicker, loadChart]);

  /* Debounced search */
  useEffect(() => {
    if (!query) { setSearchResults([]); return; }
    const t = setTimeout(async () => {
      const r = await searchSymbols(query);
      setSearchResults(r);
    }, 300);
    return () => clearTimeout(t);
  }, [query]);

  /* Close dropdown on outside click */
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setSearchOpen(false);
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  /* Derived: selected stock info */
  const stock = stocks.find((s) => s.ticker === selectedTicker);
  const up    = (stock?.changePercent ?? 0) >= 0;

  /* Pagination */
  const totalPages = Math.ceil(holdings.length / ROWS_PER_PAGE);
  const pageHoldings = holdings.slice((page - 1) * ROWS_PER_PAGE, page * ROWS_PER_PAGE);

  /* Execute trade — delegates to PortfolioContext (Nessie + holdings) */
  async function executeTrade() {
    if (!stock || quantity <= 0) return;
    const result = tradeTab === "Buy"
      ? await buyStock(selectedTicker, quantity, stock.currentPrice)
      : await sellStock(selectedTicker, quantity, stock.currentPrice);
    setOrderDone(result);
    setTimeout(() => setOrderDone(null), 4000);
  }

  return (
    <div className="flex min-h-full">
      {/* ── Left (main) panel ── */}
      <div className="flex-1 min-w-0 px-6 py-5 space-y-5 overflow-auto">

        {/* Holdings header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <h2 className="font-semibold text-base text-foreground">Holdings</h2>
            <span className="h-6 px-2 bg-primary/10 text-primary text-xs font-bold rounded-full flex items-center">
              {holdings.length}
            </span>
          </div>
          <div className="flex items-center gap-3 text-xs text-primary">
            <button className="flex items-center gap-1 hover:underline">
              <Zap className="h-3 w-3" /> Activate DDPI
            </button>
            <button className="flex items-center gap-1 hover:underline">
              <Info className="h-3 w-3" /> Verify Holdings
            </button>
          </div>
        </div>

        {/* Portfolio stats row */}
        <div className="bg-white rounded-2xl border border-border p-4">
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Current</div>
              <div className="text-xl font-bold text-foreground">${totalCurrent.toFixed(0)}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Invested</div>
              <div className="text-sm font-semibold text-foreground">${totalInvested.toFixed(1)}</div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Total Returns</div>
              <div className={`text-sm font-semibold ${totalReturns >= 0 ? "text-green-600" : "text-red-500"}`}>
                {totalReturns >= 0 ? "+" : ""}${totalReturns.toFixed(1)}
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">Return %</div>
              <div className={`text-sm font-semibold ${totalReturns >= 0 ? "text-green-600" : "text-red-500"}`}>
                {totalInvested > 0 ? ((totalReturns / totalInvested) * 100).toFixed(1) : "0"}%
              </div>
            </div>
            <div>
              <div className="text-[10px] text-muted-foreground uppercase tracking-wide mb-1">1 Day Returns</div>
              <div className={`text-sm font-semibold ${dayReturns >= 0 ? "text-green-600" : "text-red-500"}`}>
                {dayReturns >= 0 ? "+" : ""}${dayReturns.toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Chart section */}
        <div className="bg-white rounded-2xl border border-border p-4">
          {ohlcv.length > 0 ? (
            <CandlestickChart
              data={ohlcv}
              period={period}
              onPeriodChange={setPeriod}
              loading={loading}
            />
          ) : (
            <div className="h-64 flex flex-col items-center justify-center gap-3 text-sm">
              {loading ? (
                <div className="h-6 w-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
              ) : selectedTicker && !stock ? (
                <>
                  <div className="text-red-500 font-medium">"{selectedTicker}" is not in our supported stock list.</div>
                  <div className="text-muted-foreground text-xs text-center max-w-xs">
                    Only US stocks from our database are supported for charting and trading.<br />
                    Use the quick-pick panel on the right to choose a supported stock.
                  </div>
                </>
              ) : (
                <div className="text-muted-foreground">Select a stock to view its chart</div>
              )}
            </div>
          )}

          {/* Stock price bar below chart */}
          {stock && (
            <div className="flex items-center gap-4 mt-3 pt-3 border-t border-border/60">
              <CompanyBadge ticker={stock.ticker} size={8} />
              <div>
                <div className="font-semibold text-sm text-foreground">{stock.ticker} — {stock.name}</div>
                <div className="text-xs text-muted-foreground">{stock.sector}</div>
              </div>
              <div className="ml-auto text-right">
                <div className="font-bold text-foreground">${stock.currentPrice.toFixed(2)}</div>
                <div className={`text-xs font-medium flex items-center gap-0.5 justify-end ${up ? "text-green-600" : "text-red-500"}`}>
                  {up ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                  {up ? "+" : ""}{stock.change.toFixed(2)} ({up ? "+" : ""}{stock.changePercent}%)
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Holdings table */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left text-xs font-semibold text-muted-foreground px-5 py-3">
                  <span className="flex items-center gap-1">Company <ChevronDown className="h-3 w-3" /></span>
                </th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-3">Qty.</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-3 hidden sm:table-cell">Mkt. Price</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-3 hidden md:table-cell">Invested</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-3 py-3">Current</th>
                <th className="text-right text-xs font-semibold text-muted-foreground px-5 py-3">Returns</th>
              </tr>
            </thead>
            <tbody>
              {pageHoldings.map((h, i) => {
                const s = stocks.find((x) => x.ticker === h.ticker);
                const gain = h.current - h.invested;
                const gainPct = h.invested > 0 ? (gain / h.invested) * 100 : 0;
                const isUp = gain >= 0;
                const isSelected = h.ticker === selectedTicker;
                return (
                  <tr
                    key={h.ticker}
                    onClick={() => setSelectedTicker(h.ticker)}
                    className={`border-b border-border/50 cursor-pointer transition-colors ${
                      isSelected ? "bg-secondary/40" : "hover:bg-muted/30"
                    } ${i === pageHoldings.length - 1 ? "border-b-0" : ""}`}
                  >
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <CompanyBadge ticker={h.ticker} size={8} />
                        <div>
                          <div className="font-semibold text-sm text-foreground">{h.ticker}</div>
                          <div className="text-[10px] text-muted-foreground">{h.name.split(" ")[0]}</div>
                        </div>
                        {s && (
                          <div className="hidden lg:block">
                            <MiniSparkline ticker={h.ticker} up={isUp} />
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-foreground">{h.qty}</td>
                    <td className="px-3 py-3 text-right text-sm text-muted-foreground hidden sm:table-cell">
                      ${h.mktPrice.toFixed(0)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm text-muted-foreground hidden md:table-cell">
                      ${h.invested.toFixed(0)}
                    </td>
                    <td className="px-3 py-3 text-right text-sm font-medium text-foreground">
                      ${h.current.toFixed(0)}
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className={`text-sm font-semibold ${isUp ? "text-green-600" : "text-red-500"}`}>
                        {isUp ? "↑" : "↓"} ${Math.abs(gain).toFixed(2)}
                      </div>
                      <div className={`text-[10px] ${isUp ? "text-green-500" : "text-red-400"}`}>
                        {isUp ? "+" : ""}{gainPct.toFixed(1)}%
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* Pagination */}
          <div className="flex items-center justify-between px-5 py-3 border-t border-border text-sm text-muted-foreground">
            <span>Page {page} of {totalPages || 1}</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border hover:bg-muted/50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right panel ── */}
      <aside className="w-[272px] shrink-0 border-l border-border bg-white flex flex-col overflow-auto hidden xl:flex">

        {/* Wallet card — live Nessie balance */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-semibold text-sm text-foreground">FinWise Wallet</h3>
            <button
              onClick={refreshBalance}
              className="text-xs text-primary hover:underline flex items-center gap-1"
            >
              <Plus className="h-3 w-3" /> Add Funds
            </button>
          </div>
          <div
            className="rounded-2xl p-4 relative overflow-hidden"
            style={{
              background:
                "linear-gradient(135deg, #c084fc 0%, #a78bfa 15%, #60a5fa 30%, #34d399 50%, #fbbf24 70%, #f87171 100%)",
            }}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-2.5 py-1 rounded-full">
                <Wallet className="h-3 w-3 text-white" />
                <span className="text-white text-xs font-medium">Wallet</span>
                <ChevronDown className="h-3 w-3 text-white/80" />
              </div>
              {/* Live indicator */}
              <div className="flex items-center gap-1 bg-white/15 px-2 py-0.5 rounded-full">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-300 animate-pulse" />
                <span className="text-white/80 text-[9px] font-medium">LIVE</span>
              </div>
            </div>
            <div className="mt-4">
              <div className="text-white/70 text-[10px]">
                Available wallet balance
              </div>
              <div className="text-white text-2xl font-bold mt-1">
                ${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
              <div className="text-white/70 text-[10px] mt-0.5">
                Portfolio: ${totalCurrent.toFixed(2)} · P&L: {totalReturns >= 0 ? "+" : ""}${totalReturns.toFixed(2)}
              </div>
            </div>
          </div>

          {/* Recent Nessie transactions */}
          {txHistory.length > 0 && (
            <div className="mt-3">
              <div className="text-xs font-semibold text-muted-foreground mb-2">Recent Transactions</div>
              <div className="space-y-1.5 max-h-32 overflow-y-auto">
                {txHistory.slice(0, 6).map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-4 w-4 rounded-full flex items-center justify-center text-white text-[8px] font-bold ${tx.type === "buy" ? "bg-green-500" : "bg-red-500"}`}>
                        {tx.type === "buy" ? "B" : "S"}
                      </span>
                      <span className="text-muted-foreground truncate max-w-[120px]">{tx.desc.replace(/^(BUY|SELL)\s/, "")}</span>
                    </div>
                    <span className={`font-semibold ${tx.type === "buy" ? "text-red-500" : "text-green-600"}`}>
                      {tx.type === "buy" ? "-" : "+"}${tx.amount.toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Buy/Sell panel */}
        <div className="flex-1 p-4 space-y-3 overflow-auto">
          <h3 className="font-semibold text-sm text-foreground">Buy/Sell Stock</h3>

          {/* Stock search */}
          <div ref={searchRef} className="relative">
            <div className="flex items-center gap-2 bg-muted/50 border border-border rounded-xl px-3 py-2">
              <Search className="h-3.5 w-3.5 text-muted-foreground/70 shrink-0" />
              <input
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSearchOpen(true); }}
                onFocus={() => setSearchOpen(true)}
                placeholder="Search stock..."
                className="flex-1 text-sm bg-transparent outline-none placeholder:text-muted-foreground/50"
              />
            </div>
            {searchOpen && searchResults.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-20 bg-white border border-border rounded-xl mt-1 shadow-lg max-h-52 overflow-y-auto">
                {searchResults.map((r) => (
                  <button
                    key={r.ticker}
                    className="w-full flex items-center justify-between px-3 py-2.5 hover:bg-muted/40 text-left transition-colors"
                    onClick={() => {
                      setSelectedTicker(r.ticker);
                      setQuery("");
                      setSearchOpen(false);
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <CompanyBadge ticker={r.ticker} size={6} />
                      <div>
                        <div className="text-xs font-semibold text-foreground">{r.ticker}</div>
                        <div className="text-[10px] text-muted-foreground truncate max-w-[110px]">{r.name}</div>
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{r.exchange}</div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Quick-pick popular stocks — shown when no stock is selected */}
          {!stock && (
            <div>
              <div className="text-[10px] text-muted-foreground font-semibold uppercase tracking-wide mb-2">
                Supported US Stocks — click to view
              </div>
              <div className="flex flex-wrap gap-1.5">
                {stocks.map((s) => (
                  <button
                    key={s.ticker}
                    onClick={() => { setSelectedTicker(s.ticker); setQuery(""); setSearchOpen(false); }}
                    className="flex items-center gap-1 px-2 py-1 bg-muted/40 border border-border hover:border-primary/40 hover:bg-secondary/60 rounded-lg text-[11px] font-semibold text-foreground transition-all"
                  >
                    <span
                      className="h-3.5 w-3.5 rounded-sm flex items-center justify-center text-white text-[7px] font-bold shrink-0"
                      style={{ background: logoColors[s.ticker] ?? "#6366f1", fontSize: 7 }}
                    >
                      {s.ticker.slice(0, 1)}
                    </span>
                    {s.ticker}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Selected stock pill */}
          {stock && (
            <div className="flex items-start justify-between bg-muted/30 rounded-xl p-3 border border-border/60">
              <div>
                <div className="font-bold text-sm text-foreground">{stock.ticker}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">
                  {stock.sector} · ${stock.currentPrice.toFixed(2)}{" "}
                  <span className={up ? "text-green-600" : "text-red-500"}>
                    ({up ? "+" : ""}{stock.changePercent}%)
                  </span>
                </div>
              </div>
              <button
                onClick={() => { setSelectedTicker(""); setOhlcv([]); }}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* Buy / Sell tabs */}
          <div className="grid grid-cols-2 border border-border rounded-xl overflow-hidden">
            {(["Buy", "Sell"] as TradeTab[]).map((t) => (
              <button
                key={t}
                onClick={() => setTradeTab(t)}
                className={`py-2 text-sm font-semibold transition-colors ${
                  tradeTab === t
                    ? t === "Buy"
                      ? "bg-green-600 text-white"
                      : "bg-red-500 text-white"
                    : "text-muted-foreground hover:bg-muted/40"
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Order type segment */}
          <div className="flex items-center gap-1 bg-muted/40 rounded-xl p-1">
            {(["Delivery", "MTF", "Intraday"] as OrderType[]).map((t) => (
              <button
                key={t}
                onClick={() => setOrderType(t)}
                className={`flex-1 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  orderType === t
                    ? "bg-white shadow-sm text-primary border border-border/60"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {t}
              </button>
            ))}
            <button className="p-1.5 text-muted-foreground hover:text-foreground">
              <Settings className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Quantity */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-foreground">Quantity</span>
              <span className="text-xs text-muted-foreground flex items-center gap-0.5">
                BSE <ChevronDown className="h-3 w-3" />
              </span>
            </div>
            <div className="flex items-center gap-2 border border-border rounded-xl px-3 py-2 bg-white">
              <span className="flex-1 text-sm font-medium text-foreground">
                {quantity.toFixed(2)}
              </span>
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="h-6 w-6 rounded-md bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Minus className="h-3 w-3 text-muted-foreground" />
              </button>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="h-6 w-6 rounded-md bg-muted/60 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Plus className="h-3 w-3 text-muted-foreground" />
              </button>
            </div>
          </div>

          {/* Price — read-only, always current market price */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-foreground">Market Price</span>
              <span className="text-xs text-muted-foreground flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
                Live
              </span>
            </div>
            <div className="w-full border border-border rounded-xl px-3 py-2 bg-muted/30 flex items-center justify-between">
              <span className="text-sm font-semibold text-foreground">
                ${stock ? stock.currentPrice.toFixed(2) : "—"}
              </span>
              {stock && (
                <span className={`text-xs font-medium ${(stock.changePercent ?? 0) >= 0 ? "text-green-600" : "text-red-500"}`}>
                  {(stock.changePercent ?? 0) >= 0 ? "+" : ""}{stock.changePercent}%
                </span>
              )}
            </div>
          </div>

          {/* Order Validity */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-medium text-foreground">Order Validity</span>
              <button className="text-muted-foreground">
                <Info className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex items-center justify-between border border-border rounded-xl px-3 py-2 bg-white cursor-pointer hover:bg-muted/20 transition-colors">
              <span className="text-sm text-foreground">GTC</span>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </div>
          </div>

          {/* Order total — always quantity × live market price */}
          {stock && quantity > 0 && (
            <div className="bg-secondary/50 border border-secondary rounded-xl px-3 py-2.5 text-xs flex flex-col gap-1.5">
              <div className="flex justify-between text-muted-foreground">
                <span>{quantity} share{quantity > 1 ? "s" : ""} × ${stock.currentPrice.toFixed(2)}</span>
                <span className="font-semibold text-foreground">
                  ${(quantity * stock.currentPrice).toFixed(2)}
                </span>
              </div>
              <div className="flex justify-between text-muted-foreground border-t border-border/40 pt-1.5">
                <span>Balance after</span>
                <span className={`font-semibold ${
                  tradeTab === "Buy"
                    ? walletBalance - quantity * stock.currentPrice < 0 ? "text-red-500" : "text-foreground"
                    : "text-green-600"
                }`}>
                  ${(
                    tradeTab === "Buy"
                      ? walletBalance - quantity * stock.currentPrice
                      : walletBalance + quantity * stock.currentPrice
                  ).toFixed(2)}
                </span>
              </div>
            </div>
          )}

          {/* Exchange watch warning */}
          <div className="flex items-center gap-1.5 text-[10px] text-amber-600 bg-amber-50 border border-amber-100 rounded-xl px-3 py-2">
            <Info className="h-3.5 w-3.5 shrink-0" />
            Stock is under watch by exchange
          </div>

          {/* Order status toast */}
          {orderDone && (
            <div className={`flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium border ${
              orderDone.ok
                ? "bg-green-50 border-green-200 text-green-700"
                : "bg-red-50 border-red-200 text-red-600"
            }`}>
              {orderDone.ok
                ? <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
                : <AlertCircle className="h-3.5 w-3.5 shrink-0" />}
              {orderDone.msg}
            </div>
          )}

          {/* BUY / SELL button */}
          <button
            onClick={executeTrade}
            disabled={!stock}
            className={`w-full py-3 rounded-xl font-bold text-white text-sm flex items-center justify-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-md ${
              tradeTab === "Buy"
                ? "bg-gradient-to-r from-orange-400 to-orange-500 hover:from-orange-500 hover:to-orange-600 shadow-orange-200"
                : "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 shadow-red-200"
            }`}
          >
            {tradeTab === "Buy" ? <Zap className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
            {tradeTab.toUpperCase()}
          </button>
        </div>
      </aside>
    </div>
  );
}
