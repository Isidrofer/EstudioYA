# Mockups de las pantallas principales (FE-14)

> Propuesta de diseño para **acordar en equipo** antes de programar cada pantalla.
> Última actualización: 2026-11-24 · Relacionado: [BACKLOG](BACKLOG.md) · [ARCHITECTURE §6 "Cliente web"](ARCHITECTURE.md#cliente-web).

## Cómo verlos

Los mockups están hechos **en código** (no en Figma), dentro de la propia web, para que usen la paleta, la tipografía y los componentes reales:

```bash
npm run dev:web     # y abrir http://localhost:3000/mockups
```

- No necesitan la API ni la base: usan datos de ejemplo de `apps/web/src/app/mockups/_data.ts`, con la **misma forma que los DTOs** de `@estudioya/shared` (`TeacherCardDto`, `TeacherProfileDto`, etc.).
- Los botones no hacen nada. Solo son interactivos el asistente "Quiero ser profesor" (pasos y pantalla de estado) y la grilla de la agenda.
- Una franja amarilla arriba indica que es un mockup. Las rutas tienen `noindex` y no hay links a ellas desde el sitio.
- Las **notas punteadas naranjas** dentro de cada pantalla marcan decisiones de diseño o preguntas abiertas.

## Pantallas

| Ruta | Pantalla | Implementa | Quién la usa | Puntos a acordar |
|---|---|---|---|---|
| `/mockups/buscar` | Buscar profesores: buscador por materia, filtros (facultad, materia, tipo de clase, precio, puntaje), orden, tarjetas y paginación | FE-04, FE-05 | Alumno (público) | ¿El "desde $X/h" de la tarjeta muestra el precio más bajo (suele ser el grupal) o el individual de la materia filtrada? |
| `/mockups/profesor` | Perfil público: datos, verificación, estadísticas (horas, puntaje, cancelaciones), bio, tabla de materias y precios, reseñas y horarios disponibles agrupados por día | FE-06 | Alumno (público) | ¿Mostramos la tasa de cancelación al público? |
| `/mockups/reservar` | Confirmar y pagar: resumen, contador de cupo retenido, total (BR-02), política de cancelación y botón a Mercado Pago | FE-10 | Alumno | Depende de BR-06 y BR-13 (por confirmar, D-02) |
| `/mockups/mis-reservas` | Mis reservas: próximas y pasadas, estados, pagar, entrar a la clase, cancelar y reseña post-clase | FE-10, FE-12 | Alumno (y profesor con `role=teacher`) | Confirmación de cancelación con aviso de reembolso |
| `/mockups/quiero-ser-profesor` | Asistente en 4 pasos (datos, materias y precios validados con `isPriceInRange`, documentación con `missingDocuments`, revisión) y pantalla de estado (en revisión / rechazada / aprobada) | FE-07 | Alumno → profesor | ¿Se guarda el borrador al cambiar de paso o con un botón? |
| `/mockups/agenda` | Grilla semanal de disponibilidad + opciones (materias, tipo de clase, cupos, link de videollamada) | FE-09 | Profesor | **⛔ D-07** (grilla semanal vs. carga manual) y D-03 (videollamada). Falta definir cómo bloquear días puntuales |
| `/mockups/chat` | Conversaciones, mensajes, mensaje bloqueado por datos de contacto y botón de reportar | FE-11 | Alumno y profesor | Depende de BR-14 (por confirmar) |
| `/mockups/admin` | Solicitudes de profesor: pestañas por estado, tabla, detalle con documentos, aprobar y rechazar con motivo | FE-08 | Admin | Más adelante suma soporte, FAQ y mensajes reportados |

## Criterios de diseño comunes

- **Colores:** azul marino (`brand-navy`) para estructura y textos; naranja (`brand-orange-strong`) **solo para la acción principal** de cada pantalla. Verde = aprobado/confirmado, amarillo = pendiente, rojo = rechazado/cancelado/bloqueado.
- **Precios:** siempre por hora con `formatArs()` (sin decimales). El precio grupal dice "por alumno". Al alumno no se le muestra la comisión.
- **Fechas:** la API manda UTC; se muestran en hora de Argentina y en formato 24 h ("Jue 26 nov, 18:00").
- **Celular primero:** una columna, filtros en panel desplegable, columna de reserva debajo del perfil, chat en dos pantallas (lista → conversación).
- **Sin reseñas:** el profesor muestra la etiqueta "Nuevo" en vez de 0 estrellas.
- **Sin foto:** avatar con iniciales hasta que exista la foto de perfil (BE-13).
- **Accesibilidad:** etiquetas en todos los campos, estados con texto (no solo color), estrellas y pestañas con roles ARIA.

## Cómo se usan al implementar

1. Al tomar FE-05, FE-06, etc., partir del mockup correspondiente y reemplazar las constantes de `_data.ts` por la llamada a la API con TanStack Query.
2. Los componentes que se reutilicen (`TeacherCard`, `Avatar`, `Rating`, `Badge`, formateo de fechas) se mueven de `app/mockups/_components/` a `components/`.
3. Si al programar cambia el diseño acordado, actualizar el mockup o esta tabla en el mismo PR.
4. Cuando todas las pantallas reales existan (FE-15), se borra la carpeta `app/mockups/`.
