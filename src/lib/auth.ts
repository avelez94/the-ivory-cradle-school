import 'server-only'
import crypto from 'node:crypto'
import { cache } from 'react'
import { cookies } from 'next/headers'
import { redirect } from 'next/navigation'
import { db } from './db'

export const SESSION_COOKIE = 'ics_session'
const SESSION_DAYS = 30

export type Role = 'student' | 'staff' | 'admin'
export type User = { id: string; email: string; fullName: string; role: Role }

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase()
}

export function hashPassword(password: string) {
  const salt = crypto.randomBytes(16)
  const key = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })
  return `scrypt$16384$8$1$${salt.toString('base64')}$${key.toString('base64')}`
}

export function verifyPassword(password: string, stored: string) {
  const [alg, n, r, p, saltB64, keyB64] = stored.split('$')
  if (alg !== 'scrypt') return false
  const expected = Buffer.from(keyB64, 'base64')
  const key = crypto.scryptSync(password, Buffer.from(saltB64, 'base64'), expected.length, {
    N: Number(n),
    r: Number(r),
    p: Number(p),
  })
  return crypto.timingSafeEqual(key, expected)
}

// Keeps sign in timing similar whether or not the email exists.
let dummyHash: string | null = null
export function burnPasswordCheck(password: string) {
  dummyHash ??= hashPassword(crypto.randomBytes(12).toString('hex'))
  verifyPassword(password, dummyHash)
}

function tokenHash(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

export async function createSession(userId: string, userAgent?: string | null) {
  const token = crypto.randomBytes(32).toString('base64url')
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000)
  await db()`insert into sessions (user_id, token_hash, expires_at, user_agent)
    values (${userId}, ${tokenHash(token)}, ${expires}, ${userAgent?.slice(0, 300) ?? null})`
  const jar = await cookies()
  jar.set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    expires,
  })
}

export async function destroySession() {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (token) await db()`delete from sessions where token_hash = ${tokenHash(token)}`
  jar.delete(SESSION_COOKIE)
}

export const getCurrentUser = cache(async (): Promise<User | null> => {
  const jar = await cookies()
  const token = jar.get(SESSION_COOKIE)?.value
  if (!token) return null
  const rows = await db()`
    select u.id, u.email, u.full_name, u.role
    from sessions s join users u on u.id = s.user_id
    where s.token_hash = ${tokenHash(token)} and s.expires_at > now() and u.disabled_at is null`
  const row = rows[0]
  if (!row) return null
  return { id: row.id, email: row.email, fullName: row.full_name, role: row.role }
})

export async function requireUser(next?: string): Promise<User> {
  const user = await getCurrentUser()
  if (!user) redirect(next ? `/sign-in?next=${encodeURIComponent(next)}` : '/sign-in')
  return user
}

export const isStaff = (u: User | null) => !!u && (u.role === 'staff' || u.role === 'admin')
export const isAdmin = (u: User | null) => !!u && u.role === 'admin'

export async function requireStaff(): Promise<User> {
  const user = await requireUser('/admin')
  if (!isStaff(user)) redirect('/dashboard')
  return user
}

export async function requireAdmin(): Promise<User> {
  const user = await requireStaff()
  if (!isAdmin(user)) redirect('/admin?denied=1')
  return user
}
