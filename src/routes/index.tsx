import { Link, createFileRoute } from "@tanstack/react-router";
import { Gift } from "lucide-react";

import giftImage from "@/assets/tujito-gift.png";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Tujito – en lille overraskelse, kun til dig" },
      {
        name: "description",
        content: "Lav en lille anonym hilsen med tekst, video eller lyd, og overrask en, du holder af.",
      },
      { property: "og:title", content: "Tujito – en lille overraskelse, kun til dig" },
      {
        property: "og:description",
        content: "Lav en lille anonym hilsen med tekst, video eller lyd, og overrask en, du holder af.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const STEPS = [
  { n: 1, title: "Lav en hilsen", text: "Skriv, optag eller vælg en video." },
  { n: 2, title: "Inviter andre med", text: "Del et link, så flere kan lægge en hilsen i gaven." },
  { n: 3, title: "Modtageren får en overraskelse", text: "De åbner gaven og bliver glade." },
];

function Index() {
  return (
    <div className="mx-auto flex min-h-page w-full max-w-md flex-col px-5 pb-12 pt-8">
      <section className="flex flex-col items-center text-center">
        <img
          src={giftImage}
          alt="En gaveæske med hjerter, der flyver ud"
          width={1024}
          height={1024}
          className="w-60 animate-float drop-shadow-xl"
        />
        <h1 className="mt-2 text-6xl font-semibold text-gift animate-rise">Tujito</h1>
        <p
          className="mt-3 font-display text-2xl leading-snug text-foreground animate-rise"
          style={{ animationDelay: "0.1s" }}
        >
          en lille overraskelse,
          <br />
          <em className="text-primary">kun til dig.</em>
        </p>

        <Button asChild variant="gift" size="xl" className="mt-8 h-20 text-2xl animate-pop" style={{ animationDelay: "0.25s" }}>
          <Link to="/lav">
            <Gift className="!size-7" /> Lav en Tujito
          </Link>
        </Button>
      </section>

      <section className="mt-12" aria-labelledby="how">
        <h2 id="how" className="mb-5 text-center text-3xl font-semibold">
          Sådan virker det
        </h2>
        <ol className="flex flex-col gap-4">
          {STEPS.map((s, i) => (
            <li
              key={s.n}
              className="flex items-start gap-4 rounded-3xl border-2 border-border bg-card p-5 shadow-soft animate-rise"
              style={{ animationDelay: `${0.35 + i * 0.1}s` }}
            >
              <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gift font-display text-2xl font-semibold text-primary-foreground shadow-gift">
                {s.n}
              </span>
              <div>
                <p className="text-xl font-bold leading-tight">{s.title}</p>
                <p className="mt-1 text-base text-muted-foreground">{s.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <p className="mt-10 text-center text-base text-muted-foreground">
        Tujito betyder <em>til dig</em> 💛
      </p>
    </div>
  );
}
