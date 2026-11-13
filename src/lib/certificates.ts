import 'server-only'
import crypto from 'node:crypto'
import type { Sql } from './db'
import { db } from './db'
import { config } from './config'
import { audit } from './audit'
import { getFile, readFileBuffer, storeDbFile } from './files'
import { renderCertificatePdf } from './certificate-pdf'
import { schoolToday } from './format'

// Serial: "ICS" followed by 12 random characters from an alphabet without look alike letters
// (no I, L, O or U). 60 random bits, generated on the server, never sequential.
const ALPHABET = '0123456789ABCDEFGHJKMNPQRSTVWXYZ'
export const SERIAL_PATTERN = /^ICS[0-9A-HJKMNP-TV-Z]{12}$/

export function generateSerial() {
  const bytes = crypto.randomBytes(12)
  let out = 'ICS'
  for (const b of bytes) out += ALPHABET[b % 32]
  return out
}

/** Ignore capitalization and surrounding spaces; everything else must match exactly. */
export function normalizeSerialInput(input: string) {
  return input.trim().toUpperCase()
}

export type CertificateRow = {
  id: string
  serial: string
  enrollment_id: string | null
  user_id: string | null
  course_id: string | null
  credential_type: string
  credential_label: string
  recipient_name: string
  course_title: string
  completion_date: string
  issue_date: string
  expires_on: string | null
  signature_set_id: string | null
  verification_url: string
  status: 'active' | 'revoked' | 'replaced'
  replaces_id: string | null
  replaced_by_id: string | null
  is_sample: boolean
  environment: string
  pdf_file_id: string | null
  issued_at: Date
  status_changed_at: Date | null
}

function addMonths(isoDay: string, months: number) {
  const [y, m, d] = isoDay.split('-').map(Number)
  const date = new Date(Date.UTC(y, m - 1 + months, d))
  return date.toISOString().slice(0, 10)
}

async function insertCertificate(
  tx: Sql,
  data: {
    enrollmentId: string | null
    userId: string | null
    courseId: string | null
    courseVersionId: string | null
    credentialType: string
    recipientName: string
    courseTitle: string
    completionDate: string
    issueDate: string
    replacesId?: string | null
  },
): Promise<CertificateRow> {
  const [policy] = await tx`select label, validity_months from credential_policies where credential_type = ${data.credentialType}`
  const [sig] = await tx`select id from signature_sets where is_active`
  const expires = policy?.validity_months ? addMonths(data.issueDate, policy.validity_months) : null
  for (let i = 0; i < 5; i++) {
    const serial = generateSerial()
    const taken = await tx`select 1 from certificates where serial = ${serial}`
    if (taken.length) continue
    const [row] = await tx`
      insert into certificates (serial, enrollment_id, user_id, course_id, course_version_id, credential_type, credential_label,
        recipient_name, course_title, completion_date, issue_date, expires_on, signature_set_id, verification_url,
        replaces_id, is_sample, environment)
      values (${serial}, ${data.enrollmentId}, ${data.userId}, ${data.courseId}, ${data.courseVersionId}, ${data.credentialType},
        ${policy?.label ?? 'Certificate of Completion'}, ${data.recipientName}, ${data.courseTitle}, ${data.completionDate},
        ${data.issueDate}, ${expires}, ${sig?.id ?? null}, ${`${config.verifyBaseUrl}/v/${serial}`},
        ${data.replacesId ?? null}, ${config.environment === 'staging'}, ${config.environment})
      returning *`
    return row as unknown as CertificateRow
  }
  throw new Error('Could not allocate a unique serial')
}

/** Issues the one Certificate of Completion for a completed enrollment (inside the grading transaction). */
export async function issueForEnrollment(tx: Sql, enrollmentId: string): Promise<CertificateRow> {
  const [existing] = await tx`select * from certificates where enrollment_id = ${enrollmentId} and replaces_id is null`
  if (existing) return existing as unknown as CertificateRow
  const [e] = await tx`
    select e.id, e.user_id, e.course_id, e.course_version_id, e.certificate_name, v.title, c.credential_type
    from enrollments e join course_versions v on v.id = e.course_version_id join courses c on c.id = e.course_id
    where e.id = ${enrollmentId}`
  const today = schoolToday()
  const cert = await insertCertificate(tx, {
    enrollmentId,
    userId: e.user_id,
    courseId: e.course_id,
    courseVersionId: e.course_version_id,
    credentialType: e.credential_type,
    recipientName: e.certificate_name,
    courseTitle: e.title,
    completionDate: today,
    issueDate: today,
  })
  await audit({ entityType: 'certificate', entityId: cert.id, action: 'issued', actorId: e.user_id, details: { serial: cert.serial, enrollmentId } }, tx)
  return cert
}

export async function getCertificate(id: string) {
  const rows = await db()`select * from certificates where id = ${id}`
  return (rows[0] as unknown as CertificateRow) ?? null
}

/**
 * Returns the issued PDF. The first request renders it from the frozen record and stores it;
 * every later download returns those exact bytes.
 */
