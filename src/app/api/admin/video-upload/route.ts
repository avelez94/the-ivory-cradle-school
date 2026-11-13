import { handleUpload, type HandleUploadBody } from '@vercel/blob/client'
import { getCurrentUser, isStaff } from '@/lib/auth'
import { json } from '@/lib/security'

// Issues short lived tokens so staff browsers can upload large lesson videos straight to private Blob storage.
export async function POST(req: Request) {
  const body = (await req.json()) as HandleUploadBody
  try {
    const result = await handleUpload({
      body,
      request: req,
      onBeforeGenerateToken: async (pathname) => {
        const user = await getCurrentUser()
        if (!user || !isStaff(user)) throw new Error('Staff sign in required')
        if (!pathname.startsWith('course-videos/')) throw new Error('Invalid path')
        return { allowedContentTypes: ['video/mp4'], maximumSizeInBytes: 2_000_000_000, addRandomSuffix: true }
      },
    })
    return json(result)
  } catch (e) {
    return json({ error: (e as Error).message }, 400)
  }
}
