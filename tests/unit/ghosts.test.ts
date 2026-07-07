import { describe, expect, it } from 'vitest'
import { ghostWindow, DEFAULT_GHOST_LINES } from '../../app/utils/ghosts'

describe('ghostWindow', () => {
  it('returns a window of prompts starting at the given index', () => {
    expect(ghostWindow(['a', 'b', 'c', 'd'], 1, 2)).toEqual(['b', 'c'])
  })

  it('wraps around the pool', () => {
    expect(ghostWindow(['a', 'b', 'c'], 2, 3)).toEqual(['c', 'a', 'b'])
  })

  it('never returns more items than exist', () => {
    expect(ghostWindow(['only'], 0, 3)).toEqual(['only'])
    expect(ghostWindow([], 0, 3)).toEqual([])
  })

  it('ships a non-empty default pool', () => {
    expect(DEFAULT_GHOST_LINES.length).toBeGreaterThan(0)
  })
})
