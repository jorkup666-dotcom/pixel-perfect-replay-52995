import { z } from "zod";

const n = z.number().nullable();
export const extractedTradeSchema = z.object({
  readable: z.boolean(),
  instrument: z.string().nullable(),
  direction: z.enum(["long", "short"]).nullable(),
  entry: n, stop_loss: n, take_profit: n, exit_price: n, quantity: n, result_r: n,
  date: z.string().nullable(), time: z.string().nullable(), timeframe: z.string().nullable(),
  ict_concept: z.string().nullable(),
  uncertain: z.array(z.string()),
});
export type ExtractedTrade = z.infer<typeof extractedTradeSchema>;

const nn = { type: ["number", "null"] } as const;
const ns = { type: ["string", "null"] } as const;
export const EXTRACT_JSON_SCHEMA = {
  type: "object", additionalProperties: false,
  required: ["readable", "instrument", "direction", "entry", "stop_loss", "take_profit", "exit_price", "quantity", "result_r", "date", "time", "timeframe", "ict_concept", "uncertain"],
  properties: {
    readable: { type: "boolean" }, instrument: ns, direction: { type: ["string", "null"], enum: ["long", "short", null] },
    entry: nn, stop_loss: nn, take_profit: nn, exit_price: nn, quantity: nn, result_r: nn,
    date: ns, time: ns, timeframe: ns, ict_concept: ns, uncertain: { type: "array", items: { type: "string" } },
  },
} as const;
