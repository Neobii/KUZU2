/**
 * Prisma CLI only auto-loads `.env`, not `.env.local` (Next.js default).
 * Load `.env` then `.env.local` (local wins), then run prisma.
 */
const { spawnSync } = require('child_process')
const path = require('path')
const fs = require('fs')

function tryLoad(rel, override) {
  const p = path.join(process.cwd(), rel)
  if (fs.existsSync(p)) {
    require('dotenv').config({ path: p, override: !!override, quiet: true })
  }
}

tryLoad('.env', false)
tryLoad('.env.local', true)

const args = process.argv.slice(2)
const result = spawnSync('npx', ['prisma', ...args], {
  stdio: 'inherit',
  env: process.env,
  shell: true,
})

process.exit(result.status ?? 1)
