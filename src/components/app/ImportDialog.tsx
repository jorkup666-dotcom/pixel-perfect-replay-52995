import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { FIELDS, detectMapping, parseCsv, rFromPnl, toTrades, type Field } from "@/lib/csv-import";
import type { Trade } from "@/lib/trades";

export function ImportDialog({ open, onOpenChange, existing }: { open: boolean; onOpenChange: (o: boolean) => void; existing: Trade[] }) {
  const qc = useQueryClient();
  const [rows, setRows] = useState<string[][] | null>(null);
  const [mapping, setMapping] = useState<Partial<Record<Field, number>>>({});
  const [showMap, setShowMap] = useState(false);
  const [risk, setRisk] = useState("100");
  const [busy, setBusy] = useState(false);

  const headers = rows?.[0] ?? [];
  const trades = useMemo(() => (rows ? toTrades(rows.slice(1), mapping) : []), [rows, mapping]);
  const known = new Set(existing.map((t) => t.external_id).filter(Boolean));
  const fresh = trades.filter((t, i) => !known.has(t.external_id) && trades.findIndex((x) => x.external_id === t.external_id) === i);

  async function onFile(f: File) {
    const r = parseCsv(await f.text());
    if (r.length < 2) { toast.error("This file has no rows"); return; }
    const d = detectMapping(r[0]!);
    setRows(r); setMapping(d.mapping); setShowMap(!d.confident);
  }

  async function save() {
    const riskN = Number(risk);
    if (!(riskN > 0)) { toast.error("Enter your risk per trade to calculate R"); return; }
    setBusy(true);
    const payload = fresh.map((t) => ({
      ...t, source: "tradingview", session: "Other", setup_type: "Imported", timeframe: "—",
      stop_loss: null, result_r: rFromPnl(t.pnl, riskN),
    }));
    const { error } = await supabase.from("trades").upsert(payload, { onConflict: "user_id,external_id", ignoreDuplicates: true });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${payload.length} trades imported, ${trades.length - payload.length} duplicates skipped`);
    qc.invalidateQueries({ queryKey: ["trades"] });
    setRows(null); onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) setRows(null); onOpenChange(o); }}>
      <DialogContent className="max-h-[92vh] max-w-3xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Import trades from TradingView</DialogTitle>
          <DialogDescription>Upload a CSV exported from TradingView (trade history, paper trading or strategy tester list of trades).</DialogDescription>
        </DialogHeader>
        <Input type="file" accept=".csv,text/csv" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        {rows && (
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">{showMap ? "We couldn't match every column. Check the mapping:" : "Columns detected automatically."}</span>
              <button className="text-xs text-cyan hover:underline" onClick={() => setShowMap(!showMap)}>{showMap ? "Hide mapping" : "Edit mapping"}</button>
            </div>
            {showMap && (
              <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
                {FIELDS.map((f) => (
                  <div key={f.key} className="space-y-1">
                    <Label className="text-xs text-muted-foreground">{f.label}{f.required && " *"}</Label>
                    <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={mapping[f.key] ?? ""}
                      onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value === "" ? undefined : Number(e.target.value) }))}>
                      <option value="">— none —</option>
                      {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
                    </select>
                  </div>
                ))}
              </div>
            )}
            <div className="flex items-end gap-3">
              <div className="space-y-1"><Label htmlFor="risk" className="text-xs text-muted-foreground">Risk per trade (to calculate R)</Label>
                <Input id="risk" className="w-32" inputMode="decimal" value={risk} onChange={(e) => setRisk(e.target.value)} /></div>
              <p className="pb-2 text-xs text-muted-foreground">{trades.length} trades found · {fresh.length} new · {trades.length - fresh.length} duplicates</p>
            </div>
            <div className="max-h-64 overflow-auto rounded-md border">
              <table className="w-full text-xs">
                <thead className="sticky top-0 bg-card text-left text-muted-foreground"><tr>{["Date", "Symbol", "Dir", "Entry", "Exit", "Qty", "P/L", "R", ""].map((h) => <th key={h} className="px-2 py-1.5">{h}</th>)}</tr></thead>
                <tbody className="divide-y">{trades.slice(0, 200).map((t, i) => {
                  const dup = !fresh.includes(t);
                  return (<tr key={i} className={dup ? "opacity-40" : ""}>
                    <td className="num px-2 py-1">{t.trade_date}</td><td className="px-2">{t.instrument}</td><td className="px-2">{t.direction}</td>
                    <td className="num px-2">{t.entry}</td><td className="num px-2">{t.exit_price ?? "—"}</td><td className="num px-2">{t.quantity ?? "—"}</td>
                    <td className={`num px-2 ${(t.pnl ?? 0) >= 0 ? "text-success" : "text-loss"}`}>{t.pnl ?? "—"}</td>
                    <td className="num px-2">{rFromPnl(t.pnl, Number(risk))}</td><td className="px-2">{dup ? "duplicate" : ""}</td></tr>);
                })}</tbody>
              </table>
            </div>
          </div>
        )}
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button variant="hero" disabled={!fresh.length || busy} onClick={save}>{busy ? "Importing…" : `Import ${fresh.length} trades`}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
