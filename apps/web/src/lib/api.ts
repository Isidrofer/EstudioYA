/**
 * Cliente HTTP de la web para hablar con la API (FE-02).
 *
 * Todas las pantallas usan este módulo en lugar de llamar a `fetch` directamente, porque:
 *  - Manda las cookies de sesión (`credentials: 'include'`): la web corre en :3000 y la API en :4000.
 *  - Agrega `X-Requested-With: estudioya`, que la API exige en toda ruta que modifica datos (CSRF).
 *  - Convierte los errores `application/problem+json` en un `ApiError` con `status`, `code` y `errors[]`.
 *  - Ante un `401` llama una sola vez a `POST /auth/refresh` y repite la request original.
 *
 * Solo funciona en el navegador (Client Components): en el servidor de Next no están las cookies
 * del usuario, así que una llamada desde un Server Component siempre saldría sin sesión.
 */
import type { ErrorCode, ProblemDetails } from '@estudioya/shared';

/** Para cambiarla, crear `apps/web/.env.local` con NEXT_PUBLIC_API_URL (Next no lee el .env de la raíz). */
export const API_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000/api/v1').replace(
  /\/$/,
  '',
);

/** Código extra para cuando la API no responde (está apagada, sin internet, CORS mal configurado). */
export type ApiErrorCode = ErrorCode | 'NETWORK_ERROR';

/** Error de la API. Las pantallas pueden mirar `status`, `code` o `fieldErrors` para decidir qué mostrar. */
export class ApiError extends Error {
  readonly status: number;
  readonly code: ApiErrorCode;
  readonly title: string;
  readonly detail?: string;
  /** Errores de validación por campo (`errors[]` del problem+json), ej. `{ field: 'email', message: '...' }`. */
  readonly fieldErrors: { field: string; message: string }[];
  readonly traceId?: string;

  constructor(problem: {
    status: number;
    code: ApiErrorCode;
    title: string;
    detail?: string;
    errors?: { field: string; message: string }[];
    traceId?: string;
  }) {
    super(problem.detail ?? problem.title);
    this.name = 'ApiError';
    this.status = problem.status;
    this.code = problem.code;
    this.title = problem.title;
    this.detail = problem.detail;
    this.fieldErrors = problem.errors ?? [];
    this.traceId = problem.traceId;
  }

  /** Mensaje del primer error del campo indicado, útil para mostrarlo debajo de un input. */
  fieldError(field: string): string | undefined {
    return this.fieldErrors.find((e) => e.field === field)?.message;
  }
}

export const isApiError = (error: unknown): error is ApiError => error instanceof ApiError;

/* ── Eventos de sesión ──────────────────────────────────────────────────────
   El módulo avisa cuando renovó la sesión o cuando ya no se pudo renovar.
   `providers.tsx` escucha `expired` para borrar al usuario de la cache. */
export type SessionEvent = 'refreshed' | 'expired';
type SessionListener = (event: SessionEvent) => void;
const sessionListeners = new Set<SessionListener>();

/** Suscribirse a los eventos de sesión. Devuelve la función para desuscribirse. */
export function onSessionEvent(listener: SessionListener): () => void {
  sessionListeners.add(listener);
  return () => {
    sessionListeners.delete(listener);
  };
}

function emit(event: SessionEvent) {
  sessionListeners.forEach((listener) => listener(event));
}

/* ── Refresh "de un solo vuelo" ─────────────────────────────────────────────
   El refresh token es rotativo: si se usa dos veces, la API lo toma como robo y cierra TODAS
   las sesiones del usuario. Si varias requests reciben 401 a la vez, solo la primera llama a
   /auth/refresh y las demás esperan esa misma promesa. */
let refreshInFlight: Promise<boolean> | null = null;

/** Rutas en las que un 401 no se arregla renovando la sesión (o donde intentarlo causaría un bucle). */
const NO_REFRESH_PATHS = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

function refreshSession(): Promise<boolean> {
  if (!refreshInFlight) {
    refreshInFlight = fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: { 'X-Requested-With': 'estudioya' },
    })
      .then((res) => res.ok)
      .catch(() => false)
      .then((ok) => {
        emit(ok ? 'refreshed' : 'expired');
        return ok;
      })
      .finally(() => {
        refreshInFlight = null;
      });
  }
  return refreshInFlight;
}

