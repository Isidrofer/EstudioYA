import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { TEACHER_PROFILE } from "../_data";
import { Card, DesignNote, PageTitle } from "../_components/ui";
import WeeklyGrid from "./weekly-grid";

export const metadata = { title: "Agenda del profesor" };

const fieldClass =
  "h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

export default function AgendaMockupPage() {
  return (
    <>
      <PageTitle
        title="Mi agenda"
        description="Marcá tus horas libres de una semana tipo. Con eso armamos tus horarios de las próximas 4 semanas."
      />

      <div className="mb-6 rounded-lg border border-yellow-300 bg-yellow-50 px-4 py-3 text-sm text-yellow-900">
        ⛔ Esta pantalla depende de la decisión <strong>D-07</strong> (grilla semanal vs. cargar cada horario a mano). El
        mockup muestra la propuesta actual: grilla semanal.
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <WeeklyGrid />

        <aside className="space-y-4">
          <Card className="space-y-4">
            <h2 className="font-semibold text-brand-navy">Opciones de las clases</h2>
            <div className="space-y-1.5">
              <Label htmlFor="a-materias">Materias</Label>
              <select id="a-materias" className={fieldClass} defaultValue="all">
                <option value="all">Todas mis materias</option>
                {TEACHER_PROFILE.subjects.map((s) => (
                  <option key={s.subjectId} value={s.subjectId}>
                    {s.subjectName}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-tipo">Tipo de clase</Label>
              <select id="a-tipo" className={fieldClass} defaultValue="INDIVIDUAL">
                <option value="INDIVIDUAL">Individual</option>
                <option value="GROUP">Grupal</option>
                <option value="BOTH">El alumno elige</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1.5">
                <Label htmlFor="a-min">Mín. alumnos</Label>
                <Input id="a-min" defaultValue={2} inputMode="numeric" className="h-9 bg-white" />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="a-max">Máx. alumnos</Label>
                <Input id="a-max" defaultValue={5} inputMode="numeric" className="h-9 bg-white" />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="a-link">Link de videollamada</Label>
              <Input id="a-link" placeholder="https://meet.google.com/..." className="h-9 bg-white" />
            </div>
            <button type="button" className="w-full rounded-lg bg-brand-orange-strong py-2.5 text-sm font-semibold text-white hover:opacity-90">
              Guardar agenda
            </button>
          </Card>

          <DesignNote>
            &quot;Mín./Máx. alumnos&quot; solo aparece para clases grupales (BR-05). Las horas que ya tienen reservas no se
            pueden desmarcar.
          </DesignNote>
          <DesignNote>el link de videollamada responde a D-03 (propuesta: link externo que pega el profesor).</DesignNote>
          <DesignNote>
            falta definir: bloquear días puntuales (feriados, exámenes) sin tocar la semana tipo.
          </DesignNote>
        </aside>
      </div>
    </>
  );
}
