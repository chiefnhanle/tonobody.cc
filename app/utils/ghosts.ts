// Witty "ghost lines" shown faintly over the empty page — the prompt to start
// typing. Nothing here is stored; the page forgets on purpose.
//
// To add more permanent prompts, just add strings to this list. Users can also
// add their own for the current session via the /ghost popup.

export const DEFAULT_GHOST_LINES: string[] = [
  'Message yourself here…',
  'Type /scrap when you need a clean slate.',
  "Say the thing you can't say out loud.",
  "Dump it here. It won't be kept.",
  "What's rattling around up there?",
  'Type it out, then let it go.',
  'No one reads this. Not even the app.',
  'Empty the tab you left open in your head.',
  "Draft the text you'll never send.",
  'Spill it. The page forgets on purpose.',
  'Name the worry. Fill the bar. Hit scrap.'
]

/** Pick `count` ghost lines starting at `index`, wrapping around the pool. */
export function ghostWindow(lines: string[], index: number, count = 3): string[] {
  if (!lines.length) return []
  const window: string[] = []
  const span = Math.min(count, lines.length)
  for (let i = 0; i < span; i++) {
    const line = lines[(index + i) % lines.length]
    if (line !== undefined) window.push(line)
  }
  return window
}
