# Cómo contribuir

Equipo de 3 personas. Reglas simples para no pisarnos.

## Flujo de trabajo

1. Partir siempre de `main` actualizada: `git switch -c feat/<tema-corto>`.
2. Ramas cortas (idealmente < 2 días). Prefijos: `feat/`, `fix/`, `docs/`, `chore/`.
3. Commits en formato [Conventional Commits](https://www.conventionalcommits.org/es/): `feat(bookings): impedir reservas solapadas`.
4. Abrir Pull Request a `main`. Mínimo **1 aprobación** de otra persona y **CI en verde**.
5. Squash & merge. Nadie pushea directo a `main`.

## Documentación (obligatoria)

Un PR que cambie comportamiento debe actualizar en el mismo PR:

- `README.md`: estado del roadmap y changelog.
- `docs/ARCHITECTURE.md`: endpoints, puertos, contratos o reglas de negocio afectadas.
- `docs/DATABASE.md` y `schema.prisma`: si cambia el modelo de datos.
- `docs/adr/`: un ADR nuevo si se toma una decisión de arquitectura.

## Reglas de código

- TypeScript estricto. Nada de `any` sin comentario justificándolo.
- Dinero siempre en **enteros (centavos)**, nunca `float`.
- Fechas siempre en **UTC** (ISO 8601); la conversión a zona horaria se hace solo en la interfaz.
- Los contratos de entrada/salida de la API se definen con Zod en `packages/shared` y se reutilizan en API y web.
- Ningún secreto en el repo. Se usa `.env` (ignorado por git) y `.env.example` como referencia.

## Migraciones de base de datos

- Cada cambio de `schema.prisma` genera una migración: `npm run db:migrate -- --name <descripcion>`.
- Nunca editar una migración ya mergeada; crear una nueva.
- Las restricciones especiales (EXCLUDE, CHECK, índices parciales) van en SQL dentro de la migración y se documentan en `docs/DATABASE.md`.
