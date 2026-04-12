/**
 * PortfolioContext — single source of truth for:
 *   • Wallet balance (tracked locally in localStorage; Nessie balance field is static)
 *   • Holdings (persisted in localStorage, so they survive page refresh)
 *   • Transaction history (fetched from Nessie on mount)
 *   • Buy / Sell / Add Funds actions
 *
 * Storage explanation:
 *   - Nessie API (Capital One mock):  stores every trade record permanently on their server
 *   - localStorage "finwise_holdings": holds current stock positions (survives refresh)
 *   - localStorage "finwise_balance":  holds wallet balance (survives refresh)
 *   - localStorage "finwise_nessie":   holds Nessie customer + account IDs
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  type ReactNode,
} from "react";
import {
  bootstrapNessie,
  getAccount,
  recordPurchase,
  recordDeposit,
  getPurchases,
  getDeposits,
  type NessieAccount,
  type NessiePurchase,
  type NessieDeposit,
} from "@/data/nessieAPI";
import { stocks } from "@/data/stocks";

/* ─── Types ──────────────────────────────────────────────────── */
export interface Holding {
  ticker: string;
  name: string;
  qty: number;
  mktPrice: number;   // average buy price
  invested: number;
  current: number;
}

export interface TxRecord {
  id: string;
  type: "buy" | "sell" | "deposit";
  desc: string;
  amount: number;
  date: string;
}

interface PortfolioCtx {
  // Nessie
  nessieId: { customerId: string; accountId: string } | null;
  nessieAcct: NessieAccount | null;
  nessieLoading: boolean;
  // Wallet (locally tracked — Nessie balance field is static)
  walletBalance: number;
  addFunds: (amount: number) => void;
  // Portfolio
  holdings: Holding[];
  txHistory: TxRecord[];
  // Derived stats
  totalCurrent: number;
  totalInvested: number;
  totalReturns: number;
  dayReturns: number;
  tradeCount: number;
  // Actions
  buyStock: (ticker: string, qty: number, price: number) => Promise<{ ok: boolean; msg: string }>;
  sellStock: (ticker: string, qty: number, price: number) => Promise<{ ok: boolean; msg: string }>;
  // keep for legacy callers in Trade
  refreshBalance: () => Promise<void>;
}

const PortfolioContext = createContext<PortfolioCtx | null>(null);

export function usePortfolio(): PortfolioCtx {
  const ctx = useContext(PortfolioContext);
  if (!ctx) throw new Error("usePortfolio must be inside <PortfolioProvider>");
  return ctx;
}

/* ─── localStorage helpers ───────────────────────────────────── */
const LS_HOLDINGS = "finwise_holdings";
const LS_BALANCE  = "finwise_balance";
const INITIAL_BALANCE = 10_000;

function lsLoadHoldings(): Holding[] {
  try { return JSON.parse(localStorage.getItem(LS_HOLDINGS) ?? "[]"); }
  catch { return []; }
}
function lsSaveHoldings(h: Holding[]) {
  localStorage.setItem(LS_HOLDINGS, JSON.stringify(h));
}
function lsLoadBalance(): number {
  const raw = localStorage.getItem(LS_BALANCE);
  return raw !== null ? parseFloat(raw) : INITIAL_BALANCE;
}
function lsSaveBalance(b: number) {
  localStorage.setItem(LS_BALANCE, b.toString());
}

