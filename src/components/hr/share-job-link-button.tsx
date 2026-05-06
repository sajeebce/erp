'use client'

import { useMemo, useState } from 'react'
import { Check, Copy, ExternalLink, Link as LinkIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'

interface ShareJobLinkButtonProps {
  orgSlug: string
  jobSlug: string
  status: string
}

export function ShareJobLinkButton({ orgSlug, jobSlug, status }: ShareJobLinkButtonProps) {
  const [copied, setCopied] = useState(false)
  const disabled = status !== 'PUBLISHED'

  const url = useMemo(() => {
    if (typeof window === 'undefined') return `/careers/${orgSlug}/${jobSlug}`
    return `${window.location.origin}/careers/${orgSlug}/${jobSlug}`
  }, [jobSlug, orgSlug])

  async function copyUrl() {
    if (disabled) return
    await navigator.clipboard.writeText(url)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1600)
  }

  const trigger = (
    <Button
      type="button"
      variant="outline"
      size="sm"
      disabled={disabled}
      onClick={(e) => e.stopPropagation()}
      aria-label="Share public job link"
    >
      <LinkIcon className="h-4 w-4" />
    </Button>
  )

  if (disabled) {
    return (
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent>Publish to enable sharing</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    )
  }

  return (
    <Popover>
      <PopoverTrigger asChild>{trigger}</PopoverTrigger>
      <PopoverContent className="w-80" align="end" onClick={(e) => e.stopPropagation()}>
        <div className="space-y-3">
          <div>
            <p className="text-sm font-medium">Public job link</p>
            <p className="text-xs text-muted-foreground">Anyone with this link can view and apply.</p>
          </div>
          <Input value={url} readOnly onFocus={(e) => e.target.select()} />
          <div className="flex gap-2">
            <Button type="button" size="sm" onClick={copyUrl} className="flex-1">
              {copied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
              {copied ? 'Copied' : 'Copy'}
            </Button>
            <Button type="button" size="sm" variant="outline" asChild>
              <a href={url} target="_blank" rel="noreferrer">
                <ExternalLink className="h-4 w-4 mr-2" />
                Open
              </a>
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  )
}
