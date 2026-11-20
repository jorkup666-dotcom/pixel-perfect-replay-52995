import { describe, expect, it } from "vitest";
import { DEFAULT_PREFS, formatDate, riskAmount } from "./prefs";

describe("prefs", () => {
  it("risk as percent of account", () => {
    expect(riskAmount({ ...DEFAULT_PREFS, riskMode: "percent", riskValue: 1, accountSize: 10000 })).toBe(100);
  });
  it("risk as fixed amount", () => {
    expect(riskAmount({ ...DEFAULT_PREFS, riskMode: "amount", riskValue: 250 })).toBe(250);
  });
  it("default chart timeframe is 15m", () => expect(DEFAULT_PREFS.chartInterval).toBe("15"));
  it("formats dates", () => {
    expect(formatDate("2026-03-02", { ...DEFAULT_PREFS, dateFormat: "dd-mm-yyyy" })).toBe("02-03-2026");
  });
});
