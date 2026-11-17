# EstudioYA

Plataforma de clases particulares **hecha por estudiantes, para estudiantes**. Un estudiante reserva una clase en el calendario de un profesor (estudiante avanzado o graduado), paga dentro de la app y después puntúa al profesor.

> **Estado del proyecto:** Fase 0 (fundaciones). Ver el [roadmap](#roadmap) y el [CHANGELOG](#changelog).
> Última actualización: 2026-11-02

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
│   │   ├── prisma/          #   schema.prisma y sql/001_constraints.sql
│   │   └── src/
│   └── web/                 # Frontend Next.js
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

Requisitos: Node.js 22 (`nvm use`), Docker y Docker Compose.

```bash
cp .env.example .env          # completar valores (ver docs/ARCHITECTURE.md §10)
npm install
npm run infra:up              # PostgreSQL, RabbitMQ y Mailpit
npm run db:generate           # genera el cliente Prisma
npm run db:migrate -- --create-only --name init
#   → pegar apps/api/prisma/sql/001_constraints.sql al final de la migración creada
npm run db:migrate            # aplica la migración
npm run dev:api               # API en http://localhost:4000/api/v1/health
npm run dev:web               # Web en http://localhost:3000
```

| Servicio | URL |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:4000/api/v1 |
| RabbitMQ (panel) | http://localhost:15672 |
| Mailpit (emails de prueba) | http://localhost:8025 |

## Scripts útiles

| Comando | Qué hace |
|---|---|
| `npm run infra:up` / `infra:down` | Levanta / baja la infraestructura Docker |
| `npm run build` | Compila shared, api y web |
| `npm run typecheck` | Verifica tipos en todo el monorepo |
| `npm run db:validate` | Valida `schema.prisma` |
| `npm run db:migrate` | Crea/aplica migraciones de Prisma |

## Roadmap

- [x] **Fase 0 · Fundaciones**: decisiones de producto y stack, estructura del monorepo, esquema de base, Docker, documentación inicial
- [ ] **Fase 0 · Pendiente**: instalar dependencias y verificar build, primera migración, CI en verde, mockups
- [ ] **Fase 1 · MVP**: registro/login/logout, perfil de profesor, facultades y materias con filtros, disponibilidad, reserva individual
- [ ] **Fase 2**: pagos con comisión (Mercado Pago), clases grupales, reseñas y ranking
- [ ] **Fase 3**: chat con moderación, FAQ, soporte, alta de profesores con verificación, panel admin
- [ ] **Fase 4**: pruebas de carga y seguridad, beta cerrada con una facultad

## Decisiones tomadas

- País de lanzamiento: **Argentina** (ARS, Mercado Pago). Solo **mayores de edad**.
- Arquitectura: **monolito modular**, no microservicios ([ADR 0001](docs/adr/0001-arquitectura-y-stack.md)).
- Comisión de la plataforma: **35 %**, descontada del precio publicado (el profesor recibe el 65 %).
- Decisiones aún abiertas: ver [docs/ARCHITECTURE.md §12](docs/ARCHITECTURE.md#12-decisiones-y-riesgos-abiertos).

## Cómo trabajamos

Ver [CONTRIBUTING.md](CONTRIBUTING.md). Resumen: ramas cortas desde `main`, Pull Requests con al menos una revisión, CI en verde antes de mergear, y **actualizar este README y la documentación en el mismo PR** que cambie el comportamiento.

## Changelog

| Fecha | Cambio |
|---|---|
| 2026-11-02 | Estructura inicial del monorepo, esquema de base de datos, Docker Compose, documentación de arquitectura |
