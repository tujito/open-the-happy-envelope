import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function Shell({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto flex min-h-dvh w-full max-w-md flex-col px-5 pb-10 pt-5">
      <header className="mb-4 flex items-center justify-center">
        <Link to="/" className="font-display text-2xl font-semibold text-gift" aria-label="Tujito – til forsiden">
          Tujito
        </Link>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
    </div>
  );
}

export function StepHeader({ step, total, title }: { step: number; total: number; title: string }) {
  return (
    <div className="mb-6 animate-rise">
      <div className="mb-4 flex items-center gap-2" aria-label={`Trin ${step} af ${total}`}>
        {Array.from({ length: total }).map((_, i) => (
          <span
            key={i}
            className={
              "h-2.5 flex-1 rounded-full transition-colors " + (i < step ? "bg-gift" : "bg-blush/60")
            }
          />
        ))}
      </div>
      <p className="text-base font-semibold text-muted-foreground">
        Trin {step} af {total}
      </p>
      <h1 className="mt-1 text-4xl font-semibold text-foreground">{title}</h1>
    </div>
  );
}

export function BigLabel({ htmlFor, children }: { htmlFor: string; children: ReactNode }) {
  return (
    <label htmlFor={htmlFor} className="mb-2 block text-lg font-bold text-foreground">
      {children}
    </label>
  );
}

export const bigFieldClass =
  "h-16 rounded-2xl border-2 bg-card px-5 text-xl md:text-xl shadow-soft focus-visible:ring-2";
