import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { TrendingUp, TrendingDown, GraduationCap, Brain, Newspaper, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { stocks } from "@/data/stocks";
import { mockNews } from "@/data/news";

export default function DashboardHome() {
  const topMovers = [...stocks]
    .sort((a, b) => Math.abs(b.changePercent) - Math.abs(a.changePercent))
    .slice(0, 5);

  const latestNews = mockNews.slice(0, 3);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Welcome */}
      <div>
        <h2 className="font-heading text-2xl font-bold">Welcome to FinanceHub</h2>
        <p className="text-muted-foreground mt-1">
          Your AI-powered platform for learning, analyzing, and trading stocks.
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { title: "Learn", desc: "Voice AI tutor", icon: GraduationCap, to: "/learn", color: "bg-accent" },
          { title: "Advisor", desc: "AI stock analysis", icon: Brain, to: "/advisor", color: "bg-secondary" },
          { title: "News", desc: "Market updates", icon: Newspaper, to: "/news", color: "bg-primary" },
          { title: "Trade", desc: "Buy & sell stocks", icon: TrendingUp, to: "/trade", color: "bg-chart-green" },
        ].map((item) => (
          <Link key={item.title} to={item.to}>
            <Card className="hover:shadow-md transition-all hover:-translate-y-0.5 cursor-pointer h-full">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`${item.color} rounded-lg p-3`}>
                  <item.icon className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-bold text-sm">{item.title}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground ml-auto" />
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Movers */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Top Movers</CardTitle>
            <Link to="/trade">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {topMovers.map((s) => (
                <div key={s.ticker} className="flex items-center justify-between">
                  <div>
                    <p className="font-bold text-sm">{s.ticker}</p>
                    <p className="text-xs text-muted-foreground">{s.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium">${s.currentPrice}</p>
                    <p className={`text-xs font-medium flex items-center gap-0.5 justify-end ${s.changePercent >= 0 ? "text-chart-green" : "text-chart-red"}`}>
                      {s.changePercent >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
                      {s.changePercent >= 0 ? "+" : ""}{s.changePercent}%
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Latest News */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base">Latest News</CardTitle>
            <Link to="/news">
              <Button variant="ghost" size="sm" className="text-xs">
                View All <ArrowRight className="h-3 w-3 ml-1" />
              </Button>
            </Link>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {latestNews.map((n) => (
                <div key={n.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Badge
                      variant={n.sentiment === "bullish" ? "default" : n.sentiment === "bearish" ? "destructive" : "secondary"}
                      className="text-xs"
                    >
                      {n.sentiment}
                    </Badge>
                    {n.ticker && <Badge variant="outline" className="text-xs">{n.ticker}</Badge>}
                  </div>
                  <p className="text-sm font-medium leading-snug">{n.headline}</p>
                  <p className="text-xs text-muted-foreground">{n.source}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Market Overview */}
      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">Market Snapshot</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {stocks.slice(0, 10).map((s) => (
              <div key={s.ticker} className="bg-muted/30 rounded-lg p-3">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-sm">{s.ticker}</span>
                  <span className={`text-xs ${s.changePercent >= 0 ? "text-chart-green" : "text-chart-red"}`}>
                    {s.changePercent >= 0 ? "+" : ""}{s.changePercent}%
                  </span>
                </div>
                <p className="text-lg font-bold mt-1">${s.currentPrice}</p>
                <p className="text-xs text-muted-foreground truncate">{s.name}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
