/**
 * Convierte errores de validación (Zod en el navegador o `errors[]` de la API) en mensajes por campo,
 * para mostrarlos debajo de cada input. Las reglas viven en los schemas de `@estudioya/shared`:
 * acá solo se traducen los resultados, no se valida nada.
 */
import { isApiError } from "@/lib/api";

export type FieldErrors<F extends string> = Partial<Record<F, string>>;

export interface FormErrors<F extends string> {
  /** Mensaje por campo (el primero que corresponda a cada uno). */
  fields: FieldErrors<F>;
  /** Mensaje general del formulario, para lo que no pertenece a un campo. */
  form?: string;
}

/** Forma mínima de un issue de Zod (`safeParse(...).error.issues`), sin depender de Zod en la web. */
interface IssueLike {
  path: readonly (string | number)[];
  message: string;
}

/** Primer mensaje de cada campo a partir de los issues de un `schema.safeParse()`. */
export function issuesToFieldErrors<F extends string>(issues: readonly IssueLike[]): FieldErrors<F> {
  const result: Record<string, string> = {};
  for (const issue of issues) {
    const field = String(issue.path[0] ?? "");
    if (field && !(field in result)) result[field] = issue.message;
  }
  return result as FieldErrors<F>;
}

/**
 * Traduce un error de `api.ts` a errores del formulario.
 * Los `errors[]` de un 400 van a su campo (si el formulario lo tiene); el resto, al mensaje general.
 * Los casos propios de cada pantalla (ej. el 409 del registro) se resuelven antes de llamar a esta función.
 */
export function apiErrorToFormErrors<F extends string>(
  error: unknown,
  formFields: readonly F[],
): FormErrors<F> {
  if (!isApiError(error)) {
    return { fields: {}, form: "Ocurrió un error inesperado. Probá de nuevo." };
  }

  const fields: Record<string, string> = {};
  const unmatched: string[] = [];
  for (const { field, message } of error.fieldErrors) {
    const name = field.split(".")[0];
    if ((formFields as readonly string[]).includes(name)) {
      if (!(name in fields)) fields[name] = message;
    } else {
      unmatched.push(message);
    }
  }

  let form: string | undefined;
  if (error.code === "NETWORK_ERROR") {
    form = "No pudimos conectarnos con el servidor. Revisá tu conexión y probá de nuevo.";
  } else if (error.code === "RATE_LIMITED") {
    form = "Hiciste demasiados intentos seguidos. Esperá un minuto y volvé a probar.";
  } else if (error.status >= 500) {
    form = "Tuvimos un problema en el servidor. Probá de nuevo en unos minutos.";
  } else if (unmatched.length > 0) {
    form = unmatched.join(" ");
  } else if (Object.keys(fields).length === 0) {
    form = error.detail ?? error.title;
  }

  return { fields: fields as FieldErrors<F>, form };
}
