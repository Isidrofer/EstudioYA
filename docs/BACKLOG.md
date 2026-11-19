# Backlog de EstudioYA

> Lista de trabajo para el equipo. Cualquiera puede tomar tareas **sin esperar** a que otra persona esté conectada.
> Última actualización: 2026-11-19 · Antes de empezar leer: [README](../README.md) → [ARCHITECTURE](ARCHITECTURE.md) → [DATABASE](DATABASE.md).

## 1. Estado actual

**Ya está hecho y probado (en `main`):**
- Monorepo, Docker (PostgreSQL, RabbitMQ, Mailpit), CI, base de datos con restricciones.
- Auth: registro, login, logout, refresh, `GET /auth/me`, guards de sesión y roles.
- Catálogo: facultades y materias (con datos de ejemplo).
- Alta de profesores: solicitud con materias y precios, subida de certificados y revisión del admin (aprobar/rechazar).
- Soporte (BE-11): FAQ pública, formulario de contacto y su gestión desde el admin.

**Todavía no existe:** nada de frontend más allá de una página vacía, agenda y reservas, búsqueda de profesores, pagos, chat y reseñas.

## 2. Cómo trabajar con este backlog

1. **Tomá una tarea** y anotá tu nombre en ella (editá este archivo en tu rama, o avisá en el grupo). Una persona por tarea.
2. **Rama:** `feat/<ID>-nombre-corto` (ej: `feat/FE-03-login-registro`). Partí siempre de `main` actualizada.
3. **Pull Request** a `main` con descripción (qué incluye, cómo probarlo, qué queda pendiente). Necesita 1 aprobación y el CI en verde.
4. **Definición de "hecho"** (todas deben cumplirse):
   - [ ] Funciona y fue probado a mano (backend: con un archivo `.http` en `apps/api/requests/`).
   - [ ] Si cambia comportamiento: README (roadmap + changelog) y `docs/ARCHITECTURE.md` actualizados **en el mismo PR**.
   - [ ] Si cambia el modelo de datos: migración nueva (nunca editar una ya mergeada) + `docs/DATABASE.md`.
   - [ ] Sin secretos en el repo; variables nuevas agregadas a `.env.example`.
   - [ ] Marcar la tarea como hecha en este archivo.
5. **Si te trabás** más de una hora, dejá un comentario en el PR (o en el grupo) con el mensaje de error completo. No te quedes bloqueado.
6. **Si una tarea depende de una decisión pendiente** (marcada ⛔), no la inventes: avisá y pasá a otra.

**Leyenda:** Prioridad **P0** = hacer ya · **P1** = siguiente · **P2** = más adelante. Tamaño **S** ≤ medio día · **M** 1–2 días · **L** 3–5 días. Estado: `[ ]` por hacer · `[~]` en curso · `[x]` hecho.

## 3. Cosas que hay que saber (evitan los errores más comunes)

- **Frontend → API:** URL base `NEXT_PUBLIC_API_URL` (`http://localhost:4000/api/v1`). Todos los `fetch` deben llevar `credentials: 'include'` (la sesión va en cookies `httpOnly`) y, en las rutas que modifican datos (`POST/PUT/PATCH/DELETE`), el header `X-Requested-With: estudioya`. Sin eso la API responde `403`.
- **Errores:** la API siempre responde `application/problem+json` con `code` y, en validaciones, `errors: [{ field, message }]`. Decidir la lógica por `code`, nunca por el texto. Tipos en `packages/shared`.
- **Contratos compartidos:** los schemas Zod y tipos (`registerSchema`, `teacherApplicationSchema`, `isPriceInRange`, `AuthUser`, etc.) están en `packages/shared`. **Usarlos en el frontend** para validar formularios; no duplicarlos.
- **Dinero:** siempre enteros en **centavos de ARS** (`1200000` = $12.000). Formatear con `formatArs()` de `packages/shared`.
- **Fechas:** UTC en la API y la base; mostrar en `America/Argentina/Buenos_Aires`.
- **Sesión:** el access token dura 15 min. Si una llamada responde `401`, el cliente debe llamar una vez a `POST /auth/refresh` y reintentar; si vuelve a fallar, ir a login.
- **Probar la API:** extensión *REST Client* de VS Code con los archivos de `apps/api/requests/`.
- **Rango de precios:** hoy es provisorio y está hardcodeado en `packages/shared/src/teacher-rules.ts`.
- **Windows:** el proyecto va fuera de OneDrive; PostgreSQL usa el puerto **5433** en tu máquina. Ver "Solución de problemas" en el README.

