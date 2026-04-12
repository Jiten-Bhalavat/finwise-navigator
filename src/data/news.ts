export interface NewsItem {
  id: string;
  headline: string;
  summary: string;
  category: "Market Overview" | "Top Movers" | "Earnings" | "Breaking News";
  sentiment: "bullish" | "bearish" | "neutral";
  ticker?: string;
  timestamp: string;
  source: string;
}

export const mockNews: NewsItem[] = [
  {
    id: "1",
    headline: "NVIDIA Surges on Record AI Chip Demand",
    summary: "NVIDIA reported quarterly revenue that beat analyst expectations by 20%, driven by unprecedented demand for AI training chips from major cloud providers.",
    category: "Top Movers",
    sentiment: "bullish",
    ticker: "NVDA",
    timestamp: "2026-04-12T09:30:00Z",
    source: "Market Watch",
  },
  {
    id: "2",
    headline: "Federal Reserve Signals Potential Rate Cut in Q3",
    summary: "Fed Chair indicated that economic conditions may warrant a rate reduction later this year, sending markets broadly higher across all sectors.",
    category: "Market Overview",
    sentiment: "bullish",
    timestamp: "2026-04-12T08:15:00Z",
    source: "Reuters",
  },
  {
    id: "3",
    headline: "Apple Unveils Next-Gen AI Features at Developer Conference",
    summary: "Apple announced a suite of on-device AI capabilities for iPhone and Mac, positioning itself as a leader in privacy-focused artificial intelligence.",
    category: "Breaking News",
    sentiment: "bullish",
    ticker: "AAPL",
    timestamp: "2026-04-11T14:00:00Z",
    source: "Bloomberg",
  },
  {
    id: "4",
    headline: "Tesla Misses Delivery Estimates for Q1 2026",
    summary: "Tesla delivered 410,000 vehicles in Q1, falling short of the 450,000 consensus estimate. Shares dropped 4% in after-hours trading.",
    category: "Earnings",
    sentiment: "bearish",
    ticker: "TSLA",
    timestamp: "2026-04-11T16:30:00Z",
    source: "CNBC",
  },
  {
    id: "5",
    headline: "S&P 500 Hits New All-Time High on Tech Rally",
    summary: "The S&P 500 climbed 1.2% to close at a record high, led by gains in technology and healthcare sectors amid improving economic data.",
    category: "Market Overview",
    sentiment: "bullish",
    timestamp: "2026-04-11T16:00:00Z",
    source: "Wall Street Journal",
  },
  {
    id: "6",
    headline: "JPMorgan Reports Strong Q1 Earnings, Beats Estimates",
    summary: "JPMorgan Chase reported earnings per share of $4.75, exceeding analyst expectations of $4.11, driven by strong investment banking revenue.",
    category: "Earnings",
    sentiment: "bullish",
    ticker: "JPM",
    timestamp: "2026-04-10T07:00:00Z",
    source: "Financial Times",
  },
  {
    id: "7",
    headline: "Oil Prices Drop as OPEC+ Increases Production Targets",
    summary: "Crude oil fell 3% after OPEC+ members agreed to raise output by 500,000 barrels per day starting next month, easing supply concerns.",
    category: "Market Overview",
    sentiment: "bearish",
    ticker: "XOM",
    timestamp: "2026-04-10T11:00:00Z",
    source: "Reuters",
  },
  {
    id: "8",
    headline: "Meta Launches New Enterprise AI Assistant Platform",
    summary: "Meta introduced an AI assistant platform for businesses, competing directly with Microsoft's Copilot. Analysts see it as a potential major revenue driver.",
    category: "Breaking News",
    sentiment: "bullish",
    ticker: "META",
    timestamp: "2026-04-10T10:00:00Z",
    source: "TechCrunch",
  },
  {
    id: "9",
    headline: "Disney+ Subscriber Growth Exceeds Expectations",
    summary: "Walt Disney reported 175 million Disney+ subscribers globally, surpassing estimates. The streaming service also turned profitable for the first time.",
    category: "Earnings",
    sentiment: "bullish",
    ticker: "DIS",
    timestamp: "2026-04-09T17:00:00Z",
    source: "Variety",
  },
  {
    id: "10",
    headline: "Bank of America Warns of Consumer Spending Slowdown",
    summary: "BAC's economic research team published a report showing declining credit card spending growth, signaling potential consumer fatigue ahead.",
    category: "Market Overview",
    sentiment: "bearish",
    ticker: "BAC",
    timestamp: "2026-04-09T09:30:00Z",
    source: "Bloomberg",
  },
];
