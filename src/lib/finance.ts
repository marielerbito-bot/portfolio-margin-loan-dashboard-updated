import raw from "@/data/book.json";

export type FxSource = "xe" | "citi";
export type RateMode = "spot" | "monthend";

export const MONTH_ENDS = [
  "2025-06-30",
  "2025-07-31",
  "2025-08-31",
  "2025-09-30",
  "2025-10-31",
  "2025-11-30",
  "2025-12-31",
  "2026-01-31",
  "2026-02-28",
  "2026-03-31",
  "2026-04-30",
  "2026-05-31",
  "2026-06-30",
  "2026-07-31",
  "2026-08-31",
  "2026-09-30",
  "2026-10-31",
] as const;

export const REPORT_MIN = "2025-06-03";
export const REPORT_MAX = "2026-11-10";
export const CHART_MIN = "2026-04-01";
export const CHART_MAX = "2026-11-10";

type Pair = [string, number];

type LoanRow = {
  draw: string;
  date: string;
  rate: number | null;
  principal: number | null;
  repayment: number | null;
  accrued: number;
  rollover: number | null;
  owed: number | null;
  citi: number | null;
  accruedUsdBook: number | null;
};

type IncomeEvent = {
  date: string;
  ccy: string;
  nominal: number;
  bookedUsd: number | null;
  position: string;
  kind: string;
  label: string;
};

const book = raw as unknown as {
  asOf: string;
  priceStart: string;
  xeStart: string;
  xe: Record<string, Pair[]>;
  citi: Record<string, Pair[]>;
  prices: Record<string, Pair[]>;
  underlyings: Record<string, Pair[]>;
  events: IncomeEvent[];
  loanRows: LoanRow[];
  coupons: {
    note: string;
    period: number;
    observation: string | null;
    couponDate: string | null;
    amount: number | null;
    status: string | null;
  }[];
};

export type PositionDef = {
  id: string;
  name: string;
  short: string;
  ccy: string;
  product: string;
  acquired: string;
  cost: number;
  costUsd: number;
  entryFx: number;
  units: number | null;
  priceKey: string | null;
  carryAtCost?: boolean;
  /** Single issuer mark, local currency (USD for the notes). */
  mark?: number;
  markDate?: string;
  couponPa?: number;
};

export const POSITIONS: PositionDef[] = [
  {
    id: "tpc",
    name: "TPC Consolidated Ltd",
    short: "TPC",
    ccy: "AUD",
    product: "Equity",
    acquired: "2024-10-21",
    cost: 654307,
    costUsd: 530642.98,
    entryFx: 0.8110000045850037,
    units: 544500,
    priceKey: "tpc",
  },
  {
    id: "concord",
    name: "Concord Blue GmbH",
    short: "Concord Blue",
    ccy: "EUR",
    product: "Equity",
    acquired: "2025-02-05",
    cost: 200000,
    costUsd: 208010,
    entryFx: 1.04005,
    units: null,
    priceKey: null,
    carryAtCost: true,
  },
  {
    id: "pimco-aud",
    name: "PIMCO GIS Income Fund (AUD hedged)",
    short: "PIMCO AUD",
    ccy: "AUD",
    product: "Fixed income",
    acquired: "2025-03-28",
    cost: 1186749.97,
    costUsd: 869601.61,
    entryFx: 0.732758906242062,
    units: 135554.547,
    priceKey: "pimco-aud",
  },
  {
    id: "pimco-sgd",
    name: "PIMCO GIS Income Fund (SGD hedged)",
    short: "PIMCO SGD",
    ccy: "SGD",
    product: "Fixed income",
    acquired: "2025-09-24",
    cost: 707000,
    costUsd: 547434.35,
    entryFx: 0.7743060113154172,
    units: 73069.61,
    priceKey: "pimco-sgd",
  },
  {
    id: "pimco-usd",
    name: "PIMCO GIS Balanced Income and Growth",
    short: "PIMCO USD",
    ccy: "USD",
    product: "Fixed income",
    acquired: "2026-03-25",
    cost: 1010000,
    costUsd: 1010000,
    entryFx: 1,
    units: 90661.831,
    priceKey: "pimco-usd",
  },
  {
    id: "fcn-nvda",
    name: "NVDA / AVGO fixed coupon note",
    short: "FCN 15%",
    ccy: "USD",
    product: "Fixed coupon note · matures 14 Dec 2026",
    acquired: "2026-05-29",
    cost: 500000,
    costUsd: 500000,
    entryFx: 1,
    units: null,
    priceKey: null,
    mark: 472280.5,
    markDate: "2026-11-10",
    couponPa: 0.15,
  },
  {
    id: "fcn-amzn",
    name: "AMZN / GOOG fixed coupon note",
    short: "FCN 12%",
    ccy: "USD",
    product: "Fixed coupon note · matures 5 Feb 2027",
    acquired: "2026-09-23",
    cost: 300000,
    costUsd: 300000,
    entryFx: 1,
    units: null,
    priceKey: null,
    mark: 290620.8,
    markDate: "2026-11-10",
    couponPa: 0.12,
  },
];

export type DrawDef = {
  id: string;
  name: string;
  ref: string;
  ccy: string;
  start: string;
  original: number;
  entryFx: number;
  type: "Fixed" | "Floating";
  pay: "Cash" | "PIK";
  matured: boolean;
  maturity: string | null;
};

export const DRAWS: DrawDef[] = [
  { id: "D1", name: "Draw 1", ref: "D1-9369", ccy: "HKD", start: "2025-06-03", original: 4040000, entryFx: 0.127510358910891, type: "Fixed", pay: "Cash", matured: true, maturity: "2026-06-10" },
  { id: "D2", name: "Draw 2", ref: "D2-9586", ccy: "HKD", start: "2025-06-10", original: 2000000, entryFx: 0.127434805, type: "Fixed", pay: "Cash", matured: true, maturity: "2025-12-10" },
  { id: "D3", name: "Draw 3", ref: "D3-3843", ccy: "SGD", start: "2025-09-26", original: 353500, entryFx: 0.7736943988684581, type: "Fixed", pay: "Cash", matured: true, maturity: "2026-09-28" },
  { id: "D4", name: "Draw 4", ref: "D4-4436", ccy: "SGD", start: "2025-10-10", original: 353500, entryFx: 0.7711884016973125, type: "Floating", pay: "PIK", matured: false, maturity: null },
  { id: "D5", name: "Draw 5", ref: "D5-6518", ccy: "HKD", start: "2025-12-10", original: 2019546.3, entryFx: 0.128514057835663, type: "Fixed", pay: "Cash", matured: true, maturity: "2025-12-22" },
  { id: "D6", name: "Draw 6", ref: "D6-6963", ccy: "HKD", start: "2025-12-22", original: 1907816.39, entryFx: 0.128552056311876, type: "Fixed", pay: "Cash", matured: true, maturity: "2026-01-22" },
  { id: "D7", name: "Draw 7", ref: "D7-8106", ccy: "HKD", start: "2026-01-22", original: 1901102.8, entryFx: 0.1282437698792511, type: "Floating", pay: "PIK", matured: false, maturity: null },
  { id: "D8", name: "Draw 8", ref: "D8-0650", ccy: "HKD", start: "2026-03-26", original: 2353261.2, entryFx: 0.1278829651379116, type: "Floating", pay: "PIK", matured: true, maturity: "2026-09-30" },
  { id: "D9", name: "Draw 9", ref: "D9-3331", ccy: "CHF", start: "2026-06-03", original: 411518.21, entryFx: 1.2668651528203332, type: "Fixed", pay: "Cash", matured: false, maturity: "2026-12-03" },
  { id: "D10", name: "Draw 10", ref: "D10-4166", ccy: "CHF", start: "2026-06-22", original: 166939, entryFx: 1.2370113634321518, type: "Fixed", pay: "Cash", matured: false, maturity: "2026-12-22" },
  { id: "D11", name: "Draw 11", ref: "D11-8141", ccy: "SGD", start: "2026-09-28", original: 355886.12, entryFx: 0.7825338341377293, type: "Floating", pay: "PIK", matured: false, maturity: null },
  { id: "D12", name: "Draw 12", ref: "D10-8533", ccy: "CHF", start: "2026-10-07", original: 241442.95, entryFx: 1.2014176847988314, type: "Fixed", pay: "Cash", matured: false, maturity: null },
];

export const COLLATERAL = [
  {
    id: "sgd-book",
    name: "PIMCO SGD",
    positionIds: ["pimco-sgd"],
    draws: ["Draw 4", "Draw 11"],
  },
  {
    id: "usd-fund",
    name: "PIMCO USD",
    positionIds: ["pimco-usd"],
    draws: ["Draw 7", "Draw 12"],
  },
  {
    id: "fcn-book",
    name: "USD fixed coupon notes",
    positionIds: ["fcn-nvda", "fcn-amzn"],
    draws: ["Draw 9", "Draw 10"],
  },
];

export const EXITED = [
  { name: "PIMCO GIS Income (HKD dist.)", acquired: "2025-06-04", disposed: "2025-10-28", ccy: "HKD", product: "Fixed income", cost: 4040000, carry: 159820.61 },
  { name: "BYD / Xiaomi FCN", acquired: "2025-06-06", disposed: "2025-12-22", ccy: "HKD", product: "Fixed coupon note", cost: 2000000, carry: 82900 },
  { name: "NVIDIA / TSMC", acquired: "2025-10-23", disposed: "2025-12-29", ccy: "USD", product: "Fixed coupon note", cost: 260000, carry: 5633.34 },
  { name: "Meta / Alphabet", acquired: "2025-10-28", disposed: "2026-03-02", ccy: "USD", product: "Fixed coupon note", cost: 260000, carry: 9533.32 },
  { name: "BYD Company Ltd", acquired: "2025-12-22", disposed: "2026-02-02", ccy: "HKD", product: "Equity", cost: 2001912.73, carry: 5504.98 },
  { name: "NVDA / AVGO", acquired: "2026-01-21", disposed: "2026-04-21", ccy: "USD", product: "Fixed coupon note", cost: 270000, carry: 8775 },
  { name: "BYD / Xiaomi FCN", acquired: "2026-02-03", disposed: "2026-03-20", ccy: "HKD", product: "Fixed coupon note", cost: 2000000, carry: 20000 },
  { name: "NVDA / AVGO", acquired: "2026-02-27", disposed: "2026-04-13", ccy: "USD", product: "Fixed coupon note", cost: 260000, carry: 3250 },
  { name: "Citi time deposit", acquired: "2026-03-20", disposed: "2026-03-23", ccy: "AUD", product: "Time deposit", cost: 702401.32, carry: 201.13 },
  { name: "NVDA / AVGO", acquired: "2026-04-13", disposed: "2026-05-28", ccy: "USD", product: "Fixed coupon note", cost: 260000, carry: 3250 },
  { name: "NVIDIA / TSMC", acquired: "2026-04-21", disposed: "2026-06-05", ccy: "USD", product: "Fixed coupon note", cost: 270000, carry: 2925 },
  { name: "NVIDIA / TSMC", acquired: "2026-06-22", disposed: "2026-09-22", ccy: "USD", product: "Fixed coupon note", cost: 270000, carry: 10125 },
];

