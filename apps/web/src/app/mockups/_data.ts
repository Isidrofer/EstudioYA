/**
 * DATOS DE EJEMPLO para los mockups (FE-14). No se usan en ninguna pantalla real.
 * Tienen la misma forma que los DTOs de `@estudioya/shared` para que, al implementar
 * FE-05/FE-06/etc., alcance con reemplazar estas constantes por la llamada a la API.
 * Dinero en centavos de ARS y fechas en UTC (ISO 8601), igual que la API.
 */
import type { TeacherCardDto, TeacherProfileDto, TeacherStatus } from "@estudioya/shared";

export const FACULTIES = [
  { id: "f1", name: "Facultad de Ingeniería" },
  { id: "f2", name: "Facultad de Ciencias Económicas" },
  { id: "f3", name: "Facultad de Ciencias Exactas" },
];

export const SUBJECTS = [
  { id: "s1", facultyId: "f1", name: "Análisis Matemático I" },
  { id: "s2", facultyId: "f1", name: "Física I" },
  { id: "s3", facultyId: "f1", name: "Álgebra y Geometría Analítica" },
  { id: "s4", facultyId: "f2", name: "Contabilidad Básica" },
  { id: "s5", facultyId: "f2", name: "Microeconomía" },
  { id: "s6", facultyId: "f3", name: "Química General" },
];

export const TEACHERS: TeacherCardDto[] = [
  {
    id: "t1",
    firstName: "Lucía",
    lastName: "Fernández",
    avatarUrl: null,
    type: "GRADUATE",
    bioSummary:
      "Ingeniera civil. Doy Análisis I y Física I hace 3 años, con ejercicios de parciales reales y mucha práctica.",
    faculty: { id: "f1", name: "Facultad de Ingeniería" },
    careerName: "Ingeniería Civil",
    ratingAvg: 4.9,
    ratingCount: 38,
    subjects: [
      { subjectId: "s1", subjectName: "Análisis Matemático I", facultyId: "f1", individualPriceCents: 1_500_000, groupPriceCents: 900_000 },
      { subjectId: "s2", subjectName: "Física I", facultyId: "f1", individualPriceCents: 1_600_000, groupPriceCents: null },
    ],
  },
  {
    id: "t2",
    firstName: "Martín",
    lastName: "Gómez",
    avatarUrl: null,
    type: "ADVANCED_STUDENT",
    bioSummary:
      "Estudiante de 5.º año de Sistemas. Explico Álgebra desde cero, sin saltear pasos. Ideal para recursantes.",
    faculty: { id: "f1", name: "Facultad de Ingeniería" },
    careerName: "Ingeniería en Sistemas",
    ratingAvg: 4.6,
    ratingCount: 12,
    subjects: [
      { subjectId: "s3", subjectName: "Álgebra y Geometría Analítica", facultyId: "f1", individualPriceCents: 1_000_000, groupPriceCents: 550_000 },
    ],
  },
  {
    id: "t3",
    firstName: "Sofía",
    lastName: "Ramírez",
    avatarUrl: null,
    type: "GRADUATE",
    bioSummary: "Contadora pública. Preparo finales de Contabilidad Básica con guías propias y simulacros.",
    faculty: { id: "f2", name: "Facultad de Ciencias Económicas" },
    careerName: "Contador Público",
    ratingAvg: 0,
    ratingCount: 0,
    subjects: [
      { subjectId: "s4", subjectName: "Contabilidad Básica", facultyId: "f2", individualPriceCents: 1_200_000, groupPriceCents: 700_000 },
      { subjectId: "s5", subjectName: "Microeconomía", facultyId: "f2", individualPriceCents: null, groupPriceCents: 600_000 },
    ],
  },
];

export const TEACHER_PROFILE: TeacherProfileDto = {
  ...TEACHERS[0]!,
  bio:
    "Soy ingeniera civil recibida en 2022. Desde tercer año doy clases particulares de Análisis Matemático I y Física I.\n\n" +
    "Trabajo con ejercicios de parciales y finales de los últimos años, y al final de cada clase te llevás un resumen de lo que vimos. " +
    "Si es tu primera clase, arrancamos con un diagnóstico rápido para ver dónde estás.",
  graduationYear: 2022,
  minutesTaught: 7_320,
  cancellationRate: 0.02,
};

/** Horarios disponibles del perfil (vendrán de los `availability_slots`, BE-02). */
export const SLOTS = [
  { id: "sl1", startsAt: "2026-11-26T21:00:00.000Z", durationMinutes: 60, classType: "INDIVIDUAL" as const, subjectId: "s1", seatsLeft: 1 },
  { id: "sl2", startsAt: "2026-11-26T22:30:00.000Z", durationMinutes: 90, classType: "GROUP" as const, subjectId: "s1", seatsLeft: 3 },
  { id: "sl3", startsAt: "2026-11-27T13:00:00.000Z", durationMinutes: 60, classType: "INDIVIDUAL" as const, subjectId: "s2", seatsLeft: 1 },
  { id: "sl4", startsAt: "2026-11-28T15:00:00.000Z", durationMinutes: 60, classType: "INDIVIDUAL" as const, subjectId: "s1", seatsLeft: 1 },
];

