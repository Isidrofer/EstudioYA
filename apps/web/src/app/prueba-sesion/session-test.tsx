"use client";

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useState, type FormEvent } from "react";
import type { AuthUser } from "@estudioya/shared";
import { Button } from "@/components/ui/button";
import { SESSION_QUERY_KEY, fetchSessionUser, useSession } from "@/hooks/use-session";
import { api, isApiError, onSessionEvent } from "@/lib/api";

const hora = (ms: number) => new Date(ms).toLocaleTimeString("es-AR");

/**
 * Pantalla de prueba de FE-02.
 * Criterio: muestra el usuario logueado y se recupera sola cuando vence el access token.
 */
export default function SessionTest() {
  const queryClient = useQueryClient();
  const { user, status, error, refetch, updatedAt } = useSession();
  const [log, setLog] = useState<string[]>([]);

  const addLog = (line: string) =>
    setLog((prev) => [`${hora(Date.now())} · ${line}`, ...prev].slice(0, 20));

  // Registra cada vez que el módulo api renueva la sesión (o no pudo hacerlo).
  useEffect(
    () =>
      onSessionEvent((event) =>
        addLog(
          event === "refreshed"
            ? "🔄 Access token vencido: sesión renovada con /auth/refresh"
            : "⛔ No se pudo renovar la sesión (sin sesión o refresh token vencido)",
        ),
      ),
    [],
  );

  const login = useMutation({
    mutationFn: (body: { email: string; password: string }) =>
      api.post<AuthUser>("/auth/login", body),
    onSuccess: (loggedUser) => {
      // La respuesta del login ya trae el usuario: se guarda directo en la cache de la sesión.
      queryClient.setQueryData(SESSION_QUERY_KEY, loggedUser);
      addLog(`✅ Login correcto como ${loggedUser.email}`);
    },
  });

  const logout = useMutation({
    mutationFn: () => api.post("/auth/logout"),
    onSuccess: () => {
      queryClient.setQueryData(SESSION_QUERY_KEY, null);
      addLog("👋 Sesión cerrada");
    },
  });

  // Tres pedidos a la vez: aunque los tres reciban 401, debe salir UN solo /auth/refresh.
  const [parallelBusy, setParallelBusy] = useState(false);
  async function parallelTest() {
    setParallelBusy(true);
    try {
      const results = await Promise.all([fetchSessionUser(), fetchSessionUser(), fetchSessionUser()]);
      const ok = results.filter(Boolean).length;
      addLog(`🧪 3 pedidos en paralelo: ${ok}/3 devolvieron el usuario`);
    } catch (e) {
      addLog(`🧪 3 pedidos en paralelo: error ${isApiError(e) ? e.code : String(e)}`);
    } finally {
      setParallelBusy(false);
    }
  }

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = new FormData(e.currentTarget);
    login.mutate({
      email: String(form.get("email") ?? ""),
      password: String(form.get("password") ?? ""),
    });
  }

  return (
    <div className="mx-auto flex max-w-xl flex-col gap-6 px-4 py-10">
      <header>
        <h1 className="text-2xl font-bold text-brand-navy">Prueba de sesión (FE-02)</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Pantalla temporal para probar el cliente de la API. Para ver la renovación automática,
          poné <code>ACCESS_TOKEN_TTL=30s</code> en el <code>.env</code>, reiniciá la API, esperá
          30 segundos y tocá &quot;Volver a consultar&quot;.
        </p>
      </header>

      {/* ── Estado de la sesión ── */}
      <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-brand-navy">Estado</h2>

        {status === "loading" && <p className="text-sm">Cargando sesión…</p>}

        {error && (
          <p className="text-sm text-destructive">
            Error: {isApiError(error) ? `${error.title}. ${error.detail ?? ""}` : String(error)}
          </p>
        )}

        {status === "authenticated" && user && (
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="font-medium">Nombre</dt>
            <dd>
              {user.firstName} {user.lastName}
            </dd>
            <dt className="font-medium">Email</dt>
            <dd>{user.email}</dd>
            <dt className="font-medium">Rol</dt>
            <dd>{user.role}</dd>
            <dt className="font-medium">ID</dt>
            <dd className="font-mono text-xs">{user.id}</dd>
            <dt className="font-medium">Verificado</dt>
            <dd>{updatedAt ? hora(updatedAt) : "—"}</dd>
          </dl>
        )}

        {status === "unauthenticated" && !error && (
          <form onSubmit={onSubmit} className="flex flex-col gap-3">
            <p className="text-sm text-muted-foreground">No hay sesión. Ingresá con un usuario existente:</p>
            <input
              name="email"
              type="email"
              placeholder="email"
              required
              autoComplete="email"
              className="h-9 rounded-lg border border-input px-3 text-sm"
            />
            <input
              name="password"
              type="password"
              placeholder="contraseña"
              required
              autoComplete="current-password"
              className="h-9 rounded-lg border border-input px-3 text-sm"
            />
            {login.error && (
              <p className="text-sm text-destructive">
                {isApiError(login.error)
                  ? `${login.error.status} ${login.error.code}: ${login.error.detail ?? login.error.title}`
                  : String(login.error)}
              </p>
            )}
            <Button type="submit" disabled={login.isPending}>
              {login.isPending ? "Ingresando…" : "Ingresar"}
            </Button>
          </form>
        )}

        {status === "authenticated" && (
          <div className="mt-4 flex flex-wrap gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              Volver a consultar
            </Button>
            <Button variant="outline" onClick={parallelTest} disabled={parallelBusy}>
              3 pedidos en paralelo
            </Button>
            <Button variant="destructive" onClick={() => logout.mutate()} disabled={logout.isPending}>
              Cerrar sesión
            </Button>
          </div>
        )}
      </section>

      {/* ── Registro de eventos ── */}
      <section className="rounded-xl border border-border bg-white p-5 shadow-sm">
        <h2 className="mb-3 text-lg font-semibold text-brand-navy">Eventos</h2>
        {log.length === 0 ? (
          <p className="text-sm text-muted-foreground">Todavía no pasó nada.</p>
        ) : (
          <ul className="flex flex-col gap-1 font-mono text-xs">
            {log.map((line, i) => (
              <li key={`${i}-${line}`}>{line}</li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
