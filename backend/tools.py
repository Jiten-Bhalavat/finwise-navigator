"""
FinWise AI — LangGraph tool implementations.
Each tool is a @tool-decorated function that the agent can call.
"""

import json
import numpy as np
from datetime import datetime
from langchain_core.tools import tool

# ─────────────────────────────────────────────────────────────────────────────
# 1. Stock Price Performance
# ─────────────────────────────────────────────────────────────────────────────

@tool
def analyze_stock_performance(ticker: str, period: str = "6mo") -> str:
    """
    Analyze a stock's price performance over a period (e.g. '6mo', '1y', '3mo').
    Returns current price, total return, RSI, 50/200-day SMAs, volatility,
    52-week high/low, monthly return breakdown, and trend direction.
    """
    try:
        import yfinance as yf

        ticker = ticker.upper().strip()
        stock = yf.Ticker(ticker)
        hist = stock.history(period=period)

        if hist.empty:
            return json.dumps({"error": f"No price data for '{ticker}'. Check the ticker symbol."})

        current_price = float(hist["Close"].iloc[-1])
        start_price = float(hist["Close"].iloc[0])
        total_return = ((current_price - start_price) / start_price) * 100

        # Annualised volatility
        daily_returns = hist["Close"].pct_change().dropna()
        volatility = float(daily_returns.std() * np.sqrt(252) * 100)

        # RSI (14-day)
        delta = hist["Close"].diff()
        gain = delta.where(delta > 0, 0.0).rolling(14).mean()
        loss = (-delta.where(delta < 0, 0.0)).rolling(14).mean()
        rs = gain / loss
        rsi_series = 100 - (100 / (1 + rs))
        rsi = float(rsi_series.iloc[-1]) if not np.isnan(rsi_series.iloc[-1]) else None

        # Moving averages
        sma50  = float(hist["Close"].rolling(50).mean().iloc[-1])  if len(hist) >= 50  else None
        sma200 = float(hist["Close"].rolling(200).mean().iloc[-1]) if len(hist) >= 200 else None

        # 52-week range
        hist_1y = stock.history(period="1y")
        high_52w = float(hist_1y["High"].max())  if not hist_1y.empty else None
        low_52w  = float(hist_1y["Low"].min())   if not hist_1y.empty else None

        # Volume trend
        avg_vol    = float(hist["Volume"].mean())
        recent_vol = float(hist["Volume"].iloc[-5:].mean())
        volume_trend = "above average" if recent_vol > avg_vol * 1.1 else "below average" if recent_vol < avg_vol * 0.9 else "average"

        # Price trend (30-day)
        last_30 = hist["Close"].iloc[-30:] if len(hist) >= 30 else hist["Close"]
        trend = "uptrend" if float(last_30.iloc[-1]) > float(last_30.iloc[0]) else "downtrend"

        # Monthly returns
        monthly = hist["Close"].resample("ME").last().pct_change().dropna() * 100
        monthly_str = ", ".join(
            f"{idx.strftime('%b %Y')}: {float(ret):+.1f}%"
            for idx, ret in monthly.items()
        )

        pct_from_high = ((current_price - high_52w) / high_52w * 100) if high_52w else None

        return json.dumps({
            "ticker": ticker,
            "current_price": round(current_price, 2),
            "period_return_pct": round(total_return, 2),
            "annualised_volatility_pct": round(volatility, 2),
            "rsi_14day": round(rsi, 1) if rsi else None,
            "sma_50": round(sma50, 2) if sma50 and not np.isnan(sma50) else None,
            "sma_200": round(sma200, 2) if sma200 and not np.isnan(sma200) else None,
            "high_52w": round(high_52w, 2) if high_52w else None,
            "low_52w": round(low_52w, 2) if low_52w else None,
            "pct_below_52w_high": round(pct_from_high, 1) if pct_from_high else None,
            "volume_trend": volume_trend,
            "price_trend_30d": trend,
            "monthly_returns": monthly_str,
        }, indent=2)

    except Exception as e:
        return json.dumps({"error": str(e)})


# ─────────────────────────────────────────────────────────────────────────────
# 2. Fundamental Data
# ─────────────────────────────────────────────────────────────────────────────

