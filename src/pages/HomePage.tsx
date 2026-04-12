import { useRef, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { TrendingUp, TrendingDown, ArrowRight, Brain, Shield, Zap } from "lucide-react";
import { stocks } from "@/data/stocks";

/* ─── Seeded bar/line chart for the stats section ────────────── */
function TradingChart() {
  const bars = [120, 180, 220, 310, 280, 260, 380, 420, 350, 470, 390, 330, 480, 380, 420, 510];
  const line = [260, 280, 290, 300, 295, 305, 320, 355, 340, 370, 360, 345, 395, 380, 410, 430];
  const equity = [240, 250, 260, 275, 270, 280, 300, 330, 315, 345, 340, 325, 370, 355, 385, 405];

  const W = 600, H = 220;
  const maxBar = Math.max(...bars);
  const minL = Math.min(...line), maxL = Math.max(...line), rngL = maxL - minL;
  const minE = Math.min(...equity), maxE = Math.max(...equity), rngE = maxE - minE;

  const barW = W / bars.length - 4;

  const linePoints = line
    .map((v, i) => {
      const x = (i / (line.length - 1)) * (W - 40) + 20;
      const y = H - 20 - ((v - minL) / rngL) * (H - 50);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const equityPoints = equity
    .map((v, i) => {
      const x = (i / (equity.length - 1)) * (W - 40) + 20;
      const y = H - 20 - ((v - minE) / rngE) * (H - 50);
      return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  return (
    <svg width="100%" viewBox={`0 0 ${W} ${H}`} className="overflow-visible">
      {/* Y-axis labels */}
      {[0, 200, 400, 600, 800].map((v) => (
        <text key={v} x="0" y={H - 20 - (v / 800) * (H - 50)} fill="#ffffff30" fontSize="9" dominantBaseline="middle">
          ${v}
        </text>
      ))}

      {/* Bars */}
      {bars.map((v, i) => {
        const x = (i / bars.length) * W + 22;
        const barH = (v / maxBar) * (H - 60);
        const isHighlighted = i === 10;
        return (
          <rect
            key={i}
            x={x}
            y={H - 20 - barH}
            width={barW}
            height={barH}
            rx="3"
            fill={isHighlighted ? "#f43f5e" : "#2dd4bf18"}
          />
        );
      })}

      {/* Growth line (teal) */}
      <path d={linePoints} fill="none" stroke="#2dd4bf" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {line.map((v, i) => {
        const x = (i / (line.length - 1)) * (W - 40) + 20;
        const y = H - 20 - ((v - minL) / rngL) * (H - 50);
        return <circle key={i} cx={x} cy={y} r="3" fill="#2dd4bf" />;
      })}

      {/* Equity line (pink) */}
      <path d={equityPoints} fill="none" stroke="#f43f5e" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {equity.map((v, i) => {
        const x = (i / (equity.length - 1)) * (W - 40) + 20;
        const y = H - 20 - ((v - minE) / rngE) * (H - 50);
        return <circle key={i} cx={x} cy={y} r="2.5" fill="#f43f5e" />;
      })}
    </svg>
  );
}

/* ─── Starfield canvas ───────────────────────────────────────── */
function Starfield() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    const stars = Array.from({ length: 180 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.2,
      o: Math.random() * 0.6 + 0.2,
    }));
    stars.forEach((s) => {
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(255,255,255,${s.o})`;
      ctx.fill();
    });
  }, []);
  return <canvas ref={canvasRef} className="absolute inset-0 w-full h-full pointer-events-none" />;
}

/* ─── Page ───────────────────────────────────────────────────── */
export default function HomePage() {
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [videoReady, setVideoReady] = useState(false);

  const topMovers = [...stocks]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 4);

  return (
    <div className="min-h-screen overflow-x-hidden font-sans">

      {/* ══════════════════════════════════════════════
          SECTION 1 — VIDEO HERO
      ══════════════════════════════════════════════ */}
      <section className="relative h-screen min-h-[600px] flex flex-col overflow-hidden bg-black">

        {/* Background video */}
        <video
          ref={videoRef}
          autoPlay
          muted
          loop
          playsInline
          onCanPlay={() => setVideoReady(true)}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-1000 ${videoReady ? "opacity-60" : "opacity-0"}`}
        >
          <source src="/images/homapage.mp4" type="video/mp4" />
        </video>

        {/* Gradient overlays */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/40 to-black/80" />
        <div className="absolute inset-0 bg-gradient-to-r from-indigo-950/50 via-transparent to-purple-950/30" />

        {/* Nav */}
        <nav className="relative z-10 flex items-center justify-between px-8 py-5">
          <div className="flex items-center gap-2.5">
            <div className="grid grid-cols-2 gap-0.5 h-7 w-7">
              <div className="rounded-sm bg-orange-400" />
              <div className="rounded-sm bg-indigo-500" />
              <div className="rounded-sm bg-emerald-400" />
              <div className="rounded-sm bg-yellow-400" />
            </div>
            <span className="text-white text-lg font-bold tracking-tight">FinWise</span>
          </div>
          <div className="hidden md:flex items-center gap-7">
            {["Features", "Markets", "Pricing", "About"].map((item) => (
              <button key={item} className="text-white/70 text-sm font-medium hover:text-white transition-colors">
                {item}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/dashboard")}
              className="text-white/80 text-sm font-medium hover:text-white transition-colors"
            >
              Log In
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="bg-white text-gray-900 text-sm font-bold px-5 py-2 rounded-full hover:bg-gray-100 transition-colors shadow-lg"
            >
              Get Started
            </button>
          </div>
        </nav>

        {/* Hero content */}
        <div className="relative z-10 flex-1 flex flex-col items-center justify-center text-center px-6 gap-6">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm border border-white/20 rounded-full px-4 py-1.5 text-white/80 text-xs font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            Live Markets · AI-Powered · Real-Time Data
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-black text-white leading-tight tracking-tight max-w-4xl">
            Trade Smarter.<br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              Grow Faster.
            </span>
          </h1>

          <p className="text-white/60 text-lg max-w-xl leading-relaxed">
            Your all-in-one platform for real-time stock trading, AI-powered insights, and portfolio management — built for the next generation of investors.
          </p>

          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => navigate("/dashboard")}
              className="group flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold px-8 py-3.5 rounded-full shadow-xl shadow-indigo-500/30 transition-all hover:scale-105"
            >
              Let's Trade
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <button
              onClick={() => navigate("/dashboard")}
              className="text-white/70 font-medium text-sm hover:text-white transition-colors flex items-center gap-1.5"
            >
              View Dashboard <ArrowRight className="h-3.5 w-3.5" />
            </button>
          </div>

          {/* Live ticker strip */}
          <div className="mt-6 flex items-center gap-4 overflow-x-auto max-w-2xl">
            {topMovers.map((s) => {
              const up = s.changePercent >= 0;
              return (
                <div key={s.ticker} className="flex items-center gap-2 bg-white/8 backdrop-blur-sm border border-white/10 rounded-xl px-3 py-2 shrink-0">
                  <span className="text-white font-bold text-xs">{s.ticker}</span>
                  <span className="text-white/70 text-xs">${s.currentPrice.toFixed(0)}</span>
                  <span className={`text-xs font-semibold ${up ? "text-emerald-400" : "text-red-400"}`}>
                    {up ? "+" : ""}{s.changePercent}%
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="relative z-10 flex justify-center pb-8 animate-bounce">
          <div className="h-8 w-5 rounded-full border-2 border-white/30 flex items-start justify-center pt-1.5">
            <div className="h-1.5 w-1 rounded-full bg-white/60" />
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 2 — TRADING STATS (homapage2.webp)
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-20 px-6" style={{
        background: "linear-gradient(135deg, #1a0f3a 0%, #0d0a1e 40%, #1a1040 70%, #0d0a1e 100%)"
      }}>
        {/* Glow blobs */}
        <div className="absolute top-1/4 left-1/4 h-80 w-80 rounded-full bg-indigo-600/15 blur-3xl pointer-events-none" />
        <div className="absolute bottom-1/4 right-1/4 h-64 w-64 rounded-full bg-purple-600/15 blur-3xl pointer-events-none" />

        <div className="relative max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <span className="text-indigo-400 text-xs font-bold uppercase tracking-widest">Live Analytics</span>
            <h2 className="text-3xl sm:text-4xl font-black text-white mt-2">Real-Time Trading Dashboard</h2>
            <p className="text-white/40 mt-3 text-base max-w-lg mx-auto">
              Track your portfolio performance, analyse trends, and execute trades with full market data.
            </p>
          </div>

          {/* Dashboard mockup card */}
          <div className="rounded-2xl overflow-hidden border border-white/10 shadow-2xl shadow-black/60"
            style={{ background: "rgba(255,255,255,0.04)", backdropFilter: "blur(20px)" }}>

            {/* Card header bar */}
            <div className="flex items-center justify-between px-6 py-3 border-b border-white/8">
              <div className="flex items-center gap-3">
                <div className="flex gap-1.5">
                  <div className="h-3 w-3 rounded-full bg-red-500/70" />
                  <div className="h-3 w-3 rounded-full bg-yellow-500/70" />
                  <div className="h-3 w-3 rounded-full bg-green-500/70" />
                </div>
                <span className="text-white/50 text-xs font-medium">Trading Stats · FinWise Portfolio</span>
              </div>
              <span className="text-indigo-400 text-xs font-semibold cursor-pointer hover:text-indigo-300">Share</span>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-0">
              {/* Chart area */}
              <div className="lg:col-span-2 p-6 border-r border-white/8">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <div className="text-white/50 text-xs font-medium">Balance Growth</div>
                    <div className="text-white text-sm font-semibold mt-0.5">Portfolio Performance</div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-white/40 text-xs bg-white/5 border border-white/10 px-3 py-1 rounded-full">1 month</span>
                  </div>
                </div>

                <TradingChart />

                {/* Legend */}
                <div className="flex items-center gap-5 mt-4">
                  {[["Growth", "#2dd4bf"], ["Equity Growth", "#f43f5e"], ["Deposits", "#2dd4bf50"], ["Withdrawals", "#f43f5e50"]].map(([label, color]) => (
                    <div key={label} className="flex items-center gap-1.5">
                      <div className="h-2.5 w-5 rounded-full" style={{ background: color }} />
                      <span className="text-white/40 text-[11px]">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Advanced stats */}
              <div className="p-6">
                <div className="text-white/70 text-xs font-bold uppercase tracking-wider mb-4">Advanced Statistics</div>
                <div className="space-y-3">
                  {[
                    { label: "Trades",         value: "59",             highlight: false },
                    { label: "Profitability",   value: "████████ 84%",   highlight: true  },
                    { label: "Avg. Win",        value: "+$2.03 / trade", highlight: false },
                    { label: "Avg. Loss",       value: "$0.00",          highlight: false },
                    { label: "Best Trade",      value: "$1,000.00",      highlight: false },
                    { label: "Worst Trade",     value: "$10.00",         highlight: false },
                    { label: "Sharpe Ratio",    value: "2.08",           highlight: false },
                    { label: "Longs Won",       value: "70%",            highlight: true  },
                    { label: "Shorts Won",      value: "67%",            highlight: true  },
                    { label: "AHPR",            value: "1.84%",          highlight: false },
                  ].map((row) => (
                    <div key={row.label} className="flex items-center justify-between py-0.5 border-b border-white/5">
                      <span className="text-white/40 text-xs">{row.label}</span>
                      <span className={`text-xs font-semibold ${row.highlight ? "text-emerald-400" : "text-white/70"}`}>
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Trading periods table */}
            <div className="border-t border-white/8 px-6 py-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white/70 text-xs font-bold uppercase tracking-wider">Trading</span>
                <div className="flex gap-1">
                  {["All orders", "Open", "Closed"].map((t, i) => (
                    <button key={t} className={`text-[11px] font-semibold px-3 py-1 rounded-full transition-colors ${
                      i === 0 ? "bg-white/10 text-white" : "text-white/40 hover:text-white/60"
                    }`}>{t}</button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 text-[10px] text-white/30 font-semibold uppercase tracking-wider mb-2">
                <span>Period</span><span>Gain</span><span>Profit</span><span>Trades</span>
              </div>
              {[
                { period: "Today",      gain: "+3.63%",   profit: "+$100",    trades: "1" },
                { period: "This week",  gain: "+5.70%",   profit: "+$1,200",  trades: "2" },
                { period: "This month", gain: "+192.75%", profit: "+$3,600",  trades: "59" },
                { period: "This year",  gain: "+192.75%", profit: "+$32,400", trades: "59" },
              ].map((row, i) => (
                <div key={row.period} className={`grid grid-cols-4 gap-4 py-2 ${i < 3 ? "border-b border-white/5" : ""}`}>
                  <span className={`text-xs font-semibold ${i === 2 ? "text-indigo-400" : "text-white/60"}`}>{row.period}</span>
                  <span className="text-xs text-emerald-400 font-semibold">{row.gain}</span>
                  <span className="text-xs text-emerald-400 font-semibold">{row.profit}</span>
                  <span className="text-xs text-white/50">{row.trades}</span>
                </div>
              ))}
            </div>
          </div>

          {/* CTA below chart */}
          <div className="text-center mt-10">
            <button
              onClick={() => navigate("/dashboard")}
              className="group inline-flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold px-8 py-3.5 rounded-full shadow-xl shadow-indigo-500/30 transition-all hover:scale-105"
            >
              View My Dashboard <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      {/* ══════════════════════════════════════════════
          SECTION 3 — THREE STEPS (homapage3.webp)
      ══════════════════════════════════════════════ */}
      <section className="relative overflow-hidden py-24 px-6" style={{
        background: "linear-gradient(180deg, #060412 0%, #0a0618 50%, #060412 100%)"
      }}>
        <Starfield />

        {/* Ambient glow */}
        <div className="absolute top-1/3 left-1/2 -translate-x-1/2 h-96 w-96 rounded-full bg-indigo-800/20 blur-3xl pointer-events-none" />

        <div className="relative max-w-5xl mx-auto text-center">
          {/* Badge */}
          <div className="inline-flex items-center border border-white/20 rounded-full px-4 py-1.5 text-white/60 text-xs font-semibold tracking-widest uppercase mb-6">
            How It Works
          </div>

          <h2 className="text-4xl sm:text-5xl font-black text-white leading-tight max-w-2xl mx-auto">
            Three simple steps to invest with confidence
          </h2>
          <p className="text-white/40 mt-4 text-base max-w-xl mx-auto leading-relaxed">
            Seamlessly sign up, explore opportunities, and watch your portfolio grow — all in one powerful platform.
          </p>

          {/* Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-14">
            {[
              {
                icon: Shield,
                gradient: "from-indigo-500/20 to-purple-500/10",
                border: "border-indigo-500/30",
                glow: "shadow-indigo-500/10",
                iconColor: "text-indigo-400",
                iconBg: "bg-indigo-500/15",
                step: "01",
                title: "Set up your trading account",
                desc: "Create your account and get started with $10,000 in virtual wallet balance instantly.",
              },
              {
                icon: TrendingUp,
                gradient: "from-teal-500/20 to-emerald-500/10",
                border: "border-teal-500/30",
                glow: "shadow-teal-500/10",
                iconColor: "text-teal-400",
                iconBg: "bg-teal-500/15",
                step: "02",
                title: "Explore various instruments",
                desc: "Browse 20+ US stocks with live Alpha Vantage prices, candlestick charts, and real-time news.",
              },
              {
                icon: Brain,
                gradient: "from-purple-500/20 to-pink-500/10",
                border: "border-purple-500/30",
                glow: "shadow-purple-500/10",
                iconColor: "text-purple-400",
                iconBg: "bg-purple-500/15",
                step: "03",
                title: "Monitor & grow using AI",
                desc: "Use our AI Advisor and voice-powered tutor to keep an eye on your portfolio in real-time.",
              },
            ].map((card) => (
              <div
                key={card.step}
                className={`relative rounded-3xl border ${card.border} p-8 flex flex-col items-center text-center gap-5 shadow-2xl ${card.glow} hover:scale-[1.02] transition-transform duration-300`}
                style={{
                  background: `linear-gradient(135deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0.02) 100%)`,
                  backdropFilter: "blur(20px)",
                }}
              >
                {/* Step number */}
                <div className="absolute top-5 right-5 text-white/10 text-3xl font-black">{card.step}</div>

                {/* Icon */}
                <div className={`h-20 w-20 rounded-2xl ${card.iconBg} flex items-center justify-center`}>
                  <card.icon className={`h-9 w-9 ${card.iconColor}`} />
                </div>

                {/* Decorative line (like the image) */}
                <div className={`h-px w-12 bg-gradient-to-r ${card.gradient.replace("/20", "").replace("/10", "")}`} />

                <div>
                  <h3 className="text-white font-bold text-lg leading-snug">{card.title}</h3>
                  <p className="text-white/40 text-sm mt-2 leading-relaxed">{card.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Final CTA */}
          <div className="mt-16 flex flex-col items-center gap-4">
            <button
              onClick={() => navigate("/dashboard")}
              className="group flex items-center gap-2 bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white font-bold px-10 py-4 rounded-full shadow-2xl shadow-indigo-500/30 transition-all hover:scale-105 text-base"
            >
              <Zap className="h-4 w-4" />
              Let's Trade Now
              <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <p className="text-white/25 text-xs">No credit card required · Start with virtual $10,000</p>
          </div>
        </div>

        {/* Footer */}
        <div className="relative mt-20 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-3 max-w-5xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="grid grid-cols-2 gap-0.5 h-5 w-5">
              <div className="rounded-sm bg-orange-400" />
              <div className="rounded-sm bg-indigo-500" />
              <div className="rounded-sm bg-emerald-400" />
              <div className="rounded-sm bg-yellow-400" />
            </div>
            <span className="text-white/40 text-xs font-semibold">FinWise Navigator</span>
          </div>
          <p className="text-white/20 text-xs">© 2026 FinWise Navigator · Built at UMD BITCAMP</p>
        </div>
      </section>
    </div>
  );
}
