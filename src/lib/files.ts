import 'server-only'
import fs from 'node:fs'
import path from 'node:path'
import { get as blobGet } from '@vercel/blob'
import { db } from './db'

export type FileRow = {
  id: string
  kind: string
  storage: 'db' | 'bundled' | 'blob' | 'url'
  content_type: string
  filename: string | null
  size_bytes: number | null
  path: string | null
  url: string | null
}

const PRIVATE_ROOT = path.join(process.cwd(), 'private-assets')

function bundledPath(rel: string) {
  const abs = path.resolve(PRIVATE_ROOT, rel)
  if (!abs.startsWith(PRIVATE_ROOT + path.sep)) throw new Error('Invalid bundled path')
  return abs
}

export async function getFile(id: string | null | undefined): Promise<FileRow | null> {
  if (!id) return null
  const rows = await db()`select id, kind, storage, content_type, filename, size_bytes, path, url from files where id = ${id}`
  return (rows[0] as unknown as FileRow) ?? null
}

export async function readFileBuffer(file: FileRow): Promise<Buffer> {
  switch (file.storage) {
    case 'db': {
      const [row] = await db()`select bytes from files where id = ${file.id}`
      return Buffer.from(row.bytes)
    }
    case 'bundled':
      return fs.promises.readFile(bundledPath(file.path!))
    case 'blob': {
      const res = await blobGet(file.url!, { access: 'private' })
      if (!res || res.statusCode !== 200) throw new Error('Blob not found')
      return Buffer.from(await new Response(res.stream).arrayBuffer())
    }
    case 'url': {
      const res = await fetch(file.url!)
      return Buffer.from(await res.arrayBuffer())
    }
  }
}

export async function storeDbFile(input: {
  kind: FileRow['kind']
  contentType: string
  filename: string
  bytes: Buffer
  createdBy: string | null
}) {
  const { createHash } = await import('node:crypto')
  const sha = createHash('sha256').update(input.bytes).digest('hex')
  const [row] = await db()`
    insert into files (kind, storage, content_type, filename, size_bytes, sha256, bytes, created_by)
    values (${input.kind}, 'db', ${input.contentType}, ${input.filename}, ${input.bytes.length}, ${sha}, ${input.bytes}, ${input.createdBy})
    returning id`
  return row.id as string
}

function parseRange(header: string | null, size: number): [number, number] | null {
  if (!header) return null
  const m = /^bytes=(\d*)-(\d*)$/.exec(header.trim())
  if (!m) return null
  let start = m[1] === '' ? NaN : Number(m[1])
  let end = m[2] === '' ? size - 1 : Number(m[2])
  if (Number.isNaN(start)) {
    start = Math.max(0, size - end)
    end = size - 1
  }
  if (start > end || start >= size) return null
  return [start, Math.min(end, size - 1)]
}

const PRIVATE_HEADERS = { 'Cache-Control': 'private, no-store', 'X-Robots-Tag': 'noindex' }

/** Serves a stored file to an already authorized viewer. Supports byte ranges for video seeking. */
export async function fileResponse(
  file: FileRow,
  req: Request,
  opts: { disposition?: 'inline' | 'attachment'; downloadName?: string } = {},
): Promise<Response> {
  const disposition = `${opts.disposition ?? 'inline'}; filename="${(opts.downloadName ?? file.filename ?? 'file').replace(/"/g, '')}"`
  const base: Record<string, string> = { ...PRIVATE_HEADERS, 'Content-Type': file.content_type, 'Content-Disposition': disposition, 'Accept-Ranges': 'bytes' }

  if (file.storage === 'url') return Response.redirect(file.url!, 302)

  if (file.storage === 'blob') {
    const range = req.headers.get('range')
    const res = await blobGet(file.url!, { access: 'private', headers: range ? { range } : undefined })
    if (!res || res.statusCode !== 200) return new Response('Not found', { status: 404 })
    const h = new Headers(base)
    for (const k of ['content-length', 'content-range']) {
      const v = res.headers.get(k)
      if (v) h.set(k, v)
    }
    return new Response(res.stream, { status: res.headers.get('content-range') ? 206 : 200, headers: h })
  }

  if (file.storage === 'bundled') {
    const abs = bundledPath(file.path!)
    const { size } = await fs.promises.stat(abs)
    const range = parseRange(req.headers.get('range'), size)
    const [start, end] = range ?? [0, size - 1]
    const stream = fs.createReadStream(abs, { start, end })
    const body = new ReadableStream({
      start(controller) {
        stream.on('data', (chunk) => controller.enqueue(new Uint8Array(chunk as Buffer)))
        stream.on('end', () => controller.close())
        stream.on('error', (e) => controller.error(e))
      },
      cancel() {
        stream.destroy()
      },
    })
    const h = new Headers({ ...base, 'Content-Length': String(end - start + 1) })
    if (range) h.set('Content-Range', `bytes ${start}-${end}/${size}`)
    return new Response(body, { status: range ? 206 : 200, headers: h })
  }

  const buf = await readFileBuffer(file)
  const range = parseRange(req.headers.get('range'), buf.length)
  if (range) {
    const [start, end] = range
    return new Response(new Uint8Array(buf.subarray(start, end + 1)), {
      status: 206,
      headers: { ...base, 'Content-Length': String(end - start + 1), 'Content-Range': `bytes ${start}-${end}/${buf.length}` },
    })
  }
  return new Response(new Uint8Array(buf), { headers: { ...base, 'Content-Length': String(buf.length) } })
}
