import { Body, Controller, Get, Param, ParseUUIDPipe, Patch, Query, UseGuards } from '@nestjs/common';
import {
  adminTicketsQuerySchema,
  updateTicketSchema,
  type AdminTicketsQuery,
  type Paginated,
  type SupportTicketDto,
  type UpdateTicketInput,
} from '@estudioya/shared';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import { Roles, RolesGuard } from '../auth/roles';
import { SupportTicketsService } from './support-tickets.service';

/** Gestión de tickets de soporte. Solo ADMIN. */
@Controller('admin/support/tickets')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminSupportTicketsController {
  constructor(private readonly tickets: SupportTicketsService) {}

  @Get()
  list(
    @Query(new ZodValidationPipe(adminTicketsQuerySchema)) query: AdminTicketsQuery,
  ): Promise<Paginated<SupportTicketDto>> {
    return this.tickets.list(query);
  }

  @Get(':ticketId')
  detail(@Param('ticketId', ParseUUIDPipe) ticketId: string): Promise<SupportTicketDto> {
    return this.tickets.detail(ticketId);
  }

  @Patch(':ticketId')
  updateStatus(
    @Param('ticketId', ParseUUIDPipe) ticketId: string,
    @Body(new ZodValidationPipe(updateTicketSchema)) body: UpdateTicketInput,
  ): Promise<SupportTicketDto> {
    return this.tickets.updateStatus(ticketId, body.status);
  }
}
