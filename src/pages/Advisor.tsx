import { useState, useRef, useEffect } from "react";
import {
  createChart, CandlestickSeries, LineSeries, LineStyle, ColorType,
  type IChartApi, type ISeriesApi, type CandlestickSeriesOptions,
} from "lightweight-charts";
import {
  Send, Bot, User, Loader2, TrendingUp, BarChart2,
  Newspaper, MessageCircle, Globe, Scale, CheckCircle2,
  Sparkles, AlertCircle, Zap, Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { cn } from "@/lib/utils";

const BACKEND_URL = "http://localhost:8000";

// ─── Tool metadata ──────────────────────────────────────────────────────────

const TOOL_META: Record<string, { Icon: React.ElementType; label: string; color: string }> = {
  analyze_stock_performance:  { Icon: TrendingUp,    label: "Analyzing price history",     color: "text-emerald-500" },
  get_stock_fundamentals:     { Icon: BarChart2,     label: "Fetching fundamentals",       color: "text-blue-500"    },
  search_news_and_sentiment:  { Icon: Newspaper,     label: "Searching news & sentiment",  color: "text-orange-500"  },
  search_social_sentiment:    { Icon: MessageCircle, label: "Checking social sentiment",   color: "text-purple-500"  },
  compare_stocks:             { Icon: Scale,         label: "Comparing stocks",            color: "text-indigo-500"  },
  get_market_overview:        { Icon: Globe,         label: "Checking market conditions",  color: "text-cyan-500"    },
};

// ─── Types ──────────────────────────────────────────────────────────────────

interface Step   { tool: string; status: "pending" | "done" }
interface Message {
  role: "user" | "assistant";
  content: string;
  steps?: Step[];
  ticker?: string;
  loading?: boolean;
  error?: boolean;
}

interface Candle { time: string; open: number; high: number; low: number; close: number }

// ─── Candlestick chart ──────────────────────────────────────────────────────

const PERIODS = ["1M", "3M", "6M", "1Y"] as const;
type ChartPeriod = typeof PERIODS[number];

function cutCandles(candles: Candle[], period: ChartPeriod): Candle[] {
  const now = new Date();
  const cutoff = new Date(now);
  if (period === "1M")  cutoff.setMonth(now.getMonth() - 1);
  if (period === "3M")  cutoff.setMonth(now.getMonth() - 3);
  if (period === "6M")  cutoff.setMonth(now.getMonth() - 6);
  if (period === "1Y")  cutoff.setFullYear(now.getFullYear() - 1);
  const ts = cutoff.toISOString().slice(0, 10);
  return candles.filter((c) => c.time >= ts);
}

function calcSMA(candles: Candle[], n: number): { time: string; value: number }[] {
  return candles.flatMap((_, i) => {
    if (i < n - 1) return [];
    const slice = candles.slice(i - n + 1, i + 1);
    const avg = slice.reduce((s, c) => s + c.close, 0) / n;
    return [{ time: candles[i].time, value: Math.round(avg * 100) / 100 }];
  });
}

function AdvisorChart({ ticker }: { ticker: string }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const chartRef     = useRef<IChartApi | null>(null);
  const [candles, setCandles]   = useState<Candle[]>([]);
  const [period, setPeriod]     = useState<ChartPeriod>("6M");
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState("");
  const [latestPrice, setLatestPrice] = useState<number | null>(null);
  const [priceChange, setPriceChange] = useState<number | null>(null);

  useEffect(() => {
    setLoading(true);
    setError("");
    fetch(`${BACKEND_URL}/stock/candles/${ticker}?period=1y`)
      .then((r) => r.ok ? r.json() : Promise.reject("Failed"))
      .then((d) => {
        const c: Candle[] = d.candles;
        setCandles(c);
        if (c.length >= 2) {
          setLatestPrice(c[c.length - 1].close);
          const change = ((c[c.length - 1].close - c[c.length - 2].close) / c[c.length - 2].close) * 100;
          setPriceChange(change);
        }
      })
      .catch(() => setError("Could not load chart data"))
      .finally(() => setLoading(false));
  }, [ticker]);

  useEffect(() => {
    if (!containerRef.current || !candles.length) return;

    const chart = createChart(containerRef.current, {
      layout: {
        background: { type: ColorType.Solid, color: "#ffffff" },
        textColor: "#9ca3af",
        fontFamily: "Inter, system-ui, sans-serif",
        fontSize: 11,
      },
      grid: {
        vertLines: { color: "#f3f4f6", style: LineStyle.Solid },
        horzLines: { color: "#f3f4f6", style: LineStyle.Solid },
      },
      crosshair: { vertLine: { color: "#6366f1" }, horzLine: { color: "#6366f1" } },
      rightPriceScale: { borderColor: "#e5e7eb" },
      timeScale: { borderColor: "#e5e7eb", timeVisible: true },
      width: containerRef.current.clientWidth,
      height: 220,
    });
    chartRef.current = chart;

    const visible = cutCandles(candles, period);

    const series = chart.addSeries(
      CandlestickSeries as unknown as new () => ISeriesApi<"Candlestick">,
      {
        upColor: "#16a34a", downColor: "#dc2626",
        borderUpColor: "#16a34a", borderDownColor: "#dc2626",
        wickUpColor: "#16a34a", wickDownColor: "#dc2626",
      } as Partial<CandlestickSeriesOptions>
    );
    series.setData(visible as Parameters<typeof series.setData>[0]);

    const s20 = chart.addSeries(LineSeries as unknown as new () => ISeriesApi<"Line">, {
      color: "#f59e0b", lineWidth: 1, lineStyle: LineStyle.Dashed,
      priceLineVisible: false, lastValueVisible: false,
    });
    s20.setData(calcSMA(visible, 20) as Parameters<typeof s20.setData>[0]);

    const s50 = chart.addSeries(LineSeries as unknown as new () => ISeriesApi<"Line">, {
      color: "#6366f1", lineWidth: 1, lineStyle: LineStyle.Dashed,
      priceLineVisible: false, lastValueVisible: false,
    });
    s50.setData(calcSMA(visible, 50) as Parameters<typeof s50.setData>[0]);

    chart.timeScale().fitContent();

    const ro = new ResizeObserver(() => {
      if (containerRef.current) chart.applyOptions({ width: containerRef.current.clientWidth });
    });
    ro.observe(containerRef.current);

    return () => { ro.disconnect(); chart.remove(); chartRef.current = null; };
  }, [candles, period]);

  const up = (priceChange ?? 0) >= 0;

  return (
    <div className="mb-4 rounded-xl border border-slate-200 overflow-hidden bg-white shadow-sm">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-100">
        <div className="flex items-center gap-3">
          <div className="h-8 w-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shrink-0">
            {ticker.slice(0, 2)}
          </div>
          <div>
            <div className="font-semibold text-sm text-foreground">{ticker}</div>
            {latestPrice && (
              <div className="flex items-center gap-1.5 text-xs">
                <span className="font-medium">${latestPrice.toFixed(2)}</span>
                <span className={cn("font-medium", up ? "text-emerald-600" : "text-red-500")}>
                  {up ? "▲" : "▼"} {Math.abs(priceChange ?? 0).toFixed(2)}%
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Period buttons */}
        <div className="flex gap-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              className={cn(
                "px-2 py-1 rounded-md text-xs font-medium transition-all",
                period === p
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-muted-foreground hover:bg-slate-100"
              )}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* SMA legend */}
      <div className="flex items-center gap-4 px-4 pt-2 pb-0">
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="h-px w-4 bg-amber-400 inline-block" />SMA 20
        </div>
        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
          <span className="h-px w-4 bg-indigo-500 inline-block" />SMA 50
        </div>
      </div>

      {/* Chart */}
      <div className="px-2 pb-2">
        {loading && (
          <div className="h-[220px] flex items-center justify-center">
            <Loader2 size={20} className="animate-spin text-muted-foreground" />
          </div>
        )}
        {error && (
          <div className="h-[220px] flex items-center justify-center text-sm text-red-400">{error}</div>
        )}
        <div ref={containerRef} className={cn("w-full", (loading || error) && "hidden")} />
      </div>
    </div>
  );
}

