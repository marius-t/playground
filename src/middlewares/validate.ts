import { Context, Next } from 'koa';
import { ZodType } from 'zod';

/**
 * Validates `ctx.request.body` against a zod schema.
 * On failure responds 400 with the offending paths; on success replaces the
 * body with the parsed (and stripped) value before continuing.
 */
export const validateBody =
  (schema: ZodType) =>
  async (ctx: Context, next: Next): Promise<void> => {
    const result = schema.safeParse(ctx.request.body);

    if (!result.success) {
      ctx.status = 400;
      ctx.body = {
        error: 'Validation failed',
        issues: result.error.issues.map((issue) => ({
          path: issue.path.join('.'),
          message: issue.message,
        })),
      };
      return;
    }

    ctx.request.body = result.data;
    await next();
  };
