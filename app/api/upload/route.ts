import { createClient } from '@/lib/supabase/server'
import { createServiceClient } from '@/lib/supabase/service'

export const runtime = 'nodejs'

export async function POST(request: Request) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 })

  const formData = await request.formData()
  const file     = formData.get('file') as File | null
  const letterId = formData.get('letterId') as string | null

  if (!file || !letterId)
    return Response.json({ error: 'Missing file or letterId' }, { status: 400 })
  if (file.size > 8 * 1024 * 1024)
    return Response.json({ error: 'Fichier trop lourd (8 Mo max)' }, { status: 400 })
  if (!file.type.startsWith('image/'))
    return Response.json({ error: 'Images uniquement (jpg, png, webp…)' }, { status: 400 })

  const service = createServiceClient()
  const ext  = (file.name.split('.').pop() ?? 'jpg').toLowerCase()
  const path = `${letterId}/${Date.now()}.${ext}`

  const { data, error } = await service.storage
    .from('letters')
    .upload(path, file, { contentType: file.type, upsert: false })

  if (error) {
    console.error('[upload] storage error:', error)
    return Response.json({ error: error.message }, { status: 500 })
  }

  const { data: { publicUrl } } = service.storage
    .from('letters')
    .getPublicUrl(data.path)

  return Response.json({ url: publicUrl })
}
