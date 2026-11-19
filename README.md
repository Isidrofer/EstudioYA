# EstudioYA

Plataforma de clases particulares **hecha por estudiantes, para estudiantes**. Un estudiante reserva una clase en el calendario de un profesor (estudiante avanzado o graduado), paga dentro de la app y después puntúa al profesor.

> **Estado del proyecto:** Fase 0 (fundaciones). Ver el [roadmap](#roadmap) y el [CHANGELOG](#changelog).
> Última actualización: 2026-11-19

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
| Frontend | Next.js (React) · TypeScript |
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
│       └── public/          #   Recursos estáticos: logos/, banners/, favicon (se sirven desde "/")
├── packages/
│   └── shared/              # Constantes, errores y schemas Zod compartidos (API ↔ web)
├── docs/
│   ├── ARCHITECTURE.md      # Arquitectura, puertos, endpoints, contratos
│   ├── DATABASE.md          # Modelo de datos y restricciones
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
- [ ] **Fase 0 · Pendiente**: repositorio en GitHub con `main` protegida, CI en verde, definir rango de precios y reglas "por confirmar", mockups
- [ ] **Fase 1 · MVP**
  - [x] Backend: conexión a la base, datos de prueba, registro/login/logout/refresh/me, catálogo de facultades y materias
  - [x] Backend: solicitud de alta de profesor (datos, materias con precios, certificados) y revisión manual del admin
  - [x] Backend: FAQ pública y formulario de contacto (tickets de soporte), con su gestión desde el admin
  - [ ] Backend: disponibilidad semanal del profesor y generación de horarios reservables
  - [ ] Backend: perfil público y búsqueda de profesores con filtros, reserva individual
  - [ ] Frontend: inicio, login, registro, búsqueda
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
| 2026-11-19 | BE-11 · Soporte: módulo `support` con `GET /faq`, formulario de contacto `POST /support/tickets` (público; asocia el usuario si hay sesión; límite 5/min; evento `support.ticket.created` en el outbox) y gestión desde el admin (`/admin/faq` y `/admin/support/tickets`). Nuevo `OptionalAuthGuard`. Schemas en `packages/shared/src/schemas/support.ts`. El seed carga FAQ de ejemplo. Sin cambios en la base |
| 2026-11-02 | Estructura inicial del monorepo, esquema de base de datos, Docker Compose, documentación de arquitectura |
| 2026-11-18 | Se agrega `docs/BACKLOG.md` (trabajo pendiente priorizado). Alta de profesores: `PUT /teacher-applications/me`, subida de certificados (PDF/JPG/PNG, 5 MB), envío a revisión y panel admin (listar, ver, descargar documentos, aprobar, rechazar). Rango de precios provisorio hardcodeado. Migración `add_teacher_application_flow`. El seed puede crear el primer admin (`SEED_ADMIN_*`) |
| 2026-11-18 | Backend base: `PrismaService`, seed de facultades y materias, módulo `auth` (registro, login, logout, refresh con rotación, `me`, guards de sesión y roles), módulo `catalog`, errores `problem+json`, protección CSRF por header, límite de tasa, `.http` de pruebas. Todo usuario nuevo es `STUDENT` |
| 2026-11-17 | Primera migración `init` aplicada. PostgreSQL pasa al puerto 5433 del host y `DATABASE_URL` usa `127.0.0.1` (problema `P1001` en Windows/WSL). Agregada sección de solución de problemas. Recursos gráficos (logos y banners) en `apps/web/public/` |
