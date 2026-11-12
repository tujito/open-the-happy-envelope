import { createFileRoute } from "@tanstack/react-router";
import { Home } from "lucide-react";

import { ComingSoon } from "@/components/tujito/ComingSoon";

export const Route = createFileRoute("/feed")({
  head: () => ({
    meta: [
      { title: "My Feed – Tujito" },
      { name: "description", content: "Alle de små overraskelser og hilsner, du har fået og sendt." },
      { property: "og:title", content: "My Feed – Tujito" },
      { property: "og:description", content: "Alle de små overraskelser og hilsner, du har fået og sendt." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: MyFeedPage,
});

function MyFeedPage() {
  return (
    <ComingSoon icon={Home} title="My Feed">
      <p>Her kan du snart se alle de små overraskelser, du har fået og sendt.</p>
    </ComingSoon>
  );
}
