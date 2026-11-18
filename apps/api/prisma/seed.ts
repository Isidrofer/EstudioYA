/**
 * Datos de prueba para desarrollo: facultades y materias de EJEMPLO.
 * Reemplazar por las de la universidad con la que se lance. Es idempotente:
 * se puede ejecutar muchas veces sin duplicar (upsert por slug).
 *
 * Ejecutar: npm run db:seed
 */
import { PrismaClient } from '@prisma/client';

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
}

main()
  .catch((error) => {
    // eslint-disable-next-line no-console
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
