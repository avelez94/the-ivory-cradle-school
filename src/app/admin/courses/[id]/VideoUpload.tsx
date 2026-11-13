'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { upload } from '@vercel/blob/client'
import { registerUploadedVideoAction } from '../actions'

function readDuration(file: File) {
  return new Promise<number>((resolve, reject) => {
    const v = document.createElement('video')
    v.preload = 'metadata'
    v.onloadedmetadata = () => {
      URL.revokeObjectURL(v.src)
      resolve(v.duration)
    }
    v.onerror = () => reject(new Error('Could not read the video length'))
    v.src = URL.createObjectURL(file)
  })
}

export function VideoUpload({ courseId }: { courseId: string }) {
  const router = useRouter()
  const [status, setStatus] = useState('')
  const [busy, setBusy] = useState(false)

  async function onChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setBusy(true)
    try {
      const seconds = await readDuration(file)
      setStatus(`Uploading ${file.name}…`)
      const blob = await upload(`course-videos/${courseId}/${file.name}`, file, {
        access: 'private',
        handleUploadUrl: '/api/admin/video-upload',
        multipart: file.size > 50_000_000,
        clientPayload: courseId,
        onUploadProgress: (p) => setStatus(`Uploading ${file.name}: ${Math.round(p.percentage)}%`),
      })
      await registerUploadedVideoAction(courseId, blob.url, seconds, file.name)
      setStatus('Uploaded and saved to the draft.')
      router.refresh()
    } catch (err) {
      setStatus(`Upload failed: ${(err as Error).message}`)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="form" style={{ marginTop: 8 }}>
      <div className="field">
        <label htmlFor="vfile">MP4 video file</label>
        <input id="vfile" type="file" accept="video/mp4" onChange={onChange} disabled={busy} />
        <span className="hint">Stored privately. Students can only stream it while signed in and enrolled.</span>
      </div>
      <p className="small" aria-live="polite">{status}</p>
    </div>
  )
}
