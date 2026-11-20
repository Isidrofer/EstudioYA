"use client";

import { useQuery } from "@tanstack/react-query";
import type { AuthUser } from "@estudioya/shared";
import { api, isApiError } from "@/lib/api";

/** Clave de la sesión en la cache de TanStack Query. Usarla para actualizarla tras login/logout. */
export const SESSION_QUERY_KEY = ["auth", "me"] as const;

export type SessionStatus = "loading" | "authenticated" | "unauthenticated";

/**
 * Pide el usuario logueado. Devuelve `null` si no hay sesión (en vez de tirar error),
 * porque "no estar logueado" es un estado normal de la app, no una falla.
 * Si el access token venció, `api` ya intentó renovarlo antes de llegar al `401`.
 */
export async function fetchSessionUser(): Promise<AuthUser | null> {
  try {
    return await api.get<AuthUser>("/auth/me");
  } catch (error) {
    if (isApiError(error) && error.status === 401) return null;
    throw error;
  }
}

/**
 * Sesión del usuario actual. Se puede usar en cualquier Client Component:
 * todos comparten la misma cache, así que `GET /auth/me` se pide una sola vez.
 *
 * @example
 *   const { user, status } = useSession();
 *   if (status === "loading") return <p>Cargando…</p>;
 *   if (!user) return <Link href="/login">Ingresar</Link>;
 *   return <p>Hola, {user.firstName}</p>;
 */
export function useSession() {
  const query = useQuery({
    queryKey: SESSION_QUERY_KEY,
    queryFn: fetchSessionUser,
    // La sesión se revisa al volver a la pestaña: si el access token venció, se renueva solo.
    refetchOnWindowFocus: true,
  });

  const user = query.data ?? null;
  const status: SessionStatus = query.isPending
    ? "loading"
    : user
      ? "authenticated"
      : "unauthenticated";

  return {
    user,
    status,
    /** Error real (API caída, 500...). Si simplemente no hay sesión, es `null`. */
    error: query.error,
    /** Vuelve a consultar `GET /auth/me`. */
    refetch: query.refetch,
    /** Momento de la última respuesta correcta (ms), útil para depurar. */
    updatedAt: query.dataUpdatedAt,
  };
}
