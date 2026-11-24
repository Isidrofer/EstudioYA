"use client";

import { useMutation } from "@tanstack/react-query";
import { api } from "@/lib/api";

/**
 * Cierra la sesión con `POST /auth/logout` (revoca el refresh token y borra las cookies).
 *
 * Después se hace una navegación completa al inicio en vez de actualizar la cache:
 *  - descarta de memoria todos los datos del usuario anterior (cache de TanStack Query incluida);
 *  - evita la carrera con `RequireAuth`, que al ver la sesión en `null` en una página privada
 *    redirigiría a /login en lugar de al inicio.
 */
export function useLogout() {
  const mutation = useMutation({
    mutationFn: () => api.post<void>("/auth/logout"),
    onSuccess: () => {
      window.location.assign("/");
    },
  });

  return {
    logout: () => mutation.mutate(),
    /** También queda en `true` mientras recarga la página, para que el botón no se reactive. */
    isLoggingOut: mutation.isPending || mutation.isSuccess,
    error: mutation.error,
  };
}
