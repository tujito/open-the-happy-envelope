import { createFileRoute } from "@tanstack/react-router";
import { Camera, Check, ChevronDown, Copy, Heart, MessageCircle, PenLine, Plus, Send, Share2, Users, X } from "lucide-react";
import { useEffect, useRef, useState, type ReactNode, type RefObject } from "react";
import { toast } from "sonner";

import avatarBarnebarn from "@/assets/avatar-barnebarn.png";
import avatarBedstemor from "@/assets/avatar-bedstemor.png";
import giftImage from "@/assets/tujito-gift.png";
import { Shell } from "@/components/tujito/Shell";
import { GreetingComposer, emptyGreeting, type GreetingDraft } from "@/components/tujito/GreetingComposer";
import { Button } from "@/components/ui/button";
import { Drawer, DrawerContent, DrawerDescription, DrawerHeader, DrawerTitle } from "@/components/ui/drawer";
import { Input } from "@/components/ui/input";
import {
  DEFAULT_FROM,
  DEFAULT_TO,
  FROM_PEOPLE,
  SURPRISE_TEMPLATES,
  TO_PEOPLE,
  canSendSurprise,
  coSenderChoices,
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
      { name: "description", content: "Vælg hvem gaven er fra, hvem der sender med, hvilken overraskelse I giver, og hvem den skal til." },
      { property: "og:title", content: "Send surprise – Tujito" },
      { property: "og:description", content: "Vælg hvem gaven er fra, hvem der sender med, hvilken overraskelse I giver, og hvem den skal til." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SendSurprise,
});

const MY_PERSON_KEY = "tujito-mit-person";
const ME_KEY = "tujito-mig";
const fieldClass =
  "h-14 rounded-2xl border-2 bg-background px-4 text-xl md:text-xl shadow-none focus-visible:ring-2";

type Me = { nick: string; photo: string | null };
type Panel = "top-from" | "top-to" | "me" | "co" | "col-to" | null;

function personImage(art: string) {
  if (art === "bedstemor") return avatarBedstemor;
  if (art === "barnebarn") return avatarBarnebarn;
  return null;
}

/** Shrinks a chosen photo to a small square so it can be kept on this phone. */
function shrinkPhoto(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onload = () => {
      const size = 192;
      const side = Math.min(img.width, img.height);
      const canvas = document.createElement("canvas");
      canvas.width = size;
      canvas.height = size;
      const ctx = canvas.getContext("2d");
      if (!ctx) return reject(new Error("no canvas"));
      ctx.drawImage(img, (img.width - side) / 2, (img.height - side) / 2, side, side, 0, 0, size, size);
      URL.revokeObjectURL(url);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("bad image"));
    };
    img.src = url;
  });
}

