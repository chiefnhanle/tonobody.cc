import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    include: ['tests/unit/**/*.test.ts']
  },
  resolve: {
    alias: {
      '~': new URL('./app', import.meta.url).pathname
    }
  }
})
