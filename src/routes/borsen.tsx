import { createFileRoute } from "@tanstack/react-router";
import { BarChart3 } from "lucide-react";

import { ComingSoon } from "@/components/tujito/ComingSoon";

export const Route = createFileRoute("/borsen")({
  head: () => ({
    meta: [
      { title: "Børsen – Tujito" },
      { name: "description", content: "Se hvor mange smil og hilsner der bliver sendt rundt." },
      { property: "og:title", content: "Børsen – Tujito" },
      { property: "og:description", content: "Se hvor mange smil og hilsner der bliver sendt rundt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: BorsenPage,
});

function BorsenPage() {
  return (
    <ComingSoon icon={BarChart3} title="Børsen">
      <p>Her kan du snart se, hvor mange smil og hilsner der bliver sendt rundt.</p>
    </ComingSoon>
  );
}
