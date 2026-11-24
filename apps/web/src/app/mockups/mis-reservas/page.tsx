import { formatArs } from "@estudioya/shared";
import { CalendarIcon, VideoIcon } from "lucide-react";
import { BOOKINGS, type BookingStatus } from "../_data";
import { Avatar, Badge, CLASS_TYPE_LABEL, Card, DesignNote, PageTitle, formatDateTime } from "../_components/ui";

export const metadata = { title: "Mis reservas" };

const STATUS: Record<BookingStatus, { label: string; tone: "yellow" | "green" | "navy" | "red" | "neutral" }> = {
  PENDING_PAYMENT: { label: "Falta pagar", tone: "yellow" },
  CONFIRMED: { label: "Confirmada", tone: "green" },
  COMPLETED: { label: "Completada", tone: "navy" },
  CANCELLED: { label: "Cancelada", tone: "red" },
  EXPIRED: { label: "Vencida", tone: "neutral" },
};

function ReviewForm() {
  return (
    <form className="mt-4 space-y-3 rounded-lg bg-muted p-4" aria-label="Dejar reseña">
      <fieldset>
        <legend className="mb-1 text-sm font-medium">¿Cómo fue la clase?</legend>
        <div className="flex flex-row-reverse justify-end gap-1 text-2xl">
          {/* Estrellas accesibles con radios; el orden invertido permite pintar "hasta la elegida" con CSS. */}
          {[5, 4, 3, 2, 1].map((n) => (
            <label
              key={n}
              className="cursor-pointer text-border has-checked:text-brand-orange [label:has(:checked)~&]:text-brand-orange"
            >
              <input type="radio" name="rating" value={n} className="sr-only" defaultChecked={n === 4} />
              <span aria-hidden="true">★</span>
              <span className="sr-only">{n} estrellas</span>
            </label>
          ))}
        </div>
      </fieldset>
      <textarea
        className="min-h-20 w-full rounded-lg border border-input bg-white p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
        placeholder="Contá qué te sirvió (opcional)"
        aria-label="Comentario"
      />
      <button type="button" className="rounded-lg bg-brand-orange-strong px-4 py-2 text-sm font-semibold text-white hover:opacity-90">
        Publicar reseña
      </button>
    </form>
  );
}

function BookingItem({ b }: { b: (typeof BOOKINGS)[number] }) {
  const s = STATUS[b.status];
  return (
    <Card>
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
        <Avatar name={b.teacherName} />
        <div className="flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-semibold text-brand-navy">{b.subjectName}</h3>
            <Badge tone={s.tone}>{s.label}</Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            con {b.teacherName} · {CLASS_TYPE_LABEL[b.classType]} · {b.durationMinutes} min · {formatArs(b.amountCents)}
          </p>
          <p className="mt-1 flex items-center gap-1 text-sm">
            <CalendarIcon className="size-4 text-muted-foreground" aria-hidden="true" /> {formatDateTime(b.startsAt)}
          </p>
        </div>

        <div className="flex flex-wrap gap-2 sm:flex-col sm:items-end">
          {b.status === "PENDING_PAYMENT" && (
            <button type="button" className="rounded-lg bg-brand-orange-strong px-4 py-2 text-sm font-semibold text-white">
              Pagar ahora
            </button>
          )}
          {b.status === "CONFIRMED" && (
            <>
              <button type="button" className="inline-flex items-center gap-1 rounded-lg bg-brand-navy px-4 py-2 text-sm font-semibold text-white">
                <VideoIcon className="size-4" aria-hidden="true" /> Entrar a la clase
              </button>
              <button type="button" className="text-sm text-destructive hover:underline">
                Cancelar reserva
              </button>
            </>
          )}
          {b.status === "COMPLETED" && b.reviewed && <span className="text-sm text-muted-foreground">Ya dejaste tu reseña</span>}
        </div>
      </div>
      {b.status === "COMPLETED" && !b.reviewed && <ReviewForm />}
    </Card>
  );
}

export default function MisReservasMockupPage() {
  const upcoming = BOOKINGS.filter((b) => b.status === "PENDING_PAYMENT" || b.status === "CONFIRMED").sort((a, b) =>
    a.startsAt.localeCompare(b.startsAt),
  );
  const past = BOOKINGS.filter((b) => !upcoming.includes(b));

  return (
    <div className="mx-auto max-w-3xl">
      <PageTitle title="Mis reservas" />

      <div role="tablist" aria-label="Filtrar reservas" className="mb-6 inline-flex rounded-lg bg-muted p-1 text-sm">
        <button role="tab" aria-selected="true" className="rounded-md bg-white px-4 py-1.5 font-semibold shadow-sm">
          Próximas ({upcoming.length})
        </button>
        <button role="tab" aria-selected="false" className="rounded-md px-4 py-1.5 text-muted-foreground">
          Pasadas ({past.length})
        </button>
      </div>

      <section className="space-y-3" aria-label="Próximas">
        {upcoming.map((b) => (
          <BookingItem key={b.id} b={b} />
        ))}
      </section>

      <h2 className="mt-10 mb-3 text-lg font-semibold text-brand-navy">Pasadas</h2>
      <p className="mb-3 text-xs text-muted-foreground">(En la pantalla real se ven al elegir la pestaña &quot;Pasadas&quot;.)</p>
      <section className="space-y-3" aria-label="Pasadas">
        {past.map((b) => (
          <BookingItem key={b.id} b={b} />
        ))}
      </section>

      <div className="mt-6 space-y-2">
        <DesignNote>
          &quot;Cancelar reserva&quot; abre una confirmación que dice si hay reembolso según BR-13 (más o menos de 24 h antes).
        </DesignNote>
        <DesignNote>
          el formulario de reseña aparece solo en clases completadas sin reseña (BR-08) y no se puede editar después.
        </DesignNote>
        <DesignNote>el profesor ve esta misma pantalla con sus alumnos (<code>GET /bookings?role=teacher</code>).</DesignNote>
      </div>
    </div>
  );
}
