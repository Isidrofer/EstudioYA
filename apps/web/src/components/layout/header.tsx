"use client";

import { LogOutIcon, UserIcon } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { useLogout } from "@/hooks/use-logout";
import { useSession } from "@/hooks/use-session";
import { cn } from "@/lib/utils";

/** Acciones de cuenta del header según el estado de la sesión (escritorio y celular). */
function AccountActions({ mobile = false, onNavigate }: { mobile?: boolean; onNavigate?: () => void }) {
  const { user, status } = useSession();
  const { logout, isLoggingOut } = useLogout();
  const full = mobile ? "w-full" : "";

  // Mientras se verifica la sesión se reserva el espacio: evita mostrar "Ingresar" a un usuario logueado.
  if (status === "loading") {
    return (
      <div
        className={cn("h-7 animate-pulse rounded-lg bg-white/10", mobile ? "w-full" : "w-44")}
        aria-hidden="true"
      />
    );
  }

  if (user) {
    return (
      <div className={cn("flex gap-3", mobile ? "flex-col" : "items-center")}>
        <Link
          href="/mi-cuenta"
          onClick={onNavigate}
          className={cn(
            "flex items-center gap-1.5 text-sm font-medium text-white/90 transition-colors hover:text-white",
            full,
          )}
        >
          <UserIcon className="size-4" aria-hidden="true" />
          <span className="max-w-40 truncate">{user.firstName}</span>
          <span className="sr-only">, ir a mi cuenta</span>
        </Link>
        <button
          type="button"
          onClick={logout}
          disabled={isLoggingOut}
          className={cn(
            buttonVariants({ variant: "outline", size: "sm" }),
            "border-white/30 bg-transparent text-white hover:bg-white/10",
            full,
          )}
        >
          <LogOutIcon aria-hidden="true" />
          {isLoggingOut ? "Cerrando sesión…" : "Cerrar sesión"}
        </button>
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3", mobile ? "flex-col" : "items-center")}>
      <Link
        href="/login"
        onClick={onNavigate}
        className={cn(
          buttonVariants({ variant: "outline", size: "sm" }),
          "border-white/30 bg-transparent text-white hover:bg-white/10",
          full,
        )}
      >
        Ingresar
      </Link>
      <Link
        href="/registro"
        onClick={onNavigate}
        className={cn(
          buttonVariants({ size: "sm" }),
          "bg-brand-orange-strong font-semibold text-white hover:opacity-90",
          full,
        )}
      >
        Registrarse
      </Link>
    </div>
  );
}

export default function Header() {
  const [menuAbierto, setMenuAbierto] = useState(false);

  return (
    <header className="sticky top-0 z-50 w-full bg-brand-navy">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
        {/* Logo + nombre de marca */}
        <Link
          href="/"
          className="flex items-center gap-2 rounded"
          aria-label="EstudioYA — ir al inicio"
        >
          <Image
            src="/logos/logo.png"
            alt="Logo de EstudioYA"
            width={40}
            height={40}
            priority
          />
          <span className="text-lg font-bold tracking-tight">
            <span className="text-white">Estudio</span>
            <span className="text-brand-orange">Ya</span>
          </span>
        </Link>

        {/* Navegación — escritorio */}
        <nav
          className="hidden items-center gap-6 md:flex"
          aria-label="Navegación principal"
        >
          <Link
            href="/"
            className="text-sm font-medium text-white/90 transition-colors hover:text-white"
          >
            Inicio
          </Link>
          <AccountActions />
        </nav>

        {/* Botón hamburguesa — celular */}
        <button
          className="flex flex-col gap-1.5 p-2 md:hidden"
          onClick={() => setMenuAbierto((v) => !v)}
          aria-expanded={menuAbierto}
          aria-controls="menu-movil"
          aria-label={menuAbierto ? "Cerrar menú" : "Abrir menú"}
        >
          <span
            className={`block h-0.5 w-6 bg-white transition-transform duration-200 ${
              menuAbierto ? "translate-y-2 rotate-45" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-white transition-opacity duration-200 ${
              menuAbierto ? "opacity-0" : ""
            }`}
          />
          <span
            className={`block h-0.5 w-6 bg-white transition-transform duration-200 ${
              menuAbierto ? "-translate-y-2 -rotate-45" : ""
            }`}
          />
        </button>
      </div>

      {/* Menú móvil desplegable */}
      {menuAbierto && (
        <nav
          id="menu-movil"
          className="border-t border-white/10 px-4 pb-4 md:hidden"
          aria-label="Navegación móvil"
        >
          <ul className="flex flex-col gap-3 pt-3">
            <li>
              <Link
                href="/"
                className="block text-sm font-medium text-white/90 hover:text-white"
                onClick={() => setMenuAbierto(false)}
              >
                Inicio
              </Link>
            </li>
            <li>
              <AccountActions mobile onNavigate={() => setMenuAbierto(false)} />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
