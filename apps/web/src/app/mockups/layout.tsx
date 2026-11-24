import type { ReactNode } from "react";
import MockupNav from "./_components/mockup-nav";

export const metadata = {
  title: { default: "Mockups", template: "%s · Mockups · EstudioYA" },
  robots: { index: false, follow: false },
};

/**
 * Mockups navegables de las pantallas principales (FE-14). Son estáticos: usan datos de
 * ejemplo de `_data.ts`, no llaman a la API y sus botones no hacen nada.
 * Sirven para acordar el diseño antes de implementar FE-04 a FE-12. Ver docs/MOCKUPS.md.
 */
export default function MockupsLayout({ children }: { children: ReactNode }) {
  return (
    <div>
      <div role="note" className="bg-yellow-100 px-4 py-2 text-center text-xs font-medium text-yellow-900">
        Mockup de diseño · datos de ejemplo · los botones no funcionan todavía
      </div>
      <MockupNav />
      <div className="mx-auto max-w-6xl px-4 py-8 md:py-10">{children}</div>
    </div>
  );
}
