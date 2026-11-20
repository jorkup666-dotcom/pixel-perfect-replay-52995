import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { PageHeader, Panel } from "@/components/app/ui";
import { DEFAULT_WATCHLIST, useSaveWatchlist, watchlistQuery, type WatchGroup } from "@/components/watchlist/Watchlist";
import { SymbolLogo } from "@/components/watchlist/SymbolLogo";
import { supabase } from "@/integrations/supabase/client";
import { clearPrefs, riskAmount, usePrefs, writePrefs, type Prefs } from "@/lib/prefs";
import { downloadCsv, tradesQuery } from "@/lib/trades";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings – TradeKit" }, { name: "description", content: "Account, chart, risk and data settings." }] }),
  component: Settings,
});

const INTERVALS = [["1", "1m"], ["5", "5m"], ["15", "15m"], ["60", "1H"], ["240", "4H"], ["D", "1D"]];
const TIMEZONES = ["America/New_York", "Europe/London", "Europe/Amsterdam", "UTC", "Asia/Tokyo"];
const ACCENTS = ["#2563EB", "#38BDF8", "#10B981", "#F59E0B", "#EF4444", "#A855F7"];

function Sel<T extends string>({ id, value, onChange, options }: { id: string; value: T; onChange: (v: T) => void; options: readonly (readonly [string, string])[] }) {
  return (
    <select id={id} className="h-9 w-full rounded-md border bg-background px-2 text-sm" value={value} onChange={(e) => onChange(e.target.value as T)}>
      {options.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
    </select>
  );
}

function Row({ label, htmlFor, children }: { label: string; htmlFor?: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label htmlFor={htmlFor} className="text-xs text-muted-foreground">{label}</Label>{children}</div>;
}

function Settings() {
  const { user } = Route.useRouteContext();
  const qc = useQueryClient();
  const p = usePrefs();
  const set = <K extends keyof Prefs>(k: K, v: Prefs[K]) => writePrefs({ [k]: v } as Partial<Prefs>);
  const { data: trades = [] } = useQuery(tradesQuery);
  const { data: groups = DEFAULT_WATCHLIST } = useQuery(watchlistQuery);
  const saveWl = useSaveWatchlist();
  const [newSym, setNewSym] = useState({ label: "", tv: "", quote: "" });
  const wl = groups[0] ?? { name: "FUTURES", items: [] };
  const setItems = (items: WatchGroup["items"]) => saveWl([{ ...wl, items }, ...groups.slice(1)]);

  async function wipeAll() {
    const shots = trades.map((t) => t.screenshot_path).filter(Boolean) as string[];
    if (shots.length) await supabase.storage.from("screenshots").remove(shots);
    const { error } = await supabase.from("trades").delete().eq("user_id", user.id);
    if (error) { toast.error(error.message); return; }
    await supabase.from("user_settings").delete().eq("user_id", user.id);
    clearPrefs();
    qc.invalidateQueries();
    toast.success("Alle gegevens zijn gewist");
  }

  return (
    <>
      <PageHeader title="Settings" subtitle="Preferences are saved in this browser." />
      <div className="grid gap-4 lg:grid-cols-2">
        <Panel title="Chart">
          <div className="grid grid-cols-2 gap-3">
            <Row label="Default symbol" htmlFor="sym"><Sel id="sym" value={p.chartSymbol} onChange={(v) => set("chartSymbol", v)} options={groups.flatMap((g) => g.items.map((i) => [i.tv, i.label] as const))} /></Row>
            <Row label="Default timeframe" htmlFor="tf"><Sel id="tf" value={p.chartInterval} onChange={(v) => set("chartInterval", v)} options={INTERVALS as [string, string][]} /></Row>
          </div>
        </Panel>

        <Panel title="Date & time">
          <div className="grid grid-cols-2 gap-3">
            <Row label="Time zone" htmlFor="tz"><Sel id="tz" value={p.timezone} onChange={(v) => set("timezone", v)} options={TIMEZONES.map((t) => [t, t] as const)} /></Row>
            <Row label="Date format" htmlFor="df"><Sel id="df" value={p.dateFormat} onChange={(v) => set("dateFormat", v)} options={[["yyyy-mm-dd", "2026-03-31"], ["dd-mm-yyyy", "31-03-2026"], ["mm/dd/yyyy", "03/31/2026"]] as const} /></Row>
          </div>
        </Panel>

        <Panel title="Currency & results">
          <div className="grid grid-cols-2 gap-3">
            <Row label="Currency" htmlFor="cur"><Sel id="cur" value={p.currency} onChange={(v) => set("currency", v)} options={["USD", "EUR", "GBP", "JPY", "CHF"].map((c) => [c, c] as const)} /></Row>
            <Row label="Show profit/loss as" htmlFor="pd"><Sel id="pd" value={p.pnlDisplay} onChange={(v) => set("pnlDisplay", v)} options={[["r", "R multiple"], ["amount", "Amount"], ["percent", "% of account"]] as const} /></Row>
          </div>
        </Panel>

        <Panel title="Risk">
          <div className="grid grid-cols-3 gap-3">
            <Row label="Account size" htmlFor="acc"><Input id="acc" inputMode="decimal" defaultValue={p.accountSize} key={"a" + p.accountSize} onBlur={(e) => Number(e.target.value) > 0 && set("accountSize", Number(e.target.value))} /></Row>
            <Row label="Risk type" htmlFor="rm"><Sel id="rm" value={p.riskMode} onChange={(v) => set("riskMode", v)} options={[["percent", "Percent"], ["amount", "Amount"]] as const} /></Row>
            <Row label={p.riskMode === "percent" ? "Risk %" : "Risk amount"} htmlFor="rv"><Input id="rv" inputMode="decimal" defaultValue={p.riskValue} key={"r" + p.riskValue} onBlur={(e) => Number(e.target.value) > 0 && set("riskValue", Number(e.target.value))} /></Row>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">= {p.currency} {riskAmount(p).toFixed(2)} per trade. Used to convert imported profit/loss to R.</p>
        </Panel>

        <Panel title="Watchlist" className="lg:row-span-2">
          <ul className="divide-y">
            {wl.items.map((it, i) => (
              <li key={it.tv + i} className="flex items-center gap-3 py-2 text-sm">
                <SymbolLogo tv={it.tv} label={it.label} color={it.color} />
                <span className="flex-1"><span className="font-medium">{it.label}</span> <span className="text-xs text-muted-foreground">{it.tv}</span></span>
                <Button size="icon" variant="ghost" aria-label="Move up" disabled={i === 0} onClick={() => { const a = [...wl.items]; [a[i - 1], a[i]] = [a[i]!, a[i - 1]!]; setItems(a); }}><ArrowUp /></Button>
                <Button size="icon" variant="ghost" aria-label="Move down" disabled={i === wl.items.length - 1} onClick={() => { const a = [...wl.items]; [a[i + 1], a[i]] = [a[i]!, a[i + 1]!]; setItems(a); }}><ArrowDown /></Button>
                <Button size="icon" variant="ghost" aria-label="Remove" onClick={() => setItems(wl.items.filter((_, j) => j !== i))}><Trash2 /></Button>
              </li>
            ))}
          </ul>
          <form className="mt-3 grid grid-cols-[1fr_1fr_1fr_auto] gap-2" onSubmit={(e) => {
            e.preventDefault();
            if (!newSym.label || !newSym.tv) { toast.error("Name and TradingView symbol are required"); return; }
            setItems([...wl.items, { ...newSym, label: newSym.label.toUpperCase(), color: "#334155" }]);
            setNewSym({ label: "", tv: "", quote: "" });
          }}>
            <Input placeholder="Name" value={newSym.label} onChange={(e) => setNewSym({ ...newSym, label: e.target.value })} />
            <Input placeholder="FX:EURUSD" value={newSym.tv} onChange={(e) => setNewSym({ ...newSym, tv: e.target.value })} />
            <Input placeholder="Yahoo: EURUSD=X" value={newSym.quote} onChange={(e) => setNewSym({ ...newSym, quote: e.target.value })} />
            <Button type="submit" variant="outline">Add</Button>
          </form>
        </Panel>

        <Panel title="Accent colour">
          <div className="flex flex-wrap items-center gap-2">
            {ACCENTS.map((c) => (
              <button key={c} aria-label={c} onClick={() => set("accent", c)} style={{ background: c }}
                className={`h-8 w-8 rounded-full border-2 ${p.accent.toLowerCase() === c.toLowerCase() ? "border-foreground" : "border-transparent"}`} />
            ))}
            <input type="color" aria-label="Custom colour" value={p.accent} onChange={(e) => set("accent", e.target.value)} className="h-8 w-10 cursor-pointer bg-transparent" />
          </div>
        </Panel>

        <Panel title="Kill zones (New York time)">
          <div className="space-y-2">
            {p.killZones.map((k, i) => (
              <div key={k.name} className="grid grid-cols-[1fr_auto_auto] items-center gap-2 text-sm">
                <span>{k.name}</span>
                <Input type="time" className="w-28" value={k.start} onChange={(e) => set("killZones", p.killZones.map((z, j) => (j === i ? { ...z, start: e.target.value } : z)))} />
                <Input type="time" className="w-28" value={k.end} onChange={(e) => set("killZones", p.killZones.map((z, j) => (j === i ? { ...z, end: e.target.value } : z)))} />
              </div>
            ))}
          </div>
        </Panel>

        <Panel title="Account & data">
          <p className="text-sm text-muted-foreground">Signed in as <span className="text-foreground">{user.email}</span> · {trades.length} trades stored.</p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button variant="outline" disabled={!trades.length} onClick={() => downloadCsv(trades)}>Export all as CSV</Button>
            <AlertDialog>
              <AlertDialogTrigger asChild><Button variant="destructive">Delete all data</Button></AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Alle gegevens wissen?</AlertDialogTitle>
                  <AlertDialogDescription>Dit verwijdert al je {trades.length} trades, screenshots, je watchlist en instellingen. Dit kan niet ongedaan worden gemaakt.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Annuleren</AlertDialogCancel>
                  <AlertDialogAction onClick={wipeAll}>Ja, alles wissen</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </Panel>
      </div>
    </>
  );
}
