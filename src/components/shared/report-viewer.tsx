'use client'

import { useRef } from 'react'
import { useTranslations } from 'next-intl'
import { Printer, FileSpreadsheet } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useFormatters } from '@/hooks/use-formatters'

interface ReportColumn {
  key: string
  label: string
  align?: 'left' | 'right' | 'center'
  format?: 'currency' | 'number' | 'text' | 'date'
  bold?: boolean
}

interface ReportViewerProps {
  title: string
  subtitle?: string
  orgName?: string
  period?: string
  columns: ReportColumn[]
  rows: Record<string, unknown>[]
  totals?: Record<string, unknown>
  emptyMessage?: string
}

export function ReportViewer({ title, subtitle, orgName, period, columns, rows, totals, emptyMessage }: ReportViewerProps) {
  const t = useTranslations('common')
  const { formatCurrency } = useFormatters()
  const tableRef = useRef<HTMLDivElement>(null)

  function formatCell(value: unknown, format?: string): string {
    if (value === null || value === undefined || value === '') return ''
    if (format === 'currency') {
      const num = Number(value)
      if (num === 0) return '—'
      return formatCurrency(num)
    }
    if (format === 'number') return Number(value).toLocaleString()
    if (format === 'date') return new Date(String(value)).toLocaleDateString()
    return String(value)
  }

  function handlePrint() {
    const content = tableRef.current
    if (!content) return

    const printWindow = window.open('', '_blank', 'width=1200,height=800')
    if (!printWindow) return

    const html = `<!DOCTYPE html>
<html>
<head>
  <title>${title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: 'Segoe UI', Arial, sans-serif; color: #111; padding: 40px; }
    .header { text-align: center; border-bottom: 2px solid #333; padding-bottom: 16px; margin-bottom: 24px; }
    .org-name { font-size: 18px; font-weight: 700; }
    .report-title { font-size: 22px; font-weight: 700; margin-top: 4px; }
    .period { font-size: 13px; color: #555; margin-top: 4px; }
    table { width: 100%; border-collapse: collapse; margin-top: 8px; font-size: 11px; }
    th { background: #f3f4f6; border: 1px solid #d1d5db; padding: 8px 10px; font-weight: 700; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; }
    td { border: 1px solid #e5e7eb; padding: 6px 10px; }
    .right { text-align: right; }
    .center { text-align: center; }
    .mono { font-family: 'Consolas', 'Courier New', monospace; }
    .bold { font-weight: 700; }
    .group-row { background: #f9fafb; font-weight: 700; }
    tfoot td { border-top: 2px solid #111; font-weight: 700; background: #f3f4f6; }
    .footer { margin-top: 20px; padding-top: 10px; border-top: 1px solid #ccc; font-size: 10px; color: #666; display: flex; justify-content: space-between; }
    @page { margin: 1.5cm; size: A4 landscape; }
    @media print { body { padding: 0; } }
  </style>
</head>
<body>
  <div class="header">
    ${orgName ? `<div class="org-name">${orgName}</div>` : ''}
    <div class="report-title">${title}</div>
    ${period ? `<div class="period">${period}</div>` : ''}
    ${subtitle ? `<div class="period">${subtitle}</div>` : ''}
  </div>
  ${content.innerHTML}
  <div class="footer">
    <span>Generated: ${new Date().toLocaleString()}</span>
  </div>
  <script>window.onload = function() { window.print(); window.onafterprint = function() { window.close(); } }</script>
</body>
</html>`

    printWindow.document.write(html)
    printWindow.document.close()
  }

  function handleCSV() {
    const header = columns.map(c => c.label).join(',')
    const csvRows = rows.map(row =>
      columns.map(c => {
        const val = row[c.key]
        if (val === null || val === undefined) return ''
        return typeof val === 'string' && val.includes(',') ? `"${val}"` : String(val)
      }).join(',')
    )
    if (totals) {
      csvRows.push(columns.map(c => {
        const val = totals[c.key]
        return val !== undefined ? String(val) : ''
      }).join(','))
    }
    const csv = [header, ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${title.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div>
      {/* Export bar */}
      <div className="flex items-center justify-end gap-2 mb-4">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />{t('buttons.print')}
        </Button>
        <Button variant="outline" size="sm" onClick={handleCSV}>
          <FileSpreadsheet className="h-4 w-4 mr-2" />CSV
        </Button>
      </div>

      {/* Report header (screen) */}
      <div className="mb-6">
        <div className="text-center pb-4 border-b-2 border-foreground/20">
          {orgName && <p className="text-base font-bold">{orgName}</p>}
          <h1 className="text-xl font-bold mt-1">{title}</h1>
          {period && <p className="text-sm text-muted-foreground mt-1">{period}</p>}
          {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
        </div>
      </div>

      {/* Report table (captured for print) */}
      <div ref={tableRef}>
        {rows.length === 0 ? (
          <div className="py-12 text-center text-muted-foreground">
            {emptyMessage || t('labels.noData')}
          </div>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                {columns.map(col => (
                  <th
                    key={col.key}
                    className={`py-2.5 px-3 font-semibold text-xs uppercase tracking-wide border border-border bg-muted/50 ${
                      col.align === 'right' ? 'text-right' : col.align === 'center' ? 'text-center' : 'text-left'
                    }`}
                  >
                    {col.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => {
                const isGroup = row._isGroup === true
                return (
                  <tr key={i} className={isGroup ? 'group-row' : ''}>
                    {columns.map(col => {
                      const val = row[col.key]
                      const indent = col.key === columns[0]?.key && typeof row._level === 'number' ? (row._level as number) * 16 : 0
                      return (
                        <td
                          key={col.key}
                          className={`py-2 px-3 border border-border ${
                            col.align === 'right' ? 'right mono' : col.align === 'center' ? 'center' : ''
                          } ${col.bold || isGroup ? 'bold' : ''} ${
                            col.align === 'right' ? 'text-right font-mono' : col.align === 'center' ? 'text-center' : 'text-left'
                          } ${isGroup ? 'font-bold bg-muted/30' : ''}`}
                          style={indent > 0 ? { paddingLeft: `${indent + 12}px` } : undefined}
                        >
                          {formatCell(val, col.format)}
                        </td>
                      )
                    })}
                  </tr>
                )
              })}
            </tbody>
            {totals && (
              <tfoot>
                <tr>
                  {columns.map(col => (
                    <td
                      key={col.key}
                      className={`py-2.5 px-3 font-bold border border-border border-t-2 border-t-foreground/30 bg-muted/50 ${
                        col.align === 'right' ? 'text-right font-mono right mono' : 'text-left'
                      }`}
                    >
                      {totals[col.key] !== undefined ? formatCell(totals[col.key], col.format) : ''}
                    </td>
                  ))}
                </tr>
              </tfoot>
            )}
          </table>
        )}
      </div>

      {/* Footer */}
      <div className="mt-4 pt-3 border-t text-xs text-muted-foreground">
        Generated: {new Date().toLocaleString()}
      </div>
    </div>
  )
}
