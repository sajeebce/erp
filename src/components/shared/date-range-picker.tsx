'use client'

import { useState } from 'react'
import { format, startOfMonth, endOfMonth, subMonths, startOfQuarter, endOfQuarter, startOfYear, endOfYear } from 'date-fns'
import { CalendarDays } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Calendar } from '@/components/ui/calendar'
import { cn } from '@/lib/utils'

interface DateRange {
  from: Date
  to: Date
}

interface DateRangePickerProps {
  value?: DateRange
  onChange: (range: DateRange | undefined) => void
  className?: string
}

const presets = [
  { label: 'This Month', range: () => ({ from: startOfMonth(new Date()), to: endOfMonth(new Date()) }) },
  { label: 'Last Month', range: () => ({ from: startOfMonth(subMonths(new Date(), 1)), to: endOfMonth(subMonths(new Date(), 1)) }) },
  { label: 'This Quarter', range: () => ({ from: startOfQuarter(new Date()), to: endOfQuarter(new Date()) }) },
  { label: 'This Year', range: () => ({ from: startOfYear(new Date()), to: endOfYear(new Date()) }) },
  { label: 'Last Year', range: () => ({ from: startOfYear(subMonths(new Date(), 12)), to: endOfYear(subMonths(new Date(), 12)) }) },
]

export function DateRangePicker({ value, onChange, className }: DateRangePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className={cn('min-w-[220px] justify-start text-left font-normal', !value && 'text-muted-foreground', className)}>
          <CalendarDays className="mr-2 h-4 w-4" />
          {value ? `${format(value.from, 'dd MMM')} - ${format(value.to, 'dd MMM yyyy')}` : 'Select date range'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="start">
        <div className="flex">
          <div className="border-r p-2 space-y-1">
            {presets.map(preset => (
              <Button
                key={preset.label}
                variant="ghost"
                size="sm"
                className="w-full justify-start text-xs"
                onClick={() => { onChange(preset.range()); setOpen(false) }}
              >
                {preset.label}
              </Button>
            ))}
            <Button variant="ghost" size="sm" className="w-full justify-start text-xs text-muted-foreground" onClick={() => { onChange(undefined); setOpen(false) }}>
              Clear
            </Button>
          </div>
          <Calendar
            mode="range"
            selected={value ? { from: value.from, to: value.to } : undefined}
            onSelect={(range) => {
              if (range?.from && range?.to) {
                onChange({ from: range.from, to: range.to })
              }
            }}
            numberOfMonths={2}
          />
        </div>
      </PopoverContent>
    </Popover>
  )
}
