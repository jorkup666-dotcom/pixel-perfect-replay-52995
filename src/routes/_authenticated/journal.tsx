import { createFileRoute } from "@tanstack/react-router";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useMemo, useState } from "react";
import { toast } from "sonner";
import { BookOpen, Download, Image, Pencil, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { EmptyState, PageHeader, Panel, RValue } from "@/components/app/ui";
import { TradeFormDialog } from "@/components/app/TradeFormDialog";
import { supabase } from "@/integrations/supabase/client";
import { downloadCsv, signedScreenshotUrl, tradesQuery, type Trade } from "@/lib/trades";

export const Route = createFileRoute("/_authenticated/journal")({
  head: () => ({ meta: [{ title: "Trade Journal – TradeKit" }, { name: "description", content: "Add, edit, filter and export your trades." }] }),
  component: Journal,
});

function Journal() {
  const qc = useQueryClient();
  const { data: trades = [], isLoading } = useQuery(tradesQuery);
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<Trade | null>(null);
  const [q, setQ] = useState(""); const [inst, setInst] = useState("all"); const [setup, setSetup] = useState("all");
  const [from, setFrom] = useState(""); const [to, setTo] = useState("");
  const instruments = [...new Set(trades.map((t) => t.instrument))];
  const setups = [...new Set(trades.map((t) => t.setup_type))];
  const filtered = useMemo(() => trades.filter((t) =>
    (inst === "all" || t.instrument === inst) && (setup === "all" || t.setup_type === setup) &&
    (!from || t.trade_date >= from) && (!to || t.trade_date <= to) &&
    (!q || `${t.instrument} ${t.setup_type} ${t.notes ?? ""} ${t.session}`.toLowerCase().includes(q.toLowerCase()))), [trades, q, inst, setup, from, to]);
  const del = useMutation({
    mutationFn: async (t: Trade) => {
      if (t.screenshot_path) await supabase.storage.from("screenshots").remove([t.screenshot_path]);
      const { error } = await supabase.from("trades").delete().eq("id", t.id); if (error) throw error;
    },
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["trades"] }); toast.success("Trade deleted"); },
    onError: (e) => toast.error(e.message),
  });
  const openShot = async (p: string) => { const u = await signedScreenshotUrl(p); if (u) window.open(u, "_blank"); };
  return (
    <>
      <PageHeader title="Trade Journal" subtitle={`${filtered.length} of ${trades.length} trades`} actions={<>
        <Button variant="outline" disabled={!filtered.length} onClick={() => downloadCsv(filtered)}><Download /> Export CSV</Button>
        <Button variant="hero" onClick={() => { setEditing(null); setOpen(true); }}><Plus /> Add trade</Button></>} />
      <Panel className="mb-4"><div className="grid gap-3 md:grid-cols-5">
        <Input placeholder="Search…" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={inst} onValueChange={setInst}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All instruments</SelectItem>{instruments.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>
        <Select value={setup} onValueChange={setSetup}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All setups</SelectItem>{setups.map((i) => <SelectItem key={i} value={i}>{i}</SelectItem>)}</SelectContent></Select>
        <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
        <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
      </div></Panel>
      <Panel>
        {!isLoading && filtered.length === 0 ? (
          <EmptyState icon={BookOpen} title={trades.length ? "No matching trades" : "Your journal is empty"} body={trades.length ? "Adjust the filters to see more trades." : "Log your first trade to start building your record."} />
        ) : (
          <div className="overflow-x-auto"><table className="w-full text-sm">
            <thead className="text-left text-xs uppercase text-muted-foreground"><tr>{["Date", "Instrument", "Session", "Dir", "Setup", "TF", "Entry", "SL", "Result", ""].map((h) => <th key={h} className="px-2 py-2 font-medium">{h}</th>)}</tr></thead>
            <tbody className="divide-y">{filtered.map((t) => (
              <tr key={t.id} className="hover:bg-muted/40">
                <td className="num px-2 py-2.5">{t.trade_date}</td><td className="px-2 font-medium">{t.instrument}</td><td className="px-2">{t.session}</td>
                <td className={t.direction === "long" ? "px-2 text-success" : "px-2 text-loss"}>{t.direction}</td><td className="px-2">{t.setup_type}</td><td className="px-2">{t.timeframe}</td>
                <td className="num px-2">{t.entry}</td><td className="num px-2">{t.stop_loss}</td><td className="px-2"><RValue r={t.result_r} /></td>
                <td className="whitespace-nowrap px-2 text-right">
                  {t.screenshot_path && <Button size="icon" variant="ghost" aria-label="Screenshot" onClick={() => openShot(t.screenshot_path!)}><Image /></Button>}
                  <Button size="icon" variant="ghost" aria-label="Edit" onClick={() => { setEditing(t); setOpen(true); }}><Pencil /></Button>
                  <Button size="icon" variant="ghost" aria-label="Delete" onClick={() => confirm("Delete this trade?") && del.mutate(t)}><Trash2 /></Button>
                </td></tr>))}</tbody></table></div>
        )}
      </Panel>
      <TradeFormDialog open={open} onOpenChange={setOpen} trade={editing} />
    </>
  );
}
