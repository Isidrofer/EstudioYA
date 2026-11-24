import type { ReactNode } from "react";
import RequireAuth from "@/components/auth/require-auth";

/**
 * Grupo de rutas que exigen sesión. El nombre entre paréntesis no aparece en la URL:
 * `app/(privado)/mi-cuenta/page.tsx` se sirve en `/mi-cuenta`.
 * Toda página nueva que necesite sesión (agenda, mis reservas, panel admin…) va dentro de esta carpeta.
 */
export default function PrivateLayout({ children }: { children: ReactNode }) {
  return <RequireAuth>{children}</RequireAuth>;
}
