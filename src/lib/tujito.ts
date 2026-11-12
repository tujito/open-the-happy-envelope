// Shared, browser-safe Tujito helpers and wording.

export const OCCASIONS = [
  { id: "fodselsdag", label: "Fødselsdag", emoji: "🎂", headline: "Tillykke med fødselsdagen!" },
  { id: "tak", label: "Tak", emoji: "💐", headline: "Tusind tak!" },
  { id: "opmuntring", label: "Opmuntring", emoji: "🌻", headline: "Du kan godt!" },
  { id: "bare-fordi", label: "Bare fordi", emoji: "💛", headline: "Bare fordi du er dig" },
  { id: "knus", label: "Et uventet knus", emoji: "🤗", headline: "Et stort knus til dig!" },
  { id: "varm-hilsen", label: "En varm hilsen", emoji: "💌", headline: "En varm hilsen til dig!" },
  { id: "sang", label: "En sang", emoji: "🎵", headline: "En sang til dig!" },
  { id: "minde", label: "Et minde", emoji: "📸", headline: "Et minde til dig!" },
] as const;

export type OccasionId = (typeof OCCASIONS)[number]["id"];
export const OCCASION_IDS = OCCASIONS.map((o) => o.id) as [OccasionId, ...OccasionId[]];

export function getOccasion(id: string) {
  return OCCASIONS.find((o) => o.id === id) ?? OCCASIONS[3];
}

export type GreetingKind = "text" | "video" | "audio";

export const MEDIA_PATH_PATTERN = /^uploads\/[0-9a-f-]{36}\.(webm|mp4|m4a|mp3|ogg|wav|mov|aac|3gp)$/;

/** Danish phone numbers are 8 digits; we accept a leading +45 or other country codes too. */
export function isValidPhone(phone: string) {
  const digits = phone.replace(/\D/g, "");
  return digits.length >= 8 && digits.length <= 15;
}

export function extensionFor(type: string, fallback: string) {
  const t = type.toLowerCase();
  if (t.includes("webm")) return "webm";
  if (t.includes("quicktime")) return "mov";
  if (t.includes("3gpp")) return "3gp";
  if (t.includes("mp4")) return t.startsWith("audio") ? "m4a" : "mp4";
  if (t.includes("mpeg")) return "mp3";
  if (t.includes("ogg")) return "ogg";
  if (t.includes("wav")) return "wav";
  if (t.includes("aac")) return "aac";
  return fallback;
}

export function recipientLink(id: string) {
  return `${window.location.origin}/til/${id}`;
}

export function joinLink(id: string) {
  return `${window.location.origin}/med/${id}`;
}

export function smsHref(phone: string, body: string) {
  const clean = phone.replace(/[^\d+]/g, "");
  const isApple = /iPhone|iPad|iPod|Macintosh/.test(navigator.userAgent);
  return `sms:${clean}${isApple ? "&" : "?"}body=${encodeURIComponent(body)}`;
}

/** Opens the phone's own share sheet, or copies the link if that isn't available. Returns "copied" when copied. */
export async function shareLink(url: string, text: string): Promise<"shared" | "copied" | "failed"> {
  if (navigator.share) {
    try {
      await navigator.share({ title: "Tujito", text, url });
      return "shared";
    } catch {
      // the person closed the share sheet – fall through to copy
    }
  }
  try {
    await navigator.clipboard.writeText(url);
    return "copied";
  } catch {
    return "failed";
  }
}
