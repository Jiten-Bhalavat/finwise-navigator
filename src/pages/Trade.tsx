import { useState } from "react";
import { Search, TrendingUp, TrendingDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { stocks, searchStocks, type Stock } from "@/data/stocks";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface Transaction {
  id: string;
  ticker: string;
  name: string;
  type: "buy" | "sell";
  quantity: number;
  price: number;
  date: string;
}

interface Holding {
  ticker: string;
  name: string;
  quantity: number;
  avgCost: number;
  currentPrice: number;
}

function StockDetailChart({ stock }: { stock: Stock }) {
  const data = stock.priceHistory.slice(-130).map((h) => ({
    date: h.date.slice(5),
    price: h.price,
  }));

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <defs>
            <linearGradient id="tradeGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="hsl(210, 55%, 55%)" stopOpacity={0.3} />
              <stop offset="95%" stopColor="hsl(210, 55%, 55%)" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
          <XAxis dataKey="date" tick={{ fontSize: 10 }} />
          <YAxis domain={["auto", "auto"]} tick={{ fontSize: 10 }} />
          <Tooltip
            contentStyle={{
              background: "hsl(var(--card))",
              border: "1px solid hsl(var(--border))",
              borderRadius: "8px",
              fontSize: "12px",
            }}
          />
          <Area type="monotone" dataKey="price" stroke="hsl(210, 55%, 55%)" fill="url(#tradeGrad)" strokeWidth={2} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export default function TradePage() {
  const [query, setQuery] = useState("");
  const [selectedStock, setSelectedStock] = useState<Stock | null>(null);
  const [quantity, setQuantity] = useState("1");
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showSearch, setShowSearch] = useState(false);

  const results = query.length > 0 ? searchStocks(query) : [];

  // Derive holdings from transactions
  const holdings: Holding[] = [];
  const holdingsMap = new Map<string, { qty: number; totalCost: number; name: string }>();
  for (const t of transactions) {
    const existing = holdingsMap.get(t.ticker) ?? { qty: 0, totalCost: 0, name: t.name };
    if (t.type === "buy") {
      existing.qty += t.quantity;
      existing.totalCost += t.quantity * t.price;
    } else {
      existing.qty -= t.quantity;
      existing.totalCost -= t.quantity * t.price;
    }
    existing.name = t.name;
    holdingsMap.set(t.ticker, existing);
  }
  holdingsMap.forEach((val, ticker) => {
    if (val.qty > 0) {
      const stock = stocks.find((s) => s.ticker === ticker);
      holdings.push({
        ticker,
        name: val.name,
        quantity: val.qty,
        avgCost: Math.round((val.totalCost / val.qty) * 100) / 100,
        currentPrice: stock?.currentPrice ?? 0,
      });
    }
  });

  const totalValue = holdings.reduce((s, h) => s + h.quantity * h.currentPrice, 0);
  const totalCost = holdings.reduce((s, h) => s + h.quantity * h.avgCost, 0);
  const totalGain = totalValue - totalCost;

  const handleTrade = (type: "buy" | "sell") => {
    if (!selectedStock || !quantity || parseInt(quantity) <= 0) return;
    const qty = parseInt(quantity);

    if (type === "sell") {
      const holding = holdings.find((h) => h.ticker === selectedStock.ticker);
      if (!holding || holding.quantity < qty) return;
    }

    const tx: Transaction = {
      id: Date.now().toString(),
      ticker: selectedStock.ticker,
      name: selectedStock.name,
      type,
      quantity: qty,
      price: selectedStock.currentPrice,
      date: new Date().toISOString(),
    };
    setTransactions((prev) => [tx, ...prev]);
    setQuantity("1");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search stocks... (e.g. AAPL, Tesla)"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setShowSearch(true);
          }}
          onFocus={() => setShowSearch(true)}
          className="pl-9"
        />
        {showSearch && results.length > 0 && (
          <div className="absolute top-full left-0 right-0 z-10 bg-card border rounded-lg mt-1 max-h-60 overflow-y-auto shadow-lg">
            {results.map((s) => (
              <button
                key={s.ticker}
                className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors text-left"
                onClick={() => {
                  setSelectedStock(s);
                  setQuery("");
                  setShowSearch(false);
                }}
              >
                <div>
                  <span className="font-bold text-sm">{s.ticker}</span>
                  <span className="text-sm text-muted-foreground ml-2">{s.name}</span>
                </div>
                <span className={`text-sm font-medium ${s.changePercent >= 0 ? "text-chart-green" : "text-chart-red"}`}>
                  ${s.currentPrice}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Stock Detail / Chart */}
        <div className="lg:col-span-2 space-y-4">
          {selectedStock ? (
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>{selectedStock.ticker} — {selectedStock.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">{selectedStock.sector}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold">${selectedStock.currentPrice}</p>
                    <p className={`text-sm font-medium flex items-center gap-1 justify-end ${selectedStock.changePercent >= 0 ? "text-chart-green" : "text-chart-red"}`}>
                      {selectedStock.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {selectedStock.changePercent >= 0 ? "+" : ""}{selectedStock.change} ({selectedStock.changePercent}%)
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <StockDetailChart stock={selectedStock} />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">P/E Ratio</p>
                    <p className="font-bold">{selectedStock.peRatio}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">Market Cap</p>
                    <p className="font-bold">{selectedStock.marketCap}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">52W High</p>
                    <p className="font-bold">${selectedStock.high52w}</p>
                  </div>
                  <div className="bg-muted/30 rounded-lg p-3">
                    <p className="text-xs text-muted-foreground">52W Low</p>
                    <p className="font-bold">${selectedStock.low52w}</p>
                  </div>
                </div>

                {/* Buy/Sell Actions */}
                <div className="flex items-center gap-3 pt-2 border-t">
                  <Input
                    type="number"
                    min="1"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-24"
                    placeholder="Qty"
                  />
                  <span className="text-sm text-muted-foreground">
                    Total: ${(parseFloat(quantity || "0") * selectedStock.currentPrice).toFixed(2)}
                  </span>
                  <div className="flex gap-2 ml-auto">
                    <Button onClick={() => handleTrade("buy")} className="bg-chart-green hover:bg-chart-green/90 text-foreground">
                      Buy
                    </Button>
                    <Button onClick={() => handleTrade("sell")} variant="destructive">
                      Sell
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center h-80">
              <p className="text-muted-foreground">Search and select a stock to view details and trade</p>
            </Card>
          )}
        </div>

        {/* Portfolio Sidebar */}
        <div className="space-y-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Portfolio</CardTitle>
            </CardHeader>
            <CardContent>
              {holdings.length === 0 ? (
                <p className="text-sm text-muted-foreground">No holdings yet. Buy some stocks!</p>
              ) : (
                <div className="space-y-3">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Value</span>
                    <span className="font-bold">${totalValue.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Total Gain/Loss</span>
                    <span className={`font-bold ${totalGain >= 0 ? "text-chart-green" : "text-chart-red"}`}>
                      {totalGain >= 0 ? "+" : ""}${totalGain.toFixed(2)}
                    </span>
                  </div>
                  <div className="border-t pt-3 space-y-2">
                    {holdings.map((h) => {
                      const gain = (h.currentPrice - h.avgCost) * h.quantity;
                      const gainPct = ((h.currentPrice - h.avgCost) / h.avgCost * 100);
                      return (
                        <div
                          key={h.ticker}
                          className="flex items-center justify-between text-sm cursor-pointer hover:bg-muted/30 rounded-md p-2 -mx-2 transition-colors"
                          onClick={() => {
                            const s = stocks.find((st) => st.ticker === h.ticker);
                            if (s) setSelectedStock(s);
                          }}
                        >
                          <div>
                            <p className="font-bold">{h.ticker}</p>
                            <p className="text-xs text-muted-foreground">{h.quantity} shares</p>
                          </div>
                          <div className="text-right">
                            <p className="font-medium">${(h.quantity * h.currentPrice).toFixed(2)}</p>
                            <p className={`text-xs ${gain >= 0 ? "text-chart-green" : "text-chart-red"}`}>
                              {gain >= 0 ? "+" : ""}{gainPct.toFixed(1)}%
                            </p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Recent Transactions */}
          {transactions.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-base">Recent Transactions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {transactions.slice(0, 10).map((t) => (
                    <div key={t.id} className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-2">
                        <Badge variant={t.type === "buy" ? "default" : "destructive"} className="text-xs">
                          {t.type.toUpperCase()}
                        </Badge>
                        <span className="font-medium">{t.ticker}</span>
                      </div>
                      <span className="text-muted-foreground">
                        {t.quantity} × ${t.price}
                      </span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
