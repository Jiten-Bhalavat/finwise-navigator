import { Link } from "react-router-dom";
import {
  TrendingUp, TrendingDown, GraduationCap, Brain, Newspaper,
  ArrowRight, Wallet, BarChart2, ShoppingCart, DollarSign,
  Activity, Clock,
} from "lucide-react";
import { stocks } from "@/data/stocks";
import { mockNews } from "@/data/news";
import { usePortfolio } from "@/context/PortfolioContext";

const logoColors: Record<string, string> = {
  NVDA: "#76b900", AAPL: "#555", MSFT: "#00a4ef", TSLA: "#cc0000",
  META: "#0082fb", AMZN: "#ff9900", GOOGL: "#4285f4", JPM: "#003087",
  V: "#1a1f71", JNJ: "#ca0028", WMT: "#0071ce", BAC: "#e31837",
  XOM: "#e71d23", DIS: "#0053a0", NFLX: "#e50914",
};

export default function DashboardHome() {
  const {
    walletBalance, nessieLoading,
    holdings, txHistory,
    totalCurrent, totalInvested, totalReturns, dayReturns, tradeCount,
  } = usePortfolio();

  const topMovers = [...stocks]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 5);

  const latestNews = mockNews.slice(0, 3);
  const recentTrades = txHistory.slice(0, 5);
  const returnPct = totalInvested > 0 ? (totalReturns / totalInvested) * 100 : 0;

  return (
    <div className="px-6 py-5 space-y-6 max-w-7xl mx-auto">

      {/* ── Welcome + Profile card ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

        {/* Welcome */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-border p-5">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-full bg-gradient-to-br from-violet-400 to-indigo-500 flex items-center justify-center text-white text-xl font-bold shrink-0">
              J
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-xl font-bold text-foreground">Welcome back, Jiten!</h1>
                <span className="text-[10px] font-bold bg-primary text-white px-2 py-0.5 rounded-full">PRO</span>
              </div>
              <p className="text-sm text-muted-foreground mt-0.5">@jiten_finwise · FinWise Navigator</p>
            </div>
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-5">
            {[
              {
                label: "Wallet Balance",
                value: `$${walletBalance.toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
                icon: Wallet,
                color: "text-indigo-600 bg-indigo-50",
              },
              {
                label: "Portfolio Value",
                value: `$${totalCurrent.toLocaleString("en-US", { minimumFractionDigits: 0 })}`,
                icon: BarChart2,
                color: "text-emerald-600 bg-emerald-50",
              },
              {
                label: "Total Returns",
                value: `${totalReturns >= 0 ? "+" : ""}$${Math.abs(totalReturns).toFixed(0)}`,
                icon: TrendingUp,
                color: totalReturns >= 0 ? "text-green-600 bg-green-50" : "text-red-500 bg-red-50",
              },
              {
                label: "Trades Made",
                value: tradeCount.toString(),
                icon: Activity,
                color: "text-amber-600 bg-amber-50",
              },
            ].map((stat) => (
              <div key={stat.label} className="bg-muted/40 rounded-xl p-3">
                <div className="flex items-center gap-2 mb-2">
                  <div className={`h-7 w-7 rounded-lg flex items-center justify-center ${stat.color}`}>
                    <stat.icon className="h-3.5 w-3.5" />
                  </div>
                  <span className="text-[10px] text-muted-foreground font-medium uppercase tracking-wide">{stat.label}</span>
                </div>
                <div className="text-lg font-bold text-foreground">{stat.value}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Quick actions */}
        <div className="flex flex-col gap-3">
          {[
            { title: "Trade",    desc: "Buy & sell stocks",  icon: TrendingUp,    to: "/trade",   color: "#6366f1" },
            { title: "News",     desc: "Market updates",     icon: Newspaper,     to: "/news",    color: "#f59e0b" },
            { title: "Learn",    desc: "Voice AI tutor",     icon: GraduationCap, to: "/learn",   color: "#10b981" },
            { title: "Advisor",  desc: "AI stock analysis",  icon: Brain,         to: "/advisor", color: "#ef4444" },
          ].map((item) => (
            <Link key={item.title} to={item.to}
              className="flex items-center gap-3 bg-white rounded-xl border border-border px-4 py-3 hover:border-primary/30 hover:shadow-sm transition-all group"
            >
              <div className="h-8 w-8 rounded-lg flex items-center justify-center text-white shrink-0"
                style={{ background: item.color }}>
                <item.icon className="h-4 w-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-sm text-foreground">{item.title}</div>
                <div className="text-xs text-muted-foreground">{item.desc}</div>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Holdings + Recent Trades ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Current Holdings */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm text-foreground">My Holdings</h2>
            <Link to="/trade" className="text-xs text-primary hover:underline flex items-center gap-1">
              Manage <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {holdings.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No holdings yet. <Link to="/trade" className="text-primary hover:underline">Start trading →</Link>
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {holdings.slice(0, 5).map((h) => {
                const gain = h.current - h.invested;
                const up = gain >= 0;
                return (
                  <div key={h.ticker} className="flex items-center justify-between px-5 py-3">
                    <div className="flex items-center gap-3">
                      <div
                        className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                        style={{ background: logoColors[h.ticker] ?? "#6366f1" }}
                      >
                        {h.ticker.slice(0, 2)}
                      </div>
                      <div>
                        <div className="font-semibold text-sm text-foreground">{h.ticker}</div>
                        <div className="text-[10px] text-muted-foreground">{h.qty} shares</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-semibold text-foreground">${h.current.toFixed(0)}</div>
                      <div className={`text-[10px] font-medium ${up ? "text-green-600" : "text-red-500"}`}>
                        {up ? "+" : ""}${gain.toFixed(0)} ({up ? "+" : ""}{h.invested > 0 ? ((gain / h.invested) * 100).toFixed(1) : "0"}%)
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* Portfolio totals footer */}
          <div className="px-5 py-3 bg-muted/20 border-t border-border/60 flex items-center justify-between text-xs text-muted-foreground">
            <span>Invested: <span className="font-semibold text-foreground">${totalInvested.toFixed(0)}</span></span>
            <span>Today: <span className={`font-semibold ${dayReturns >= 0 ? "text-green-600" : "text-red-500"}`}>{dayReturns >= 0 ? "+" : ""}${dayReturns.toFixed(2)}</span></span>
            <span>Return: <span className={`font-semibold ${returnPct >= 0 ? "text-green-600" : "text-red-500"}`}>{returnPct >= 0 ? "+" : ""}{returnPct.toFixed(1)}%</span></span>
          </div>
        </div>

        {/* Recent Trade History */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <div className="flex items-center gap-2">
              <h2 className="font-semibold text-sm text-foreground">Trade History</h2>
              {tradeCount > 0 && (
                <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                  {tradeCount} total
                </span>
              )}
            </div>
            <Link to="/trade" className="text-xs text-primary hover:underline flex items-center gap-1">
              Trade <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          {recentTrades.length === 0 ? (
            <div className="px-5 py-8 text-center text-sm text-muted-foreground">
              No trades yet. Trades you make will appear here.
            </div>
          ) : (
            <div className="divide-y divide-border/60">
              {recentTrades.map((tx) => (
                <div key={tx.id} className="flex items-center justify-between px-5 py-3">
                  <div className="flex items-center gap-3">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0 ${
                      tx.type === "buy" ? "bg-green-500" : "bg-red-500"
                    }`}>
                      {tx.type === "buy" ? "B" : "S"}
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-foreground">{tx.desc}</div>
                      <div className="text-[10px] text-muted-foreground flex items-center gap-1 mt-0.5">
                        <Clock className="h-2.5 w-2.5" /> {tx.date}
                      </div>
                    </div>
                  </div>
                  <div className={`text-sm font-bold ${tx.type === "buy" ? "text-red-500" : "text-green-600"}`}>
                    {tx.type === "buy" ? "-" : "+"}${tx.amount.toFixed(2)}
                  </div>
                </div>
              ))}
            </div>
          )}
          {nessieLoading && (
            <div className="px-5 py-3 text-xs text-muted-foreground text-center animate-pulse">
              Connecting to Capital One Nessie…
            </div>
          )}
        </div>
      </div>

      {/* ── Market Snapshot + Latest News ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

        {/* Top Movers */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm text-foreground">Top Movers</h2>
            <Link to="/trade" className="text-xs text-primary hover:underline flex items-center gap-1">
              Trade <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/60">
            {topMovers.map((s) => (
              <div key={s.ticker} className="flex items-center justify-between px-5 py-3">
                <div className="flex items-center gap-3">
                  <div
                    className="h-8 w-8 rounded-lg flex items-center justify-center text-white text-xs font-bold shrink-0"
                    style={{ background: logoColors[s.ticker] ?? "#6366f1" }}
                  >
                    {s.ticker.slice(0, 2)}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-foreground">{s.ticker}</div>
                    <div className="text-[10px] text-muted-foreground">{s.name.split(" ").slice(0, 2).join(" ")}</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-semibold text-foreground">${s.currentPrice.toFixed(2)}</div>
                  <div className={`text-[10px] font-medium flex items-center gap-0.5 justify-end ${s.changePercent >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {s.changePercent >= 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                    {s.changePercent >= 0 ? "+" : ""}{s.changePercent}%
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Latest News */}
        <div className="bg-white rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-border">
            <h2 className="font-semibold text-sm text-foreground">Latest News</h2>
            <Link to="/news" className="text-xs text-primary hover:underline flex items-center gap-1">
              All news <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-border/60">
            {latestNews.map((n) => (
              <div key={n.id} className="px-5 py-3">
                <div className="flex items-center gap-2 mb-1">
                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full border ${
                    n.sentiment === "bullish"
                      ? "bg-green-50 text-green-600 border-green-100"
                      : n.sentiment === "bearish"
                        ? "bg-red-50 text-red-500 border-red-100"
                        : "bg-gray-50 text-gray-500 border-gray-100"
                  }`}>
                    {n.sentiment}
                  </span>
                  {n.ticker && (
                    <span className="text-[10px] font-semibold text-muted-foreground border border-border/60 px-1.5 py-0.5 rounded-full">
                      {n.ticker}
                    </span>
                  )}
                </div>
                <div className="text-sm font-medium text-foreground leading-snug line-clamp-2">{n.headline}</div>
                <div className="text-[10px] text-muted-foreground mt-0.5">{n.source}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ── Market Snapshot grid ── */}
      <div className="bg-white rounded-2xl border border-border p-5">
        <h2 className="font-semibold text-sm text-foreground mb-4">Market Snapshot</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
          {stocks.slice(0, 10).map((s) => (
            <Link to="/trade" key={s.ticker}>
              <div className="bg-muted/40 rounded-xl p-3 hover:bg-secondary/60 hover:border-primary/20 border border-transparent transition-all cursor-pointer">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm text-foreground">{s.ticker}</span>
                  <span className={`text-[10px] font-semibold ${s.changePercent >= 0 ? "text-green-600" : "text-red-500"}`}>
                    {s.changePercent >= 0 ? "+" : ""}{s.changePercent}%
                  </span>
                </div>
                <div className="text-base font-bold mt-0.5 text-foreground">${s.currentPrice.toFixed(2)}</div>
                <div className="text-[10px] text-muted-foreground truncate">{s.name.split(" ")[0]}</div>
              </div>
            </Link>
          ))}
        </div>
      </div>

    </div>
  );
}