export const REALIZED = [
  { draw: "Draw 1", ccy: "HKD", status: "Matured", paid: 4205639.99, usdEntry: 536262.66, usdPaid: 536785.32, gain: -522.66 },
  { draw: "Draw 2", ccy: "HKD", status: "Matured", paid: 2039307.39, usdEntry: 259878.74, usdPaid: 262073.59, gain: -2194.85 },
  { draw: "Draw 3", ccy: "SGD", status: "Matured", paid: 362816.0, usdEntry: 280708.71, usdPaid: 284006.43, gain: -3297.72 },
  { draw: "Draw 5", ccy: "HKD", status: "Matured", paid: 2022203.4, usdEntry: 259881.56, usdPaid: 259958.41, gain: -76.85 },
  { draw: "Draw 6", ccy: "HKD", status: "Matured", paid: 1914912.02, usdEntry: 246165.88, usdPaid: 245557.99, gain: 607.88 },
  { draw: "Draw 8", ccy: "HKD", status: "Matured", paid: 2399191.73, usdEntry: 306815.75, usdPaid: 305906.21, gain: 909.54 },
  { draw: "Draw 7", ccy: "HKD", status: "Partial, still active", paid: 26279.25, usdEntry: 3370.15, usdPaid: 3350.58, gain: 19.57 },
  { draw: "Draw 9", ccy: "CHF", status: "Partial, still active", paid: 1574.86, usdEntry: 1995.13, usdPaid: 1945.95, gain: 49.18 },
  { draw: "Draw 10", ccy: "CHF", status: "Partial, still active", paid: 634.09, usdEntry: 784.37, usdPaid: 771.21, gain: 13.16 },
];

export const UNDERLYINGS = [
  { id: "NVDA", name: "NVIDIA", note: "FCN 15%", purchase: 214.25, target: 300, strikePct: 0.7532, strike: 161.3731 },
  { id: "AVGO", name: "Broadcom", note: "FCN 15%", purchase: 426.58, target: 500, strikePct: 0.7532, strike: 321.300056 },
  { id: "AMZN", name: "Amazon", note: "FCN 12%", purchase: 249.6426, target: 350, strikePct: 0.8155, strike: 203.5835403 },
  { id: "GOOG", name: "Alphabet", note: "FCN 12%", purchase: 339.626, target: 447, strikePct: 0.8155, strike: 276.965003 },
];

export const SHAREHOLDER = {
  full: { income: 423546.59, interest: 61094.01, net: 362452.58, capital: 1498354.72, roi: 0.2419, ann: 0.1319 },
  ytd: { income: 287905.37, interest: 39570.17, net: 248335.2, capital: 1795777.56, roi: 0.1383, ann: 0.1659 },
  exTpc: { income: 239886.87, interest: 61094.01, net: 178792.86, capital: 865968.36, roi: 0.2065, ann: 0.1126 },
  // 2026 TPC dividends booked at 115,167.12. Concord Blue paid no income.
  // Excluded capital (TWA) is the cumulative block, and both names were held through 2026.
  ytdEx: { income: 172738.25, interest: 39570.17, net: 133168.08, capital: 1163391.2, roi: 133168.08 / 1163391.2, ann: (133168.08 / 1163391.2) * 1.2 },
};

export type RateHit = {
  rate: number;
  asOf: string;
  source: "xe" | "citi" | "par";
  fallback: boolean;
};

export type Options = {
  reportingDate: string;
  chartFrom: string;
  chartTo: string;
  source: FxSource;
  mode: RateMode;
  monthEnd: string;
};

function cmp(a: string, b: string) {
  return a < b ? -1 : a > b ? 1 : 0;
}

function clamp(d: string, min: string, max: string) {
  if (cmp(d, min) < 0) return min;
  if (cmp(d, max) > 0) return max;
  return d;
}

function lastPair(series: Pair[] | undefined, date: string): { date: string; value: number } | null {
  if (!series || series.length === 0) return null;
  let lo = 0;
  let hi = series.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (series[mid][0] <= date) {
      ans = mid;
      lo = mid + 1;
    } else hi = mid - 1;
  }
  if (ans < 0) return null;
  return { date: series[ans][0], value: series[ans][1] };
}

function prevPair(series: Pair[] | undefined, date: string) {
  const hit = lastPair(series, date);
  if (!hit || !series) return null;
  const i = series.findIndex((p) => p[0] === hit.date);
  if (i <= 0) return null;
  return { date: series[i - 1][0], value: series[i - 1][1] };
}

export function resolveRate(ccy: string, date: string, source: FxSource): RateHit | null {
  if (ccy === "USD") return { rate: 1, asOf: date, source: "par", fallback: false };
  if (source === "citi") {
    const hit = lastPair(book.citi[ccy], date);
    if (hit) return { rate: hit.value, asOf: hit.date, source: "citi", fallback: false };
    const xe = lastPair(book.xe[ccy], date);
    if (xe) return { rate: xe.value, asOf: xe.date, source: "xe", fallback: true };
    return null;
  }
  const xe = lastPair(book.xe[ccy], date);
  if (!xe) return null;
  return { rate: xe.value, asOf: xe.date, source: "xe", fallback: false };
}

function addMonths(iso: string, months: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1 + months, d));
  return dt.toISOString().slice(0, 10);
}

function mondayOf(iso: string) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  const day = dt.getUTCDay() || 7;
  dt.setUTCDate(dt.getUTCDate() - (day - 1));
  return dt.toISOString().slice(0, 10);
}

function monthStart(iso: string) {
  return iso.slice(0, 8) + "01";
}

function stdev(xs: number[]) {
  if (xs.length < 2) return null;
  const mean = xs.reduce((a, b) => a + b, 0) / xs.length;
  const v = xs.reduce((a, b) => a + (b - mean) ** 2, 0) / (xs.length - 1);
  return Math.sqrt(v);
}

function daysBefore(iso: string, days: number) {
  const [y, m, d] = iso.split("-").map(Number);
  const dt = new Date(Date.UTC(y, m - 1, d));
  dt.setUTCDate(dt.getUTCDate() - days);
  return dt.toISOString().slice(0, 10);
}

export type PositionRow = {
  id: string;
  name: string;
  short: string;
  ccy: string;
  product: string;
  acquired: string;
  cost: number;
  units: number | null;
  price: number | null;
  priceAsOf: string | null;
  priceNote: string | null;
  local: number;
  fx: number | null;
  fxAsOf: string | null;
  fxSource: RateHit["source"] | null;
  fxFallback: boolean;
  usd: number | null;
  entryFx: number;
  costUsd: number;
  priceMove: number | null;
  fxMove: number | null;
  priceGl: number | null;
  fxGl: number | null;
  totalGl: number | null;
  carryNominal: number;
  carryRoi: number | null;
};

export type DrawRow = {
  name: string;
  ref: string;
  ccy: string;
  type: string;
  pay: string;
  start: string;
  maturity: string | null;
  open: boolean;
  original: number;
  principal: number;
  unpaid: number;
  rate: number | null;
  entryFx: number;
  fx: number | null;
  fxAsOf: string | null;
  fxFallback: boolean;
  principalUsd: number | null;
  unpaidUsd: number | null;
  owedUsd: number | null;
  entryUsd: number;
  fxGain: number | null;
  pikCost: number | null;
  allIn: number | null;
  interestNominal: number;
  interestUsd: number | null;
  interestBook: number;
  interestFallbackRows: number;
};

export type IncomeLine = {
  date: string;
  position: string;
  label: string;
  kind: string;
  ccy: string;
  nominal: number;
  signedNominal: number;
  bookedUsd: number | null;
  usd: number | null;
  rate: number | null;
  rateAsOf: string | null;
  rateSource: string;
  fallback: boolean;
};

export type MovePeriod = "day" | "week" | "month";

export type MoveRow = {
  id: string;
  name: string;
  pricePct: number | null;
  fxPct: number | null;
  usdPct: number | null;
  /** Price trend for the selected period. */
  direction: string;
  fxDirection: string;
};

export type MovePack = {
  rows: MoveRow[];
  underlyings: { id: string; name: string; pct: number | null; direction: string }[];
  series: { date: string; [k: string]: string | number | null }[];
  byAsset: Record<string, { date: string; pricePct: number | null; fxPct: number | null; usdPct: number | null }[]>;
  underlyingSeries: Record<string, { date: string; pricePct: number | null }[]>;
  fx: Record<"SGD" | "CHF" | "HKD" | "AUD" | "EUR", { date: string; xe: number | null; citi: number | null }[]>;
};

export type IncomeGrid = {
  months: string[];
  rows: {
    id: string;
    name: string;
    ccy: string;
    cells: Record<string, { nominal: number; usd: number; booked: number }>;
    nominal: number;
    usd: number;
    booked: number;
  }[];
  usdByMonth: Record<string, number>;
  usdTotal: number;
};

export type CarryMonth = {
  ym: string;
  tag: string;
  cost: number | null;
  shares: number | null;
  dist: number | null;
  incomeNominal: number;
  incomeUsd: number;
  interestNominal: number;
  interestUsd: number;
};

export type CarryIndicator = "" | "Strong" | "Adequate" | "Tight" | "Weak";

export type CarryRow = {
  id: string;
  investment: string;
  ccy: string;
  status: "Active" | "Exited";
  netNominal: number;
  grossUsd: number;
  feeUsd: number | null;
  netCarryUsd: number;
  interestUsd: number | null;
  netReturnUsd: number;
  ratio: number | null;
  indicator: CarryIndicator;
  guidance: string;
  incomeTitle: string;
  interestCcy: string | null;
  months: CarryMonth[];
};

export type LoanScheduleRow = {
  draw: string;
  ref: string;
  ccy: string;
  pay: "Cash" | "PIK";
  type: string;
  date: string;
  month: string;
  interestRate: number | null;
  principal: number | null;
  accrued: number;
  settled: number;
  repaid: number;
  owed: number | null;
  citi: number | null;
  accruedUsd: number | null;
  settledUsd: number | null;
  repaidUsd: number | null;
  accruedUsdSelected: number | null;
};