// ─── Markdown renderer ──────────────────────────────────────────────────────

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <>
      {parts.map((part, i) =>
        part.startsWith("**") && part.endsWith("**") ? (
          <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>
        ) : (
          <span key={i}>{part}</span>
        )
      )}
    </>
  );
}

function MarkdownBlock({ text }: { text: string }) {
  return (
    <div className="space-y-1 text-sm leading-relaxed">
      {text.split("\n").map((line, i) => {
        if (line.startsWith("## "))
          return <h2 key={i} className="text-[13px] font-bold text-foreground mt-3 mb-0.5 first:mt-0">{line.slice(3)}</h2>;
        if (line.startsWith("### "))
          return <h3 key={i} className="text-xs font-semibold text-foreground mt-2">{line.slice(4)}</h3>;
        if (line.startsWith("- ") || line.startsWith("* "))
          return (
            <div key={i} className="flex gap-2 ml-1">
              <span className="text-primary shrink-0 mt-0.5">•</span>
              <span>{renderInline(line.slice(2))}</span>
            </div>
          );
        if (line.startsWith("---"))
          return <hr key={i} className="border-border my-2" />;
        if (line.startsWith("*") && line.endsWith("*") && !line.startsWith("**"))
          return <p key={i} className="text-muted-foreground/70 text-xs italic">{line.slice(1, -1)}</p>;
        if (!line.trim())
          return <div key={i} className="h-1.5" />;
        return <p key={i}>{renderInline(line)}</p>;
      })}
    </div>
  );
}

