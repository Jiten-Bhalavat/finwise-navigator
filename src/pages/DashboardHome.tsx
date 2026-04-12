import { Link } from "react-router-dom";
import { TrendingUp, TrendingDown, ArrowRight, ArrowUpRight, Search } from "lucide-react";
import { stocks } from "@/data/stocks";
import { mockNews } from "@/data/news";
import { usePortfolio } from "@/context/PortfolioContext";

/* ─── Brand colours (match reference image) ─────────────────── */
const C_GREEN  = "#22c55e";
const C_YELLOW = "#f59e0b";
const C_RED    = "#ef4444";
const C_TEAL   = "#14b8a6";

const logoColors: Record<string, string> = {
  NVDA: "#76b900", AAPL: "#1d1d1f", MSFT: "#00a4ef", TSLA: "#cc0000",
  META: "#0082fb", AMZN: "#ff9900", GOOGL: "#4285f4", JPM: "#003087",
  V: "#1a1f71", JNJ: "#ca0028", WMT: "#0071ce", BAC: "#e31837",
  XOM: "#e71d23", DIS: "#0053a0", NFLX: "#e50914",
};

/* ─── Wave / Area chart (SVG) ────────────────────────────────── */
function WaveChart({
  data,
  color,
  height = 60,
  filled = true,
}: {
  data: number[];
  color: string;
  height?: number;
  filled?: boolean;
}) {
  if (data.length < 2) return null;
  const W = 200;
  const mn = Math.min(...data);
  const mx = Math.max(...data);
  const range = mx - mn || 1;
  const pts = data.map((v, i) => ({
    x: (i / (data.length - 1)) * W,
    y: height - 6 - ((v - mn) / range) * (height - 12),
  }));

  // Smooth bezier path
  const linePath = pts
    .map((p, i) => {
      if (i === 0) return `M${p.x.toFixed(1)},${p.y.toFixed(1)}`;
      const prev = pts[i - 1];
      const cpx = (prev.x + p.x) / 2;
      return `C${cpx.toFixed(1)},${prev.y.toFixed(1)} ${cpx.toFixed(1)},${p.y.toFixed(1)} ${p.x.toFixed(1)},${p.y.toFixed(1)}`;
    })
    .join(" ");

  const areaPath = `${linePath} L${W},${height} L0,${height} Z`;
  const id = `grad-${color.replace("#", "")}`;

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${height}`} preserveAspectRatio="none" className="overflow-visible">
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.35" />
          <stop offset="100%" stopColor={color} stopOpacity="0.02" />
        </linearGradient>
      </defs>
      {filled && <path d={areaPath} fill={`url(#${id})`} />}
      <path d={linePath} fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}

/* ─── Circular progress ring ─────────────────────────────────── */
function RingProgress({ pct, color, size = 90 }: { pct: number; color: string; size?: number }) {
  const r = (size - 10) / 2;
  const circ = 2 * Math.PI * r;
  const dash = (Math.min(Math.abs(pct), 100) / 100) * circ;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="8" />
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth="8"
        strokeDasharray={`${dash} ${circ}`} strokeLinecap="round" />
    </svg>
  );
}

/* ─── Horizontal bar (holdings) ─────────────────────────────── */
function HoldingBar({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div className="flex items-center gap-3">
      <span className="h-2 w-2 rounded-full shrink-0" style={{ background: color }} />
      <span className="text-sm font-medium text-gray-700 w-12 shrink-0">{label}</span>
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-700" style={{ width: `${pct}%`, background: color }} />
      </div>
      <span className="text-sm font-semibold text-gray-900 w-16 text-right shrink-0">
        ${value >= 1000 ? `${(value / 1000).toFixed(1)}K` : value.toFixed(0)}
      </span>
    </div>
  );
}

