import { queryOptions } from "@tanstack/react-query";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import type { Database } from "@/integrations/supabase/types";

export type Trade = Database["public"]["Tables"]["trades"]["Row"];
export type TradeInsert = Database["public"]["Tables"]["trades"]["Insert"];

const num = (label: string) =>
  z.string().trim().min(1, `${label} is required`).refine((v) => !isNaN(Number(v)), `${label} must be a number`);
const optNum = (label: string) =>
  z.string().trim().refine((v) => v === "" || !isNaN(Number(v)), `${label} must be a number`);

export const tradeFormSchema = z.object({
  trade_date: z.string().min(1, "Date is required"),
  instrument: z.string().trim().min(1, "Instrument is required").max(30),
  session: z.string().min(1, "Session is required"),
  direction: z.enum(["long", "short"]),
  entry: num("Entry"),
  stop_loss: num("Stop loss"),
  take_profit: optNum("Take profit"),
  exit_price: optNum("Exit"),
  result_r: num("Result (R)"),
  setup_type: z.string().min(1, "Setup is required"),
  timeframe: z.string().min(1, "Timeframe is required"),
  notes: z.string().max(5000).optional(),
  ict_concepts: z.array(z.string()),
});
export type TradeFormValues = z.infer<typeof tradeFormSchema>;

export const tradesQuery = queryOptions({
  queryKey: ["trades"],
  queryFn: async () => {
    const { data, error } = await supabase
      .from("trades")
      .select("*")
      .order("trade_date", { ascending: false })
      .order("created_at", { ascending: false })
      .limit(5000);
    if (error) throw error;
    return (data ?? []).map((t) => ({ ...t, result_r: Number(t.result_r) }));
  },
});

export async function uploadScreenshot(file: File) {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) throw new Error("Not signed in");
  const ext = file.name.split(".").pop() ?? "png";
  const path = `${u.user.id}/${crypto.randomUUID()}.${ext}`;
  const { error } = await supabase.storage.from("screenshots").upload(path, file);
  if (error) throw error;
  return path;
}

export async function signedScreenshotUrl(path: string) {
  const { data } = await supabase.storage.from("screenshots").createSignedUrl(path, 3600);
  return data?.signedUrl ?? null;
}

const CSV_COLS: (keyof Trade)[] = [
  "trade_date", "instrument", "session", "direction", "entry", "stop_loss", "take_profit",
  "exit_price", "result_r", "setup_type", "timeframe", "ict_concepts", "notes",
];

export function tradesToCsv(trades: Trade[]) {
  const esc = (v: unknown) => {
    const s = Array.isArray(v) ? v.join("|") : v == null ? "" : String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  return [CSV_COLS.join(","), ...trades.map((t) => CSV_COLS.map((c) => esc(t[c])).join(","))].join("\n");
}

export function downloadCsv(trades: Trade[]) {
  const blob = new Blob([tradesToCsv(trades)], { type: "text/csv" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `tradekit-trades-${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(a.href);
}

export const fmtR = (r: number | null | undefined) =>
  r == null ? "—" : `${r > 0 ? "+" : ""}${Number(r).toFixed(2)}R`;