export type ChartPoint = {
  date: string;
  usd: number | null;
  local: number | null;
  price: number | null;
  fx: number | null;
  priceEffect: number | null;
  fxEffect: number | null;
};

export type Report = {
  reportingDate: string;
  chartFrom: string;
  chartTo: string;
  source: FxSource;
  mode: RateMode;
  monthEnd: string;
  fxDate: string;
  warnings: string[];
  rates: {
    ccy: string;
    hit: RateHit | null;
    xe: RateHit | null;
    citi: RateHit | null;
    daily: number | null;
    vol: number | null;
    low: number | null;
    high: number | null;
    prev: number | null;
    fromPeak: number | null;
  }[];
  positions: PositionRow[];
  totals: {
    costUsd: number;
    usd: number;
    priceGl: number;
    fxGl: number;
    totalGl: number;
  };
  exposure: { ccy: string; usd: number; pct: number }[];
  draws: DrawRow[];
  loanTotals: {
    owedUsd: number;
    fxGain: number;
    pikCost: number;
    allIn: number;
    interestUsd: number;
    interestBook: number;
    interestNominalByCcy: Record<string, number>;
  };
  ltv: {
    id: string;
    name: string;
    draws: string;
    loanUsd: number;
    fmvUsd: number;
    ltv: number | null;
    band: string;
    action: string;
  }[];
  income: IncomeLine[];
  incomeByPosition: {
    id: string;
    name: string;
    ccy: string;
    nominal: number;
    usd: number;
    booked: number;
    fallbacks: number;
  }[];
  coverage: {
    label: string;
    income: number;
    interest: number;
    ratio: number | null;
  }[];
  underlyings: {
    id: string;
    name: string;
    note: string;
    price: number | null;
    asOf: string | null;
    purchase: number;
    strike: number;
    cushion: number | null;
    fromPurchase: number | null;
    weekly: number | null;
    daily: number | null;
    direction: string;
  }[];
  charts: Record<string, ChartPoint[]>;
  portfolioChart: { date: string; total: number; [k: string]: number | string }[];
  trends: {
    id: string;
    name: string;
    dailyPx: number | null;
    weeklyPx: number | null;
    monthlyPx: number | null;
    inceptionPx: number | null;
    dailyFx: number | null;
    weeklyFx: number | null;
    monthlyFx: number | null;
    inceptionFx: number | null;
    direction: string;
  }[];
  sensitivity: {
    label: string;
    fmv: number;
    loans: number;
    net: number;
    gl: number;
  }[];
  windowMove: { id: string; name: string; startUsd: number; endUsd: number; price: number; fx: number }[];
  moves: Record<MovePeriod, MovePack>;
  incomeGrid: IncomeGrid;
  loanSchedule: LoanScheduleRow[];
  loanCiti: DrawRow[];
  carry: CarryRow[];
  fxChart: { date: string; AUD: number | null; SGD: number | null; CHF: number | null; HKD: number | null; EUR: number | null; citiSGD: number | null; citiCHF: number | null; citiHKD: number | null }[];
  analysis: string[];
  exited: typeof EXITED;
};

function valuationHit(ccy: string, opts: Options): RateHit | null {
  const date = opts.mode === "monthend" ? opts.monthEnd : opts.reportingDate;
  return resolveRate(ccy, date, opts.source);
}

function localValue(p: PositionDef, date: string): { local: number; price: number | null; asOf: string | null; note: string | null } {
  if (p.carryAtCost) {
    return { local: p.cost, price: null, asOf: null, note: "Carried at cost — no market price in the book." };
  }
  if (p.mark != null && p.markDate) {
    if (date >= p.markDate) {
      return { local: p.mark, price: p.mark, asOf: p.markDate, note: "Single issuer mark. Not a daily series." };
    }
    return { local: p.cost, price: null, asOf: null, note: `Issuer mark is dated ${p.markDate}. Shown at cost before that.` };
  }
  if (p.priceKey && p.units != null) {
    const hit = lastPair(book.prices[p.priceKey], date);
    if (!hit) {
      return { local: p.cost, price: null, asOf: null, note: "No price print yet — shown at cost." };
    }
    return { local: p.units * hit.value, price: hit.value, asOf: hit.date, note: null };
  }
  return { local: p.cost, price: null, asOf: null, note: null };
}

function contractualCarry(p: PositionDef, date: string) {
  if (p.id === "fcn-nvda" || p.id === "fcn-amzn") {
    const rows = book.coupons.filter(
      (c) => c.note === p.id && c.amount != null && c.couponDate && c.couponDate <= date && (c.status || "").toLowerCase().includes("paid"),
    );
    // The 15% note's paid coupons on the observation schedule are 6,250.
    // Cash-ledger coupons of exited notes are not included here.
    if (p.id === "fcn-nvda") {
      const paid = book.coupons.filter(
        (c) => c.note === "fcn-nvda" && c.amount != null && c.couponDate && c.couponDate <= date,
      );
      return paid.reduce((s, c) => s + (c.amount || 0), 0);
    }
    return rows.reduce((s, c) => s + (c.amount || 0), 0);
  }
  const events = book.events.filter((e) => e.position === p.id && e.date <= date);
  const gross = events.filter((e) => e.kind !== "fee").reduce((s, e) => s + e.nominal, 0);
  const fees = events.filter((e) => e.kind === "fee").reduce((s, e) => s + e.nominal, 0);
  return gross - fees;
}

function snapshotPositions(date: string, source: FxSource, mode: RateMode, monthEnd: string): PositionRow[] {
  const opts: Options = { reportingDate: date, chartFrom: date, chartTo: date, source, mode, monthEnd };
  return POSITIONS.filter((p) => p.acquired <= date).map((p) => {
    const lv = localValue(p, date);
    const fx = valuationHit(p.ccy, opts);
    const usd = fx ? lv.local * fx.rate : null;
    const priceMove = p.cost ? lv.local / p.cost - 1 : null;
    const fxMove = fx ? fx.rate / p.entryFx - 1 : null;
    const priceGl = priceMove == null ? null : p.costUsd * priceMove;
    const fxGl = fx ? lv.local * (fx.rate - p.entryFx) : null;
    const totalGl = priceGl != null && fxGl != null ? priceGl + fxGl : null;
    const carryNominal = contractualCarry(p, date);
    return {
      id: p.id,
      name: p.name,
      short: p.short,
      ccy: p.ccy,
      product: p.product,
      acquired: p.acquired,
      cost: p.cost,
      units: p.units,
      price: lv.price,
      priceAsOf: lv.asOf,
      priceNote: lv.note,
      local: lv.local,
      fx: fx?.rate ?? null,
      fxAsOf: fx?.asOf ?? null,
      fxSource: fx?.source ?? null,
      fxFallback: fx?.fallback ?? false,
      usd,
      entryFx: p.entryFx,
      costUsd: p.costUsd,
      priceMove,
      fxMove,
      priceGl,
      fxGl,
      totalGl,
      carryNominal,
      carryRoi: p.cost ? carryNominal / p.cost : null,
    };
  });
}

function loanState(draw: DrawDef, date: string) {
  const rows = book.loanRows
    .filter((r) => r.draw === draw.name && r.date <= date)
    .sort((a, b) => cmp(a.date, b.date));
  if (!rows.length) return null;
  const last = rows[rows.length - 1];
  const owed = last.owed ?? last.principal ?? 0;
  const closed = Math.abs(owed) < 0.5;
  const principal = closed ? 0 : last.principal ?? 0;
  const unpaid = closed ? 0 : Math.max(0, owed - principal);
  const interestNominal = rows.reduce((s, r) => s + (r.accrued || 0), 0);
  const interestBook = rows.reduce((s, r) => s + (r.accruedUsdBook || 0), 0);
  return { principal, unpaid, rate: last.rate, interestNominal, interestBook, rows, closed };
}

function drawCitiRate(drawName: string, date: string): RateHit | null {
  let best: { date: string; rate: number } | null = null;
  for (const row of book.loanRows) {
    if (row.draw !== drawName || row.citi == null || row.date > date) continue;
    if (!best || row.date >= best.date) best = { date: row.date, rate: row.citi };
  }
  if (!best) return null;
  return { rate: best.rate, asOf: best.date, source: "citi", fallback: false };
}

function translateInterest(draw: DrawDef, rows: LoanRow[], source: FxSource) {
  let usd = 0;
  let fallbacks = 0;
  let missing = false;
  for (const row of rows) {
    if (!row.accrued) continue;
    if (source === "citi" && row.citi != null) {
      usd += row.accrued * row.citi;
      continue;
    }
    const hit = resolveRate(draw.ccy, row.date, source);
    if (!hit) {
      if (row.accruedUsdBook != null) {
        usd += row.accruedUsdBook;
        fallbacks += 1;
      } else missing = true;
      continue;
    }
    if (hit.fallback) fallbacks += 1;
    usd += row.accrued * hit.rate;
  }
  return { usd, fallbacks, missing };
}

function snapshotLoans(date: string, source: FxSource, mode: RateMode, monthEnd: string): DrawRow[] {
  const opts: Options = { reportingDate: date, chartFrom: date, chartTo: date, source, mode, monthEnd };
  const out: DrawRow[] = [];
  for (const draw of DRAWS) {
    if (draw.start > date) continue;
    const st = loanState(draw, date);
    if (!st) continue;
    let fx = valuationHit(draw.ccy, opts);
    if (source === "citi") {
      const own = drawCitiRate(draw.name, opts.mode === "monthend" ? opts.monthEnd : date);
      if (own) fx = own;
    }
    const open = st.principal > 0.5;
    const principalUsd = fx && open ? st.principal * fx.rate : open ? null : 0;
    const unpaidUsd = fx && open ? st.unpaid * fx.rate : open ? null : 0;
    const owedUsd = principalUsd != null && unpaidUsd != null ? principalUsd + unpaidUsd : null;
    const entryUsd = draw.original * draw.entryFx;
    const fxGain = fx && open ? -draw.original * (fx.rate - draw.entryFx) : open ? null : 0;
    const pikCost = fx && open && draw.pay === "PIK" ? -(st.principal - draw.original) * fx.rate : open ? 0 : 0;
    const allIn = fxGain != null && pikCost != null ? fxGain + pikCost : null;
    const tr = translateInterest(draw, st.rows, source);
    out.push({
      name: draw.name,
      ref: draw.ref,
      ccy: draw.ccy,
      type: draw.type,
      pay: draw.pay,
      start: draw.start,
      maturity: draw.maturity,
      open,
      original: draw.original,
      principal: st.principal,
      unpaid: st.unpaid,
      rate: st.rate,
      entryFx: draw.entryFx,
      fx: fx?.rate ?? null,
      fxAsOf: fx?.asOf ?? null,
      fxFallback: fx?.fallback ?? false,
      principalUsd,
      unpaidUsd,
      owedUsd,
      entryUsd,
      fxGain,
      pikCost,
      allIn,
      interestNominal: st.interestNominal,
      interestUsd: tr.usd,
      interestBook: st.interestBook,
      interestFallbackRows: tr.fallbacks,
    });
  }
  return out;
}

