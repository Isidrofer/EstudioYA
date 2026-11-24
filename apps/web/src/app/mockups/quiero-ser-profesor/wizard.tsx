"use client";

import {
  ALLOWED_DOCUMENT_FORMATS_LABEL,
  DOCUMENT_LABELS,
  PRICE_RANGE_CENTS,
  formatArs,
  isPriceInRange,
  missingDocuments,
  type DocumentKind,
  type TeacherType,
} from "@estudioya/shared";
import { CheckCircle2Icon, CheckIcon, FileTextIcon, HourglassIcon, Trash2Icon, UploadIcon, XCircleIcon } from "lucide-react";
import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { FACULTIES } from "../_data";
import { Card, DesignNote } from "../_components/ui";

const STEPS = ["Tus datos", "Materias y precios", "Documentación", "Revisar y enviar"] as const;

const fieldClass =
  "h-9 w-full rounded-lg border border-input bg-white px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

/** Precios de ejemplo en pesos (lo que escribe el usuario) para mostrar la validación con `isPriceInRange`. */
const SAMPLE_OFFERS = [
  { subject: "Análisis Matemático I", individual: 15000, group: 9000 },
  { subject: "Física I", individual: 30000, group: null },
];

function Stepper({ current, onSelect }: { current: number; onSelect: (i: number) => void }) {
  return (
    <ol className="mb-6 grid grid-cols-4 gap-2" aria-label="Pasos">
      {STEPS.map((label, i) => (
        <li key={label}>
          <button
            type="button"
            onClick={() => onSelect(i)}
            aria-current={i === current ? "step" : undefined}
            className="flex w-full flex-col items-center gap-1 text-center text-xs"
          >
            <span
              className={cn(
                "flex size-8 items-center justify-center rounded-full border-2 font-bold",
                i < current && "border-brand-navy bg-brand-navy text-white",
                i === current && "border-brand-orange text-brand-orange-strong",
                i > current && "border-border text-muted-foreground",
              )}
            >
              {i < current ? <CheckIcon className="size-4" aria-hidden="true" /> : i + 1}
            </span>
            <span className={cn("hidden sm:block", i === current ? "font-semibold" : "text-muted-foreground")}>{label}</span>
          </button>
        </li>
      ))}
    </ol>
  );
}

