import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { execSync } from 'child_process'

const commitTime = execSync('git log -1 --format=%cI').toString().trim()

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/watersort/',
  define: {
    __COMMIT_TIME__: JSON.stringify(commitTime),
  },
  build: {
    outDir: 'docs',
  },
})
