import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { BarChart3 } from "lucide-react";
import { EmptyState, PageHeader, Panel, RValue, StatCard } from "@/components/app/ui";
import { tradesQuery, fmtR } from "@/lib/trades";
import { groupStats, maxDrawdown, type StatTrade } from "@/lib/trade-stats";

export const Route = createFileRoute("/_authenticated/analytics")({
  head: () => ({ meta: [{ title: "Analytics – TradeKit" }, { name: "description", content: "Breakdowns of your results by setup, session and instrument." }] }),
  component: Analytics,
});

export function GroupTable({ rows }: { rows: ReturnType<typeof groupStats> }) {
  return (<table className="w-full text-sm"><thead className="text-left text-xs text-muted-foreground"><tr><th className="py-1">Name</th><th>Trades</th><th>Win %</th><th>Total</th></tr></thead>
    <tbody className="divide-y">{rows.map((r) => <tr key={r.name}><td className="py-2">{r.name}</td><td className="num">{r.totalTrades}</td><td className="num">{r.winRate}%</td><td><RValue r={r.totalR} /></td></tr>)}</tbody></table>);
}

function Analytics() {
  const { data: trades = [] } = useQuery(tradesQuery);
  if (!trades.length) return (<><PageHeader title="Analytics" /><Panel><EmptyState icon={BarChart3} title="Not enough data" body="Analytics appear once you record trades." /></Panel></>);
  const wd = (t: StatTrade) => ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"][new Date(t.trade_date + "T00:00:00").getDay()]!;
  return (<>
    <PageHeader title="Analytics" subtitle="Where your results come from." />
    <div className="mb-6 grid grid-cols-2 gap-4 md:grid-cols-4"><StatCard label="Max drawdown" value={fmtR(maxDrawdown(trades))} tone="neg" /></div>
    <div className="grid gap-6 lg:grid-cols-2">
      <Panel title="By setup"><GroupTable rows={groupStats(trades, (t) => t.setup_type)} /></Panel>
      <Panel title="By session"><GroupTable rows={groupStats(trades, (t) => t.session)} /></Panel>
      <Panel title="By instrument"><GroupTable rows={groupStats(trades, (t) => t.instrument)} /></Panel>
      <Panel title="By direction"><GroupTable rows={groupStats(trades, (t) => t.direction)} /></Panel>
      <Panel title="By weekday"><GroupTable rows={groupStats(trades, wd)} /></Panel>
    </div></>);
}