function SendSurprise() {
  const [from, setFromState] = useState<Person>(DEFAULT_FROM);
  const [to, setTo] = useState<Person>(DEFAULT_TO);
  const [me, setMe] = useState<Me>({ nick: "", photo: null });
  const [coSenders, setCoSenders] = useState<Person[]>([]);
  const [panel, setPanel] = useState<Panel>(null);
  const [editing, setEditing] = useState(false);
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [greeting, setGreeting] = useState<GreetingDraft>(emptyGreeting);
  const [recipientPhone, setRecipientPhone] = useState("");
  const [triedSend, setTriedSend] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState<{ id: string; name: string; phone: string; helpers: string[] } | null>(null);

  // Remember who you are on this phone, so you only choose once.
  useEffect(() => {
    try {
      const saved = window.localStorage.getItem(MY_PERSON_KEY);
      if (saved) setFromState(JSON.parse(saved) as Person);
      const savedMe = window.localStorage.getItem(ME_KEY);
      if (savedMe) setMe(JSON.parse(savedMe) as Me);
    } catch {
      // old or broken value – keep the default
    }
  }, []);
  useEffect(() => {
    if (from.name.trim()) window.localStorage.setItem(MY_PERSON_KEY, JSON.stringify(from));
  }, [from]);

  function setFrom(p: Person) {
    setFromState(p);
    setCoSenders((list) => list.filter((c) => c.name !== p.name));
  }

  function saveMe(next: Me) {
    setMe(next);
    try {
      window.localStorage.setItem(ME_KEY, JSON.stringify(next));
    } catch {
      toast.error("Billedet er lidt for stort. Prøv et andet.");
    }
  }

  const toggle = (p: Exclude<Panel, null>) => setPanel((cur) => (cur === p ? null : p));
  const close = () => setPanel(null);

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
  const myName = me.nick.trim() || "Dig";

  function chooseTemplate(id: string) {
    if (id === templateId) {
      setEditing(true);
      return;
    }
    const t = getTemplate(id);
    if (!t) return;
    setTemplateId(id);
    setGreeting(greetingFromTemplate(t));
    if (t.kind !== "text") setEditing(true);
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
      setSent({ id, name: to.name.trim(), phone: recipientPhone, helpers: coSenders.map((c) => c.name) });
    } catch {
      toast.error("Ups, det lykkedes ikke at sende. Prøv igen om lidt.");
    } finally {
      setSending(false);
    }
  }

  if (sent) return <Sent {...sent} />;

  return (
    <div className="mx-auto flex min-h-page w-full max-w-2xl flex-col px-4 pb-8 sm:px-6">
      {/* Fast top-bar: FRA – Tujito? – TIL */}
      <div className="sticky top-0 z-40 -mx-4 rounded-b-[1.75rem] bg-nav px-4 pb-3 pt-3 shadow-soft sm:-mx-6 sm:px-6">
        <div className="grid grid-cols-[1fr_auto_1fr] items-start">
          <PersonButton
            label="FRA"
            person={from}
            presets={FROM_PEOPLE}
            open={panel === "top-from"}
            onToggle={() => toggle("top-from")}
            onClose={close}
            onPick={(p) => {
              setFrom(p);
              close();
            }}
          />
          <p className="pt-6 text-center font-display text-4xl font-semibold text-gift">Tujito?</p>
          <PersonButton
            label="TIL"
            person={to}
            presets={TO_PEOPLE}
            align="right"
            open={panel === "top-to"}
            onToggle={() => toggle("top-to")}
            onClose={close}
            onPick={(p) => {
              setTo(p);
              close();
            }}
          />
        </div>
      </div>

      {/* 3 kolonner: Dig – Overraskelse – Tilføj modtager */}
      <div className="mt-4 grid grid-cols-3 gap-2 sm:gap-4">
        {/* Venstre: dig selv og medsendere */}
        <section aria-label="Dig og medsendere" className={columnClass}>
          <Dropdown open={panel === "me"} onClose={close}>
            <AvatarButton
              caption="DIG"
              photo={me.photo}
              art="🙂"
              name={myName}
              expanded={panel === "me"}
              ariaLabel={`Dig: ${myName}. Tryk for at skifte navn eller billede.`}
              onClick={() => toggle("me")}
            />
            {panel === "me" && (
              <PanelBox label="Dit navn og billede">
                <MePanel me={me} onChange={saveMe} onDone={close} />
              </PanelBox>
            )}
          </Dropdown>

          {coSenders.map((c) => (
            <div key={c.name} className="relative flex flex-col items-center gap-0.5 p-1 animate-pop">
              <span className="text-xs font-bold tracking-widest text-muted-foreground">MED</span>
              <Avatar art={c.art} />
              <span className="max-w-full truncate text-base font-bold">{c.name}</span>
              <button
                type="button"
                onClick={() => setCoSenders((list) => list.filter((x) => x.name !== c.name))}
                aria-label={`Fjern ${c.name}`}
                className="absolute right-0 top-4 flex size-7 items-center justify-center rounded-full border-2 border-card bg-muted text-muted-foreground active:scale-90"
              >
                <X className="size-4" />
              </button>
            </div>
          ))}

          <Dropdown open={panel === "co"} onClose={close}>
            <button
              type="button"
              onClick={() => toggle("co")}
              aria-expanded={panel === "co"}
              aria-haspopup="listbox"
              className="flex flex-col items-center gap-1 rounded-2xl p-1 transition-colors active:scale-95"
            >
              <span className="flex size-16 items-center justify-center rounded-full border-2 border-dashed border-primary/60 bg-background text-primary">
                <Plus className="size-7" />
              </span>
              <span className="text-center text-sm font-bold leading-tight text-primary">
                Tilføj
                <br />
                medsender
              </span>
            </button>
            {panel === "co" && (
              <PanelBox label="Vælg en medsender">
                <p className="px-3 pb-1 pt-2 text-base font-bold">Hvem sender med?</p>
                <PeopleList
                  people={coSenderChoices(from, coSenders)}
                  onPick={(p) => {
                    setCoSenders((list) => [...list, p]);
                    close();
                  }}
                />
              </PanelBox>
            )}
          </Dropdown>
        </section>

        {/* Midten: Overraskelser – lodret scroll */}
        <section aria-label="Vælg overraskelse" className={columnClass}>
          <ColumnTitle>Overraskelse</ColumnTitle>
          <div className="relative w-full min-h-64 flex-1">
            <div
              role="radiogroup"
              aria-label="Overraskelser"
              className="absolute inset-0 flex snap-y flex-col items-center gap-3 overflow-y-auto overscroll-contain pb-8 pt-1"
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
                    className="flex shrink-0 snap-start flex-col items-center gap-1 rounded-2xl p-1 transition-transform active:scale-95"
                  >
                    <span
                      className={
                        "relative flex size-16 items-center justify-center rounded-full border-2 text-3xl transition-all " +
                        (active
                          ? "border-primary bg-blush shadow-gift ring-4 ring-primary/25"
                          : "border-border bg-muted")
                      }
                    >
                      <span aria-hidden>{t.emoji}</span>
                      {active && (
                        <span className="absolute -right-1 -top-1 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground animate-pop">
                          <Check className="size-3.5" />
                        </span>
                      )}
                    </span>
                    <span className={"text-base font-bold " + (active ? "text-primary" : "text-foreground")}>
                      {t.title}
                    </span>
                  </button>
                );
              })}
            </div>
            <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 flex h-10 items-end justify-center bg-gradient-to-t from-card to-transparent">
              <ChevronDown className="size-5 text-muted-foreground" />
            </div>
          </div>
          {triedSend && !template && <Hint>Tryk på en</Hint>}
        </section>

        {/* Højre: tilføj modtager */}
        <section aria-label="Modtager" className={columnClass}>
          <Dropdown open={panel === "col-to"} onClose={close}>
            <button
              type="button"
              onClick={() => toggle("col-to")}
              aria-expanded={panel === "col-to"}
              aria-haspopup="dialog"
              aria-label="Tilføj modtager. Tryk for at vælge en modtager eller skrive et telefon- eller SMS-nummer."
              className="flex flex-col items-center gap-1 rounded-2xl p-1 transition-colors active:scale-95"
            >
              <span
                className={
                  "flex size-16 items-center justify-center rounded-full border-2 border-dashed bg-background transition-colors " +
                  (filled.to ? "border-primary bg-blush text-primary" : "border-primary/60 text-primary")
                }
              >
                <Plus className="size-7" />
              </span>
              <span className="text-center text-sm font-bold leading-tight text-primary">
                Tilføj
                <br />
                modtager
              </span>
            </button>
            {panel === "col-to" && (
              <PanelBox label="Vælg hvem gaven skal til" align="right">
                <div className="p-2">
                  <label htmlFor="recipient-phone" className="mb-2 block text-base font-bold">
                    Telefon- eller SMS-nummer
                  </label>
                  <Input
                    id="recipient-phone"
                    type="tel"
                    inputMode="tel"
                    value={recipientPhone}
                    onChange={(e) => setRecipientPhone(e.target.value)}
                    onKeyDown={(e) => e.key === "Enter" && close()}
                    placeholder="12 34 56 78"
                    autoComplete="off"
                    maxLength={30}
                    autoFocus
                    className={fieldClass}
                  />
                  <Button variant="gift" size="big" className="mt-3 w-full" onClick={close}>
                    <Check /> Færdig
                  </Button>
                </div>
                <p className="px-3 pb-1 pt-3 text-base font-bold text-muted-foreground">Eller vælg en modtager</p>
                <PeopleList people={TO_PEOPLE} selected={to} onPick={setTo} />
              </PanelBox>
            )}
          </Dropdown>
          {recipientPhone.trim() && (
            <p className="px-1 text-center text-base font-bold leading-tight text-foreground">
              {to.name}
              <span className="block font-semibold text-muted-foreground">{recipientPhone}</span>
            </p>
          )}
          {triedSend && !filled.to && <Hint>Tilføj en modtager</Hint>}
        </section>
      </div>

      {/* Den valgte hilsen – kan rettes */}
      {template && (
        <button
          type="button"
          onClick={() => setEditing(true)}
          className="mt-4 flex w-full items-center gap-3 rounded-3xl border-2 border-primary/40 bg-card p-3 text-left shadow-soft animate-rise active:scale-[0.99]"
        >
          <span aria-hidden className="flex size-12 shrink-0 items-center justify-center rounded-full bg-blush text-2xl">
            {template.emoji}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-base font-bold">Din hilsen</span>
            <span className={"block truncate text-base " + (filled.surprise ? "text-muted-foreground" : "font-semibold text-primary")}>
              {greetingSummary(greeting)}
            </span>
          </span>
          <span className="flex shrink-0 items-center gap-1 rounded-full bg-secondary px-3 py-2 text-base font-bold text-secondary-foreground">
            <PenLine className="size-4" /> Ret
          </span>
        </button>
      )}

      {/* Send-knap */}
      <div className="mx-auto mt-5 w-full max-w-md">
        <Button
          variant={ready ? "gift" : "soft"}
          size="xl"
          onClick={send}
          disabled={sending}
          aria-disabled={!ready}
          className={
            "h-18 text-2xl " +
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

      <Drawer open={editing} onOpenChange={setEditing}>
        <DrawerContent className="max-h-[92dvh]">
          <div className="mx-auto w-full max-w-md overflow-y-auto px-5 pb-6">
            <DrawerHeader className="px-0 text-left">
              <DrawerTitle className="font-display text-3xl">
                {template ? `${template.emoji} ${template.title}` : "Din hilsen"}
              </DrawerTitle>
              <DrawerDescription className="text-lg">
                Gør den personlig til {to.name}.
              </DrawerDescription>
            </DrawerHeader>
            <GreetingComposer value={greeting} onChange={setGreeting} recipientName={to.name.trim()} />
            <Button variant="gift" size="xl" className="mt-5" onClick={() => setEditing(false)}>
              <Check /> Færdig
            </Button>
          </div>
        </DrawerContent>
      </Drawer>
    </div>
  );
}