export async function certificatePdf(cert: CertificateRow): Promise<Buffer> {
  if (cert.pdf_file_id) {
    const file = await getFile(cert.pdf_file_id)
    if (file) return readFileBuffer(file)
  }
  let alante: Buffer | null = null
  let justine: Buffer | null = null
  if (cert.signature_set_id) {
    const [set] = await db()`select alante_file_id, justine_file_id from signature_sets where id = ${cert.signature_set_id}`
    const a = await getFile(set?.alante_file_id)
    const j = await getFile(set?.justine_file_id)
    alante = a ? await readFileBuffer(a) : null
    justine = j ? await readFileBuffer(j) : null
  }
  const bytes = await renderCertificatePdf({
    serial: cert.serial,
    recipientName: cert.recipient_name,
    courseTitle: cert.course_title,
    completionDate: cert.completion_date,
    issueDate: cert.issue_date,
    verificationUrl: cert.verification_url,
    sample: cert.is_sample,
    issuedAt: new Date(cert.issued_at),
    alanteSignature: alante,
    justineSignature: justine,
  })
  const fileId = await storeDbFile({ kind: 'certificate', contentType: 'application/pdf', filename: `${cert.serial}.pdf`, bytes, createdBy: null })
  const updated = await db()`update certificates set pdf_file_id = ${fileId} where id = ${cert.id} and pdf_file_id is null returning id`
  if (!updated.length) {
    // Another request stored it first; return theirs so every download is identical.
    await db()`delete from files where id = ${fileId}`
    const fresh = await getCertificate(cert.id)
    return certificatePdf(fresh!)
  }
  return bytes
}

export type VerificationResult =
  | { state: 'not_valid' }
  | {
      state: 'valid' | 'expired' | 'revoked' | 'replaced'
      recipientName: string
      title: string
      credentialLabel: string
      issueDate: string
      completionDate: string
      expiresOn: string | null
      sample: boolean
    }

export async function verifySerial(input: string): Promise<VerificationResult> {
  const serial = normalizeSerialInput(input)
  if (!SERIAL_PATTERN.test(serial)) return { state: 'not_valid' }
  const rows = await db()`
    select recipient_name, course_title, credential_label, issue_date, completion_date, expires_on, status, is_sample
    from certificates where serial = ${serial}`
  const c = rows[0]
  if (!c) return { state: 'not_valid' }
  const today = schoolToday()
  let state: 'valid' | 'expired' | 'revoked' | 'replaced' = 'valid'
  if (c.status === 'revoked') state = 'revoked'
  else if (c.status === 'replaced') state = 'replaced'
  else if (c.expires_on && c.expires_on < today) state = 'expired'
  return {
    state,
    recipientName: c.recipient_name,
    title: c.course_title,
    credentialLabel: c.credential_label,
    issueDate: c.issue_date,
    completionDate: c.completion_date,
    expiresOn: c.expires_on,
    sample: c.is_sample,
  }
}

export async function revokeCertificate(staffId: string, certId: string, reason: string) {
  return db().begin(async (tx) => {
    const [c] = await tx`select id, status from certificates where id = ${certId} for update`
    if (!c) throw new Error('Certificate not found')
    if (c.status !== 'active') throw new Error('Only an active credential can be revoked')
    await tx`update certificates set status = 'revoked', status_changed_at = now() where id = ${certId}`
    await audit({ entityType: 'certificate', entityId: certId, action: 'revoked', actorId: staffId, reason }, tx)
  })
}

/** Issues a corrected replacement with a new serial and marks the original Replaced. */
export async function replaceCertificate(
  staffId: string,
  certId: string,
  changes: { recipientName: string; courseTitle: string; completionDate: string },
  reason: string,
) {
  const created = await db().begin(async (tx) => {
    const [c] = await tx`select * from certificates where id = ${certId} for update`
    if (!c) throw new Error('Certificate not found')
    if (c.status === 'replaced') throw new Error('This credential was already replaced')
    const replacement = await insertCertificate(tx, {
      enrollmentId: c.enrollment_id,
      userId: c.user_id,
      courseId: c.course_id,
      courseVersionId: c.course_version_id,
      credentialType: c.credential_type,
      recipientName: changes.recipientName,
      courseTitle: changes.courseTitle,
      completionDate: changes.completionDate,
      issueDate: schoolToday(),
      replacesId: c.id,
    })
    await tx`update certificates set status = 'replaced', replaced_by_id = ${replacement.id}, status_changed_at = now() where id = ${c.id}`
    const before = { recipientName: c.recipient_name, courseTitle: c.course_title, completionDate: c.completion_date }
    await audit({ entityType: 'certificate', entityId: c.id, action: 'replaced', actorId: staffId, reason, details: { replacementId: replacement.id, replacementSerial: replacement.serial, before, after: changes } }, tx)
    await audit({ entityType: 'certificate', entityId: replacement.id, action: 'issued_as_replacement', actorId: staffId, reason, details: { replacesSerial: c.serial } }, tx)
    return replacement
  })
  await certificatePdf(created)
  return created
}
