import { randomUUID } from 'node:crypto'

export interface ApiErrorBody {
  error: { requestId: string, code: string, message: string }
}

export function requestId() {
  return randomUUID()
}

export function fail(statusCode: number, code: string, message: string, id = requestId()): never {
  throw createError({ statusCode, statusMessage: message, data: { error: { requestId: id, code, message } satisfies ApiErrorBody['error'] } })
}
