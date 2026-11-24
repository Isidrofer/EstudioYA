"use client";

import { Loader2Icon } from "lucide-react";
import { Button } from "@/components/ui/button";

/** Pantalla de espera mientras se verifica la sesión o se redirige. */
export function SessionLoading({ label = "Verificando tu sesión…" }: { label?: string }) {
  return (
    <div
      className="flex min-h-[50vh] flex-col items-center justify-center gap-3 px-4 text-muted-foreground"
      role="status"
      aria-live="polite"
    >
      <Loader2Icon className="size-6 animate-spin text-brand-orange" aria-hidden="true" />
      <p className="text-sm">{label}</p>
    </div>
  );
}

/**
 * La sesión no se pudo verificar porque la API no respondió o falló (no es lo mismo que "no hay sesión").
 * En vez de redirigir al login, se ofrece reintentar: así no se expulsa a nadie por una caída momentánea.
 */
export function SessionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      className="mx-auto flex min-h-[50vh] max-w-md flex-col items-center justify-center gap-4 px-4 text-center"
      role="alert"
    >
      <h1 className="text-lg font-semibold text-brand-navy">No pudimos verificar tu sesión</h1>
      <p className="text-sm text-muted-foreground">
        Puede ser un problema de conexión o del servidor. Probá de nuevo en unos segundos.
      </p>
      <Button variant="outline" size="lg" onClick={onRetry}>
        Reintentar
      </Button>
    </div>
  );
}
