import { Controller, Get } from '@nestjs/common';
import type { FaqDto } from '@estudioya/shared';
import { FaqService } from './faq.service';

/** Preguntas frecuentes publicadas. Público. */
@Controller('faq')
export class FaqController {
  constructor(private readonly faq: FaqService) {}

  @Get()
  list(): Promise<FaqDto[]> {
    return this.faq.listPublished();
  }
}
