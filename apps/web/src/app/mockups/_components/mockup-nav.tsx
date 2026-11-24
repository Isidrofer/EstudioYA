"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { SCREENS } from "../_screens";

/** Barra para saltar entre mockups. Se desplaza horizontalmente en celular. */
export default function MockupNav() {
  const pathname = usePathname();
  const items = [{ href: "/mockups", title: "Índice" }, ...SCREENS];

  return (
    <nav aria-label="Pantallas del mockup" className="border-b border-border bg-white">
      <ul className="mx-auto flex max-w-6xl gap-1 overflow-x-auto px-4 py-2">
        {items.map((s) => {
          const active = pathname === s.href;
          return (
            <li key={s.href} className="shrink-0">
              <Link
                href={s.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "block rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  active ? "bg-brand-navy text-white" : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {s.title}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