@tool
def get_stock_fundamentals(ticker: str) -> str:
    """
    Fetch fundamental financial data for a stock: P/E ratio, forward P/E,
    EPS, market cap, revenue, gross/net margins, beta, dividend yield,
    analyst target price & recommendation, P/B ratio, debt/equity,
    and YoY revenue & earnings growth.
    """
    try:
        import yfinance as yf

        ticker = ticker.upper().strip()
        info = yf.Ticker(ticker).info

        if not info or (info.get("regularMarketPrice") is None and info.get("currentPrice") is None):
            return json.dumps({"error": f"Could not fetch fundamentals for '{ticker}'."})

        def safe(key, divisor=1, decimals=2):
            v = info.get(key)
            if v is None:
                return None
            try:
                return round(float(v) / divisor, decimals)
            except Exception:
                return None

        return json.dumps({
            "ticker": ticker,
            "company_name": info.get("longName", "N/A"),
            "sector": info.get("sector", "N/A"),
            "industry": info.get("industry", "N/A"),
            "market_cap_B": safe("marketCap", 1e9),
            "pe_ratio_ttm": safe("trailingPE"),
            "forward_pe": safe("forwardPE"),
            "eps_ttm": safe("trailingEps"),
            "revenue_B": safe("totalRevenue", 1e9),
            "gross_margin_pct": safe("grossMargins", 0.01),
            "net_margin_pct": safe("profitMargins", 0.01),
            "revenue_growth_yoy_pct": safe("revenueGrowth", 0.01),
            "earnings_growth_yoy_pct": safe("earningsGrowth", 0.01),
            "beta": safe("beta"),
            "dividend_yield_pct": safe("dividendYield", 0.01),
            "price_to_book": safe("priceToBook"),
            "debt_to_equity": safe("debtToEquity"),
            "analyst_target_price": safe("targetMeanPrice"),
            "analyst_recommendation": info.get("recommendationKey", "N/A"),
            "analyst_count": info.get("numberOfAnalystOpinions"),
        }, indent=2)

    except Exception as e:
        return json.dumps({"error": str(e)})


# ─────────────────────────────────────────────────────────────────────────────
# 3. News & Sentiment Search
# ─────────────────────────────────────────────────────────────────────────────

@tool
def search_news_and_sentiment(query: str) -> str:
    """
    Search the web for recent financial news, analyst opinions, and market
    sentiment about a stock or topic. Returns up to 6 recent headlines with
    snippets and sources. Use queries like 'AAPL Apple stock news 2025'.
    """
    try:
        from duckduckgo_search import DDGS

        results = []
        with DDGS() as ddgs:
            for r in ddgs.news(query, max_results=6, timelimit="m"):
                results.append({
                    "title": r.get("title", ""),
                    "source": r.get("source", ""),
                    "date": r.get("date", ""),
                    "summary": (r.get("body") or "")[:350],
                    "url": r.get("url", ""),
                })

        if not results:
            # Fallback: general text search
            with DDGS() as ddgs:
                for r in ddgs.text(query + " site:finance.yahoo.com OR site:reuters.com OR site:bloomberg.com", max_results=5):
                    results.append({
                        "title": r.get("title", ""),
                        "source": r.get("href", ""),
                        "date": datetime.now().strftime("%Y-%m-%d"),
                        "summary": (r.get("body") or "")[:350],
                        "url": r.get("href", ""),
                    })

        return json.dumps(results, indent=2)

    except Exception as e:
        return json.dumps({"error": str(e)})


# ─────────────────────────────────────────────────────────────────────────────
# 4. Social Sentiment
# ─────────────────────────────────────────────────────────────────────────────

@tool
def search_social_sentiment(ticker: str) -> str:
    """
    Search Reddit (WallStreetBets, r/stocks, r/investing), Twitter/X, and
    financial forums for retail investor sentiment about a stock ticker.
    Returns recent community discussion snippets.
    """
    try:
        from duckduckgo_search import DDGS

        results = []
        queries = [
            f"{ticker} stock reddit wallstreetbets 2025",
            f"${ticker} twitter investor sentiment buy sell 2025",
            f"{ticker} stock forum discussion bullish bearish",
        ]

        with DDGS() as ddgs:
            for q in queries:
                for r in ddgs.text(q, max_results=3):
                    results.append({
                        "platform": _infer_platform(r.get("href", "")),
                        "title": r.get("title", ""),
                        "snippet": (r.get("body") or "")[:400],
                        "url": r.get("href", ""),
                    })
                if len(results) >= 6:
                    break

        return json.dumps(results[:6], indent=2)

    except Exception as e:
        return json.dumps({"error": str(e)})


def _infer_platform(url: str) -> str:
    url = url.lower()
    if "reddit" in url:
        return "Reddit"
    if "twitter" in url or "x.com" in url:
        return "Twitter/X"
    if "stocktwits" in url:
        return "StockTwits"
    if "seekingalpha" in url:
        return "Seeking Alpha"
    if "motleyfool" in url:
        return "Motley Fool"
    return "Web"


# ─────────────────────────────────────────────────────────────────────────────
# 5. Compare Stocks
# ─────────────────────────────────────────────────────────────────────────────

