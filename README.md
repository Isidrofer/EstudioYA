# EstudioYA

Plataforma de clases particulares **hecha por estudiantes, para estudiantes**. Un estudiante reserva una clase en el calendario de un profesor (estudiante avanzado o graduado), paga dentro de la app y después puntúa al profesor.

> **Estado del proyecto:** Fase 0 (fundaciones). Ver el [roadmap](#roadmap) y el [CHANGELOG](#changelog).
> Última actualización: 2026-11-26

## Características previstas

- Registro, login y logout (email y Google). Solo mayores de 18 años.
- Búsqueda de profesores por facultad y materia, con filtros de precio, modalidad y puntaje.
- Clases **individuales** (más caras) y **grupales** (precio por alumno más bajo, más ingreso total para el profesor).
- Cobro **por hora**; cada profesor fija su precio dentro del rango que define la plataforma.
- Pagos integrados con **Mercado Pago**. La plataforma retiene el **35 %** de cada cobro.
- Chat privado alumno ↔ profesor con moderación de lenguaje y bloqueo de datos de contacto.
- Puntuación de profesores por parte de los alumnos y ranking de recomendados (puntaje + horas dictadas).
- FAQ, formulario de contacto/soporte y alta de profesores con verificación.

## Stack

| Capa | Tecnología |
|---|---|
| Backend | Node.js 22 · TypeScript · NestJS |
| Frontend | Next.js (React) · TypeScript · Tailwind CSS · shadcn/ui · TanStack Query |
| Base de datos | PostgreSQL 16 · Prisma |
| Mensajería | RabbitMQ (local, Docker) |
| Pagos | Mercado Pago (Marketplace / split) |
| Email (dev) | Mailpit |

Detalle completo, puertos, endpoints y reglas de contrato: **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)**.
Modelo de datos: **[docs/DATABASE.md](docs/DATABASE.md)**.

## Estructura del repositorio

```
estudioya/
├── apps/
│   ├── api/                 # Backend NestJS (monolito modular) + esquema Prisma
│   │   ├── prisma/          #   schema.prisma, migrations/, seed.ts y sql/001_constraints.sql
│   │   ├── requests/        #   Pruebas manuales (.http) para la extensión REST Client
│   │   └── src/
│   │       ├── common/      #     Errores RFC 7807, validación Zod, CSRF, utilidades
│   │       ├── prisma/      #     Conexión a la base
│   │       └── modules/     #     auth, catalog, teachers, admin, support (y los que vengan)
│   └── web/                 # Frontend Next.js
│       ├── src/
│       │   ├── app/         #   Páginas, layout y estilos globales (globals.css)
│       │   ├── components/  #   layout/ (header, footer), ui/ (componentes de shadcn, no editar a mano) y providers.tsx
│       │   ├── hooks/       #   Hooks propios, ej. useSession()
│       │   └── lib/         #   Utilidades y cliente de la API (api.ts)
│       └── public/          #   Recursos estáticos: logos/, banners/, favicon (se sirven desde "/")
├── packages/
│   └── shared/              # Constantes, errores y schemas Zod compartidos (API ↔ web)
├── docs/
│   ├── ARCHITECTURE.md      # Arquitectura, puertos, endpoints, contratos
│   ├── DATABASE.md          # Modelo de datos y restricciones
│   ├── MOCKUPS.md           # Mockups de las pantallas principales (FE-14)
│   └── adr/                 # Decisiones de arquitectura (una por archivo)
├── .github/workflows/       # CI
├── docker-compose.yml       # PostgreSQL, RabbitMQ, Mailpit
└── .env.example
```

## Cómo levantar el entorno local

Requisitos: Node.js 22, Git, Docker Desktop (abierto y corriendo) y VS Code.

> **Windows:** clonar/guardar el proyecto **fuera de OneDrive** (por ejemplo `C:\dev\estudioya`). OneDrive sincroniza `node_modules` y bloquea archivos mientras corren Prisma y Next.js.

```bash
cp .env.example .env          # en Windows: copy .env.example .env. Completar valores (docs/ARCHITECTURE.md §10)
npm install
npm run infra:up              # PostgreSQL, RabbitMQ y Mailpit
npm run db:generate           # genera el cliente Prisma
npm run db:migrate -- --create-only --name init
#   → pegar apps/api/prisma/sql/001_constraints.sql al final de la migración creada
npm run db:migrate            # aplica la migración
npm run db:seed               # carga facultades y materias de ejemplo (se puede repetir sin duplicar)
npm run dev:api               # API en http://localhost:4000/api/v1/health
npm run dev:web               # Web en http://localhost:3000
```