// ─── Step indicator ─────────────────────────────────────────────────────────

function StepList({ steps }: { steps: Step[] }) {
  if (!steps.length) return null;
  return (
    <div className="flex flex-col gap-1 mb-3 p-2.5 bg-slate-50 rounded-lg border border-slate-100">
      {steps.map((step, i) => {
        const meta = TOOL_META[step.tool] ?? { Icon: Zap, label: step.tool, color: "text-muted-foreground" };
        const done = step.status === "done";
        return (
          <div key={i} className="flex items-center gap-2 text-xs">
            {done
              ? <CheckCircle2 size={12} className="text-emerald-500 shrink-0" />
              : <Loader2 size={12} className="animate-spin text-muted-foreground shrink-0" />
            }
            <meta.Icon size={12} className={cn("shrink-0", done ? "text-muted-foreground/50" : meta.color)} />
            <span className={cn(done ? "text-muted-foreground/50 line-through" : "text-muted-foreground")}>
              {meta.label}
            </span>
          </div>
        );
      })}
    </div>
  );
}

// ─── Suggestions ────────────────────────────────────────────────────────────

const SUGGESTIONS = [
  "Should I buy Apple stock right now?",
  "How has NVIDIA been performing lately?",
  "Is Tesla overvalued compared to competitors?",
  "Compare Microsoft vs Google vs Meta",
  "What's the best tech stock to buy today?",
  "Is the market bullish or bearish right now?",
];

// ─── Chat persistence (localStorage, 4-hour TTL) ────────────────────────────

const STORAGE_KEY = "finwise_advisor_chat";
const TTL_MS      = 4 * 60 * 60 * 1000; // 4 hours

function loadSavedMessages(): Message[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const { ts, msgs } = JSON.parse(raw) as { ts: number; msgs: Message[] };
    if (Date.now() - ts > TTL_MS) {
      localStorage.removeItem(STORAGE_KEY);
      return [];
    }
    // Clear transient flags that shouldn't survive a reload
    return msgs.map((m) => ({ ...m, loading: false }));
  } catch {
    return [];
  }
}

function saveMessages(msgs: Message[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ts: Date.now(), msgs }));
  } catch {
    // localStorage full — ignore
  }
}

