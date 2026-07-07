import { describe, expect, it } from 'vitest'
import { applyLineDelta, decay, barPercent, GAIN_PER_LINE, DECAY_PER_SECOND } from '../../app/utils/bar'

describe('applyLineDelta', () => {
  it('rewards newly added lines', () => {
    expect(applyLineDelta(0, 3)).toBe(3 * GAIN_PER_LINE)
  })

  it('never subtracts when lines are deleted', () => {
    expect(applyLineDelta(5, -2)).toBe(5)
    expect(applyLineDelta(5, 0)).toBe(5)
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
