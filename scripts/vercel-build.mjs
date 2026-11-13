// Vercel build: when a database is connected, apply migrations and seed staging content first.
import { execFileSync } from 'node:child_process'

const run = (args) => execFileSync(process.execPath, args, { stdio: 'inherit' })
if (process.env.DATABASE_URL) {
  run(['scripts/migrate.mjs'])
  run(['scripts/seed.mjs'])
} else {
  console.log('DATABASE_URL is not set: skipping migrations and seed. Pages need a database to load.')
}
execFileSync(process.execPath, ['node_modules/next/dist/bin/next', 'build'], { stdio: 'inherit' })
