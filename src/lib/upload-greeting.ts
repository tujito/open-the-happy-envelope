import { supabase } from "@/integrations/supabase/client";

import { getMediaUploadSlot } from "./tujito.functions";
import { extensionFor } from "./tujito";
import type { GreetingDraft } from "@/components/tujito/GreetingComposer";

/** Uploads the video/voice part of a greeting (if any) and returns what the server needs to save it. */
export async function prepareGreeting(g: GreetingDraft) {
  if (g.kind === "text" || !g.file) {
    return { kind: "text" as const, message: g.message.trim(), mediaPath: null };
  }
  const ext = extensionFor(g.file.type, g.kind === "video" ? "mp4" : "webm") as
    | "webm" | "mp4" | "m4a" | "mp3" | "ogg" | "wav" | "mov" | "aac" | "3gp";
  const slot = await getMediaUploadSlot({ data: { ext } });
  const { error } = await supabase.storage
    .from("tujito-media")
    .uploadToSignedUrl(slot.path, slot.token, g.file, { contentType: g.file.type || undefined });
  if (error) throw new Error("upload");
  return { kind: g.kind, message: g.message.trim(), mediaPath: slot.path };
}