@tool
def compare_stocks(tickers_csv: str) -> str:
    """
    Compare multiple stocks side by side on 6-month performance, valuation,
    and analyst consensus. Pass ticker symbols as a comma-separated string,
    e.g. 'AAPL,MSFT,GOOGL' or 'NVDA,AMD,INTC'.
    """
    try:
        import yfinance as yf

        tickers = [t.strip().upper() for t in tickers_csv.split(",") if t.strip()][:5]
        rows = []

        for ticker in tickers:
            try:
                stock = yf.Ticker(ticker)
                hist  = stock.history(period="6mo")
                info  = stock.info

                if hist.empty:
                    continue

                current = float(hist["Close"].iloc[-1])
                start   = float(hist["Close"].iloc[0])
                ret_6m  = ((current - start) / start) * 100

                # 1-month return
                hist_1m = stock.history(period="1mo")
                ret_1m  = ((float(hist_1m["Close"].iloc[-1]) - float(hist_1m["Close"].iloc[0])) /
                           float(hist_1m["Close"].iloc[0]) * 100) if not hist_1m.empty else None

                volatility = float(hist["Close"].pct_change().std() * np.sqrt(252) * 100)

                # RSI
                delta = hist["Close"].diff()
                gain  = delta.where(delta > 0, 0.0).rolling(14).mean()
                loss  = (-delta.where(delta < 0, 0.0)).rolling(14).mean()
                rs    = gain / loss
                rsi   = float((100 - 100 / (1 + rs)).iloc[-1])
                rsi   = round(rsi, 1) if not np.isnan(rsi) else None

                rows.append({
                    "ticker": ticker,
                    "company": info.get("longName", ticker),
                    "sector": info.get("sector", "N/A"),
                    "current_price": round(current, 2),
                    "return_6mo_pct": round(ret_6m, 2),
                    "return_1mo_pct": round(ret_1m, 2) if ret_1m else None,
                    "volatility_pct": round(volatility, 2),
                    "rsi_14d": rsi,
                    "pe_ratio": round(float(info["trailingPE"]), 1) if info.get("trailingPE") else None,
                    "forward_pe": round(float(info["forwardPE"]), 1) if info.get("forwardPE") else None,
                    "market_cap_B": round(float(info["marketCap"]) / 1e9, 1) if info.get("marketCap") else None,
                    "analyst_rec": info.get("recommendationKey", "N/A"),
                    "analyst_target": info.get("targetMeanPrice"),
                    "beta": round(float(info["beta"]), 2) if info.get("beta") else None,
                    "revenue_growth_pct": round(float(info["revenueGrowth"]) * 100, 1) if info.get("revenueGrowth") else None,
                })

            except Exception:
                continue

        # Sort by 6-month return descending
        rows.sort(key=lambda x: x.get("return_6mo_pct", -999), reverse=True)

        return json.dumps({
            "comparison": rows,
            "best_performer_6mo": rows[0]["ticker"] if rows else None,
        }, indent=2)

    except Exception as e:
        return json.dumps({"error": str(e)})


# ─────────────────────────────────────────────────────────────────────────────
# 6. Market Overview
# ─────────────────────────────────────────────────────────────────────────────

@tool
def get_market_overview() -> str:
    """
    Get current market conditions: S&P 500, NASDAQ, Dow Jones, VIX (fear index),
    and major sector ETF performance (tech, healthcare, financials, energy, etc.).
    Provides 1-day and 1-month change for each.
    """
    try:
        import yfinance as yf

        targets = {
            "S&P 500":           "^GSPC",
            "NASDAQ":            "^IXIC",
            "Dow Jones":         "^DJI",
            "VIX (Fear Index)":  "^VIX",
            "Technology (XLK)":  "XLK",
            "Healthcare (XLV)":  "XLV",
            "Financials (XLF)":  "XLF",
            "Energy (XLE)":      "XLE",
            "Consumer Disc (XLY)": "XLY",
            "Industrials (XLI)": "XLI",
            "Semiconductors (SOXX)": "SOXX",
        }

        results = {}
        for name, symbol in targets.items():
            try:
                hist = yf.Ticker(symbol).history(period="1mo")
                if hist.empty:
                    continue
                current   = float(hist["Close"].iloc[-1])
                month_ago = float(hist["Close"].iloc[0])
                prev_day  = float(hist["Close"].iloc[-2]) if len(hist) >= 2 else current

                results[name] = {
                    "current": round(current, 2),
                    "1d_change_pct": round((current - prev_day) / prev_day * 100, 2),
                    "1mo_return_pct": round((current - month_ago) / month_ago * 100, 2),
                }
            except Exception:
                continue

        # Overall market mood
        sp500_1mo = results.get("S&P 500", {}).get("1mo_return_pct", 0)
        vix = results.get("VIX (Fear Index)", {}).get("current", 20)
        if vix > 30:
            mood = "High Fear — elevated volatility, defensive positioning recommended"
        elif vix > 20:
            mood = "Moderate Concern — cautious market, watch key levels"
        elif sp500_1mo > 3:
            mood = "Bullish — strong momentum, risk-on environment"
        elif sp500_1mo > 0:
            mood = "Mildly Bullish — positive trend with some caution"
        else:
            mood = "Bearish — negative trend, consider defensive positions"

        results["_market_mood"] = mood
        results["_vix_level"] = vix

        return json.dumps(results, indent=2)

    except Exception as e:
        return json.dumps({"error": str(e)})


# Exported tool list
ALL_TOOLS = [
    analyze_stock_performance,
    get_stock_fundamentals,
    search_news_and_sentiment,
    search_social_sentiment,
    compare_stocks,
    get_market_overview,
]
