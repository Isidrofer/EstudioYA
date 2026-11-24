import { formatArs, type TeacherCardDto } from "@estudioya/shared";
import { GraduationCapIcon } from "lucide-react";
import Link from "next/link";
import { Avatar, Badge, Rating, TEACHER_TYPE_LABEL } from "./ui";

/** Precio más bajo que ofrece el profesor, para el "desde $X/h" de la tarjeta. */
function minPrice(t: TeacherCardDto): number | null {
  const prices = t.subjects.flatMap((s) => [s.individualPriceCents, s.groupPriceCents]).filter((p): p is number => p !== null);
  return prices.length ? Math.min(...prices) : null;
}

/** Tarjeta de profesor de la búsqueda (FE-05). Recibe un `TeacherCardDto` tal como lo devuelve `GET /teachers`. */
export default function TeacherCard({ teacher, href }: { teacher: TeacherCardDto; href: string }) {
  const name = `${teacher.firstName} ${teacher.lastName}`;
  const from = minPrice(teacher);
  const offersGroup = teacher.subjects.some((s) => s.groupPriceCents !== null);

  return (
    <article className="flex flex-col gap-4 rounded-xl border border-border bg-white p-5 shadow-sm sm:flex-row">
      <Avatar name={name} size="lg" />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <h2 className="text-lg font-semibold text-brand-navy">
            <Link href={href} className="hover:underline">
              {name}
            </Link>
          </h2>
          <Rating avg={teacher.ratingAvg} count={teacher.ratingCount} />
        </div>

        <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
          <GraduationCapIcon className="size-4" aria-hidden="true" />
          {TEACHER_TYPE_LABEL[teacher.type]} · {teacher.careerName}
        </p>

        {teacher.bioSummary && <p className="mt-2 line-clamp-2 text-sm">{teacher.bioSummary}</p>}

        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Materias">
          {teacher.subjects.map((s) => (
            <li key={s.subjectId}>
              <Badge>{s.subjectName}</Badge>
            </li>
          ))}
          {offersGroup && (
            <li>
              <Badge tone="orange">Clases grupales</Badge>
            </li>
          )}
        </ul>
      </div>

      <div className="flex shrink-0 flex-row items-center justify-between gap-3 border-t border-border pt-4 sm:flex-col sm:items-end sm:justify-between sm:border-0 sm:pt-0">
        {from !== null && (
          <p className="text-right">
            <span className="block text-xs text-muted-foreground">desde</span>
            <span className="text-xl font-bold text-brand-navy">{formatArs(from)}</span>
            <span className="text-sm text-muted-foreground">/h</span>
          </p>
        )}
        <Link
          href={href}
          className="rounded-lg bg-brand-orange-strong px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
        >
          Ver perfil
        </Link>
      </div>
    </article>
  );
}
