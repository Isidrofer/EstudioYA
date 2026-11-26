"use client";

/**
 * Página /explorar — FE-04
 *
 * Muestra facultades como lista lateral (escritorio) o botones apilados (celular).
 * Al elegir una facultad filtra las materias. El buscador filtra por nombre
 * ignorando mayúsculas y tildes.
 *
 * URL compartible: ?facultad=<id o slug>&q=<texto>
 * — Al recargar la página se restaura el estado.
 */

import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { FacultyDto, SubjectDto } from "@estudioya/shared";
import { useCatalogSubjects, useFaculties } from "@/hooks/use-catalog";
import { isApiError } from "@/lib/api";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/* ── Normalización para búsqueda sin tildes ──────────────────────── */

function normalizar(texto: string): string {
  return texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");
}

/* ── Esqueletos de carga ─────────────────────────────────────────── */

function SkeletonFacultades() {
  return (
    <ul aria-label="Cargando facultades…" className="space-y-2">
      {Array.from({ length: 6 }).map((_, i) => (
        <li
          key={i}
          className="h-10 animate-pulse rounded-lg bg-muted"
          aria-hidden="true"
        />
      ))}
    </ul>
  );
}

function SkeletonMaterias() {
  return (
    <ul aria-label="Cargando materias…" className="space-y-2">
      {Array.from({ length: 8 }).map((_, i) => (
        <li
          key={i}
          className="h-14 animate-pulse rounded-lg bg-muted"
          aria-hidden="true"
        />
      ))}
    </ul>
  );
}

/* ── Tarjeta de materia ──────────────────────────────────────────── */

interface TarjetaMateriaProps {
  materia: SubjectDto;
  facultadNombre?: string;
}

function TarjetaMateria({ materia, facultadNombre }: TarjetaMateriaProps) {
  return (
    <article className="rounded-xl border border-border bg-background p-4 shadow-sm">
      {/* TODO FE-05: agregar link a /buscar?materia=<materia.id> cuando exista la búsqueda de profesores */}
      <p className="font-semibold text-foreground">{materia.name}</p>
      {facultadNombre && (
        <p className="mt-0.5 text-xs text-muted-foreground">{facultadNombre}</p>
      )}
    </article>
  );
}

/* ── Bloque de error reutilizable ───────────────────────────────── */

function ErrorBlock({
  mensaje,
  onReintentar,
}: {
  mensaje: string;
  onReintentar: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-destructive/5 p-6 text-center"
    >
      <p className="text-sm text-destructive">{mensaje}</p>
      <Button variant="outline" size="sm" onClick={onReintentar}>
        Reintentar
      </Button>
    </div>
  );
}

/* ── Componente principal ────────────────────────────────────────── */

