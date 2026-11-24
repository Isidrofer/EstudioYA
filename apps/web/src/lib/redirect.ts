/**
 * Manejo del parámetro `?next=` de /login y /registro (adónde volver después de ingresar).
 * Solo se aceptan rutas internas: evita redirigir a otro sitio (open redirect) y evita bucles
 * entre las páginas de autenticación.
 */

/** Páginas a las que nunca se vuelve después de ingresar. */
const AUTH_PAGES = ["/login", "/registro"];

/** Devuelve `next` si es una ruta interna segura; si no, `fallback`. */
export function safeRedirectPath(next: string | null | undefined, fallback = "/"): string {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/\\")) {
    return fallback;
  }
  const pathname = next.split(/[?#]/)[0];
  if (AUTH_PAGES.some((page) => pathname === page || pathname.startsWith(`${page}/`))) {
    return fallback;
  }
  return next;
}

/** Arma la URL de una página de autenticación conservando adónde volver, ej. `/login?next=%2Fmi-cuenta`. */
export function withNext(page: "/login" | "/registro", next: string | null | undefined): string {
  const target = safeRedirectPath(next, "");
  return target && target !== "/" ? `${page}?next=${encodeURIComponent(target)}` : page;
}
