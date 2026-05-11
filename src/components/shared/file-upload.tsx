'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import { Upload, X, FileText, Image, File, Loader2, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface AttachmentItem {
  id: string
  fileName: string
  originalName: string
  fileSize: number
  mimeType: string
  createdAt: string
}

interface FileUploadProps {
  entityType: string
  entityId: string | null
  module: string
  readOnly?: boolean
}

const ICON_MAP: Record<string, React.ElementType> = {
  'image/': Image,
  'application/pdf': FileText,
  default: File,
}

function getFileIcon(mimeType: string): React.ElementType {
  for (const [key, Icon] of Object.entries(ICON_MAP)) {
    if (key !== 'default' && mimeType.startsWith(key)) return Icon
  }
  return ICON_MAP.default
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

// Pending files (before entity is saved)
interface PendingFile {
  id: string
  file: File
  status: 'pending' | 'uploading' | 'done' | 'error'
  error?: string
}

export function FileUpload({ entityType, entityId, module, readOnly }: FileUploadProps) {
  const t = useTranslations('common.fileUpload')
  const [attachments, setAttachments] = useState<AttachmentItem[]>([])
  const [pendingFiles, setPendingFiles] = useState<PendingFile[]>([])
  const [loading, setLoading] = useState(false)
  const [deleting, setDeleting] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)

  // Fetch existing attachments
  const fetchAttachments = useCallback(() => {
    if (!entityId) return
    setLoading(true)
    fetch(`/api/v1/attachments?entityType=${entityType}&entityId=${entityId}`)
      .then(r => r.json())
      .then(json => { if (json.success) setAttachments(json.data) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [entityType, entityId])

  useEffect(() => { fetchAttachments() }, [fetchAttachments])

  async function uploadFile(file: File) {
    setUploadError(null)
    if (!entityId) {
      // Queue for later — entity not yet saved
      setPendingFiles(prev => [...prev, {
        id: crypto.randomUUID(),
        file,
        status: 'pending',
      }])
      return
    }

    const formData = new FormData()
    formData.append('file', file)
    formData.append('module', module)
    formData.append('entityType', entityType)
    formData.append('entityId', entityId)

    try {
      const res = await fetch('/api/v1/upload', { method: 'POST', body: formData })
      const json = await res.json()
      if (json.success) {
        fetchAttachments()
      } else {
        setUploadError(json.error?.message || 'Upload failed')
      }
    } catch {
      setUploadError('Upload failed')
    }
  }

  // Upload all pending files when entityId becomes available
  useEffect(() => {
    if (!entityId || pendingFiles.length === 0) return
    const pending = pendingFiles.filter(f => f.status === 'pending')
    if (pending.length === 0) return

    async function uploadPending() {
      for (const pf of pending) {
        setPendingFiles(prev => prev.map(f => f.id === pf.id ? { ...f, status: 'uploading' as const } : f))

        const formData = new FormData()
        formData.append('file', pf.file)
        formData.append('module', module)
        formData.append('entityType', entityType)
        formData.append('entityId', entityId!)

        try {
          const res = await fetch('/api/v1/upload', { method: 'POST', body: formData })
          const json = await res.json()
          if (json.success) {
            setPendingFiles(prev => prev.filter(f => f.id !== pf.id))
          } else {
            setPendingFiles(prev => prev.map(f => f.id === pf.id ? { ...f, status: 'error' as const, error: json.error?.message } : f))
          }
        } catch {
          setPendingFiles(prev => prev.map(f => f.id === pf.id ? { ...f, status: 'error' as const, error: 'Upload failed' } : f))
        }
      }
      fetchAttachments()
    }

    uploadPending()
  }, [entityId, pendingFiles, module, entityType, fetchAttachments])

  async function handleDelete(id: string) {
    setDeleting(id)
    try {
      const res = await fetch(`/api/v1/attachments?id=${id}`, { method: 'DELETE' })
      const json = await res.json()
      if (json.success) {
        setAttachments(prev => prev.filter(a => a.id !== id))
      }
    } catch {
      // ignore
    } finally {
      setDeleting(null)
    }
  }

  function removePending(id: string) {
    setPendingFiles(prev => prev.filter(f => f.id !== id))
  }

  function handleFiles(files: FileList | File[]) {
    const arr = Array.from(files)
    for (const file of arr) {
      uploadFile(file)
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragOver(false)
    if (readOnly) return
    handleFiles(e.dataTransfer.files)
  }

  function handleDragOver(e: React.DragEvent) {
    e.preventDefault()
    if (!readOnly) setDragOver(true)
  }

  const totalItems = attachments.length + pendingFiles.length

  return (
    <div className="space-y-3">
      {uploadError && (
        <div className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
          {uploadError}
        </div>
      )}

      <div className="flex items-center justify-between">
        <label className="text-sm font-medium">
          {t('attachments')} {totalItems > 0 && <span className="text-muted-foreground">({totalItems})</span>}
        </label>
      </div>

      {/* Drop zone */}
      {!readOnly && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={() => setDragOver(false)}
          className={`relative flex flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-6 text-center transition-colors cursor-pointer
            ${dragOver ? 'border-primary bg-primary/5' : 'border-muted-foreground/25 hover:border-muted-foreground/40'}`}
          onClick={() => {
            const input = document.createElement('input')
            input.type = 'file'
            input.multiple = true
            input.accept = 'image/*,.pdf,.csv,.xls,.xlsx,.doc,.docx'
            input.onchange = () => { if (input.files) handleFiles(input.files) }
            input.click()
          }}
        >
          <Upload className="h-8 w-8 text-muted-foreground/50" />
          <div>
            <p className="text-sm text-muted-foreground">{t('dragDrop')}</p>
            <p className="text-xs text-muted-foreground/70 mt-0.5">{t('supportedFormats')}</p>
          </div>
        </div>
      )}

      {/* Loading state */}
      {loading && totalItems === 0 && (
        <div className="flex items-center justify-center py-3">
          <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
        </div>
      )}

      {/* File list */}
      {(attachments.length > 0 || pendingFiles.length > 0) && (
        <div className="space-y-1.5">
          {/* Existing attachments */}
          {attachments.map(att => {
            const Icon = getFileIcon(att.mimeType)
            return (
              <div key={att.id} className="group flex items-center gap-3 rounded-md border px-3 py-2">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{att.originalName}</p>
                  <p className="text-xs text-muted-foreground">{formatSize(att.fileSize)}</p>
                </div>
                {!readOnly && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:text-destructive"
                    onClick={() => handleDelete(att.id)}
                    disabled={deleting === att.id}
                  >
                    {deleting === att.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                  </Button>
                )}
              </div>
            )
          })}

          {/* Pending files */}
          {pendingFiles.map(pf => {
            const Icon = getFileIcon(pf.file.type)
            return (
              <div key={pf.id} className="flex items-center gap-3 rounded-md border border-dashed px-3 py-2">
                <Icon className="h-4 w-4 text-muted-foreground shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm truncate">{pf.file.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {formatSize(pf.file.size)}
                    {pf.status === 'uploading' && <span className="ml-1.5">{t('uploading')}</span>}
                    {pf.status === 'pending' && !entityId && <span className="ml-1.5 text-amber-600">{t('pendingSave')}</span>}
                    {pf.status === 'error' && <span className="ml-1.5 text-destructive">{pf.error}</span>}
                  </p>
                </div>
                {pf.status === 'uploading' ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground shrink-0" />
                ) : (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-muted-foreground hover:text-destructive"
                    onClick={() => removePending(pf.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