## 4. Decisiones pendientes del equipo (bloquean tareas)

| ID | Decisión | Propuesta actual | Bloquea |
|---|---|---|---|
| D-01 | Rango de precios por hora definitivo | Provisorio hardcodeado (ver BR-03) | PM-01, BE-12 |
| D-02 | Reglas "por confirmar" de `ARCHITECTURE.md` §5: cancelación (BR-13), vencimiento de reserva 10 min (BR-06), liberación del pago a las 24 h (BR-12), chat (BR-14), BR-09 | Las del documento | BE-04, BE-08, BE-10 |
| D-03 | Videollamada | Link externo que pega el profesor | BE-01 |
| D-07 | **Agenda del profesor:** grilla semanal que genera horarios de las próximas 4 semanas (propuesta) vs. cargar cada horario a mano | Grilla semanal | BE-01, BE-02, FE-09 |
| D-05 / D-06 | Fiscal (contador) y legal (abogado): términos, privacidad, botón de arrepentimiento | Consultar a profesionales | Lanzamiento |

---

## 5. Listo para tomar ahora (P0)

Estas tareas **no dependen de nadie más**. Sugerencia de reparto para empezar: una persona en frontend (FE-01 a FE-03), otra en backend (BE-03 y BE-07) y otra en infraestructura y calidad (OPS-01, BE-15).

### ✅ FE-01 · Base visual del frontend · P0 · M
- [x] Configurar Tailwind CSS y una librería de componentes (propuesta: shadcn/ui), tipografía y paleta de colores.
- [x] Layout general (header con logo, navegación, footer) usando los logos de `apps/web/public/logos/`.
- [x] Página de inicio con el banner de `apps/web/public/banners/`.
- **Criterio:** se ve bien en celular y escritorio; el idioma de la página es `es-AR`.

### FE-02 · Cliente de la API y manejo de sesión · P0 · M
- [ ] Módulo `api` con `fetch` que agrega `credentials: 'include'` y `X-Requested-With`, interpreta `problem+json` y reintenta una vez tras `POST /auth/refresh` ante un `401`.
- [ ] Configurar TanStack Query y un contexto/hook `useSession()` basado en `GET /auth/me`.
- **Criterio:** una pantalla de prueba muestra el usuario logueado y se recupera sola cuando vence el access token.
- **Depende de:** nada (la API ya existe).

### FE-03 · Registro, login y logout · P0 · M
- [ ] Formularios con validación usando `registerSchema` y `loginSchema` de `@estudioya/shared`.
- [ ] Casillas obligatorias: "soy mayor de 18 años" y "acepto los términos".
- [ ] Mostrar los errores de campo que devuelve la API (`errors[]`), incluido el `409` por email repetido.
- [ ] Botón de cerrar sesión; rutas que exigen sesión redirigen a login.
- **Depende de:** FE-02.

### BE-03 · Perfil público y búsqueda de profesores · P0 · L
- [ ] `GET /teachers` con filtros `facultyId`, `subjectId`, `minPrice`, `maxPrice`, `classType`, orden `recommended | price_asc | price_desc | rating_desc`, y paginación (ver `ARCHITECTURE.md` §6 y §7).
- [ ] `GET /teachers/:teacherId` con bio, materias, precios y estadísticas.
- [ ] Solo aparecen profesores `APPROVED` (BR-11).
- [ ] Orden "recomendado" usando `rankingScore` (hoy vale 0 para todos: dejar el orden por fecha de aprobación como desempate).
- **Criterio:** archivo `.http` con ejemplos; `ARCHITECTURE.md` actualizado.

