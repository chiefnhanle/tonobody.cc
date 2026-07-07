// Color scheme presets. Each theme is just a bag of CSS custom properties —
// switching themes means re-pointing `--tv-*` variables on <html>, nothing
// else. Session-only, like everything in this app: the choice resets on
// reload rather than being written to storage.

export interface ThemeDefinition {
  id: string
  name: string
  isDark: boolean
  vars: {
    '--tv-bg': string
    '--tv-text': string
    '--tv-muted': string
    '--tv-dim': string
    '--tv-ink': string
    '--tv-ink-soft': string
    '--tv-overlay': string
    '--tv-chip': string
    '--tv-accent-a': string
    '--tv-accent-b': string
    '--tv-accent-c': string
    '--tv-glow-rgb': string
  }
}

const DUSK_AMBER: ThemeDefinition = {
  id: 'dusk-amber',
  name: 'Dusk Amber',
  isDark: true,
  vars: {
    '--tv-bg': '#0a0a0a',
    '--tv-text': '#f5f5f4',
    '--tv-muted': '#a8a29e',
    '--tv-dim': '#78716c',
    '--tv-ink': 'rgb(255 255 255 / 0.85)',
    '--tv-ink-soft': 'rgb(255 255 255 / 0.35)',
    '--tv-overlay': 'rgb(8 8 8 / 0.68)',
    '--tv-chip': 'rgb(255 255 255 / 0.08)',
    '--tv-accent-a': '#fcd34d',
    '--tv-accent-b': '#fdba74',
    '--tv-accent-c': '#fda4af',
    '--tv-glow-rgb': '253 164 175'
  }
}

export const THEMES: ThemeDefinition[] = [
  DUSK_AMBER,
  {
    id: 'midnight-lavender',
    name: 'Midnight Lavender',
    isDark: true,
    vars: {
      '--tv-bg': '#14101c',
      '--tv-text': '#f2eef9',
      '--tv-muted': '#b7a9d1',
      '--tv-dim': '#8a7aa8',
      '--tv-ink': 'rgb(240 230 255 / 0.85)',
      '--tv-ink-soft': 'rgb(240 230 255 / 0.35)',
      '--tv-overlay': 'rgb(12 8 20 / 0.68)',
      '--tv-chip': 'rgb(255 255 255 / 0.08)',
      '--tv-accent-a': '#c4b5fd',
      '--tv-accent-b': '#f0abfc',
      '--tv-accent-c': '#fbcfe8',
      '--tv-glow-rgb': '240 171 252'
    }
  },
  {
    id: 'forest-sage',
    name: 'Forest Sage',
    isDark: true,
    vars: {
      '--tv-bg': '#0d1512',
      '--tv-text': '#eaf3ee',
      '--tv-muted': '#a3c2b2',
      '--tv-dim': '#74907f',
      '--tv-ink': 'rgb(224 245 233 / 0.85)',
      '--tv-ink-soft': 'rgb(224 245 233 / 0.35)',
      '--tv-overlay': 'rgb(6 12 10 / 0.68)',
      '--tv-chip': 'rgb(255 255 255 / 0.08)',
      '--tv-accent-a': '#a7f3d0',
      '--tv-accent-b': '#6ee7b7',
      '--tv-accent-c': '#99f6e4',
      '--tv-glow-rgb': '110 231 183'
    }
  },
  {
    id: 'cream-paper',
    name: 'Cream Paper',
    isDark: false,
    vars: {
      '--tv-bg': '#f7f1e6',
      '--tv-text': '#3a2f26',
      '--tv-muted': '#7a6a58',
      '--tv-dim': '#a3927d',
      '--tv-ink': 'rgb(58 47 38 / 0.75)',
      '--tv-ink-soft': 'rgb(58 47 38 / 0.3)',
      '--tv-overlay': 'rgb(58 47 38 / 0.15)',
      '--tv-chip': 'rgb(58 47 38 / 0.06)',
      '--tv-accent-a': '#fbcfe8',
      '--tv-accent-b': '#fed7aa',
      '--tv-accent-c': '#fde68a',
      '--tv-glow-rgb': '251 207 232'
    }
  },
  {
    id: 'sky-blue',
    name: 'Sky Blue',
    isDark: false,
    vars: {
      '--tv-bg': '#eef3fb',
      '--tv-text': '#1e293b',
      '--tv-muted': '#64748b',
      '--tv-dim': '#94a3b8',
      '--tv-ink': 'rgb(30 41 59 / 0.75)',
      '--tv-ink-soft': 'rgb(30 41 59 / 0.3)',
      '--tv-overlay': 'rgb(30 41 59 / 0.15)',
      '--tv-chip': 'rgb(30 41 59 / 0.06)',
      '--tv-accent-a': '#bae6fd',
      '--tv-accent-b': '#c4b5fd',
      '--tv-accent-c': '#fbcfe8',
      '--tv-glow-rgb': '196 181 253'
    }
  }
]

export const DEFAULT_THEME_ID = DUSK_AMBER.id

export function findTheme(id: string): ThemeDefinition {
  return THEMES.find(theme => theme.id === id) ?? DUSK_AMBER
}
