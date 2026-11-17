import { describe, expect, it } from "vitest";
import { computeStats, equityCurve, monthlyPerformance, maxDrawdown } from "./trade-stats";

const t = (trade_date: string, result_r: number) => ({
  trade_date, result_r, setup_type: "x", session: "London", instrument: "EURUSD", direction: "long",
});

describe("trade stats", () => {
  it("returns empty stats without fabricated numbers", () => {
    const s = computeStats([]);
    expect(s.totalTrades).toBe(0);
    expect(s.winRate).toBeNull();
    expect(s.profitFactor).toBeNull();
  });
  it("profit factor only when both wins and losses exist", () => {
    expect(computeStats([t("2026-01-01", 2), t("2026-01-02", 1)]).profitFactor).toBeNull();
    expect(computeStats([t("2026-01-01", 3), t("2026-01-02", -1), t("2026-01-03", -1)]).profitFactor).toBe(1.5);
  });
  it("computes win rate, avg, total, best, worst", () => {
    const s = computeStats([t("2026-01-01", 2), t("2026-01-02", -1), t("2026-01-03", 0), t("2026-01-04", 3)]);
    expect(s.winRate).toBe(50);
    expect(s.totalR).toBe(4);
    expect(s.avgR).toBe(1);
    expect(s.bestR).toBe(3);
    expect(s.worstR).toBe(-1);
  });
  it("equity curve is cumulative by date", () => {
    const c = equityCurve([t("2026-01-03", 2), t("2026-01-01", -1)]);
    expect(c.map((p) => p.equity)).toEqual([-1, 1]);
  });
  it("groups months and computes drawdown", () => {
    const ts = [t("2026-01-05", 2), t("2026-01-09", -3), t("2026-02-01", 1)];
    expect(monthlyPerformance(ts).map((m) => [m.month, m.totalR])).toEqual([["2026-01", -1], ["2026-02", 1]]);
    expect(maxDrawdown(ts)).toBe(-3);
  });
});
