import { useState, useRef, useEffect } from "react";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";

interface Message {
  role: "user" | "assistant";
  content: string;
  loading?: boolean;
}

// ─── LangGraph agent stub ──────────────────────────────────────────────────
// Replace this function body with the real LangGraph / ChatGPT agent call.
// It receives the full message history and the latest user query.
async function runLangGraphAgent(
  _messages: Message[],
  _query: string
): Promise<string> {
  // TODO: wire up LangGraph agent here
  await new Promise((r) => setTimeout(r, 1200)); // simulate latency
  return "The LangGraph agent is not yet connected. Once integrated, it will research the stock you asked about and return a detailed AI-powered analysis here.";
}
// ──────────────────────────────────────────────────────────────────────────

const suggestedQueries = [
  "Should I buy Apple stock right now?",
  "Analyse NVIDIA's recent performance",
  "Is Tesla overvalued?",
  "Compare Microsoft vs Google",
];

export default function AdvisorPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (text?: string) => {
    const query = text ?? input;
    if (!query.trim() || loading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: query };
    const placeholderMsg: Message = { role: "assistant", content: "", loading: true };

    setMessages((prev) => [...prev, userMsg, placeholderMsg]);
    setLoading(true);

    try {
      const reply = await runLangGraphAgent([...messages, userMsg], query);
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: reply },
      ]);
    } catch {
      setMessages((prev) => [
        ...prev.slice(0, -1),
        { role: "assistant", content: "Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto h-[calc(100vh-8rem)] flex flex-col gap-4">
      <div>
        <h1 className="text-2xl font-bold">AI Stock Advisor</h1>
        <p className="text-sm text-muted-foreground">
          Powered by ChatGPT + LangGraph — ask any question and get deep research on any stock.
        </p>
      </div>

      <Card className="flex-1 flex flex-col overflow-hidden">
        {/* Message area */}
        <ScrollArea className="flex-1 px-4 py-4">
          {messages.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center gap-6 py-16 text-center">
              <Bot className="h-12 w-12 text-muted-foreground/40" />
              <div className="space-y-1">
                <p className="font-medium">Ask me anything about stocks</p>
                <p className="text-sm text-muted-foreground">
                  I'll research and analyse it for you
                </p>
              </div>
              <div className="flex flex-wrap justify-center gap-2 max-w-md">
                {suggestedQueries.map((q) => (
                  <Button
                    key={q}
                    variant="outline"
                    size="sm"
                    className="text-xs"
                    onClick={() => handleSend(q)}
                  >
                    {q}
                  </Button>
                ))}
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex items-start gap-3 ${m.role === "user" ? "flex-row-reverse" : ""}`}
                >
                  {/* Avatar */}
                  <div
                    className={`shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted border"
                    }`}
                  >
                    {m.role === "user" ? <User size={14} /> : <Bot size={14} />}
                  </div>

                  {/* Bubble */}
                  <div
                    className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                      m.role === "user"
                        ? "bg-primary text-primary-foreground rounded-tr-sm"
                        : "bg-muted/50 border rounded-tl-sm"
                    }`}
                  >
                    {m.loading ? (
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <Loader2 size={14} className="animate-spin" />
                        Researching…
                      </span>
                    ) : (
                      m.content
                    )}
                  </div>
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          )}
        </ScrollArea>

        {/* Input bar */}
        <CardContent className="border-t pt-3 pb-3">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              handleSend();
            }}
          >
            <Input
              placeholder="Ask about any stock or financial topic…"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={loading}
              className="flex-1"
            />
            <Button type="submit" size="icon" disabled={loading || !input.trim()}>
              {loading ? (
                <Loader2 size={16} className="animate-spin" />
              ) : (
                <Send size={16} />
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
