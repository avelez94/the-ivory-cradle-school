'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { normalizeEmail, requireAdmin, requireStaff } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { grantViewingAccommodation } from '@/lib/viewing'
import { replaceCertificate, revokeCertificate } from '@/lib/certificates'
import { storeDbFile } from '@/lib/files'

export async function accommodationAction(formData: FormData) {
  const user = await requireStaff()
  const id = String(formData.get('enrollmentId'))
  const reason = String(formData.get('reason') || '').trim()
  if (reason.length < 5) redirect(`/admin/students/${id}`)
  await grantViewingAccommodation(user.id, id, reason)
  redirect(`/admin/students/${id}?saved=1`)
}

// Credential corrections, revocations and reissues are limited to administrators.
export async function revokeAction(formData: FormData) {
  const user = await requireAdmin()
  const id = String(formData.get('certificateId'))
  const reason = String(formData.get('reason') || '').trim()
  if (reason.length < 5) redirect(`/admin/certificates/${id}?error=reason`)
  try {
    await revokeCertificate(user.id, id, reason)
  } catch {
    redirect(`/admin/certificates/${id}?error=state`)
  }
  redirect(`/admin/certificates/${id}?saved=revoked`)
}

export async function replaceAction(formData: FormData) {
  const user = await requireAdmin()
  const id = String(formData.get('certificateId'))
  const reason = String(formData.get('reason') || '').trim()
  const recipientName = String(formData.get('recipientName') || '').trim().replace(/\s+/g, ' ')
  const courseTitle = String(formData.get('courseTitle') || '').trim()
  const completionDate = String(formData.get('completionDate') || '')
  if (reason.length < 5 || recipientName.length < 2 || !courseTitle || !/^\d{4}-\d{2}-\d{2}$/.test(completionDate)) {
    redirect(`/admin/certificates/${id}?error=replace`)
  }
  let newId = ''
  try {
    newId = (await replaceCertificate(user.id, id, { recipientName, courseTitle, completionDate }, reason)).id
  } catch {
    redirect(`/admin/certificates/${id}?error=state`)
  }
  redirect(`/admin/certificates/${newId}?saved=replacement`)
}

export async function uploadSignatureSetAction(formData: FormData) {
  const user = await requireAdmin()
  const label = String(formData.get('label') || '').trim()
  const files: string[] = []
  for (const field of ['alante', 'justine']) {
    const f = formData.get(field)
    if (!(f instanceof File) || f.size === 0 || f.size > 3_000_000) redirect('/admin/signatures?error=file')
    const bytes = Buffer.from(await (f as File).arrayBuffer())
    if (bytes.subarray(1, 4).toString() !== 'PNG') redirect('/admin/signatures?error=file')
    files.push(await storeDbFile({ kind: 'signature', contentType: 'image/png', filename: (f as File).name.slice(0, 120), bytes, createdBy: user.id }))
  }
  if (!label) redirect('/admin/signatures?error=label')
  await db().begin(async (tx) => {
    await tx`update signature_sets set is_active = false where is_active`
    const [s] = await tx`insert into signature_sets (label, alante_file_id, justine_file_id, is_active, created_by) values (${label}, ${files[0]}, ${files[1]}, true, ${user.id}) returning id`
    await tx`insert into audit_events (entity_type, entity_id, action, actor_id, details) values ('signature_set', ${s.id}, 'created_and_activated', ${user.id}, ${tx.json({ label })})`
  })
  redirect('/admin/signatures?saved=1')
}

export async function activateSignatureSetAction(formData: FormData) {
  const user = await requireAdmin()
  const id = String(formData.get('setId'))
  await db().begin(async (tx) => {
    await tx`update signature_sets set is_active = false where is_active`
    await tx`update signature_sets set is_active = true where id = ${id}`
    await tx`insert into audit_events (entity_type, entity_id, action, actor_id) values ('signature_set', ${id}, 'activated', ${user.id})`
  })
  redirect('/admin/signatures?saved=1')
}

export async function savePolicyAction(formData: FormData) {
  const user = await requireAdmin()
  const type = String(formData.get('credentialType') || '').trim().toLowerCase().replace(/[^a-z0-9_]/g, '_')
  const label = String(formData.get('label') || '').trim()
  const monthsRaw = String(formData.get('validityMonths') || '').trim()
  const months = monthsRaw ? Number(monthsRaw) : null
  if (!type || !label || (months !== null && !(months > 0))) redirect('/admin/settings?error=policy')
  await db()`insert into credential_policies (credential_type, label, validity_months, updated_by, updated_at)
    values (${type}, ${label}, ${months}, ${user.id}, now())
    on conflict (credential_type) do update set label = excluded.label, validity_months = excluded.validity_months, updated_by = excluded.updated_by, updated_at = now()`
  await audit({ entityType: 'credential_policy', action: 'saved', actorId: user.id, details: { type, label, months } })
  redirect('/admin/settings?saved=policy')
}

export async function saveSettingsAction(formData: FormData) {
  const user = await requireAdmin()
  for (const key of ['staging_enrollment_enabled', 'payments_enabled', 'flagship_enrollment_enabled']) {
    const value = formData.get(key) === 'on'
    await db()`insert into settings (key, value, updated_by, updated_at) values (${key}, ${db().json(value)}, ${user.id}, now())
      on conflict (key) do update set value = excluded.value, updated_by = excluded.updated_by, updated_at = now()`
  }
  await audit({ entityType: 'settings', action: 'saved', actorId: user.id })
  revalidatePath('/')
  redirect('/admin/settings?saved=settings')
}

export async function setRoleAction(formData: FormData) {
  const user = await requireAdmin()
  const email = normalizeEmail(String(formData.get('email') || ''))
  const role = String(formData.get('role') || '')
  if (!['student', 'staff', 'admin'].includes(role)) redirect('/admin/staff?error=role')
  const [target] = await db()`select id from users where email_normalized = ${email}`
  if (!target) redirect('/admin/staff?error=missing')
  if (target.id === user.id && role !== 'admin') redirect('/admin/staff?error=self')
  await db()`update users set role = ${role} where id = ${target.id}`
  await audit({ entityType: 'user', entityId: target.id, action: `role_${role}`, actorId: user.id })
  redirect('/admin/staff?saved=1')
}

export async function markMessageHandledAction(formData: FormData) {
  const user = await requireStaff()
  const id = String(formData.get('messageId'))
  await db()`update contact_messages set handled_at = now(), handled_by = ${user.id} where id = ${id}`
  redirect('/admin/messages')
}
