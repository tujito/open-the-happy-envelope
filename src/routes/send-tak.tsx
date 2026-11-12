import { createFileRoute } from "@tanstack/react-router";
import { Heart } from "lucide-react";

import { ComingSoon } from "@/components/tujito/ComingSoon";

export const Route = createFileRoute("/send-tak")({
  head: () => ({
    meta: [
      { title: "Send Tak – Tujito" },
      { name: "description", content: "Sig tak til en, der har gjort din dag lidt bedre." },
      { property: "og:title", content: "Send Tak – Tujito" },
      { property: "og:description", content: "Sig tak til en, der har gjort din dag lidt bedre." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SendTakPage,
});

function SendTakPage() {
  return (
    <ComingSoon icon={Heart} title="Send Tak">
      <p>Her kan du snart sige tak til en, der har gjort din dag lidt bedre.</p>
    </ComingSoon>
  );
}
