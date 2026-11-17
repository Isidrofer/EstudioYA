-- Restricciones que Prisma no puede expresar. Se agregan al final de la migración inicial:
--   1) npm run db:migrate -- --create-only --name init
--   2) pegar este archivo al final de prisma/migrations/<fecha>_init/migration.sql
--   3) npm run db:migrate
-- Los nombres de columna van entre comillas porque Prisma las crea en camelCase.

CREATE EXTENSION IF NOT EXISTS btree_gist;

-- 1) Un profesor no puede tener dos slots abiertos que se solapen en el tiempo.
ALTER TABLE availability_slots
  ADD CONSTRAINT availability_slots_no_teacher_overlap
  EXCLUDE USING gist (
    "teacherProfileId" WITH =,
    tstzrange("startsAt", "endsAt") WITH &&
  ) WHERE ("status" = 'OPEN');

-- 2) Un alumno no puede tener dos reservas activas que se solapen en el tiempo.
ALTER TABLE bookings
  ADD CONSTRAINT bookings_no_student_overlap
  EXCLUDE USING gist (
    "studentId" WITH =,
    tstzrange("startsAt", "endsAt") WITH &&
  ) WHERE ("status" IN ('PENDING_PAYMENT', 'CONFIRMED'));

-- 3) Un alumno no puede reservar dos veces el mismo slot (mientras la reserva esté activa).
CREATE UNIQUE INDEX bookings_one_active_per_student_slot
  ON bookings ("slotId", "studentId")
  WHERE "status" IN ('PENDING_PAYMENT', 'CONFIRMED', 'COMPLETED');

-- 4) Validaciones de datos.
ALTER TABLE availability_slots
  ADD CONSTRAINT availability_slots_time_order CHECK ("endsAt" > "startsAt"),
  ADD CONSTRAINT availability_slots_capacity CHECK (
    "minStudents" >= 1 AND "maxStudents" >= "minStudents"
    AND ("classType" <> 'INDIVIDUAL' OR "maxStudents" = 1)
  ),
  ADD CONSTRAINT availability_slots_price_positive CHECK ("priceCents" > 0);

ALTER TABLE bookings
  ADD CONSTRAINT bookings_time_order CHECK ("endsAt" > "startsAt"),
  ADD CONSTRAINT bookings_amounts CHECK (
    "amountCents" > 0
    AND "commissionCents" >= 0
    AND "teacherNetCents" >= 0
    AND "commissionCents" + "teacherNetCents" = "amountCents"
  );

ALTER TABLE reviews
  ADD CONSTRAINT reviews_rating_range CHECK ("rating" BETWEEN 1 AND 5);

ALTER TABLE teacher_subjects
  ADD CONSTRAINT teacher_subjects_offers_something CHECK (
    "individualPriceCents" IS NOT NULL OR "groupPriceCents" IS NOT NULL
  ),
  ADD CONSTRAINT teacher_subjects_prices_positive CHECK (
    ("individualPriceCents" IS NULL OR "individualPriceCents" > 0)
    AND ("groupPriceCents" IS NULL OR "groupPriceCents" > 0)
  );

-- 5) Una conversación no puede ser de un usuario consigo mismo.
ALTER TABLE conversations
  ADD CONSTRAINT conversations_distinct_users CHECK ("studentId" <> "teacherUserId");
