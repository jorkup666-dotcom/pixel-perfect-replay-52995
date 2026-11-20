import { describe, expect, it } from "vitest";
import { detectMapping, parseCsv, rFromPnl, toTrades } from "./csv-import";

describe("csv import", () => {
  it("detects a simple trade export and builds trades", () => {
    const rows = parseCsv("Symbol,Side,Qty,Fill Price,Exit Price,Time,Profit\nCME_MINI:NQ1!,Buy,1,18000,18050,2026-03-02 10:05,1000\n");
    const { mapping, confident } = detectMapping(rows[0]!);
    expect(confident).toBe(true);
    const t = toTrades(rows.slice(1), mapping);
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ instrument: "NQ1!", direction: "long", entry: 18000, exit_price: 18050, pnl: 1000, trade_date: "2026-03-02" });
  });
  it("pairs strategy-tester entry/exit rows by trade number", () => {
    const rows = parseCsv("Trade #,Type,Signal,Date/Time,Price USD,Contracts,Profit USD\n1,Exit short,x,2026-03-02 11:00,4990,1,500\n1,Entry short,x,2026-03-02 10:00,5000,1,500\n");
    const { mapping } = detectMapping(rows[0]!);
    const t = toTrades(rows.slice(1), (({ symbol: _s, ...rest }) => rest)(mapping));
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ direction: "short", entry: 5000, exit_price: 4990, pnl: 500 });
  });
  it("same row twice gives the same id so duplicates are skipped", () => {
    const rows = parseCsv("Symbol,Side,Fill Price,Time\nES,Sell,5000,2026-01-01 09:00\nES,Sell,5000,2026-01-01 09:00");
    const t = toTrades(rows.slice(1), detectMapping(rows[0]!).mapping);
    expect(t[0]!.external_id).toBe(t[1]!.external_id);
  });
  it("converts P/L to R with the given risk", () => {
    expect(rFromPnl(300, 100)).toBe(3);
    expect(rFromPnl(-100, 100)).toBe(-1);
  });
});

describe("csv import – TradingView paper trading", () => {
  it("skips cancelled orders and reads headers with units", () => {
    const rows = parseCsv("Symbol,Side,Type,Qty,Fill Price,Status,Placing Time,Profit (USD)\nFX:EURUSD,Sell,Market,1000,1.0850,Filled,2026-04-01 08:00:00,12.5\nFX:EURUSD,Buy,Limit,1000,,Cancelled,2026-04-01 09:00:00,\n");
    const { mapping, confident } = detectMapping(rows[0]!);
    expect(confident).toBe(true);
    const t = toTrades(rows.slice(1), mapping);
    expect(t).toHaveLength(1);
    expect(t[0]).toMatchObject({ instrument: "EURUSD", direction: "short", pnl: 12.5 });
  });
});
