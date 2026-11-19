import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { ChevronDown, ChevronRight, Flag, Plus, Trash2, PanelRightClose, PanelRightOpen } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { getQuotes } from "@/lib/quotes.functions";
import { cn } from "@/lib/utils";

export interface WatchItem { label: string; tv: string; quote: string; color: string; flagged?: boolean }
export interface WatchGroup { name: string; items: WatchItem[] }

export const DEFAULT_WATCHLIST: WatchGroup[] = [{
  name: "FUTURES", items: [
    { label: "USOIL", tv: "TVC:USOIL", quote: "CL=F", color: "oklch(0.35 0.02 260)" },
    { label: "GC", tv: "COMEX:GC1!", quote: "GC=F", color: "oklch(0.8 0.15 85)" },
    { label: "SI", tv: "COMEX:SI1!", quote: "SI=F", color: "oklch(0.7 0.01 260)" },
    { label: "NQ", tv: "CME_MINI:NQ1!", quote: "NQ=F", color: "oklch(0.55 0.2 260)" },
    { label: "ES", tv: "CME_MINI:ES1!", quote: "ES=F", color: "oklch(0.6 0.2 25)" },
    { label: "BTCUSD", tv: "BITSTAMP:BTCUSD", quote: "BTC-USD", color: "oklch(0.72 0.17 55)" },
  ],
}];

const settingsQuery = {
  queryKey: ["watchlist"],
  queryFn: async () => {
    const { data, error } = await supabase.from("user_settings").select("watchlist").maybeSingle();
    if (error) throw error;
    return (data?.watchlist as unknown as WatchGroup[] | null) ?? DEFAULT_WATCHLIST;
  },
};

const fmt = (n: number | null, d = 2) => (n == null ? "—" : n.toLocaleString("en-US", { minimumFractionDigits: d, maximumFractionDigits: d }));

