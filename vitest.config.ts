import { defineConfig } from 'vitest/config'
import path from 'path'

export default defineConfig({
  test: {
    environment: 'node',
    include: ['__tests__/**/*.test.{ts,tsx}'],
    environmentMatchGlobs: [
      ['**/__tests__/**/*.test.tsx', 'jsdom'],
    ],
    exclude: ['scripts/**'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, '.'),
    },
  },
})
