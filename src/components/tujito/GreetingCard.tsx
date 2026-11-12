type Greeting = {
  id: string;
  kind: "text" | "video" | "audio";
  message: string | null;
  mediaUrl: string | null;
};

export function GreetingCard({ greeting, index }: { greeting: Greeting; index: number }) {
  return (
    <article
      className="relative rounded-3xl border-2 border-border bg-card p-6 shadow-soft animate-rise"
      style={{ animationDelay: `${0.15 + index * 0.12}s` }}
    >
      <span aria-hidden className="absolute -top-4 left-6 rounded-full bg-gift px-3 py-1 text-sm font-bold text-primary-foreground shadow-gift">
        {greeting.kind === "video" ? "🎬 Video" : greeting.kind === "audio" ? "🎙️ Lyd" : "💌 Hilsen"}
      </span>
      {greeting.kind === "video" && greeting.mediaUrl && (
        <video src={greeting.mediaUrl} controls playsInline className="mt-2 w-full rounded-2xl" />
      )}
      {greeting.kind === "audio" && greeting.mediaUrl && (
        <audio src={greeting.mediaUrl} controls className="mt-3 w-full" />
      )}
      {greeting.message && (
        <p className="mt-3 whitespace-pre-wrap font-display text-2xl leading-snug text-foreground">
          {greeting.message}
        </p>
      )}
      <p className="mt-4 text-base font-semibold text-muted-foreground">– fra en, der holder af dig</p>
    </article>
  );
}
