import { formatArs } from "@estudioya/shared";
import { ClockIcon, GraduationCapIcon, MessageCircleIcon, ShieldCheckIcon, StarIcon, UsersIcon } from "lucide-react";
import Link from "next/link";
import { REVIEWS, SLOTS, TEACHER_PROFILE as t, subjectName } from "../_data";
import {
  Avatar,
  Badge,
  CLASS_TYPE_LABEL,
  Card,
  DesignNote,
  Rating,
  TEACHER_TYPE_LABEL,
  formatDateTime,
  formatDay,
  formatTime,
} from "../_components/ui";

export const metadata = { title: "Perfil del profesor" };

export default function ProfesorMockupPage() {
  const name = `${t.firstName} ${t.lastName}`;
  const hours = Math.round(t.minutesTaught / 60);

  // Agrupa los horarios por día (en hora de Argentina) para mostrarlos como agenda.
  const byDay = new Map<string, typeof SLOTS>();
  for (const s of SLOTS) {
    const day = formatDay(s.startsAt);
    byDay.set(day, [...(byDay.get(day) ?? []), s]);
  }

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
      <div className="space-y-6">
        {/* Encabezado */}
        <Card className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <Avatar name={name} size="lg" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-brand-navy">{name}</h1>
            <p className="mt-0.5 flex items-center gap-1 text-sm text-muted-foreground">
              <GraduationCapIcon className="size-4" aria-hidden="true" />
              {TEACHER_TYPE_LABEL[t.type]} · {t.careerName} ({t.graduationYear}) · {t.faculty?.name}
            </p>
            <div className="mt-2 flex flex-wrap items-center gap-3">
              <Rating avg={t.ratingAvg} count={t.ratingCount} />
              <Badge tone="green">
                <ShieldCheckIcon className="size-3.5" aria-hidden="true" /> Documentación verificada
              </Badge>
            </div>
          </div>
        </Card>

        {/* Estadísticas */}
        <dl className="grid grid-cols-3 gap-3 text-center">
          {[
            { label: "Horas dictadas", value: `${hours} h`, icon: ClockIcon },
            { label: "Puntaje", value: t.ratingAvg.toFixed(1).replace(".", ","), icon: StarIcon },
            { label: "Cancelaciones", value: `${Math.round(t.cancellationRate * 100)} %`, icon: UsersIcon },
          ].map(({ label, value, icon: Icon }) => (
            <div key={label} className="rounded-xl border border-border bg-white p-3 shadow-sm">
              <Icon className="mx-auto mb-1 size-5 text-brand-orange" aria-hidden="true" />
              <dd className="text-lg font-bold text-brand-navy">{value}</dd>
              <dt className="text-xs text-muted-foreground">{label}</dt>
            </div>
          ))}
        </dl>

        {/* Bio */}
        <Card>
          <h2 className="mb-2 text-lg font-semibold text-brand-navy">Sobre mí</h2>
          <p className="text-sm leading-relaxed whitespace-pre-line">{t.bio}</p>
        </Card>

        {/* Materias y precios */}
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-brand-navy">Materias y precios</h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-left text-muted-foreground">
                  <th className="py-2 font-medium">Materia</th>
                  <th className="py-2 text-right font-medium">Individual</th>
                  <th className="py-2 text-right font-medium">Grupal (por alumno)</th>
                </tr>
              </thead>
              <tbody>
                {t.subjects.map((s) => (
                  <tr key={s.subjectId} className="border-b border-border last:border-0">
                    <td className="py-2.5 font-medium">{s.subjectName}</td>
                    <td className="py-2.5 text-right">{s.individualPriceCents ? `${formatArs(s.individualPriceCents)}/h` : "—"}</td>
                    <td className="py-2.5 text-right">{s.groupPriceCents ? `${formatArs(s.groupPriceCents)}/h` : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>

        {/* Reseñas */}
        <Card>
          <h2 className="mb-3 text-lg font-semibold text-brand-navy">Reseñas de alumnos</h2>
          <ul className="divide-y divide-border">
            {REVIEWS.map((r) => (
              <li key={r.id} className="py-3 first:pt-0 last:pb-0">
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{r.author}</span>
                  <span className="text-brand-orange" aria-label={`${r.rating} de 5 estrellas`}>
                    {"★".repeat(r.rating)}
                    <span className="text-border">{"★".repeat(5 - r.rating)}</span>
                  </span>
                </div>
                <p className="mt-1 text-sm">{r.comment}</p>
                <p className="mt-1 text-xs text-muted-foreground">{formatDateTime(r.createdAt)}</p>
              </li>
            ))}
          </ul>
          <DesignNote>solo opinan alumnos con una clase completada (BR-08). Se pagina de a 10.</DesignNote>
        </Card>
      </div>

      {/* Columna de reserva: fija en escritorio, debajo en celular */}
      <aside className="lg:sticky lg:top-20 lg:self-start">
        <Card className="space-y-4">
          <h2 className="text-lg font-semibold text-brand-navy">Horarios disponibles</h2>
          {[...byDay.entries()].map(([day, slots]) => (
            <div key={day}>
              <h3 className="mb-2 text-sm font-medium text-muted-foreground">{day}</h3>
              <ul className="space-y-2">
                {slots.map((s) => (
                  <li key={s.id}>
                    <Link
                      href="/mockups/reservar"
                      className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm hover:border-brand-orange hover:bg-accent/40"
                    >
                      <span>
                        <span className="font-semibold">{formatTime(s.startsAt)}</span>
                        <span className="text-muted-foreground"> · {s.durationMinutes} min · {subjectName(s.subjectId)}</span>
                      </span>
                      <Badge tone={s.classType === "GROUP" ? "orange" : "neutral"}>
                        {CLASS_TYPE_LABEL[s.classType]}
                        {s.classType === "GROUP" && ` · ${s.seatsLeft} lugares`}
                      </Badge>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <Link
            href="/mockups/chat"
            className="flex w-full items-center justify-center gap-2 rounded-lg border border-border py-2 text-sm font-medium hover:bg-muted"
          >
            <MessageCircleIcon className="size-4" aria-hidden="true" /> Enviar mensaje
          </Link>
          <DesignNote>
            el chat solo se habilita si ya hay una reserva entre ambos (BR-14); sin reserva, el botón se oculta.
          </DesignNote>
        </Card>
      </aside>
    </div>
  );
}