function incomeLines(date: string, source: FxSource): IncomeLine[] {
  return book.events
    .filter((e) => e.date <= date)
    .map((e) => {
      const sign = e.kind === "fee" ? -1 : 1;
      const hit = resolveRate(e.ccy, e.date, source);
      let usd: number | null = null;
      let fallback = false;
      let rateSource = "none";
      if (hit && !hit.fallback) {
        usd = sign * e.nominal * hit.rate;
        rateSource = hit.source === "par" ? "USD" : hit.source === "citi" ? "Citi" : "XE";
      } else if (hit?.fallback) {
        usd = sign * e.nominal * hit.rate;
        fallback = true;
        rateSource = "XE (no Citi print)";
      } else if (e.bookedUsd != null) {
        usd = sign * e.bookedUsd;
        fallback = true;
        rateSource = "Workbook rate";
      }
      return {
        date: e.date,
        position: e.position,
        label: e.label,
        kind: e.kind,
        ccy: e.ccy,
        nominal: e.nominal,
        signedNominal: sign * e.nominal,
        bookedUsd: e.bookedUsd == null ? null : sign * e.bookedUsd,
        usd,
        rate: hit?.rate ?? null,
        rateAsOf: hit?.asOf ?? null,
        rateSource,
        fallback,
      };
    });
}

function priceOn(key: string | null, date: string) {
  if (!key) return null;
  return lastPair(book.prices[key], date);
}

function change(now: number | null | undefined, prev: number | null | undefined) {
  if (now == null || prev == null || prev === 0) return null;
  return now / prev - 1;
}

function directionFrom(weeklyPx: number | null, weeklyFx: number | null) {
  const px = weeklyPx ?? 0;
  const fx = weeklyFx ?? 0;
  const combined = (1 + px) * (1 + fx) - 1;
  if (combined > 0.005) return "Improving";
  if (combined < -0.005) return "Weakening";
  return "Stable";
}

function buildCharts(opts: Options, valFx: (ccy: string, date: string) => number | null) {
  const from = opts.chartFrom;
  const to = opts.chartTo;
  const charts: Record<string, ChartPoint[]> = {};

  function push(id: string, ccy: string, dates: string[], localAt: (d: string) => { local: number; price: number | null } | null) {
    const pts: ChartPoint[] = [];
    let prev: { local: number; fx: number; usd: number } | null = null;
    for (const date of dates) {
      if (date < from || date > to) continue;
      const lv = localAt(date);
      if (!lv) continue;
      const fx = valFx(ccy, date);
      const usd = fx == null ? null : lv.local * fx;
      let priceEffect: number | null = null;
      let fxEffect: number | null = null;
      if (prev && usd != null && fx != null) {
        priceEffect = (lv.local - prev.local) * prev.fx;
        fxEffect = lv.local * (fx - prev.fx);
      }
      pts.push({ date, usd, local: lv.local, price: lv.price, fx, priceEffect, fxEffect });
      if (usd != null && fx != null) prev = { local: lv.local, fx, usd };
    }
    charts[id] = pts;
  }

  const priceDates = new Set<string>();
  for (const series of Object.values(book.prices)) for (const [d] of series) priceDates.add(d);
  const sortedPriceDates = [...priceDates].sort();

  for (const p of POSITIONS) {
    if (p.priceKey && p.units != null) {
      push(p.id, p.ccy, sortedPriceDates, (d) => {
        if (d < p.acquired) return null;
        const hit = lastPair(book.prices[p.priceKey!], d);
        if (!hit || hit.date < book.priceStart) return null;
        if (d < hit.date) return null;
        // only plot on actual print dates
        const exact = book.prices[p.priceKey!].some((row) => row[0] === d);
        if (!exact) return null;
        return { local: p.units! * hit.value, price: hit.value };
      });
    } else if (p.carryAtCost) {
      const fxDates = (book.xe[p.ccy] || []).map((r) => r[0]).filter((d) => d >= from && d <= to && d >= p.acquired);
      push(p.id, p.ccy, fxDates, () => ({ local: p.cost, price: null }));
    } else if (p.mark != null && p.markDate) {
      push(p.id, p.ccy, sortedPriceDates.filter((d) => d >= p.acquired), (d) => {
        if (!sortedPriceDates.includes(d)) return null;
        const local = d >= p.markDate! ? p.mark! : p.cost;
        return { local, price: d >= p.markDate! ? p.mark! : null };
      });
    }
  }

  for (const u of UNDERLYINGS) {
    const series = book.underlyings[u.id] || [];
    const pts: ChartPoint[] = [];
    let prevPx: number | null = null;
    for (const [date, px] of series) {
      if (date < from || date > to) continue;
      pts.push({
        date,
        usd: null,
        local: px,
        price: px,
        fx: null,
        priceEffect: prevPx == null ? null : px - prevPx,
        fxEffect: null,
      });
      prevPx = px;
    }
    charts[u.id] = pts;
  }

  const allDates = [...priceDates].filter((d) => d >= from && d <= to).sort();
  const portfolioChart: Report["portfolioChart"] = [];
  for (const date of allDates) {
    const row: Report["portfolioChart"][number] = { date, total: 0 };
    for (const p of POSITIONS) {
      if (p.acquired > date) continue;
      let local: number | null = null;
      if (p.priceKey && p.units != null) {
        const hit = lastPair(book.prices[p.priceKey], date);
        if (hit) local = p.units * hit.value;
      } else if (p.carryAtCost) local = p.cost;
      else if (p.mark != null && p.markDate) local = date >= p.markDate ? p.mark : p.cost;
      if (local == null) continue;
      const fx = valFx(p.ccy, date);
      if (fx == null) continue;
      const usd = local * fx;
      row[p.id] = usd;
      row.total += usd;
    }
    portfolioChart.push(row);
  }

  return { charts, portfolioChart };
}

function marketStats(ccy: string, date: string) {
  const series = book.xe[ccy];
  if (!series) return { daily: null as number | null, vol: null as number | null, low: null as number | null, high: null as number | null, prev: null as number | null, fromPeak: null as number | null };
  const hit = lastPair(series, date);
  const prev = prevPair(series, date);
  const daily = hit && prev ? hit.value / prev.value - 1 : null;
  const start = daysBefore(date, 243);
  const window = series.filter((p) => p[0] <= date && p[0] >= start);
  const rets: number[] = [];
  for (let i = 1; i < window.length; i++) rets.push(window[i][1] / window[i - 1][1] - 1);
  const sd = stdev(rets);
  const eight = daysBefore(date, 243);
  const trail = series.filter((p) => p[0] <= date && p[0] >= eight);
  const low = trail.length ? Math.min(...trail.map((p) => p[1])) : null;
  const high = trail.length ? Math.max(...trail.map((p) => p[1])) : null;
  const fromPeak = hit && high ? hit.value / high - 1 : null;
  return { daily, vol: sd == null ? null : sd * Math.sqrt(252), low, high, prev: prev?.value ?? null, fromPeak };
}

function sumPos(rows: PositionRow[]) {
  return {
    costUsd: rows.reduce((s, r) => s + r.costUsd, 0),
    usd: rows.reduce((s, r) => s + (r.usd ?? 0), 0),
    priceGl: rows.reduce((s, r) => s + (r.priceGl ?? 0), 0),
    fxGl: rows.reduce((s, r) => s + (r.fxGl ?? 0), 0),
    totalGl: rows.reduce((s, r) => s + (r.totalGl ?? 0), 0),
  };
}

type MoveSample = { date: string; price: number | null; fx: number | null; usd: number | null; flatPrice?: boolean };

function bucketKey(period: MovePeriod, iso: string) {
  if (period === "day") return iso;
  if (period === "week") return mondayOf(iso);
  return iso.slice(0, 7);
}

function periodReturns(samples: MoveSample[], period: MovePeriod) {
  const groups = new Map<string, MoveSample>();
  for (const s of samples) {
    const key = bucketKey(period, s.date);
    const prev = groups.get(key);
    if (!prev || s.date >= prev.date) groups.set(key, s);
  }
  const keys = [...groups.keys()].sort();
  const out: { bucket: string; date: string; pricePct: number | null; fxPct: number | null; usdPct: number | null }[] = [];
  for (let i = 1; i < keys.length; i++) {
    const cur = groups.get(keys[i])!;
    const prev = groups.get(keys[i - 1])!;
    out.push({
      bucket: keys[i],
      date: cur.date,
      pricePct: cur.flatPrice || prev.flatPrice ? 0 : change(cur.price, prev.price),
      fxPct: change(cur.fx, prev.fx),
      usdPct: change(cur.usd, prev.usd),
    });
  }
  return out;
}

function moveDirection(pct: number | null, period: MovePeriod) {
  if (pct == null || !Number.isFinite(pct)) return "—";
  const bandWidth = period === "day" ? 0.0015 : period === "week" ? 0.005 : 0.01;
  if (pct > bandWidth) return "Rising";
  if (pct < -bandWidth) return "Falling";
  return "Flat";
}

function sampleDates(p: PositionDef, end: string) {
  if (p.priceKey) {
    return (book.prices[p.priceKey] || []).map((r) => r[0]).filter((d) => d >= p.acquired && d <= end);
  }
  const xe = p.ccy === "USD" ? null : book.xe[p.ccy];
  if (xe) return xe.map((r) => r[0]).filter((d) => d >= p.acquired && d <= end);
  const dates = new Set<string>();
  if (p.acquired <= end) dates.add(p.acquired);
  if (p.markDate && p.markDate >= p.acquired && p.markDate <= end) dates.add(p.markDate);
  for (const [d] of book.prices["pimco-usd"] || []) {
    if (d >= p.acquired && d <= end) dates.add(d);
  }
  return [...dates].sort();
}