const columnClass =
  "flex min-w-0 flex-col items-center gap-3 rounded-[1.75rem] border-2 border-border bg-card px-1 pb-3 pt-3 shadow-soft";

function greetingSummary(g: GreetingDraft) {
  if (g.kind === "video") return g.file ? "🎬 Din video er klar" : "Vælg en video";
  if (g.kind === "audio") return g.file ? "🎙️ Din lyd er klar" : "Tryk og optag din lyd";
  return g.message.trim() || "Skriv et par ord";
}

function ColumnTitle({ children }: { children: ReactNode }) {
  return <h2 className="text-center text-base font-bold leading-tight text-foreground sm:text-lg">{children}</h2>;
}

function Avatar({ art, photo }: { art: string; photo?: string | null | undefined }) {
  const img = photo ?? personImage(art);
  return (
    <span className="relative flex size-16 shrink-0 items-center justify-center overflow-hidden rounded-full border-2 border-primary/40 bg-blush text-3xl shadow-soft">
      {img ? (
        <img src={img} alt="" width={816} height={816} className="size-full object-cover" />
      ) : (
        <span aria-hidden>{art}</span>
      )}
    </span>
  );
}

function AvatarButton({
  caption,
  art,
  photo,
  name,
  expanded,
  ariaLabel,
  onClick,
}: {
  caption: string;
  art: string;
  photo?: string | null | undefined;
  name: string;
  expanded: boolean;
  ariaLabel: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-expanded={expanded}
      aria-haspopup="dialog"
      aria-label={ariaLabel}
      className={
        "flex max-w-full flex-col items-center gap-0.5 rounded-2xl p-1 transition-colors active:scale-95 " +
        (expanded ? "bg-secondary" : "")
      }
    >
      <span className="text-xs font-bold tracking-widest text-muted-foreground">{caption}</span>
      <span className="relative">
        <Avatar art={art} photo={photo} />
        <span className="absolute bottom-0 right-0 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
          <ChevronDown className="size-3.5" />
        </span>
      </span>
      <span className="max-w-full truncate text-base font-bold">{name}</span>
    </button>
  );
}

