import type { Config } from 'tailwindcss'

export default {
  content: ['./app/**/*.{vue,ts}', './server/**/*.ts', './shared/**/*.ts'],
  darkMode: 'class',
  theme: {
    extend: {
      fontFamily: {
        sans: ['Patrick Hand', 'cursive'],
        mono: ['Patrick Hand', 'cursive'],
        doodle: ['Patrick Hand', 'cursive']
      }
    }
  }
} satisfies Config