function fxPairMoves(ccy: string, period: MovePeriod, from: string, to: string) {
  const xe = book.xe[ccy] || [];
  const citi = book.citi[ccy] || [];
  const xeSamples: MoveSample[] = [];
  const citiSamples: MoveSample[] = [];
  for (const [date, rate] of xe) {
    if (date > to) continue;
    xeSamples.push({ date, price: rate, fx: rate, usd: rate });
    const c = lastPair(citi, date);
    if (c) citiSamples.push({ date, price: c.value, fx: c.value, usd: c.value });
  }
  const xeR = periodReturns(xeSamples, period).filter((p) => p.date >= from && p.date <= to);
  const citiR = periodReturns(citiSamples, period).filter((p) => p.date >= from && p.date <= to);
  const map = new Map<string, { date: string; xe: number | null; citi: number | null }>();
  for (const p of xeR) map.set(p.bucket, { date: p.date, xe: p.usdPct, citi: null });
  for (const p of citiR) {
    const row = map.get(p.bucket) || { date: p.date, xe: null, citi: null };
    row.citi = p.usdPct;
    if (p.date > row.date) row.date = p.date;
    map.set(p.bucket, row);
  }
  return [...map.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([, v]) => v);
}

function buildMoves(opts: Options, valFx: (ccy: string, date: string) => number | null): Record<MovePeriod, MovePack> {
  const end = opts.chartTo > opts.reportingDate ? opts.chartTo : opts.reportingDate;
  const positions = POSITIONS.filter((p) => p.acquired <= opts.reportingDate);
  const samplesById = new Map<string, MoveSample[]>();
  for (const p of positions) {
    const samples: MoveSample[] = [];
    for (const date of sampleDates(p, end)) {
      const lv = localValue(p, date);
      const fx = p.ccy === "USD" ? 1 : valFx(p.ccy, date);
      if (fx == null) continue;
      samples.push({ date, price: lv.price, fx, usd: lv.local * fx, flatPrice: !!p.carryAtCost });
    }
    samplesById.set(p.id, samples);
  }
  const underSamples = new Map<string, MoveSample[]>();
  for (const u of UNDERLYINGS) {
    const samples: MoveSample[] = [];
    for (const [date, px] of book.underlyings[u.id] || []) {
      if (date > end) continue;
      samples.push({ date, price: px, fx: null, usd: px });
    }
    underSamples.set(u.id, samples);
  }
  const packs = {} as Record<MovePeriod, MovePack>;
  for (const period of ["day", "week", "month"] as const) {
    const byAsset: MovePack["byAsset"] = {};
    const rows: MoveRow[] = [];
    const seriesMap = new Map<string, { date: string; [k: string]: string | number | null }>();
    for (const p of positions) {
      const all = samplesById.get(p.id) || [];
      const rets = periodReturns(all.filter((s) => s.date <= opts.chartTo), period);
      const inWindow = rets.filter((r) => r.date >= opts.chartFrom && r.date <= opts.chartTo);
      byAsset[p.id] = inWindow.map((r) => ({ date: r.date, pricePct: r.pricePct, fxPct: r.fxPct, usdPct: r.usdPct }));
      for (const r of inWindow) {
        const row = seriesMap.get(r.bucket) || { date: r.date };
        if (r.date > String(row.date)) row.date = r.date;
        row[p.id] = r.pricePct;
        seriesMap.set(r.bucket, row);
      }
      const snapRets = periodReturns(all.filter((s) => s.date <= opts.reportingDate), period);
      const snap = snapRets.length ? snapRets[snapRets.length - 1] : null;
      rows.push({
        id: p.id,
        name: p.short,
        pricePct: snap?.pricePct ?? null,
        fxPct: p.ccy === "USD" ? 0 : (snap?.fxPct ?? null),
        usdPct: snap?.usdPct ?? null,
        direction: moveDirection(p.carryAtCost ? 0 : (snap?.pricePct ?? null), period),
        fxDirection: p.ccy === "USD" ? "Flat" : moveDirection(snap?.fxPct ?? null, period),
      });
    }
    const underlyings = UNDERLYINGS.map((u) => {
      const all = underSamples.get(u.id) || [];
      const snapRets = periodReturns(all.filter((s) => s.date <= opts.reportingDate), period);
      const snap = snapRets.length ? snapRets[snapRets.length - 1] : null;
      return { id: u.id, name: u.name, pct: snap?.usdPct ?? null, direction: moveDirection(snap?.usdPct ?? null, period) };
    });
    const underlyingSeries: MovePack["underlyingSeries"] = {};
    for (const u of UNDERLYINGS) {
      const all = underSamples.get(u.id) || [];
      underlyingSeries[u.id] = periodReturns(all.filter((s) => s.date <= opts.chartTo), period)
        .filter((r) => r.date >= opts.chartFrom && r.date <= opts.chartTo)
        .map((r) => ({ date: r.date, pricePct: r.usdPct }));
    }
    const fx = {
      SGD: fxPairMoves("SGD", period, opts.chartFrom, opts.chartTo),
      CHF: fxPairMoves("CHF", period, opts.chartFrom, opts.chartTo),
      HKD: fxPairMoves("HKD", period, opts.chartFrom, opts.chartTo),
      AUD: fxPairMoves("AUD", period, opts.chartFrom, opts.chartTo),
      EUR: fxPairMoves("EUR", period, opts.chartFrom, opts.chartTo),
    };
    const series = [...seriesMap.entries()].sort((a, b) => (a[0] < b[0] ? -1 : 1)).map(([, v]) => v);
    packs[period] = { rows, underlyings, series, byAsset, underlyingSeries, fx };
  }
  return packs;
}

const MONTH_TAG = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function monthTag(ym: string) {
  const [y, m] = ym.split("-");
  const mi = Number(m) - 1;
  if (!y || mi < 0 || mi > 11) return ym;
  return `${MONTH_TAG[mi]}-${y.slice(2)}`;
}

