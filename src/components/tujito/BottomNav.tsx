import { Link } from "@tanstack/react-router";

import { NAV_ITEMS } from "./nav-items";

export function BottomNav() {
  return (
    <nav
      aria-label="Menu"
      className="fixed inset-x-0 bottom-0 z-50 rounded-t-[1.75rem] bg-nav shadow-nav"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto grid h-[var(--bottom-nav-h)] max-w-lg grid-cols-5 items-stretch px-1.5 pt-1.5">
        {NAV_ITEMS.map(({ to, label, icon: Icon }) => (
          <li key={to} className="flex">
            <Link
              to={to}
              className="group flex flex-1 flex-col items-center justify-start gap-1 rounded-2xl px-0.5 pt-1.5 text-center text-muted-foreground transition-colors active:scale-95 data-[status=active]:text-primary"
            >
              <span className="flex h-10 w-14 items-center justify-center rounded-full transition-colors group-data-[status=active]:bg-secondary">
                <Icon className="size-7" strokeWidth={2.2} aria-hidden />
              </span>
              <span className="text-[0.8rem] font-bold leading-tight">{label}</span>
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}