| Servicio | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:4000/api/v1 |
| PostgreSQL | 127.0.0.1:5433 |
| RabbitMQ (panel) | http://localhost:15672 |
| Mailpit (emails de prueba) | http://localhost:8025 |

## Solución de problemas

| Síntoma | Causa y solución |
|---|---|
| `P1001: Can't reach database server` | Docker Desktop no está abierto, o el contenedor no está arriba. Ejecutar `npm run infra:up` y verificar con `docker ps` que `estudioya-postgres` esté `healthy`. En Windows, usar `127.0.0.1` y el puerto **5433** en `DATABASE_URL` (ver [ARCHITECTURE §3](docs/ARCHITECTURE.md#3-puertos-y-servicios)). |
| `npm error code 130` al migrar | El comando fue interrumpido (Prisma estaba esperando una respuesta). Ver el mensaje anterior al error: suele ser una pregunta de confirmación. |
| `The migration ... was modified after it was applied` | Solo en desarrollo: `cd apps/api` y `npx dotenv -e ../../.env -- prisma migrate reset` (borra los datos locales). |
| Prisma sigue usando `localhost:5432` | No lee el `.env`. Verificar que se llame exactamente `.env` (no `.env.txt`) y esté junto al `package.json` raíz. |

## Scripts útiles

| Comando | Qué hace |
|---|---|
| `npm run infra:up` / `infra:down` | Levanta / baja la infraestructura Docker |
| `npm run build` | Compila shared, api y web |
| `npm run typecheck` | Verifica tipos en todo el monorepo |
| `npm run lint` | Corre ESLint en todo el monorepo |
| `npm run format` | Formatea el código con Prettier |
| `npm run format:check` | Verifica el formato sin modificar archivos |
| `npm run db:validate` | Valida `schema.prisma` |
| `npm run db:migrate` | Crea/aplica migraciones de Prisma |
| `npm run db:seed` | Carga datos de prueba (facultades y materias de ejemplo) |

## Primer administrador

Para revisar solicitudes de profesores hace falta un usuario `ADMIN`. En desarrollo, definí en tu `.env` `SEED_ADMIN_EMAIL` y `SEED_ADMIN_PASSWORD` (mínimo 10 caracteres) y ejecutá `npm run db:seed`. Si el usuario ya existe, solo se le asigna el rol y **no** se cambia su contraseña. En producción el admin se crea a mano.

## Probar la API a mano

Instalar en VS Code la extensión **REST Client** (`humao.rest-client`), abrir los archivos de [`apps/api/requests/`](apps/api/requests/) (`auth-y-catalogo.http`, `profesores-y-admin.http` y `faq-y-soporte.http`) con la API corriendo y hacer clic en *Send Request* sobre cada bloque. Toda ruta que modifica datos necesita el header `X-Requested-With: estudioya` (ya incluido en los ejemplos).

## Roadmap

- [x] **Fase 0 · Fundaciones**: decisiones de producto y stack, estructura del monorepo, esquema de base, Docker, documentación inicial
- [x] **Fase 0 · Entorno local**: dependencias instaladas, infraestructura Docker levantada, primera migración (`init`) aplicada con sus restricciones
- [ ] **Fase 0 · Pendiente**: repositorio en GitHub con `main` protegida, CI en verde, definir rango de precios y reglas "por confirmar", revisar los mockups (hechos en `/mockups`, ver [docs/MOCKUPS.md](docs/MOCKUPS.md))
- [ ] **Fase 1 · MVP**
  - [x] Backend: conexión a la base, datos de prueba, registro/login/logout/refresh/me, catálogo de facultades y materias
  - [x] Backend: solicitud de alta de profesor (datos, materias con precios, certificados) y revisión manual del admin
  - [x] Backend: FAQ pública y formulario de contacto (tickets de soporte), con su gestión desde el admin
  - [ ] Backend: disponibilidad semanal del profesor y generación de horarios reservables
  - [x] Backend: perfil público y búsqueda de profesores con filtros
  - [ ] Backend: reserva individual
  - [x] Frontend: base visual (Tailwind CSS, shadcn/ui), layout con header y footer, página de inicio
  - [x] Frontend: cliente de la API con renovación automática de sesión, TanStack Query y `useSession()`
  - [x] Frontend: registro, login, logout y protección de rutas privadas
  - [x] Frontend: mockups navegables de las pantallas principales (`/mockups`)
  - [x] Frontend: catálogo de facultades y materias con buscador (`/explorar`) — FE-04
  - [ ] Frontend: búsqueda de profesores
- [ ] **Fase 2**: pagos con comisión (Mercado Pago), clases grupales, reseñas y ranking
- [ ] **Fase 3**: chat con moderación, FAQ, soporte, alta de profesores con verificación, panel admin
- [ ] **Fase 4**: pruebas de carga y seguridad, beta cerrada con una facultad

## Decisiones tomadas

- País de lanzamiento: **Argentina** (ARS, Mercado Pago). Solo **mayores de edad**.
- Arquitectura: **monolito modular**, no microservicios ([ADR 0001](docs/adr/0001-arquitectura-y-stack.md)).
- Comisión de la plataforma: **35 %**, descontada del precio publicado (el profesor recibe el 65 %).
- Decisiones aún abiertas: ver [docs/ARCHITECTURE.md §12](docs/ARCHITECTURE.md#12-decisiones-y-riesgos-abiertos).

## Cómo trabajamos

Ver [CONTRIBUTING.md](CONTRIBUTING.md). El trabajo pendiente, con prioridades y dependencias, está en **[docs/BACKLOG.md](docs/BACKLOG.md)**. Resumen: ramas cortas desde `main`, Pull Requests con al menos una revisión, CI en verde antes de mergear, y **actualizar este README y la documentación en el mismo PR** que cambie el comportamiento.

## Changelog

| Fecha | Cambio |
|---|---|
| 2026-11-26 | BE-07 · Prueba de pagos contra el sandbox de Mercado Pago: el split 1:1 con Checkout Pro funciona con tarjeta (pago aprobado, comisión de la plataforma aplicada, firma del webhook válida). [ADR 0002](docs/adr/0002-pagos-mercado-pago.md) actualizado con los resultados (§9.4), los pasos de preparación que funcionaron (§9.2: aplicación creada desde una cuenta de prueba Marketplace con API de Preferences, dominio fijo de ngrok porque Mercado Pago no acepta `localhost`) y los problemas encontrados (§9.5). El CLI del spike imprime `init_point` en vez del link de sandbox y avisa si la preferencia sale con `marketplace: NONE`. Sin cambios en la API ni en la base |
| 2026-11-26 | FE-04 · Catálogo de facultades y materias: página pública `/explorar` con lista de facultades, buscador de materias que ignora mayúsculas y tildes, estados de carga/error/sin resultados, URL compartible (`?facultad=<id o slug>&q=`), hooks `useFaculties()` y `useCatalogSubjects()` en `hooks/use-catalog.ts` y link "Explorar" en el header (escritorio y celular). Sin cambios en la API ni en la base |
| 2026-11-25 | OPS-01 · CI más completo: ESLint 9 (flat config) con typescript-eslint y eslint-config-next, Prettier (sin formateo masivo todavía), servicio PostgreSQL 16 en el workflow de CI, paso de lint en el CI, plantilla de Pull Request en español, `.gitattributes` con `eol=lf` |
| 2026-11-24 | BE-07 · Spike de pagos con Mercado Pago: [ADR 0002](docs/adr/0002-pagos-mercado-pago.md) (estado: Propuesta) con la investigación de Split 1:1, OAuth, reserva/captura, webhooks, riesgo R-01, alternativas e implicancias legales/fiscales. Prueba técnica sin dependencias nuevas en `apps/api/scripts/mp-spike/` (`npm run spike:mp -w @estudioya/api`), con 14 pruebas sin conexión; la ejecución contra el sandbox queda pendiente de credenciales de prueba. Sin cambios en la API ni en la base |
| 2026-11-24 | FE-14 · Mockups de las pantallas principales, hechos en código dentro de la web: índice en `/mockups` y 8 pantallas (buscar profesores, perfil, confirmar y pagar, mis reservas con reseña, asistente "Quiero ser profesor" con pantalla de estado, agenda semanal del profesor, chat y panel de admin). Usan datos de ejemplo con la forma de los DTOs de `@estudioya/shared` (`app/mockups/_data.ts`), no llaman a la API, tienen `noindex` y no están enlazados desde el sitio. Notas de diseño con las preguntas abiertas en cada pantalla. Nuevo `docs/MOCKUPS.md`. Sin cambios en la API ni en la base |
| 2026-11-24 | FE-03 · Registro, login y logout en la web: páginas `/registro` y `/login` validadas con `registerSchema` y `loginSchema` de `@estudioya/shared`, casillas obligatorias de mayoría de edad y términos, errores `errors[]` de la API junto a cada campo y aviso con link al login ante el `409` por email repetido. El header muestra el usuario y "Cerrar sesión" (`POST /auth/logout`). Rutas privadas en el grupo `app/(privado)/` protegidas por `RequireAuth` (redirige a `/login?next=...`); primera ruta privada: `/mi-cuenta`. Se borra la pantalla temporal `/prueba-sesion`. Componentes shadcn `input`, `label` y `checkbox`. Los mensajes de `registerSchema`/`loginSchema` pasan a español (las reglas no cambian). Sin cambios en la API ni en la base |
| 2026-11-20 | BE-03 · Búsqueda y perfil público de profesores: `GET /teachers` (filtros por facultad, materia, tipo de clase, precio y puntaje; orden recomendado / precio / puntaje; paginado) y `GET /teachers/:teacherId`. Solo profesores aprobados con cuenta activa. Schemas y DTOs en `packages/shared/src/schemas/teacher-search.ts`. Sin cambios en la base |
| 2026-11-20 | FE-02 · Cliente de la API y sesión en la web: módulo `apps/web/src/lib/api.ts` (cookies, header CSRF, errores `problem+json` como `ApiError`, reintento único tras `POST /auth/refresh` ante un `401`, con refresh compartido entre requests simultáneas), TanStack Query configurado en `components/providers.tsx` y hook `useSession()` sobre `GET /auth/me`. Pantalla temporal `/prueba-sesion`. Nueva dependencia `@tanstack/react-query`. Sin cambios en la API ni en la base |
| 2026-11-19 | FE-01 · Base visual del frontend: Tailwind CSS v4 y shadcn/ui (Base UI, preset Nova), paleta de la marca (azul marino `#1e1b4b` y naranja `#ea580c`) definida en `globals.css`, layout con header (menú colapsable en celular) y footer, y página de inicio. Los links "Ingresar" y "Registrarse" apuntan a `/login` y `/registro`, que dan 404 hasta FE-03. Sin cambios en la API ni en la base |
| 2026-11-19 | BE-11 · Soporte: módulo `support` con `GET /faq`, formulario de contacto `POST /support/tickets` (público; asocia el usuario si hay sesión; límite 5/min; evento `support.ticket.created` en el outbox) y gestión desde el admin (`/admin/faq` y `/admin/support/tickets`). Nuevo `OptionalAuthGuard`. Schemas en `packages/shared/src/schemas/support.ts`. El seed carga FAQ de ejemplo. Sin cambios en la base |
| 2026-11-02 | Estructura inicial del monorepo, esquema de base de datos, Docker Compose, documentación de arquitectura |
| 2026-11-18 | Se agrega `docs/BACKLOG.md` (trabajo pendiente priorizado). Alta de profesores: `PUT /teacher-applications/me`, subida de certificados (PDF/JPG/PNG, 5 MB), envío a revisión y panel admin (listar, ver, descargar documentos, aprobar, rechazar). Rango de precios provisorio hardcodeado. Migración `add_teacher_application_flow`. El seed puede crear el primer admin (`SEED_ADMIN_*`) |
| 2026-11-18 | Backend base: `PrismaService`, seed de facultades y materias, módulo `auth` (registro, login, logout, refresh con rotación, `me`, guards de sesión y roles), módulo `catalog`, errores `problem+json`, protección CSRF por header, límite de tasa, `.http` de pruebas. Todo usuario nuevo es `STUDENT` |
| 2026-11-17 | Primera migración `init` aplicada. PostgreSQL pasa al puerto 5433 del host y `DATABASE_URL` usa `127.0.0.1` (problema `P1001` en Windows/WSL). Agregada sección de solución de problemas. Recursos gráficos (logos y banners) en `apps/web/public/` |
