import { Injectable } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import type {
  AdminTicketsQuery,
  CreatedTicketDto,
  CreateTicketInput,
  Paginated,
  SupportTicketDto,
  TicketStatus,
} from '@estudioya/shared';
import { notFound } from '../../common/api-problem';
import { PrismaService } from '../../prisma/prisma.service';

const ticketInclude = {
  user: { select: { id: true, firstName: true, lastName: true, email: true } },
} satisfies Prisma.SupportTicketInclude;

type TicketWithUser = Prisma.SupportTicketGetPayload<{ include: typeof ticketInclude }>;

const toDto = (ticket: TicketWithUser): SupportTicketDto => ({
  id: ticket.id,
  category: ticket.category,
  subject: ticket.subject,
  message: ticket.message,
  email: ticket.email,
  status: ticket.status,
  user: ticket.user,
  createdAt: ticket.createdAt.toISOString(),
  updatedAt: ticket.updatedAt.toISOString(),
});

@Injectable()
export class SupportTicketsService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Crea un ticket desde el formulario de contacto. Si hay sesión se asocia al usuario.
   * En la misma transacción deja el evento `support.ticket.created` en el outbox, para que
   * en el futuro se avise por email al equipo de soporte (BE-05 / BE-06).
   */
  async create(input: CreateTicketInput, userId?: string): Promise<CreatedTicketDto> {
    const ticket = await this.prisma.$transaction(async (tx) => {
      const created = await tx.supportTicket.create({
        data: { ...input, userId: userId ?? null },
        select: { id: true, status: true, createdAt: true },
      });
      await tx.outboxEvent.create({
        data: { routingKey: 'support.ticket.created', payload: { ticketId: created.id } },
      });
      return created;
    });

    return { id: ticket.id, status: ticket.status, createdAt: ticket.createdAt.toISOString() };
  }

  /** Tickets por estado (y categoría opcional), los más antiguos primero. */
  async list(query: AdminTicketsQuery): Promise<Paginated<SupportTicketDto>> {
    const where: Prisma.SupportTicketWhereInput = {
      status: query.status,
      ...(query.category ? { category: query.category } : {}),
    };

    const [total, rows] = await this.prisma.$transaction([
      this.prisma.supportTicket.count({ where }),
      this.prisma.supportTicket.findMany({
        where,
        include: ticketInclude,
        orderBy: { createdAt: 'asc' },
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
    ]);

    return {
      data: rows.map(toDto),
      meta: {
        page: query.page,
        pageSize: query.pageSize,
        total,
        totalPages: Math.ceil(total / query.pageSize),
      },
    };
  }

  async detail(id: string): Promise<SupportTicketDto> {
    const ticket = await this.prisma.supportTicket.findUnique({ where: { id }, include: ticketInclude });
    if (!ticket) throw notFound('El ticket no existe.');
    return toDto(ticket);
  }

  /** Cambia el estado. Se permite cualquier transición (incluido reabrir un ticket resuelto). */
  async updateStatus(id: string, status: TicketStatus): Promise<SupportTicketDto> {
    const updated = await this.prisma.supportTicket.updateMany({ where: { id }, data: { status } });
    if (updated.count !== 1) throw notFound('El ticket no existe.');
    return this.detail(id);
  }
}
