import { Mic, RotateCcw, Square } from "lucide-react";
import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";

function pickMime() {
  if (typeof MediaRecorder === "undefined") return "";
  for (const t of ["audio/webm;codecs=opus", "audio/webm", "audio/mp4", "audio/ogg"]) {
    if (MediaRecorder.isTypeSupported(t)) return t;
  }
  return "";
}

export function AudioRecorder({
  file,
  onChange,
}: {
  file: Blob | null;
  onChange: (file: Blob | null) => void;
}) {
  const [recording, setRecording] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    if (!file) {
      setUrl(null);
      return;
    }
    const u = URL.createObjectURL(file);
    setUrl(u);
    return () => URL.revokeObjectURL(u);
  }, [file]);

  useEffect(() => () => stopTimer(), []);

  function stopTimer() {
    if (timerRef.current) window.clearInterval(timerRef.current);
    timerRef.current = null;
  }

  async function start() {
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mime = pickMime();
      const rec = new MediaRecorder(stream, mime ? { mimeType: mime } : undefined);
      const chunks: BlobPart[] = [];
      rec.ondataavailable = (e) => e.data.size && chunks.push(e.data);
      rec.onstop = () => {
        stream.getTracks().forEach((t) => t.stop());
        onChange(new Blob(chunks, { type: rec.mimeType || mime || "audio/webm" }));
      };
      recorderRef.current = rec;
      rec.start();
      setSeconds(0);
      setRecording(true);
      timerRef.current = window.setInterval(() => {
        setSeconds((s) => {
          if (s + 1 >= 180) stop();
          return s + 1;
        });
      }, 1000);
    } catch {
      setError("Vi fik ikke lov til at bruge mikrofonen. Tjek at du har sagt ja til mikrofonen, og prøv igen.");
    }
  }

  function stop() {
    stopTimer();
    setRecording(false);
    recorderRef.current?.state === "recording" && recorderRef.current.stop();
  }

  const time = `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;

  if (file && url) {
    return (
      <div className="rounded-3xl border-2 border-border bg-card p-5 shadow-soft animate-pop">
        <p className="mb-3 text-lg font-bold">Din lyd-hilsen 🎙️</p>
        <audio controls src={url} className="w-full" />
        <Button variant="quiet" size="big" className="mt-3 w-full" onClick={() => onChange(null)}>
          <RotateCcw /> Optag igen
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center rounded-3xl border-2 border-dashed border-border bg-card/70 p-6 text-center">
      <button
        type="button"
        onClick={recording ? stop : start}
        aria-label={recording ? "Stop optagelsen" : "Start optagelsen"}
        className={
          "flex size-28 items-center justify-center rounded-full text-primary-foreground shadow-gift transition-transform active:scale-95 " +
          (recording ? "bg-destructive animate-pulse" : "bg-gift")
        }
      >
        {recording ? <Square className="size-10" /> : <Mic className="size-12" />}
      </button>
      <p className="mt-4 text-xl font-bold">{recording ? `Optager… ${time}` : "Tryk for at optage"}</p>
      <p className="mt-1 text-base text-muted-foreground">
        {recording ? "Tryk igen, når du er færdig" : "Sig noget søde – du kan altid prøve igen"}
      </p>
      {error && <p className="mt-3 text-base font-semibold text-destructive">{error}</p>}
    </div>
  );
}
