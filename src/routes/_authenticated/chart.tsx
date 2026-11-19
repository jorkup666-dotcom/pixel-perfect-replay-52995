import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";


const SYMBOLS = [
  ["FX:EURUSD", "EURUSD"], ["FX:GBPUSD", "GBPUSD"], ["CME_MINI:NQ1!", "NQ"], ["CME_MINI:ES1!", "ES"], ["BITSTAMP:BTCUSD", "BTCUSD"],
] as const;
const INTERVALS = [["1", "1m"], ["5", "5m"], ["15", "15m"], ["60", "1H"], ["240", "4H"], ["D", "1D"]] as const;

export const Route = createFileRoute("/_authenticated/chart")({
  validateSearch: (s: Record<string, unknown>) => ({
    symbol: typeof s["symbol"] === "string" ? (s["symbol"] as string) : undefined,
    interval: typeof s["interval"] === "string" ? (s["interval"] as string) : undefined,
  }),
  head: () => ({ meta: [{ title: "Chart – TradeKit" }, { name: "description", content: "TradingView chart inside TradeKit." }] }),
  component: ChartPage,
});

function ChartPage() {
  const { symbol = "FX:EURUSD", interval = "15" } = Route.useSearch();
  const navigate = useNavigate({ from: "/chart" });
  const theme = "dark";
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.innerHTML = '<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>';
    const s = document.createElement("script");
    s.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    s.async = true;
    s.innerHTML = JSON.stringify({ autosize: true, symbol, interval, timezone: "America/New_York", theme, style: "1", locale: "en", allow_symbol_change: true });
    el.appendChild(s);
  }, [symbol, interval, theme]);

  const set = (k: "symbol" | "interval", v: string) => navigate({ search: (p) => ({ ...p, [k]: v }) });
  return (
    <div className="flex h-[calc(100vh-8rem)] flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        <h1 className="mr-4 text-xl font-semibold">Chart</h1>
        <Select value={symbol} onValueChange={(v) => set("symbol", v)}>
          <SelectTrigger className="w-40"><SelectValue placeholder={symbol} /></SelectTrigger>
          <SelectContent>{SYMBOLS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={interval} onValueChange={(v) => set("interval", v)}>
          <SelectTrigger className="w-24"><SelectValue /></SelectTrigger>
          <SelectContent>{INTERVALS.map(([v, l]) => <SelectItem key={v} value={v}>{l}</SelectItem>)}</SelectContent>
        </Select>
      </div>
      <div ref={ref} className="tradingview-widget-container min-h-0 flex-1 overflow-hidden rounded-sm border" />
    </div>
  );
}