### BE-07 · Spike: pagos con Mercado Pago · P0 · M
Es una **investigación** de 1–2 días que desbloquea todo lo de pagos. Resultado: un documento corto en `docs/adr/0002-pagos-mercado-pago.md`.
- [ ] Crear cuenta de desarrollador y credenciales de prueba.
- [ ] Confirmar si el modelo *Marketplace/split* permite **retener el dinero hasta que se dicte la clase** (riesgo R-01).
- [ ] Probar un pago de prueba con comisión del 35 % (`marketplace_fee`), el flujo OAuth de vendedores y la firma de los webhooks.
- [ ] Si no se puede retener: proponer alternativa y sus implicancias legales/fiscales.
- **Criterio:** ADR con la conclusión y un ejemplo de código que funcione contra el entorno de pruebas.

### OPS-01 · CI más completo · P0 · S
- [ ] Agregar ESLint + Prettier y un paso de lint en `.github/workflows/ci.yml`.
- [ ] Agregar un servicio PostgreSQL al workflow (hará falta para los tests de la API).
- [ ] Plantilla de Pull Request (`.github/pull_request_template.md`) con la definición de "hecho".

### BE-15 · Tests automáticos · P0 · M
- [ ] Elegir e instalar el framework (propuesta: Vitest o Jest) para `apps/api` y `packages/shared`.
- [ ] Tests de: `splitAmount` (comisión 35 %), `isPriceInRange`, `missingDocuments`, `detectFileType`, y del flujo de auth (registro, login, refresh con reuso de token).
- [ ] Ejecutarlos en el CI.
- **Depende de:** OPS-01 (para tener PostgreSQL en el CI).

---

## 6. Frontend

| ID | Tarea | Prioridad | Tamaño | Depende de |
|---|---|---|---|---|
| FE-04 | Explorar catálogo: lista de facultades → materias, con buscador (`/faculties`, `/subjects`) | P0 | S | FE-01, FE-02 |
| FE-05 | Búsqueda de profesores con filtros (facultad, materia, precio, tipo de clase) y tarjetas de profesor | P1 | L | BE-03, FE-04 |
| FE-06 | Perfil público de un profesor (materias, precios, reseñas, horarios disponibles) | P1 | M | BE-03 |
| FE-07 | **Asistente "Quiero ser profesor"**: datos, materias con precios (validar con `isPriceInRange`), subida de certificados con los documentos que faltan (`missingDocuments`), envío y pantalla de estado (borrador / en revisión / rechazada con motivo / aprobada) | P0 | L | FE-03 |
| FE-08 | **Panel de administración:** solicitudes pendientes, detalle, descarga de documentos, aprobar y rechazar con motivo (solo `ADMIN`) | P1 | M | FE-03 |
| FE-09 | Pantalla del profesor para armar su agenda (días, horarios, materias) | P1 | L | ⛔ D-07, BE-01 |
| FE-10 | Reserva de clase: elegir horario disponible, confirmar, pagar y ver "Mis reservas" | P1 | L | BE-04, BE-08 |
| FE-11 | Chat privado en tiempo real | P2 | L | BE-10 |
| FE-12 | Reseñas: formulario post-clase y listado en el perfil | P2 | M | BE-09 |
| FE-13 | Páginas de FAQ, contacto y términos/privacidad | P1 | M | BE-11 |
| FE-14 | Mockups de las pantallas principales (Figma o a mano) para acordar el diseño | P0 | M | — |
| FE-15 | Accesibilidad y responsive: revisión final, estados de carga y error | P2 | M | resto |

## 7. Backend