/* ─── Provider ───────────────────────────────────────────────── */
export function PortfolioProvider({ children }: { children: ReactNode }) {
  const [nessieId,      setNessieId]      = useState<{ customerId: string; accountId: string } | null>(null);
  const [nessieAcct,    setNessieAcct]    = useState<NessieAccount | null>(null);
  const [nessieLoading, setNessieLoading] = useState(true);

  // Loaded from localStorage — starts at [] (no demo data)
  const [holdings,      setHoldings]      = useState<Holding[]>(lsLoadHoldings);
  // Wallet balance tracked locally; starts at $10,000
  const [walletBalance, setWalletBalance] = useState<number>(lsLoadBalance);
  const [txHistory,     setTxHistory]     = useState<TxRecord[]>([]);

  /* Bootstrap Nessie once on mount */
  useEffect(() => {
    (async () => {
      try {
        const ids = await bootstrapNessie();
        setNessieId(ids);
        const acct = await getAccount(ids.accountId);
        setNessieAcct(acct);
        // Load existing trade history from Nessie
        const [purchases, deposits] = await Promise.all([
          getPurchases(ids.accountId),
          getDeposits(ids.accountId),
        ]);
        const history: TxRecord[] = [
          ...purchases.map((p: NessiePurchase) => ({
            id: p._id, type: "buy" as const,
            desc: p.description, amount: p.amount, date: p.purchase_date,
          })),
          ...deposits.map((d: NessieDeposit) => ({
            id: d._id, type: "sell" as const,
            desc: d.description, amount: d.amount, date: d.transaction_date,
          })),
        ].sort((a, b) => b.date.localeCompare(a.date));
        setTxHistory(history);
      } catch (e) {
        console.warn("Nessie bootstrap failed:", e);
      } finally {
        setNessieLoading(false);
      }
    })();
  }, []);

  /* Sync holdings to localStorage whenever they change */
  useEffect(() => { lsSaveHoldings(holdings); }, [holdings]);

  /* Sync wallet balance to localStorage whenever it changes */
  useEffect(() => { lsSaveBalance(walletBalance); }, [walletBalance]);

  /* Add Funds — instantly increases wallet balance */
  const addFunds = useCallback((amount: number) => {
    if (amount <= 0) return;
    setWalletBalance((prev) => prev + amount);
    // Also log it in local tx history
    const today = new Date().toISOString().split("T")[0];
    setTxHistory((prev) => [{
      id: `dep-${Date.now()}`,
      type: "deposit",
      desc: `Added $${amount.toFixed(2)} to wallet`,
      amount,
      date: today,
    }, ...prev]);
  }, []);

  /* Legacy: kept so Trade page callers don't break */
  const refreshBalance = useCallback(async () => {
    if (!nessieId) return;
    try { const acct = await getAccount(nessieId.accountId); setNessieAcct(acct); }
    catch {}
  }, [nessieId]);

  /* BUY */
  const buyStock = useCallback(async (
    ticker: string, qty: number, price: number
  ): Promise<{ ok: boolean; msg: string }> => {
    const totalCost = qty * price;

    if (totalCost > walletBalance) {
      return { ok: false, msg: `Insufficient funds ($${walletBalance.toFixed(2)} available)` };
    }

    // Deduct from local wallet immediately
    setWalletBalance((prev) => prev - totalCost);

    // Record trade in Nessie (async, don't block UI)
    if (nessieId) {
      recordPurchase(nessieId.accountId, ticker, qty, price)
        .then((purchase) => {
          setTxHistory((prev) => [{
            id: purchase._id, type: "buy",
            desc: purchase.description, amount: purchase.amount, date: purchase.purchase_date,
          }, ...prev]);
        })
        .catch((e) => console.warn("Nessie purchase failed:", e));
    } else {
      // No Nessie — add to local tx history
      const today = new Date().toISOString().split("T")[0];
      setTxHistory((prev) => [{
        id: `buy-${Date.now()}`, type: "buy",
        desc: `BUY ${qty}x ${ticker} @ $${price.toFixed(2)}`,
        amount: totalCost, date: today,
      }, ...prev]);
    }

    // Update holdings
    const stock = stocks.find((s) => s.ticker === ticker);
    setHoldings((prev) => {
      const existing = prev.find((h) => h.ticker === ticker);
      if (existing) {
        const newQty = existing.qty + qty;
        return prev.map((h) =>
          h.ticker === ticker
            ? { ...h, qty: newQty, invested: h.invested + totalCost,
                current: newQty * (stock?.currentPrice ?? price) }
            : h
        );
      }
      return [...prev, {
        ticker,
        name: stock?.name ?? ticker,
        qty,
        mktPrice: price,
        invested: totalCost,
        current: qty * (stock?.currentPrice ?? price),
      }];
    });

    return { ok: true, msg: `Bought ${qty}× ${ticker} @ $${price.toFixed(2)}` };
  }, [walletBalance, nessieId]);

  /* SELL */
  const sellStock = useCallback(async (
    ticker: string, qty: number, price: number
  ): Promise<{ ok: boolean; msg: string }> => {
    const holding = holdings.find((h) => h.ticker === ticker);
    if (!holding || holding.qty < qty) {
      return { ok: false, msg: `Not enough shares (have ${holding?.qty ?? 0})` };
    }

    const proceeds = qty * price;

    // Add proceeds to wallet immediately
    setWalletBalance((prev) => prev + proceeds);

    // Record in Nessie (async)
    if (nessieId) {
      recordDeposit(nessieId.accountId, ticker, qty, price)
        .then((deposit) => {
          setTxHistory((prev) => [{
            id: deposit._id, type: "sell",
            desc: deposit.description, amount: deposit.amount, date: deposit.transaction_date,
          }, ...prev]);
        })
        .catch((e) => console.warn("Nessie deposit failed:", e));
    } else {
      const today = new Date().toISOString().split("T")[0];
      setTxHistory((prev) => [{
        id: `sell-${Date.now()}`, type: "sell",
        desc: `SELL ${qty}x ${ticker} @ $${price.toFixed(2)}`,
        amount: proceeds, date: today,
      }, ...prev]);
    }

    // Update holdings
    const stock = stocks.find((s) => s.ticker === ticker);
    setHoldings((prev) =>
      prev.map((h) =>
        h.ticker === ticker
          ? {
              ...h,
              qty: h.qty - qty,
              invested: h.qty > qty ? h.invested - (h.invested / h.qty) * qty : 0,
              current: (h.qty - qty) * (stock?.currentPrice ?? price),
            }
          : h
      ).filter((h) => h.qty > 0)
    );

    return { ok: true, msg: `Sold ${qty}× ${ticker} @ $${price.toFixed(2)}` };
  }, [holdings, nessieId]);

  /* Derived stats */
  const totalCurrent  = holdings.reduce((a, h) => a + h.current, 0);
  const totalInvested = holdings.reduce((a, h) => a + h.invested, 0);
  const totalReturns  = totalCurrent - totalInvested;
  const dayReturns    = holdings.reduce((a, h) => {
    const s = stocks.find((x) => x.ticker === h.ticker);
    return a + (s ? h.qty * s.change : 0);
  }, 0);
  const tradeCount = txHistory.filter((t) => t.type === "buy" || t.type === "sell").length;

  return (
    <PortfolioContext.Provider value={{
      nessieId, nessieAcct, nessieLoading,
      walletBalance, addFunds,
      holdings, txHistory,
      totalCurrent, totalInvested, totalReturns, dayReturns, tradeCount,
      buyStock, sellStock, refreshBalance,
    }}>
      {children}
    </PortfolioContext.Provider>
  );
}
