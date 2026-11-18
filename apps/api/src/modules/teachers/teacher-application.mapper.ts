import type { Prisma } from '@prisma/client';
import {
  missingDocuments,
  type TeacherApplicationDto,
  type VerificationDocumentDto,
} from '@estudioya/shared';

/** Relaciones que se cargan siempre junto con la solicitud. */
export const applicationInclude = {
  subjects: true,
  documents: { orderBy: { uploadedAt: 'asc' } },
} satisfies Prisma.TeacherProfileInclude;

export type ProfileWithRelations = Prisma.TeacherProfileGetPayload<{
  include: typeof applicationInclude;
}>;

export const toDocumentDto = (
  doc: ProfileWithRelations['documents'][number],
): VerificationDocumentDto => ({
  id: doc.id,
  kind: doc.kind,
  originalName: doc.originalName,
  mimeType: doc.mimeType,
  sizeBytes: doc.sizeBytes,
  uploadedAt: doc.uploadedAt.toISOString(),
});

export const toApplicationDto = (profile: ProfileWithRelations): TeacherApplicationDto => ({
  id: profile.id,
  status: profile.status,
  type: profile.type,
  facultyId: profile.facultyId,
  careerName: profile.careerName,
  graduationYear: profile.graduationYear,
  bio: profile.bio,
  rejectionReason: profile.rejectionReason,
  subjects: profile.subjects.map((s) => ({
    subjectId: s.subjectId,
    individualPriceCents: s.individualPriceCents,
    groupPriceCents: s.groupPriceCents,
  })),
  documents: profile.documents.map(toDocumentDto),
  missingDocuments: missingDocuments(
    profile.type,
    profile.documents.map((d) => d.kind),
  ),
  updatedAt: profile.updatedAt.toISOString(),
});
