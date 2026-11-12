import { Link, createFileRoute } from "@tanstack/react-router";
import { Check, Copy, Heart, MessageCircle, Send, Share2, UserPlus, UserRound, Users, X } from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";
import { toast } from "sonner";

import giftImage from "@/assets/tujito-gift.png";
import { Shell } from "@/components/tujito/Shell";
import { GreetingComposer, emptyGreeting, type GreetingDraft } from "@/components/tujito/GreetingComposer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  SURPRISE_TEMPLATES,
  canSendSurprise,
  columnsFilled,
  getTemplate,
  greetingFromTemplate,
  joinNames,
} from "@/lib/send-surprise";
import { createTujito } from "@/lib/tujito.functions";
import { joinLink, recipientLink, shareLink, smsHref } from "@/lib/tujito";
import { prepareGreeting } from "@/lib/upload-greeting";

export const Route = createFileRoute("/lav")({
  head: () => ({
    meta: [
      { title: "Send surprise – Tujito" },
      { name: "description", content: "Vælg hvem I er, hvilken overraskelse I vil give, og hvem den skal til." },
      { property: "og:title", content: "Send surprise – Tujito" },
      { property: "og:description", content: "Vælg hvem I er, hvilken overraskelse I vil give, og hvem den skal til." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SendSurprise,
});

const MY_NAME_KEY = "tujito-mit-navn";
const fieldClass =
  "h-14 rounded-2xl border-2 bg-background px-4 text-xl md:text-xl shadow-none focus-visible:ring-2";

type CoSender = { key: number; name: string };

function SendSurprise() {
  const [senderName, setSenderName] = useState("");
  const [coSenders, setCoSenders] = useState<CoSender[]>([]);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [greeting, setGreeting] = useState<GreetingDraft>(emptyGreeting);
  const [recipientName, setRecipientName] = useState("");
  const [recipientPhone, setRecipientPhone] = useState("");
  const [triedSend, setTriedSend] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ id: string; name: string; phone: string; helpers: string[] } | null>(null);

  // Remember your own name on this phone, so you only type it once.
  useEffect(() => {
    const saved = window.localStorage.getItem(MY_NAME_KEY);
    if (saved) setSenderName(saved);
  }, []);
  useEffect(() => {
    if (senderName.trim()) window.localStorage.setItem(MY_NAME_KEY, senderName.trim());
  }, [senderName]);

  const form = { senderName, templateId, greeting, recipientName, recipientPhone };
  const filled = columnsFilled(form);
  const ready = canSendSurprise(form);
  const template = getTemplate(templateId);

  function chooseTemplate(id: string) {
    if (id === templateId) return;
    const t = getTemplate(id);
    if (!t) return;
    setTemplateId(id);
    setGreeting(greetingFromTemplate(t));
  }

  async function send() {
    if (!ready || !template) {
      setTriedSend(true);
      toast("Der mangler lidt endnu – se de lyserøde beskeder.");
      return;
    }
    setSending(true);
    try {
      const prepared = await prepareGreeting(greeting);
      const { id } = await createTujito({
        data: {
          recipientName: recipientName.trim(),
          recipientPhone: recipientPhone.trim(),
          occasion: template.id,
          greeting: prepared,
        },
      });
      setSent({
        id,
        name: recipientName.trim().split(" ")[0] ?? "",
        phone: recipientPhone,
        helpers: coSenders.map((c) => c.name.trim()).filter(Boolean),
      });
    } catch {
      toast.error("Ups, det lykkedes ikke at sende. Prøv igen om lidt.");
    } finally {
      setSending(false);
    }
  }

  if (sent) return <Sent {...sent} />;

  return (
    <div className="mx-auto flex min-h-page w-full max-w-6xl flex-col px-4 pb-10 pt-5 sm:px-6">
      <header className="mb-6 text-center animate-rise">
        <Link to="/" className="font-display text-2xl font-semibold text-gift" aria-label="Tujito – til forsiden">
          Tujito
        </Link>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Send surprise</h1>
        <p className="mt-2 text-lg text-muted-foreground">Tre små trin – så er gaven pakket ind.</p>
      </header>

      <div className="grid items-start gap-5 lg:grid-cols-3">
        {/* 1 – Fra og med */}
        <Column n={1} title="Fra og med" done={filled.from} delay={0.05}>
          <PersonRow
            label="Dig"
            avatar={<Avatar name={senderName} tone="gift" icon={<UserRound className="size-7" />} />}
          >
            <Input
              id="sender-name"
              aria-label="Dit navn"
              value={senderName}
              onChange={(e) => setSenderName(e.target.value)}
              placeholder="Fx Morfar"
              autoComplete="given-name"
              maxLength={60}
              className={fieldClass}
            />
          </PersonRow>
          {triedSend && !filled.from && <Hint>Skriv dit eget navn.</Hint>}

          {coSenders.length > 0 && (
            <p className="mt-6 text-base font-bold text-muted-foreground">Sammen med</p>
          )}
          <div className="mt-2 flex flex-col gap-4">
            {coSenders.map((c, i) => (
              <PersonRow
                key={c.key}
                label="Medsender"
                avatar={<Avatar name={c.name} tone="peach" icon={<Users className="size-6" />} />}
              >
                <div className="flex items-center gap-2">
                  <Input
                    aria-label={`Navn på medsender ${i + 1}`}
                    value={c.name}
                    autoFocus={!c.name}
                    onChange={(e) =>
                      setCoSenders((list) => list.map((x) => (x.key === c.key ? { ...x, name: e.target.value } : x)))
                    }
                    placeholder="Fx Mormor"
                    maxLength={60}
                    className={fieldClass}
                  />
                  <button
                    type="button"
                    onClick={() => setCoSenders((list) => list.filter((x) => x.key !== c.key))}
                    aria-label="Fjern medsender"
                    className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground active:scale-95"
                  >
                    <X className="size-6" />
                  </button>
                </div>
              </PersonRow>
            ))}
          </div>
          <Button
            variant="soft"
            size="big"
            className="mt-4 w-full border-dashed"
            onClick={() => setCoSenders((list) => [...list, { key: Date.now(), name: "" }])}
          >
            <UserPlus /> Tilføj medsender
          </Button>
        </Column>

        {/* 2 – Vælg overraskelse */}
        <Column n={2} title="Vælg overraskelse" done={filled.surprise} delay={0.12}>
          <div role="radiogroup" aria-label="Vælg overraskelse" className="grid gap-3">
            {SURPRISE_TEMPLATES.map((t) => {
              const active = templateId === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => chooseTemplate(t.id)}
                  className={
                    "relative flex min-h-24 items-center gap-4 rounded-3xl border-2 p-4 pr-12 text-left text-xl font-bold leading-snug transition-all active:scale-[0.98] " +
                    (active
                      ? "border-primary bg-blush text-secondary-foreground shadow-gift"
                      : "border-border bg-background text-foreground hover:border-primary/50")
                  }
                >
                  <span
                    aria-hidden
                    className={
                      "flex size-14 shrink-0 items-center justify-center rounded-2xl text-3xl " +
                      (active ? "bg-card" : "bg-muted")
                    }
                  >
                    {t.emoji}
                  </span>
                  {t.title}
                  {active && (
                    <span className="absolute right-3 top-3 flex size-8 items-center justify-center rounded-full bg-primary text-primary-foreground animate-pop">
                      <Check className="size-5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
          {triedSend && !template && <Hint>Tryk på en af overraskelserne.</Hint>}

          {template && (
            <div className="mt-6 border-t-2 border-dashed border-border pt-5 animate-rise">
              <p className="mb-3 text-lg font-bold">Gør den personlig</p>
              <GreetingComposer value={greeting} onChange={setGreeting} recipientName={recipientName.trim()} />
              {triedSend && !filled.surprise && (
                <Hint>
                  {greeting.kind === "text"
                    ? "Skriv et par ord i feltet."
                    : greeting.kind === "video"
                      ? "Vælg en video først."
                      : "Optag din lyd-hilsen først."}
                </Hint>
              )}
            </div>
          )}
        </Column>

        {/* 3 – Til */}
        <Column n={3} title="Til" done={filled.to} delay={0.19}>
          <div className="flex flex-col items-center text-center">
            <Avatar name={recipientName} tone="blush" size="lg" icon={<Heart className="size-10" />} />
            <p className="mt-3 min-h-8 font-display text-2xl font-semibold">
              {recipientName.trim() || "Barnebarn"}
            </p>
          </div>
          <div className="mt-5 flex flex-col gap-5">
            <div>
              <FieldLabel htmlFor="recipient-name">Navn</FieldLabel>
              <Input
                id="recipient-name"
                value={recipientName}
                onChange={(e) => setRecipientName(e.target.value)}
                placeholder="Fx Barnebarn"
                autoComplete="off"
                maxLength={80}
                className={fieldClass}
              />
              {triedSend && !recipientName.trim() && <Hint>Skriv hvem gaven er til.</Hint>}
            </div>
            <div>
              <FieldLabel htmlFor="recipient-phone">Telefon- eller SMS-nummer</FieldLabel>
              <Input
                id="recipient-phone"
                type="tel"
                inputMode="tel"
                value={recipientPhone}
                onChange={(e) => setRecipientPhone(e.target.value)}
                placeholder="12 34 56 78"
                autoComplete="off"
                maxLength={30}
                className={fieldClass}
              />
              {triedSend && recipientName.trim() && !filled.to && <Hint>Skriv et nummer med 8 cifre.</Hint>}
            </div>
          </div>
        </Column>
      </div>

      <div className="mx-auto mt-8 w-full max-w-md">
        <Button
          variant={ready ? "gift" : "soft"}
          size="xl"
          onClick={send}
          disabled={sending}
          aria-disabled={!ready}
          className={"h-20 text-2xl " + (ready ? "" : "border-transparent bg-muted text-muted-foreground shadow-none")}
        >
          {sending ? (
            "Sender…"
          ) : (
            <>
              <Send /> Send surprise
            </>
          )}
        </Button>
        <p className="mt-3 text-center text-base text-muted-foreground">
          {ready
            ? "Alt er klar! Bagefter får du et link, du kan sende."
            : "Udfyld de tre felter ovenfor, så bliver knappen lyserød."}
        </p>
      </div>
    </div>
  );
}

function Column({
  n,
  title,
  done,
  delay,
  children,
}: {
  n: number;
  title: string;
  done: boolean;
  delay: number;
  children: ReactNode;
}) {
  return (
    <section
      aria-labelledby={`col-${n}`}
      className={
        "rounded-[2rem] border-2 bg-card p-5 shadow-soft transition-colors animate-rise " +
        (done ? "border-primary/50" : "border-border")
      }
      style={{ animationDelay: `${delay}s` }}
    >
      <div className="mb-5 flex items-center gap-3">
        <span
          className={
            "flex size-10 shrink-0 items-center justify-center rounded-full text-lg font-bold transition-colors " +
            (done ? "bg-gift text-primary-foreground" : "bg-muted text-muted-foreground")
          }
          aria-hidden
        >
          {done ? <Check className="size-5" /> : n}
        </span>
        <h2 id={`col-${n}`} className="text-2xl font-semibold">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function Avatar({
  name,
  tone,
  icon,
  size = "md",
}: {
  name: string;
  tone: "gift" | "peach" | "blush";
  icon: ReactNode;
  size?: "md" | "lg";
}) {
  const initial = name.trim().charAt(0).toUpperCase();
  const toneClass =
    tone === "gift"
      ? "bg-gift text-primary-foreground shadow-gift"
      : tone === "peach"
        ? "bg-peach text-accent-foreground"
        : "bg-blush text-secondary-foreground";
  return (
    <span
      aria-hidden
      className={
        "flex shrink-0 items-center justify-center rounded-full font-display font-semibold " +
        toneClass +
        (size === "lg" ? " size-24 text-4xl" : " size-14 text-2xl")
      }
    >
      {initial || icon}
    </span>
  );
}

function PersonRow({ label, avatar, children }: { label: string; avatar: ReactNode; children: ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col items-center gap-1">
        {avatar}
        <span className="text-sm font-bold text-muted-foreground">{label}</span>
      </div>
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-lg font-bold">
      {children}
    </label>
  );
}

function Hint({ children }: { children: ReactNode }) {
  return <p className="mt-2 text-base font-semibold text-primary">{children}</p>;
}

function Sent({ id, name, phone, helpers }: { id: string; name: string; phone: string; helpers: string[] }) {
  const [copied, setCopied] = useState<"til" | "med" | null>(null);
  const [links, setLinks] = useState<{ til: string; med: string; sms: string } | null>(null);
  const helperNames = joinNames(helpers);

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
          Jeres surprise til <strong>{name}</strong> er pakket ind. Nu skal {name} bare have den.
        </p>
      </section>

      {helperNames && (
        <div className="mt-8 rounded-3xl border-2 border-primary/40 bg-secondary p-5 shadow-soft animate-rise" style={{ animationDelay: "0.15s" }}>
          <p className="flex items-center gap-2 text-lg font-bold text-secondary-foreground">
            <Users className="size-5" /> Først: send linket til {helperNames}
          </p>
          <p className="mt-2 text-base text-secondary-foreground/80">
            Så kan {helperNames} lægge en egen lille hilsen i gaven.
          </p>
          <p className="mt-3 break-all rounded-2xl bg-card px-4 py-3 text-base font-semibold text-foreground">
            {links?.med ?? "…"}
          </p>
          <Button variant="soft" size="big" className="mt-3 w-full" onClick={() => share("med")}>
            {copied === "med" ? <Check /> : <Copy />} {copied === "med" ? "Kopieret!" : `Send til ${helperNames}`}
          </Button>
        </div>
      )}

      <div className="mt-5 rounded-3xl border-2 border-border bg-card p-5 shadow-soft animate-rise" style={{ animationDelay: "0.2s" }}>
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

      {!helperNames && (
        <div className="mt-5 rounded-3xl border-2 border-primary/40 bg-secondary p-5 shadow-soft animate-rise" style={{ animationDelay: "0.3s" }}>
          <p className="flex items-center gap-2 text-lg font-bold text-secondary-foreground">
            <Users className="size-5" /> Del dette link med andre, så de også kan være med
          </p>
          <p className="mt-3 break-all rounded-2xl bg-card px-4 py-3 text-base font-semibold text-foreground">
            {links?.med ?? "…"}
          </p>
          <Button variant="soft" size="big" className="mt-3 w-full" onClick={() => share("med")}>
            {copied === "med" ? <Check /> : <Copy />} {copied === "med" ? "Kopieret!" : "Del linket"}
          </Button>
        </div>
      )}
    </Shell>
  );
}
