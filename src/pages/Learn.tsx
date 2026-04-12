import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { VoiceAdvisor } from "@/components/VoiceAdvisor";

const educationCards = [
  {
    title: "What is the Stock Market?",
    description: "The stock market is a marketplace where buyers and sellers trade shares of publicly listed companies. It allows companies to raise capital and investors to own a portion of businesses.",
  },
  {
    title: "How to Start Investing",
    description: "Begin with setting a budget, understanding your risk tolerance, diversifying across sectors, and starting with index funds or well-known companies. Always invest only what you can afford to lose.",
  },
  {
    title: "Understanding P/E Ratio",
    description: "The Price-to-Earnings ratio compares a company's share price to its earnings per share. A high P/E may indicate high growth expectations, while a low P/E might signal undervaluation.",
  },
  {
    title: "What are ETFs?",
    description: "Exchange-Traded Funds are baskets of securities that trade like stocks. They offer diversification, lower fees than mutual funds, and exposure to entire sectors or indices.",
  },
  {
    title: "Risk Management Basics",
    description: "Never put all your eggs in one basket. Use stop-loss orders, diversify across asset classes, and maintain an emergency fund before investing in volatile assets.",
  },
  {
    title: "Reading Stock Charts",
    description: "Learn to identify trends, support/resistance levels, and volume patterns. Candlestick charts show open, high, low, and close prices — essential for technical analysis.",
  },
];

export default function LearnPage() {
  return (
    <div className="max-w-6xl mx-auto space-y-10">
      {/* Voice AI Tutor — centred */}
      <div className="flex flex-col items-center gap-3 pt-4">
        <h1 className="text-2xl font-bold">Voice AI Tutor</h1>
        <p className="text-sm text-muted-foreground text-center max-w-sm">
          Press play and ask anything about investing, stocks, or financial concepts.
        </p>
        <div className="w-72">
          <VoiceAdvisor />
        </div>
      </div>

      {/* Education Cards */}
      <div>
        <h2 className="font-heading text-xl font-bold mb-4">Learning Resources</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {educationCards.map((card) => (
            <Card key={card.title} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-2">
                <CardTitle className="text-base">{card.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{card.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
