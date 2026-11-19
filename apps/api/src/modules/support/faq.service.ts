import { Injectable } from '@nestjs/common';
import type { Faq, Prisma } from '@prisma/client';
import type { AdminFaqDto, FaqDto, FaqInput } from '@estudioya/shared';
import { notFound } from '../../common/api-problem';
import { PrismaService } from '../../prisma/prisma.service';

/** Orden de las FAQ: por `position` y, a igual posición, alfabético. */
const FAQ_ORDER: Prisma.FaqOrderByWithRelationInput[] = [{ position: 'asc' }, { question: 'asc' }];

const toAdminDto = (faq: Faq): AdminFaqDto => ({
  id: faq.id,
  question: faq.question,
  answer: faq.answer,
  position: faq.position,
  published: faq.published,
  updatedAt: faq.updatedAt.toISOString(),
});

@Injectable()
export class FaqService {
  constructor(private readonly prisma: PrismaService) {}

  /** FAQ publicadas (público). Lista corta: no se pagina. */
  listPublished(): Promise<FaqDto[]> {
    return this.prisma.faq.findMany({
      where: { published: true },
      select: { id: true, question: true, answer: true, position: true },
      orderBy: FAQ_ORDER,
    });
  }

  /** Todas las FAQ, incluidas las no publicadas (admin). */
  async listAll(): Promise<AdminFaqDto[]> {
    const faqs = await this.prisma.faq.findMany({ orderBy: FAQ_ORDER });
    return faqs.map(toAdminDto);
  }

  async get(id: string): Promise<AdminFaqDto> {
    const faq = await this.prisma.faq.findUnique({ where: { id } });
    if (!faq) throw notFound('La pregunta frecuente no existe.');
    return toAdminDto(faq);
  }

  async create(input: FaqInput): Promise<AdminFaqDto> {
    const faq = await this.prisma.faq.create({ data: input });
    return toAdminDto(faq);
  }

  /** Reemplaza la FAQ completa (PUT). */
  async replace(id: string, input: FaqInput): Promise<AdminFaqDto> {
    const updated = await this.prisma.faq.updateMany({ where: { id }, data: input });
    if (updated.count !== 1) throw notFound('La pregunta frecuente no existe.');
    return this.get(id);
  }

  async remove(id: string): Promise<void> {
    const deleted = await this.prisma.faq.deleteMany({ where: { id } });
    if (deleted.count !== 1) throw notFound('La pregunta frecuente no existe.');
  }
}
