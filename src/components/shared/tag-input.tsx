'use client'

import { useMemo, useState } from 'react'
import { X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { cn } from '@/lib/utils'

interface TagInputProps {
  value: string[]
  onChange: (next: string[]) => void
  suggestions?: string[]
  onCreateSuggestion?: (s: string) => void
  placeholder?: string
  caseInsensitive?: boolean
}

function normalizeTag(value: string) {
  return value.trim().replace(/\s+/g, ' ')
}

export function TagInput({
  value,
  onChange,
  suggestions = [],
  onCreateSuggestion,
  placeholder,
  caseInsensitive = true,
}: TagInputProps) {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)

  const valueKeys = useMemo(
    () => new Set(value.map((tag) => (caseInsensitive ? tag.toLowerCase() : tag))),
    [caseInsensitive, value]
  )

  const filteredSuggestions = useMemo(() => {
    const query = normalizeTag(input)
    const normalizedQuery = caseInsensitive ? query.toLowerCase() : query

    return suggestions
      .filter((suggestion) => {
        const key = caseInsensitive ? suggestion.toLowerCase() : suggestion
        if (valueKeys.has(key)) return false
        if (!normalizedQuery) return true
        return key.includes(normalizedQuery)
      })
      .slice(0, 8)
  }, [caseInsensitive, input, suggestions, valueKeys])

  function addTag(rawTag: string) {
    const tag = normalizeTag(rawTag)
    if (!tag) return

    const key = caseInsensitive ? tag.toLowerCase() : tag
    if (valueKeys.has(key)) {
      setInput('')
      return
    }

    onChange([...value, tag])
    if (!suggestions.some((suggestion) => (caseInsensitive ? suggestion.toLowerCase() : suggestion) === key)) {
      onCreateSuggestion?.(tag)
    }
    setInput('')
  }

  function removeTag(tag: string) {
    const key = caseInsensitive ? tag.toLowerCase() : tag
    onChange(value.filter((item) => (caseInsensitive ? item.toLowerCase() : item) !== key))
  }

  return (
    <div className="relative">
      <div
        className={cn(
          'flex min-h-10 flex-wrap items-center gap-2 rounded-md border bg-background px-2 py-1',
          focused && 'ring-1 ring-ring'
        )}
      >
        {value.map((tag) => (
          <span
            key={tag}
            className="inline-flex max-w-full items-center gap-1 rounded-md bg-secondary px-2 py-1 text-sm text-secondary-foreground"
          >
            <span className="truncate">{tag}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-5 w-5 shrink-0"
              onClick={() => removeTag(tag)}
              aria-label={`Remove ${tag}`}
            >
              <X className="h-3 w-3" />
            </Button>
          </span>
        ))}
        <Input
          value={input}
          onChange={(e) => {
            const next = e.target.value
            if (next.includes(',')) {
              const parts = next.split(',')
              parts.slice(0, -1).forEach(addTag)
              setInput(parts.at(-1) || '')
              return
            }
            setInput(next)
          }}
          onFocus={() => setFocused(true)}
          onBlur={() => window.setTimeout(() => setFocused(false), 120)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' || e.key === 'Tab') {
              if (input.trim()) {
                e.preventDefault()
                addTag(input)
              }
            } else if (e.key === 'Backspace' && !input && value.length > 0) {
              removeTag(value[value.length - 1])
            }
          }}
          className="h-8 min-w-40 flex-1 border-0 px-1 shadow-none focus-visible:ring-0"
          placeholder={value.length === 0 ? placeholder : undefined}
        />
      </div>

      {focused && filteredSuggestions.length > 0 && (
        <div className="absolute z-20 mt-1 max-h-56 w-full overflow-auto rounded-md border bg-popover p-1 shadow-md">
          {filteredSuggestions.map((suggestion) => (
            <button
              key={suggestion}
              type="button"
              className="block w-full rounded-sm px-3 py-2 text-left text-sm hover:bg-accent hover:text-accent-foreground"
              onMouseDown={(e) => {
                e.preventDefault()
                addTag(suggestion)
              }}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
