// Applies db/migrations/*.sql in order, once each. Usage: DATABASE_URL=... node scripts/migrate.mjs
import fs from 'node:fs'
import path from 'node:path'
import postgres from 'postgres'

const url = process.env.DATABASE_URL
if (!url) { console.error('DATABASE_URL is required'); process.exit(1) }
const sql = postgres(url, { max: 1, onnotice: () => {}, prepare: !/:6543\//.test(url) })
const dir = path.join(path.dirname(new URL(import.meta.url).pathname), '..', 'db', 'migrations')

await sql`create table if not exists schema_migrations (name text primary key, applied_at timestamptz not null default now())`
const done = new Set((await sql`select name from schema_migrations`).map((r) => r.name))
for (const file of fs.readdirSync(dir).filter((f) => f.endsWith('.sql')).sort()) {
  if (done.has(file)) continue
  const body = fs.readFileSync(path.join(dir, file), 'utf8')
  await sql.begin(async (tx) => {
    await tx.unsafe(body)
    await tx`insert into schema_migrations (name) values (${file})`
  })
  console.log('applied', file)
}
await sql.end()
