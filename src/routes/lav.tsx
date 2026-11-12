import { createFileRoute } from "@tanstack/react-router";
import { ArrowLeft, ArrowRight, Check, Copy, Heart, MessageCircle, Send, Share2, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import giftImage from "@/assets/tujito-gift.png";
import { BigLabel, Shell, StepHeader, bigFieldClass } from "@/components/tujito/Shell";
import {
  GreetingComposer,
  emptyGreeting,
  isGreetingReady,
  type GreetingDraft,
} from "@/components/tujito/GreetingComposer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createTujito } from "@/lib/tujito.functions";
import {
  OCCASIONS,
  getOccasion,
  isValidPhone,
  joinLink,
  recipientLink,
  shareLink,
  smsHref,
  type OccasionId,
} from "@/lib/tujito";
import { prepareGreeting } from "@/lib/upload-greeting";

export const Route = createFileRoute("/lav")({
  head: () => ({
    meta: [
      { title: "Lav en Tujito – overrask en, du holder af" },
      { name: "description", content: "Lav en lille hilsen i fire nemme trin og send den som en overraskelse." },
      { property: "og:title", content: "Lav en Tujito – overrask en, du holder af" },
      { property: "og:description", content: "Lav en lille hilsen i fire nemme trin og send den som en overraskelse." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CreateTujito,
});

function CreateTujito() {
  const [step, setStep] = useState(1);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [occasion, setOccasion] = useState<OccasionId | null>(null);
  const [greeting, setGreeting] = useState<GreetingDraft>(emptyGreeting);
  const [sending, setSending] = useState(false);
  const [sentId, setSentId] = useState<string | null>(null);
  const [triedNext, setTriedNext] = useState(false);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "smooth" });
    setTriedNext(false);
  }, [step, sentId]);

  const firstName = name.trim().split(" ")[0] ?? "";
  const canNext =
    step === 1 ? name.trim().length > 0 && isValidPhone(phone) : step === 2 ? !!occasion : step === 3 ? isGreetingReady(greeting) : true;

  function next() {
    if (!canNext) {
      setTriedNext(true);
      return;
    }
    setStep((s) => s + 1);
  }

  async function send() {
    if (!occasion) return;
    setSending(true);
    try {
      const prepared = await prepareGreeting(greeting);
      const { id } = await createTujito({
        data: { recipientName: name.trim(), recipientPhone: phone.trim(), occasion, greeting: prepared },
      });
      setSentId(id);
    } catch {
      toast.error("Ups, det lykkedes ikke at sende. Prøv igen om lidt.");
    } finally {
      setSending(false);
    }
  }

  if (sentId) return <Sent id={sentId} name={firstName} phone={phone} />;

  return (
    <Shell>
      {step === 1 && (
        <section>
          <StepHeader step={1} total={4} title="Hvem skal overraskes?" />
          <div className="flex flex-col gap-5 animate-rise" style={{ animationDelay: "0.1s" }}>
            <div>
              <BigLabel htmlFor="name">Navn på modtager</BigLabel>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Fx Mormor Grethe"
                autoComplete="off"
                maxLength={80}
                className={bigFieldClass}
              />
              {triedNext && !name.trim() && <Hint>Skriv venligst et navn.</Hint>}
            </div>
            <div>
              <BigLabel htmlFor="phone">Telefonnummer</BigLabel>
              <Input
                id="phone"
                type="tel"
                inputMode="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="12 34 56 78"
                autoComplete="off"
                maxLength={30}
                className={bigFieldClass}
              />
              {triedNext && !isValidPhone(phone) && <Hint>Skriv et telefonnummer med 8 cifre.</Hint>}
            </div>
          </div>
        </section>
      )}

      {step === 2 && (
        <section>
          <StepHeader step={2} total={4} title="Hvad er anledningen?" />
          <div role="radiogroup" aria-label="Anledning" className="grid grid-cols-2 gap-3">
            {OCCASIONS.map((o, i) => {
              const active = occasion === o.id;
              return (
                <button
                  key={o.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setOccasion(o.id)}
                  className={
                    "relative flex aspect-square flex-col items-center justify-center gap-2 rounded-3xl border-2 p-4 text-center text-xl font-bold transition-all active:scale-[0.97] animate-pop " +
                    (active
                      ? "border-primary bg-secondary text-secondary-foreground shadow-gift"
                      : "border-border bg-card text-foreground shadow-soft")
                  }
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  {active && (
                    <span className="absolute right-3 top-3 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground">
                      <Check className="size-4" />
                    </span>
                  )}
                  <span className="text-5xl" aria-hidden>
                    {o.emoji}
                  </span>
                  {o.label}
                </button>
              );
            })}
          </div>
          {triedNext && !occasion && <Hint>Tryk på en af knapperne.</Hint>}
        </section>
      )}

      {step === 3 && (
        <section>
          <StepHeader step={3} total={4} title="Hvad vil du sende?" />
          <GreetingComposer value={greeting} onChange={setGreeting} recipientName={firstName} />
          {triedNext && !isGreetingReady(greeting) && (
            <Hint>
              {greeting.kind === "text"
                ? "Skriv et par ord i feltet."
                : greeting.kind === "video"
                  ? "Vælg en video først."
                  : "Optag din lyd-hilsen først."}
            </Hint>
          )}
        </section>
      )}

      {step === 4 && occasion && (
        <section>
          <StepHeader step={4} total={4} title="Din Tujito er klar!" />
          <Preview name={name.trim()} occasion={occasion} greeting={greeting} />
          <Button variant="gift" size="xl" className="mt-8 h-20 text-2xl" onClick={send} disabled={sending}>
            {sending ? (
              "Sender…"
            ) : (
              <>
                <Send /> Send Tujito
              </>
            )}
          </Button>
          <p className="mt-4 text-center text-base text-muted-foreground">
            Bagefter får du et link, du kan dele med andre, så de også kan være med.
          </p>
        </section>
      )}

      <nav className="mt-auto flex flex-col gap-3 pt-8">
        {step < 4 && (
          <Button variant="gift" size="xl" onClick={next} aria-disabled={!canNext} className={canNext ? "" : "opacity-60"}>
            Næste <ArrowRight />
          </Button>
        )}
        {step > 1 && (
          <Button variant="quiet" size="big" onClick={() => setStep((s) => s - 1)} disabled={sending}>
            <ArrowLeft /> Tilbage
          </Button>
        )}
      </nav>
    </Shell>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return <p className="mt-2 text-base font-semibold text-primary">{children}</p>;
}

function Preview({ name, occasion, greeting }: { name: string; occasion: OccasionId; greeting: GreetingDraft }) {
  const o = getOccasion(occasion);
  const [mediaUrl, setMediaUrl] = useState<string | null>(null);
  useEffect(() => {
    if (!greeting.file) return setMediaUrl(null);
    const u = URL.createObjectURL(greeting.file);
    setMediaUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [greeting.file]);

  return (
    <div className="relative overflow-hidden rounded-[2rem] border-2 border-border bg-card shadow-gift animate-pop">
      {/* ribbon */}
      <div aria-hidden className="absolute inset-y-0 left-1/2 w-6 -translate-x-1/2 bg-gift opacity-20" />
      <div className="relative bg-gift px-6 pb-8 pt-6 text-center text-primary-foreground">
        <img src={giftImage} alt="" width={1024} height={1024} className="mx-auto -mb-2 w-28 animate-wiggle" />
        <p className="text-base font-semibold opacity-90">Til {name}</p>
        <p className="mt-1 font-display text-3xl font-semibold">
          {o.headline} {o.emoji}
        </p>
      </div>
      <div className="relative p-6">
        {greeting.kind === "video" && mediaUrl && (
          <video src={mediaUrl} controls playsInline className="w-full rounded-2xl" />
        )}
        {greeting.kind === "audio" && mediaUrl && <audio src={mediaUrl} controls className="w-full" />}
        {greeting.message.trim() && (
          <p className="mt-3 whitespace-pre-wrap font-display text-2xl leading-snug">{greeting.message.trim()}</p>
        )}
        <p className="mt-4 text-base font-semibold text-muted-foreground">– fra en, der holder af dig</p>
      </div>
    </div>
  );
}

function Sent({ id, name, phone }: { id: string; name: string; phone: string }) {
  const [copied, setCopied] = useState<"til" | "med" | null>(null);
  const [links, setLinks] = useState<{ til: string; med: string; sms: string } | null>(null);

  useEffect(() => {
    const til = recipientLink(id);
    const sms = smsHref(phone, `Hej ${name}! Du har fået en lille overraskelse – kun til dig 🎁 ${til}`);
    setLinks({ til, med: joinLink(id), sms });
    window.scrollTo({ top: 0 });
  }, [id, name, phone]);

  async function share(kind: "til" | "med") {
    if (!links) return;
    const text =
      kind === "til"
        ? `Hej ${name}! Du har fået en lille overraskelse – kun til dig 🎁`
        : `Vær med til at overraske ${name}! Læg din egen lille hilsen i gaven her:`;
    const res = await shareLink(links[kind], text);
    if (res === "copied") {
      setCopied(kind);
      toast.success("Linket er kopieret – du kan nu sætte det ind i en besked.");
    } else if (res === "failed") {
      toast.error("Vi kunne ikke dele linket. Prøv igen.");
    }
  }

  return (
    <Shell>
      <section className="text-center">
        <img src={giftImage} alt="" width={1024} height={1024} className="mx-auto w-44 animate-float" />
        <h1 className="mt-2 text-5xl font-semibold text-gift animate-rise">Hurra!</h1>
        <p className="mt-3 text-xl animate-rise" style={{ animationDelay: "0.1s" }}>
          Din Tujito til <strong>{name}</strong> er pakket ind. Nu skal {name} bare have den.
        </p>
      </section>

      <div className="mt-8 rounded-3xl border-2 border-border bg-card p-5 shadow-soft animate-rise" style={{ animationDelay: "0.2s" }}>
        <p className="flex items-center gap-2 text-lg font-bold">
          <Heart className="size-5 text-primary" /> Til {name}
        </p>
        <Button asChild variant="gift" size="xl" className="mt-4">
          <a href={links?.sms ?? "#"}>
            <MessageCircle /> Send til {name} på SMS
          </a>
        </Button>
        <Button variant="quiet" size="big" className="mt-2 w-full" onClick={() => share("til")}>
          {copied === "til" ? <Check /> : <Share2 />} Send på en anden måde
        </Button>
      </div>

      <div className="mt-5 rounded-3xl border-2 border-primary/40 bg-secondary p-5 shadow-soft animate-rise" style={{ animationDelay: "0.3s" }}>
        <p className="flex items-center gap-2 text-lg font-bold text-secondary-foreground">
          <Users className="size-5" /> Del dette link med andre, så de også kan være med
        </p>
        <p className="mt-2 text-base text-secondary-foreground/80">
          Familie og venner kan lægge deres egen hilsen i gaven – også efter du har sendt den.
        </p>
        <p className="mt-3 break-all rounded-2xl bg-card px-4 py-3 text-base font-semibold text-foreground">
          {links?.med ?? "…"}
        </p>
        <Button variant="soft" size="big" className="mt-3 w-full" onClick={() => share("med")}>
          {copied === "med" ? <Check /> : <Copy />} {copied === "med" ? "Kopieret!" : "Del linket"}
        </Button>
      </div>
    </Shell>
  );
}
