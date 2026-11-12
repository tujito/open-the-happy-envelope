import { Film, Mic, PenLine, RotateCcw, Upload } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import type { GreetingKind } from "@/lib/tujito";

import { AudioRecorder } from "./AudioRecorder";

export type GreetingDraft = {
  kind: GreetingKind;
  message: string;
  file: Blob | null;
};

export const emptyGreeting: GreetingDraft = { kind: "text", message: "", file: null };

export function isGreetingReady(g: GreetingDraft) {
  return g.kind === "text" ? g.message.trim().length > 0 : !!g.file;
}

const KINDS: { id: GreetingKind; label: string; icon: typeof PenLine }[] = [
  { id: "text", label: "Skriv en tekst-hilsen", icon: PenLine },
  { id: "video", label: "Upload en video", icon: Film },
  { id: "audio", label: "Optag en lyd-hilsen", icon: Mic },
];

export function GreetingComposer({
  value,
  onChange,
  recipientName,
}: {
  value: GreetingDraft;
  onChange: (g: GreetingDraft) => void;
  recipientName: string;
}) {
  const fileRef = useRef<HTMLInputElement>(null);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [tooBig, setTooBig] = useState(false);

  useEffect(() => {
    if (value.kind !== "video" || !value.file) {
      setVideoUrl(null);
      return;
    }
    const u = URL.createObjectURL(value.file);
    setVideoUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [value.file, value.kind]);

  const setKind = (kind: GreetingKind) =>
    onChange({ ...value, kind, file: kind === value.kind ? value.file : null });

  return (
    <div className="flex flex-col gap-5">
      <div role="radiogroup" aria-label="Hvad vil du sende?" className="grid gap-3">
        {KINDS.map(({ id, label, icon: Icon }) => {
          const active = value.kind === id;
          return (
            <button
              key={id}
              type="button"
              role="radio"
              aria-checked={active}
              onClick={() => setKind(id)}
              className={
                "flex min-h-16 items-center gap-4 rounded-2xl border-2 px-5 py-3 text-left text-xl font-bold transition-all active:scale-[0.98] " +
                (active
                  ? "border-primary bg-secondary text-secondary-foreground shadow-gift"
                  : "border-border bg-card text-foreground shadow-soft")
              }
            >
              <span
                className={
                  "flex size-11 shrink-0 items-center justify-center rounded-full " +
                  (active ? "bg-gift text-primary-foreground" : "bg-muted text-primary")
                }
              >
                <Icon className="size-6" />
              </span>
              {label}
            </button>
          );
        })}
      </div>

      {value.kind === "video" && (
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="video/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0] ?? null;
              e.target.value = "";
              if (f && f.size > 100 * 1024 * 1024) {
                setTooBig(true);
                return;
              }
              setTooBig(false);
              onChange({ ...value, file: f });
            }}
          />
          {videoUrl ? (
            <div className="rounded-3xl border-2 border-border bg-card p-4 shadow-soft animate-pop">
              <video src={videoUrl} controls playsInline className="w-full rounded-2xl" />
              <Button variant="quiet" size="big" className="mt-2 w-full" onClick={() => fileRef.current?.click()}>
                <RotateCcw /> Vælg en anden video
              </Button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => fileRef.current?.click()}
              className="flex w-full flex-col items-center rounded-3xl border-2 border-dashed border-border bg-card/70 p-8 text-center transition-colors active:bg-secondary"
            >
              <span className="flex size-20 items-center justify-center rounded-full bg-gift text-primary-foreground shadow-gift">
                <Upload className="size-9" />
              </span>
              <span className="mt-4 text-xl font-bold">Tryk for at vælge en video</span>
              <span className="mt-1 text-base text-muted-foreground">Fra din telefon eller computer</span>
            </button>
          )}
          {tooBig && (
            <p className="mt-3 text-base font-semibold text-destructive">
              Videoen er lidt for stor. Prøv en kortere video.
            </p>
          )}
        </div>
      )}

      {value.kind === "audio" && (
        <AudioRecorder file={value.file} onChange={(file) => onChange({ ...value, file })} />
      )}

      <div>
        <label htmlFor="greeting-text" className="mb-2 block text-lg font-bold">
          {value.kind === "text" ? "Din hilsen" : "Vil du skrive et par ord med? (valgfrit)"}
        </label>
        <Textarea
          id="greeting-text"
          value={value.message}
          maxLength={4000}
          onChange={(e) => onChange({ ...value, message: e.target.value })}
          placeholder={`Kære ${recipientName || "dig"}…`}
          className="min-h-44 rounded-2xl border-2 bg-card p-5 text-xl leading-relaxed shadow-soft md:text-xl focus-visible:ring-2"
        />
      </div>
    </div>
  );
}