export default function ExplorarCatalogo() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const searchId = useId(); // para asociar label con input

  /* Leer el estado de la URL */
  const facultadParam = searchParams.get("facultad");
  const qUrl = searchParams.get("q") ?? "";

  /* Estado local del buscador: evita romper teclas muertas (ej. ´ + a = á) al sincronizar con la URL */
  const [busqueda, setBusqueda] = useState(qUrl);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const lastSyncedQRef = useRef(qUrl);

  const navigateWithParams = useCallback(
    (facultad: string | null, qValue: string) => {
      const params = new URLSearchParams();
      if (facultad) params.set("facultad", facultad);
      const trimmed = qValue.trim();
      if (trimmed) params.set("q", trimmed);
      const qs = params.toString();
      router.replace(qs ? `/explorar?${qs}` : "/explorar", { scroll: false });
    },
    [router],
  );

  // Sincroniza el input solo cuando la URL cambia por navegación externa (Atrás/Adelante, link del header, etc.)
  useEffect(() => {
    if (qUrl !== lastSyncedQRef.current) {
      if (debounceRef.current) clearTimeout(debounceRef.current);
      lastSyncedQRef.current = qUrl;
      setBusqueda(qUrl);
    }
  }, [qUrl]);

  useEffect(() => {
    return () => {
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, []);

  const handleSearchChange = (nuevoTexto: string) => {
    setBusqueda(nuevoTexto);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const trimmed = nuevoTexto.trim();
      lastSyncedQRef.current = trimmed;
      navigateWithParams(facultadParam, trimmed);
    }, 150);
  };

  const handleSelectFacultad = (nextFacultad: string | null) => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setBusqueda("");
    lastSyncedQRef.current = "";
    navigateWithParams(nextFacultad, "");
  };

  const handleClearSearch = () => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    setBusqueda("");
    lastSyncedQRef.current = "";
    navigateWithParams(facultadParam, "");
  };

  /* Query de facultades */
  const {
    data: facultades,
    isLoading: cargandoFacultades,
    isError: errorFacultades,
    error: errFacultades,
    refetch: refetchFacultades,
  } = useFaculties();

  /* Facultad seleccionada (acepta tanto UUID como slug en ?facultad=) */
  const facultadSeleccionada: FacultyDto | undefined = useMemo(
    () =>
      facultades?.find(
        (f) => f.id === facultadParam || f.slug === facultadParam,
      ),
    [facultades, facultadParam],
  );

  const facultadInexistente =
    Boolean(facultadParam) && Boolean(facultades) && !facultadSeleccionada;

  /* UUID resuelto para pedir materias; si viene un UUID en la URL, empieza en paralelo */
  const facultyIdParaApi =
    facultadSeleccionada?.id ??
    (facultadParam && UUID_RE.test(facultadParam) ? facultadParam : undefined);

  const esperandoSlug =
    Boolean(facultadParam) && !UUID_RE.test(facultadParam ?? "") && !facultades;

  const {
    data: todasLasMaterias,
    isLoading: cargandoQueryMaterias,
    isError: errorMaterias,
    error: errMaterias,
    refetch: refetchMaterias,
  } = useCatalogSubjects(facultyIdParaApi, {
    enabled: !esperandoSlug && !facultadInexistente && !errorFacultades,
  });

  const cargandoMaterias =
    esperandoSlug || (cargandoQueryMaterias && !facultadInexistente);

  /* Mapa id→nombre de facultad (para mostrar en tarjetas cuando no hay facultad seleccionada) */
  const mapFacultad = useMemo<Map<string, string>>(() => {
    if (!facultades) return new Map();
    return new Map(facultades.map((f) => [f.id, f.name]));
  }, [facultades]);

  /* Filtrado local: ignora mayúsculas, espacios extra y tildes */
  const qNormalizada = normalizar(busqueda);

  const materias: SubjectDto[] = useMemo(() => {
    const datos = todasLasMaterias ?? [];
    if (!qNormalizada) return datos;
    return datos.filter((m) => normalizar(m.name).includes(qNormalizada));
  }, [todasLasMaterias, qNormalizada]);

  const totalResultados = materias.length;
  const textoMostrado = busqueda.trim();

  /* ── Render ─────────────────────────────────────────────────────── */
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {/* Encabezado */}
      <div className="mb-8">
        <h1 className="text-3xl font-extrabold text-brand-navy">
          Explorar catálogo
        </h1>
        <p className="mt-2 text-muted-foreground">
          Elegí una facultad para ver sus materias, o buscá directamente.
        </p>
      </div>

      {/* Layout de dos columnas en md+, una columna en celular */}
      <div className="flex flex-col gap-8 md:flex-row md:gap-10">
        {/* ── Panel izquierdo: facultades ──────────────────────────── */}
        <aside
          className="w-full md:w-64 md:shrink-0"
          aria-label="Lista de facultades"
        >
          <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
            Facultades
          </h2>

          {cargandoFacultades && <SkeletonFacultades />}

          {errorFacultades && (
            <ErrorBlock
              mensaje={
                isApiError(errFacultades)
                  ? errFacultades.title
                  : "No se pudieron cargar las facultades."
              }
              onReintentar={refetchFacultades}
            />
          )}

          {facultades && (
            <ul className="space-y-1">
              {/* Opción "Todas" para deseleccionar */}
              <li>
                <button
                  type="button"
                  onClick={() => handleSelectFacultad(null)}
                  className={cn(
                    "w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                    !facultadParam
                      ? "bg-brand-navy text-white"
                      : "text-foreground hover:bg-muted",
                  )}
                  aria-pressed={!facultadParam}
                >
                  Todas las facultades
                </button>
              </li>

              {facultades.map((f) => {
                const activa = facultadSeleccionada?.id === f.id;
                return (
                  <li key={f.id}>
                    <button
                      type="button"
                      onClick={() => handleSelectFacultad(activa ? null : f.id)}
                      className={cn(
                        "w-full rounded-lg px-3 py-2 text-left text-sm font-medium transition-colors",
                        activa
                          ? "bg-brand-navy text-white"
                          : "text-foreground hover:bg-muted",
                      )}
                      aria-pressed={activa}
                    >
                      {f.name}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </aside>

        {/* ── Panel derecho: buscador + materias ───────────────────── */}
        <section className="min-w-0 flex-1">
          {/* Encabezado del panel */}
          <div className="mb-4 flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
            <h2 className="text-lg font-bold text-brand-navy">
              {facultadSeleccionada
                ? facultadSeleccionada.name
                : facultadInexistente
                  ? "Facultad no encontrada"
                  : "Todas las materias"}
            </h2>
          </div>

          {/* Buscador */}
          <div className="mb-6">
            <Label htmlFor={searchId} className="mb-1.5 block text-sm font-medium">
              Buscar materia
            </Label>
            <Input
              id={searchId}
              type="search"
              placeholder="Ej: álgebra, física, derecho…"
              value={busqueda}
              onChange={(e) => handleSearchChange(e.target.value)}
              className="max-w-md"
              aria-label="Buscar materia por nombre"
              autoComplete="off"
              disabled={facultadInexistente}
            />
          </div>

          {/* Facultad inexistente en la URL */}
          {facultadInexistente && (
            <div className="rounded-xl border border-border bg-muted/40 p-8 text-center">
              <p className="text-sm text-muted-foreground">
                No encontramos la facultad indicada en el enlace.
              </p>
              <button
                type="button"
                onClick={() => handleSelectFacultad(null)}
                className="mt-3 text-sm font-medium text-brand-orange hover:underline"
              >
                Ver todas las facultades
              </button>
            </div>
          )}

          {!facultadInexistente && (
            <>
              {/* Contador de resultados (aria-live para anunciarlo a lectores de pantalla) */}
              <div
                aria-live="polite"
                aria-atomic="true"
                className="mb-4 text-sm text-muted-foreground"
              >
                {!cargandoMaterias && !errorMaterias && (
                  <>
                    {totalResultados === 0
                      ? "Sin resultados"
                      : totalResultados === 1
                        ? "1 materia encontrada"
                        : `${totalResultados} materias encontradas`}
                    {textoMostrado && (
                      <>
                        {" "}
                        para{" "}
                        <span className="font-medium text-foreground">
                          &ldquo;{textoMostrado}&rdquo;
                        </span>
                      </>
                    )}
                  </>
                )}
              </div>

              {/* Estados: cargando */}
              {cargandoMaterias && <SkeletonMaterias />}

              {/* Estado: error */}
              {errorMaterias && (
                <ErrorBlock
                  mensaje={
                    isApiError(errMaterias)
                      ? errMaterias.title
                      : "No se pudieron cargar las materias."
                  }
                  onReintentar={refetchMaterias}
                />
              )}

              {/* Estado: sin resultados */}
              {!cargandoMaterias && !errorMaterias && totalResultados === 0 && (
                <div className="rounded-xl border border-border bg-muted/40 p-8 text-center">
                  <p className="text-sm text-muted-foreground">
                    {textoMostrado
                      ? `No encontramos materias que coincidan con "${textoMostrado}".`
                      : "Esta facultad no tiene materias cargadas todavía."}
                  </p>
                  {textoMostrado && (
                    <button
                      type="button"
                      onClick={handleClearSearch}
                      className="mt-3 text-sm font-medium text-brand-orange hover:underline"
                    >
                      Limpiar búsqueda
                    </button>
                  )}
                </div>
              )}

              {/* Lista de materias */}
              {!cargandoMaterias && !errorMaterias && totalResultados > 0 && (
                <ul
                  className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3"
                  aria-label="Resultados de materias"
                >
                  {materias.map((m) => (
                    <li key={m.id}>
                      <TarjetaMateria
                        materia={m}
                        /* Mostramos la facultad solo si no hay una seleccionada (búsqueda global) */
                        facultadNombre={
                          !facultadParam
                            ? mapFacultad.get(m.facultyId)
                            : undefined
                        }
                      />
                    </li>
                  ))}
                </ul>
              )}
            </>
          )}
        </section>
      </div>
    </div>
  );
}

