import { ArrowRightIcon } from "lucide-react";
import Link from "next/link";
import { Badge, PageTitle } from "./_components/ui";
import { SCREENS } from "./_screens";

export const metadata = { title: "Índice" };

export default function MockupsIndexPage() {
  return (
    <>
      <PageTitle
        title="Mockups de las pantallas principales"
        description="Propuesta de diseño para discutir en equipo antes de programar cada pantalla. Dejá tus comentarios en el PR de FE-14 o en el grupo."
      />

      <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {SCREENS.map((s) => (
          <li key={s.href}>
            <Link
              href={s.href}
              className="group flex h-full flex-col rounded-xl border border-border bg-white p-5 shadow-sm transition-shadow hover:shadow-md"
            >
              <div className="mb-2 flex flex-wrap gap-2">
                <Badge tone="navy">{s.task}</Badge>
                <Badge>{s.who}</Badge>
              </div>
              <h2 className="text-lg font-semibold text-brand-navy">{s.title}</h2>
              <p className="mt-1 flex-1 text-sm text-muted-foreground">{s.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-brand-orange-strong">
                Ver pantalla <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden="true" />
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="mt-10 rounded-xl border border-border bg-white p-5 text-sm shadow-sm">
        <h2 className="mb-2 font-semibold text-brand-navy">Criterios comunes</h2>
        <ul className="list-disc space-y-1 pl-5 text-muted-foreground">
          <li>Paleta y tipografía de FE-01: azul marino para estructura, naranja solo para la acción principal de cada pantalla.</li>
          <li>Precios siempre por hora en pesos sin decimales (<code>formatArs</code>); el grupal se aclara &quot;por alumno&quot;.</li>
          <li>Fechas en hora de Argentina; la API las manda en UTC.</li>
          <li>Pensado primero para celular: una columna, filtros en panel desplegable y botones de ancho completo.</li>
          <li>Las notas punteadas naranjas marcan decisiones o dudas para acordar.</li>
        </ul>
      </section>
    </>
  );
}
