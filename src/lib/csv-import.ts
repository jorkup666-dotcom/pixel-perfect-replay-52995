export type Field = "symbol" | "side" | "entry" | "exit" | "qty" | "time" | "closeTime" | "pnl" | "tradeNo";
export const FIELDS: { key: Field; label: string; required?: boolean }[] = [
  { key: "symbol", label: "Symbol", required: true }, { key: "side", label: "Direction / Side", required: true },
  { key: "entry", label: "Entry price", required: true }, { key: "exit", label: "Exit price" },
  { key: "qty", label: "Size / Qty" }, { key: "time", label: "Time (open)", required: true },
  { key: "closeTime", label: "Close time" }, { key: "pnl", label: "Profit / Loss" }, { key: "tradeNo", label: "Trade #" },
];

const SYNONYMS: Record<Field, RegExp> = {
  symbol: /^(symbol|ticker|instrument|market)$/i,
  side: /^(side|type|direction|action)$/i,
  entry: /^(entry( price)?|avg (fill|entry) price|fill price|open price|price( usd)?|price)$/i,
  exit: /^(exit( price)?|close price|avg exit price)$/i,
  qty: /^(qty|quantity|size|contracts|amount)$/i,
  time: /^(date\/time|time|date|placing time|open time|entry time|fill time)$/i,
  closeTime: /^(closing time|close time|exit time)$/i,
  pnl: /^(profit( usd)?|p&l|pnl|realized p&l|net profit|profit\/loss|realized pnl)$/i,
  tradeNo: /^(trade #|trade|trade no|trade number)$/i,
};

export function parseCsv(text: string): string[][] {
  const rows: string[][] = []; let row: string[] = []; let cell = ""; let q = false;
  for (let i = 0; i < text.length; i++) {
    const ch = text[i]!;
    if (q) { if (ch === '"' && text[i + 1] === '"') { cell += '"'; i++; } else if (ch === '"') q = false; else cell += ch; }
    else if (ch === '"') q = true;
    else if (ch === "," || ch === ";" || ch === "\t") { row.push(cell); cell = ""; }
    else if (ch === "\n" || ch === "\r") { if (ch === "\r" && text[i + 1] === "\n") i++; row.push(cell); if (row.some((c) => c.trim())) rows.push(row); row = []; cell = ""; }
    else cell += ch;
  }
  row.push(cell); if (row.some((c) => c.trim())) rows.push(row);
  return rows;
}

export function detectMapping(headers: string[]): { mapping: Partial<Record<Field, number>>; confident: boolean } {
  const mapping: Partial<Record<Field, number>> = {};
  headers.forEach((h, i) => {
    const t = h.trim();
    for (const f of Object.keys(SYNONYMS) as Field[]) if (mapping[f] == null && SYNONYMS[f].test(t)) { mapping[f] = i; break; }
  });
  const confident = FIELDS.filter((f) => f.required).every((f) => mapping[f.key] != null);
  return { mapping, confident };
}

export interface ImportedTrade {
  instrument: string; direction: "long" | "short"; entry: number; exit_price: number | null;
  quantity: number | null; trade_date: string; closed_at: string | null; pnl: number | null; external_id: string;
}

const num = (s: string | undefined) => { if (s == null) return null; const n = Number(s.replace(/[^0-9.\-]/g, "")); return s.trim() && Number.isFinite(n) ? n : null; };
const sideOf = (s: string) => (/short|sell/i.test(s) ? "short" : "long") as "long" | "short";
const isExit = (s: string) => /exit|close/i.test(s);
const dateOf = (s: string) => { const d = new Date(s.replace(" ", "T")); return isNaN(+d) ? null : d; };

export function toTrades(rows: string[][], m: Partial<Record<Field, number>>): ImportedTrade[] {
  const g = (r: string[], f: Field) => (m[f] == null ? undefined : r[m[f]!]?.trim());
  let pairs: { open: string[]; close?: string[] }[];
  if (m.tradeNo != null) {
    // Strategy tester format: entry and exit on separate rows sharing a trade number.
    const byNo = new Map<string, { open?: string[]; close?: string[] }>();
    for (const r of rows) { const k = g(r, "tradeNo") ?? ""; const e = byNo.get(k) ?? {}; if (isExit(g(r, "side") ?? "")) e.close = r; else e.open = r; byNo.set(k, e); }
    pairs = [...byNo.values()].filter((p) => p.open).map((p) => ({ open: p.open!, ...(p.close ? { close: p.close } : {}) }));
  } else pairs = rows.map((r) => ({ open: r }));
  const out: ImportedTrade[] = [];
  for (const { open, close } of pairs) {
    const symbol = g(open, "symbol") ?? (m.symbol == null ? "UNKNOWN" : undefined);
    const entry = num(g(open, "entry")); const t = dateOf(g(open, "time") ?? "");
    if (!symbol || entry == null || !t) continue;
    const exit = close ? num(g(close, "entry")) ?? num(g(close, "exit")) : num(g(open, "exit"));
    const ct = close ? dateOf(g(close, "time") ?? "") : dateOf(g(open, "closeTime") ?? "");
    const pnl = num(g(close ?? open, "pnl"));
    const trade: ImportedTrade = {
      instrument: symbol.split(":").pop()!.toUpperCase(), direction: sideOf(g(open, "side") ?? ""), entry,
      exit_price: exit, quantity: num(g(open, "qty")), trade_date: t.toISOString().slice(0, 10),
      closed_at: ct ? ct.toISOString() : null, pnl, external_id: "",
    };
    trade.external_id = ["tv", trade.instrument, t.toISOString(), entry, exit ?? "", trade.direction].join("|");
    out.push(trade);
  }
  return out;
}

/** R = P/L divided by the risk amount the user enters per trade. */
export const rFromPnl = (pnl: number | null, risk: number) => (pnl == null || !(risk > 0) ? 0 : Math.round((pnl / risk) * 100) / 100);