function r2(n: number) {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

type InterestSlice = { draw: string; from?: string; to?: string };
type HoldingStep = { from: string; shares?: number; cost?: number };

type CarryAsset = {
  id: string;
  investment: string;
  ccy: string;
  position: string;
  opened: string;
  closed: string | null;
  incomeTitle: string;
  slices: InterestSlice[];
  steps: HoldingStep[];
};

/** Interest slices partition the Citi accruals on the loan sheet so each row ties to that sheet's dollars. */
const CARRY_ASSETS: CarryAsset[] = [
  { id: "tpc", investment: "TPC", ccy: "AUD", position: "tpc", opened: "2024-10-21", closed: null, incomeTitle: "TPC dividend income", slices: [], steps: [{ from: "2024-10-21", shares: 544500, cost: 654307 }] },
  { id: "pimco-aud", investment: "PIMCO", ccy: "AUD", position: "pimco-aud", opened: "2025-03-28", closed: null, incomeTitle: "PIMCO AUD dividend income", slices: [], steps: [{ from: "2025-03-28", shares: 135554.547, cost: 1186749.97 }] },
  {
    id: "pimco-sgd",
    investment: "PIMCO",
    ccy: "SGD",
    position: "pimco-sgd",
    opened: "2025-09-24",
    closed: null,
    incomeTitle: "PIMCO SGD dividend income",
    slices: [{ draw: "Draw 3" }, { draw: "Draw 4" }, { draw: "Draw 11" }],
    steps: [
      { from: "2025-09-24", shares: 36420.4, cost: 353500 },
      { from: "2025-10-10", shares: 73069.61, cost: 707000 },
    ],
  },
  {
    id: "pimco-usd",
    investment: "PIMCO",
    ccy: "USD",
    position: "pimco-usd",
    opened: "2026-03-25",
    closed: null,
    incomeTitle: "PIMCO USD dividend income",
    slices: [{ draw: "Draw 7", from: "2026-04-01" }, { draw: "Draw 8" }, { draw: "Draw 12" }],
    steps: [{ from: "2026-03-25", shares: 90661.831, cost: 1010000 }],
  },
  {
    id: "fcn-usd",
    investment: "FCN",
    ccy: "USD",
    position: "fcn-usd",
    opened: "2025-10-23",
    closed: null,
    incomeTitle: "USD note coupon income",
    slices: [{ draw: "Draw 1", from: "2025-11-01" }, { draw: "Draw 9" }, { draw: "Draw 10" }],
    steps: [],
  },
  {
    id: "pimco-hkd",
    investment: "PIMCO",
    ccy: "HKD",
    position: "pimco-hkd",
    opened: "2025-06-04",
    closed: "2025-10-28",
    incomeTitle: "PIMCO HKD dividend income",
    slices: [{ draw: "Draw 1", to: "2025-10-31" }],
    steps: [{ from: "2025-06-04", cost: 4040000 }],
  },
  {
    id: "fcn-hkd",
    investment: "FCN",
    ccy: "HKD",
    position: "fcn-hkd",
    opened: "2025-06-06",
    closed: "2025-12-22",
    incomeTitle: "HKD note coupon income",
    slices: [{ draw: "Draw 2" }, { draw: "Draw 7", from: "2026-03-01", to: "2026-03-31" }],
    steps: [{ from: "2025-06-06", cost: 2000000 }],
  },
  {
    id: "byd",
    investment: "BYD",
    ccy: "HKD",
    position: "byd",
    opened: "2025-12-22",
    closed: "2026-02-28",
    incomeTitle: "BYD settlement",
    slices: [{ draw: "Draw 5" }, { draw: "Draw 6" }, { draw: "Draw 7", from: "2026-01-01", to: "2026-02-28" }],
    steps: [],
  },
  {
    id: "td",
    investment: "TD",
    ccy: "AUD",
    position: "td",
    opened: "2026-03-26",
    closed: "2026-03-26",
    incomeTitle: "Time deposit interest",
    slices: [],
    steps: [],
  },
];

function sliceHit(slice: InterestSlice, draw: string, date: string) {
  if (slice.draw !== draw) return false;
  if (slice.from && date < slice.from) return false;
  if (slice.to && date > slice.to) return false;
  return true;
}

function carryIndicator(ratio: number | null): { indicator: CarryIndicator; guidance: string } {
  if (ratio == null) return { indicator: "", guidance: "" };
  if (ratio > 2) return { indicator: "Strong", guidance: "Income comfortably covers interest expense" };
  if (ratio >= 1.5) return { indicator: "Adequate", guidance: "Sufficient coverage" };
  if (ratio >= 1) return { indicator: "Tight", guidance: "Limited buffer" };
  return { indicator: "Weak", guidance: "Income insufficient to cover interest expense" };
}

function holdingOn(steps: HoldingStep[], date: string) {
  let hit: HoldingStep | null = null;
  for (const step of steps) {
    if (step.from <= date) hit = step;
  }
  return hit;
}

function buildCarry(asOf: string): CarryRow[] {
  const rows: CarryRow[] = [];
  for (const asset of CARRY_ASSETS) {
    if (asset.opened > asOf) continue;
    const events = book.events.filter((e) => e.position === asset.position && e.date <= asOf);
    const incomeEvents = events.filter((e) => e.kind !== "fee");
    const feeEvents = events.filter((e) => e.kind === "fee");
    const loans = book.loanRows.filter(
      (r) => r.date <= asOf && r.accrued && asset.slices.some((s) => sliceHit(s, r.draw, r.date)),
    );
    if (!events.length && !loans.length) continue;

    const sliceCcys = [...new Set(asset.slices.map((s) => DRAWS.find((d) => d.name === s.draw)?.ccy).filter((c): c is string => !!c))];
    const interestCcy = sliceCcys.length === 1 ? sliceCcys[0] : null;
    const netNominal = r2(incomeEvents.reduce((s, e) => s + e.nominal, 0) - feeEvents.reduce((s, e) => s + e.nominal, 0));
    const grossUsd =
      asset.ccy === "USD"
        ? r2(incomeEvents.reduce((s, e) => s + e.nominal, 0))
        : r2(incomeEvents.reduce((s, e) => s + (e.bookedUsd || 0), 0));
    const feeRaw =
      asset.ccy === "USD"
        ? r2(feeEvents.reduce((s, e) => s + e.nominal, 0))
        : r2(feeEvents.reduce((s, e) => s + (e.bookedUsd || 0), 0));
    const feeUsd = feeRaw > 0 ? feeRaw : null;
    const netCarryUsd = r2(grossUsd - (feeUsd || 0));
    const status: "Active" | "Exited" = asset.closed && asset.closed <= asOf ? "Exited" : "Active";
    const interestUsd = asset.slices.length === 0 ? (status === "Active" ? 0 : null) : r2(loans.reduce((s, r) => s + (r.accruedUsdBook || 0), 0));
    const netReturnUsd = r2(netCarryUsd - (interestUsd || 0));
    const ratio = interestUsd != null && interestUsd > 0.5 ? netCarryUsd / interestUsd : null;
    const band = carryIndicator(ratio);

    const incomeByMonth = new Map<string, { nominal: number; usd: number; dividend: number; date: string }>();
    for (const e of incomeEvents) {
      const ym = e.date.slice(0, 7);
      const cell = incomeByMonth.get(ym) || { nominal: 0, usd: 0, dividend: 0, date: e.date };
      cell.nominal += e.nominal;
      cell.usd += asset.ccy === "USD" ? e.nominal : e.bookedUsd || 0;
      if (e.kind === "dividend") cell.dividend += e.nominal;
      if (e.date < cell.date) cell.date = e.date;
      incomeByMonth.set(ym, cell);
    }
    const interestByMonth = new Map<string, { nominal: number; usd: number }>();
    for (const r of loans) {
      const ym = r.date.slice(0, 7);
      const cell = interestByMonth.get(ym) || { nominal: 0, usd: 0 };
      cell.nominal += r.accrued;
      cell.usd += r.accruedUsdBook || 0;
      interestByMonth.set(ym, cell);
    }
    const firstIncome = [...incomeByMonth.keys()].sort()[0];
    if (firstIncome) {
      for (const ym of [...interestByMonth.keys()]) {
        if (ym >= firstIncome) continue;
        const extra = interestByMonth.get(ym)!;
        const into = interestByMonth.get(firstIncome) || { nominal: 0, usd: 0 };
        into.nominal += extra.nominal;
        into.usd += extra.usd;
        interestByMonth.set(firstIncome, into);
        interestByMonth.delete(ym);
      }
    }
    const yms = [...new Set([...incomeByMonth.keys(), ...interestByMonth.keys()])].sort();
    const months: CarryMonth[] = yms.map((ym) => {
      const inc = incomeByMonth.get(ym);
      const interest = interestByMonth.get(ym);
      const asOfDay = inc?.date || `${ym}-28`;
      const held = holdingOn(asset.steps, asOfDay);
      const shares = held?.shares ?? null;
      const dist = shares && inc && inc.dividend > 0 ? inc.dividend / shares : null;
      return {
        ym,
        tag: monthTag(ym),
        cost: held?.cost ?? null,
        shares,
        dist,
        incomeNominal: r2(inc?.nominal || 0),
        incomeUsd: r2(inc?.usd || 0),
        interestNominal: interestCcy ? r2(interest?.nominal || 0) : 0,
        interestUsd: r2(interest?.usd || 0),
      };
    });

    rows.push({
      id: asset.id,
      investment: asset.investment,
      ccy: asset.ccy,
      status,
      netNominal,
      grossUsd,
      feeUsd,
      netCarryUsd,
      interestUsd,
      netReturnUsd,
      ratio,
      indicator: band.indicator,
      guidance: band.guidance,
      incomeTitle: asset.incomeTitle,
      interestCcy,
      months,
    });
  }
  return rows;
}

const INCOME_LABEL: Record<string, string> = {
  "tpc:dividend": "TPC dividend",
  "pimco-aud:dividend": "PIMCO AUD distribution",
  "pimco-aud:fee": "PIMCO AUD commission",
  "pimco-sgd:dividend": "PIMCO SGD distribution",
  "pimco-sgd:fee": "PIMCO SGD commission",
  "pimco-usd:dividend": "PIMCO USD distribution",
  "pimco-usd:fee": "PIMCO USD commission",
  "pimco-hkd:dividend": "PIMCO HKD distribution",
  "pimco-hkd:fee": "PIMCO HKD commission",
  "pimco-hkd:realized": "PIMCO HKD realised",
  "fcn-usd:coupon": "USD note coupons",
  "fcn-hkd:coupon": "HKD note coupons",
  "byd:realized": "BYD equity",
  "td:interest": "Citi time deposit",
};

const INCOME_ORDER = Object.keys(INCOME_LABEL);

function buildIncomeGrid(lines: IncomeLine[]): IncomeGrid {
  const monthSet = new Set(lines.map((l) => l.date.slice(0, 7)));
  const months: string[] = [];
  if (monthSet.size) {
    const sorted = [...monthSet].sort();
    const [ys, ms] = sorted[0].split("-").map(Number);
    const [ye, me] = sorted[sorted.length - 1].split("-").map(Number);
    let y = ys;
    let m = ms;
    while (y < ye || (y === ye && m <= me)) {
      months.push(`${y}-${String(m).padStart(2, "0")}`);
      m += 1;
      if (m === 13) {
        m = 1;
        y += 1;
      }
    }
  }
  const map = new Map<string, IncomeGrid["rows"][number]>();
  for (const line of lines) {
    const id = `${line.position}:${line.kind}`;
    let row = map.get(id);
    if (!row) {
      row = {
        id,
        name: INCOME_LABEL[id] || line.label,
        ccy: line.ccy,
        cells: {},
        nominal: 0,
        usd: 0,
        booked: 0,
      };
      map.set(id, row);
    }
    const ym = line.date.slice(0, 7);
    const cell = row.cells[ym] || { nominal: 0, usd: 0, booked: 0 };
    cell.nominal += line.signedNominal;
    cell.usd += line.usd || 0;
    cell.booked += line.bookedUsd || 0;
    row.cells[ym] = cell;
    row.nominal += line.signedNominal;
    row.usd += line.usd || 0;
    row.booked += line.bookedUsd || 0;
  }
  const rows = [...map.values()].sort((a, b) => {
    const ia = INCOME_ORDER.indexOf(a.id);
    const ib = INCOME_ORDER.indexOf(b.id);
    return (ia < 0 ? 99 : ia) - (ib < 0 ? 99 : ib);
  });
  const usdByMonth: Record<string, number> = {};
  for (const ym of months) usdByMonth[ym] = rows.reduce((s, r) => s + (r.cells[ym]?.usd || 0), 0);
  return { months, rows, usdByMonth, usdTotal: rows.reduce((s, r) => s + r.usd, 0) };
}

function drawNum(name: string) {
  const n = Number(name.replace(/\D/g, ""));
  return Number.isFinite(n) ? n : 0;
}

function buildLoanSchedule(date: string, source: FxSource): LoanScheduleRow[] {
  const seen = new Set<string>();
  const out: LoanScheduleRow[] = [];
  for (const row of book.loanRows) {
    if (row.date > date) continue;
    const key = `${row.draw}|${row.date}|${row.accrued}|${row.principal}|${row.repayment ?? ""}|${row.rollover ?? ""}`;
    if (seen.has(key)) continue;
    seen.add(key);
    const draw = DRAWS.find((d) => d.name === row.draw);
    if (!draw) continue;
    const accrued = row.accrued || 0;
    const settled = row.rollover || 0;
    const repaid = row.repayment || 0;
    const citi = row.citi;
    const atCiti = (n: number) => (citi == null ? null : n * citi);
    let selected: number | null = null;
    if (source === "citi" && citi != null) selected = accrued * citi;
    else {
      const hit = resolveRate(draw.ccy, row.date, source);
      if (hit) selected = accrued * hit.rate;
      else if (row.accruedUsdBook != null) selected = row.accruedUsdBook;
    }
    out.push({
      draw: draw.name,
      ref: draw.ref,
      ccy: draw.ccy,
      pay: draw.pay,
      type: draw.type,
      date: row.date,
      month: row.date.slice(0, 7),
      interestRate: row.rate,
      principal: row.principal,
      accrued,
      settled,
      repaid,
      owed: row.owed,
      citi,
      accruedUsd: citi != null ? accrued * citi : (row.accruedUsdBook ?? null),
      settledUsd: atCiti(settled),
      repaidUsd: atCiti(repaid),
      accruedUsdSelected: selected,
    });
  }
  out.sort((a, b) => a.date.localeCompare(b.date) || drawNum(a.draw) - drawNum(b.draw));
  return out;
}

function band(ltv: number) {
  if (ltv <= 0.5) return { band: "Low", action: "Well collateralised." };
  if (ltv <= 0.7) return { band: "Moderate", action: "Within a calmer band than the book close." };
  if (ltv <= 0.85) return { band: "Elevated", action: "Review the collateral." };
  if (ltv <= 1) return { band: "High", action: "Potential margin-call risk." };
  return { band: "Critical", action: "Under-collateralised — review immediately." };
}

export function buildReport(input: Options): Report {
  let chartFrom = clamp(input.chartFrom, CHART_MIN, CHART_MAX);
  let chartTo = clamp(input.chartTo, CHART_MIN, CHART_MAX);
  if (chartFrom > chartTo) [chartFrom, chartTo] = [chartTo, chartFrom];
  const opts: Options = {
    ...input,
    reportingDate: clamp(input.reportingDate, REPORT_MIN, REPORT_MAX),
    chartFrom,
    chartTo,
    monthEnd: MONTH_ENDS.includes(input.monthEnd as (typeof MONTH_ENDS)[number]) ? input.monthEnd : "2026-10-31",
  };
  const warnings: string[] = [];
  const fxDate = opts.mode === "monthend" ? opts.monthEnd : opts.reportingDate;

  if (opts.mode === "monthend" && opts.source === "xe" && fxDate < book.xeStart) {
    warnings.push(`XE closes begin ${book.xeStart}. This month-end is earlier, so most balance-sheet rates are unavailable.`);
  }
  if (opts.source === "citi") {
    warnings.push("Citi rates are the prints on each loan-expense row (sheet columns T and W) for SGD, HKD and CHF. AUD and EUR have no Citi print, so they stay on XE.");
  }
  if (opts.reportingDate < book.priceStart) {
    warnings.push(`Daily prices begin ${book.priceStart}. Earlier reporting dates carry unpriced assets at cost.`);
  }

  const positions = snapshotPositions(opts.reportingDate, opts.source, opts.mode, opts.monthEnd);
  const totals = sumPos(positions);
  const byCcy = new Map<string, number>();
  for (const p of positions) byCcy.set(p.ccy, (byCcy.get(p.ccy) || 0) + (p.usd || 0));
  const exposure = [...byCcy.entries()]
    .map(([ccy, usd]) => ({ ccy, usd, pct: totals.usd ? usd / totals.usd : 0 }))
    .sort((a, b) => b.usd - a.usd);

  const draws = snapshotLoans(opts.reportingDate, opts.source, opts.mode, opts.monthEnd);
  const interestNominalByCcy: Record<string, number> = {};
  for (const d of draws) interestNominalByCcy[d.ccy] = (interestNominalByCcy[d.ccy] || 0) + d.interestNominal;
  const loanTotals = {
    owedUsd: draws.reduce((s, d) => s + (d.owedUsd || 0), 0),
    fxGain: draws.reduce((s, d) => s + (d.fxGain || 0), 0),
    pikCost: draws.reduce((s, d) => s + (d.pikCost || 0), 0),
    allIn: draws.reduce((s, d) => s + (d.allIn || 0), 0),
    interestUsd: draws.reduce((s, d) => s + (d.interestUsd || 0), 0),
    interestBook: draws.reduce((s, d) => s + d.interestBook, 0),
    interestNominalByCcy,
  };

  const ltv = COLLATERAL.map((g) => {
    const loanUsd = draws.filter((d) => g.draws.includes(d.name) && d.open).reduce((s, d) => s + (d.owedUsd || 0), 0);
    const fmvUsd = positions.filter((p) => g.positionIds.includes(p.id)).reduce((s, p) => s + (p.usd || 0), 0);
    const ratio = fmvUsd > 0 ? loanUsd / fmvUsd : null;
    const b = ratio == null ? { band: "n/a", action: "No collateral value" } : band(ratio);
    return { id: g.id, name: g.name, draws: g.draws.join(", "), loanUsd, fmvUsd, ltv: ratio, band: b.band, action: b.action };
  });

  const income = incomeLines(opts.reportingDate, opts.source);
  const posName = new Map(POSITIONS.map((p) => [p.id, p]));
  const extraNames: Record<string, { name: string; ccy: string }> = {
    "fcn-usd": { name: "USD coupon notes (cash ledger, includes exited)", ccy: "USD" },
    "fcn-hkd": { name: "HKD coupon notes (exited)", ccy: "HKD" },
    "pimco-hkd": { name: "PIMCO HKD (exited)", ccy: "HKD" },
    byd: { name: "BYD equity (exited)", ccy: "HKD" },
    td: { name: "Citi time deposit (exited)", ccy: "AUD" },
  };
  const groupIds = [...new Set(income.map((i) => i.position))];
  const incomeByPosition = groupIds.map((id) => {
    const lines = income.filter((i) => i.position === id);
    const meta = posName.get(id);
    const extra = extraNames[id];
    return {
      id,
      name: meta?.name || extra?.name || id,
      ccy: meta?.ccy || extra?.ccy || lines[0]?.ccy || "",
      nominal: lines.reduce((s, l) => s + l.signedNominal, 0),
      usd: lines.reduce((s, l) => s + (l.usd || 0), 0),
      booked: lines.reduce((s, l) => s + (l.bookedUsd || 0), 0),
      fallbacks: lines.filter((l) => l.fallback).length,
    };
  });

  const incomeUsd = (ids: string[]) =>
    income.filter((l) => ids.includes(l.position)).reduce((s, l) => s + (l.usd || 0), 0);
  const interestFor = (names: string[]) =>
    draws.filter((d) => names.includes(d.name)).reduce((s, d) => s + (d.interestUsd || 0), 0);
  const cover = (label: string, inc: number, interest: number) => ({
    label,
    income: inc,
    interest,
    ratio: interest > 1 ? inc / interest : null,
  });
  const coverage = [
    cover("Whole book", income.reduce((s, l) => s + (l.usd || 0), 0), loanTotals.interestUsd),
    cover("PIMCO SGD vs SGD draws 4 and 11", incomeUsd(["pimco-sgd"]), interestFor(["Draw 4", "Draw 11"])),
    cover("PIMCO USD vs draws 7 and 12", incomeUsd(["pimco-usd"]), interestFor(["Draw 7", "Draw 12"])),
    cover("Live FCN accrual vs CHF draws 9 and 10", positions.filter((p) => p.id === "fcn-nvda" || p.id === "fcn-amzn").reduce((s, p) => s + p.carryNominal, 0), interestFor(["Draw 9", "Draw 10"])),
  ];

  const underlyings = UNDERLYINGS.map((u) => {
    const series = book.underlyings[u.id] || [];
    const hit = lastPair(series, opts.reportingDate);
    const prev = prevPair(series, opts.reportingDate);
    const week = lastPair(series, daysBefore(mondayOf(opts.reportingDate), 1));
    const weekly = change(hit?.value, week?.value ?? series.find((p) => p[0] >= mondayOf(opts.reportingDate))?.[1]);
    const cushion = hit ? hit.value / u.strike - 1 : null;
    const daily = change(hit?.value, prev?.value);
    const direction = moveDirection(weekly, "week");
    return {
      id: u.id,
      name: u.name,
      note: u.note,
      price: hit?.value ?? null,
      asOf: hit?.date ?? null,
      purchase: u.purchase,
      strike: u.strike,
      cushion,
      fromPurchase: hit ? hit.value / u.purchase - 1 : null,
      weekly,
      daily,
      direction,
    };
  });

  const valFx = (ccy: string, date: string) => {
    if (opts.mode === "monthend") return resolveRate(ccy, opts.monthEnd, opts.source)?.rate ?? null;
    return resolveRate(ccy, date, opts.source)?.rate ?? null;
  };
  const { charts, portfolioChart } = buildCharts(opts, valFx);

  const ccys = ["AUD", "SGD", "EUR", "CHF", "HKD", "USD"];
  const rates = ccys.map((ccy) => {
    const hit = resolveRate(ccy, fxDate, opts.source);
    const xe = ccy === "USD" ? { rate: 1, asOf: fxDate, source: "par" as const, fallback: false } : resolveRate(ccy, fxDate, "xe");
    const citi = ccy === "USD" ? null : resolveRate(ccy, fxDate, "citi");
    const m = marketStats(ccy, opts.reportingDate);
    return { ccy, hit, xe, citi: citi && citi.source === "citi" ? citi : ccy === "USD" ? null : lastPair(book.citi[ccy], fxDate) ? { rate: lastPair(book.citi[ccy], fxDate)!.value, asOf: lastPair(book.citi[ccy], fxDate)!.date, source: "citi" as const, fallback: false } : null, ...m };
  });

  const trends = positions
    .filter((p) => p.id !== "fcn-nvda" && p.id !== "fcn-amzn")
    .map((p) => {
      const def = POSITIONS.find((x) => x.id === p.id)!;
      const series = def.priceKey ? book.prices[def.priceKey] : null;
      const px = series ? lastPair(series, opts.reportingDate) : null;
      const pxPrev = series ? prevPair(series, opts.reportingDate) : null;
      const mon = mondayOf(opts.reportingDate);
      const pxWeekBase = series?.find((row) => row[0] >= mon && row[0] <= opts.reportingDate);
      const pxMonthBase = series ? lastPair(series, daysBefore(monthStart(opts.reportingDate), 1)) : null;
      const fxSeries = opts.source === "citi" && book.citi[p.ccy]?.length ? book.citi[p.ccy] : book.xe[p.ccy];
      const fxNow = p.ccy === "USD" ? { date: opts.reportingDate, value: 1 } : lastPair(fxSeries, opts.reportingDate);
      const fxPrev = p.ccy === "USD" ? fxNow : prevPair(fxSeries, opts.reportingDate);
      const fxWeek = p.ccy === "USD" ? fxNow : lastPair(fxSeries, daysBefore(mon, 1)) || (fxSeries || []).find((row) => row[0] >= mon);
      const fxMonth = p.ccy === "USD" ? fxNow : lastPair(fxSeries, daysBefore(monthStart(opts.reportingDate), 1));
      const dailyPx = def.carryAtCost ? 0 : change(px?.value, pxPrev?.value);
      const weeklyPx = def.carryAtCost ? 0 : change(px?.value, pxWeekBase ? pxWeekBase[1] : null);
      const monthlyPx = def.carryAtCost ? 0 : change(px?.value, pxMonthBase?.value);
      const dailyFx = change(fxNow?.value, fxPrev && "value" in fxPrev ? fxPrev.value : null);
      const weeklyFx = change(fxNow?.value, fxWeek && "value" in fxWeek ? (fxWeek as { value: number }).value : Array.isArray(fxWeek) ? fxWeek[1] : null);
      const monthlyFx = change(fxNow?.value, fxMonth?.value);
      const inceptionPx = p.priceMove;
      const inceptionFx = p.fxMove;
      return {
        id: p.id,
        name: p.short,
        dailyPx,
        weeklyPx,
        monthlyPx,
        inceptionPx,
        dailyFx: p.ccy === "USD" ? 0 : dailyFx,
        weeklyFx: p.ccy === "USD" ? 0 : weeklyFx,
        monthlyFx: p.ccy === "USD" ? 0 : monthlyFx,
        inceptionFx,
        direction: directionFrom(weeklyPx, p.ccy === "USD" ? 0 : weeklyFx),
      };
    });

  function pack(label: string, source: FxSource, mode: RateMode) {
    const ps = snapshotPositions(opts.reportingDate, source, mode, opts.monthEnd);
    const ds = snapshotLoans(opts.reportingDate, source, mode, opts.monthEnd);
    const fmv = ps.reduce((s, p) => s + (p.usd || 0), 0);
    const loans = ds.reduce((s, d) => s + (d.owedUsd || 0), 0);
    const gl = ps.reduce((s, p) => s + (p.totalGl || 0), 0);
    return { label, fmv, loans, net: fmv - loans, gl };
  }
  const sensitivity = [
    pack("XE on reporting date", "xe", "spot"),
    pack(`XE month-end ${opts.monthEnd}`, "xe", "monthend"),
    pack(`Citi month-end ${opts.monthEnd}`, "citi", "monthend"),
  ];

  const windowMove = POSITIONS.map((p) => {
    const series = charts[p.id] || [];
    if (series.length < 2) return null;
    const a = series[0];
    const b = series[series.length - 1];
    if (a.usd == null || b.usd == null) return null;
    const price = series.reduce((s, pt) => s + (pt.priceEffect || 0), 0);
    const fx = series.reduce((s, pt) => s + (pt.fxEffect || 0), 0);
    return { id: p.id, name: p.short, startUsd: a.usd, endUsd: b.usd, price, fx };
  }).filter((x): x is NonNullable<typeof x> => !!x);

  const incomeGrid = buildIncomeGrid(income);
  const loanSchedule = buildLoanSchedule(opts.reportingDate, opts.source);
  const loanCiti = snapshotLoans(opts.reportingDate, "citi", opts.mode, opts.monthEnd);
  const moves = buildMoves(opts, valFx);
  const carry = buildCarry(opts.reportingDate);

  const analysis = writeAnalysis({ positions, totals, loanTotals, ltv, coverage, underlyings, rates, sensitivity, windowMove, opts, income });

  const exited = EXITED.filter((e) => e.disposed <= opts.reportingDate && e.acquired <= opts.reportingDate);

  const fxDates = new Set<string>();
  for (const ccy of ["AUD", "SGD", "CHF", "EUR", "HKD"]) {
    for (const [d] of book.xe[ccy] || []) {
      if (d >= opts.chartFrom && d <= opts.chartTo) fxDates.add(d);
    }
  }
  const fxChart = [...fxDates].sort().map((date) => ({
    date,
    AUD: lastPair(book.xe.AUD, date)?.value ?? null,
    SGD: lastPair(book.xe.SGD, date)?.value ?? null,
    CHF: lastPair(book.xe.CHF, date)?.value ?? null,
    EUR: lastPair(book.xe.EUR, date)?.value ?? null,
    HKD: lastPair(book.xe.HKD, date)?.value ?? null,
    citiSGD: lastPair(book.citi.SGD, date)?.value ?? null,
    citiCHF: lastPair(book.citi.CHF, date)?.value ?? null,
    citiHKD: lastPair(book.citi.HKD, date)?.value ?? null,
  }));

  return {
    reportingDate: opts.reportingDate,
    chartFrom: opts.chartFrom,
    chartTo: opts.chartTo,
    source: opts.source,
    mode: opts.mode,
    monthEnd: opts.monthEnd,
    fxDate,
    warnings,
    rates,
    positions,
    totals,
    exposure,
    draws,
    loanTotals,
    ltv,
    income,
    incomeByPosition,
    coverage,
    underlyings,
    charts,
    portfolioChart,
    trends,
    sensitivity,
    windowMove,
    moves,
    incomeGrid,
    loanSchedule,
    loanCiti,
    carry,
    fxChart,
    analysis,
    exited,
  };
}

function money(n: number) {
  const abs = Math.abs(Math.round(n));
  const body = abs.toLocaleString("en-US");
  return n < 0 ? `($${body})` : `$${body}`;
}
function pct(n: number) {
  const v = (n * 100).toFixed(1);
  return n < 0 ? `(${v.replace("-", "")}%)` : `${v}%`;
}

function writeAnalysis(ctx: {
  positions: PositionRow[];
  totals: Report["totals"];
  loanTotals: Report["loanTotals"];
  ltv: Report["ltv"];
  coverage: Report["coverage"];
  underlyings: Report["underlyings"];
  rates: Report["rates"];
  sensitivity: Report["sensitivity"];
  windowMove: Report["windowMove"];
  opts: Options;
  income: IncomeLine[];
}): string[] {
  const { positions, totals, loanTotals, ltv, coverage, underlyings, rates, sensitivity, windowMove, opts } = ctx;
  const lines: string[] = [];
  const net = totals.usd - loanTotals.owedUsd;
  const rateWords =
    opts.mode === "monthend"
      ? `the ${opts.source === "citi" ? "Citi" : "XE"} month-end rate of ${opts.monthEnd}`
      : opts.source === "citi"
        ? "the latest Citi print on or before the reporting date"
        : "the XE close on the reporting date";
  lines.push(
    `As of ${opts.reportingDate}, assets are ${money(totals.usd)} and loan balances owed are ${money(loanTotals.owedUsd)}, so net assets are ${money(net)}. Translation uses ${rateWords}. Unrealized result since entry is ${money(totals.totalGl)}: price ${money(totals.priceGl)} and FX ${money(totals.fxGl)}.`,
  );

  const top = [...positions].sort((a, b) => (b.usd || 0) - (a.usd || 0))[0];
  if (top?.usd) {
    lines.push(
      `${top.short} is ${pct(top.usd / totals.usd)} of fair value (${money(top.usd)}). Local value is ${pct(top.priceMove || 0)} versus cost and the currency is ${pct(top.fxMove || 0)} versus the entry rate, so the USD result is ${money(top.totalGl || 0)}.`,
    );
  }

  const xe = sensitivity[0];
  const xeM = sensitivity[1];
  const citi = sensitivity[2];
  lines.push(
    `Switching the balance sheet from the XE reporting-date rate to the XE month-end moves fair value by ${money(xeM.fmv - xe.fmv)} and loans by ${money(xeM.loans - xe.loans)}. The Citi month-end, which is the rate book inside the loan expense sheet, puts loans at ${money(citi.loans)} against ${money(xeM.loans)} on the XE month-end. AUD and EUR have no Citi print, so that column still uses XE for those currencies.`,
  );

  const basis = rates.filter((r) => r.xe && r.citi && r.ccy !== "USD");
  if (basis.length) {
    const bits = basis.map((r) => {
      const bps = ((r.citi!.rate - r.xe!.rate) / r.xe!.rate) * 10000;
      const sign = bps >= 0 ? "+" : "";
      return `${r.ccy} ${sign}${bps.toFixed(0)} bp (Citi ${r.citi!.asOf}, XE ${r.xe!.asOf})`;
    });
    lines.push(
      `Citi versus XE, each the latest print on or before the valuation date: ${bits.join("; ")}. They are not always the same day — Citi is a month-end (and draw-date) book, XE is a daily close. A positive gap means Citi translates that currency to more dollars.`,
    );
  }

  const hot = ltv.filter((g) => g.ltv != null && g.ltv > 0.85);
  if (hot.length) {
    lines.push(
      hot
        .map((g) => `${g.name} secures ${g.draws}. Loan-to-value is ${pct(g.ltv || 0)} (${g.band.toLowerCase()}): ${g.action.toLowerCase()}. Collateral ${money(g.fmvUsd)} against loans ${money(g.loanUsd)}.`)
        .join(" "),
    );
  } else {
    lines.push("No collateral pool is above 85% loan-to-value on this rate and date.");
  }

  const thin = underlyings.filter((u) => u.cushion != null && u.cushion < 0.1);
  if (thin.length) {
    lines.push(
      `Coupon-note cushions under 10% of strike: ${thin.map((u) => `${u.name} ${pct(u.cushion || 0)} (price ${u.price?.toFixed(2)}, strike ${u.strike.toFixed(2)})`).join("; ")}. Trend on the movement table follows the price change and the FX rate, not the cushion.`,
    );
  }

  const avgo = underlyings.find((u) => u.id === "AVGO");
  if (avgo && avgo.weekly != null && Math.abs(avgo.weekly) >= 0.08 && avgo.price != null) {
    lines.push(
      `Broadcom’s latest week is ${pct(avgo.weekly)}, the close of ${avgo.price.toFixed(2)} against the prior Friday. A print of that size is the rebound after a sharp drop, not the holding-period result. Versus the note purchase price of ${avgo.purchase.toFixed(2)} the share is ${pct(avgo.fromPurchase || 0)}.`,
    );
  }

  const whole = coverage[0];
  if (whole.ratio != null) {
    const weak = coverage.filter((c) => c.ratio != null && c.label !== "Whole book").sort((a, b) => (a.ratio || 0) - (b.ratio || 0))[0];
    lines.push(
      `Cash income translated on the ${opts.source === "citi" ? "Citi" : "XE"} rate of each income date covers interest ${whole.ratio.toFixed(2)}× (${money(whole.income)} against ${money(whole.interest)}). Tightest mapped pair: ${weak ? `${weak.label} at ${weak.ratio?.toFixed(2)}×` : "n/a"}. Lines dated before that rate book starts keep the workbook's original dollars.`,
    );
  }

  if (windowMove.length) {
    const worst = [...windowMove].sort((a, b) => a.endUsd - a.startUsd - (b.endUsd - b.startUsd))[0];
    const best = [...windowMove].sort((a, b) => b.endUsd - b.startUsd - (a.endUsd - a.startUsd))[0];
    const delta = (m: { endUsd: number; startUsd: number }) => m.endUsd - m.startUsd;
    lines.push(
      `Over the chart window ${opts.chartFrom} to ${opts.chartTo}, ${best.name} moves ${money(delta(best))} and ${worst.name} moves ${money(delta(worst))}. The split under each line is price times the starting FX, then the FX change on the ending local value. A month-end rate holds FX flat, so that window is price only.`,
    );
  }

  const pik = loanTotals.pikCost;
  lines.push(
    `On open loans, FX on the original principal is ${money(loanTotals.fxGain)} and capitalised PIK interest is ${money(pik)}. All-in on those two, before cash interest, is ${money(loanTotals.allIn)}. Realised FX on repayments is historical and is not restated when the rate book changes.`,
  );

  return lines;
}

export const POSITION_COLOR: Record<string, string> = {
  tpc: "var(--color-s1)",
  concord: "var(--color-s2)",
  "pimco-aud": "var(--color-s3)",
  "pimco-sgd": "var(--color-s4)",
  "pimco-usd": "var(--color-s5)",
  "fcn-nvda": "var(--color-s6)",
  "fcn-amzn": "var(--color-s7)",
  NVDA: "var(--color-s1)",
  AVGO: "var(--color-s4)",
  AMZN: "var(--color-s2)",
  GOOG: "var(--color-s5)",
};

export function priceNote(rows: PositionRow[]) {
  return rows.filter((r) => r.priceNote).map((r) => `${r.short}: ${r.priceNote}`);
}
