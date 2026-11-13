import 'server-only'
import { db, hasDatabase } from './db'
import { COURSES } from '../../db/seed/courses.mjs'

export type Question = { id: string; prompt: string; options: string[]; correctIndex: number; explanation?: string }

export type CourseContent = {
  title: string
  category: string
  summary: string
  description: string
  audience: string[]
  objectives: string[]
  included: string[]
  worksheetLabel: string
  estimatedMinutes?: number
  scope?: string
  image?: string
  imageAlt?: string
  resources?: { label: string; url: string }[]
  questions: Question[]
  videoFileId?: string | null
  videoDurationSeconds?: number | null
  captionsFileId?: string | null
  worksheetFileId?: string | null
}

/** Quiz questions as students may see them. Answer keys and explanations never leave the server. */
export type StudentQuestion = { id: string; prompt: string; options: string[] }
export function studentQuestions(content: CourseContent): StudentQuestion[] {
  return content.questions.map((q) => ({ id: q.id, prompt: q.prompt, options: [...q.options] }))
}

export type CatalogCourse = {
  id: string
  slug: string
  status: 'draft' | 'preview' | 'published' | 'archived'
  sortOrder: number
  priceCents: number | null
  content: CourseContent // published content when live, draft content for previews
  publishedVersionId: string | null
}

function toCatalog(row: Record<string, unknown>): CatalogCourse {
  return {
    id: row.id as string,
    slug: row.slug as string,
    status: row.status as CatalogCourse['status'],
    sortOrder: row.sort_order as number,
    priceCents: (row.price_cents as number | null) ?? null,
    content: ((row.version_content as CourseContent | null) ?? (row.draft as CourseContent)) as CourseContent,
    publishedVersionId: (row.published_version_id as string | null) ?? null,
  }
}

/** Built in catalog used before a database is connected, so the public pages still render. */
function fallbackCatalog(): CatalogCourse[] {
  return COURSES.map((c) => ({
    id: c.slug,
    slug: c.slug,
    status: c.status as CatalogCourse['status'],
    sortOrder: c.sortOrder,
    priceCents: (c as { priceCents?: number }).priceCents ?? null,
    content: c.draft as CourseContent,
    publishedVersionId: null,
  }))
}

/** Courses shown publicly: published (enrollable) and preview (catalog only). */
export async function listCatalog(): Promise<CatalogCourse[]> {
  if (!hasDatabase()) return fallbackCatalog()
  const rows = await db()`
    select c.*, v.content as version_content
    from courses c left join course_versions v on v.id = c.published_version_id
    where c.status in ('published', 'preview') and (c.status = 'preview' or c.published_version_id is not null)
    order by c.sort_order, c.created_at`
  return rows.map(toCatalog)
}

export async function getCourseBySlug(slug: string, opts: { includeDraft?: boolean } = {}): Promise<CatalogCourse | null> {
  if (!hasDatabase()) return fallbackCatalog().find((c) => c.slug === slug) ?? null
  const rows = await db()`
    select c.*, v.content as version_content
    from courses c left join course_versions v on v.id = c.published_version_id
    where c.slug = ${slug}`
  const row = rows[0]
  if (!row) return null
  const course = toCatalog(row)
  if (opts.includeDraft) return { ...course, content: row.draft as CourseContent }
  if (course.status === 'draft' || course.status === 'archived') return null
  if (course.status === 'published' && !course.publishedVersionId) return null
  return course
}

export async function getSetting<T>(key: string, fallback: T): Promise<T> {
  if (!hasDatabase()) return fallback
  const rows = await db()`select value from settings where key = ${key}`
  return rows[0] ? (rows[0].value as T) : fallback
}

export async function enrollmentOpen(course: CatalogCourse) {
  if (!hasDatabase()) return { open: false, reason: 'database_pending' as const }
  if (course.status !== 'published' || !course.publishedVersionId) return { open: false, reason: 'not_published' as const }
  const free = !course.priceCents
  // Until checkout is built, the staging_enrollment_enabled setting lets testers enroll without paying.
  const staging = await getSetting('staging_enrollment_enabled', true)
  const payments = await getSetting('payments_enabled', false)
  if (free || staging) return { open: true, reason: null, mode: free ? ('free' as const) : ('staging' as const) }
  if (payments) return { open: false, reason: 'checkout_not_built' as const }
  return { open: false, reason: 'payments_pending' as const }
}
