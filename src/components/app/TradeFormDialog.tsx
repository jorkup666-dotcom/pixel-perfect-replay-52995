import * as React from "react";
import { useEffect, useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { ICT_CONCEPTS, SESSIONS, SETUP_TYPES, TIMEFRAMES } from "@/lib/ict";
import { tradeFormSchema, uploadScreenshot, type Trade, type TradeFormValues } from "@/lib/trades";
import { cn } from "@/lib/utils";

const empty = (): TradeFormValues => ({
  trade_date: new Date().toISOString().slice(0, 10), instrument: "", session: "", direction: "long",
  entry: "", stop_loss: "", take_profit: "", exit_price: "", result_r: "", setup_type: "",
  timeframe: "", notes: "", ict_concepts: [],
});

const fromTrade = (t: Trade): TradeFormValues => ({
  trade_date: t.trade_date, instrument: t.instrument, session: t.session,
  direction: t.direction as "long" | "short", entry: String(t.entry), stop_loss: String(t.stop_loss),
  take_profit: t.take_profit == null ? "" : String(t.take_profit),
  exit_price: t.exit_price == null ? "" : String(t.exit_price), result_r: String(t.result_r),
  setup_type: t.setup_type, timeframe: t.timeframe, notes: t.notes ?? "", ict_concepts: t.ict_concepts ?? [],
});

function Field({ id, label, error, children }: { id: string; label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs text-muted-foreground">{label}</Label>
      {children}
      {error && <p className="text-xs text-loss">{error}</p>}
    </div>
  );
}

export function TradeFormDialog({ open, onOpenChange, trade }: { open: boolean; onOpenChange: (o: boolean) => void; trade?: Trade | null }) {
  const qc = useQueryClient();
  const [v, setV] = useState<TradeFormValues>(empty());
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [file, setFile] = useState<File | null>(null);
  const [removeShot, setRemoveShot] = useState(false);

  useEffect(() => {
    if (open) { setV(trade ? fromTrade(trade) : empty()); setErrors({}); setFile(null); setRemoveShot(false); }
  }, [open, trade]);

  const set = <K extends keyof TradeFormValues>(k: K, val: TradeFormValues[K]) => setV((p) => ({ ...p, [k]: val }));

  // Suggest R from entry/stop/exit when the user hasn't typed one.
  const suggestedR = (() => {
    const e = Number(v.entry), s = Number(v.stop_loss), x = Number(v.exit_price);
    if (!v.entry || !v.stop_loss || !v.exit_price || e === s) return null;
    const risk = Math.abs(e - s);
    const r = (v.direction === "long" ? x - e : e - x) / risk;
    return Number.isFinite(r) ? Math.round(r * 100) / 100 : null;
  })();

  const save = useMutation({
    mutationFn: async () => {
      const parsed = tradeFormSchema.safeParse(v);
      if (!parsed.success) {
        const errs: Record<string, string> = {};
        parsed.error.issues.forEach((i) => (errs[String(i.path[0])] = i.message));
        setErrors(errs);
        throw new Error("validation");
      }
      const d = parsed.data;
      if (d.direction === "long" && Number(d.stop_loss) >= Number(d.entry)) {
        setErrors({ stop_loss: "For a long, stop loss must be below entry" }); throw new Error("validation");
      }
      if (d.direction === "short" && Number(d.stop_loss) <= Number(d.entry)) {
        setErrors({ stop_loss: "For a short, stop loss must be above entry" }); throw new Error("validation");
      }
      let screenshot_path = removeShot ? null : trade?.screenshot_path ?? null;
      if (file) {
        if (file.size > 10 * 1024 * 1024) { setErrors({ screenshot: "Max 10 MB" }); throw new Error("validation"); }
        screenshot_path = await uploadScreenshot(file);
      }
      const row = {
        trade_date: d.trade_date, instrument: d.instrument.toUpperCase(), session: d.session, direction: d.direction,
        entry: Number(d.entry), stop_loss: Number(d.stop_loss),
        take_profit: d.take_profit ? Number(d.take_profit) : null, exit_price: d.exit_price ? Number(d.exit_price) : null,
        result_r: Number(d.result_r), setup_type: d.setup_type, timeframe: d.timeframe,
        notes: d.notes?.trim() || null, ict_concepts: d.ict_concepts, screenshot_path,
      };
      const { error } = trade
        ? await supabase.from("trades").update(row).eq("id", trade.id)
        : await supabase.from("trades").insert(row);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["trades"] });
      toast.success(trade ? "Trade updated" : "Trade added");
      onOpenChange(false);
    },
    onError: (e) => { if (e.message !== "validation") toast.error(e.message); },
  });

  const sel = (k: "session" | "setup_type" | "timeframe", opts: string[]) => (
    <Select value={v[k]} onValueChange={(x) => set(k, x)}>
      <SelectTrigger id={k}><SelectValue placeholder="Select" /></SelectTrigger>
      <SelectContent>{opts.map((o) => <SelectItem key={o} value={o}>{o}</SelectItem>)}</SelectContent>
    </Select>
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] max-w-2xl overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{trade ? "Edit trade" : "Add trade"}</DialogTitle>
          <DialogDescription>Record what actually happened. Results are entered in R multiples.</DialogDescription>
        </DialogHeader>
        <form className="grid grid-cols-2 gap-4 md:grid-cols-3" onSubmit={(e) => { e.preventDefault(); save.mutate(); }}>
          <Field id="trade_date" error={errors.trade_date} label="Date"><Input id="trade_date" type="date" value={v.trade_date} onChange={(e) => set("trade_date", e.target.value)} /></Field>
          <Field id="instrument" error={errors.instrument} label="Instrument"><Input id="instrument" placeholder="e.g. NQ, EURUSD" value={v.instrument} onChange={(e) => set("instrument", e.target.value)} /></Field>
          <Field id="session" error={errors.session} label="Session">{sel("session", SESSIONS)}</Field>
          <Field id="direction" error={errors.direction} label="Direction">
            <div className="grid grid-cols-2 gap-1 rounded-md border p-1">
              {(["long", "short"] as const).map((d) => (
                <button type="button" key={d} onClick={() => set("direction", d)}
                  className={cn("rounded px-2 py-1 text-sm capitalize transition-colors",
                    v.direction === d ? (d === "long" ? "bg-success/20 text-success" : "bg-loss/20 text-loss") : "text-muted-foreground hover:bg-muted")}>{d}</button>
              ))}
            </div>
          </Field>
          <Field id="setup_type" error={errors.setup_type} label="Setup type">{sel("setup_type", SETUP_TYPES)}</Field>
          <Field id="timeframe" error={errors.timeframe} label="Timeframe">{sel("timeframe", TIMEFRAMES)}</Field>
          <Field id="entry" error={errors.entry} label="Entry"><Input id="entry" inputMode="decimal" value={v.entry} onChange={(e) => set("entry", e.target.value)} /></Field>
          <Field id="stop_loss" error={errors.stop_loss} label="Stop loss"><Input id="stop_loss" inputMode="decimal" value={v.stop_loss} onChange={(e) => set("stop_loss", e.target.value)} /></Field>
          <Field id="take_profit" error={errors.take_profit} label="Take profit (optional)"><Input id="take_profit" inputMode="decimal" value={v.take_profit} onChange={(e) => set("take_profit", e.target.value)} /></Field>
          <Field id="exit_price" error={errors.exit_price} label="Exit (optional)"><Input id="exit_price" inputMode="decimal" value={v.exit_price} onChange={(e) => set("exit_price", e.target.value)} /></Field>
          <Field id="result_r" error={errors.result_r} label="Result (R)">
            <Input id="result_r" inputMode="decimal" placeholder="e.g. 2 or -1" value={v.result_r} onChange={(e) => set("result_r", e.target.value)} />
            {suggestedR != null && String(suggestedR) !== v.result_r && (
              <button type="button" className="text-xs text-cyan hover:underline" onClick={() => set("result_r", String(suggestedR))}>
                Use calculated {suggestedR}R
              </button>
            )}
          </Field>
          <Field id="screenshot" error={errors.screenshot} label="Screenshot">
            <Input id="screenshot" type="file" accept="image/*" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
            {trade?.screenshot_path && !file && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground">
                <input type="checkbox" checked={removeShot} onChange={(e) => setRemoveShot(e.target.checked)} /> Remove current
              </label>
            )}
          </Field>
          <div className="col-span-full space-y-2">
            <Label className="text-xs text-muted-foreground">ICT concepts present</Label>
            <div className="flex flex-wrap gap-2">
              {ICT_CONCEPTS.map((c) => {
                const on = v.ict_concepts.includes(c.key);
                return (
                  <button type="button" key={c.key}
                    onClick={() => set("ict_concepts", on ? v.ict_concepts.filter((x) => x !== c.key) : [...v.ict_concepts, c.key])}
                    className={cn("rounded-full border px-3 py-1 text-xs transition-colors",
                      on ? "border-cyan bg-cyan/15 text-cyan" : "text-muted-foreground hover:border-cyan/50")}>
                    {c.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="col-span-full">
            <Field id="notes" error={errors.notes} label="Notes"><Textarea id="notes" rows={4} placeholder="Context, execution, emotions, lessons…" value={v.notes} onChange={(e) => set("notes", e.target.value)} /></Field>
          </div>
          <DialogFooter className="col-span-full">
            <Button type="button" variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button type="submit" variant="hero" disabled={save.isPending}>{save.isPending ? "Saving…" : trade ? "Save changes" : "Add trade"}</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
