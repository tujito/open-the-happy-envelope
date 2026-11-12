import { createFileRoute } from "@tanstack/react-router";
import { Check, ChevronDown, Copy, Heart, MessageCircle, Send, Share2, Users } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";

import avatarBarnebarn from "@/assets/avatar-barnebarn.png";
import avatarBedstemor from "@/assets/avatar-bedstemor.png";
import giftImage from "@/assets/tujito-gift.png";
import { Shell } from "@/components/tujito/Shell";
import { GreetingComposer, emptyGreeting, type GreetingDraft } from "@/components/tujito/GreetingComposer";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_FROM,
  DEFAULT_TO,
  FROM_PEOPLE,
  SURPRISE_TEMPLATES,
  TO_PEOPLE,
  canSendSurprise,
  columnsFilled,
  getTemplate,
  greetingFromTemplate,
  joinNames,
  type Person,
} from "@/lib/send-surprise";
import { createTujito } from "@/lib/tujito.functions";
import { joinLink, recipientLink, shareLink, smsHref } from "@/lib/tujito";
import { prepareGreeting } from "@/lib/upload-greeting";

export const Route = createFileRoute("/lav")({
  head: () => ({
    meta: [
      { title: "Send surprise – Tujito" },
      { name: "description", content: "Vælg hvem gaven er fra, hvilken overraskelse I vil give, og hvem den skal til." },
      { property: "og:title", content: "Send surprise – Tujito" },
      { property: "og:description", content: "Vælg hvem gaven er fra, hvilken overraskelse I vil give, og hvem den skal til." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SendSurprise,
});

const MY_PERSON_KEY = "tujito-mit-person";
const fieldClass =
  "h-14 rounded-2xl border-2 bg-background px-4 text-xl md:text-xl shadow-none focus-visible:ring-2";

function personImage(art: string) {
  if (art === "bedstemor") return avatarBedstemor;
  if (art === "barnebarn") return avatarBarnebarn;
  return null;
}

function SendSurprise() {
  const [from, setFrom] = useState<Person>(DEFAULT_FROM);
  const [to, setTo] = useState<Person>(DEFAULT_TO);
  const [picker, setPicker] = useState<"from" | "to" | null>(null);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [greeting, setGreeting] = useState<GreetingDraft>(emptyGreeting);
  const [recipientPhone, setRecipientPhone] = useState("");
  const [triedSend, setTriedSend] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ id: string; name: string; phone: string } | null>(null);

  // Remember who you are on this phone, so you only choose once.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(MY_PERSON_KEY);
      if (saved) setFrom(JSON.parse(saved) as Person);
    } catch {
      // old or broken value – keep the default
    }
  }, []);
  useEffect(() => {
    if (from.name.trim()) window.localStorage.setItem(MY_PERSON_KEY, JSON.stringify(from));
  }, [from]);

  const form = {
    senderName: from.name,
    templateId,
    greeting,
    recipientName: to.name,
    recipientPhone,
  };
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
          recipientName: to.name.trim(),
          recipientPhone: recipientPhone.trim(),
          occasion: template.id,
          greeting: prepared,
        },
      });
      setSent({ id, name: to.name.trim(), phone: recipientPhone });
    } catch {
      toast.error("Ups, det lykkedes ikke at sende. Prøv igen om lidt.");
    } finally {
      setSending(false);
    }
  }

  if (sent) return <Sent {...sent} helpers={[]} />;

  return (
    <div className="mx-auto flex min-h-page w-full max-w-2xl flex-col px-4 pb-10 sm:px-6">
      {/* Fast top-bar: FRA – Tujito? – TIL */}
      <div className="sticky top-0 z-40 -mx-4 rounded-b-[1.75rem] bg-nav px-4 pb-3 pt-3 shadow-soft sm:-mx-6 sm:px-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start">
          <PersonButton
            label="FRA"
            person={from}
            presets={FROM_PEOPLE}
            open={picker === "from"}
            onToggle={() => setPicker(picker === "from" ? null : "from")}
            onClose={() => setPicker(null)}
            onPick={(p) => {
              setFrom(p);
              setPicker(null);
            }}
          />
          <p className="pt-6 text-center font-display text-4xl font-semibold text-gift">Tujito?</p>
          <PersonButton
            label="TIL"
            person={to}
            presets={TO_PEOPLE}
            align="right"
            open={picker === "to"}
            onToggle={() => setPicker(picker === "to" ? null : "to")}
            onClose={() => setPicker(null)}
            onPick={(p) => {
              setTo(p);
              setPicker(null);
            }}
          />
        </div>
      </div>

      {/* Skabeloner – vandret scroll */}
      <section aria-label="Vælg overraskelse" className="mt-5">
        <h1 className="text-2xl font-semibold">Vælg overraskelse</h1>
        <div
          role="radiogroup"
          aria-label="Skabeloner"
          className="-mx-4 mt-3 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 sm:-mx-6 sm:px-6"
        >
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
                  "relative flex w-44 shrink-0 snap-start flex-col items-start gap-2 rounded-3xl border-2 p-4 text-left transition-all active:scale-[0.97] " +
                  (active
                    ? "border-primary bg-blush text-secondary-foreground shadow-gift"
                    : "border-border bg-card text-foreground hover:border-primary/50")
                }
              >
                <span
                  aria-hidden
                  className={
                    "flex size-12 items-center justify-center rounded-2xl text-2xl " +
                    (active ? "bg-card" : "bg-muted")
                  }
                >
                  {t.emoji}
                </span>
                <span className="text-lg font-bold leading-snug">{t.title}</span>
                {active && (
                  <span className="absolute right-2.5 top-2.5 flex size-7 items-center justify-center rounded-full bg-primary text-primary-foreground animate-pop">
                    <Check className="size-4" />
                  </span>
                )}
              </button>
            );
          })}
        </div>
        {triedSend && !template && <Hint>Tryk på en af overraskelserne.</Hint>}
      </section>

      {/* Den valgte skabelon – vist stort */}
      {template && (
        <section aria-label="Din overraskelse" className="mt-5 rounded-[2rem] border-2 border-primary/50 bg-card p-6 text-center shadow-soft animate-rise">
          <span aria-hidden className="text-6xl">
            {template.emoji}
          </span>
          <h2 className="mt-2 text-3xl font-semibold">{template.title}</h2>
          <p className="mt-1 text-lg text-muted-foreground">
            Fra {from.name} til {to.name}
          </p>
          <div className="mt-5 border-t-2 border-dashed border-border pt-5 text-left">
            <p className="mb-3 text-lg font-bold">Gør den personlig</p>
            <GreetingComposer value={greeting} onChange={setGreeting} recipientName={to.name.trim()} />
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
        </section>
      )}

      {/* Telefonnummer */}
      <section aria-label="Telefonnummer" className="mt-5 rounded-[2rem] border-2 border-border bg-card p-5 shadow-soft">
        <FieldLabel htmlFor="recipient-phone">{to.name}s telefon- eller SMS-nummer</FieldLabel>
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
        {triedSend && !filled.to && <Hint>Skriv et nummer med 8 cifre.</Hint>}
      </section>

      {/* Send-knap */}
      <div className="mx-auto mt-8 w-full max-w-md">
        <Button
          variant={ready ? "gift" : "soft"}
          size="xl"
          onClick={send}
          disabled={sending}
          aria-disabled={!ready}
          className={
            "h-20 text-2xl " +
            (ready ? "" : "border-transparent bg-muted text-muted-foreground shadow-none hover:border-transparent")
          }
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
            : "Vælg en overraskelse og skriv nummeret, så bliver knappen lyserød."}
        </p>
      </div>
    </div>
  );
}

