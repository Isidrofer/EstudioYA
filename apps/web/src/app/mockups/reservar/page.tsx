import { BOOKING_HOLD_MINUTES, formatArs, splitAmount } from "@estudioya/shared";
import { CalendarIcon, ClockIcon, InfoIcon, LockIcon, TimerIcon } from "lucide-react";
import Link from "next/link";
import { SLOTS, TEACHER_PROFILE, subjectName } from "../_data";
import { Avatar, CLASS_TYPE_LABEL, Card, DesignNote, PageTitle, formatDateTime } from "../_components/ui";

export const metadata = { title: "Confirmar y pagar" };

export default function ReservarMockupPage() {
  const slot = SLOTS[0]!;
  const offer = TEACHER_PROFILE.subjects.find((s) => s.subjectId === slot.subjectId)!;
  const pricePerHour = offer.individualPriceCents!;
  // BR-02: importe = precio por hora × duración / 60.
  const amount = Math.round((pricePerHour * slot.durationMinutes) / 60);
  const { teacherNetCents } = splitAmount(amount);
  const teacherName = `${TEACHER_PROFILE.firstName} ${TEACHER_PROFILE.lastName}`;

  return (
    <div className="mx-auto max-w-xl">
      <PageTitle title="Confirmá tu clase" />

      <div
        role="status"
        className="mb-5 flex items-center gap-2 rounded-lg bg-yellow-100 px-4 py-3 text-sm text-yellow-900"
      >
        <TimerIcon className="size-5 shrink-0" aria-hidden="true" />
        <span>
          Te guardamos el lugar por <strong>{BOOKING_HOLD_MINUTES} minutos</strong>. Quedan <strong>09:42</strong> para pagar.
        </span>
      </div>

      <Card className="space-y-4">
        <div className="flex items-center gap-3">
          <Avatar name={teacherName} />
          <div>
            <p className="font-semibold text-brand-navy">{teacherName}</p>
            <p className="text-sm text-muted-foreground">{subjectName(slot.subjectId)}</p>
          </div>
        </div>

        <ul className="space-y-2 text-sm">
          <li className="flex items-center gap-2">
            <CalendarIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            <span>{formatDateTime(slot.startsAt)}</span> (hora de Argentina)
          </li>
          <li className="flex items-center gap-2">
            <ClockIcon className="size-4 text-muted-foreground" aria-hidden="true" />
            {slot.durationMinutes} minutos · Clase {CLASS_TYPE_LABEL[slot.classType].toLowerCase()} · Videollamada
          </li>
        </ul>

        <dl className="space-y-1 border-t border-border pt-4 text-sm">
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Precio por hora</dt>
            <dd>{formatArs(pricePerHour)}</dd>
          </div>
          <div className="flex justify-between">
            <dt className="text-muted-foreground">Duración</dt>
            <dd>{slot.durationMinutes} min</dd>
          </div>
          <div className="flex justify-between pt-2 text-base font-bold text-brand-navy">
            <dt>Total</dt>
            <dd>{formatArs(amount)}</dd>
          </div>
        </dl>

        <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2 text-xs text-muted-foreground">
          <InfoIcon className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
          Podés cancelar sin costo hasta 24 h antes de la clase y te devolvemos todo. Después de eso no hay reembolso.
        </p>

        <button
          type="button"
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-orange-strong py-3 font-semibold text-white hover:opacity-90"
        >
          <LockIcon className="size-4" aria-hidden="true" /> Pagar {formatArs(amount)} con Mercado Pago
        </button>
        <Link href="/mockups/profesor" className="block text-center text-sm text-muted-foreground hover:underline">
          Elegir otro horario
        </Link>
      </Card>

      <div className="mt-5 space-y-2">
        <DesignNote>
          el contador muestra el tiempo de retención de BR-06 (por confirmar). Al llegar a 0 se muestra &quot;Se liberó el lugar&quot;
          y un botón para volver al perfil.
        </DesignNote>
        <DesignNote>
          la política de cancelación es BR-13 (por confirmar, D-02). No mostramos la comisión al alumno: el profesor
          recibe {formatArs(teacherNetCents)} de este pago (65 %).
        </DesignNote>
        <DesignNote>el link de la videollamada lo pega el profesor (D-03, propuesta) y se muestra en &quot;Mis reservas&quot;.</DesignNote>
      </div>
    </div>
  );
}
