import type { FastifyError, FastifyReply, FastifyRequest } from 'fastify';

/** Maps every error to the body shapes in docs/api/openapi.yaml; internals are only logged. */
export function contractErrorHandler(
  error: FastifyError,
  request: FastifyRequest,
  reply: FastifyReply,
): FastifyReply {
  if (error.validation) {
    return reply.code(400).send({ error: 'invalid_request', message: error.message });
  }
  if (error.code === 'FST_ERR_CTP_INVALID_MEDIA_TYPE') {
    return reply
      .code(415)
      .send({ error: 'invalid_request', message: 'Content-Type must be application/json' });
  }
  if (error.code === 'FST_ERR_CTP_BODY_TOO_LARGE') {
    return reply.code(413).send({ error: 'invalid_request', message: 'Request body is too large' });
  }
  const status = error.statusCode;
  if (status !== undefined && status >= 400 && status < 500) {
    return reply
      .code(status)
      .send({ error: 'invalid_request', message: 'Request body is not valid JSON' });
  }
  request.log.error({ err: error }, 'unhandled error');
  return reply.code(500).send({ error: 'internal_error', message: 'Something went wrong' });
}
