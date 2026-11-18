import { PipeTransform } from '@nestjs/common';
import type { ZodTypeAny, z } from 'zod';
import { ApiProblem } from './api-problem';

/** Valida y transforma la entrada con un schema Zod (los schemas viven en packages/shared). */
export class ZodValidationPipe<T extends ZodTypeAny> implements PipeTransform<unknown, z.infer<T>> {
  constructor(private readonly schema: T) {}

  transform(value: unknown): z.infer<T> {
    const result = this.schema.safeParse(value ?? {});
    if (!result.success) {
      throw new ApiProblem(
        400,
        'VALIDATION_ERROR',
        'Solicitud inválida',
        'Revisá los campos indicados.',
        result.error.issues.map((issue) => ({
          field: issue.path.join('.'),
          message: issue.message,
        })),
      );
    }
    return result.data;
  }
}
