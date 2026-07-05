import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{vue,ts}', './server/**/*.{ts}', './shared/**/*.{ts}'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'ui-monospace', 'SFMono-Regular', 'monospace']
      }
    }
  }
} satisfies Config
