import { SearchIcon, SlidersHorizontalIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FACULTIES, SUBJECTS, TEACHERS } from "../_data";
import TeacherCard from "../_components/teacher-card";
import { DesignNote, PageTitle } from "../_components/ui";

export const metadata = { title: "Buscar profesores" };

const selectClass =
  "h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function Filters() {
  return (
    <form className="space-y-4" aria-label="Filtros de búsqueda">
      <div className="space-y-1.5">
        <Label htmlFor="f-facultad">Facultad</Label>
        <select id="f-facultad" className={selectClass} defaultValue="f1">
          <option value="">Todas</option>
          {FACULTIES.map((f) => (
            <option key={f.id} value={f.id}>
              {f.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-1.5">
        <Label htmlFor="f-materia">Materia</Label>
        <select id="f-materia" className={selectClass} defaultValue="">
          <option value="">Todas</option>
          {SUBJECTS.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Tipo de clase</legend>
        <div className="grid grid-cols-3 gap-1 rounded-lg bg-muted p-1 text-sm">
          {["Todas", "Individual", "Grupal"].map((o, i) => (
            <label
              key={o}
              className="cursor-pointer rounded-md px-2 py-1 text-center has-checked:bg-white has-checked:font-semibold has-checked:shadow-sm"
            >
              <input type="radio" name="classType" className="sr-only" defaultChecked={i === 0} />
              {o}
            </label>
          ))}
        </div>
      </fieldset>

      <fieldset className="space-y-1.5">
        <legend className="text-sm font-medium">Precio por hora</legend>
        <div className="flex items-center gap-2">
          <Input aria-label="Precio mínimo" placeholder="$ mín." inputMode="numeric" />
          <span className="text-muted-foreground">–</span>
          <Input aria-label="Precio máximo" placeholder="$ máx." inputMode="numeric" />
        </div>
      </fieldset>

      <div className="space-y-1.5">
        <Label htmlFor="f-rating">Puntaje mínimo</Label>
        <select id="f-rating" className={selectClass} defaultValue="">
          <option value="">Cualquiera</option>
          <option value="4">4 estrellas o más</option>
          <option value="4.5">4,5 estrellas o más</option>
        </select>
      </div>

      <div className="flex gap-2 pt-2">
        <Button type="button" className="flex-1 bg-brand-orange-strong text-white hover:opacity-90">
          Aplicar
        </Button>
        <Button type="button" variant="outline">
          Limpiar
        </Button>
      </div>
    </form>
  );
}

export default function BuscarMockupPage() {
  return (
    <>
      <PageTitle title="Encontrá tu profe" description="Estudiantes avanzados y graduados de tu facultad." />

      {/* Buscador principal por materia */}
      <div className="relative mb-6">
        <SearchIcon className="absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
        <Input className="h-11 bg-white pl-10 text-base" placeholder="¿Qué materia necesitás? Ej: Análisis Matemático I" aria-label="Buscar materia" />
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        {/* Filtros: panel lateral en escritorio, desplegable en celular */}
        <aside>
          <details className="rounded-xl border border-border bg-white p-4 shadow-sm lg:hidden">
            <summary className="flex cursor-pointer items-center gap-2 font-medium">
              <SlidersHorizontalIcon className="size-4" aria-hidden="true" /> Filtros (1 activo)
            </summary>
            <div className="mt-4">
              <Filters />
            </div>
          </details>
          <div className="hidden rounded-xl border border-border bg-white p-5 shadow-sm lg:block">
            <h2 className="mb-4 font-semibold text-brand-navy">Filtros</h2>
            <Filters />
          </div>
        </aside>

        <section aria-label="Resultados">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">{TEACHERS.length} profesores</span> en Facultad de Ingeniería
            </p>
            <label className="flex items-center gap-2 text-sm whitespace-nowrap">
              Ordenar por
              <select className={`${selectClass} w-auto`} defaultValue="recommended">
                <option value="recommended">Recomendados</option>
                <option value="price_asc">Menor precio</option>
                <option value="price_desc">Mayor precio</option>
                <option value="rating_desc">Mejor puntaje</option>
              </select>
            </label>
          </div>

          <div className="space-y-4">
            {TEACHERS.map((t) => (
              <TeacherCard key={t.id} teacher={t} href="/mockups/profesor" />
            ))}
          </div>

          <nav aria-label="Paginación" className="mt-6 flex items-center justify-center gap-2 text-sm">
            <Button variant="outline" size="sm" disabled>
              Anterior
            </Button>
            <span className="px-2 text-muted-foreground">Página 1 de 1</span>
            <Button variant="outline" size="sm" disabled>
              Siguiente
            </Button>
          </nav>

          <div className="mt-6 space-y-2">
            <DesignNote>
              los filtros se guardan en la URL (<code>?facultyId=&amp;subjectId=&amp;sort=</code>) para poder compartir la
              búsqueda y volver atrás sin perderla. Mapean 1 a 1 con <code>teacherSearchSchema</code>.
            </DesignNote>
            <DesignNote>
              el &quot;desde $X/h&quot; toma el precio más bajo, que suele ser el grupal por alumno. ¿Preferimos mostrar el
              individual de la materia filtrada?
            </DesignNote>
            <DesignNote>
              sin resultados: mostrar &quot;No encontramos profes con esos filtros&quot; y un botón para limpiar filtros.
            </DesignNote>
          </div>
        </section>
      </div>
    </>
  );
}
