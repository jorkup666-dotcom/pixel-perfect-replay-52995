import { createFileRoute, Link } from "@tanstack/react-router";
import { BarChart3, BookOpen, ListChecks } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Logo } from "@/components/app/Logo";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "TradeKit – ICT Trading Journal" },
      { name: "description", content: "Journal your trades, measure results in R and study ICT concepts with TradeKit." },
      { property: "og:title", content: "TradeKit – ICT Trading Journal" },
      { property: "og:description", content: "An educational ICT trading journal with analytics, checklist and glossary." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const FEATURES = [
  { icon: BookOpen, title: "Structured journal", body: "Log entries, stops, targets, R results, screenshots and notes." },
  { icon: BarChart3, title: "Automatic statistics", body: "Win rate, profit factor, equity curve and monthly results from your own data." },
  { icon: ListChecks, title: "ICT framework", body: "Tag concepts, follow a pre-trade checklist and review what works for you." },
];

function Landing() {
  return (
    <div className="min-h-screen bg-glow bg-no-repeat">
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-6">
        <Logo />
        <Button asChild variant="ghost"><Link to="/auth">Sign in</Link></Button>
      </header>
      <section className="mx-auto max-w-4xl px-6 pb-16 pt-16 text-center md:pt-28">
        <p className="mb-5 inline-block rounded-full border px-3 py-1 text-xs text-cyan">ICT trading journal</p>
        <h1 className="text-4xl font-semibold leading-tight md:text-6xl">
          Review every trade.<br /><span className="text-gradient">Refine your edge.</span>
        </h1>
        <p className="mx-auto mt-6 max-w-xl text-muted-foreground">
          TradeKit helps you record trades, measure results in R and understand which ICT concepts actually work in your trading.
        </p>
        <div className="mt-10 flex justify-center gap-3">
          <Button asChild variant="hero" size="lg"><Link to="/auth">Start journaling</Link></Button>
          <Button asChild variant="outline" size="lg"><Link to="/dashboard">Open dashboard</Link></Button>
        </div>
      </section>
      <section className="mx-auto grid max-w-6xl gap-4 px-6 pb-20 md:grid-cols-3">
        {FEATURES.map((f) => (
          <div key={f.title} className="surface p-6">
            <f.icon className="h-5 w-5 text-cyan" />
            <h3 className="mt-4 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{f.body}</p>
          </div>
        ))}
      </section>
      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        TradeKit is an educational journal. It does not provide signals or financial advice.
      </footer>
    </div>
  );
}
