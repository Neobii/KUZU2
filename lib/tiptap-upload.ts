/** Client-side upload for TipTap editor images → `/api/uploads/image`. */

export async function uploadEditorImage(file: File): Promise<string> {
  const form = new FormData()
  form.append('file', file)
  const res = await fetch('/api/uploads/image', {
    method: 'POST',
    body: form,
  })
  if (!res.ok) {
    let message = 'Upload failed'
    try {
      const data = (await res.json()) as { error?: string }
      if (data.error) message = data.error
    } catch {
      message = res.statusText || message
    }
    throw new Error(message)
  }
  const data = (await res.json()) as { url: string }
  if (!data.url) throw new Error('Invalid response from server')
  return data.url
}
