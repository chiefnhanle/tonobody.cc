// Pure momentum-bar math. Kept side-effect free so it can be unit tested
// without a DOM or a running editor.
//
// The bar rewards *momentum*: every character you type pushes `fill` up, and
// time gently pulls it back down. You never lose progress by editing or
// deleting text — only by pausing. The goal is to type fast enough to outrun
// the decay and top the bar off.

export const DEFAULT_TARGET = 300
export const MIN_TARGET = 60
export const MAX_TARGET = 1500

// How much a single newly typed character adds to the fill. Every character counts equally.
export const GAIN_PER_CHAR = 1

// How much fill drains per second. Deliberately gentle — "slowly, slowly".
export const DECAY_PER_SECOND = 0.04

// User-adjustable multiplier on DECAY_PER_SECOND (how fast the bar drains).
export const DEFAULT_DECAY_MULTIPLIER = 6
export const MIN_DECAY_MULTIPLIER = 0.2
export const MAX_DECAY_MULTIPLIER = 8

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
