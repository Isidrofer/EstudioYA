import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { AdminFaqController } from './admin-faq.controller';
import { AdminSupportTicketsController } from './admin-support-tickets.controller';
import { FaqController } from './faq.controller';
import { FaqService } from './faq.service';
import { SupportTicketsController } from './support-tickets.controller';
import { SupportTicketsService } from './support-tickets.service';

/**
 * FAQ y tickets de soporte (BE-11). Incluye también las rutas de admin de estas tablas
 * (/admin/faq y /admin/support/tickets): así ningún otro módulo consulta `faqs` ni
 * `support_tickets` directamente (ARCHITECTURE §4, regla de dependencias).
 */
@Module({
  imports: [AuthModule],
  controllers: [
    FaqController,
    SupportTicketsController,
    AdminFaqController,
    AdminSupportTicketsController,
  ],
  providers: [FaqService, SupportTicketsService],
  exports: [FaqService, SupportTicketsService],
})
export class SupportModule {}
