import { Injectable } from '@nestjs/common';
import { randomUUID } from 'node:crypto';
import {
  ALLOWED_DOCUMENT_FORMATS_LABEL,
  DOCUMENT_LABELS,
  formatArs,
  isPriceInRange,
  MAX_DOCUMENT_BYTES,
  MAX_DOCUMENTS_PER_APPLICATION,
  missingDocuments,
  PRICE_RANGE_CENTS,
  type TeacherApplicationDto,
  type TeacherApplicationInput,
  type UploadDocumentInput,
  type VerificationDocumentDto,
} from '@estudioya/shared';
import { ApiProblem, conflict, forbidden, notFound } from '../../common/api-problem';
import { detectFileType } from '../../common/file-type';
import { PrismaService } from '../../prisma/prisma.service';
import { StorageService } from '../../storage/storage.service';
import {
  applicationInclude,
  toApplicationDto,
  toDocumentDto,
  type ProfileWithRelations,
} from './teacher-application.mapper';

/** Estados en los que el profesor todavía puede modificar su solicitud. */
const EDITABLE = ['DRAFT', 'REJECTED'] as const;
const isEditable = (status: string) => (EDITABLE as readonly string[]).includes(status);

const LOCKED_MESSAGE =
  'La solicitud ya fue enviada o aprobada y no se puede modificar.';

