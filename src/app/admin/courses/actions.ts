'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { db } from '@/lib/db'
import { requireStaff } from '@/lib/auth'
import { audit } from '@/lib/audit'
import { storeDbFile } from '@/lib/files'
import type { CourseContent, Question } from '@/lib/courses'

const lines = (v: FormDataEntryValue | null) =>
  String(v || '')
    .split('\n')
    .map((s) => s.trim())
    .filter(Boolean)

async function loadDraft(courseId: string) {
  const [c] = await db()`select id, slug, draft, status, published_version_id from courses where id = ${courseId}`
  if (!c) redirect('/admin/courses')
  return c as { id: string; slug: string; draft: CourseContent; status: string; published_version_id: string | null }
}

async function saveDraft(courseId: string, draft: CourseContent, actorId: string, action: string, details: Record<string, unknown> = {}) {
  await db()`update courses set draft = ${db().json(draft as never)}, updated_at = now() where id = ${courseId}`
  await audit({ entityType: 'course', entityId: courseId, action, actorId, details })
  revalidatePath(`/admin/courses/${courseId}`)
}

export async function createCourseAction(formData: FormData) {
  const user = await requireStaff()
  const title = String(formData.get('title') || '').trim()
  if (!title) redirect('/admin/courses?error=title')
  const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60)
  const draft: CourseContent = {
    title, category: 'Mini course', summary: '', description: '', audience: [], objectives: [], included: [
      'One video lesson with captions', 'A one page worksheet', 'A five question quiz with no timer', 'A Certificate of Completion when you score at least 4 out of 5',
    ], worksheetLabel: 'Worksheet', estimatedMinutes: 15,
    questions: Array.from({ length: 5 }, (_, i) => ({ id: `q${i + 1}`, prompt: '', options: ['', '', '', ''], correctIndex: 0, explanation: '' })),
  }
  const rows = await db()`insert into courses (slug, status, draft, sort_order) values (${slug}, 'draft', ${db().json(draft as never)}, 100)
    on conflict (slug) do nothing returning id`
  if (!rows[0]) redirect('/admin/courses?error=slug')
  await audit({ entityType: 'course', entityId: rows[0].id, action: 'created', actorId: user.id, details: { title } })
  redirect(`/admin/courses/${rows[0].id}`)
}

export async function saveDetailsAction(formData: FormData) {
  const user = await requireStaff()
  const id = String(formData.get('courseId'))
  const c = await loadDraft(id)
  const questions: Question[] = []
  for (let i = 0; i < 5; i++) {
    const options = [0, 1, 2, 3].map((n) => String(formData.get(`q${i}_opt${n}`) || '').trim()).filter(Boolean)
    const correct = Number(formData.get(`q${i}_correct`) ?? 0)
    questions.push({
      id: `q${i + 1}`,
      prompt: String(formData.get(`q${i}_prompt`) || '').trim(),
      options,
      correctIndex: Math.min(Math.max(0, correct), Math.max(0, options.length - 1)),
      explanation: String(formData.get(`q${i}_expl`) || '').trim(),
    })
  }
  const price = String(formData.get('price') || '').trim()
  const draft: CourseContent = {
    ...c.draft,
    title: String(formData.get('title') || '').trim() || c.draft.title,
    category: String(formData.get('category') || '').trim(),
    summary: String(formData.get('summary') || '').trim(),
    description: String(formData.get('description') || '').trim(),
    audience: lines(formData.get('audience')),
    objectives: lines(formData.get('objectives')),
    included: lines(formData.get('included')),
    worksheetLabel: String(formData.get('worksheetLabel') || '').trim(),
    estimatedMinutes: Number(formData.get('estimatedMinutes') || 15) || 15,
    questions,
  }
  await db()`update courses set price_cents = ${price ? Math.round(Number(price) * 100) : null}, sort_order = ${Number(formData.get('sortOrder') || 100)} where id = ${id}`
  await saveDraft(id, draft, user.id, 'draft_saved')
  redirect(`/admin/courses/${id}?saved=1`)
}