| ID | Tarea | Prioridad | Tamaño | Depende de |
|---|---|---|---|---|
| BE-01 | **Agenda semanal del profesor:** nueva tabla de disponibilidad por día/hora/materia/tipo de clase + endpoints para crear, editar y borrar. Requiere migración | P1 | L | ⛔ D-07, D-03 |
| BE-02 | **Generación de horarios reservables:** a partir de la agenda semanal, crear los `availability_slots` de las próximas 4 semanas (al guardar y con un job diario). Respeta las restricciones contra solapamientos | P1 | M | BE-01 |
| BE-04 | **Reservas:** crear reserva con retención de cupo de 10 min (transacción con bloqueo del slot, ver `DATABASE.md`), listar, ver detalle, cancelar según BR-13; job que vence reservas impagas | P1 | L | BE-02, ⛔ D-02 |
| BE-05 | **Mensajería:** módulo RabbitMQ (exchange, colas, reintentos y dead-letter) y publicador del patrón *outbox* (ya se escriben eventos `teacher.approved` y `teacher.rejected` que nadie publica todavía) | P1 | L | — |
| BE-06 | **Emails** (Mailpit en desarrollo): aprobación/rechazo de profesor, confirmación y recordatorio de clase | P1 | M | BE-05 |
| BE-08 | **Pagos:** vincular cuenta del profesor (OAuth), checkout con comisión del 35 %, webhooks idempotentes, reembolsos, liberación de pagos | P1 | L | BE-07, BE-04 |
| BE-09 | **Reseñas y ranking:** `POST /bookings/:id/review` (solo clases completadas), recálculo de puntaje, horas y tasa de cancelación según BR-10 | P2 | M | BE-04, BE-05 |
| BE-10 | **Chat:** conversaciones, mensajes, WebSocket, filtro de insultos y datos de contacto, reportes de mensajes | P2 | L | BE-04, ⛔ D-02 |
| BE-11 | ✅ **Soporte:** `GET /faq`, `POST /support/tickets`, gestión en admin (`/admin/faq`, `/admin/support/tickets`) | P1 | M | — |
| BE-12 | **Administración:** pasar el rango de precios a `platform_settings` (editable), suspender/reactivar profesores, cola de mensajes reportados | P2 | M | ⛔ D-01 |
| BE-13 | **Gestión del perfil del profesor:** `PATCH /teachers/me`, editar materias y precios después de aprobado, foto de perfil | P1 | M | — |
| BE-14 | **Auth completa:** verificación de email, recuperar contraseña, login con Google | P1 | L | BE-06 |
| BE-16 | **Deuda técnica:** limpieza periódica de refresh tokens vencidos; implementación S3/R2 del `StorageService`; unificar la respuesta del registro con email repetido (hoy permite saber si un email existe) | P2 | M | — |

## 8. Infraestructura, calidad y producto

| ID | Tarea | Prioridad | Tamaño | Depende de |
|---|---|---|---|---|
| OPS-02 | Entorno de *staging* desplegado (propuesta: Render, Railway o Fly), variables de entorno y backups de la base | P1 | L | — |
| OPS-03 | Observabilidad: logs estructurados (pino) y Sentry | P1 | S | — |
| OPS-04 | Decidir dónde corre RabbitMQ en producción (hoy es local con Docker) | P1 | S | — |
| OPS-05 | Dependabot o revisión periódica de dependencias; `npm audit` en el CI | P2 | S | OPS-01 |
| OPS-06 | Tests end-to-end del flujo principal con Playwright (registro → reserva → pago) | P2 | L | FE-10 |
| PM-01 | Definir el rango de precios definitivo (D-01) | P0 | S | — |
| PM-02 | Resolver las reglas "por confirmar" (D-02) | P0 | S | — |
| PM-03 | Consultar contador (ARCA, monotributo, facturación de la comisión) y abogado (términos, privacidad, botón de arrepentimiento) | P1 | M | — |
| PM-04 | Cargar el catálogo **real** de facultades y materias de la universidad (reemplaza los datos de ejemplo del seed) | P1 | S | — |
| PM-05 | Captar profesores para una beta cerrada en 1–2 facultades | P1 | M | BE-03, FE-07 |
| PM-06 | Redactar el contenido de la FAQ y los textos legales | P1 | M | — |

---

## 9. Orden sugerido

1. **Primeras 2 semanas:** FE-01, FE-02, FE-03, FE-14 · BE-03, BE-07, BE-15 · OPS-01 · PM-01, PM-02.
2. **Siguientes:** FE-04, FE-07, FE-08 · BE-13, BE-11, BE-05 · D-07 resuelta → BE-01, BE-02.
3. **Después:** reservas (BE-04, FE-10) → pagos (BE-08) → reseñas y ranking (BE-09, FE-12) → chat (BE-10, FE-11).
4. **Antes de lanzar:** BE-14 (email y recuperar contraseña), OPS-02, PM-03, PM-04, beta cerrada (PM-05).

> Mantener este archivo al día: cada PR que completa una tarea la marca `[x]` y, si descubre trabajo nuevo, lo agrega acá.
