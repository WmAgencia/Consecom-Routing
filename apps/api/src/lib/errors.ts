import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';
import { ZodError } from 'zod';
import { ConsecomError, ErrorCode } from '@consecom/shared';

export async function errorHandler(
  err: FastifyError | Error,
  req: FastifyRequest,
  reply: FastifyReply,
) {
  const requestId = req.requestId;

  // Domain errors
  if (err instanceof ConsecomError) {
    req.log.warn({ err, requestId }, 'domain error');
    return reply.status(err.status).send({
      ...err.toJSON(),
      request_id: requestId,
    });
  }

  // Zod validation
  if (err instanceof ZodError) {
    req.log.warn({ err, requestId }, 'validation error');
    return reply.status(400).send({
      code: ErrorCode.VALIDATION_FAILED,
      message: 'Validation failed',
      status: 400,
      details: { issues: err.issues },
      request_id: requestId,
    });
  }

  // Fastify validation (e.g. JSON parse)
  if ('statusCode' in err && typeof err.statusCode === 'number' && err.statusCode < 500) {
    req.log.warn({ err, requestId }, 'client error');
    return reply.status(err.statusCode).send({
      code: ErrorCode.INVALID_REQUEST,
      message: err.message,
      status: err.statusCode,
      request_id: requestId,
    });
  }

  // Unknown — log full, return generic
  req.log.error({ err, requestId }, 'unhandled error');
  return reply.status(500).send({
    code: ErrorCode.INTERNAL,
    message: 'Internal server error',
    status: 500,
    request_id: requestId,
  });
}