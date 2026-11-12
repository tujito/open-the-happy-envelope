import { QueryClient } from "@tanstack/react-query";
import { createRouter, rootRouteId } from "@tanstack/react-router";
import { describe, expect, it } from "vitest";

import { routeTree } from "@/routeTree.gen";

// Match routes without running loaders or rendering: loaders may need a server or
// network the test run lacks, and jsdom never loads the stylesheets React waits on.
describe("App routing", () => {
  it("matches a page for / instead of falling back to not found", () => {
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });

    const matches = router.matchRoutes("/");

    expect(matches.at(-1)?.routeId).not.toBe(rootRouteId);
  });
});

describe("Bottom menu", () => {
  it("has the five buttons in the requested order", async () => {
    const { NAV_ITEMS } = await import("@/components/tujito/nav-items");
    expect(NAV_ITEMS.map((i) => i.label)).toEqual(["Børsen", "Send surprise", "My Net", "Send Tak", "My Feed"]);
  });

  it("Send surprise opens the page where you start a surprise", async () => {
    const { NAV_ITEMS } = await import("@/components/tujito/nav-items");
    expect(NAV_ITEMS.find((i) => i.label === "Send surprise")?.to).toBe("/lav");
  });

  it("every button leads to a real page", async () => {
    const { NAV_ITEMS } = await import("@/components/tujito/nav-items");
    const router = createRouter({ routeTree, context: { queryClient: new QueryClient() } });
    for (const item of NAV_ITEMS) {
      expect(router.matchRoutes(item.to).at(-1)?.routeId).toBe(item.to);
    }
  });
});
