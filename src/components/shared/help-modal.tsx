'use client'

import { useState } from 'react'
import { useTranslations } from 'next-intl'
import { HelpCircle } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from '@/components/ui/dialog'

export interface HelpStep {
  title: string
  description: string
}

interface HelpModalProps {
  title: string
  description: string
  steps: HelpStep[]
  tips?: string[]
  example?: {
    title: string
    lines: string[]
  }
}

export function HelpButton({ title, description, steps, tips, example }: HelpModalProps) {
  const [open, setOpen] = useState(false)
  const tc = useTranslations('common')

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)}>
        <HelpCircle className="h-4 w-4 mr-2" />
        {tc('buttons.help')}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] flex flex-col">
          <DialogHeader className="shrink-0">
            <DialogTitle>{title}</DialogTitle>
            <DialogDescription>{description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 pt-2 overflow-y-auto flex-1 pr-1">
            {/* Steps */}
            <div className="space-y-3">
              {steps.map((step, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex items-center justify-center h-6 w-6 rounded-full bg-primary text-primary-foreground text-xs font-bold shrink-0 mt-0.5">
                    {i + 1}
                  </div>
                  <div>
                    <p className="text-sm font-medium">{step.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">{step.description}</p>
                  </div>
                </div>
              ))}
            </div>

            {/* Example */}
            {example && (
              <div className="rounded-lg bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 p-3 space-y-1.5">
                <p className="text-sm font-medium text-blue-700 dark:text-blue-400">{example.title}</p>
                {example.lines.map((line, i) => (
                  <p key={i} className="text-sm text-blue-600/80 dark:text-blue-300/80">{line}</p>
                ))}
              </div>
            )}

            {/* Tips */}
            {tips && tips.length > 0 && (
              <div className="rounded-lg bg-muted/50 border p-3 space-y-1.5">
                <p className="text-sm font-medium">{tc('buttons.tips')}</p>
                {tips.map((tip, i) => (
                  <p key={i} className="text-sm text-muted-foreground">• {tip}</p>
                ))}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
