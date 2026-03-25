'use client'

import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface Step {
  id: string
  title: string
  description?: string
}

interface FormStepperProps {
  steps: Step[]
  currentStep: number
}

export function FormStepper({ steps, currentStep }: FormStepperProps) {
  return (
    <div className="flex items-center justify-between">
      {steps.map((step, i) => (
        <div key={step.id} className="flex items-center flex-1">
          <div className="flex items-center gap-3">
            <div
              className={cn(
                'flex h-9 w-9 items-center justify-center rounded-full text-sm font-semibold transition-colors',
                i < currentStep && 'bg-primary text-primary-foreground',
                i === currentStep && 'border-2 border-primary text-primary bg-primary/5',
                i > currentStep && 'border-2 border-muted-foreground/30 text-muted-foreground/50'
              )}
            >
              {i < currentStep ? <Check className="h-4 w-4" /> : i + 1}
            </div>
            <div className="hidden sm:block">
              <p className={cn('text-sm font-medium', i > currentStep && 'text-muted-foreground/50')}>{step.title}</p>
              {step.description && (
                <p className="text-xs text-muted-foreground">{step.description}</p>
              )}
            </div>
          </div>
          {i < steps.length - 1 && (
            <div className={cn('flex-1 h-px mx-4', i < currentStep ? 'bg-primary' : 'bg-muted-foreground/20')} />
          )}
        </div>
      ))}
    </div>
  )
}
