import 'server-only'
import crypto from 'node:crypto'
import { headers } from 'next/headers'
import { db } from './db'
import { config } from './config'

export async function clientIpHash() {
  const h = await headers()
  const ip = (h.get('x-forwarded-for') || '').split(',')[0].trim() || h.get('x-real-ip') || 'local'
  return crypto.createHmac('sha256', config.rateLimitSalt).update(ip).digest('hex').slice(0, 32)
}

/** Fixed window rate limit stored in Postgres. Returns true when the request may proceed. */
export async function rateLimit(bucket: string, limit: number, windowSeconds: number) {
  const windowStart = new Date(Math.floor(Date.now() / (windowSeconds * 1000)) * windowSeconds * 1000)
  const [row] = await db()`
    insert into rate_limits (bucket, window_start, hits) values (${bucket}, ${windowStart}, 1)
    on conflict (bucket, window_start) do update set hits = rate_limits.hits + 1
    returning hits`
  if (Math.random() < 0.02) await db()`delete from rate_limits where window_start < now() - interval '1 day'`
  return row.hits <= limit
}

/** Route handlers that change state only accept requests from this site. */
export function sameOrigin(req: Request) {
  const fetchSite = req.headers.get('sec-fetch-site')
  if (fetchSite && fetchSite !== 'same-origin') return false
  const origin = req.headers.get('origin')
  if (!origin) return fetchSite === 'same-origin'
  const host = req.headers.get('x-forwarded-host') || req.headers.get('host')
  try {
    return new URL(origin).host === host
  } catch {
    return false
  }
}

export function json(data: unknown, status = 200) {
  return Response.json(data, { status, headers: { 'Cache-Control': 'no-store' } })
}
