import { monotonicFactory } from 'ulid'

const makeUlid = monotonicFactory()

export function generateCaptureId() {
  return `cap_${makeUlid().toLowerCase().slice(0, 10)}`
}
