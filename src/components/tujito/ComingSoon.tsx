import { Link } from "@tanstack/react-router";
import { Gift, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { Button } from "@/components/ui/button";

import { Shell } from "./Shell";

export function ComingSoon({
  icon: Icon,
  title,
  children,
}: {
  icon: LucideIcon;
  title: string;
  children: ReactNode;
}) {
  return (
    <Shell>
      <section className="my-auto text-center">
        <span className="mx-auto flex size-28 items-center justify-center rounded-full bg-gift text-primary-foreground shadow-gift animate-pop">
          <Icon className="size-14" strokeWidth={2} aria-hidden />
        </span>
        <h1 className="mt-6 text-5xl font-semibold animate-rise">{title}</h1>
        <div className="mt-4 text-xl text-muted-foreground animate-rise" style={{ animationDelay: "0.1s" }}>
          {children}
        </div>
        <p className="mt-6 inline-block rounded-full bg-secondary px-5 py-2 text-base font-bold text-secondary-foreground">
          Kommer snart 💛
        </p>
        <Button asChild variant="gift" size="xl" className="mt-8">
          <Link to="/lav">
            <Gift /> Send en overraskelse
          </Link>
        </Button>
      </section>
    </Shell>
  );
}
