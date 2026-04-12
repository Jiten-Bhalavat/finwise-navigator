"""
FinWise AI Backend — FastAPI server with SSE streaming.
Run: uvicorn main:app --reload --port 8081
"""

import asyncio
import json
import os
from contextlib import asynccontextmanager

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from langchain_core.messages import HumanMessage, AIMessage, SystemMessage

from agent import build_agent, SYSTEM_PROMPT

# ─── App lifespan ─────────────────────────────────────────────────────────────

_advisor_agent = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    global _advisor_agent
    print("Building FinWise AI agent…")
    _advisor_agent = build_agent()
    print("Agent ready.")
    yield
    _advisor_agent = None

app = FastAPI(title="FinWise AI Backend", version="1.0.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Models ───────────────────────────────────────────────────────────────────

class ChatMessage(BaseModel):
    role: str        # "user" | "assistant"
    content: str

class ChatRequest(BaseModel):
    messages: list[ChatMessage]
    query: str

# ─── Routes ───────────────────────────────────────────────────────────────────

@app.get("/health")
def health():
    return {"status": "ok", "agent_ready": _advisor_agent is not None}


@app.get("/stock/candles/{ticker}")
def get_candles(ticker: str, period: str = "6mo"):
    """Return OHLCV candlestick data for a ticker (via yfinance)."""
    try:
        import yfinance as yf
        hist = yf.Ticker(ticker.upper()).history(period=period)
        if hist.empty:
            raise HTTPException(status_code=404, detail=f"No data for {ticker}")

        candles = [
            {
                "time":  idx.strftime("%Y-%m-%d"),
                "open":  round(float(row["Open"]),  2),
                "high":  round(float(row["High"]),  2),
                "low":   round(float(row["Low"]),   2),
                "close": round(float(row["Close"]), 2),
            }
            for idx, row in hist.iterrows()
        ]
        return {"ticker": ticker.upper(), "candles": candles}
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(status_code=500, detail=str(exc))


@app.post("/advisor/chat")
async def advisor_chat(request: ChatRequest):
    """
    Stream agent response as Server-Sent Events.

    Event shapes:
      {"type": "tool_call",  "tool": "<name>"}
      {"type": "tool_done",  "tool": "<name>"}
      {"type": "text",       "text": "<chunk>"}
      {"type": "done"}
      {"type": "error",      "message": "<text>"}
    """
    if _advisor_agent is None:
        raise HTTPException(status_code=503, detail="Agent not ready yet")

    async def event_stream():
        try:
            # Build message history with system prompt prepended manually
            # (fallback if messages_modifier / prompt didn't apply in build_agent)
            lc_messages = [SystemMessage(content=SYSTEM_PROMPT)]

            for m in request.messages:
                if m.role == "user" and m.content.strip():
                    lc_messages.append(HumanMessage(content=m.content))
                elif m.role == "assistant" and m.content.strip():
                    lc_messages.append(AIMessage(content=m.content))

            lc_messages.append(HumanMessage(content=request.query))

            # Stream agent updates
            async for update in _advisor_agent.astream(
                {"messages": lc_messages},
                stream_mode="updates",
            ):
                # ── Agent node: LLM decisions ────────────────────────────
                if "agent" in update:
                    for msg in update["agent"]["messages"]:
                        # Tool calls
                        if getattr(msg, "tool_calls", None):
                            for tc in msg.tool_calls:
                                # Emit the ticker symbol so the frontend can load the chart
                                if tc["name"] == "analyze_stock_performance":
                                    raw_ticker = (tc.get("args") or {}).get("ticker", "")
                                    if raw_ticker:
                                        yield f"data: {json.dumps({'type': 'ticker', 'ticker': raw_ticker.upper()})}\n\n"
                                yield f"data: {json.dumps({'type': 'tool_call', 'tool': tc['name']})}\n\n"

                        # Final text (no pending tool calls)
                        elif msg.content and isinstance(msg.content, str):
                            words = msg.content.split(" ")
                            for i, word in enumerate(words):
                                chunk = word + (" " if i < len(words) - 1 else "")
                                yield f"data: {json.dumps({'type': 'text', 'text': chunk})}\n\n"
                                if i % 4 == 0:
                                    await asyncio.sleep(0.018)

                # ── Tools node: results returned ─────────────────────────
                elif "tools" in update:
                    for msg in update["tools"]["messages"]:
                        if hasattr(msg, "name"):
                            yield f"data: {json.dumps({'type': 'tool_done', 'tool': msg.name})}\n\n"

            yield f"data: {json.dumps({'type': 'done'})}\n\n"

        except Exception as exc:
            yield f"data: {json.dumps({'type': 'error', 'message': str(exc)})}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Connection": "keep-alive",
        },
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8081, reload=True)
