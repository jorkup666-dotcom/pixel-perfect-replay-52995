import { createFileRoute, Link } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/Logo";
import { ConceptLink } from "@/components/concepts/ConceptLink";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TradeKit – ICT Trading Journal" },
      { name: "description", content: "A plain trading journal for ICT traders: log trades in R, review setups, look up concepts." },
      { property: "og:title", content: "TradeKit – ICT Trading Journal" },
      { property: "og:description", content: "Log trades in R, review your ICT setups and look up concepts." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const ROWS = [
  ["Journal", "Date, instrument, session, entry, stop, target, exit, result in R, screenshot, notes."],
  ["Statistics", "Win rate, profit factor, average R, equity curve and monthly totals — only from trades you logged."],
  ["Concepts", "Every ICT term in the app opens a short explanation with chart examples."],
  ["Chart", "A TradingView chart inside the app, so you can check the setup while you write it down."],
];

function Landing() {
  return (
    <div className="min-h-screen">
      <header className="mx-auto flex max-w-4xl items-center justify-between px-6 py-5">
        <Logo />
        <Button asChild variant="ghost" size="sm"><Link to="/auth">Sign in</Link></Button>
      </header>
      <main className="mx-auto max-w-4xl px-6 pb-20 pt-12">
        <h1 className="max-w-2xl text-3xl font-semibold leading-snug">A trading journal for people who trade ICT concepts.</h1>
        <p className="mt-4 max-w-2xl text-muted-foreground">
          Write down every trade, measure it in R, and see after a few weeks which setups actually pay.
          Did your <ConceptLink id="fvg" /> entries after a <ConceptLink id="liquidity-sweep" /> work better
          in London or New York? The numbers will tell you.
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild><Link to="/auth">Create an account</Link></Button>
          <Button asChild variant="outline"><Link to="/dashboard">Open dashboard</Link></Button>
        </div>
        <table className="mt-16 w-full border-t text-sm">
          <tbody className="divide-y">
            {ROWS.map(([k, v]) => (
              <tr key={k}><td className="w-40 py-3 pr-4 align-top font-medium">{k}</td><td className="py-3 text-muted-foreground">{v}</td></tr>
            ))}
          </tbody>
        </table>
        <p className="mt-16 text-xs text-muted-foreground">TradeKit is an educational journal. It gives no signals and no financial advice.</p>
      </main>
    </div>
  );
}
