// Seeds staging content. Safe to run more than once: existing rows are left alone.
// Env: DATABASE_URL, SITE_URL, SCHOOL_ENVIRONMENT (staging|production),
//      SEED_ADMIN_EMAIL, SEED_ADMIN_PASSWORD, SEED_ADMIN_NAME (optional admin account)
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import postgres from 'postgres'
import { FIRST_OVERNIGHT_SHIFT, PREVIEW_COURSES } from '../db/seed/courses.mjs'

const url = process.env.DATABASE_URL
if (!url) { console.error('DATABASE_URL is required'); process.exit(1) }
const root = path.join(path.dirname(new URL(import.meta.url).pathname), '..')
const siteUrl = (process.env.SITE_URL || 'http://localhost:3000').replace(/\/$/, '')
const environment = process.env.SCHOOL_ENVIRONMENT || 'staging'
const sql = postgres(url, { max: 1, onnotice: () => {}, prepare: !/:6543\//.test(url) })

export function hashPassword(password) {
  const salt = crypto.randomBytes(16)
  const key = crypto.scryptSync(password, salt, 64, { N: 16384, r: 8, p: 1 })
  return `scrypt$16384$8$1$${salt.toString('base64')}$${key.toString('base64')}`
}

async function bundledFile(kind, relPath, contentType) {
  const abs = path.join(root, 'private-assets', relPath)
  const buf = fs.readFileSync(abs)
  const sha = crypto.createHash('sha256').update(buf).digest('hex')
  const [existing] = await sql`select id from files where storage = 'bundled' and path = ${relPath} and sha256 = ${sha}`
  if (existing) return existing.id
  const [row] = await sql`
    insert into files (kind, storage, content_type, filename, size_bytes, sha256, path)
    values (${kind}, 'bundled', ${contentType}, ${path.basename(relPath)}, ${buf.length}, ${sha}, ${relPath})
    returning id`
  return row.id
}

await sql.begin(async (tx) => {
  await tx`insert into settings (key, value) values
    ('payments_enabled', 'false'), ('staging_enrollment_enabled', 'true'), ('flagship_enrollment_enabled', 'false')
    on conflict (key) do nothing`
  await tx`insert into credential_policies (credential_type, label, validity_months) values
    ('certificate_of_completion', 'Certificate of Completion', null)
    on conflict (credential_type) do nothing`
})

// Signature set v1 from the supplied artwork.
// The artwork is kept out of public repositories. When it is missing, administrators upload it
// on the staff Signatures page instead, and certificates show labeled placeholders until then.
const sigFiles = ['signatures/alante-velez-v1.png', 'signatures/justine-akinlami-v1.png']
const haveArtwork = sigFiles.every((f) => fs.existsSync(path.join(root, 'private-assets', f)))
let [sigSet] = await sql`select id from signature_sets where label = 'Founders 2026 (v1)'`
if (!sigSet && !haveArtwork) console.log('signature artwork not bundled: upload it on /admin/signatures')
if (!sigSet && haveArtwork) {
  const a = await bundledFile('signature', 'signatures/alante-velez-v1.png', 'image/png')
  const j = await bundledFile('signature', 'signatures/justine-akinlami-v1.png', 'image/png')
  const hasActive = (await sql`select 1 from signature_sets where is_active`).length > 0
  ;[sigSet] = await sql`
    insert into signature_sets (label, alante_file_id, justine_file_id, is_active)
    values ('Founders 2026 (v1)', ${a}, ${j}, ${!hasActive}) returning id`
  console.log('signature set v1 created')
}

// Courses.
const media = 'course-media/first-overnight-shift'
const manifest = JSON.parse(fs.readFileSync(path.join(root, 'private-assets', media, 'manifest.json'), 'utf8'))
const videoId = await bundledFile('video', `${media}/lesson.mp4`, 'video/mp4')
const captionsId = await bundledFile('captions', `${media}/lesson.en.vtt`, 'text/vtt')
const worksheetId = await bundledFile('worksheet', `${media}/first-shift-checklist.pdf`, 'application/pdf')

async function upsertCourse(c, files) {
  const [existing] = await sql`select id, published_version_id from courses where slug = ${c.slug}`
  if (existing) return existing
  const draft = { ...c.draft, ...(files || {}) }
  const [course] = await sql`
    insert into courses (slug, status, sort_order, draft)
    values (${c.slug}, ${c.status}, ${c.sortOrder}, ${sql.json(draft)}) returning id, published_version_id`
  console.log('course created', c.slug)
  return course
}

const fosFiles = { videoFileId: videoId, videoDurationSeconds: manifest.durationSeconds, captionsFileId: captionsId, worksheetFileId: worksheetId }
const fos = await upsertCourse(FIRST_OVERNIGHT_SHIFT, fosFiles)
let versionId = fos.published_version_id
if (!versionId) {
  const content = { ...FIRST_OVERNIGHT_SHIFT.draft, ...fosFiles }
  const [v] = await sql`
    insert into course_versions (course_id, version_no, title, content, video_file_id, video_duration_seconds, captions_file_id, worksheet_file_id)
    values (${fos.id}, 1, ${content.title}, ${sql.json(content)}, ${videoId}, ${manifest.durationSeconds}, ${captionsId}, ${worksheetId})
    returning id`
  versionId = v.id
  await sql`update courses set published_version_id = ${versionId} where id = ${fos.id}`
  console.log('published version 1 of', FIRST_OVERNIGHT_SHIFT.slug)
}
for (const c of PREVIEW_COURSES) await upsertCourse(c)

// Sample credentials for testing public verification. Fixed serials so they can be shared.
const samples = [
  { serial: 'ICS7KQ4M2XD9PRT', name: 'Jordan Taylor', completion: '2026-11-12', issue: '2026-11-12', expires: null, status: 'active' },
  { serial: 'ICSE3VN8HC5WQ2A', name: 'Morgan Ellis', completion: '2024-06-03', issue: '2024-06-03', expires: '2025-06-03', status: 'active' },
  { serial: 'ICSR6TJ9BK4ZM7F', name: 'Casey Brooks', completion: '2026-10-02', issue: '2026-10-02', expires: null, status: 'revoked' },
  { serial: 'ICSP2GH5WN8DX3K', name: 'Avery Johnson', completion: '2026-10-20', issue: '2026-10-20', expires: null, status: 'replaced' },
  { serial: 'ICSV9MC3QT6YB4J', name: 'Avery Johnston', completion: '2026-10-20', issue: '2026-10-22', expires: null, status: 'active', replaces: 'ICSP2GH5WN8DX3K' },
]
for (const s of samples) {
  const [exists] = await sql`select id from certificates where serial = ${s.serial}`
  if (exists) continue
  const replaces = s.replaces ? (await sql`select id from certificates where serial = ${s.replaces}`)[0]?.id : null
  const [row] = await sql`
    insert into certificates (serial, course_id, course_version_id, credential_type, credential_label, recipient_name, course_title,
      completion_date, issue_date, expires_on, signature_set_id, verification_url, status, replaces_id, is_sample, environment,
      status_changed_at)
    values (${s.serial}, ${fos.id}, ${versionId}, 'certificate_of_completion', 'Certificate of Completion', ${s.name},
      'The First Overnight Shift', ${s.completion}, ${s.issue}, ${s.expires}, ${sigSet?.id ?? (await sql`select id from signature_sets where is_active`)[0]?.id ?? null}, ${`${siteUrl}/v/${s.serial}`},
      ${s.status}, ${replaces}, true, ${environment}, ${s.status === 'active' ? null : sql`now()`})
    returning id`
  if (replaces) await sql`update certificates set replaced_by_id = ${row.id} where id = ${replaces}`
  await sql`insert into audit_events (entity_type, entity_id, action, reason, details)
    values ('certificate', ${row.id}, 'sample_seeded', 'Staging sample for verification testing', ${sql.json({ status: s.status })})`
}

// Sample certificates seeded before the artwork was uploaded pick up the active signatures.
const attached = await sql`
  update certificates set signature_set_id = (select id from signature_sets where is_active), pdf_file_id = null
  where is_sample and signature_set_id is null and exists (select 1 from signature_sets where is_active)
  returning serial`
if (attached.length) console.log('sample certificates now use the active signatures:', attached.length)

if (process.env.SEED_ADMIN_EMAIL && process.env.SEED_ADMIN_PASSWORD) {
  const email = process.env.SEED_ADMIN_EMAIL.trim()
  const [u] = await sql`select id from users where email_normalized = ${email.toLowerCase()}`
  if (!u) {
    await sql`insert into users (email, email_normalized, password_hash, full_name, role)
      values (${email}, ${email.toLowerCase()}, ${hashPassword(process.env.SEED_ADMIN_PASSWORD)}, ${process.env.SEED_ADMIN_NAME || 'School Admin'}, 'admin')`
    console.log('admin account created for', email)
  }
}

await sql.end()
console.log('seed complete')
