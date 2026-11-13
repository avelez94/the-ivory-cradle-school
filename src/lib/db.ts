import postgres from 'postgres'

type Root = ReturnType<typeof postgres>
/** A query function: the pool or an open transaction. */
export type Sql = postgres.TransactionSql
const globalForDb = globalThis as unknown as { __schoolSql?: Root }

function create(): Root {
  const url = process.env.DATABASE_URL
  if (!url) throw new Error('DATABASE_URL is not set')
  const pooled = /:6543\//.test(url) || /pooler|pgbouncer=true/.test(url)
  return postgres(url, {
    max: process.env.VERCEL ? 3 : 10,
    idle_timeout: 20,
    prepare: !pooled, // transaction poolers do not support prepared statements
    onnotice: () => {},
    types: {
      numeric: { to: 1700, from: [1700], serialize: (x: unknown) => String(x), parse: (x: string) => Number(x) },
      // Calendar dates stay as YYYY-MM-DD strings so certificate dates never shift with time zones.
      date: { to: 1082, from: [1082], serialize: (x: unknown) => String(x), parse: (x: string) => x },
    },
  })
}

export function db(): Root {
  globalForDb.__schoolSql ??= create()
  return globalForDb.__schoolSql
}
