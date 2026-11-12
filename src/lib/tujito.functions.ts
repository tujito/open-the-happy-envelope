import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

import { MEDIA_PATH_PATTERN, OCCASION_IDS } from "./tujito";

const BUCKET = "tujito-media";

const greetingSchema = z
  .object({
    kind: z.enum(["text", "video", "audio"]),
    message: z.string().trim().max(4000).optional().default(""),
    mediaPath: z.string().regex(MEDIA_PATH_PATTERN).nullable().optional().default(null),
  })
  .refine((g) => (g.kind === "text" ? g.message.length > 0 : !!g.mediaPath), {
    message: "Hilsenen mangler indhold",
  });

const idSchema = z.object({ id: z.string().uuid() });

/** Signed links must point at the address the visitor's browser can reach. */
function toBrowserUrl(url: string) {
  const serverBase = process.env["SUPABASE_URL"]?.replace(/\/+$/, "");
  const publicBase = (process.env["VITE_SUPABASE_URL"] ?? import.meta.env.VITE_SUPABASE_URL)?.replace(/\/+$/, "");
  if (serverBase && publicBase && serverBase !== publicBase && url.startsWith(serverBase)) {
    return publicBase + url.slice(serverBase.length);
  }
  return url;
}

async function admin() {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  return supabaseAdmin;
}

/** Gives the browser a one-time upload slot for a video or voice greeting. */
export const getMediaUploadSlot = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ ext: z.enum(["webm", "mp4", "m4a", "mp3", "ogg", "wav", "mov", "aac", "3gp"]) }).parse(input),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const path = `uploads/${crypto.randomUUID()}.${data.ext}`;
    const { data: slot, error } = await db.storage.from(BUCKET).createSignedUploadUrl(path);
    if (error || !slot) throw new Error("Kunne ikke gøre klar til upload");
    return { path, token: slot.token };
  });

export const createTujito = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z
      .object({
        recipientName: z.string().trim().min(1).max(80),
        recipientPhone: z.string().trim().max(30),
        occasion: z.enum(OCCASION_IDS),
        greeting: greetingSchema,
      })
      .parse(input),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: row, error } = await db
      .from("tujitos")
      .insert({
        recipient_name: data.recipientName,
        recipient_phone: data.recipientPhone,
        occasion: data.occasion,
      })
      .select("id")
      .single();
    if (error || !row) throw new Error("Kunne ikke gemme din Tujito");

    const { error: gErr } = await db.from("tujito_greetings").insert({
      tujito_id: row.id,
      kind: data.greeting.kind,
      message: data.greeting.message || null,
      media_path: data.greeting.mediaPath,
    });
    if (gErr) throw new Error("Kunne ikke gemme din hilsen");
    return { id: row.id };
  });

export const addGreeting = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) =>
    z.object({ id: z.string().uuid(), greeting: greetingSchema }).parse(input),
  )
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: t } = await db.from("tujitos").select("id").eq("id", data.id).maybeSingle();
    if (!t) throw new Error("Tujito findes ikke");
    const { error } = await db.from("tujito_greetings").insert({
      tujito_id: data.id,
      kind: data.greeting.kind,
      message: data.greeting.message || null,
      media_path: data.greeting.mediaPath,
    });
    if (error) throw new Error("Kunne ikke gemme din hilsen");
    return { ok: true };
  });

/** Public teaser: only the recipient's first name and the occasion – never the phone number or greetings. */
export const getTujitoTeaser = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: t } = await db
      .from("tujitos")
      .select("id, recipient_name, occasion")
      .eq("id", data.id)
      .maybeSingle();
    if (!t) return null;
    const { count } = await db
      .from("tujito_greetings")
      .select("id", { count: "exact", head: true })
      .eq("tujito_id", data.id);
    return {
      id: t.id,
      recipientName: t.recipient_name,
      occasion: t.occasion,
      greetingCount: count ?? 0,
    };
  });

/** Called when the recipient presses "Åbn din overraskelse". */
export const openTujito = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => idSchema.parse(input))
  .handler(async ({ data }) => {
    const db = await admin();
    const { data: t } = await db
      .from("tujitos")
      .select("id, opened_at")
      .eq("id", data.id)
      .maybeSingle();
    if (!t) throw new Error("Tujito findes ikke");
    if (!t.opened_at) {
      await db.from("tujitos").update({ opened_at: new Date().toISOString() }).eq("id", data.id);
    }
    const { data: rows } = await db
      .from("tujito_greetings")
      .select("id, kind, message, media_path, created_at")
      .eq("tujito_id", data.id)
      .order("created_at", { ascending: true });

    const greetings = await Promise.all(
      (rows ?? []).map(async (g) => {
        let mediaUrl: string | null = null;
        if (g.media_path) {
          const { data: signed } = await db.storage
            .from(BUCKET)
            .createSignedUrl(g.media_path, 60 * 60 * 24);
          mediaUrl = signed?.signedUrl ? toBrowserUrl(signed.signedUrl) : null;
        }
        return {
          id: g.id,
          kind: g.kind as "text" | "video" | "audio",
          message: g.message,
          mediaUrl,
        };
      }),
    );
    return { greetings };
  });
