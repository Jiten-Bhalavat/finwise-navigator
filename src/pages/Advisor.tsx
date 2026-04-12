import { useState } from "react";
import { Send, TrendingUp, TrendingDown, Minus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { getStock, searchStocks, type Stock } from "@/data/stocks";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Message {
  role: "user" | "assistant";
  content: string;
  stock?: Stock;
  recommendation?: "Buy" | "Hold" | "Sell";
  sentiment?: "bullish" | "bearish" | "neutral";
}

function getRecommendation(stock: Stock): { rec: "Buy" | "Hold" | "Sell"; sentiment: "bullish" | "bearish" | "neutral"; reasoning: string } {
  const history = stock.priceHistory;
  const recent = history.slice(-30);
  const older = history.slice(-60, -30);
  const recentAvg = recent.reduce((s, h) => s + h.price, 0) / recent.length;
  const olderAvg = older.reduce((s, h) => s + h.price, 0) / older.length;
  const momentum = (recentAvg - olderAvg) / olderAvg;

  if (momentum > 0.03) {
    return { rec: "Buy", sentiment: "bullish", reasoning: `${stock.name} shows strong upward momentum over the last 30 days with a ${(momentum * 100).toFixed(1)}% trend. The current price of $${stock.currentPrice} is trending above its 60-day average. With a P/E ratio of ${stock.peRatio}, this could be a good entry point if you believe in the company's growth story.` };
  } else if (momentum < -0.03) {
    return { rec: "Sell", sentiment: "bearish", reasoning: `${stock.name} has been declining with a ${(momentum * 100).toFixed(1)}% downward trend. The stock is trading below its recent average. Consider waiting for a stabilization before entering. Current P/E of ${stock.peRatio} may not justify the price given the downtrend.` };
  }
  return { rec: "Hold", sentiment: "neutral", reasoning: `${stock.name} is trading sideways with minimal momentum (${(momentum * 100).toFixed(1)}%). The stock is near its average price range. With a P/E of ${stock.peRatio} and market cap of ${stock.marketCap}, it's a stable hold. Consider your portfolio allocation before making changes.` };
}

function StockChart({ stock }: { stock: Stock }) {
  const data = stock.priceHistory.slice(-90).map((h) => ({
    date: h.date.slice(5),
    price: h.price,
  }));

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="priceGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(210, 55%, 55%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(210, 55%, 55%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11 }} className="text-muted-foreground" />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Area type="monotone" dataKey="price" stroke="hsl(210, 55%, 55%)" fill="url(#priceGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");

  const handleSend = (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim()) return;

    const userMsg: Message = { role: "user", content: msg };

    // Try to find a stock ticker in the message
    const words = msg.split(/\s+/);
    let foundStock: Stock | undefined;
    for (const w of words) {
      foundStock = getStock(w.replace(/[^a-zA-Z]/g, ""));
      if (foundStock) break;
    }
    if (!foundStock) {
      const results = searchStocks(msg);
      if (results.length > 0) foundStock = results[0];
    }

    let assistantMsg: Message;
    if (foundStock) {
      const { rec, sentiment, reasoning } = getRecommendation(foundStock);
      assistantMsg = {
        role: "assistant",
        content: reasoning,
        stock: foundStock,
        recommendation: rec,
        sentiment,
      };
    } else {
      assistantMsg = {
        role: "assistant",
        content: `I couldn't find a specific stock in your query. Try asking about a specific company like "Should I buy Apple?" or "Analyze NVDA". I can provide price charts, key metrics, and buy/hold/sell recommendations for any of the top 20 US stocks.`,
      };
    }

    setMessages((prev) => [...prev, userMsg, assistantMsg]);
    setInput("");
  };

  const suggestedQueries = [
    "Should I buy Apple stock?",
    "Analyze NVDA",
    "Is Tesla a good investment?",
    "What about Microsoft?",
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>AI Stock Advisor</CardTitle>
          <p className="text-sm text-muted-foreground">
            Ask about any stock and get AI-powered analysis with charts and recommendations.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Chat messages */}
          <div className="max-h-[60vh] overflow-y-auto space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-8 space-y-4">
                <p className="text-muted-foreground">Ask about any stock to get started</p>
                <div className="flex flex-wrap justify-center gap-2">
                  {suggestedQueries.map((q) => (
                    <Button key={q} variant="outline" size="sm" onClick={() => handleSend(q)}>
                      {q}
                    </Button>
                  ))}
                </div>
              </div>
            )}

            {messages.map((m, i) => (
              <div key={i}>
                {m.role === "user" ? (
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground rounded-lg px-4 py-2 max-w-[80%] text-sm">
                      {m.content}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {m.recommendation && (
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={m.recommendation === "Buy" ? "default" : m.recommendation === "Sell" ? "destructive" : "secondary"}
                          className="text-sm"
                        >
                          {m.recommendation === "Buy" && <TrendingUp className="h-3 w-3 mr-1" />}
                          {m.recommendation === "Sell" && <TrendingDown className="h-3 w-3 mr-1" />}
                          {m.recommendation === "Hold" && <Minus className="h-3 w-3 mr-1" />}
                          {m.recommendation}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {m.sentiment}
                        </Badge>
                      </div>
                    )}
                    <div className="bg-card border rounded-lg px-4 py-3 text-sm">
                      {m.content}
                    </div>
                    {m.stock && (
                      <>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          <Card className="p-3">
                            <p className="text-xs text-muted-foreground">Price</p>
                            <p className="font-bold">${m.stock.currentPrice}</p>
                          </Card>
                          <Card className="p-3">
                            <p className="text-xs text-muted-foreground">P/E Ratio</p>
                            <p className="font-bold">{m.stock.peRatio}</p>
                          </Card>
                          <Card className="p-3">
                            <p className="text-xs text-muted-foreground">Market Cap</p>
                            <p className="font-bold">{m.stock.marketCap}</p>
                          </Card>
                          <Card className="p-3">
                            <p className="text-xs text-muted-foreground">52W Range</p>
                            <p className="font-bold text-xs">${m.stock.low52w} – ${m.stock.high52w}</p>
                          </Card>
                        </div>
                        <StockChart stock={m.stock} />
                      </>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Input */}
          <div className="flex gap-2 pt-2 border-t">
            <Input
              placeholder="Ask about a stock... (e.g. 'Should I buy Apple?')"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSend()}
            />
            <Button onClick={() => handleSend()} size="icon">
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
