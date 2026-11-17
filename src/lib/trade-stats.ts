export interface StatTrade {
  trade_date: string;
  result_r: number;
  setup_type: string;
  session: string;
  instrument: string;
  direction: string;
  ict_concepts?: string[];
  created_at?: string;
}

export interface TradeStats {
  totalTrades: number;
  wins: number;
  losses: number;
  breakeven: number;
  winRate: number | null;
  profitFactor: number | null;
  avgR: number | null;
  totalR: number;
  bestR: number | null;
  worstR: number | null;
}

const round = (n: number, d = 2) => Math.round(n * 10 ** d) / 10 ** d;

export function computeStats(trades: StatTrade[]): TradeStats {
  const rs = trades.map((t) => Number(t.result_r));
  const wins = rs.filter((r) => r > 0);
  const losses = rs.filter((r) => r < 0);
  const totalR = rs.reduce((a, b) => a + b, 0);
  const grossWin = wins.reduce((a, b) => a + b, 0);
  const grossLoss = Math.abs(losses.reduce((a, b) => a + b, 0));
  return {
    totalTrades: rs.length,
    wins: wins.length,
    losses: losses.length,
    breakeven: rs.length - wins.length - losses.length,
    winRate: rs.length ? round((wins.length / rs.length) * 100, 1) : null,
    // Profit factor needs at least one win and one loss to be meaningful.
    profitFactor: wins.length && losses.length ? round(grossWin / grossLoss) : null,
    avgR: rs.length ? round(totalR / rs.length) : null,
    totalR: round(totalR),
    bestR: rs.length ? Math.max(...rs) : null,
    worstR: rs.length ? Math.min(...rs) : null,
  };
}

function chrono<T extends StatTrade>(trades: T[]): T[] {
  return [...trades].sort(
    (a, b) =>
      a.trade_date.localeCompare(b.trade_date) ||
      (a.created_at ?? "").localeCompare(b.created_at ?? ""),
  );
}

export function equityCurve(trades: StatTrade[]) {
  let cum = 0;
  return chrono(trades).map((t, i) => {
    cum += Number(t.result_r);
    return { n: i + 1, date: t.trade_date, r: Number(t.result_r), equity: round(cum) };
  });
}

export function monthlyPerformance(trades: StatTrade[]) {
  const map = new Map<string, { month: string; totalR: number; trades: number; wins: number }>();
  for (const t of trades) {
    const m = t.trade_date.slice(0, 7);
    const e = map.get(m) ?? { month: m, totalR: 0, trades: 0, wins: 0 };
    e.totalR = round(e.totalR + Number(t.result_r));
    e.trades += 1;
    if (Number(t.result_r) > 0) e.wins += 1;
    map.set(m, e);
  }
  return [...map.values()].sort((a, b) => a.month.localeCompare(b.month));
}

export function groupStats(trades: StatTrade[], key: (t: StatTrade) => string | string[]) {
  const groups = new Map<string, StatTrade[]>();
  for (const t of trades) {
    const k = key(t);
    for (const g of Array.isArray(k) ? k : [k]) {
      if (!g) continue;
      groups.set(g, [...(groups.get(g) ?? []), t]);
    }
  }
  return [...groups.entries()]
    .map(([name, ts]) => ({ name, ...computeStats(ts) }))
    .sort((a, b) => b.totalR - a.totalR);
}

export function maxDrawdown(trades: StatTrade[]): number {
  let peak = 0;
  let dd = 0;
  for (const p of equityCurve(trades)) {
    peak = Math.max(peak, p.equity);
    dd = Math.min(dd, p.equity - peak);
  }
  return round(dd);
}
