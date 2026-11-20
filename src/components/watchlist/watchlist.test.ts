import { describe, expect, it, vi } from "vitest";
vi.mock("@/integrations/supabase/client", () => ({ supabase: {} }));
import { DEFAULT_WATCHLIST, migrateWatchlist } from "./Watchlist";

describe("watchlist", () => {
  it("default order", () => {
    expect(DEFAULT_WATCHLIST[0]!.items.map((i) => i.label)).toEqual(["USOIL", "XAUUSD", "XAGUSD", "NQ", "ES", "BTCUSD"]);
  });
  it("migrates GC1 and SI1 to XAUUSD and XAGUSD", () => {
    const out = migrateWatchlist([{ name: "F", items: [{ label: "GC", tv: "COMEX:GC1!", quote: "GC=F", color: "" }, { label: "SI", tv: "COMEX:SI1!", quote: "SI=F", color: "", flagged: true }] }]);
    expect(out[0]!.items.map((i) => i.tv)).toEqual(["OANDA:XAUUSD", "OANDA:XAGUSD"]);
    expect(out[0]!.items[1]!.flagged).toBe(true);
  });
});
