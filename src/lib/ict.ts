export interface IctConcept {
  key: string;
  name: string;
  short: string;
  definition: string;
  howToUse: string;
}

export const ICT_CONCEPTS: IctConcept[] = [
  { key: "liquidity_sweep", name: "Liquidity Sweep", short: "Sweep",
    definition: "Price trades beyond an obvious high or low where stop orders rest, takes that liquidity, then quickly reverses back inside the range.",
    howToUse: "Note which pool was taken (session high/low, previous day high/low, equal highs/lows) and whether price closed back inside it." },
  { key: "fvg", name: "Fair Value Gap (FVG)", short: "FVG",
    definition: "A three-candle imbalance where the wicks of candle one and candle three do not overlap, leaving a gap that price often revisits.",
    howToUse: "Mark the gap created during displacement and look for price to rebalance into it as a potential entry zone." },
  { key: "ifvg", name: "Inverse FVG (IFVG)", short: "IFVG",
    definition: "A fair value gap that price has traded fully through and closed beyond, after which it may act as support or resistance from the other side.",
    howToUse: "Record when a failed FVG flips role, often after a liquidity sweep and shift in structure." },
  { key: "bos", name: "Break of Structure (BOS)", short: "BOS",
    definition: "Price closes beyond a prior swing point in the direction of the existing trend, confirming continuation.",
    howToUse: "Use to confirm the trend you are trading with matches the prevailing order flow." },
  { key: "mss", name: "Market Structure Shift (MSS)", short: "MSS",
    definition: "A break of a short-term swing point against the prior direction, usually with displacement, signalling a possible change in order flow.",
    howToUse: "Often looked for after a liquidity sweep as confirmation before seeking an entry." },
  { key: "order_block", name: "Order Block", short: "OB",
    definition: "The last opposing candle before a strong displacement move; a zone where price may react when revisited.",
    howToUse: "Mark the candle body or full range and note whether the block led to a BOS or MSS." },
  { key: "displacement", name: "Displacement", short: "Disp.",
    definition: "A strong, energetic move with large-bodied candles that often leaves fair value gaps behind.",
    howToUse: "Treat displacement as evidence of intent; setups without it are generally weaker." },
  { key: "equal_highs_lows", name: "Equal Highs / Lows", short: "EQH/EQL",
    definition: "Two or more swing highs or lows at roughly the same price, often viewed as engineered liquidity.",
    howToUse: "Log them as draw-on-liquidity targets or as pools that were swept before entry." },
  { key: "premium_discount", name: "Premium / Discount", short: "P/D",
    definition: "Dividing a dealing range at 50% (equilibrium): above is premium, below is discount.",
    howToUse: "Longs are typically considered from discount and shorts from premium within the chosen range." },
  { key: "killzones", name: "Killzones", short: "KZ",
    definition: "Time windows with typically higher volatility, such as the Asian, London and New York sessions.",
    howToUse: "Record the session of each trade to see where your results are strongest." },
  { key: "htf_bias", name: "HTF Bias", short: "Bias",
    definition: "The expected direction derived from higher timeframes (daily, 4H) and the likely draw on liquidity.",
    howToUse: "Note whether each trade aligned with your higher-timeframe bias and compare outcomes." },
];

export const conceptName = (key: string) => ICT_CONCEPTS.find((c) => c.key === key)?.name ?? key;

export const SESSIONS = ["Asia", "London", "New York AM", "New York PM", "Other"];
export const TIMEFRAMES = ["1m", "3m", "5m", "15m", "30m", "1H", "4H", "Daily"];
export const SETUP_TYPES = [
  "Liquidity Sweep + MSS", "FVG Entry", "IFVG Entry", "Order Block Entry",
  "Breaker Block", "BOS Continuation", "Silver Bullet", "Other",
];

export const CHECKLIST_ITEMS = [
  { key: "bias", label: "Higher-timeframe bias defined", group: "Context" },
  { key: "draw", label: "Draw on liquidity identified", group: "Context" },
  { key: "pd", label: "Entry in premium (short) / discount (long)", group: "Context" },
  { key: "killzone", label: "Trading inside a killzone", group: "Timing" },
  { key: "news", label: "Checked high-impact news", group: "Timing" },
  { key: "sweep", label: "Liquidity sweep occurred", group: "Confirmation" },
  { key: "mss", label: "MSS / BOS with displacement", group: "Confirmation" },
  { key: "pda", label: "Entry at FVG, IFVG or order block", group: "Confirmation" },
  { key: "stop", label: "Stop placed at logical invalidation", group: "Risk" },
  { key: "rr", label: "Target offers at least 2R", group: "Risk" },
  { key: "size", label: "Position size matches risk plan", group: "Risk" },
];
