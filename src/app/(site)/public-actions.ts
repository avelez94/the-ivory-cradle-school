'use server'

import { db } from '@/lib/db'
import { getCurrentUser } from '@/lib/auth'
import { clientIpHash, rateLimit } from '@/lib/security'

export type FormState = { ok?: boolean; message?: string; error?: string } | null

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function joinInterestList(_prev: FormState, formData: FormData): Promise<FormState> {
  const email = String(formData.get('email') || '').trim()
  const name = String(formData.get('name') || '').trim().slice(0, 120)
  if (!EMAIL.test(email) || email.length > 200) return { error: 'Enter a valid email address.' }
  if (!(await rateLimit(`interest:${await clientIpHash()}`, 10, 3600))) return { error: 'Too many requests. Try again later.' }
  await db()`insert into interest_signups (program, name, email) values ('newborn_care_specialist', ${name || null}, ${email.toLowerCase()})
    on conflict (program, email) do nothing`
  return { ok: true, message: 'Thank you. We will email you when enrollment details are ready.' }
}

const TOPICS = ['General question', 'Accessible alternative for a lesson', 'Certificate correction', 'Course question', 'Technical problem']

export async function sendContactMessage(_prev: FormState, formData: FormData): Promise<FormState> {
  const name = String(formData.get('name') || '').trim().slice(0, 120)
  const email = String(formData.get('email') || '').trim()
  const topic = String(formData.get('topic') || '')
  const message = String(formData.get('message') || '').trim()
  if (!name) return { error: 'Enter your name.' }
  if (!EMAIL.test(email)) return { error: 'Enter a valid email address.' }
  if (!TOPICS.includes(topic)) return { error: 'Choose a topic.' }
  if (message.length < 5 || message.length > 5000) return { error: 'Enter a message (up to 5,000 characters).' }
  if (!(await rateLimit(`contact:${await clientIpHash()}`, 8, 3600))) return { error: 'Too many messages. Try again later.' }
  const user = await getCurrentUser()
  await db()`insert into contact_messages (name, email, topic, message, user_id) values (${name}, ${email}, ${topic}, ${message}, ${user?.id ?? null})`
  return { ok: true, message: 'Thank you. Your message reached the school team, and we will reply by email.' }
}
