'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useTranslations } from 'next-intl'
import { ChevronsUpDown, Check, SearchIcon } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export interface SelectOption {
  value: string
  label: string
  description?: string
}

interface SearchableSelectProps {
  options: SelectOption[]
  value?: string
  onValueChange: (value: string) => void
  placeholder?: string
  searchPlaceholder?: string
  emptyMessage?: string
  className?: string
  disabled?: boolean
  id?: string
}

export function SearchableSelect({
  options,
  value,
  onValueChange,
  placeholder,
  searchPlaceholder,
  emptyMessage,
  className,
  disabled,
  id,
}: SearchableSelectProps) {
  const t = useTranslations('common')
  const [open, setOpen] = useState(false)
  const [search, setSearch] = useState('')
  const [dropdownStyle, setDropdownStyle] = useState<React.CSSProperties>({})
  const inputRef = useRef<HTMLInputElement>(null)
  const buttonRef = useRef<HTMLButtonElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const listRef = useRef<HTMLDivElement>(null)
  const selected = options.find(o => o.value === value)

  const filtered = search
    ? options.filter(o => o.label.toLowerCase().includes(search.toLowerCase()))
    : options

  const updatePosition = useCallback(() => {
    if (!buttonRef.current) return
    const rect = buttonRef.current.getBoundingClientRect()
    const spaceBelow = window.innerHeight - rect.bottom
    const spaceAbove = rect.top
    const dropdownHeight = 220
    const openUpward = spaceBelow < dropdownHeight && spaceAbove > spaceBelow

    setDropdownStyle({
      position: 'fixed',
      left: rect.left,
      width: rect.width,
      zIndex: 9999,
      ...(openUpward
        ? { bottom: window.innerHeight - rect.top + 4 }
        : { top: rect.bottom + 4 }),
    })
  }, [])

  useEffect(() => {
    if (open) {
      setSearch('')
      updatePosition()
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }, [open, updatePosition])

  // Reposition on scroll/resize
  useEffect(() => {
    if (!open) return
    window.addEventListener('scroll', updatePosition, true)
    window.addEventListener('resize', updatePosition)
    return () => {
      window.removeEventListener('scroll', updatePosition, true)
      window.removeEventListener('resize', updatePosition)
    }
  }, [open, updatePosition])

  // Close on click outside
  useEffect(() => {
    if (!open) return
    function handleClick(e: MouseEvent) {
      if (
        buttonRef.current?.contains(e.target as Node) ||
        dropdownRef.current?.contains(e.target as Node)
      ) return
      setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [open])

  // Close on Escape
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') setOpen(false)
  }, [])

  const handleDropdownWheel = useCallback((event: React.WheelEvent) => {
    const list = listRef.current
    if (!list || list.scrollHeight <= list.clientHeight) return

    event.preventDefault()
    event.stopPropagation()
    list.scrollTop += event.deltaY
  }, [])

  const dropdown = open ? (
    <div
      ref={dropdownRef}
      style={dropdownStyle}
      className="rounded-md border bg-popover text-popover-foreground shadow-md"
      onKeyDown={handleKeyDown}
      onWheelCapture={handleDropdownWheel}
    >
      <div className="flex items-center gap-2 border-b px-3 h-9">
        <SearchIcon className="size-4 shrink-0 opacity-50" />
        <input
          ref={inputRef}
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder={searchPlaceholder || t('combobox.search')}
          className="flex h-8 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
        />
      </div>
      <div
        ref={listRef}
        className="overflow-y-auto overscroll-contain p-1"
        style={{ maxHeight: 220, touchAction: 'pan-y' }}
      >
        {filtered.length === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            {emptyMessage || t('combobox.noResults')}
          </div>
        ) : (
          filtered.map(option => (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onValueChange(option.value)
                setOpen(false)
              }}
              className={cn(
                'relative flex w-full cursor-pointer items-center gap-2 rounded-sm px-2 py-1.5 text-sm outline-none hover:bg-accent hover:text-accent-foreground',
                value === option.value && 'bg-accent text-accent-foreground'
              )}
            >
              <Check
                className={cn(
                  'h-4 w-4 shrink-0',
                  value === option.value ? 'opacity-100' : 'opacity-0'
                )}
              />
              <span className="truncate">{option.label}</span>
              {option.description && (
                <span className="ml-auto text-xs text-muted-foreground truncate">
                  {option.description}
                </span>
              )}
            </button>
          ))
        )}
      </div>
    </div>
  ) : null

  return (
    <div className="relative" onKeyDown={handleKeyDown}>
      <Button
        ref={buttonRef}
        id={id}
        type="button"
        variant="outline"
        role="combobox"
        aria-expanded={open}
        disabled={disabled}
        onClick={() => setOpen(!open)}
        className={cn(
          'w-full justify-between font-normal h-9 px-3',
          !selected && 'text-muted-foreground',
          className
        )}
      >
        <span className="truncate">
          {selected?.label || placeholder || t('combobox.select')}
        </span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>

      {typeof window !== 'undefined' && dropdown
        ? createPortal(dropdown, document.body)
        : null}
    </div>
  )
}
