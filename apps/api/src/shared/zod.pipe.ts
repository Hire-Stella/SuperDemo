import {
  BadRequestException,
  type ArgumentMetadata,
  type PipeTransform,
  Body,
  Query,
  Param,
} from '@nestjs/common';
import { z, type ZodTypeAny } from 'zod';

/**
 * Validates a payload against a zod schema from @fit-ai/contracts.
 *
 * The point of routing all validation through the shared schemas is that the
 * web app and the API cannot disagree about a shape — there is one definition,
 * not a DTO class here and an interface there.
 */
export class ZodValidationPipe<T extends ZodTypeAny> implements PipeTransform {
  constructor(private readonly schema: T) {}

  transform(value: unknown, _metadata: ArgumentMetadata): z.infer<T> {
    const result = this.schema.safeParse(value);
    if (result.success) return result.data;

    throw new BadRequestException({
      message: 'Validation failed',
      errors: result.error.issues.map((i) => ({
        field: i.path.join('.') || '(root)',
        message: i.message,
      })),
    });
  }
}

/** `@ZodBody(LoginInput) body: LoginInput` */
export const ZodBody = <T extends ZodTypeAny>(schema: T) => Body(new ZodValidationPipe(schema));

/** `@ZodQuery(ListConversationsQuery) q: ListConversationsQuery` */
export const ZodQuery = <T extends ZodTypeAny>(schema: T) => Query(new ZodValidationPipe(schema));

/** `@ZodParam('id', Cuid) id: string` */
export const ZodParam = <T extends ZodTypeAny>(name: string, schema: T) =>
  Param(name, new ZodValidationPipe(schema));
