import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { Area, AreaChart, Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { BookOpen, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Panel, RValue, StatCard } from "@/components/app/ui";
import { TradeFormDialog } from "@/components/app/TradeFormDialog";
import { tradesQuery, fmtR } from "@/lib/trades";
import { computeStats, equityCurve, monthlyPerformance } from "@/lib/trade-stats";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({ meta: [{ title: "Dashboard – TradeKit" }, { name: "description", content: "Your TradeKit performance overview." }] }),
  component: Dashboard,
});

const tip = { contentStyle: { background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 8 } };

function Dashboard() {
  const { data: trades = [], isLoading } = useQuery(tradesQuery);
  const [open, setOpen] = useState(false);
  const s = computeStats(trades);
  const add = <Button variant="hero" onClick={() => setOpen(true)}><Plus /> Add trade</Button>;
  return (
    <>
      <PageHeader title="Dashboard" subtitle="Statistics calculated from your recorded trades." actions={add} />
      {!isLoading && trades.length === 0 ? (
        <Panel><EmptyState icon={BookOpen} title="No trades yet" body="Add your first trade to see win rate, R results and your equity curve." action={add} /></Panel>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
            <StatCard label="Total trades" value={s.totalTrades} hint={`${s.wins}W · ${s.losses}L · ${s.breakeven}BE`} />
            <StatCard label="Win rate" value={s.winRate == null ? "—" : `${s.winRate}%`} />
            <StatCard label="Profit factor" value={s.profitFactor ?? "—"} hint={s.profitFactor == null ? "Needs wins and losses" : undefined} />
            <StatCard label="Average R" value={fmtR(s.avgR)} tone={(s.avgR ?? 0) >= 0 ? "pos" : "neg"} />
            <StatCard label="Total R" value={fmtR(s.totalR)} tone={s.totalR >= 0 ? "pos" : "neg"} />
            <StatCard label="Best trade" value={fmtR(s.bestR)} tone="pos" />
            <StatCard label="Worst trade" value={fmtR(s.worstR)} tone="neg" />
          </div>
          <div className="grid gap-6 lg:grid-cols-2">
            <Panel title="Equity curve (R)">
              <div className="h-64"><ResponsiveContainer><AreaChart data={equityCurve(trades)}>
                <defs><linearGradient id="eq" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--cyan)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--cyan)" stopOpacity={0} /></linearGradient></defs>
                <CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="n" stroke="var(--muted-foreground)" fontSize={12} /><YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip {...tip} /><Area dataKey="equity" stroke="var(--cyan)" fill="url(#eq)" strokeWidth={2} />
              </AreaChart></ResponsiveContainer></div>
            </Panel>
            <Panel title="Monthly performance (R)">
              <div className="h-64"><ResponsiveContainer><BarChart data={monthlyPerformance(trades)}>
                <CartesianGrid stroke="var(--border)" vertical={false} /><XAxis dataKey="month" stroke="var(--muted-foreground)" fontSize={12} /><YAxis stroke="var(--muted-foreground)" fontSize={12} />
                <Tooltip {...tip} /><Bar dataKey="totalR" radius={[4, 4, 0, 0]}>{monthlyPerformance(trades).map((m) => <Cell key={m.month} fill={m.totalR >= 0 ? "var(--success)" : "var(--loss)"} />)}</Bar>
              </BarChart></ResponsiveContainer></div>
            </Panel>
          </div>
          <Panel title="Recent trades" actions={<Link to="/journal" className="text-xs text-cyan">View journal</Link>}>
            <div className="divide-y">{trades.slice(0, 6).map((t) => (
              <div key={t.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="num text-muted-foreground">{t.trade_date}</span><span className="font-medium">{t.instrument}</span>
                <span className="hidden text-muted-foreground sm:inline">{t.setup_type}</span><RValue r={t.result_r} />
              </div>))}</div>
          </Panel>
        </div>
      )}
      <TradeFormDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
