'use client'

import { AlertCircle } from 'lucide-react'

export function ErrorMessage({ message }: { message: string }) {
  if (!message) return null

  return (
    <div className="flex items-start gap-3 rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive">
      <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
      <div className="flex-1 whitespace-pre-line">{message}</div>
    </div>
  )
}