/* ── Request principal ───────────────────────────────────────────────────── */

export interface ApiRequestOptions extends Omit<RequestInit, 'body'> {
  /** Objeto que se manda como JSON, o `FormData` para subir archivos (no se toca el Content-Type). */
  body?: unknown;
  /** Query string, ej. `{ facultyId: 'abc', page: 2 }`. Los valores `undefined` se omiten. */
  query?: Record<string, string | number | boolean | undefined | null>;
}

function buildUrl(path: string, query?: ApiRequestOptions['query']): string {
  const url = `${API_URL}${path.startsWith('/') ? path : `/${path}`}`;
  if (!query) return url;
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value !== undefined && value !== null) params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

async function send(path: string, options: ApiRequestOptions): Promise<Response> {
  const { body, query, headers, ...init } = options;
  const finalHeaders = new Headers(headers);
  finalHeaders.set('X-Requested-With', 'estudioya');

  let finalBody: BodyInit | undefined;
  if (body instanceof FormData) {
    finalBody = body; // el navegador arma el multipart/form-data con su boundary
  } else if (body !== undefined) {
    finalHeaders.set('Content-Type', 'application/json');
    finalBody = JSON.stringify(body);
  }

  try {
    return await fetch(buildUrl(path, query), {
      ...init,
      headers: finalHeaders,
      body: finalBody,
      credentials: 'include',
    });
  } catch {
    throw new ApiError({
      status: 0,
      code: 'NETWORK_ERROR',
      title: 'No se pudo conectar con el servidor',
      detail: '¿Está levantada la API? (npm run dev:api)',
    });
  }
}

/** Arma el `ApiError` a partir de una respuesta con error, sea problem+json o no. */
async function toApiError(res: Response): Promise<ApiError> {
  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('json')) {
    try {
      const problem = (await res.json()) as Partial<ProblemDetails>;
      if (problem && typeof problem === 'object' && problem.code) {
        return new ApiError({
          status: problem.status ?? res.status,
          code: problem.code,
          title: problem.title ?? res.statusText,
          detail: problem.detail,
          errors: problem.errors,
          traceId: problem.traceId,
        });
      }
    } catch {
      // cuerpo vacío o JSON inválido: se usa el genérico de abajo
    }
  }
  return new ApiError({
    status: res.status,
    code: res.status >= 500 ? 'INTERNAL_ERROR' : 'VALIDATION_ERROR',
    title: res.statusText || 'Error inesperado',
  });
}

/**
 * Hace una request a la API y devuelve el cuerpo ya parseado.
 * Lanza `ApiError` si la respuesta no es 2xx. Las respuestas `204` devuelven `undefined`.
 *
 * @example
 *   const user = await apiFetch<AuthUser>('/auth/me');
 *   await apiFetch('/support/tickets', { method: 'POST', body: { ... } });
 */
export async function apiFetch<T = unknown>(path: string, options: ApiRequestOptions = {}): Promise<T> {
  let res = await send(path, options);

  if (res.status === 401 && !NO_REFRESH_PATHS.some((p) => path.startsWith(p))) {
    const renewed = await refreshSession();
    if (renewed) res = await send(path, options); // un solo reintento
  }

  if (!res.ok) throw await toApiError(res);
  if (res.status === 204) return undefined as T;

  const contentType = res.headers.get('content-type') ?? '';
  if (contentType.includes('json')) return (await res.json()) as T;
  return (await res.text()) as unknown as T;
}

/** Atajos por método HTTP. */
export const api = {
  get: <T = unknown>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'GET' }),
  post: <T = unknown>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'POST', body }),
  put: <T = unknown>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'PUT', body }),
  patch: <T = unknown>(path: string, body?: unknown, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'PATCH', body }),
  delete: <T = unknown>(path: string, options?: Omit<ApiRequestOptions, 'method' | 'body'>) =>
    apiFetch<T>(path, { ...options, method: 'DELETE' }),
};
