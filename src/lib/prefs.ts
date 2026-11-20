import { useEffect, useState } from "react";

export interface KillZone { name: string; start: string; end: string }
export interface Prefs {
  chartSymbol: string;
  chartInterval: string;
  timezone: string;
  dateFormat: "yyyy-mm-dd" | "dd-mm-yyyy" | "mm/dd/yyyy";
  currency: string;
  pnlDisplay: "amount" | "percent" | "r";
  riskMode: "percent" | "amount";
  riskValue: number;
  accountSize: number;
  accent: string;
  killZones: KillZone[];
}

export const DEFAULT_PREFS: Prefs = {
  chartSymbol: "CME_MINI:NQ1!",
  chartInterval: "15",
  timezone: "America/New_York",
  dateFormat: "yyyy-mm-dd",
  currency: "USD",
  pnlDisplay: "r",
  riskMode: "percent",
  riskValue: 1,
  accountSize: 10000,
  accent: "#2563EB",
  killZones: [
    { name: "Asia", start: "20:00", end: "00:00" },
    { name: "London", start: "02:00", end: "05:00" },
    { name: "New York AM", start: "07:00", end: "10:00" },
    { name: "New York PM", start: "13:30", end: "16:00" },
  ],
};

const KEY = "tradekit-prefs";
const EVT = "tradekit-prefs-change";

export function readPrefs(): Prefs {
  if (typeof window === "undefined") return DEFAULT_PREFS;
  try { return { ...DEFAULT_PREFS, ...JSON.parse(localStorage.getItem(KEY) ?? "{}") }; } catch { return DEFAULT_PREFS; }
}

export function writePrefs(p: Partial<Prefs>) {
  const next = { ...readPrefs(), ...p };
  localStorage.setItem(KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(EVT));
  applyAccent(next.accent);
}

export function clearPrefs() { localStorage.removeItem(KEY); window.dispatchEvent(new Event(EVT)); applyAccent(DEFAULT_PREFS.accent); }

export function applyAccent(hex: string) {
  if (typeof document === "undefined") return;
  document.documentElement.style.setProperty("--primary", hex);
  document.documentElement.style.setProperty("--ring", hex);
}

/** Risk amount per trade in account currency. */
export const riskAmount = (p: Prefs) => (p.riskMode === "amount" ? p.riskValue : (p.accountSize * p.riskValue) / 100);

export function formatDate(iso: string, p: Prefs) {
  const [y, m, d] = iso.slice(0, 10).split("-");
  if (p.dateFormat === "dd-mm-yyyy") return `${d}-${m}-${y}`;
  if (p.dateFormat === "mm/dd/yyyy") return `${m}/${d}/${y}`;
  return `${y}-${m}-${d}`;
}

export function usePrefs(): Prefs {
  const [p, setP] = useState<Prefs>(DEFAULT_PREFS);
  useEffect(() => {
    const on = () => setP(readPrefs());
    on();
    window.addEventListener(EVT, on);
    window.addEventListener("storage", on);
    return () => { window.removeEventListener(EVT, on); window.removeEventListener("storage", on); };
  }, []);
  return p;
}
