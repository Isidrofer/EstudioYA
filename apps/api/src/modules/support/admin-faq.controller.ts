import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { faqSchema, type AdminFaqDto, type FaqInput } from '@estudioya/shared';
import { ZodValidationPipe } from '../../common/zod-validation.pipe';
import { AuthGuard } from '../auth/auth.guard';
import { Roles, RolesGuard } from '../auth/roles';
import { FaqService } from './faq.service';

/** Gestión de preguntas frecuentes. Solo ADMIN. */
@Controller('admin/faq')
@UseGuards(AuthGuard, RolesGuard)
@Roles('ADMIN')
export class AdminFaqController {
  constructor(private readonly faq: FaqService) {}

  @Get()
  list(): Promise<AdminFaqDto[]> {
    return this.faq.listAll();
  }

  @Get(':faqId')
  get(@Param('faqId', ParseUUIDPipe) faqId: string): Promise<AdminFaqDto> {
    return this.faq.get(faqId);
  }

  @Post()
  @HttpCode(201)
  create(@Body(new ZodValidationPipe(faqSchema)) body: FaqInput): Promise<AdminFaqDto> {
    return this.faq.create(body);
  }

  /** Reemplaza la FAQ completa (todos los campos; los omitidos toman su valor por defecto). */
  @Put(':faqId')
  replace(
    @Param('faqId', ParseUUIDPipe) faqId: string,
    @Body(new ZodValidationPipe(faqSchema)) body: FaqInput,
  ): Promise<AdminFaqDto> {
    return this.faq.replace(faqId, body);
  }

  @Delete(':faqId')
  @HttpCode(204)
  async remove(@Param('faqId', ParseUUIDPipe) faqId: string): Promise<void> {
    await this.faq.remove(faqId);
  }
}
