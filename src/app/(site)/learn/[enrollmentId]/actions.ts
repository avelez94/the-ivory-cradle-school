'use server'

import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth'
import { db } from '@/lib/db'
import { startRewatch, NotFoundError } from '@/lib/viewing'

export async function startRewatchAction(formData: FormData) {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')
  const enrollmentId = String(formData.get('enrollmentId') || '')
  try {
    await startRewatch(user.id, enrollmentId)
  } catch (e) {
    if (e instanceof NotFoundError) redirect('/dashboard')
    throw e
  }
  redirect(`/learn/${enrollmentId}`)
}

export type NameState = { error?: string } | null

export async function confirmCertificateNameAction(_prev: NameState, formData: FormData): Promise<NameState> {
  const user = await getCurrentUser()
  if (!user) redirect('/sign-in')
  const enrollmentId = String(formData.get('enrollmentId') || '')
  const name = String(formData.get('certificateName') || '').trim().replace(/\s+/g, ' ')
  if (name.length < 2 || name.length > 80) return { error: 'Enter the name to print, between 2 and 80 characters.' }
  if (formData.get('ack') !== 'yes') return { error: 'Confirm that you understand who can see your certificate details.' }
  const rows = await db()`
    update enrollments set certificate_name = ${name}, certificate_name_confirmed_at = now()
    where id = ${enrollmentId} and user_id = ${user.id} and status = 'active'
    returning id`
  if (!rows.length) return { error: 'This name can no longer be changed.' }
  redirect(`/learn/${enrollmentId}/quiz`)
}