function PersonButton({
  label,
  person,
  presets,
  open,
  align = "left",
  onToggle,
  onClose,
  onPick,
}: {
  label: string;
  person: Person;
  presets: Person[];
  open: boolean;
  align?: "left" | "right";
  onToggle: () => void;
  onClose: () => void;
  onPick: (p: Person) => void;
}) {
  const box = useRef<HTMLDivElement>(null);
  const img = personImage(person.art);

  // Tap somewhere else on the page – or press Escape – and the list closes again.
  useEffect(() => {
    if (!open) return;
    function onDown(e: PointerEvent) {
      if (!box.current?.contains(e.target as Node)) onClose();
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("pointerdown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  return (
    <div ref={box} className={"relative " + (align === "right" ? "justify-self-end" : "justify-self-start")}>
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-haspopup="listbox"
        aria-label={`${label}: ${person.name}. Tryk for at skifte person.`}
        className={
          "flex flex-col items-center gap-0.5 rounded-2xl p-1 transition-colors active:scale-95 " +
          (open ? " bg-secondary" : "")
        }
      >
        <span className="text-xs font-bold tracking-widest text-muted-foreground">{label}</span>
        <span className="relative flex size-16 items-center justify-center overflow-hidden rounded-full border-2 border-primary/40 bg-blush text-3xl shadow-soft">
          {img ? (
            <img src={img} alt="" width={816} height={816} className="size-full object-cover" />
          ) : (
            <span aria-hidden>{person.art}</span>
          )}
          <span className="absolute bottom-0 right-0 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ChevronDown className="size-3.5" />
          </span>
        </span>
        <span className="max-w-24 truncate text-base font-bold">{person.name}</span>
      </button>

      {open && (
        <div
          role="listbox"
          aria-label={label === "FRA" ? "Vælg hvem gaven er fra" : "Vælg hvem gaven skal til"}
          className={
            "absolute top-full z-50 mt-2 max-h-72 w-60 overflow-y-auto rounded-3xl border border-primary/15 bg-card p-2 shadow-soft animate-rise " +
            (align === "right" ? "right-0" : "left-0")
          }
        >
          {presets.map((p) => {
            const active = person.name === p.name && person.art === p.art;
            const pimg = personImage(p.art);
            return (
              <button
                key={p.name}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => onPick(p)}
                className={
                  "flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left text-lg font-bold transition-colors active:scale-[0.98] " +
                  (active ? "bg-blush text-secondary-foreground" : "hover:bg-muted")
                }
              >
                <span className="flex size-10 shrink-0 items-center justify-center overflow-hidden rounded-full bg-muted text-xl">
                  {pimg ? (
                    <img
                      src={pimg}
                      alt=""
                      width={816}
                      height={816}
                      loading="lazy"
                      className="size-full object-cover"
                    />
                  ) : (
                    <span aria-hidden>{p.art}</span>
                  )}
                </span>
                {p.name}
                {active && <Check className="ml-auto size-5 shrink-0 text-primary" />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PersonPicker({
  title,
  presets,
  person,
  onPick,
  onName,
  onDone,
}: {
  title: string;
  presets: Person[];
  person: Person;
  onPick: (p: Person) => void;
  onName: (name: string) => void;
  onDone: () => void;
}) {
  return (
    <section aria-label={title} className="mt-4 rounded-[2rem] border-2 border-primary/40 bg-card p-5 shadow-soft animate-rise">
      <h2 className="text-xl font-semibold">{title}</h2>
      <div className="mt-3 grid grid-cols-3 gap-2">
        {presets.map((p) => {
          const active = person.name === p.name && person.art === p.art;
          const img = personImage(p.art);
          return (
            <button
              key={p.name}
              type="button"
              onClick={() => onPick(p)}
              aria-pressed={active}
              className={
                "flex flex-col items-center gap-1 rounded-2xl border-2 p-3 transition-all active:scale-95 " +
                (active ? "border-primary bg-blush" : "border-border bg-background hover:border-primary/50")
              }
            >
              <span className="flex size-12 items-center justify-center overflow-hidden rounded-full bg-muted text-2xl">
                {img ? <img src={img} alt="" width={816} height={816} loading="lazy" className="size-full object-cover" /> : <span aria-hidden>{p.art}</span>}
              </span>
              <span className="text-base font-bold">{p.name}</span>
            </button>
          );
        })}
      </div>
      <FieldLabel htmlFor="person-custom-name">Eller skriv et navn</FieldLabel>
      <Input
        id="person-custom-name"
        value={person.name}
        onChange={(e) => onName(e.target.value)}
        placeholder="Fx Bedste"
        maxLength={60}
        className={fieldClass}
      />
      <Button variant="gift" size="big" className="mt-4 w-full" onClick={onDone}>
        <Check /> Sådan!
      </Button>
    </section>
  );
}

function FieldLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 mt-4 block text-lg font-bold first:mt-0">
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
          Din surprise til <strong>{name}</strong> er pakket ind. Nu skal {name} bare have den.
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