export function Watchlist({ active, onSelect }: { active: string; onSelect: (tv: string) => void }) {
  const qc = useQueryClient();
  const { data: groups = DEFAULT_WATCHLIST } = useQuery(settingsQuery);
  const [open, setOpen] = useState(true);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const fetchQuotes = useServerFn(getQuotes);
  const symbols = groups.flatMap((g) => g.items.map((i) => i.quote)).filter(Boolean);
  const { data: quotes = [] } = useQuery({
    queryKey: ["quotes", symbols.join(",")],
    queryFn: () => fetchQuotes({ data: { symbols } }),
    refetchInterval: 30_000,
    enabled: symbols.length > 0,
  });

  async function save(next: WatchGroup[]) {
    qc.setQueryData(["watchlist"], next);
    const { data: u } = await supabase.auth.getUser();
    if (!u.user) return;
    const { error } = await supabase.from("user_settings").upsert({ user_id: u.user.id, watchlist: next as never, updated_at: new Date().toISOString() });
    if (error) toast.error(error.message);
  }

  function addSymbol(gi: number) {
    const label = prompt("Symbol name (e.g. EURUSD)")?.trim().toUpperCase();
    if (!label) return;
    const tv = prompt("TradingView symbol (e.g. FX:EURUSD)", label)?.trim() || label;
    const quote = prompt("Price symbol on Yahoo Finance (e.g. EURUSD=X), leave empty for none", "")?.trim() ?? "";
    save(groups.map((g, i) => (i === gi ? { ...g, items: [...g.items, { label, tv, quote, color: "oklch(0.55 0.1 230)" }] } : g)));
  }
  function addGroup() {
    const name = prompt("Group name")?.trim().toUpperCase();
    if (name) save([...groups, { name, items: [] }]);
  }
  const update = (gi: number, ii: number, fn: (i: WatchItem) => WatchItem | null) =>
    save(groups.map((g, i) => (i !== gi ? g : { ...g, items: g.items.flatMap((it, j) => (j !== ii ? [it] : (fn(it) ? [fn(it)!] : []))) })));

  useEffect(() => {}, []);

  if (!open) return (
    <button onClick={() => setOpen(true)} aria-label="Open watchlist" className="surface grid w-10 place-items-start justify-center pt-3">
      <PanelRightOpen className="h-4 w-4 text-muted-foreground" />
    </button>
  );

  return (
    <aside className="surface flex w-80 shrink-0 flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b px-3 py-2 text-xs text-muted-foreground">
        <span className="font-semibold uppercase tracking-wider">Watchlist</span>
        <div className="flex gap-1">
          <button onClick={addGroup} className="rounded px-1.5 py-0.5 hover:bg-muted" title="New group">+ Group</button>
          <button onClick={() => setOpen(false)} aria-label="Collapse watchlist" className="rounded p-1 hover:bg-muted"><PanelRightClose className="h-4 w-4" /></button>
        </div>
      </div>
      <div className="grid grid-cols-[1fr_auto_auto_auto] gap-x-3 border-b px-3 py-1.5 text-[11px] text-muted-foreground">
        <span>Symbol</span><span className="text-right">Last</span><span className="text-right">Chg</span><span className="w-14 text-right">Chg%</span>
      </div>
      <div className="flex-1 overflow-y-auto text-sm">
        {groups.map((g, gi) => (
          <div key={g.name + gi}>
            <div className="group flex items-center justify-between px-2 py-1.5 text-[11px] font-semibold tracking-wider text-muted-foreground">
              <button className="flex items-center gap-1" onClick={() => setCollapsed((c) => ({ ...c, [g.name]: !c[g.name] }))}>
                {collapsed[g.name] ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}{g.name}
              </button>
              <span className="flex gap-1 opacity-0 group-hover:opacity-100">
                <button onClick={() => addSymbol(gi)} aria-label="Add symbol"><Plus className="h-3.5 w-3.5" /></button>
                <button onClick={() => confirm(`Delete group ${g.name}?`) && save(groups.filter((_, i) => i !== gi))} aria-label="Delete group"><Trash2 className="h-3.5 w-3.5" /></button>
              </span>
            </div>
            {!collapsed[g.name] && g.items.map((it, ii) => {
              const q = quotes.find((x) => x.symbol === it.quote);
              const up = (q?.change ?? 0) >= 0;
              const tone = q?.change == null ? "text-muted-foreground" : up ? "text-success" : "text-loss";
              return (
                <div key={it.tv + ii} onClick={() => onSelect(it.tv)}
                  className={cn("group/row grid cursor-pointer grid-cols-[1fr_auto_auto_auto] items-center gap-x-3 border border-transparent px-3 py-1.5 hover:bg-muted/50",
                    active === it.tv && "border-foreground/30 bg-muted/40")}>
                  <span className="flex min-w-0 items-center gap-2">
                    <span className="h-5 w-5 shrink-0 rounded-full" style={{ background: it.color }} aria-hidden />
                    <span className="truncate font-medium">{it.label}</span>
                    {it.flagged && <Flag className="h-3 w-3 shrink-0 fill-loss text-loss" />}
                    <span className="ml-auto hidden gap-1 group-hover/row:flex">
                      <button onClick={(e) => { e.stopPropagation(); update(gi, ii, (x) => ({ ...x, flagged: !x.flagged })); }} aria-label="Flag"><Flag className="h-3 w-3 text-muted-foreground" /></button>
                      <button onClick={(e) => { e.stopPropagation(); update(gi, ii, () => null); }} aria-label="Remove"><Trash2 className="h-3 w-3 text-muted-foreground" /></button>
                    </span>
                  </span>
                  <span className="num text-right">{fmt(q?.price ?? null)}</span>
                  <span className={cn("num text-right", tone)}>{q?.change == null ? "—" : `${up ? "+" : ""}${fmt(q.change)}`}</span>
                  <span className={cn("num w-14 text-right", tone)}>{q?.changePct == null ? "—" : `${up ? "+" : ""}${fmt(q.changePct)}%`}</span>
                </div>
              );
            })}
          </div>
        ))}
      </div>
      <div className="border-t px-3 py-1.5 text-[10px] text-muted-foreground">Delayed prices · refresh every 30s</div>
    </aside>
  );
}
