const TYPES: Record<string, string> = {
  pdf: 'application/pdf',
  ppt: 'application/vnd.ms-powerpoint',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  doc: 'application/msword',
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
}

export const MAX_FILE_BYTES = 20 * 1024 * 1024

export function extensionOf(name: string) {
  return name.split('.').pop()?.toLowerCase() ?? ''
}

export function contentTypeFor(name: string) {
  return TYPES[extensionOf(name)] ?? ''
}

export function fileKind(name: string): 'pdf' | 'slides' | 'doc' | 'image' | 'other' {
  const ext = extensionOf(name)
  if (ext === 'pdf') return 'pdf'
  if (ext === 'ppt' || ext === 'pptx') return 'slides'
  if (ext === 'doc' || ext === 'docx') return 'doc'
  if (ext === 'jpg' || ext === 'jpeg' || ext === 'png' || ext === 'webp') return 'image'
  return 'other'
}

export function formatBytes(size: number) {
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}
