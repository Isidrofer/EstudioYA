/**
 * Datos de prueba para desarrollo: facultades y materias de EJEMPLO.
 * Reemplazar por las de la universidad con la que se lance. Es idempotente:
 * se puede ejecutar muchas veces sin duplicar (upsert por slug).
 *
 * Ejecutar: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';
import * as argon2 from 'argon2';

const prisma = new PrismaClient();

const slugify = (text: string) =>
  text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

const CATALOG: Record<string, string[]> = {
  Ingeniería: [
    'Análisis Matemático I',
    'Álgebra y Geometría Analítica',
    'Física I',
    'Química General',
    'Programación I',
  ],
  'Ciencias Económicas': ['Contabilidad I', 'Microeconomía', 'Macroeconomía', 'Estadística', 'Matemática I'],
  Medicina: ['Anatomía', 'Histología', 'Fisiología', 'Bioquímica', 'Embriología'],
  Derecho: [
    'Introducción al Derecho',
    'Derecho Civil I',
    'Derecho Constitucional',
    'Derecho Penal I',
    'Derecho Romano',
  ],
  'Ciencias Exactas': [
    'Álgebra I',
    'Análisis Matemático I',
    'Física General',
    'Química Orgánica I',
    'Probabilidad y Estadística',
  ],
};

async function main() {
  let subjectCount = 0;

  for (const [facultyName, subjects] of Object.entries(CATALOG)) {
    const facultySlug = slugify(facultyName);
    const faculty = await prisma.faculty.upsert({
      where: { slug: facultySlug },
      update: { name: facultyName },
      create: { name: facultyName, slug: facultySlug },
    });

    for (const subjectName of subjects) {
      const slug = `${facultySlug}-${slugify(subjectName)}`;
      await prisma.subject.upsert({
        where: { slug },
        update: { name: subjectName, facultyId: faculty.id },
        create: { name: subjectName, slug, facultyId: faculty.id },
      });
      subjectCount += 1;
    }
  }

  // eslint-disable-next-line no-console
  console.log(`Seed listo: ${Object.keys(CATALOG).length} facultades, ${subjectCount} materias.`);

  await seedAdmin();
}

/**
 * Crea (una sola vez) el primer administrador si SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD están
 * definidos en el .env. Si el usuario ya existe, solo se asegura de que tenga rol ADMIN y NO
 * cambia su contraseña. En producción el admin se crea a mano, nunca con este seed.
 */
async function seedAdmin() {
  const email = process.env.SEED_ADMIN_EMAIL?.trim().toLowerCase();
  const password = process.env.SEED_ADMIN_PASSWORD;
  if (!email || !password) {
    // eslint-disable-next-line no-console
    console.log('Admin: no se creó (definí SEED_ADMIN_EMAIL y SEED_ADMIN_PASSWORD en el .env).');
    return;
  }
  if (password.length < 10) throw new Error('SEED_ADMIN_PASSWORD debe tener al menos 10 caracteres.');

  const now = new Date();
  const admin = await prisma.user.upsert({
    where: { email },
    update: { role: 'ADMIN' },
    create: {
      email,
      passwordHash: await argon2.hash(password, { type: argon2.argon2id }),
      firstName: 'Admin',
      lastName: 'EstudioYA',
      role: 'ADMIN',
      emailVerifiedAt: now,
      adultDeclaredAt: now,
      termsAcceptedAt: now,
      termsVersion: 'seed',
    },
  });
  // eslint-disable-next-line no-console
  console.log(`Admin listo: ${admin.email}`);
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
