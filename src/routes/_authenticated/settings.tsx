import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { PageHeader, Panel } from "@/components/app/ui";
import { downloadCsv, tradesQuery } from "@/lib/trades";

export const Route = createFileRoute("/_authenticated/settings")({
  head: () => ({ meta: [{ title: "Settings – TradeKit" }, { name: "description", content: "Account and data settings." }] }),
  component: () => {
    const { user } = Route.useRouteContext();
    const { data: trades = [] } = useQuery(tradesQuery);
    return (<><PageHeader title="Settings" />
      <div className="grid gap-4 md:grid-cols-2">
        <Panel title="Account"><p className="text-sm text-muted-foreground">Signed in as</p><p className="text-sm">{user.email}</p></Panel>
        <Panel title="Data"><p className="mb-3 text-sm text-muted-foreground">{trades.length} trades stored.</p><Button variant="outline" disabled={!trades.length} onClick={() => downloadCsv(trades)}>Export all as CSV</Button></Panel>
      </div></>);
  },
});
