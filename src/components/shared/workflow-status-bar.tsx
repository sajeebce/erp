'use client'

import { cn } from '@/lib/utils'
import { Check } from 'lucide-react'

interface WorkflowStage {
  key: string
  label: string
}

interface WorkflowStatusBarProps {
  stages: WorkflowStage[]
  currentStage: string
}

export function WorkflowStatusBar({ stages, currentStage }: WorkflowStatusBarProps) {
  const currentIndex = stages.findIndex(s => s.key === currentStage)

  return (
    <div className="flex items-center gap-1 rounded-lg border bg-muted/30 p-1">
      {stages.map((stage, i) => (
        <div
          key={stage.key}
          className={cn(
            'flex-1 rounded-md px-3 py-1.5 text-center text-xs font-medium transition-colors',
            i === currentIndex && 'bg-primary text-primary-foreground shadow-sm',
            i < currentIndex && 'bg-primary/10 text-primary',
            i > currentIndex && 'text-muted-foreground/50'
          )}
        >
          <span className="flex items-center justify-center gap-1">
            {i < currentIndex && <Check className="h-3 w-3" />}
            {stage.label}
          </span>
        </div>
      ))}
    </div>
  )
}
