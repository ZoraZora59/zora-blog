import type { Context } from 'hono';
import type { ContentfulStatusCode } from 'hono/utils/http-status';

export function success<T>(
  c: Context,
  data: T,
  message = 'success',
  statusCode: ContentfulStatusCode = 200,
) {
  return c.json(
    {
      code: statusCode,
      data,
      message,
    },
    statusCode,
  );
}

export function failure(
  c: Context,
  message: string,
  statusCode: ContentfulStatusCode = 400,
  data: unknown = null,
) {
  return c.json(
    {
      code: statusCode,
      data,
      message,
    },
    statusCode,
  );
}
