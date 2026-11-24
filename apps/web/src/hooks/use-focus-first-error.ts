"use client";

import { useEffect, useState } from "react";

/**
 * Enfoca el primer campo con error (en el orden de `fields`) cuando el formulario deja de estar ocupado.
 *
 * Hace falta esperar: tras un error de la API, dentro de `onError` los inputs todavía están
 * `disabled` (la mutación sigue "pendiente") y el navegador ignora el `focus()`.
 * Devuelve la función para pedir el foco: `requestFocus(errores.fields)`.
 */
export function useFocusFirstError<F extends string>(fields: readonly F[], busy: boolean) {
  const [request, setRequest] = useState<Partial<Record<F, string>> | null>(null);

  useEffect(() => {
    if (busy || !request) return;
    const first = fields.find((field) => request[field]);
    if (first) {
      // Los checkbox de Base UI se enfocan en su `span[role=checkbox]` (el `id` queda en un input oculto).
      const target =
        document.querySelector<HTMLElement>(`[role="checkbox"][aria-labelledby="${first}-label"]`) ??
        document.getElementById(first);
      target?.focus();
    }
    setRequest(null);
  }, [busy, request, fields]);

  return setRequest;
}
