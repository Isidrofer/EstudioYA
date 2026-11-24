"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { SessionError, SessionLoading } from "@/components/auth/session-status";
import { useSession } from "@/hooks/use-session";
import { withNext } from "@/lib/redirect";

/**
 * Protege una página o layout: solo muestra `children` si hay sesión.
 * Sin sesión, redirige a `/login?next=<ruta actual>` para volver después de ingresar.
 *
 * Se hace en el cliente (con `useSession()`) y no en un middleware de Next porque las cookies de
 * sesión pertenecen al dominio de la API: en producción el servidor de la web no las ve.
 * La API sigue siendo la que protege los datos; esto solo evita mostrar pantallas vacías.
 *
 * Cómo evita bucles y parpadeos:
 *  - mientras la sesión carga, muestra una espera (no redirige ni renderiza la página);
 *  - si la API falló (error real, no un 401), ofrece reintentar en lugar de mandar al login;
 *  - /login nunca redirige de vuelta a una página de autenticación (ver `safeRedirectPath`).
 */
export default function RequireAuth({ children }: { children: ReactNode }) {
  const router = useRouter();
  const { status, error, refetch } = useSession();
  const shouldRedirect = status === "unauthenticated" && !error;

  useEffect(() => {
    if (!shouldRedirect) return;
    const here = `${window.location.pathname}${window.location.search}`;
    router.replace(withNext("/login", here));
  }, [shouldRedirect, router]);

  if (status === "authenticated") return <>{children}</>;
  if (status === "unauthenticated" && error) return <SessionError onRetry={() => refetch()} />;
  return <SessionLoading label={shouldRedirect ? "Redirigiendo al inicio de sesión…" : undefined} />;
}