function StepData({ type, setType }: { type: TeacherType; setType: (t: TeacherType) => void }) {
  return (
    <div className="space-y-4">
      <fieldset className="space-y-2">
        <legend className="text-sm font-medium">¿Cómo vas a dar clases?</legend>
        <div className="grid gap-2 sm:grid-cols-2">
          {(
            [
              ["ADVANCED_STUDENT", "Soy estudiante avanzado", "Todavía curso la carrera"],
              ["GRADUATE", "Soy graduado", "Ya tengo el título"],
            ] as const
          ).map(([value, title, hint]) => (
            <label
              key={value}
              className="cursor-pointer rounded-lg border-2 border-border p-3 has-checked:border-brand-orange has-checked:bg-accent/40"
            >
              <input type="radio" name="type" className="sr-only" checked={type === value} onChange={() => setType(value)} />
              <span className="block font-semibold">{title}</span>
              <span className="text-xs text-muted-foreground">{hint}</span>
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label htmlFor="w-facultad">Facultad</Label>
          <select id="w-facultad" className={fieldClass} defaultValue="f1">
            {FACULTIES.map((f) => (
              <option key={f.id} value={f.id}>
                {f.name}
              </option>
            ))}
          </select>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="w-carrera">Carrera</Label>
          <Input id="w-carrera" defaultValue="Ingeniería Civil" className="h-9 bg-white" />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="w-bio">Presentación</Label>
        <textarea
          id="w-bio"
          className={cn(fieldClass, "h-28 py-2")}
          placeholder="Contá cómo das clases, qué experiencia tenés y qué se lleva el alumno."
        />
        <p className="text-xs text-muted-foreground">Es lo primero que leen los alumnos en tu perfil.</p>
      </div>
    </div>
  );
}

function PriceInput({ label, pesos, range }: { label: string; pesos: number | null; range: "INDIVIDUAL" | "GROUP" }) {
  const ok = pesos === null || isPriceInRange(range, pesos * 100);
  const r = PRICE_RANGE_CENTS[range];
  return (
    <div className="space-y-1">
      <Label className="text-xs">{label}</Label>
      <Input
        defaultValue={pesos ?? ""}
        placeholder="No ofrezco"
        inputMode="numeric"
        aria-invalid={!ok}
        className="h-9 bg-white"
      />
      <p className={cn("text-xs", ok ? "text-muted-foreground" : "text-destructive")}>
        {ok ? `Entre ${formatArs(r.min)} y ${formatArs(r.max)}` : `Tiene que estar entre ${formatArs(r.min)} y ${formatArs(r.max)}`}
      </p>
    </div>
  );
}

function StepSubjects() {
  return (
    <div className="space-y-4">
      {SAMPLE_OFFERS.map((o) => (
        <div key={o.subject} className="rounded-lg border border-border p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="font-semibold">{o.subject}</span>
            <button type="button" className="text-muted-foreground hover:text-destructive" aria-label={`Quitar ${o.subject}`}>
              <Trash2Icon className="size-4" />
            </button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <PriceInput label="Individual (por hora)" pesos={o.individual} range="INDIVIDUAL" />
            <PriceInput label="Grupal (por hora, por alumno)" pesos={o.group} range="GROUP" />
          </div>
        </div>
      ))}
      <button type="button" className="w-full rounded-lg border-2 border-dashed border-border py-3 text-sm font-medium text-muted-foreground hover:bg-muted">
        + Agregar materia
      </button>
      <DesignNote>
        el error en rojo usa <code>isPriceInRange</code> de <code>@estudioya/shared</code>; los límites salen de{" "}
        <code>PRICE_RANGE_CENTS</code> (provisorios, D-01). El grupal debe ser menor que el individual (BR-04).
      </DesignNote>
    </div>
  );
}

function StepDocuments({ type }: { type: TeacherType }) {
  const uploaded: DocumentKind[] = type === "ADVANCED_STUDENT" ? ["STUDENT_CERTIFICATE"] : [];
  const required: DocumentKind[] = type === "ADVANCED_STUDENT" ? ["STUDENT_CERTIFICATE", "APPROVED_SUBJECTS_CERTIFICATE"] : ["DEGREE"];
  const missing = missingDocuments(type, uploaded);

  return (
    <div className="space-y-3">
      <p className="text-sm text-muted-foreground">
        Formatos: {ALLOWED_DOCUMENT_FORMATS_LABEL}, hasta 5 MB. Solo el equipo de EstudioYA puede verlos.
      </p>
      {required.map((kind) => {
        const done = !missing.includes(kind);
        return (
          <div key={kind} className="flex items-center gap-3 rounded-lg border border-border p-3">
            <FileTextIcon className={cn("size-6", done ? "text-green-700" : "text-muted-foreground")} aria-hidden="true" />
            <div className="flex-1">
              <p className="text-sm font-medium">{DOCUMENT_LABELS[kind]}</p>
              <p className="text-xs text-muted-foreground">{done ? "certificado-regular.pdf · 340 KB" : "Obligatorio · falta subir"}</p>
            </div>
            {done ? (
              <button type="button" className="text-sm text-muted-foreground hover:text-destructive">
                Reemplazar
              </button>
            ) : (
              <button type="button" className="inline-flex items-center gap-1 rounded-lg bg-brand-navy px-3 py-1.5 text-sm font-semibold text-white">
                <UploadIcon className="size-4" aria-hidden="true" /> Subir
              </button>
            )}
          </div>
        );
      })}
      <DesignNote>
        la lista sale de <code>missingDocuments()</code>: cambiá el tipo en el paso 1 para ver la variante de graduado.
      </DesignNote>
    </div>
  );
}

function StepReview() {
  return (
    <div className="space-y-4 text-sm">
      <ul className="space-y-2">
        <li className="flex items-center gap-2">
          <CheckCircle2Icon className="size-4 text-green-700" aria-hidden="true" /> Datos personales y presentación
        </li>
        <li className="flex items-center gap-2">
          <CheckCircle2Icon className="size-4 text-green-700" aria-hidden="true" /> 2 materias con precio
        </li>
        <li className="flex items-center gap-2 text-destructive">
          <XCircleIcon className="size-4" aria-hidden="true" /> Falta: Certificado de materias aprobadas
        </li>
      </ul>
      <p className="text-muted-foreground">Una persona del equipo revisa tu solicitud a mano. Te avisamos por email.</p>
    </div>
  );
}

const STATUS_VIEWS = {
  PENDING: {
    icon: HourglassIcon,
    tone: "bg-yellow-100 text-yellow-900",
    title: "Tu solicitud está en revisión",
    text: "La enviaste el 23 de noviembre. Mientras tanto no podés editarla.",
  },
  REJECTED: {
    icon: XCircleIcon,
    tone: "bg-red-100 text-red-900",
    title: "Tu solicitud fue rechazada",
    text: "Motivo: «El certificado de materias aprobadas no es legible». Podés corregirla y volver a enviarla.",
  },
  APPROVED: {
    icon: CheckCircle2Icon,
    tone: "bg-green-100 text-green-900",
    title: "¡Ya sos profesor en EstudioYA!",
    text: "Próximo paso: armá tu agenda para empezar a recibir reservas.",
  },
} as const;

export default function TeacherWizardMockup() {
  const [step, setStep] = useState(0);
  const [type, setType] = useState<TeacherType>("ADVANCED_STUDENT");
  const [status, setStatus] = useState<keyof typeof STATUS_VIEWS>("PENDING");
  const s = STATUS_VIEWS[status];

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_320px]">
      <Card>
        <Stepper current={step} onSelect={setStep} />
        <h2 className="mb-4 text-lg font-semibold text-brand-navy">
          Paso {step + 1}: {STEPS[step]}
        </h2>
        {step === 0 && <StepData type={type} setType={setType} />}
        {step === 1 && <StepSubjects />}
        {step === 2 && <StepDocuments type={type} />}
        {step === 3 && <StepReview />}

        <div className="mt-6 flex justify-between gap-2 border-t border-border pt-4">
          <button
            type="button"
            onClick={() => setStep((v) => Math.max(0, v - 1))}
            disabled={step === 0}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium disabled:opacity-40"
          >
            Atrás
          </button>
          <div className="flex gap-2">
            <button type="button" className="hidden rounded-lg px-4 py-2 text-sm text-muted-foreground hover:bg-muted sm:block">
              Guardar borrador
            </button>
            <button
              type="button"
              onClick={() => setStep((v) => Math.min(STEPS.length - 1, v + 1))}
              className="rounded-lg bg-brand-orange-strong px-4 py-2 text-sm font-semibold text-white hover:opacity-90"
            >
              {step === STEPS.length - 1 ? "Enviar a revisión" : "Siguiente"}
            </button>
          </div>
        </div>
      </Card>

      <aside className="space-y-3">
        <h2 className="text-sm font-semibold text-muted-foreground">Pantalla de estado (después de enviar)</h2>
        <div className="flex gap-1 rounded-lg bg-muted p-1 text-xs">
          {(Object.keys(STATUS_VIEWS) as (keyof typeof STATUS_VIEWS)[]).map((k) => (
            <button
              key={k}
              type="button"
              onClick={() => setStatus(k)}
              aria-pressed={status === k}
              className={cn("flex-1 rounded-md px-2 py-1", status === k && "bg-white font-semibold shadow-sm")}
            >
              {{ PENDING: "En revisión", REJECTED: "Rechazada", APPROVED: "Aprobada" }[k]}
            </button>
          ))}
        </div>
        <div className={cn("rounded-xl p-5", s.tone)}>
          <s.icon className="mb-2 size-8" aria-hidden="true" />
          <p className="font-semibold">{s.title}</p>
          <p className="mt-1 text-sm">{s.text}</p>
        </div>
        <DesignNote>el borrador se guarda con <code>PUT /teacher-applications/me</code> al pasar de paso.</DesignNote>
      </aside>
    </div>
  );
}
