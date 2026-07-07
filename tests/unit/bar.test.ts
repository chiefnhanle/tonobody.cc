import { describe, expect, it } from 'vitest'
import { applyCharDelta, decay, barPercent, GAIN_PER_CHAR, DECAY_PER_SECOND } from '../../app/utils/bar'

describe('applyCharDelta', () => {
  it('rewards newly typed characters', () => {
    expect(applyCharDelta(0, 10)).toBeCloseTo(10 * GAIN_PER_CHAR)
  })

  it('never subtracts when characters are deleted', () => {
    expect(applyCharDelta(5, -2)).toBe(5)
    expect(applyCharDelta(5, 0)).toBe(5)
  })
})

describe('decay', () => {
  it('drains fill over time but never below zero', () => {
    expect(decay(10, 1)).toBe(10 - DECAY_PER_SECOND)
    expect(decay(0.1, 10)).toBe(0)
  })

  it('leaves fill untouched for non-positive elapsed time', () => {
    expect(decay(4, 0)).toBe(4)
    expect(decay(4, -1)).toBe(4)
  })
})

describe('barPercent', () => {
  it('reports fill as a clamped 0-100 percentage of the target', () => {
    expect(barPercent(12, 24)).toBe(50)
    expect(barPercent(48, 24)).toBe(100)
    expect(barPercent(-5, 24)).toBe(0)
  })

  it('returns 0 for a non-positive target', () => {
    expect(barPercent(10, 0)).toBe(0)
  })
})
