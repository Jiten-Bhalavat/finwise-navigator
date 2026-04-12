import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { TrendingUp, TrendingDown, Minus, Search } from "lucide-react";
import { stocks } from "@/data/stocks";
import { mockNews, type NewsItem } from "@/data/news";

const categories = ["All", "Market Overview", "Top Movers", "Earnings", "Breaking News"] as const;

function TickerBar() {
  const top5 = stocks.slice(0, 5);
  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {top5.map((s) => (
        <div key={s.ticker} className="flex items-center gap-2 bg-card border rounded-lg px-4 py-2 shrink-0">
          <span className="font-bold text-sm">{s.ticker}</span>
          <span className="text-sm">${s.currentPrice}</span>
          <span
            className={`text-xs font-medium flex items-center gap-0.5 ${
              s.changePercent >= 0 ? "text-chart-green" : "text-chart-red"
            }`}
          >
            {s.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {s.changePercent >= 0 ? "+" : ""}{s.changePercent}%
          </span>
        </div>
      ))}
    </div>
  );
}

function SentimentIcon({ sentiment }: { sentiment: NewsItem["sentiment"] }) {
  if (sentiment === "bullish") return <TrendingUp className="h-3 w-3" />;
  if (sentiment === "bearish") return <TrendingDown className="h-3 w-3" />;
  return <Minus className="h-3 w-3" />;
}

function NewsCard({ item }: { item: NewsItem }) {
  const timeAgo = getTimeAgo(item.timestamp);
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <Badge variant="outline" className="text-xs shrink-0">{item.category}</Badge>
          <Badge
            variant={item.sentiment === "bullish" ? "default" : item.sentiment === "bearish" ? "destructive" : "secondary"}
            className="text-xs flex items-center gap-1"
          >
            <SentimentIcon sentiment={item.sentiment} />
            {item.sentiment}
          </Badge>
        </div>
        <CardTitle className="text-base leading-snug mt-2">{item.headline}</CardTitle>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground mb-3">{item.summary}</p>
        <div className="flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>{item.source}</span>
            {item.ticker && (
              <Badge variant="outline" className="text-xs">{item.ticker}</Badge>
            )}
          </div>
          <span>{timeAgo}</span>
        </div>
      </CardContent>
    </Card>
  );
}

function getTimeAgo(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const hours = Math.floor(diff / (1000 * 60 * 60));
  if (hours < 1) return "Just now";
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

export default function NewsPage() {
  const [category, setCategory] = useState<string>("All");
  const [search, setSearch] = useState("");

  const filtered = mockNews.filter((n) => {
    if (category !== "All" && n.category !== category) return false;
    if (search) {
      const q = search.toLowerCase();
      return n.headline.toLowerCase().includes(q) || n.summary.toLowerCase().includes(q) || n.ticker?.toLowerCase().includes(q);
    }
    return true;
  });

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <TickerBar />

      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search news..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-md text-sm transition-colors ${
                category === c
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((item) => (
          <NewsCard key={item.id} item={item} />
        ))}
        {filtered.length === 0 && (
          <p className="col-span-2 text-center text-muted-foreground py-8">
            No news found matching your criteria.
          </p>
        )}
      </div>
    </div>
  );
}
