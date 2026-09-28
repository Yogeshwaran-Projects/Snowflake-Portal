// The playground database: one coherent fictional Indian bank ("Sahyadri
// Bank") — 8 branches, 40 customers, 60 accounts, 250 transactions over
// Jul–Sep 2026, loans, cards, Cortex-style feedback scores and two Snowflake
// cost tables. Rows come from a SEEDED PRNG, so the data is identical on every
// load and the exercise answers in exercises.ts stay valid. Changing a seed,
// a range or a weight below silently invalidates exercises — re-run the
// DuckDB validation script after ANY edit here.
//
// Column types are only NUMBER / VARCHAR / DATE ('YYYY-MM-DD') because that is
// all the lesson worksheets and the engine's table loader understand.
import type { Cell, Tables } from '../types';
import { BRANCHES, CUSTOMER_NAMES, FEEDBACK, MERCHANT_CATEGORIES, QUERY_USERS, WAREHOUSES } from './bank-seed';

/** The playground's "today" — exercises use it instead of CURRENT_DATE so results never drift. */
export const AS_OF = '2026-09-30';

// ─────────── seeded PRNG (mulberry32) ───────────
function makeRng(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const rnd = makeRng(20260701);
const int = (lo: number, hi: number) => lo + Math.floor(rnd() * (hi - lo + 1));
const pick = <T,>(xs: readonly T[]): T => {
  const x = xs[Math.floor(rnd() * xs.length)];
  if (x === undefined) throw new Error('pick: empty list');
  return x;
};
const weighted = <T,>(pairs: [T, number][]): T => {
  const total = pairs.reduce((s, [, w]) => s + w, 0);
  let r = rnd() * total;
  for (const [v, w] of pairs) { r -= w; if (r < 0) return v; }
  return pairs[pairs.length - 1]![0];
};
const DAY = 86_400_000;
const toDate = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const utc = (y: number, m: number, d: number) => Date.UTC(y, m - 1, d);
const dateBetween = (from: number, to: number) => toDate(from + int(0, Math.floor((to - from) / DAY)) * DAY);
const addDays = (iso: string, days: number) => toDate(Date.parse(iso) + days * DAY);
const round2 = (n: number) => Math.round(n * 100) / 100;

// ─────────── branches ───────────
const branches = BRANCHES.map(b => [b.id, b.name, b.city, b.state, b.ifsc, b.openedOn, b.manager] as Cell[]);
const branchById = new Map(BRANCHES.map(b => [b.id, b]));

// ─────────── customers ───────────
interface Cust { id: number; segment: string; joined: string; branch: number }
const custs: Cust[] = CUSTOMER_NAMES.map((_, i) => {
  const branch = pick(BRANCHES);
  return {
    id: 1001 + i,
    segment: weighted([['RETAIL', 60], ['PRIORITY', 25], ['BUSINESS', 15]]),
    joined: dateBetween(utc(2017, 1, 1), utc(2026, 6, 30)),
    branch: branch.id,
  };
});
const customers = custs.map((c, i) => [c.id, CUSTOMER_NAMES[i] ?? '', branchById.get(c.branch)?.city ?? '', c.segment, c.joined, c.branch] as Cell[]);

// ─────────── accounts ───────────
// Customers 1039 and 1040 have NO accounts (anti-join exercises). Everyone
// else gets one, then 22 extra accounts are spread at random.
interface Acct { id: number; cust: number; type: string; balance: number; opened: string; status: string }
const accts: Acct[] = [];
const owners = [...custs.slice(0, 38), ...Array.from({ length: 22 }, () => custs[int(0, 37)]!)];
owners.forEach((c, i) => {
  const type = c.segment === 'BUSINESS'
    ? weighted([['CURRENT', 70], ['SAVINGS', 20], ['FIXED_DEPOSIT', 10]])
    : weighted([['SAVINGS', 65], ['FIXED_DEPOSIT', 30], ['CURRENT', 5]]);
  const status = weighted([['ACTIVE', 80], ['DORMANT', 12], ['CLOSED', 8]]);
  const balance = status === 'CLOSED' ? 0
    : type === 'SAVINGS' ? int(2_000, 500_000)
    : type === 'CURRENT' ? int(50_000, 5_000_000)
    : int(100_000, 2_000_000);
  accts.push({ id: 5001 + i, cust: c.id, type, balance, opened: dateBetween(Date.parse(c.joined), utc(2026, 6, 30)), status });
});
const accounts = accts.map(a => [a.id, a.cust, a.type, a.balance, a.opened, a.status] as Cell[]);

// ─────────── transactions ───────────
// Only ACTIVE savings/current accounts transact. Weighting makes a few
// accounts very busy (HAVING exercises) and two ACTIVE accounts go quiet
// after July (the "no transactions in 60 days" exercise must find them).
const pool = accts.filter(a => a.status === 'ACTIVE' && a.type !== 'FIXED_DEPOSIT');
const quiet = new Set(pool.slice(0, 2).map(a => a.id));
const poolWeights: [Acct, number][] = pool.map((a, i) => [a, quiet.has(a.id) ? 1 : (i % 5 === 0 ? 6 : 2)]);
const AMOUNT: Record<string, [number, number]> = {
  DEPOSIT: [1_000, 200_000], WITHDRAWAL: [500, 50_000], TRANSFER: [1_000, 150_000], UPI: [50, 5_000], CARD: [200, 25_000],
};
const CHANNEL: Record<string, readonly string[]> = {
  DEPOSIT: ['BRANCH', 'NETBANKING', 'MOBILE'], WITHDRAWAL: ['ATM', 'BRANCH'], TRANSFER: ['NETBANKING', 'MOBILE'], UPI: ['UPI'], CARD: ['POS', 'ONLINE'],
};
const txns = Array.from({ length: 250 }, () => {
  const a = weighted(poolWeights);
  const type = weighted([['DEPOSIT', 25], ['WITHDRAWAL', 15], ['TRANSFER', 15], ['UPI', 30], ['CARD', 15]]);
  const [lo, hi] = AMOUNT[type] ?? [100, 1_000];
  const spend = type === 'UPI' || type === 'CARD';
  return {
    acct: a.id,
    date: dateBetween(utc(2026, 7, 1), quiet.has(a.id) ? utc(2026, 7, 31) : utc(2026, 9, 30)),
    type,
    amount: int(lo, hi),
    channel: pick(CHANNEL[type] ?? ['BRANCH']),
    // ~6% of spends stay unclassified — the NULL that IS NULL exercises hunt for.
    category: spend && rnd() > 0.06 ? pick(MERCHANT_CATEGORIES) : null,
  };
}).sort((x, y) => x.date.localeCompare(y.date));
const transactions = txns.map((t, i) => [900_001 + i, t.acct, t.date, t.type, t.amount, t.channel, t.category] as Cell[]);

// ─────────── loans ───────────
const PRINCIPAL: Record<string, [number, number, number]> = { // [min, max, rate]
  HOME: [2_000_000, 8_000_000, 8.5], CAR: [300_000, 1_200_000, 9.25], PERSONAL: [50_000, 500_000, 13.5], EDUCATION: [200_000, 1_500_000, 10], GOLD: [25_000, 300_000, 9],
};
const loans = Array.from({ length: 30 }, (_, i) => {
  const c = custs[int(0, 37)]!;
  const type = weighted([['HOME', 25], ['CAR', 20], ['PERSONAL', 30], ['EDUCATION', 10], ['GOLD', 15]]);
  const [lo, hi, rate] = PRINCIPAL[type] ?? [50_000, 500_000, 12];
  const principal = int(lo / 10_000, hi / 10_000) * 10_000;
  const tenure = type === 'HOME' ? pick([120, 180, 240]) : type === 'CAR' ? pick([36, 60, 84]) : pick([12, 24, 36, 48]);
  const r = rate / 1200;
  const emi = Math.round((principal * r * (1 + r) ** tenure) / ((1 + r) ** tenure - 1));
  const status = weighted([['ACTIVE', 70], ['CLOSED', 20], ['NPA', 10]]);
  const outstanding = status === 'CLOSED' ? 0 : Math.round(principal * (status === 'NPA' ? int(50, 100) : int(20, 90)) / 100);
  return [7001 + i, c.id, type, principal, rate, tenure, emi, dateBetween(Date.parse(c.joined), utc(2026, 8, 31)), status, outstanding] as Cell[];
});

// ─────────── cards ───────────
const cards = Array.from({ length: 35 }, (_, i) => {
  const c = custs[int(0, 37)]!;
  const type = weighted([['DEBIT', 60], ['CREDIT', 40]]);
  // A few cards were issued long ago so some are EXPIRED and some expire within a year of AS_OF.
  const issued = i % 7 === 0 ? dateBetween(utc(2019, 1, 1), utc(2021, 6, 30)) : dateBetween(utc(2021, 10, 1), utc(2026, 6, 30));
  const expiry = addDays(issued, 5 * 365);
  const status = expiry < AS_OF ? 'EXPIRED' : weighted([['ACTIVE', 88], ['BLOCKED', 12]]);
  const limit = type === 'CREDIT' ? int(5, 50) * 10_000 : null;
  return [8001 + i, c.id, type, pick(['VISA', 'MASTERCARD', 'RUPAY']), limit, issued, expiry, status] as Cell[];
});

// ─────────── feedback ───────────
const feedback = FEEDBACK.map((f, i) => [
  6001 + i, custs[int(0, 39)]!.id, dateBetween(utc(2026, 7, 1), utc(2026, 9, 30)), pick(['APP', 'EMAIL', 'BRANCH', 'CALL']), f.text, f.rating, f.sentiment, f.category,
] as Cell[]);

// ─────────── warehouse_usage ───────────
// 5 warehouses × 6 run dates. ADHOC_WH spikes on 16 Sep: someone left an
// XSMALL warehouse running a runaway query — the cost exercise should find it.
const usageDates = [1, 6, 11, 16, 21, 26].map(d => toDate(utc(2026, 9, d)));
const warehouseUsage = usageDates.flatMap((d, di) => WAREHOUSES.map((w, wi) => {
  const spike = w.name === 'ADHOC_WH' && d === '2026-09-16';
  const credits = spike ? 38.4 : round2(w.minCredits + rnd() * (w.maxCredits - w.minCredits));
  return [3001 + di * WAREHOUSES.length + wi, w.name, w.team, w.size, credits, d] as Cell[];
}));

// ─────────── query_history ───────────
// Cache hits scan nothing and finish in well under a second — that contrast
// is the point of the cache-hit-ratio exercise.
const queryHistory = Array.from({ length: 40 }, (_, i) => {
  const w = pick(WAREHOUSES);
  const hit = rnd() < 0.35 ? 1 : 0;
  const seconds = hit ? round2(0.1 + rnd() * 0.6) : round2(w.name === 'ADHOC_WH' ? 60 + rnd() * 540 : 1 + rnd() * 90);
  const mb = hit ? 0 : int(5, w.name === 'ADHOC_WH' ? 60_000 : 12_000);
  return [4001 + i, pick(QUERY_USERS), w.name, seconds, mb, hit, dateBetween(utc(2026, 9, 1), utc(2026, 9, 30))] as Cell[];
});

export const BANK: Tables = {
  branches: { columns: [['branch_id', 'NUMBER'], ['branch_name', 'VARCHAR'], ['city', 'VARCHAR'], ['state_name', 'VARCHAR'], ['ifsc_code', 'VARCHAR'], ['opened_on', 'DATE'], ['manager_name', 'VARCHAR']], rows: branches },
  customers: { columns: [['cust_id', 'NUMBER'], ['cust_name', 'VARCHAR'], ['city', 'VARCHAR'], ['segment', 'VARCHAR', 'RETAIL / PRIORITY / BUSINESS'], ['joined_on', 'DATE'], ['branch_id', 'NUMBER']], rows: customers },
  accounts: { columns: [['acct_id', 'NUMBER'], ['cust_id', 'NUMBER'], ['acct_type', 'VARCHAR', 'SAVINGS / CURRENT / FIXED_DEPOSIT'], ['balance', 'NUMBER'], ['opened_on', 'DATE'], ['status', 'VARCHAR', 'ACTIVE / DORMANT / CLOSED']], rows: accounts },
  transactions: { columns: [['txn_id', 'NUMBER'], ['acct_id', 'NUMBER'], ['txn_date', 'DATE'], ['txn_type', 'VARCHAR', 'DEPOSIT / WITHDRAWAL / TRANSFER / UPI / CARD'], ['amount', 'NUMBER'], ['channel', 'VARCHAR'], ['merchant_category', 'VARCHAR', 'NULL unless UPI/CARD']], rows: transactions },
  loans: { columns: [['loan_id', 'NUMBER'], ['cust_id', 'NUMBER'], ['loan_type', 'VARCHAR'], ['principal', 'NUMBER'], ['interest_rate', 'NUMBER'], ['tenure_months', 'NUMBER'], ['emi_amount', 'NUMBER'], ['sanctioned_on', 'DATE'], ['loan_status', 'VARCHAR', 'ACTIVE / CLOSED / NPA'], ['outstanding', 'NUMBER']], rows: loans },
  cards: { columns: [['card_id', 'NUMBER'], ['cust_id', 'NUMBER'], ['card_type', 'VARCHAR', 'DEBIT / CREDIT'], ['card_network', 'VARCHAR'], ['credit_limit', 'NUMBER', 'NULL for debit cards'], ['issued_on', 'DATE'], ['expiry_on', 'DATE'], ['card_status', 'VARCHAR', 'ACTIVE / BLOCKED / EXPIRED']], rows: cards },
  feedback: { columns: [['feedback_id', 'NUMBER'], ['cust_id', 'NUMBER'], ['feedback_date', 'DATE'], ['channel', 'VARCHAR'], ['feedback_text', 'VARCHAR'], ['rating', 'NUMBER', '1–5 stars'], ['ai_sentiment', 'NUMBER', '-1..1, NULL = not scored yet'], ['ai_category', 'VARCHAR', 'APP / BRANCH / LOAN / FEES / SERVICE']], rows: feedback },
  warehouse_usage: { columns: [['usage_id', 'NUMBER'], ['wh_name', 'VARCHAR'], ['team', 'VARCHAR'], ['wh_size', 'VARCHAR'], ['credits_used', 'NUMBER'], ['run_date', 'DATE']], rows: warehouseUsage },
  query_history: { columns: [['query_id', 'NUMBER'], ['user_name', 'VARCHAR'], ['wh_name', 'VARCHAR'], ['run_seconds', 'NUMBER'], ['bytes_scanned_mb', 'NUMBER'], ['cache_hit', 'NUMBER', '1 = served from result cache'], ['run_date', 'DATE']], rows: queryHistory },
};

/** Total rows across all tables — the header stat. */
export const BANK_ROW_COUNT = Object.values(BANK).reduce((n, t) => n + t.rows.length, 0);
