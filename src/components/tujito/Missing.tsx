import { Link } from "@tanstack/react-router";

import giftImage from "@/assets/tujito-gift.png";
import { Button } from "@/components/ui/button";

import { Shell } from "./Shell";

export function MissingTujito() {
  return (
    <Shell>
      <div className="my-auto text-center">
        <img src={giftImage} alt="" width={1024} height={1024} className="mx-auto w-40 opacity-80" />
        <h1 className="mt-4 text-4xl font-semibold">Vi kan ikke finde gaven</h1>
        <p className="mt-3 text-xl text-muted-foreground">
          Linket virker ikke helt. Tjek at du har fået hele linket med.
        </p>
        <Button asChild variant="gift" size="xl" className="mt-8">
          <Link to="/">Til forsiden</Link>
        </Button>
      </div>
    </Shell>
  );
}
