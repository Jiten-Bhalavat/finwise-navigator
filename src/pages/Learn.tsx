import { useState } from "react";
import { Mic, MicOff, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

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

const starterQuestions = [
  "What is the stock market?",
  "How should I start investing?",
  "What are blue-chip stocks?",
  "Explain market capitalization",
  "What is a dividend?",
];

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function LearnPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isListening, setIsListening] = useState(false);

  const handleSend = (text?: string) => {
    const msg = text ?? input;
    if (!msg.trim()) return;
    setMessages((prev) => [
      ...prev,
      { role: "user", content: msg },
      {
        role: "assistant",
        content: `Great question about "${msg}"! This is a placeholder response. Once connected to ElevenLabs voice AI, you'll get detailed spoken explanations about any finance topic. For now, check out the learning cards below for curated educational content.`,
      },
    ]);
    setInput("");
  };

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Voice Chat Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mic className="h-5 w-5 text-accent" />
            Voice AI Tutor
          </CardTitle>
          <CardDescription>
            Ask any question about investing, stocks, or financial concepts. Voice integration coming soon via ElevenLabs.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Messages */}
          {messages.length > 0 && (
            <div className="max-h-80 overflow-y-auto space-y-3 rounded-lg border p-4 bg-muted/30">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-2 text-sm ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-card border"
                    }`}
                  >
                    {m.content}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Starter questions */}
          {messages.length === 0 && (
            <div className="flex flex-wrap gap-2">
              {starterQuestions.map((q) => (
                <Button
                  key={q}
                  variant="outline"
                  size="sm"
                  onClick={() => handleSend(q)}
                  className="text-xs"
                >
                  {q}
                </Button>
              ))}
            </div>
          )}

          {/* Input bar */}
          <div className="flex gap-2">
            <Button
              variant={isListening ? "destructive" : "outline"}
              size="icon"
              onClick={() => setIsListening(!isListening)}
              title="Voice input (coming soon)"
            >
              {isListening ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
            </Button>
            <Input
              placeholder="Ask anything about finance..."
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
