import { StarIcon } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

/* Piezas visuales chicas que usan los mockups (FE-14). Si el equipo aprueba el diseño,
   se mueven a `components/` al implementar cada pantalla real. */

const AR_TZ = "America/Argentina/Buenos_Aires";

const upperFirst = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/** Fecha y hora de la API (UTC) mostrada en hora de Argentina (BR-16), en formato 24 h. Ej: "Jue 26 nov, 18:00". */
export function formatDateTime(iso: string): string {
  const d = new Date(iso);
  const day = new Intl.DateTimeFormat("es-AR", { timeZone: AR_TZ, weekday: "short", day: "numeric", month: "short" })
    .format(d)
    .replace(",", "");
  return `${upperFirst(day)}, ${formatTime(iso)}`;
}

export function formatTime(iso: string): string {
  return new Intl.DateTimeFormat("es-AR", { timeZone: AR_TZ, hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).format(
    new Date(iso),
  );
}

/** Ej: "Jueves 26 de noviembre". */
export function formatDay(iso: string): string {
  return upperFirst(
    new Intl.DateTimeFormat("es-AR", { timeZone: AR_TZ, weekday: "long", day: "numeric", month: "long" })
      .format(new Date(iso))
      .replace(",", ""),
  );
}

type Tone = "neutral" | "navy" | "orange" | "green" | "red" | "yellow";

const TONES: Record<Tone, string> = {
  neutral: "bg-muted text-muted-foreground",
  navy: "bg-brand-navy text-white",
  orange: "bg-accent text-brand-orange-strong",
  green: "bg-green-100 text-green-800",
  red: "bg-red-100 text-red-800",
  yellow: "bg-yellow-100 text-yellow-900",
};

export function Badge({ tone = "neutral", children, className }: { tone?: Tone; children: ReactNode; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium", TONES[tone], className)}>
      {children}
    </span>
  );
}

/** Avatar con iniciales mientras no haya foto de perfil (BE-13). */
export function Avatar({ name, size = "md" }: { name: string; size?: "sm" | "md" | "lg" }) {
  const initials = name
    .split(" ")
    .map((p) => p[0])
    .slice(0, 2)
    .join("");
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-flex shrink-0 items-center justify-center rounded-full bg-brand-navy font-bold text-white",
        size === "sm" && "size-9 text-xs",
        size === "md" && "size-12 text-sm",
        size === "lg" && "size-20 text-2xl",
      )}
    >
      {initials}
    </span>
  );
}

/** Puntaje con estrella. Sin reseñas se muestra "Nuevo" en vez de 0 (no castigar a quien recién empieza). */
export function Rating({ avg, count }: { avg: number; count: number }) {
  if (count === 0) return <Badge tone="orange">Nuevo</Badge>;
  return (
    <span className="inline-flex items-center gap-1 text-sm">
      <StarIcon className="size-4 fill-brand-orange text-brand-orange" aria-hidden="true" />
      <span className="font-semibold">{avg.toFixed(1).replace(".", ",")}</span>
      <span className="text-muted-foreground">({count} reseñas)</span>
      <span className="sr-only">Puntaje {avg} de 5</span>
    </span>
  );
}

export function Card({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn("rounded-xl border border-border bg-white p-5 shadow-sm", className)}>{children}</div>;
}

/** Nota de diseño: explica una decisión o una pregunta abierta para discutir en equipo. */
export function DesignNote({ children }: { children: ReactNode }) {
  return (
    <aside className="rounded-lg border border-dashed border-brand-orange/60 bg-accent/40 px-3 py-2 text-xs text-brand-navy">
      <span className="font-semibold">Nota de diseño: </span>
      {children}
    </aside>
  );
}

export function PageTitle({ title, description }: { title: string; description?: string }) {
  return (
    <header className="mb-6">
      <h1 className="text-2xl font-bold text-brand-navy md:text-3xl">{title}</h1>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
    </header>
  );
}

export const TEACHER_TYPE_LABEL = { ADVANCED_STUDENT: "Estudiante avanzado", GRADUATE: "Graduado" } as const;
export const CLASS_TYPE_LABEL = { INDIVIDUAL: "Individual", GROUP: "Grupal" } as const;
