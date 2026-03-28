'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { allLocales, type LocaleCode } from '@/i18n/config'

interface LocalizedNameInputProps {
  /** Label for the field (e.g. "Name", "Account Name") */
  label: string
  /** Supported locale codes from org settings (e.g. ["en", "bn"]) */
  locales: string[]
  /** Current values keyed by locale code */
  values: Record<string, string>
  /** Called when a locale value changes */
  onChange: (locale: string, value: string) => void
  /** Whether the primary (first) locale is required */
  required?: boolean
}

export function LocalizedNameInput({
  label,
  locales: supportedLocales,
  values,
  onChange,
  required,
}: LocalizedNameInputProps) {
  return (
    <div className="space-y-3">
      {supportedLocales.map((locale, index) => {
        const meta = allLocales[locale as LocaleCode]
        const isPrimary = index === 0

        return (
          <div key={locale} className="space-y-1.5">
            <div className="flex items-center gap-2">
              <Label>
                {label}
                {isPrimary && required && <span className="text-destructive ml-1">*</span>}
              </Label>
              <Badge variant="outline" className="text-[10px] px-1.5 py-0 font-mono uppercase">
                {locale.toUpperCase()}
              </Badge>
              {meta && (
                <span className="text-xs text-muted-foreground">{meta.nativeName}</span>
              )}
            </div>
            <Input
              value={values[locale] || ''}
              onChange={e => onChange(locale, e.target.value)}
              required={isPrimary && required}
              dir={meta?.direction || 'ltr'}
            />
          </div>
        )
      })}
    </div>
  )
}
