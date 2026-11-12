// Rules for the "Send surprise" page: the templates and when the send button turns pink.
import { isGreetingReady, type GreetingDraft } from "@/components/tujito/GreetingComposer";

import { isValidPhone, type GreetingKind, type OccasionId } from "./tujito";

export type SurpriseTemplate = {
  id: OccasionId;
  title: string;
  emoji: string;
  kind: GreetingKind;
  message: string;
};

export const SURPRISE_TEMPLATES: SurpriseTemplate[] = [
  {
    id: "morfar",
    title: "Morfar til barnebarn",
    emoji: "👴🏻",
    kind: "text",
    message: "Din morfar tænker på dig og sender dig en lille overraskelse.",
  },
  {
    id: "moster",
    title: "Moster til nevø",
    emoji: "👩🏻",
    kind: "text",
    message: "Din moster sender dig en varm hilsen – bare fordi du er dig.",
  },
  {
    id: "bedstemor",
    title: "Bedstemor til barnebarn",
    emoji: "👵🏻",
    kind: "text",
    message: "Din bedstemor holder så meget af dig og vil gerne overraske dig.",
  },
  {
    id: "ven",
    title: "Ven til ven",
    emoji: "🫶",
    kind: "text",
    message: "En ven tænker på dig i dag og sender dig noget sødt.",
  },
  {
    id: "knus",
    title: "Giv jeres barnebarn et uventet knus",
    emoji: "🤗",
    kind: "text",
    message: "Et stort, varmt knus til dig – bare fordi vi holder så meget af dig.",
  },
];

export function getTemplate(id: string | null) {
  return SURPRISE_TEMPLATES.find((t) => t.id === id) ?? null;
}

export function greetingFromTemplate(t: SurpriseTemplate): GreetingDraft {
  return { kind: t.kind, message: t.message, file: null };
}

export type SurpriseForm = {
  senderName: string;
  templateId: string | null;
  greeting: GreetingDraft;
  recipientName: string;
  recipientPhone: string;
};

export function columnsFilled(f: SurpriseForm) {
  return {
    from: f.senderName.trim().length > 0,
    surprise: !!getTemplate(f.templateId) && isGreetingReady(f.greeting),
    to: f.recipientName.trim().length > 0 && isValidPhone(f.recipientPhone),
  };
}

export function canSendSurprise(f: SurpriseForm) {
  const c = columnsFilled(f);
  return c.from && c.surprise && c.to;
}

/** "Mormor" · "Mormor og Morfar" · "Mormor, Morfar og Onkel Ib" */
export function joinNames(names: string[]) {
  const n = names.map((x) => x.trim()).filter(Boolean);
  if (n.length <= 1) return n[0] ?? "";
  return `${n.slice(0, -1).join(", ")} og ${n[n.length - 1]}`;
}

/** art: "bedstemor" | "barnebarn" use the drawn portraits; anything else is an emoji. */
export type Person = { name: string; art: string };

function person(name: string, art: string): Person {
  return { name, art };
}

/** Who the gift can be from – the list under the left icon. */
export const FROM_PEOPLE: Person[] = [
  person("Morfar", "👴🏻"),
  person("Mormor", "👵🏻"),
  person("Bedstemor", "bedstemor"),
  person("Bedstefar", "🧓🏻"),
  person("Moster", "👩🏻‍🦰"),
  person("Onkel", "🧔🏻"),
  person("Ven", "🫶"),
  person("Mor", "👩🏻"),
  person("Far", "👨🏻"),
];

/** Who the gift can be to – the list under the right icon. */
export const TO_PEOPLE: Person[] = [
  person("Barnebarn", "barnebarn"),
  person("Nevø", "👦🏻"),
  person("Niece", "👧🏻"),
  person("Ven", "🫶"),
  person("Mor", "👩🏻"),
  person("Far", "👨🏻"),
  person("Bedstemor", "bedstemor"),
  person("Morfar", "👴🏻"),
  person("Moster", "👩🏻‍🦰"),
  person("Onkel", "🧔🏻"),
];

export const DEFAULT_FROM = person("Bedstemor", "bedstemor");
export const DEFAULT_TO = person("Barnebarn", "barnebarn");
