import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { Gift, Heart } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

import giftImage from "@/assets/tujito-gift.png";
import {
  GreetingComposer,
  emptyGreeting,
  isGreetingReady,
  type GreetingDraft,
} from "@/components/tujito/GreetingComposer";
import { MissingTujito } from "@/components/tujito/Missing";
import { Shell } from "@/components/tujito/Shell";
import { Button } from "@/components/ui/button";
import { getOccasion } from "@/lib/tujito";
import { addGreeting, getTujitoTeaser } from "@/lib/tujito.functions";
import { prepareGreeting } from "@/lib/upload-greeting";

export const Route = createFileRoute("/med/$id")({
  loader: async ({ params }) => {
    if (!/^[0-9a-f-]{36}$/i.test(params.id)) throw notFound();
    const teaser = await getTujitoTeaser({ data: { id: params.id } });
    if (!teaser) throw notFound();
    return teaser;
  },
  head: ({ loaderData }) => {
    const title = loaderData
      ? `Vær med til at overraske ${loaderData.recipientName.split(" ")[0]} 🎁`
      : "Vær med i en Tujito";
    const description = "Læg din egen lille hilsen i gaven – med tekst, video eller lyd.";
    return {
      meta: [
        { title },
        { name: "description", content: description },
        { name: "robots", content: "noindex" },
        { property: "og:title", content: title },
        { property: "og:description", content: description },
        { property: "og:type", content: "website" },
        { name: "twitter:card", content: "summary_large_image" },
      ],
    };
  },
  component: JoinTujito,
  notFoundComponent: MissingTujito,
  errorComponent: MissingTujito,
});

function JoinTujito() {
  const teaser = Route.useLoaderData();
  const firstName = teaser.recipientName.split(" ")[0] ?? teaser.recipientName;
  const occasion = getOccasion(teaser.occasion);
  const [greeting, setGreeting] = useState<GreetingDraft>(emptyGreeting);
  const [sending, setSending] = useState(false);
  const [done, setDone] = useState(false);
  const [tried, setTried] = useState(false);
  const ready = isGreetingReady(greeting);

  async function submit() {
    if (!ready) return setTried(true);
    setSending(true);
    try {
      const prepared = await prepareGreeting(greeting);
      await addGreeting({ data: { id: teaser.id, greeting: prepared } });
      setDone(true);
      window.scrollTo({ top: 0 });
    } catch {
      toast.error("Ups, det lykkedes ikke. Prøv igen om lidt.");
    } finally {
      setSending(false);
    }
  }

  if (done) {
    return (
      <Shell>
        <section className="my-auto text-center">
          <img src={giftImage} alt="" width={1024} height={1024} className="mx-auto w-48 animate-float" />
          <h1 className="mt-4 text-5xl font-semibold text-gift animate-rise">Tak!</h1>
          <p className="mt-3 text-xl animate-rise" style={{ animationDelay: "0.1s" }}>
            Din hilsen ligger nu i gaven til <strong>{firstName}</strong>. Det bliver en dejlig overraskelse.
          </p>
          <Button asChild variant="soft" size="big" className="mt-8 w-full">
            <Link to="/lav">
              <Gift /> Lav din egen Tujito
            </Link>
          </Button>
        </section>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="mb-6 text-center animate-rise">
        <img src={giftImage} alt="" width={1024} height={1024} className="mx-auto w-32 animate-wiggle" />
        <p className="mt-2 text-lg font-semibold text-muted-foreground">
          {occasion.emoji} {occasion.label}
        </p>
        <h1 className="mt-1 text-4xl font-semibold">
          Vær med til at overraske <span className="text-gift">{firstName}</span>!
        </h1>
        <p className="mt-3 flex items-center justify-center gap-2 text-lg text-muted-foreground">
          <Heart className="size-5 text-primary" />
          {teaser.greetingCount === 1
            ? "1 hilsen ligger allerede i gaven"
            : `${teaser.greetingCount} hilsner ligger allerede i gaven`}
        </p>
      </section>

      <h2 className="mb-4 text-3xl font-semibold">Hvad vil du sende?</h2>
      <GreetingComposer value={greeting} onChange={setGreeting} recipientName={firstName} />
      {tried && !ready && (
        <p className="mt-2 text-base font-semibold text-primary">
          {greeting.kind === "text" ? "Skriv et par ord i feltet." : greeting.kind === "video" ? "Vælg en video først." : "Optag din lyd-hilsen først."}
        </p>
      )}

      <Button variant="gift" size="xl" className="mt-8 h-20 text-2xl" onClick={submit} disabled={sending}>
        {sending ? "Lægger i gaven…" : (<><Gift className="!size-7" /> Læg i gaven</>)}
      </Button>
    </Shell>
  );
}
