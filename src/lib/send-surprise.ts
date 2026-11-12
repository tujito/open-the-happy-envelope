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
    id: "knus",
    title: "Giv jeres barnebarn et uventet knus",
    emoji: "🤗",
    kind: "text",
    message: "Et stort, varmt knus til dig – bare fordi vi holder så meget af dig.",
  },
  {
    id: "varm-hilsen",
    title: "Send en varm hilsen",
    emoji: "💌",
    kind: "text",
    message: "Vi tænker på dig og sender dig en masse varme tanker i dag.",
  },
  { id: "sang", title: "Send en sang", emoji: "🎵", kind: "audio", message: "" },
  { id: "minde", title: "Send et minde", emoji: "📸", kind: "text", message: "Kan du huske, da vi…" },
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
