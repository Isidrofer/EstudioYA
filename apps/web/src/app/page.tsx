import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div>
      {/* ── Hero ──────────────────────────────────────────── */}
      <section className="flex flex-col items-center justify-center bg-brand-navy px-4 py-20 text-center md:py-32">
        <div className="mx-auto max-w-2xl">
          <h1 className="mb-5 text-4xl font-extrabold leading-tight text-brand-orange md:text-6xl">
            Clases particulares
            <br />
            <span className="text-white">hechas por estudiantes,</span>
            <br />
            <span className="text-white">para estudiantes</span>
          </h1>

          <p className="mb-8 text-base text-white/75 md:text-lg">
            Encontrá tu profe ideal: estudiantes avanzados y graduados que ya
            pasaron por lo mismo que vos. Clases individuales o grupales, en
            Argentina.
          </p>

          <Link
            href="/registro"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-brand-orange-strong px-8 text-base font-bold text-white shadow-md hover:opacity-90",
            )}
          >
            Registrate gratis
          </Link>
        </div>
      </section>

      {/* ── Propuesta de valor ──────────────────────────── */}
      <section className="mx-auto max-w-6xl px-4 py-14">
        <h2 className="mb-10 text-center text-2xl font-bold text-brand-navy md:text-3xl">
          ¿Por qué EstudioYA?
        </h2>

        <div className="grid gap-6 sm:grid-cols-3">
          {[
            {
              emoji: "🎓",
              titulo: "Profes que ya lo vivieron",
              texto:
                "Nuestros profesores son estudiantes avanzados o graduados: saben exactamente qué te cuesta y cómo explicarlo.",
            },
            {
              emoji: "📅",
              titulo: "Elegí horario y formato",
              texto:
                "Clases individuales (más personalizadas) o grupales (más económicas). Vos elegís cuándo y con quién.",
            },
            {
              emoji: "⭐",
              titulo: "Reseñas de alumnos reales",
              texto:
                "Cada profe va a tener un puntaje basado en clases completadas dentro de la plataforma. Sin palabras de relleno.",
            },
          ].map(({ emoji, titulo, texto }) => (
            <article
              key={titulo}
              className="rounded-xl border border-border bg-white p-6 shadow-sm"
            >
              <span className="mb-3 block text-3xl" aria-hidden="true">
                {emoji}
              </span>
              <h3 className="mb-2 text-lg font-semibold text-brand-navy">
                {titulo}
              </h3>
              <p className="text-sm leading-relaxed text-muted-foreground">
                {texto}
              </p>
            </article>
          ))}
        </div>
      </section>

      {/* ── CTA final ───────────────────────────────────── */}
      <section className="bg-brand-navy py-14 text-center">
        <p className="mb-6 text-lg text-white/90">¿Ya sabés lo que buscás?</p>
        <div className="flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
          <Link
            href="/registro"
            className={cn(
              buttonVariants({ size: "lg" }),
              "bg-brand-orange-strong px-8 font-bold text-white hover:opacity-90",
            )}
          >
            Crear cuenta
          </Link>
          <Link
            href="/login"
            className={cn(
              buttonVariants({ variant: "outline", size: "lg" }),
              "border-white/40 bg-transparent px-8 text-white hover:bg-white/10",
            )}
          >
            Ya tengo cuenta
          </Link>
        </div>
      </section>
    </div>
  );
}
