import type { ContentfulStatusCode } from 'hono/utils/http-status';

export class AppError extends Error {
  readonly statusCode: ContentfulStatusCode;
  readonly code: number;
  readonly details?: unknown;

  constructor(message: string, statusCode: ContentfulStatusCode = 400, code?: number, details?: unknown) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.code = code ?? statusCode;
    this.details = details;
  }
}
