"use client";

/**
 * Hooks de TanStack Query para el catálogo (facultades y materias).
 * FE-04 — Explorar catálogo.
 *
 * Los datos de catálogo cambian muy poco, así que les damos un staleTime largo (5 min).
 */
import { useQuery } from "@tanstack/react-query";
import type { FacultyDto, Paginated, SubjectDto } from "@estudioya/shared";
import { api } from "@/lib/api";

/** Duración del cache para el catálogo: 5 minutos (los datos cambian poco). */
const CATALOG_STALE_TIME = 5 * 60 * 1_000;

/** Tamaño máximo que acepta `GET /subjects` por página (ver subjectSearchSchema). */
const SUBJECTS_PAGE_SIZE = 50;

/* ── Facultades ──────────────────────────────────────────────────── */

export function useFaculties() {
  return useQuery<FacultyDto[]>({
    queryKey: ["catalog", "faculties"],
    queryFn: () => api.get<FacultyDto[]>("/faculties"),
    staleTime: CATALOG_STALE_TIME,
  });
}

/* ── Materias (todas las páginas, sin filtro `q` en la API) ──────── */

/**
 * Trae todas las materias (opcionalmente de una facultad) recorriendo todas las páginas.
 * No envía `q` al servidor porque Postgres `ILIKE` distingue tildes ("algebra" no
 * encontraría "Álgebra"): el filtrado ignorando mayúsculas y tildes se hace en el cliente.
 */
async function fetchAllSubjects(facultyId?: string): Promise<SubjectDto[]> {
  const firstPage = await api.get<Paginated<SubjectDto>>("/subjects", {
    query: { facultyId, page: 1, pageSize: SUBJECTS_PAGE_SIZE },
  });

  if (firstPage.meta.totalPages <= 1) return firstPage.data;

  const restPages = await Promise.all(
    Array.from({ length: firstPage.meta.totalPages - 1 }, (_, i) =>
      api.get<Paginated<SubjectDto>>("/subjects", {
        query: { facultyId, page: i + 2, pageSize: SUBJECTS_PAGE_SIZE },
      }),
    ),
  );

  return [firstPage, ...restPages].flatMap((page) => page.data);
}

export function useCatalogSubjects(
  facultyId?: string,
  options?: { enabled?: boolean },
) {
  return useQuery<SubjectDto[]>({
    queryKey: ["catalog", "subjects", "all", facultyId ?? "all"],
    queryFn: () => fetchAllSubjects(facultyId),
    enabled: options?.enabled ?? true,
    staleTime: CATALOG_STALE_TIME,
  });
}
