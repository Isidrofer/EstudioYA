import { CheckIcon, DownloadIcon, XIcon } from "lucide-react";
import { APPLICATIONS } from "../_data";
import { Badge, Card, DesignNote, PageTitle, TEACHER_TYPE_LABEL, formatDateTime } from "../_components/ui";
import { cn } from "@/lib/utils";

export const metadata = { title: "Panel de administración" };

export default function AdminMockupPage() {
  const selected = APPLICATIONS[0]!;

  return (
    <>
      <PageTitle title="Solicitudes de profesores" description="Revisá la documentación y aprobá o rechazá cada solicitud." />

      <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg bg-muted p-1 text-sm sm:inline-flex">
        {[
          ["Pendientes", APPLICATIONS.length],
          ["Aprobadas", 14],
          ["Rechazadas", 3],
        ].map(([label, n], i) => (
          <button key={label} type="button" className={cn("shrink-0 rounded-md px-4 py-1.5", i === 0 && "bg-white font-semibold shadow-sm")}>
            {label} ({n})
          </button>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_400px]">
        {/* Tabla de solicitudes */}
        <div className="overflow-x-auto rounded-xl border border-border bg-white shadow-sm">
          <table className="w-full min-w-[560px] text-sm">
            <thead className="bg-muted text-left text-muted-foreground">
              <tr>
                <th className="p-3 font-medium">Solicitante</th>
                <th className="p-3 font-medium">Tipo</th>
                <th className="p-3 font-medium">Materias</th>
                <th className="p-3 font-medium">Enviada</th>
              </tr>
            </thead>
            <tbody>
              {APPLICATIONS.map((a) => (
                <tr
                  key={a.id}
                  className={cn("cursor-pointer border-t border-border hover:bg-muted/60", a.id === selected.id && "bg-accent/50")}
                >
                  <td className="p-3">
                    <span className="block font-medium">{a.applicant}</span>
                    <span className="text-xs text-muted-foreground">{a.faculty}</span>
                  </td>
                  <td className="p-3">{TEACHER_TYPE_LABEL[a.type]}</td>
                  <td className="p-3">{a.subjects.join(", ")}</td>
                  <td className="p-3 whitespace-nowrap text-muted-foreground">{formatDateTime(a.submittedAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Detalle */}
        <Card className="space-y-4 self-start">
          <div className="flex items-start justify-between gap-2">
            <div>
              <h2 className="text-lg font-semibold text-brand-navy">{selected.applicant}</h2>
              <p className="text-sm text-muted-foreground">{selected.email}</p>
            </div>
            <Badge tone="yellow">En revisión</Badge>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-sm">
            <dt className="text-muted-foreground">Tipo</dt>
            <dd>{TEACHER_TYPE_LABEL[selected.type]}</dd>
            <dt className="text-muted-foreground">Facultad</dt>
            <dd>{selected.faculty}</dd>
            <dt className="text-muted-foreground">Materias</dt>
            <dd>{selected.subjects.join(", ")}</dd>
          </dl>

          <div>
            <h3 className="mb-2 text-sm font-semibold">Documentos</h3>
            <ul className="space-y-2">
              {selected.documents.map((d) => (
                <li key={d}>
                  <button type="button" className="flex w-full items-center justify-between rounded-lg border border-border px-3 py-2 text-sm hover:bg-muted">
                    {d}
                    <DownloadIcon className="size-4 text-muted-foreground" aria-hidden="true" />
                  </button>
                </li>
              ))}
            </ul>
          </div>

          <div className="space-y-1.5">
            <label htmlFor="motivo" className="text-sm font-medium">
              Motivo del rechazo
            </label>
            <textarea
              id="motivo"
              className="min-h-20 w-full rounded-lg border border-input p-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
              placeholder="Obligatorio solo si rechazás. Lo ve el solicitante."
            />
          </div>

          <div className="flex gap-2">
            <button type="button" className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-700 py-2 text-sm font-semibold text-white hover:opacity-90">
              <CheckIcon className="size-4" aria-hidden="true" /> Aprobar
            </button>
            <button type="button" className="inline-flex flex-1 items-center justify-center gap-1 rounded-lg border border-destructive py-2 text-sm font-semibold text-destructive hover:bg-destructive/10">
              <XIcon className="size-4" aria-hidden="true" /> Rechazar
            </button>
          </div>
        </Card>
      </div>

      <div className="mt-6 space-y-2">
        <DesignNote>
          solo usuarios <code>ADMIN</code>. Aprobar pide confirmación: el usuario pasa a <code>TEACHER</code> y aparece en
          las búsquedas (BR-17, BR-11).
        </DesignNote>
        <DesignNote>más adelante el panel suma pestañas de soporte, FAQ y mensajes reportados (BE-11, BE-12).</DesignNote>
      </div>
    </>
  );
}
