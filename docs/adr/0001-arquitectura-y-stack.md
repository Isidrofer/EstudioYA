# ADR 0001: Monolito modular y stack TypeScript

- **Estado:** Aceptada
- **Fecha:** 2026-11-02

## Contexto
Equipo de 3 personas, proyecto desde cero, lanzamiento en Argentina. Hay que entregar valor rápido (reservas + pagos) con poca carga operativa.

## Decisión
1. **Monolito modular** en NestJS: un solo servicio desplegable con módulos de dominio aislados (auth, users, catalog, teachers, availability, bookings, payments, chat, reviews, support, admin). Los módulos solo se comunican por servicios exportados o eventos, nunca accediendo a tablas de otro módulo.
2. **TypeScript en todo el stack** (NestJS + Next.js), con contratos compartidos en `packages/shared`.
3. **PostgreSQL** como única base de datos: transacciones ACID y restricciones `EXCLUDE` para impedir reservas solapadas a nivel de base.
4. **RabbitMQ local** (Docker) para trabajo asíncrono, con patrón **outbox** para no perder eventos.
5. **Mercado Pago** (Marketplace/split) como proveedor de pagos.

## Alternativas descartadas
- **Microservicios:** costo operativo y de coordinación desproporcionado para 3 personas.
- **Django + Celery:** válido, pero se prefiere un solo lenguaje entre frontend y backend.
- **Stripe Connect:** no disponible para cuentas locales en Argentina.

## Consecuencias
- Despliegue y debugging simples. Si un módulo crece (p. ej. chat), puede extraerse más adelante porque sus límites ya están definidos.
- Una caída del monolito afecta todo; se mitiga con healthchecks y despliegues sencillos de revertir.
