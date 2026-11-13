'use server'

import { headers } from 'next/headers'
import { redirect } from 'next/navigation'
import { db, hasDatabase } from '@/lib/db'
import {
  burnPasswordCheck, createSession, destroySession, getCurrentUser, hashPassword, normalizeEmail, verifyPassword,
} from '@/lib/auth'
import { clientIpHash, rateLimit } from '@/lib/security'

export type AuthState = { error?: string; ok?: string; values?: Record<string, string> } | null

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function safeNext(raw: FormDataEntryValue | null) {
  const next = String(raw || '')
  return next.startsWith('/') && !next.startsWith('//') && !next.startsWith('/\\') ? next : '/dashboard'
}

export async function registerAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const fullName = String(formData.get('fullName') || '').trim().replace(/\s+/g, ' ')
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const values = { fullName, email }
  if (!hasDatabase()) return { error: 'Student accounts are opening soon.', values }
  if (fullName.length < 2 || fullName.length > 120) return { error: 'Enter your full name.', values }
  if (!EMAIL.test(email) || email.length > 200) return { error: 'Enter a valid email address.', values }
  if (password.length < 10) return { error: 'Use a password with at least 10 characters.', values }
  if (password.length > 200) return { error: 'That password is too long.', values }
  if (!(await rateLimit(`register:${await clientIpHash()}`, 10, 3600))) return { error: 'Too many attempts. Try again later.', values }

  const rows = await db()`
    insert into users (email, email_normalized, password_hash, full_name)
    values (${email}, ${normalizeEmail(email)}, ${hashPassword(password)}, ${fullName})
    on conflict (email_normalized) do nothing returning id`
  if (!rows[0]) return { error: 'An account already uses that email. Sign in instead, or use a different email.', values }
  await createSession(rows[0].id, (await headers()).get('user-agent'))
  redirect(safeNext(formData.get('next')))
}

export async function signInAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = String(formData.get('email') || '').trim()
  const password = String(formData.get('password') || '')
  const values = { email }
  if (!hasDatabase()) return { error: 'Student accounts are opening soon.', values }
  const ip = await clientIpHash()
  const okIp = await rateLimit(`signin-ip:${ip}`, 30, 900)
  const okAcct = await rateLimit(`signin-acct:${normalizeEmail(email)}`, 10, 900)
  if (!okIp || !okAcct) return { error: 'Too many sign in attempts. Wait a few minutes and try again.', values }

  const [user] = await db()`select id, password_hash, disabled_at from users where email_normalized = ${normalizeEmail(email)}`
  if (!user) {
    burnPasswordCheck(password)
    return { error: 'That email and password do not match an account.', values }
  }
  if (!verifyPassword(password, user.password_hash) || user.disabled_at) {
    return { error: 'That email and password do not match an account.', values }
  }
  await createSession(user.id, (await headers()).get('user-agent'))
  redirect(safeNext(formData.get('next')))
}

export async function signOutAction() {
  await destroySession()
  redirect('/')
}

export async function updateProfileAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')
  const fullName = String(formData.get('fullName') || '').trim().replace(/\s+/g, ' ')
  if (fullName.length < 2 || fullName.length > 120) return { error: 'Enter your full name.' }
  await db()`update users set full_name = ${fullName} where id = ${user.id}`
  return { ok: 'Profile saved. Certificates you already earned keep the name printed on them.' }
}

export async function changePasswordAction(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')
  const current = String(formData.get('current') || '')
  const next = String(formData.get('password') || '')
  const [row] = await db()`select password_hash from users where id = ${user.id}`
  if (!verifyPassword(current, row.password_hash)) return { error: 'Your current password is not correct.' }
  if (next.length < 10 || next.length > 200) return { error: 'Use a new password with at least 10 characters.' }
  await db()`update users set password_hash = ${hashPassword(next)} where id = ${user.id}`
  return { ok: 'Password changed.' }
}
