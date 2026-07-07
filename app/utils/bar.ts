// Pure momentum-bar math. Kept side-effect free so it can be unit tested
// without a DOM or a running editor.
//
// The bar rewards *momentum*: adding lines pushes `fill` up, and time gently
// pulls it back down. You never lose progress by editing or deleting text —
// only by pausing. The goal is to type fast enough to outrun the decay and
// top the bar off.

export const DEFAULT_TARGET = 24
export const MIN_TARGET = 6
export const MAX_TARGET = 120

// How much a single new line adds to the fill.
export const GAIN_PER_LINE = 1

// How much a single newly typed character adds to the fill. Small on its own,
// but it means the bar responds to steady typing, not just line breaks.
export const GAIN_PER_CHAR = 0.03

// How much fill drains per second. Deliberately gentle — "slowly, slowly".
// 10x gentler than the original pace, so a short pause doesn't cost much ground.
export const DECAY_PER_SECOND = 0.04

/** Reward newly added lines. Deleting lines (negative delta) never subtracts. */
export function applyLineDelta(fill: number, delta: number, gainPerLine = GAIN_PER_LINE): number {
  if (delta <= 0) return fill
  return fill + delta * gainPerLine
}

/** Reward newly typed characters. Deleting characters (negative delta) never subtracts. */
export function applyCharDelta(fill: number, delta: number, gainPerChar = GAIN_PER_CHAR): number {
  if (delta <= 0) return fill
  return fill + delta * gainPerChar
}

/** Let time pull the fill back toward zero. `fill` never drops below 0. */
export function decay(fill: number, dtSeconds: number, decayPerSecond = DECAY_PER_SECOND): number {
  if (dtSeconds <= 0) return fill
  return Math.max(0, fill - dtSeconds * decayPerSecond)
}

/** Current fill as a 0–100 percentage of the target, clamped. */
export function barPercent(fill: number, target: number): number {
  if (target <= 0) return 0
  return Math.min(100, Math.max(0, (fill / target) * 100))
}