export async function saveMediaLinkAction(formData: FormData) {
  const user = await requireStaff()
  const id = String(formData.get('courseId'))
  const c = await loadDraft(id)
  const url = String(formData.get('videoUrl') || '').trim()
  const seconds = Number(formData.get('durationSeconds'))
  if (!/^https:\/\//.test(url) || !(seconds > 0)) redirect(`/admin/courses/${id}?error=video`)
  const blob = /\.blob\.vercel-storage\.com\//.test(url)
  const [f] = await db()`insert into files (kind, storage, content_type, filename, url, created_by)
    values ('video', ${blob ? 'blob' : 'url'}, 'video/mp4', ${url.split('/').pop()?.slice(0, 120) ?? 'lesson.mp4'}, ${url}, ${user.id}) returning id`
  await saveDraft(id, { ...c.draft, videoFileId: f.id, videoDurationSeconds: seconds }, user.id, 'video_set', { storage: blob ? 'blob' : 'url' })
  redirect(`/admin/courses/${id}?saved=video`)
}

export async function setDurationAction(formData: FormData) {
  const user = await requireStaff()
  const id = String(formData.get('courseId'))
  const c = await loadDraft(id)
  const seconds = Number(formData.get('durationSeconds'))
  if (!(seconds > 0)) redirect(`/admin/courses/${id}?error=duration`)
  await saveDraft(id, { ...c.draft, videoDurationSeconds: seconds }, user.id, 'video_duration_set', { seconds })
  redirect(`/admin/courses/${id}?saved=video`)
}

async function uploadSmallFile(formData: FormData, field: string, kind: 'captions' | 'worksheet', types: string[], maxBytes: number, userId: string) {
  const file = formData.get(field)
  if (!(file instanceof File) || file.size === 0) return null
  if (file.size > maxBytes) return 'too_large'
  const type = file.type || (file.name.endsWith('.vtt') ? 'text/vtt' : '')
  if (!types.includes(type)) return 'type'
  const bytes = Buffer.from(await file.arrayBuffer())
  if (kind === 'worksheet' && bytes.subarray(0, 5).toString() !== '%PDF-') return 'type'
  if (kind === 'captions' && !bytes.subarray(0, 12).toString().replace(/^﻿/, '').startsWith('WEBVTT')) return 'type'
  return storeDbFile({ kind, contentType: kind === 'captions' ? 'text/vtt' : 'application/pdf', filename: file.name.slice(0, 120), bytes, createdBy: userId })
}

export async function uploadCaptionsAction(formData: FormData) {
  const user = await requireStaff()
  const id = String(formData.get('courseId'))
  const c = await loadDraft(id)
  const fileId = await uploadSmallFile(formData, 'captions', 'captions', ['text/vtt'], 1_000_000, user.id)
  if (!fileId || fileId === 'too_large' || fileId === 'type') redirect(`/admin/courses/${id}?error=captions`)
  await saveDraft(id, { ...c.draft, captionsFileId: fileId }, user.id, 'captions_uploaded')
  redirect(`/admin/courses/${id}?saved=captions`)
}

export async function uploadWorksheetAction(formData: FormData) {
  const user = await requireStaff()
  const id = String(formData.get('courseId'))
  const c = await loadDraft(id)
  const fileId = await uploadSmallFile(formData, 'worksheet', 'worksheet', ['application/pdf'], 4_000_000, user.id)
  if (!fileId || fileId === 'too_large' || fileId === 'type') redirect(`/admin/courses/${id}?error=worksheet`)
  await saveDraft(id, { ...c.draft, worksheetFileId: fileId }, user.id, 'worksheet_uploaded')
  redirect(`/admin/courses/${id}?saved=worksheet`)
}

/** What still blocks publishing. Empty means ready. */
export async function publishProblems(d: CourseContent): Promise<string[]> {
  const p: string[] = []
  if (!d.title) p.push('Add a title.')
  if (!d.summary) p.push('Add a short summary for the catalog card.')
  if (!d.description) p.push('Add a description.')
  if (!d.audience?.length) p.push('Add who the course is for.')
  if (!d.objectives?.length) p.push('Add what students will learn.')
  if (!d.videoFileId || !d.videoDurationSeconds) p.push('Add the lesson video and its length.')
  if (!d.captionsFileId) p.push('Add captions (WebVTT).')
  if (!d.worksheetFileId) p.push('Upload the one page worksheet PDF.')
  const qs = d.questions ?? []
  if (qs.length !== 5) p.push('The quiz needs exactly five questions.')
  qs.forEach((q, i) => {
    if (!q.prompt || q.options.length < 2) p.push(`Question ${i + 1} needs a prompt and at least two answers.`)
    else if (q.correctIndex < 0 || q.correctIndex >= q.options.length) p.push(`Question ${i + 1} needs a correct answer.`)
  })
  return p
}

export async function publishAction(formData: FormData) {
  const user = await requireStaff()
  const id = String(formData.get('courseId'))
  const c = await loadDraft(id)
  if ((await publishProblems(c.draft)).length) redirect(`/admin/courses/${id}?error=publish`)
  const d = c.draft
  await db().begin(async (tx) => {
    const [{ n }] = await tx`select coalesce(max(version_no), 0) + 1 as n from course_versions where course_id = ${id}`
    const [v] = await tx`
      insert into course_versions (course_id, version_no, title, content, video_file_id, video_duration_seconds, captions_file_id, worksheet_file_id, published_by)
      values (${id}, ${n}, ${d.title}, ${tx.json(d as never)}, ${d.videoFileId ?? null}, ${d.videoDurationSeconds ?? 0}, ${d.captionsFileId ?? null}, ${d.worksheetFileId ?? null}, ${user.id})
      returning id`
    await tx`update courses set published_version_id = ${v.id}, status = 'published', updated_at = now() where id = ${id}`
    await tx`insert into audit_events (entity_type, entity_id, action, actor_id, details) values ('course', ${id}, 'published', ${user.id}, ${tx.json({ versionNo: n })})`
  })
  revalidatePath('/courses')
  redirect(`/admin/courses/${id}?saved=published`)
}

export async function setVisibilityAction(formData: FormData) {
  const user = await requireStaff()
  const id = String(formData.get('courseId'))
  const status = String(formData.get('status'))
  if (!['draft', 'preview', 'archived'].includes(status)) redirect(`/admin/courses/${id}`)
  await db()`update courses set status = ${status}, updated_at = now() where id = ${id}`
  await audit({ entityType: 'course', entityId: id, action: `set_${status}`, actorId: user.id })
  revalidatePath('/courses')
  redirect(`/admin/courses/${id}?saved=visibility`)
}

export async function republishStatusAction(formData: FormData) {
  const user = await requireStaff()
  const id = String(formData.get('courseId'))
  const rows = await db()`update courses set status = 'published' where id = ${id} and published_version_id is not null returning id`
  if (rows.length) await audit({ entityType: 'course', entityId: id, action: 'set_published', actorId: user.id })
  redirect(`/admin/courses/${id}?saved=visibility`)
}

/** Records a video uploaded straight from the browser to private Blob storage. */
export async function registerUploadedVideoAction(courseId: string, url: string, durationSeconds: number, filename: string) {
  const user = await requireStaff()
  const c = await loadDraft(courseId)
  if (!/^https:\/\/[a-z0-9]+\.private\.blob\.vercel-storage\.com\//.test(url) && !/^https:\/\/[a-z0-9.]+\.blob\.vercel-storage\.com\//.test(url)) {
    throw new Error('Unexpected upload location')
  }
  const [f] = await db()`insert into files (kind, storage, content_type, filename, url, created_by)
    values ('video', 'blob', 'video/mp4', ${filename.slice(0, 120)}, ${url}, ${user.id}) returning id`
  await saveDraft(courseId, { ...c.draft, videoFileId: f.id, videoDurationSeconds: Math.round(durationSeconds * 100) / 100 }, user.id, 'video_uploaded')
  return { ok: true }
}
