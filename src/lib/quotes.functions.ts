import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

export interface Quote { symbol: string; price: number | null; change: number | null; changePct: number | null; }

// Free delayed quotes from Yahoo Finance's public chart endpoint (no key).
export const getQuotes = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => z.object({ symbols: z.array(z.string().max(20)).max(50) }).parse(d))
  .handler(async ({ data }): Promise<Quote[]> => {
    return Promise.all(data.symbols.map(async (symbol) => {
      try {
        const r = await fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(symbol)}?interval=1d&range=2d`, {
          headers: { "User-Agent": "Mozilla/5.0" },
        });
        const j = (await r.json()) as { chart?: { result?: { meta?: { regularMarketPrice?: number; chartPreviousClose?: number; previousClose?: number } }[] } };
        const m = j.chart?.result?.[0]?.meta;
        const price = m?.regularMarketPrice ?? null;
        const prev = m?.chartPreviousClose ?? m?.previousClose ?? null;
        const change = price != null && prev != null ? price - prev : null;
        return { symbol, price, change, changePct: change != null && prev ? (change / prev) * 100 : null };
      } catch {
        return { symbol, price: null, change: null, changePct: null };
      }
    }));
  });