@Injectable()
export class TeacherApplicationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly storage: StorageService,
  ) {}

  async getMine(userId: string): Promise<TeacherApplicationDto> {
    const profile = await this.findByUser(userId);
    if (!profile) throw notFound('Todavía no iniciaste una solicitud para ser profesor.');
    return toApplicationDto(profile);
  }

  /** Crea la solicitud o reemplaza sus datos (solo en estado DRAFT o REJECTED). */
  async upsert(userId: string, input: TeacherApplicationInput): Promise<TeacherApplicationDto> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { role: true, status: true },
    });
    if (!user || user.status !== 'ACTIVE') throw notFound();
    if (user.role === 'ADMIN') throw forbidden('Un administrador no puede ser profesor.');

    const existing = await this.prisma.teacherProfile.findUnique({ where: { userId } });
    if (existing && !isEditable(existing.status)) throw conflict(LOCKED_MESSAGE);

    await this.validateCatalogAndPrices(input);

    const data = {
      type: input.type,
      facultyId: input.facultyId,
      careerName: input.careerName,
      graduationYear: input.graduationYear ?? null,
      bio: input.bio,
    };

    await this.prisma.$transaction(async (tx) => {
      // Si estaba rechazada y la corrige, vuelve a borrador.
      const profile = existing
        ? await tx.teacherProfile.update({
            where: { id: existing.id },
            data: { ...data, status: 'DRAFT', rejectionReason: null },
          })
        : await tx.teacherProfile.create({ data: { ...data, userId, status: 'DRAFT' } });

      await tx.teacherSubject.deleteMany({ where: { teacherProfileId: profile.id } });
      await tx.teacherSubject.createMany({
        data: input.subjects.map((s) => ({
          teacherProfileId: profile.id,
          subjectId: s.subjectId,
          individualPriceCents: s.individualPriceCents ?? null,
          groupPriceCents: s.groupPriceCents ?? null,
        })),
      });
    });

    return this.getMine(userId);
  }

  async uploadDocument(
    userId: string,
    input: UploadDocumentInput,
    file: Express.Multer.File | undefined,
  ): Promise<VerificationDocumentDto> {
    const profile = await this.findByUser(userId);
    if (!profile) throw conflict('Primero completá los datos de tu solicitud.');
    if (!isEditable(profile.status)) throw conflict(LOCKED_MESSAGE);
    if (profile.documents.length >= MAX_DOCUMENTS_PER_APPLICATION) {
      throw conflict(`Podés subir hasta ${MAX_DOCUMENTS_PER_APPLICATION} archivos. Borrá alguno primero.`);
    }

    if (!file || file.size === 0) {
      throw new ApiProblem(400, 'VALIDATION_ERROR', 'Solicitud inválida', undefined, [
        { field: 'file', message: 'Adjuntá un archivo.' },
      ]);
    }
    if (file.size > MAX_DOCUMENT_BYTES) {
      throw new ApiProblem(400, 'VALIDATION_ERROR', 'Solicitud inválida', undefined, [
        { field: 'file', message: 'El archivo supera los 5 MB.' },
      ]);
    }
    const detected = detectFileType(file.buffer);
    if (!detected) {
      throw new ApiProblem(400, 'VALIDATION_ERROR', 'Solicitud inválida', undefined, [
        { field: 'file', message: `Formato no permitido. Subí un ${ALLOWED_DOCUMENT_FORMATS_LABEL}.` },
      ]);
    }

    // Un solo archivo por tipo de documento: el nuevo reemplaza al anterior.
    const previous = profile.documents.filter((d) => d.kind === input.kind);

    const storageKey = `verification/${profile.id}/${randomUUID()}.${detected.ext}`;
    await this.storage.put(storageKey, file.buffer);

    let created;
    try {
      created = await this.prisma.verificationDocument.create({
        data: {
          teacherProfileId: profile.id,
          kind: input.kind,
          storageKey,
          originalName: sanitizeFileName(file.originalname),
          mimeType: detected.mime,
          sizeBytes: file.size,
        },
      });
    } catch (error) {
      await this.storage.delete(storageKey);
      throw error;
    }

    for (const old of previous) {
      await this.prisma.verificationDocument.delete({ where: { id: old.id } });
      await this.storage.delete(old.storageKey);
    }

    return toDocumentDto(created);
  }

  async deleteDocument(userId: string, documentId: string): Promise<void> {
    const profile = await this.findByUser(userId);
    const doc = profile?.documents.find((d) => d.id === documentId);
    if (!profile || !doc) throw notFound('El documento no existe.');
    if (!isEditable(profile.status)) throw conflict(LOCKED_MESSAGE);

    await this.prisma.verificationDocument.delete({ where: { id: doc.id } });
    await this.storage.delete(doc.storageKey);
  }

  /** Envía la solicitud a revisión del administrador. */
  async submit(userId: string): Promise<TeacherApplicationDto> {
    const profile = await this.findByUser(userId);
    if (!profile) throw notFound('Todavía no iniciaste una solicitud para ser profesor.');
    if (!isEditable(profile.status)) throw conflict(LOCKED_MESSAGE);

    const missing = missingDocuments(
      profile.type,
      profile.documents.map((d) => d.kind),
    );
    if (missing.length > 0) {
      throw new ApiProblem(
        422,
        'VALIDATION_ERROR',
        'Documentación incompleta',
        'Subí los documentos obligatorios antes de enviar la solicitud.',
        missing.map((kind) => ({ field: 'documents', message: `Falta: ${DOCUMENT_LABELS[kind]}` })),
      );
    }

    await this.prisma.teacherProfile.update({
      where: { id: profile.id },
      data: { status: 'PENDING', rejectionReason: null },
    });
    return this.getMine(userId);
  }

  // ───────────── helpers ─────────────

  private findByUser(userId: string): Promise<ProfileWithRelations | null> {
    return this.prisma.teacherProfile.findUnique({
      where: { userId },
      include: applicationInclude,
    });
  }

  /** Verifica que la facultad y las materias existan y que los precios respeten el rango (BR-03, BR-04). */
  private async validateCatalogAndPrices(input: TeacherApplicationInput): Promise<void> {
    const errors: { field: string; message: string }[] = [];

    const faculty = await this.prisma.faculty.findUnique({
      where: { id: input.facultyId },
      select: { id: true },
    });
    if (!faculty) errors.push({ field: 'facultyId', message: 'La facultad no existe.' });

    const ids = input.subjects.map((s) => s.subjectId);
    const found = await this.prisma.subject.findMany({
      where: { id: { in: ids } },
      select: { id: true },
    });
    const foundIds = new Set(found.map((s) => s.id));
    if (errors.length > 0 || foundIds.size !== ids.length) {
      input.subjects.forEach((s, i) => {
        if (!foundIds.has(s.subjectId)) {
          errors.push({ field: `subjects.${i}.subjectId`, message: 'La materia no existe.' });
        }
      });
      throw new ApiProblem(400, 'VALIDATION_ERROR', 'Solicitud inválida', undefined, errors);
    }

    const priceErrors: { field: string; message: string }[] = [];
    input.subjects.forEach((s, i) => {
      if (s.individualPriceCents !== undefined && !isPriceInRange('INDIVIDUAL', s.individualPriceCents)) {
        const r = PRICE_RANGE_CENTS.INDIVIDUAL;
        priceErrors.push({
          field: `subjects.${i}.individualPriceCents`,
          message: `Debe estar entre ${formatArs(r.min)} y ${formatArs(r.max)} por hora.`,
        });
      }
      if (s.groupPriceCents !== undefined && !isPriceInRange('GROUP', s.groupPriceCents)) {
        const r = PRICE_RANGE_CENTS.GROUP;
        priceErrors.push({
          field: `subjects.${i}.groupPriceCents`,
          message: `Debe estar entre ${formatArs(r.min)} y ${formatArs(r.max)} por hora, por alumno.`,
        });
      }
      // BR-04: el precio grupal por alumno debe ser menor que el individual.
      if (
        s.individualPriceCents !== undefined &&
        s.groupPriceCents !== undefined &&
        s.groupPriceCents >= s.individualPriceCents
      ) {
        priceErrors.push({
          field: `subjects.${i}.groupPriceCents`,
          message: 'El precio grupal por alumno debe ser menor que el individual.',
        });
      }
    });
    if (priceErrors.length > 0) {
      throw new ApiProblem(
        422,
        'PRICE_OUT_OF_RANGE',
        'Precio fuera del rango permitido',
        'Revisá los precios indicados.',
        priceErrors,
      );
    }
  }
}

/** Deja solo el nombre del archivo (sin rutas), sin caracteres de control y con largo acotado. */
function sanitizeFileName(name: string): string {
  const base = name.split(/[\\/]/).pop() ?? 'documento';
  // eslint-disable-next-line no-control-regex
  const cleaned = base.replace(/[\u0000-\u001f\u007f]/g, '').trim();
  return (cleaned || 'documento').slice(0, 120);
}
