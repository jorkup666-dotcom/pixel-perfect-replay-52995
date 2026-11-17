import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { Crosshair } from "lucide-react";
import { EmptyState, PageHeader, Panel } from "@/components/app/ui";
import { GroupTable } from "./analytics";
import { tradesQuery } from "@/lib/trades";
import { groupStats } from "@/lib/trade-stats";
import { conceptName } from "@/lib/ict";

export const Route = createFileRoute("/_authenticated/ict-analysis")({
  head: () => ({ meta: [{ title: "ICT Analysis – TradeKit" }, { name: "description", content: "Performance by ICT concept tagged on your trades." }] }),
  component: () => {
    const { data: trades = [] } = useQuery(tradesQuery);
    const rows = groupStats(trades, (t) => (t.ict_concepts ?? []).map(conceptName));
    return (<><PageHeader title="ICT Analysis" subtitle="Results grouped by the ICT concepts you tagged." />
      <Panel>{rows.length ? <GroupTable rows={rows} /> : <EmptyState icon={Crosshair} title="No ICT tags yet" body="Tag concepts like FVG or MSS when adding trades to see how each performs." />}</Panel></>);
  },
});
