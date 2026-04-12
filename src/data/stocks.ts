// Seeded random for reproducible mock data
function seededRandom(seed: number) {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

export interface Stock {
  ticker: string;
  name: string;
  sector: string;
  currentPrice: number;
  change: number;
  changePercent: number;
  high52w: number;
  low52w: number;
  peRatio: number;
  marketCap: string;
  volume: string;
  priceHistory: { date: string; price: number }[];
}

interface StockSeed {
  ticker: string;
  name: string;
  sector: string;
  basePrice: number;
  peRatio: number;
  marketCap: string;
  volume: string;
}

const stockSeeds: StockSeed[] = [
  { ticker: "AAPL", name: "Apple Inc.", sector: "Technology", basePrice: 178, peRatio: 28.5, marketCap: "2.8T", volume: "54M" },
  { ticker: "GOOGL", name: "Alphabet Inc.", sector: "Technology", basePrice: 141, peRatio: 25.2, marketCap: "1.8T", volume: "28M" },
  { ticker: "MSFT", name: "Microsoft Corp.", sector: "Technology", basePrice: 378, peRatio: 35.1, marketCap: "2.8T", volume: "22M" },
  { ticker: "NVDA", name: "NVIDIA Corp.", sector: "Technology", basePrice: 480, peRatio: 65.3, marketCap: "1.2T", volume: "45M" },
  { ticker: "TSLA", name: "Tesla Inc.", sector: "Automotive", basePrice: 245, peRatio: 72.1, marketCap: "780B", volume: "118M" },
  { ticker: "AMZN", name: "Amazon.com Inc.", sector: "Consumer", basePrice: 153, peRatio: 60.2, marketCap: "1.6T", volume: "52M" },
  { ticker: "META", name: "Meta Platforms", sector: "Technology", basePrice: 355, peRatio: 28.9, marketCap: "910B", volume: "18M" },
  { ticker: "JPM", name: "JPMorgan Chase", sector: "Finance", basePrice: 172, peRatio: 11.3, marketCap: "500B", volume: "9M" },
  { ticker: "V", name: "Visa Inc.", sector: "Finance", basePrice: 265, peRatio: 31.5, marketCap: "540B", volume: "7M" },
  { ticker: "JNJ", name: "Johnson & Johnson", sector: "Healthcare", basePrice: 158, peRatio: 15.8, marketCap: "380B", volume: "6M" },
  { ticker: "WMT", name: "Walmart Inc.", sector: "Consumer", basePrice: 165, peRatio: 27.3, marketCap: "445B", volume: "8M" },
  { ticker: "PG", name: "Procter & Gamble", sector: "Consumer", basePrice: 152, peRatio: 24.1, marketCap: "358B", volume: "6M" },
  { ticker: "UNH", name: "UnitedHealth Group", sector: "Healthcare", basePrice: 525, peRatio: 22.6, marketCap: "490B", volume: "3M" },
  { ticker: "HD", name: "Home Depot", sector: "Consumer", basePrice: 345, peRatio: 22.8, marketCap: "345B", volume: "4M" },
  { ticker: "BAC", name: "Bank of America", sector: "Finance", basePrice: 33, peRatio: 10.2, marketCap: "260B", volume: "35M" },
  { ticker: "XOM", name: "Exxon Mobil", sector: "Energy", basePrice: 108, peRatio: 12.5, marketCap: "430B", volume: "14M" },
  { ticker: "DIS", name: "Walt Disney Co.", sector: "Entertainment", basePrice: 92, peRatio: 45.2, marketCap: "168B", volume: "10M" },
  { ticker: "NFLX", name: "Netflix Inc.", sector: "Entertainment", basePrice: 475, peRatio: 44.8, marketCap: "210B", volume: "7M" },
  { ticker: "ORCL", name: "Oracle Corp.", sector: "Technology", basePrice: 118, peRatio: 33.1, marketCap: "320B", volume: "8M" },
  { ticker: "CRM", name: "Salesforce Inc.", sector: "Technology", basePrice: 265, peRatio: 58.4, marketCap: "258B", volume: "5M" },
];

function generatePriceHistory(basePrice: number, seed: number): { date: string; price: number }[] {
  const rng = seededRandom(seed);
  const history: { date: string; price: number }[] = [];
  let price = basePrice * (0.85 + rng() * 0.15);
  const today = new Date();

  for (let i = 180; i >= 0; i--) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    if (date.getDay() === 0 || date.getDay() === 6) continue;

    const drift = 0.0003;
    const volatility = 0.018;
    const change = drift + volatility * (rng() - 0.5) * 2;
    price = price * (1 + change);
    price = Math.max(price, basePrice * 0.5);

    history.push({
      date: date.toISOString().split("T")[0],
      price: Math.round(price * 100) / 100,
    });
  }

  return history;
}

export const stocks: Stock[] = stockSeeds.map((seed, idx) => {
  const history = generatePriceHistory(seed.basePrice, (idx + 1) * 12345);
  const currentPrice = history[history.length - 1].price;
  const prevPrice = history[history.length - 2]?.price ?? currentPrice;
  const change = Math.round((currentPrice - prevPrice) * 100) / 100;
  const changePercent = Math.round((change / prevPrice) * 10000) / 100;
  const prices = history.map((h) => h.price);

  return {
    ticker: seed.ticker,
    name: seed.name,
    sector: seed.sector,
    currentPrice,
    change,
    changePercent,
    high52w: Math.round(Math.max(...prices) * 100) / 100,
    low52w: Math.round(Math.min(...prices) * 100) / 100,
    peRatio: seed.peRatio,
    marketCap: seed.marketCap,
    volume: seed.volume,
    priceHistory: history,
  };
});

export function getStock(ticker: string): Stock | undefined {
  return stocks.find((s) => s.ticker === ticker.toUpperCase());
}

export function searchStocks(query: string): Stock[] {
  const q = query.toLowerCase();
  return stocks.filter(
    (s) => s.ticker.toLowerCase().includes(q) || s.name.toLowerCase().includes(q)
  );
}

export const sectors = [...new Set(stockSeeds.map((s) => s.sector))];