/* ─── Mini sparkline ─────────────────────────────────────────── */
function Spark({ ticker, up }: { ticker: string; up: boolean }) {
  const s = stocks.find((x) => x.ticker === ticker);
  const pts = s?.priceHistory.slice(-20).map((p) => p.price) ?? [];
  if (pts.length < 2) return null;
  const mn = Math.min(...pts), mx = Math.max(...pts), rng = mx - mn || 1;
  const W = 56, H = 22;
  const path = pts
    .map((p, i) => {
      const x = (i / (pts.length - 1)) * W;
      const y = H - ((p - mn) / rng) * (H - 4) - 2;
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");
  return (
    <svg width={W} height={H}>
      <path d={path} fill="none" stroke={up ? C_GREEN : C_RED} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function DashboardHome() {
  const {
    walletBalance, nessieLoading,
    holdings, txHistory,
    totalCurrent, totalInvested, totalReturns, dayReturns, tradeCount,
  } = usePortfolio();

  const topMovers = [...stocks]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 5);

  const latestNews = mockNews.slice(0, 4);
  const recentTrades = txHistory.slice(0, 5);
  const returnPct = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;
  const holdingsTotal = holdings.reduce((a, h) => a + h.current, 0);

  // Wave chart data: use price history of 3 different stocks (or mock flat if no holdings)
  const wave1 = stocks.find((s) => s.ticker === "AAPL")?.priceHistory.slice(-40).map((p) => p.price) ?? [];
  const wave2 = stocks.find((s) => s.ticker === "NVDA")?.priceHistory.slice(-40).map((p) => p.price) ?? [];
  const wave3 = stocks.find((s) => s.ticker === "TSLA")?.priceHistory.slice(-40).map((p) => p.price) ?? [];

  // Portfolio trend: sum of top holdings prices over time
  const trendData = stocks
    .find((s) => s.ticker === "MSFT")
    ?.priceHistory.slice(-30)
    .map((p) => p.price) ?? [];

  const holdingColors = [C_GREEN, C_TEAL, C_YELLOW, C_RED, "#8b5cf6", "#ec4899"];

  return (
    <div className="min-h-full bg-[#f8fafc] px-6 py-5 space-y-5">

      {/* ── Top bar: welcome + search + stats ── */}
      <div className="flex flex-col lg:flex-row lg:items-center gap-4">
        <div className="flex-1">
          <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Welcome back!</h1>
          <p className="text-sm text-gray-400 mt-0.5">Your Portfolio Statistics</p>
        </div>

        {/* Search */}
        <div className="relative w-full lg:w-72">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-300" />
          <input
            placeholder="Start searching here"
            className="w-full h-10 pl-9 pr-4 bg-white border border-gray-100 rounded-2xl text-sm text-gray-600 placeholder:text-gray-300 shadow-sm focus:outline-none focus:ring-2 focus:ring-indigo-100"
          />
        </div>

        {/* 3 stat pills */}
        <div className="flex gap-3 flex-wrap">
          {[
            { label: "Wallet Balance", sub: "available cash", value: `$${walletBalance.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: "#6366f1" },
            { label: "Portfolio Value", sub: `${holdings.length} positions`, value: `$${totalCurrent.toLocaleString("en-US", { maximumFractionDigits: 0 })}`, color: C_GREEN },
            { label: "Total Trades",  sub: `${tradeCount} executed`, value: `${tradeCount}`, color: C_YELLOW },
          ].map((s) => (
            <div key={s.label} className="bg-white rounded-2xl border border-gray-100 shadow-sm px-4 py-2.5 flex items-center gap-3 min-w-[140px]">
              <div className="w-1 h-8 rounded-full shrink-0" style={{ background: s.color }} />
              <div>
                <div className="text-[11px] text-gray-400 font-medium">{s.label}</div>
                <div className="flex items-baseline gap-1.5">
                  <span className="text-base font-bold text-gray-900">{s.value}</span>
                  <span className="text-[10px] text-gray-400">{s.sub}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Main grid ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* ── LEFT: Holdings panel (col-span-2) ── */}
        <div className="xl:col-span-2 bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 pt-5 pb-4">
            <div>
              <h2 className="font-bold text-gray-900 text-base">Holdings by Stock</h2>
              <p className="text-xs text-gray-400 mt-0.5">Current positions · market value</p>
            </div>
            <span className="text-xs font-semibold bg-gray-100 text-gray-500 px-3 py-1 rounded-full">All Time</span>
          </div>

          <div className="px-6 pb-4">
            {holdings.length === 0 ? (
              /* Empty state */
              <div className="flex flex-col items-center justify-center py-10 gap-3">
                <div className="h-16 w-16 rounded-2xl bg-gray-50 flex items-center justify-center">
                  <TrendingUp className="h-7 w-7 text-gray-300" />
                </div>
                <p className="text-sm text-gray-400">No positions yet</p>
                <Link to="/trade" className="text-xs font-semibold text-indigo-500 bg-indigo-50 px-4 py-1.5 rounded-full hover:bg-indigo-100 transition-colors">
                  Start Trading →
                </Link>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5">
                {/* Left: bar list */}
                <div className="space-y-2.5">
                  {holdings.slice(0, 6).map((h, i) => (
                    <HoldingBar
                      key={h.ticker}
                      label={h.ticker}
                      value={h.current}
                      total={holdingsTotal}
                      color={holdingColors[i % holdingColors.length]}
                    />
                  ))}
                </div>

                {/* Right: big total + ring */}
                <div className="flex flex-col items-center justify-center gap-2 py-2">
                  <div className="relative flex items-center justify-center">
                    <RingProgress
                      pct={Math.min(Math.abs(returnPct), 100)}
                      color={returnPct >= 0 ? C_GREEN : C_RED}
                      size={110}
                    />
                    <div className="absolute flex flex-col items-center">
                      <span className="text-xl font-bold text-gray-900">
                        ${totalCurrent >= 1000 ? `${(totalCurrent / 1000).toFixed(1)}K` : totalCurrent.toFixed(0)}
                      </span>
                      <span className="text-[10px] text-gray-400 text-center leading-tight">Portfolio<br/>Value</span>
                    </div>
                  </div>
                  <div className={`text-sm font-bold flex items-center gap-1 ${returnPct >= 0 ? "text-green-500" : "text-red-500"}`}>
                    {returnPct >= 0 ? <ArrowUpRight className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
                    {returnPct >= 0 ? "+" : ""}{returnPct.toFixed(1)}% return
                  </div>
                  <div className="text-[11px] text-gray-400">on ${totalInvested.toFixed(0)} invested</div>
                </div>
              </div>
            )}
          </div>

          {/* Details strip */}
          <div className="border-t border-gray-50 px-6 py-3 grid grid-cols-3 gap-4">
            {[
              { label: "Invested",   value: `$${totalInvested.toFixed(0)}`,                      up: true  },
              { label: "Day P&L",    value: `${dayReturns >= 0 ? "+" : ""}$${dayReturns.toFixed(2)}`, up: dayReturns >= 0 },
              { label: "Trades",     value: tradeCount.toString(),                                up: tradeCount > 0 },
            ].map((d) => (
              <div key={d.label} className="text-center">
                <div className="text-[11px] text-gray-400 font-medium mb-0.5">{d.label}</div>
                <div className={`text-sm font-bold ${d.label !== "Invested" && d.label !== "Trades" ? (d.up ? "text-green-500" : "text-red-500") : "text-gray-900"}`}>
                  {d.value}
                </div>
              </div>
            ))}
          </div>

          {/* Wave charts */}
          <div className="px-4 pb-4 grid grid-cols-3 gap-2 mt-1">
            {[
              { data: wave1, color: C_GREEN,  label: "AAPL" },
              { data: wave2, color: C_YELLOW, label: "NVDA" },
              { data: wave3, color: C_RED,    label: "TSLA" },
            ].map((w) => {
              const first = w.data[0] ?? 0;
              const last  = w.data[w.data.length - 1] ?? 0;
              const up    = last >= first;
              const pct   = first > 0 ? ((last - first) / first) * 100 : 0;
              return (
                <div key={w.label} className="bg-gray-50/70 rounded-2xl px-3 pt-2 pb-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] font-semibold text-gray-500">{w.label}</span>
                    <span className={`text-[10px] font-bold ${up ? "text-green-500" : "text-red-500"}`}>
                      {up ? "+" : ""}{pct.toFixed(1)}%
                    </span>
                  </div>
                  <WaveChart data={w.data} color={up ? w.color : C_RED} height={50} />
                </div>
              );
            })}
          </div>
        </div>

        {/* ── RIGHT: Market preview + trend ── */}
        <div className="flex flex-col gap-5">

          {/* Market Preview card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5 flex-1">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-bold text-gray-900 text-base">Market Preview</h2>
              <Link to="/trade" className="text-[11px] text-indigo-500 font-semibold hover:underline flex items-center gap-0.5">
                Trade <ArrowRight className="h-3 w-3" />
              </Link>
            </div>

            <div className="space-y-3">
              {topMovers.map((s) => {
                const up = s.changePercent >= 0;
                return (
                  <div key={s.ticker} className="flex items-center gap-3">
                    <div
                      className="h-8 w-8 rounded-xl flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                      style={{ background: logoColors[s.ticker] ?? "#6366f1" }}
                    >
                      {s.ticker.slice(0, 2)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-semibold text-gray-800">{s.ticker}</span>
                        <span className="text-sm font-bold text-gray-900">${s.currentPrice.toFixed(0)}</span>
                      </div>
                      <div className="flex items-center justify-between mt-0.5">
                        <span className="text-[11px] text-gray-400 truncate max-w-[90px]">{s.name.split(" ")[0]}</span>
                        <span className={`text-[11px] font-bold flex items-center gap-0.5 ${up ? "text-green-500" : "text-red-500"}`}>
                          {up ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                          {up ? "+" : ""}{s.changePercent}%
                        </span>
                      </div>
                    </div>
                    <Spark ticker={s.ticker} up={up} />
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div className="flex items-center gap-3 mt-4 pt-3 border-t border-gray-50">
              {[["< 0%", C_RED], ["+10%", C_YELLOW], ["+20%", C_GREEN]].map(([label, color]) => (
                <div key={label} className="flex items-center gap-1">
                  <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                  <span className="text-[10px] text-gray-400 font-medium">{label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Portfolio Trend card */}
          <div className="bg-white rounded-3xl border border-gray-100 shadow-sm p-5">
            <div className="flex items-center justify-between mb-1">
              <h2 className="font-bold text-gray-900 text-base">Portfolio Trend</h2>
              <span className="text-[11px] bg-indigo-50 text-indigo-500 font-semibold px-2.5 py-1 rounded-full">30d</span>
            </div>
            <p className="text-[11px] text-gray-400 mb-3">MSFT benchmark · last 30 days</p>
            <div className="h-[80px]">
              <WaveChart data={trendData} color="#6366f1" height={80} />
            </div>
            <div className="flex items-center justify-between mt-2">
              {(() => {
                const first = trendData[0] ?? 0;
                const last  = trendData[trendData.length - 1] ?? 0;
                const up    = last >= first;
                const pct   = first > 0 ? ((last - first) / first) * 100 : 0;
                return (
                  <>
                    <span className="text-xs text-gray-400">${first.toFixed(0)}</span>
                    <span className={`text-xs font-bold ${up ? "text-green-500" : "text-red-500"}`}>
                      {up ? "+" : ""}{pct.toFixed(1)}% this month
                    </span>
                    <span className="text-xs text-gray-400">${last.toFixed(0)}</span>
                  </>
                );
              })()}
            </div>
          </div>
        </div>
      </div>

      {/* ── Bottom: Recent Trades + Latest News ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

        {/* Recent Trades */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-gray-900 text-sm">Trade History</h2>
              {tradeCount > 0 && (
                <span className="text-[10px] font-bold bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-full">{tradeCount}</span>
              )}
            </div>
            <Link to="/trade" className="text-[11px] text-indigo-500 hover:underline font-semibold">View all →</Link>
          </div>

          {recentTrades.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">
              No trades yet —{" "}
              <Link to="/trade" className="text-indigo-500 hover:underline">make your first trade</Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-50">
              {recentTrades.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-8 w-8 rounded-xl flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
                      tx.type === "buy" ? "bg-green-500" : tx.type === "deposit" ? "bg-indigo-500" : "bg-red-500"
                    }`}>
                      {tx.type === "buy" ? "B" : tx.type === "deposit" ? "+" : "S"}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-gray-800">{tx.desc}</div>
                      <div className="text-[10px] text-gray-400 mt-0.5">{tx.date}</div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${tx.type === "buy" ? "text-red-500" : "text-green-500"}`}>
                    {tx.type === "buy" ? "−" : "+"}${tx.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {nessieLoading && (
            <div className="px-6 py-2 text-[11px] text-gray-400 text-center animate-pulse">
              Syncing with Capital One Nessie…
            </div>
          )}
        </div>

        {/* Latest News */}
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-50">
            <h2 className="font-bold text-gray-900 text-sm">Market News</h2>
            <Link to="/news" className="text-[11px] text-indigo-500 hover:underline font-semibold">All news →</Link>
          </div>
          <div className="divide-y divide-gray-50">
            {latestNews.map((n) => (
              <div key={n.id} className="flex items-start gap-3 px-6 py-3">
                <div className={`h-2 w-2 rounded-full mt-1.5 shrink-0 ${
                  n.sentiment === "bullish" ? "bg-green-400" : n.sentiment === "bearish" ? "bg-red-400" : "bg-gray-300"
                }`} />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold text-gray-800 leading-snug line-clamp-2">{n.headline}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {n.ticker && <span className="text-[10px] font-bold text-gray-400">{n.ticker}</span>}
                    <span className="text-[10px] text-gray-300">{n.source}</span>
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full shrink-0 ${
                  n.sentiment === "bullish" ? "bg-green-50 text-green-600"
                    : n.sentiment === "bearish" ? "bg-red-50 text-red-500"
                    : "bg-gray-100 text-gray-500"
                }`}>
                  {n.sentiment}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

    </div>
  );
}
