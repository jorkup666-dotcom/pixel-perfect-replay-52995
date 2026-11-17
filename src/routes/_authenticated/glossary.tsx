import { createFileRoute } from "@tanstack/react-router";
import { PageHeader, Panel } from "@/components/app/ui";
import { ICT_CONCEPTS } from "@/lib/ict";

export const Route = createFileRoute("/_authenticated/glossary")({
  head: () => ({ meta: [{ title: "ICT Glossary – TradeKit" }, { name: "description", content: "Definitions of core ICT concepts." }] }),
  component: () => (<><PageHeader title="ICT Glossary" subtitle="Educational definitions. Not financial advice." />
    <div className="grid gap-4 md:grid-cols-2">{ICT_CONCEPTS.map((c) => <Panel key={c.key} title={c.name}>
      <p className="text-sm">{c.definition}</p><p className="mt-3 text-sm text-muted-foreground"><span className="text-cyan">Journaling: </span>{c.howToUse}</p></Panel>)}</div></>),
});
