import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { extractedTradeSchema, EXTRACT_JSON_SCHEMA, type ExtractedTrade } from "./screenshot-schema";

const PROMPT = `You read trading screenshots (TradingView charts, position panels, broker fills).
Extract the trade shown. Use null for anything not visible. Prices as plain numbers.
direction: "long" or "short". date as YYYY-MM-DD, time as HH:MM (24h).
timeframe like "1m","5m","15m","1H","4H","Daily". result_r = reward/risk achieved if computable.
ict_concept: one of liquidity_sweep, fvg, ifvg, bos, mss, order_block, displacement, equal_highs_lows, premium_discount, killzones, htf_bias, or null.
readable=false if the image does not show a trade. List the field names you are unsure about in "uncertain".`;

export const readTradeScreenshot = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => z.object({ image: z.string().startsWith("data:image/").max(8_000_000) }).parse(d))
  .handler(async ({ data }): Promise<{ ok: true; trade: ExtractedTrade } | { ok: false; error: string }> => {
    const { generateResponse, GatewayError } = await import("@lovable.dev/ai-gateway");
    try {
      const res = await generateResponse({
        model: "openai/gpt-6.1-sol",
        instructions: PROMPT,
        input: [{ role: "user", content: [
          { type: "input_text", text: "Extract the trade from this screenshot." },
          { type: "input_image", image_url: data.image, detail: "high" },
        ] }],
        text: { format: { type: "json_schema", name: "trade", strict: true, schema: EXTRACT_JSON_SCHEMA } },
      });
      const items = (res.output ?? []) as unknown as { type?: string; content?: { type?: string; text?: string }[] }[];
      const text = items
        .filter((o) => o.type === "message")
        .flatMap((o) => o.content ?? [])
        .map((c) => (c.type === "output_text" && typeof c.text === "string" ? c.text : ""))
        .join("");
      const parsed = extractedTradeSchema.safeParse(JSON.parse(text || "{}"));
      if (!parsed.success) return { ok: false, error: "unreadable" };
      if (!parsed.data.readable) return { ok: false, error: "unreadable" };
      return { ok: true, trade: parsed.data };
    } catch (e) {
      console.error("screenshot read failed", e instanceof GatewayError ? { code: e.code, ids: e.ids } : e);
      return { ok: false, error: e instanceof GatewayError && e.code === "payment_required" ? "credits" : "failed" };
    }
  });
