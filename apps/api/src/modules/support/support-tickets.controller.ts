import { Body, Controller, HttpCode, Post, Req, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import {
  createTicketSchema,
  type CreatedTicketDto,
  type CreateTicketInput,
} from '@estudioya/shared';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import type { AuthenticatedRequest } from '../auth/auth.types';
import { OptionalAuthGuard } from '../auth/optional-auth.guard';
import { SupportTicketsService } from './support-tickets.service';

/** Formulario de contacto: 5 envíos por minuto (ARCHITECTURE §6, regla 22). Evita spam. */
const CONTACT_LIMIT = { default: { limit: 5, ttl: 60_000 } };

/** Formulario de contacto/soporte. Público; si hay sesión, el ticket queda asociado al usuario. */
@Controller('support/tickets')
@UseGuards(OptionalAuthGuard)
export class SupportTicketsController {
  constructor(private readonly tickets: SupportTicketsService) {}

  @Post()
  @Throttle(CONTACT_LIMIT)
  @HttpCode(201)
  create(
    @Req() req: AuthenticatedRequest,
    @Body(new ZodValidationPipe(createTicketSchema)) body: CreateTicketInput,
  ): Promise<CreatedTicketDto> {
    return this.tickets.create(body, req.user?.id);
  }
}
