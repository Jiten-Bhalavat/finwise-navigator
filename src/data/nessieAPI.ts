/**
 * Capital One Nessie Mock Banking API
 * Base: http://api.nessieisreal.com
 * Docs: http://api.nessieisreal.com/documentation
 *
 * Used for: wallet balance, buy/sell transactions, deposit history
 */

const BASE   = "http://api.nessieisreal.com";
const KEY    = import.meta.env.VITE_NESSIE_API_KEY as string;
const STORE  = "finwise_nessie"; // localStorage key

/* ─── Persist customer + account IDs across reloads ─────────── */
function loadStore(): { customerId: string; accountId: string } | null {
  try {
    const raw = localStorage.getItem(STORE);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

function saveStore(customerId: string, accountId: string) {
  localStorage.setItem(STORE, JSON.stringify({ customerId, accountId }));
}

/* ─── Low-level fetch ─────────────────────────────────────────── */
async function nessie<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const url = `${BASE}${path}?key=${KEY}`;
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) throw new Error(`Nessie ${method} ${path} → ${res.status}`);
  // 204 No Content
  if (res.status === 204) return {} as T;
  return res.json();
}

/* ─── Nessie data shapes ─────────────────────────────────────── */
export interface NessieAccount {
  _id: string;
  type: string;
  nickname: string;
  balance: number;
  rewards: number;
  account_number: string;
  customer_id: string;
}

export interface NessiePurchase {
  _id: string;
  type: string;
  merchant_id: string;
  payer_id: string;
  medium: string;
  purchase_date: string;
  amount: number;
  description: string;
  status: string;
}

export interface NessieDeposit {
  _id: string;
  type: string;
  account_id: string;
  medium: string;
  transaction_date: string;
  amount: number;
  description: string;
  status: string;
}

/* ─── Bootstrap: create or reuse customer + account ─────────── */
export async function bootstrapNessie(): Promise<{ customerId: string; accountId: string }> {
  const stored = loadStore();
  if (stored) {
    // Verify account still exists
    try {
      await nessie<NessieAccount>("GET", `/accounts/${stored.accountId}`);
      return stored;
    } catch {
      // Account gone – create fresh
      localStorage.removeItem(STORE);
    }
  }

  // 1. Create customer
  const today = new Date().toISOString().split("T")[0];
  const custRes = await nessie<{ objectCreated: { _id: string } }>("POST", "/customers", {
    first_name: "Jiten",
    last_name: "Bhalavat",
    address: {
      street_number: "1000",
      street_name: "Terrapin Trail",
      city: "College Park",
      state: "MD",
      zip: "20742",
    },
  });
  const customerId: string = custRes.objectCreated._id;

  // 2. Create checking account with $10,000 starting balance
  const acctRes = await nessie<{ objectCreated: NessieAccount }>(
    "POST",
    `/customers/${customerId}/accounts`,
    {
      type: "Checking",
      nickname: "FinWise Portfolio",
      rewards: 0,
      balance: 10000,
    }
  );
  const accountId: string = acctRes.objectCreated._id;

  saveStore(customerId, accountId);
  return { customerId, accountId };
}

/* ─── Get account (balance) ──────────────────────────────────── */
export async function getAccount(accountId: string): Promise<NessieAccount> {
  return nessie<NessieAccount>("GET", `/accounts/${accountId}`);
}

/* ─── Record a stock purchase (BUY) ─────────────────────────── */
export async function recordPurchase(
  accountId: string,
  ticker: string,
  quantity: number,
  price: number
): Promise<NessiePurchase> {
  const today = new Date().toISOString().split("T")[0];
  // Use a generic Nessie merchant ID (Capital One HQ)
  const res = await nessie<{ objectCreated: NessiePurchase }>(
    "POST",
    `/accounts/${accountId}/purchases`,
    {
      merchant_id: "57cf75cea73e494d8675ec49", // Capital One merchant seed
      medium: "balance",
      purchase_date: today,
      amount: Math.round(quantity * price * 100) / 100,
      description: `BUY ${quantity}x ${ticker} @ $${price.toFixed(2)}`,
      status: "pending",
    }
  );
  return res.objectCreated;
}

/* ─── Record a stock sale (SELL → deposit) ───────────────────── */
export async function recordDeposit(
  accountId: string,
  ticker: string,
  quantity: number,
  price: number
): Promise<NessieDeposit> {
  const today = new Date().toISOString().split("T")[0];
  const res = await nessie<{ objectCreated: NessieDeposit }>(
    "POST",
    `/accounts/${accountId}/deposits`,
    {
      medium: "balance",
      transaction_date: today,
      amount: Math.round(quantity * price * 100) / 100,
      description: `SELL ${quantity}x ${ticker} @ $${price.toFixed(2)}`,
      status: "pending",
    }
  );
  return res.objectCreated;
}

/* ─── Get purchase history ───────────────────────────────────── */
export async function getPurchases(accountId: string): Promise<NessiePurchase[]> {
  return nessie<NessiePurchase[]>("GET", `/accounts/${accountId}/purchases`);
}

/* ─── Get deposit history ────────────────────────────────────── */
export async function getDeposits(accountId: string): Promise<NessieDeposit[]> {
  return nessie<NessieDeposit[]>("GET", `/accounts/${accountId}/deposits`);
}
