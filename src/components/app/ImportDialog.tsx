import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { UploadCloud } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { FIELDS, detectMapping, parseCsv, rFromPnl, toTrades, type Field } from "@/lib/csv-import";
import { riskAmount, usePrefs } from "@/lib/prefs";
import type { Trade } from "@/lib/trades";
import { cn } from "@/lib/utils";

export function ImportDialog({ open, onOpenChange, existing }: { open: boolean; onOpenChange: (o: boolean) => void; existing: Trade[] }) {
  const qc = useQueryClient();
  const prefs = usePrefs();
  const [rows, setRows] = useState<string[][] | null>(null);
  const [fileName, setFileName] = useState("");
  const [mapping, setMapping] = useState<Partial<Record<Field, number | undefined>>>({});
  const [needsMap, setNeedsMap] = useState(false);
  const [drag, setDrag] = useState(false);
  const [busy, setBusy] = useState(false);

  const trades = useMemo(() => (rows ? toTrades(rows.slice(1), mapping) : []), [rows, mapping]);
  const known = new Set(existing.map((t) => t.external_id).filter(Boolean));
  const fresh = trades.filter((t, i) => !known.has(t.external_id) && trades.findIndex((x) => x.external_id === t.external_id) === i);
  const risk = riskAmount(prefs);

  async function onFile(f: File) {
    const r = parseCsv(await f.text());
    if (r.length < 2) { toast.error("Dit bestand bevat geen trades"); return; }
    const d = detectMapping(r[0]!);
    setFileName(f.name); setRows(r); setMapping(d.mapping); setNeedsMap(!d.confident);
  }

  function reset() { setRows(null); setFileName(""); setNeedsMap(false); }

  async function save() {
    setBusy(true);
    const payload = fresh.map((t) => ({
      ...t, source: "tradingview", session: "Other", setup_type: "Imported", timeframe: "—",
      stop_loss: null, result_r: rFromPnl(t.pnl, risk),
    }));
    const { error } = await supabase.from("trades").upsert(payload, { onConflict: "user_id,external_id", ignoreDuplicates: true });
    setBusy(false);
    if (error) { toast.error(error.message); return; }
    toast.success(`${payload.length} trades geïmporteerd`);
    qc.invalidateQueries({ queryKey: ["trades"] });
    reset(); onOpenChange(false);
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); onOpenChange(o); }}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Importeer trades uit TradingView</DialogTitle>
          <DialogDescription asChild>
            <ol className="list-decimal space-y-1 pl-5 text-sm">
              <li>Open in TradingView het <b>Trading Panel</b> onderaan (bijv. Paper Trading).</li>
              <li>Ga naar het tabblad <b>History</b> (of <b>List of trades</b> in de Strategy Tester).</li>
              <li>Klik op het menu (⋯) → <b>Export data</b> en sleep het CSV-bestand hieronder.</li>
            </ol>
          </DialogDescription>
        </DialogHeader>

        <label
          onDragOver={(e) => { e.preventDefault(); setDrag(true); }}
          onDragLeave={() => setDrag(false)}
          onDrop={(e) => { e.preventDefault(); setDrag(false); const f = e.dataTransfer.files[0]; if (f) onFile(f); }}
          className={cn("flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed p-8 text-center transition-colors",
            drag ? "border-primary bg-primary/10" : "border-border hover:border-primary/60")}>
          <UploadCloud className="h-10 w-10 text-cyan" />
          <span className="font-medium">{fileName || "Sleep je TradingView-bestand hierheen"}</span>
          <span className="text-xs text-muted-foreground">{rows ? `${trades.length} trades gevonden · ${fresh.length} nieuw · ${trades.length - fresh.length} duplicaten` : "of klik om een CSV-bestand te kiezen"}</span>
          <input type="file" accept=".csv,text/csv" className="sr-only" onChange={(e) => e.target.files?.[0] && onFile(e.target.files[0])} />
        </label>

        {rows && needsMap && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Een paar kolommen konden we niet herkennen. Kies ze hieronder:</p>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
              {FIELDS.filter((f) => f.required).map((f) => (
                <div key={f.key} className="space-y-1">
                  <Label className="text-xs text-muted-foreground">{f.label}</Label>
                  <select className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={mapping[f.key] ?? ""}
                    onChange={(e) => setMapping((m) => ({ ...m, [f.key]: e.target.value === "" ? undefined : Number(e.target.value) }))}>
                    <option value="">— kies —</option>
                    {(rows[0] ?? []).map((h, i) => <option key={i} value={i}>{h}</option>)}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {rows && fresh.length > 0 && (
          <p className="text-xs text-muted-foreground">R wordt berekend met je risico per trade uit Settings ({prefs.currency} {risk.toFixed(2)}).</p>
        )}

        <DialogFooter>
          <Button variant="hero" size="lg" className="w-full" disabled={!fresh.length || busy} onClick={save}>
            {busy ? "Bezig…" : "Importeer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