export const REVIEWS = [
  { id: "r1", author: "Juan P.", rating: 5, comment: "Me salvó el parcial de Análisis. Explica muy claro y tiene paciencia.", createdAt: "2026-11-10T18:00:00.000Z" },
  { id: "r2", author: "Camila R.", rating: 5, comment: "Muy buena la clase grupal, nos dio un resumen al final.", createdAt: "2026-11-03T20:00:00.000Z" },
  { id: "r3", author: "Tomás L.", rating: 4, comment: "Buena clase, aunque se nos hizo corta la hora.", createdAt: "2026-10-28T14:00:00.000Z" },
];

/** Estados de reserva previstos en `DATABASE.md` (la API todavía no existe, BE-04). */
export type BookingStatus = "PENDING_PAYMENT" | "CONFIRMED" | "COMPLETED" | "CANCELLED" | "EXPIRED";

export const BOOKINGS: {
  id: string;
  status: BookingStatus;
  teacherName: string;
  subjectName: string;
  classType: "INDIVIDUAL" | "GROUP";
  startsAt: string;
  durationMinutes: number;
  amountCents: number;
  reviewed?: boolean;
}[] = [
  { id: "b1", status: "PENDING_PAYMENT", teacherName: "Lucía Fernández", subjectName: "Análisis Matemático I", classType: "INDIVIDUAL", startsAt: "2026-11-28T15:00:00.000Z", durationMinutes: 60, amountCents: 1_500_000 },
  { id: "b2", status: "CONFIRMED", teacherName: "Martín Gómez", subjectName: "Álgebra y Geometría Analítica", classType: "GROUP", startsAt: "2026-11-26T22:30:00.000Z", durationMinutes: 90, amountCents: 825_000 },
  { id: "b3", status: "COMPLETED", teacherName: "Lucía Fernández", subjectName: "Física I", classType: "INDIVIDUAL", startsAt: "2026-11-18T21:00:00.000Z", durationMinutes: 60, amountCents: 1_600_000, reviewed: false },
  { id: "b4", status: "COMPLETED", teacherName: "Sofía Ramírez", subjectName: "Contabilidad Básica", classType: "INDIVIDUAL", startsAt: "2026-11-10T13:00:00.000Z", durationMinutes: 60, amountCents: 1_200_000, reviewed: true },
  { id: "b5", status: "CANCELLED", teacherName: "Martín Gómez", subjectName: "Álgebra y Geometría Analítica", classType: "INDIVIDUAL", startsAt: "2026-11-05T19:00:00.000Z", durationMinutes: 60, amountCents: 1_000_000 },
];

/** Solicitudes de profesor para el panel de admin (FE-08). */
export const APPLICATIONS: {
  id: string;
  applicant: string;
  email: string;
  type: "ADVANCED_STUDENT" | "GRADUATE";
  faculty: string;
  subjects: string[];
  status: TeacherStatus;
  submittedAt: string;
  documents: string[];
}[] = [
  { id: "a1", applicant: "Valentina Torres", email: "valentina@ejemplo.com", type: "ADVANCED_STUDENT", faculty: "Facultad de Ciencias Exactas", subjects: ["Química General"], status: "PENDING", submittedAt: "2026-11-23T16:20:00.000Z", documents: ["Certificado de alumno regular", "Certificado de materias aprobadas"] },
  { id: "a2", applicant: "Diego Herrera", email: "diego@ejemplo.com", type: "GRADUATE", faculty: "Facultad de Ingeniería", subjects: ["Física I", "Análisis Matemático I"], status: "PENDING", submittedAt: "2026-11-22T11:05:00.000Z", documents: ["Título"] },
  { id: "a3", applicant: "Agustina Molina", email: "agustina@ejemplo.com", type: "GRADUATE", faculty: "Facultad de Ciencias Económicas", subjects: ["Microeconomía"], status: "PENDING", submittedAt: "2026-11-20T09:40:00.000Z", documents: ["Título"] },
];

export const CONVERSATIONS = [
  { id: "c1", name: "Lucía Fernández", subject: "Análisis Matemático I", lastMessage: "Dale, traé los ejercicios del parcial 2025.", unread: 2, updatedAt: "2026-11-24T18:12:00.000Z" },
  { id: "c2", name: "Martín Gómez", subject: "Álgebra y Geometría Analítica", lastMessage: "Nos vemos el miércoles.", unread: 0, updatedAt: "2026-11-23T22:40:00.000Z" },
];

export const MESSAGES = [
  { id: "m1", fromMe: true, text: "Hola Lucía, reservé para el viernes. ¿Vemos límites y derivadas?", sentAt: "2026-11-24T17:58:00.000Z" },
  { id: "m2", fromMe: false, text: "¡Hola! Sí, perfecto. Arrancamos con límites y si llegamos vemos derivadas.", sentAt: "2026-11-24T18:05:00.000Z" },
  { id: "m3", fromMe: true, text: "Te paso mi número así coordinamos mejor: 11 5555-5555", sentAt: "2026-11-24T18:08:00.000Z", blocked: true },
  { id: "m4", fromMe: false, text: "Dale, traé los ejercicios del parcial 2025.", sentAt: "2026-11-24T18:12:00.000Z" },
];

export const subjectName = (id: string) => SUBJECTS.find((s) => s.id === id)?.name ?? "";