/** Wraps a button + its little list, and closes the list on a tap elsewhere or Escape. */
function Dropdown({ open, onClose, children }: { open: boolean; onClose: () => void; children: ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  useCloseOutside(box, open, onClose);
  return (
    <div ref={box} className="relative flex max-w-full flex-col items-center">
      {children}
    </div>
  );
}

function PanelBox({ label, align = "left", children }: { label: string; align?: "left" | "right"; children: ReactNode }) {
  return (
    <div
      role="dialog"
      aria-label={label}
      className={
        "absolute top-full z-50 mt-2 max-h-[26rem] w-64 overflow-y-auto rounded-3xl border border-primary/15 bg-card p-2 text-left shadow-soft animate-rise " +
        (align === "right" ? "-right-1" : "-left-1")
      }
    >
      {children}
    </div>
  );
}

function PeopleList({ people, selected, onPick }: { people: Person[]; selected?: Person; onPick: (p: Person) => void }) {
  return (
    <div role="listbox">
      {people.map((p) => {
        const active = !!selected && selected.name === p.name && selected.art === p.art;
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
                <img src={pimg} alt="" width={816} height={816} loading="lazy" className="size-full object-cover" />
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
  );
}

function MePanel({ me, onChange, onDone }: { me: Me; onChange: (m: Me) => void; onDone: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null);
  return (
    <div className="p-2">
      <label htmlFor="my-nick" className="mb-2 block text-base font-bold">
        Dit kaldenavn
      </label>
      <Input
        id="my-nick"
        value={me.nick}
        onChange={(e) => onChange({ ...me, nick: e.target.value })}
        onKeyDown={(e) => e.key === "Enter" && onDone()}
        placeholder="Fx Lise"
        maxLength={30}
        autoComplete="off"
        className={fieldClass}
      />
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={async (e) => {
          const f = e.target.files?.[0];
          e.target.value = "";
          if (!f) return;
          try {
            onChange({ ...me, photo: await shrinkPhoto(f) });
          } catch {
            toast.error("Vi kunne ikke bruge det billede. Prøv et andet.");
          }
        }}
      />
      <Button variant="soft" size="big" className="mt-3 w-full" onClick={() => fileRef.current?.click()}>
        <Camera /> {me.photo ? "Skift billede" : "Vælg billede"}
      </Button>
      <Button variant="gift" size="big" className="mt-2 w-full" onClick={onDone}>
        <Check /> Færdig
      </Button>
    </div>
  );
}

function useCloseOutside(box: RefObject<HTMLDivElement | null>, open: boolean, onClose: () => void) {
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
  }, [box, open, onClose]);
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
  useCloseOutside(box, open, onClose);

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
        <span className="relative">
          <Avatar art={person.art} />
          <span className="absolute bottom-0 right-0 flex size-5 items-center justify-center rounded-full bg-primary text-primary-foreground">
            <ChevronDown className="size-3.5" />
          </span>
        </span>
        <span className="max-w-24 truncate text-base font-bold">{person.name}</span>
      </button>

      {open && (
        <div
          aria-label={label === "FRA" ? "Vælg hvem gaven er fra" : "Vælg hvem gaven skal til"}
          className={
            "absolute top-full z-50 mt-2 max-h-72 w-60 overflow-y-auto rounded-3xl border border-primary/15 bg-card p-2 shadow-soft animate-rise " +
            (align === "right" ? "right-0" : "left-0")
          }
        >
          <PeopleList people={presets} selected={person} onPick={onPick} />
        </div>
      )}
    </div>
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