// ─── Main page ───────────────────────────────────────────────────────────────

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>(loadSavedMessages);
  const [input, setInput]       = useState("");
  const [loading, setLoading]   = useState(false);
  const [backendOk, setBackendOk] = useState<boolean | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Persist messages whenever they change
  useEffect(() => {
    if (messages.length > 0) saveMessages(messages);
  }, [messages]);

  useEffect(() => {
    fetch(`${BACKEND_URL}/health`)
      .then((r) => r.json())
      .then((d) => setBackendOk(d.agent_ready === true))
      .catch(() => setBackendOk(false));
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const runAgent = async (query: string) => {
    setLoading(true);
    setMessages((prev) => [...prev, { role: "assistant", content: "", steps: [], loading: true }]);

    try {
      const history = messages.map((m) => ({ role: m.role, content: m.content }));
      const res = await fetch(`${BACKEND_URL}/advisor/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: history, query }),
      });

      if (!res.ok || !res.body) throw new Error(`Backend returned ${res.status}`);

      const reader  = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer    = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          const raw = line.slice(6).trim();
          if (!raw) continue;
          let ev: Record<string, string>;
          try { ev = JSON.parse(raw); } catch { continue; }

          if (ev.type === "ticker") {
            setMessages((prev) => {
              const msgs = [...prev];
              msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], ticker: ev.ticker };
              return msgs;
            });
          } else if (ev.type === "tool_call") {
            setMessages((prev) => {
              const msgs = [...prev];
              const last = { ...msgs[msgs.length - 1] };
              last.steps = [...(last.steps ?? []), { tool: ev.tool, status: "pending" }];
              msgs[msgs.length - 1] = last;
              return msgs;
            });
          } else if (ev.type === "tool_done") {
            setMessages((prev) => {
              const msgs = [...prev];
              const last = { ...msgs[msgs.length - 1] };
              last.steps = (last.steps ?? []).map((s) =>
                s.tool === ev.tool ? { ...s, status: "done" as const } : s
              );
              msgs[msgs.length - 1] = last;
              return msgs;
            });
          } else if (ev.type === "text") {
            setMessages((prev) => {
              const msgs = [...prev];
              const last = { ...msgs[msgs.length - 1] };
              last.content += ev.text;
              last.loading  = false;
              msgs[msgs.length - 1] = last;
              return msgs;
            });
          } else if (ev.type === "error") {
            throw new Error(ev.message);
          }
        }
      }
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Unknown error";
      setMessages((prev) => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = {
          role: "assistant", content: `**Error:** ${msg}`, error: true, loading: false,
        };
        return msgs;
      });
    } finally {
      setLoading(false);
      setMessages((prev) => {
        const msgs = [...prev];
        msgs[msgs.length - 1] = { ...msgs[msgs.length - 1], loading: false };
        return msgs;
      });
    }
  };

  const handleSend = async (text?: string) => {
    const query = (text ?? input).trim();
    if (!query || loading) return;
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: query }]);
    await runAgent(query);
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col gap-3">

      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-2 mb-0.5">
            <h1 className="text-2xl font-bold">AI Stock Advisor</h1>
            <span className="inline-flex items-center gap-1 bg-primary/10 text-primary text-[10px] font-semibold px-2 py-0.5 rounded-full">
              <Sparkles size={10} /> LangGraph
            </span>
          </div>
          <p className="text-sm text-muted-foreground">
            Explains stocks in plain English · live price chart · real market data
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Clear chat */}
          {messages.length > 0 && (
            <button
              onClick={() => { setMessages([]); localStorage.removeItem(STORAGE_KEY); }}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-red-500 border border-border hover:border-red-200 px-2.5 py-1.5 rounded-full transition-colors"
            >
              <Trash2 size={11} /> Clear chat
            </button>
          )}

        {/* Backend status */}
        <div className={cn(
          "flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border shrink-0",
          backendOk === true  && "bg-emerald-50 border-emerald-200 text-emerald-700",
          backendOk === false && "bg-red-50 border-red-200 text-red-600",
          backendOk === null  && "bg-muted border-border text-muted-foreground",
        )}>
          <span className={cn(
            "h-1.5 w-1.5 rounded-full",
            backendOk === true  && "bg-emerald-500 animate-pulse",
            backendOk === false && "bg-red-400",
            backendOk === null  && "bg-muted-foreground",
          )} />
          {backendOk === true ? "Agent online" : backendOk === false ? "Backend offline" : "Connecting…"}
        </div>
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden rounded-2xl border bg-white shadow-sm">
        <ScrollArea className="flex-1 px-5 py-5">

          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center gap-6 py-14 text-center">
              <div className="h-16 w-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-200">
                <Bot size={32} className="text-white" />
              </div>
              <div className="space-y-1">
                <p className="font-semibold text-lg">Ask me anything about stocks</p>
                <p className="text-sm text-muted-foreground max-w-xs mx-auto">
                  I'll explain everything in plain English — no jargon — with a live price chart.
                </p>
              </div>
              {backendOk === false && (
                <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 text-left max-w-sm">
                  <AlertCircle size={15} className="text-amber-500 shrink-0 mt-0.5" />
                  <div className="text-xs text-amber-700">
                    <p className="font-semibold mb-0.5">Backend not running</p>
                    <p className="font-mono">cd backend && uvicorn main:app --reload</p>
                  </div>
                </div>
              )}
              <div className="flex flex-wrap justify-center gap-2 max-w-lg">
                {SUGGESTIONS.map((q) => (
                  <button
                    key={q}
                    onClick={() => handleSend(q)}
                    disabled={backendOk === false}
                    className="text-xs px-3 py-1.5 rounded-full border border-border bg-muted/40 hover:bg-muted hover:border-primary/30 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-5">
            {messages.map((m, i) => (
              <div key={i} className={cn("flex items-start gap-3", m.role === "user" && "flex-row-reverse")}>
                {/* Avatar */}
                <div className={cn(
                  "shrink-0 w-8 h-8 rounded-full flex items-center justify-center text-white shadow-sm mt-0.5",
                  m.role === "user"
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600"
                    : m.error ? "bg-red-100 border border-red-200" : "bg-gradient-to-br from-slate-700 to-slate-900"
                )}>
                  {m.role === "user"
                    ? <User size={14} />
                    : m.error ? <AlertCircle size={14} className="text-red-500" /> : <Bot size={14} />
                  }
                </div>

                {/* Bubble */}
                <div className={cn(
                  "max-w-[88%] rounded-2xl px-4 py-3",
                  m.role === "user"
                    ? "bg-gradient-to-br from-indigo-500 to-purple-600 text-white text-sm rounded-tr-sm"
                    : m.error
                    ? "bg-red-50 border border-red-200 text-sm rounded-tl-sm"
                    : "bg-slate-50 border border-slate-100 rounded-tl-sm"
                )}>
                  {/* Loading state */}
                  {m.role === "assistant" && m.loading && !m.content && !m.steps?.length && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Loader2 size={14} className="animate-spin" />
                      <span>Thinking…</span>
                    </div>
                  )}

                  {/* Candlestick chart — shown for assistant messages with a ticker */}
                  {m.role === "assistant" && m.ticker && (
                    <AdvisorChart ticker={m.ticker} />
                  )}

                  {/* Tool steps */}
                  {m.role === "assistant" && m.steps && m.steps.length > 0 && (
                    <StepList steps={m.steps} />
                  )}

                  {/* Message text */}
                  {m.content && (
                    m.role === "user"
                      ? <span className="text-sm">{m.content}</span>
                      : <MarkdownBlock text={m.content} />
                  )}

                  {/* Streaming cursor */}
                  {m.role === "assistant" && m.loading && m.content && (
                    <span className="inline-block h-3 w-0.5 bg-muted-foreground/60 animate-pulse ml-0.5 -mb-0.5" />
                  )}
                </div>
              </div>
            ))}
            <div ref={bottomRef} />
          </div>
        </ScrollArea>

        {/* Input bar */}
        <div className="border-t bg-white px-4 py-3">
          <form className="flex gap-2" onSubmit={(e) => { e.preventDefault(); handleSend(); }}>
            <Input
              placeholder="Ask about any stock — e.g. 'Should I buy NVIDIA?' or 'Compare AAPL vs MSFT'"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading || backendOk === false}
              className="flex-1 rounded-xl border-border/70 bg-muted/30 focus-visible:ring-primary/30"
            />
            <Button
              type="submit"
              size="icon"
              disabled={loading || !input.trim() || backendOk === false}
              className="rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 shadow-sm"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </Button>
          </form>

          {messages.length > 0 && !loading && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {["Compare top AI stocks", "Market overview", "What's bullish right now?"].map((q) => (
                <button
                  key={q}
                  onClick={() => handleSend(q)}
                  className="text-[11px] px-2.5 py-1 rounded-full bg-muted/50 border border-border/60 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
