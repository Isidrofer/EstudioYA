"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect } from "react";
import { useSession } from "@/hooks/use-session";
import { safeRedirectPath } from "@/lib/redirect";

/**
 * Para /login y /registro: si ya hay sesión (o se acaba de iniciar), va a `?next=` o al inicio.
 * Es el único lugar que redirige después de ingresar: los formularios solo guardan el usuario
 * en la cache de la sesión y este efecto hace el resto.
 *
 * Usa `useSearchParams()`, así que la página debe envolver al componente en `<Suspense>`.
 */
export function useRedirectWhenAuthenticated() {
  const router = useRouter();
  const next = useSearchParams().get("next");
  const { status } = useSession();

  useEffect(() => {
    if (status === "authenticated") router.replace(safeRedirectPath(next));
  }, [status, next, router]);

  return { status, next };
}
