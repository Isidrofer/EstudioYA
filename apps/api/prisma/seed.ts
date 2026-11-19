/**
 * Datos de prueba para desarrollo: facultades, materias y preguntas frecuentes de EJEMPLO.
 * Reemplazar por las de la universidad con la que se lance. Es idempotente:
 * se puede ejecutar muchas veces sin duplicar (upsert por slug; las FAQ se buscan por pregunta).
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

  await seedFaqs();
  await seedAdmin();
}

/**
 * Preguntas frecuentes de EJEMPLO (los textos definitivos son la tarea PM-06).
 * Solo se crean si no existe una FAQ con la misma pregunta: no pisa cambios hechos por el admin.
 */
const FAQS: { question: string; answer: string }[] = [
  {
    question: '¿Qué es EstudioYA?',
    answer:
      'Una plataforma de clases particulares hecha por estudiantes, para estudiantes. Reservás una clase en el calendario de un profesor (estudiante avanzado o graduado), la pagás dentro de la app y después lo puntuás.',
  },
  {
    question: '¿Necesito ser mayor de edad para usar EstudioYA?',
    answer: 'Sí. La plataforma es solo para mayores de 18 años, tanto alumnos como profesores.',
  },
  {
    question: '¿Cómo me hago profesor?',
    answer:
      'Registrate, completá la solicitud de profesor con tus materias y precios y subí la documentación: si sos estudiante avanzado, el certificado de alumno regular y el de materias aprobadas; si sos graduado, tu título. Un administrador la revisa y te avisa si fue aprobada.',
  },
  {
    question: '¿Cómo se cobran las clases?',
    answer:
      'Las clases se cobran por hora y se pagan dentro de la app con Mercado Pago. Cada profesor fija su precio dentro del rango que define la plataforma.',
  },
  {
    question: '¿Cómo contacto al equipo de EstudioYA?',
    answer: 'Desde el formulario de contacto. Elegí la categoría de tu consulta y te respondemos por email.',
  },
];

async function seedFaqs() {
  let created = 0;
  for (const [index, faq] of FAQS.entries()) {
    const exists = await prisma.faq.findFirst({ where: { question: faq.question }, select: { id: true } });
    if (exists) continue;
    await prisma.faq.create({ data: { ...faq, position: (index + 1) * 10, published: true } });
    created += 1;
  }
  // eslint-disable-next-line no-console
  console.log(`FAQ: ${created} creadas (${FAQS.length - created} ya existían).`);
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
