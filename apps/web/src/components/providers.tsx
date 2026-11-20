"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState, type ReactNode } from "react";
import { isApiError, onSessionEvent } from "@/lib/api";
import { SESSION_QUERY_KEY } from "@/hooks/use-session";

/** Crea el cliente de TanStack Query con la configuración común de toda la app. */
function createQueryClient() {
  return new QueryClient({
    defaultOptions: {
      queries: {
        // Durante 1 minuto los datos se consideran frescos y no se vuelven a pedir.
        staleTime: 60_000,
        // Los errores 4xx (401, 403, 404, 409...) no se arreglan reintentando; los de red o 5xx sí, hasta 2 veces.
        retry: (failureCount, error) => {
          if (isApiError(error) && error.status >= 400 && error.status < 500) return false;
          return failureCount < 2;
        },
      },
      mutations: {
        retry: false,
      },
    },
  });
}

/** Proveedores globales del lado del cliente. Se usa una sola vez, en `app/layout.tsx`. */
export default function Providers({ children }: { children: ReactNode }) {
  // useState garantiza un único QueryClient por pestaña (no se recrea en cada render).
  const [queryClient] = useState(createQueryClient);

  // Si la API ya no puede renovar la sesión, se borra el usuario de la cache:
  // todos los componentes que usan useSession() pasan a "unauthenticated" al mismo tiempo.
  useEffect(
    () =>
      onSessionEvent((event) => {
        if (event === "expired") queryClient.setQueryData(SESSION_QUERY_KEY, null);
      }),
    [queryClient],
  );

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
