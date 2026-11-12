import { Link, createFileRoute, notFound } from "@tanstack/react-router";
import { Gift } from "lucide-react";
import { useState } from "react";

import giftImage from "@/assets/tujito-gift.png";
import { Confetti } from "@/components/tujito/Confetti";
import { GreetingCard } from "@/components/tujito/GreetingCard";
import { MissingTujito } from "@/components/tujito/Missing";
import { Shell } from "@/components/tujito/Shell";
import { Button } from "@/components/ui/button";
import { getOccasion } from "@/lib/tujito";
import { getTujitoTeaser, openTujito } from "@/lib/tujito.functions";

export const Route = createFileRoute("/til/$id")({
  loader: async ({ params }) => {
    if (!/^[0-9a-f-]{36}$/i.test(params.id)) throw notFound();
    const teaser = await getTujitoTeaser({ data: { id: params.id } });
    if (!teaser) throw notFound();
    return teaser;
  },
  head: ({ loaderData }) => {
    const title = loaderData
      ? `${loaderData.recipientName.split(" ")[0]}, du har fået en Tujito! 🎁`
      : "Du har fået en Tujito!";
    const description = "En lille overraskelse, kun til dig. Tryk for at åbne din gave.";
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
  component: RecipientView,
  notFoundComponent: MissingTujito,
  errorComponent: MissingTujito,
});

type Opened = Awaited<ReturnType<typeof openTujito>>;

function RecipientView() {
  const teaser = Route.useLoaderData();
  const [opening, setOpening] = useState(false);
  const [opened, setOpened] = useState<Opened | null>(null);
  const [failed, setFailed] = useState(false);
  const occasion = getOccasion(teaser.occasion);
  const firstName = teaser.recipientName.split(" ")[0];

  async function open() {
    setOpening(true);
    setFailed(false);
    try {
      const [res] = await Promise.all([
        openTujito({ data: { id: teaser.id } }),
        new Promise((r) => setTimeout(r, 900)), // let the gift wiggle a moment
      ]);
      setOpened(res);
      window.scrollTo({ top: 0 });
    } catch {
      setFailed(true);
    } finally {
      setOpening(false);
    }
  }

  if (opened) {
    return (
      <Shell>
        <div className="relative">
          <Confetti />
          <section className="text-center">
            <img src={giftImage} alt="" width={1024} height={1024} className="mx-auto w-36 animate-pop" />
            <p className="mt-2 text-lg font-semibold text-muted-foreground animate-rise">Kære {firstName}</p>
            <h1 className="mt-1 text-5xl font-semibold text-gift animate-rise" style={{ animationDelay: "0.05s" }}>
              {occasion.headline}
            </h1>
            <p className="mt-2 text-5xl animate-pop" style={{ animationDelay: "0.2s" }} aria-hidden>
              {occasion.emoji}
            </p>
          </section>

          <div className="mt-10 flex flex-col gap-8">
            {opened.greetings.map((g, i) => (
              <GreetingCard key={g.id} greeting={g} index={i} />
            ))}
          </div>

          {opened.greetings.length > 1 && (
            <p className="mt-8 text-center text-lg font-semibold text-muted-foreground">
              {opened.greetings.length} hilsner – kun til dig 💛
            </p>
          )}

          <div className="mt-12 rounded-3xl bg-secondary p-6 text-center">
            <p className="font-display text-2xl font-semibold text-secondary-foreground">Vil du glæde en anden?</p>
            <Button asChild variant="gift" size="xl" className="mt-4">
              <Link to="/lav">
                <Gift /> Lav en Tujito
              </Link>
            </Button>
          </div>
        </div>
      </Shell>
    );
  }

  return (
    <Shell>
      <section className="my-auto flex flex-col items-center py-6 text-center">
        <p className="text-xl font-semibold text-muted-foreground animate-rise">Hej {firstName}</p>
        <h1 className="mt-2 text-5xl font-semibold leading-tight animate-rise" style={{ animationDelay: "0.05s" }}>
          Du har fået en <span className="text-gift">Tujito!</span>
        </h1>
        <p className="mt-3 text-xl text-muted-foreground animate-rise" style={{ animationDelay: "0.1s" }}>
          En lille overraskelse, kun til dig.
        </p>

        <button
          type="button"
          onClick={open}
          disabled={opening}
          aria-label="Åbn din overraskelse"
          className="mt-6 rounded-full focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-ring"
        >
          <img
            src={giftImage}
            alt="En gave til dig"
            width={1024}
            height={1024}
            className={"w-72 drop-shadow-2xl " + (opening ? "animate-wiggle [animation-duration:0.5s]" : "animate-wiggle")}
          />
        </button>

        <Button variant="gift" size="xl" className="mt-6 h-20 text-2xl" onClick={open} disabled={opening}>
          {opening ? "Åbner…" : (<><Gift className="!size-7" /> Åbn din overraskelse</>)}
        </Button>
        {failed && (
          <p className="mt-4 text-lg font-semibold text-destructive">Gaven gik lidt i stå. Prøv at trykke igen.</p>
        )}
      </section>
    </Shell>
  );
}
