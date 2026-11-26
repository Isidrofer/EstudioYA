import { Suspense } from "react";
import type { Metadata } from "next";
import ExplorarCatalogo from "./explorar-catalogo";

export const metadata: Metadata = {
  title: "Explorar catálogo",
  description:
    "Buscá materias y facultades. Encontrá el profe ideal para lo que necesitás estudiar.",
};

/**
 * Suspense es obligatorio porque ExplorarCatalogo usa useSearchParams().
 * Next.js 15 requiere que cualquier componente que lea la URL en cliente
 * esté dentro de un límite de Suspense para el prerender estático.
 */
export default function ExplorarPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-6xl px-4 py-10">
          <div className="mb-8 h-10 w-64 animate-pulse rounded-lg bg-muted" />
          <div className="flex flex-col gap-8 md:flex-row md:gap-10">
            <div className="w-full space-y-2 md:w-64">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-10 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
            <div className="flex-1 space-y-3">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="h-14 animate-pulse rounded-lg bg-muted" />
              ))}
            </div>
          </div>
        </div>
      }
    >
      <ExplorarCatalogo />
    </Suspense>
  );
}

