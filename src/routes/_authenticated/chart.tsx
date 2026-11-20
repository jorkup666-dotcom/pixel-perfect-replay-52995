import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef } from "react";
import { Watchlist } from "@/components/watchlist/Watchlist";
import { usePrefs } from "@/lib/prefs";

export const Route = createFileRoute("/_authenticated/chart")({
  validateSearch: (s: Record<string, unknown>) => ({
    symbol: typeof s["symbol"] === "string" ? (s["symbol"] as string) : undefined,
    interval: typeof s["interval"] === "string" ? (s["interval"] as string) : undefined,
  }),
  head: () => ({ meta: [{ title: "Chart – TradeKit" }, { name: "description", content: "TradingView chart inside TradeKit." }] }),
  component: ChartPage,
});

function ChartPage() {
  const prefs = usePrefs();
  const search = Route.useSearch();
  const symbol = search.symbol ?? prefs.chartSymbol;
  const interval = search.interval ?? prefs.chartInterval;
  const navigate = useNavigate({ from: "/chart" });
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current; if (!el) return;
    el.innerHTML = '<div class="tradingview-widget-container__widget" style="height:100%;width:100%"></div>';
    const s = document.createElement("script");
    s.src = "https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js";
    s.async = true;
    s.innerHTML = JSON.stringify({
      autosize: true, symbol, interval, timezone: prefs.timezone, theme: "dark", style: "1", locale: "en",
      hide_top_toolbar: true, allow_symbol_change: false,
    });
    el.appendChild(s);
  }, [symbol, interval, prefs.timezone]);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-3">
      <div ref={ref} className="tradingview-widget-container min-h-0 flex-1 overflow-hidden rounded-md border" />
      <Watchlist active={symbol} onSelect={(tv) => navigate({ search: { symbol: tv, interval: search.interval } })} />
    </div>
  );
}
