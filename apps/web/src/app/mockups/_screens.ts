/** Listado de pantallas mockeadas (FE-14). Lo usan el índice y la navegación de `/mockups`. */
export const SCREENS = [
  {
    href: "/mockups/buscar",
    title: "Buscar profesores",
    description: "Filtros por facultad, materia, tipo de clase y precio; tarjetas de profesor y orden.",
    task: "FE-04 · FE-05",
    who: "Alumno (público)",
  },
  {
    href: "/mockups/profesor",
    title: "Perfil del profesor",
    description: "Bio, materias con precios, estadísticas, horarios disponibles y reseñas.",
    task: "FE-06",
    who: "Alumno (público)",
  },
  {
    href: "/mockups/reservar",
    title: "Confirmar y pagar",
    description: "Resumen de la reserva, cupo retenido 10 minutos y paso a Mercado Pago.",
    task: "FE-10",
    who: "Alumno",
  },
  {
    href: "/mockups/mis-reservas",
    title: "Mis reservas",
    description: "Próximas y pasadas, con estados, cancelación y reseña post-clase.",
    task: "FE-10 · FE-12",
    who: "Alumno",
  },
  {
    href: "/mockups/quiero-ser-profesor",
    title: "Quiero ser profesor",
    description: "Asistente en 4 pasos: datos, materias y precios, documentación y envío.",
    task: "FE-07",
    who: "Alumno → profesor",
  },
  {
    href: "/mockups/agenda",
    title: "Agenda del profesor",
    description: "Grilla semanal que genera los horarios de las próximas 4 semanas.",
    task: "FE-09 (⛔ D-07)",
    who: "Profesor",
  },
  {
    href: "/mockups/chat",
    title: "Chat",
    description: "Conversaciones con alumnos/profesores y mensajes bloqueados por moderación.",
    task: "FE-11",
    who: "Alumno y profesor",
  },
  {
    href: "/mockups/admin",
    title: "Panel de administración",
    description: "Solicitudes de profesor pendientes, documentos, aprobar y rechazar con motivo.",
    task: "FE-08",
    who: "Admin",
  },
] as const;
