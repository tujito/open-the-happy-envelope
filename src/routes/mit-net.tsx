import { createFileRoute } from "@tanstack/react-router";
import { Users } from "lucide-react";

import { ComingSoon } from "@/components/tujito/ComingSoon";

export const Route = createFileRoute("/mit-net")({
  head: () => ({
    meta: [
      { title: "My Net – Tujito" },
      { name: "description", content: "Dine nærmeste samlet ét sted, så det er nemt at overraske dem." },
      { property: "og:title", content: "My Net – Tujito" },
      { property: "og:description", content: "Dine nærmeste samlet ét sted, så det er nemt at overraske dem." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyNetPage,
});

function MyNetPage() {
  return (
    <ComingSoon icon={Users} title="My Net">
      <p>Her samler du snart dine nærmeste, så det er nemt at overraske dem.</p>
    </ComingSoon>
  );
}
