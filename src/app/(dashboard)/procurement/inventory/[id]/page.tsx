'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { useFormatters } from '@/hooks/use-formatters'
import { FileUpload } from '@/components/shared/file-upload'

const INVENTORY_CATEGORIES = ['OFFICE_SUPPLIES', 'IT_EQUIPMENT', 'FURNITURE', 'VEHICLE_PARTS', 'MEDICAL', 'FOOD', 'OTHER'] as const
const UNITS = ['PCS', 'KG', 'LTR', 'MTR', 'BOX', 'SET', 'PACK', 'UNIT'] as const

interface Transaction {
  id: string
  type: string
  quantity: string | number
  balanceAfter: string | number
  reference: string | null
  notes: string | null
  createdAt: string
}

interface InventoryItemData {
  id: string
  itemCode: string
  name: string
  category: string | null
  unit: string
  warehouseId: string
  warehouse: { code: string; name: string; location?: string | null }
  stockInHand: string | number
  reorderLevel: string | number
  unitPrice: string | number
  totalValue: string | number
  status: string
  donorFunded: boolean
  donorId: string | null
  isActive: boolean
  createdAt: string
  updatedAt: string
  transactions: Transaction[]
}

export default function InventoryItemDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const t = useTranslations('procurement.inventory')
  const tc = useTranslations('common')
  const { formatCurrency, formatNumber, formatDate } = useFormatters()

  const [item, setItem] = useState<InventoryItemData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [formName, setFormName] = useState('')
  const [formCategory, setFormCategory] = useState('')
  const [formUnit, setFormUnit] = useState('')
  const [formReorderLevel, setFormReorderLevel] = useState('0')
  const [formUnitPrice, setFormUnitPrice] = useState('0')
  const [formDonorFunded, setFormDonorFunded] = useState(false)
  const [formIsActive, setFormIsActive] = useState(true)

  const fetchItem = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/procurement/inventory/${id}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setItem(json.data)
      } else {
        setError(json.error || t('failedToLoad'))
      }
    } catch {
      setError(t('failedToLoad'))
    } finally {
      setLoading(false)
    }
  }, [id, t])

  useEffect(() => {
    fetchItem()
  }, [fetchItem])

  function startEditing() {
    if (!item) return
    setFormName(item.name)
    setFormCategory(item.category || '')
    setFormUnit(item.unit)
    setFormReorderLevel(String(item.reorderLevel))
    setFormUnitPrice(String(item.unitPrice))
    setFormDonorFunded(item.donorFunded)
    setFormIsActive(item.isActive)
    setEditing(true)
    setError('')
  }

  function cancelEditing() {
    setEditing(false)
    setError('')
  }

  function validate(): boolean {
    if (!formName.trim()) {
      setError(t('nameRequired'))
      return false
    }
    setError('')
    return true
  }

  async function handleUpdate() {
    if (!validate()) return

    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      name: formName.trim(),
      category: formCategory || null,
      unit: formUnit,
      reorderLevel: parseFloat(formReorderLevel) || 0,
      unitPrice: parseFloat(formUnitPrice) || 0,
      donorFunded: formDonorFunded,
      isActive: formIsActive,
    }

    try {
      const res = await fetch(`/api/v1/procurement/inventory/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setEditing(false)
        await fetchItem()
      } else {
        setError(json.error || t('failedToUpdate'))
      }
    } catch {
      setError(t('failedToUpdate'))
    } finally {
      setSaving(false)
    }
  }

  // Loading skeleton
  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="space-y-2">
            <Skeleton className="h-8 w-64" />
            <Skeleton className="h-4 w-96" />
          </div>
        </div>
        <Card>
          <CardContent className="space-y-4 pt-6">
            <Skeleton className="h-6 w-48" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </CardContent>
        </Card>
      </div>
    )
  }

  // Error state
  if (error && !item) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('itemDetail')}>
          <Button variant="outline" size="sm" onClick={() => router.push('/procurement/inventory')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>
        <Card>
          <CardContent className="pt-6">
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!item) return null

  // VIEW MODE
  if (!editing) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`${t('itemCode')}: ${item.itemCode}`}
          description={t('itemDetail')}
        >
          <Button variant="outline" size="sm" onClick={() => router.push('/procurement/inventory')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                {item.name}
                <StatusBadge status={item.status} />
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailItem label={t('itemCode')} value={item.itemCode} />
              <DetailItem label={t('itemName')} value={item.name} />
              <DetailItem label={t('category')}>
                {item.category ? <StatusBadge status={item.category} /> : '\u2014'}
              </DetailItem>
              <DetailItem label={t('unit')} value={item.unit} />
              <DetailItem label={t('warehouse')} value={`${item.warehouse.code} - ${item.warehouse.name}`} />
              {item.warehouse.location && (
                <DetailItem label={t('warehouseLocation')} value={item.warehouse.location} />
              )}
              <DetailItem label={t('stockInHand')} value={formatNumber(Number(item.stockInHand))} />
              <DetailItem label={t('reorderLevel')} value={formatNumber(Number(item.reorderLevel))} />
              <DetailItem label={t('unitPrice')} value={formatCurrency(Number(item.unitPrice))} />
              <DetailItem label={t('totalValue')} value={formatCurrency(Number(item.totalValue))} />
              <DetailItem label={t('donorFunded')}>
                <Badge variant={item.donorFunded ? 'default' : 'outline'} className="text-[11px]">
                  {item.donorFunded ? tc('labels.yes') : tc('labels.no')}
                </Badge>
              </DetailItem>
              <DetailItem label={t('activeStatus')}>
                <Badge variant={item.isActive ? 'default' : 'secondary'} className="text-[11px]">
                  {item.isActive ? tc('status.ACTIVE') : tc('status.INACTIVE')}
                </Badge>
              </DetailItem>
            </div>

            {/* Metadata */}
            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <DetailItem label={tc('labels.createdAt')} value={formatDate(item.createdAt)} />
              <DetailItem label={tc('labels.updatedAt')} value={formatDate(item.updatedAt)} />
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        {item.transactions && item.transactions.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('recentTransactions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">{tc('labels.type')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('quantity')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('balanceAfter')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('reference')}</th>
                      <th className="text-left py-2 px-3 font-medium">{tc('labels.date')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {item.transactions.map((txn) => (
                      <tr key={txn.id} className="border-b last:border-0">
                        <td className="py-2 px-3"><StatusBadge status={txn.type} /></td>
                        <td className="py-2 px-3 font-mono">{formatNumber(Number(txn.quantity))}</td>
                        <td className="py-2 px-3 font-mono">{formatNumber(Number(txn.balanceAfter))}</td>
                        <td className="py-2 px-3">{txn.reference || '\u2014'}</td>
                        <td className="py-2 px-3">{formatDate(txn.createdAt)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* File Attachments */}
        <Card>
          <CardContent className="pt-6">
            <FileUpload entityType="inventory_item" entityId={id} module="procurement" readOnly={!item.isActive} />
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <Card>
          <CardContent className="flex flex-wrap gap-3 pt-6">
            <Button onClick={startEditing}>
              <Pencil className="h-4 w-4 mr-2" />
              {tc('buttons.edit')}
            </Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  // EDIT MODE
  return (
    <div className="space-y-6">
      <PageHeader
        title={t('editItem')}
        description={`${t('itemCode')}: ${item.itemCode}`}
      >
        <Button variant="outline" size="sm" onClick={cancelEditing}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.cancel')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('editItem')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Row 1: Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-inv-name">{t('itemName')} *</Label>
              <Input
                id="edit-inv-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-inv-category">{t('category')}</Label>
              <Select value={formCategory} onValueChange={setFormCategory}>
                <SelectTrigger id="edit-inv-category" className="w-full">
                  <SelectValue placeholder={t('selectCategory')} />
                </SelectTrigger>
                <SelectContent>
                  {INVENTORY_CATEGORIES.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {t(`itemCategories.${cat}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 2: Unit + Reorder Level */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-inv-unit">{t('unit')}</Label>
              <Select value={formUnit} onValueChange={setFormUnit}>
                <SelectTrigger id="edit-inv-unit" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {UNITS.map((u) => (
                    <SelectItem key={u} value={u}>
                      {t(`units.${u}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-inv-reorder">{t('reorderLevel')}</Label>
              <Input
                id="edit-inv-reorder"
                type="number"
                min="0"
                step="1"
                value={formReorderLevel}
                onChange={(e) => setFormReorderLevel(e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: Unit Price + Active */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-inv-price">{t('unitPrice')}</Label>
              <Input
                id="edit-inv-price"
                type="number"
                min="0"
                step="0.01"
                value={formUnitPrice}
                onChange={(e) => setFormUnitPrice(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-inv-active">{t('activeStatus')}</Label>
              <Select value={formIsActive ? 'true' : 'false'} onValueChange={(v) => setFormIsActive(v === 'true')}>
                <SelectTrigger id="edit-inv-active" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{tc('status.ACTIVE')}</SelectItem>
                  <SelectItem value="false">{tc('status.INACTIVE')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Donor Funded */}
          <div className="flex items-center gap-3">
            <Switch
              id="edit-inv-donor-funded"
              checked={formDonorFunded}
              onCheckedChange={setFormDonorFunded}
            />
            <Label htmlFor="edit-inv-donor-funded">{t('donorFunded')}</Label>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={cancelEditing} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleUpdate} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('saving')}
              </>
            ) : (
              tc('buttons.save')
            )}
          </Button>
        </CardFooter>
      </Card>

      {/* File Attachments */}
      <Card>
        <CardContent className="pt-6">
          <FileUpload entityType="inventory_item" entityId={id} module="procurement" readOnly={false} />
        </CardContent>
      </Card>
    </div>
  )
}

function DetailItem({
  label,
  value,
  children,
}: {
  label: string
  value?: string
  children?: React.ReactNode
}) {
  return (
    <div className="space-y-1">
      <span className="text-sm font-medium text-muted-foreground">{label}</span>
      {children ? (
        <div>{children}</div>
      ) : (
        <p className="text-sm font-medium">{value || '\u2014'}</p>
      )}
    </div>
  )
}
