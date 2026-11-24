"use client";

import { LogOutIcon } from "lucide-react";
import type { Role } from "@estudioya/shared";
import { Button } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-logout";
import { useSession } from "@/hooks/use-session";

const ROLE_LABELS: Record<Role, string> = {
  STUDENT: "Alumno",
  TEACHER: "Profesor",
  ADMIN: "Administrador",
};

/** Datos básicos de la cuenta. Solo se renderiza con sesión (lo garantiza el layout de `(privado)`). */
export default function MyAccount() {
  const { user } = useSession();
  const { logout, isLoggingOut } = useLogout();
  if (!user) return null;

  return (
    <section className="mx-auto max-w-2xl px-4 py-10 md:py-14">
      <h1 className="text-2xl font-bold text-brand-navy md:text-3xl">Hola, {user.firstName}</h1>
      <p className="mt-1 text-sm text-muted-foreground">Estos son los datos de tu cuenta.</p>

      <div className="mt-6 rounded-xl border border-border bg-white p-6 shadow-sm">
        <dl className="grid gap-4 text-sm sm:grid-cols-[auto_1fr] sm:gap-x-8">
          <dt className="font-medium text-muted-foreground">Nombre</dt>
          <dd className="font-medium">
            {user.firstName} {user.lastName}
          </dd>
          <dt className="font-medium text-muted-foreground">Email</dt>
          <dd className="break-all font-medium">{user.email}</dd>
          <dt className="font-medium text-muted-foreground">Tipo de cuenta</dt>
          <dd className="font-medium">{ROLE_LABELS[user.role] ?? user.role}</dd>
        </dl>
      </div>

      <Button
        variant="outline"
        size="lg"
        className="mt-6"
        onClick={logout}
        disabled={isLoggingOut}
      >
        <LogOutIcon aria-hidden="true" />
        {isLoggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
      </Button>
    </section>
  );
}
