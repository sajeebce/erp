'use client'

import { useEffect, useState, useCallback } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2, Pencil } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { PageHeader } from '@/components/shared/page-header'
import { StatusBadge } from '@/components/shared/status-badge'
import { useFormatters } from '@/hooks/use-formatters'

const CONDITIONS = ['NEW', 'GOOD', 'FAIR', 'POOR', 'DAMAGED'] as const

interface AssetCategory {
  id: string
  code: string
  name: string
  usefulLife?: number
  depreciationMethod?: string
  depreciationRate?: number | string
}

interface DepreciationRecord {
  id: string
  period: string
  amount: string | number
  accumulatedAmount: string | number
  netBookValue: string | number
}

interface TransferRecord {
  id: string
  fromLocation: string | null
  toLocation: string | null
  reason: string | null
  status: string
  createdAt: string
}

interface MaintenanceRecord {
  id: string
  type: string
  scheduledDate: string
  completionDate: string | null
  cost: string | number | null
  status: string
}

interface DisposalRecord {
  id: string
  method: string
  disposalDate: string | null
  saleAmount: string | number | null
  reason: string | null
  status: string
}

interface Warehouse {
  id: string
  code: string
  name: string
}

interface Project {
  id: string
  projectNo: string
  name: string
}

interface AssetData {
  id: string
  assetNo: string
  name: string
  description: string | null
  categoryId: string
  category: AssetCategory
  purchaseDate: string
  purchasePrice: string | number
  serialNumber: string | null
  barcode: string | null
  condition: string
  accumulatedDepreciation: string | number
  netBookValue: string | number
  warehouseId: string | null
  warehouse: { id: string; name: string; code: string } | null
  projectId: string | null
  project: { id: string; projectNo: string; name: string } | null
  custodianId: string | null
  donorId: string | null
  insuranceInfo: string | null
  warrantyExpiry: string | null
  notes: string | null
  isActive: boolean
  createdAt: string
  updatedAt?: string
  depreciationRecords: DepreciationRecord[]
  transfers: TransferRecord[]
  maintenanceRecords: MaintenanceRecord[]
  disposal: DisposalRecord | null
}

export default function AssetDetailPage() {
  const router = useRouter()
  const params = useParams()
  const id = params.id as string
  const t = useTranslations('assets')
  const tc = useTranslations('common')
  const { formatCurrency, formatDate } = useFormatters()

  const [asset, setAsset] = useState<AssetData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit form state
  const [formName, setFormName] = useState('')
  const [formDescription, setFormDescription] = useState('')
  const [formSerialNumber, setFormSerialNumber] = useState('')
  const [formBarcode, setFormBarcode] = useState('')
  const [formCondition, setFormCondition] = useState('')
  const [formWarehouseId, setFormWarehouseId] = useState('')
  const [formProjectId, setFormProjectId] = useState('')
  const [formWarrantyExpiry, setFormWarrantyExpiry] = useState('')
  const [formInsuranceInfo, setFormInsuranceInfo] = useState('')
  const [formNotes, setFormNotes] = useState('')
  const [formPurchasePrice, setFormPurchasePrice] = useState('')
  const [formIsActive, setFormIsActive] = useState(true)

  // Lookup data
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  const fetchAsset = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/v1/assets/${id}`)
      const json = await res.json()
      if (res.ok && json.success) {
        setAsset(json.data)
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
    fetchAsset()
  }, [fetchAsset])

  useEffect(() => {
    fetch('/api/v1/procurement/warehouses?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setWarehouses(json.data) })
      .catch(() => {})

    fetch('/api/v1/projects?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setProjects(json.data) })
      .catch(() => {})
  }, [])

  function startEditing() {
    if (!asset) return
    setFormName(asset.name)
    setFormDescription(asset.description || '')
    setFormSerialNumber(asset.serialNumber || '')
    setFormBarcode(asset.barcode || '')
    setFormCondition(asset.condition)
    setFormWarehouseId(asset.warehouseId || '')
    setFormProjectId(asset.projectId || '')
    setFormWarrantyExpiry(asset.warrantyExpiry?.split('T')[0] || '')
    setFormInsuranceInfo(asset.insuranceInfo || '')
    setFormNotes(asset.notes || '')
    setFormPurchasePrice(String(asset.purchasePrice))
    setFormIsActive(asset.isActive)
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
      description: formDescription.trim() || null,
      serialNumber: formSerialNumber.trim() || null,
      barcode: formBarcode.trim() || null,
      condition: formCondition,
      warehouseId: formWarehouseId || null,
      projectId: formProjectId || null,
      warrantyExpiry: formWarrantyExpiry || null,
      insuranceInfo: formInsuranceInfo.trim() || null,
      notes: formNotes.trim() || null,
      purchasePrice: parseFloat(formPurchasePrice) || 0,
      isActive: formIsActive,
    }

    try {
      const res = await fetch(`/api/v1/assets/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        setEditing(false)
        await fetchAsset()
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
  if (error && !asset) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('assetDetail')}>
          <Button variant="outline" size="sm" onClick={() => router.push('/assets')}>
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

  if (!asset) return null

  // VIEW MODE
  if (!editing) {
    return (
      <div className="space-y-6">
        <PageHeader
          title={`${t('fields.assetNo')}: ${asset.assetNo}`}
          description={t('assetDetail')}
        >
          <Button variant="outline" size="sm" onClick={() => router.push('/assets')}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {tc('buttons.back')}
          </Button>
        </PageHeader>

        {error && (
          <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
            {error}
          </div>
        )}

        {/* Main Details */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-3">
                {asset.name}
                <StatusBadge status={asset.condition} />
                <Badge variant={asset.isActive ? 'default' : 'secondary'} className="text-[11px]">
                  {asset.isActive ? tc('status.ACTIVE') : tc('status.INACTIVE')}
                </Badge>
              </CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              <DetailItem label={t('fields.assetNo')} value={asset.assetNo} />
              <DetailItem label={t('fields.name')} value={asset.name} />
              <DetailItem label={t('fields.category')} value={`${asset.category.code} - ${asset.category.name}`} />
              <DetailItem label={t('fields.purchaseDate')} value={formatDate(asset.purchaseDate)} />
              <DetailItem label={t('fields.purchasePrice')} value={formatCurrency(Number(asset.purchasePrice))} />
              <DetailItem label={t('fields.netBookValue')} value={formatCurrency(Number(asset.netBookValue))} />
              <DetailItem label={t('accumulatedDepreciation')} value={formatCurrency(Number(asset.accumulatedDepreciation))} />
              <DetailItem label={t('fields.condition')}>
                <StatusBadge status={asset.condition} />
              </DetailItem>
              {asset.serialNumber && (
                <DetailItem label={t('serialNumber')} value={asset.serialNumber} />
              )}
              {asset.barcode && (
                <DetailItem label={t('barcode')} value={asset.barcode} />
              )}
              {asset.warehouse && (
                <DetailItem label={t('warehouse')} value={`${asset.warehouse.code} - ${asset.warehouse.name}`} />
              )}
              {asset.project && (
                <DetailItem label={t('project')} value={`${asset.project.projectNo} - ${asset.project.name}`} />
              )}
              {asset.warrantyExpiry && (
                <DetailItem label={t('warrantyExpiry')} value={formatDate(asset.warrantyExpiry)} />
              )}
              {asset.insuranceInfo && (
                <DetailItem label={t('insuranceInfo')} value={asset.insuranceInfo} />
              )}
            </div>

            {asset.description && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">{tc('labels.description')}</span>
                <p className="text-sm">{asset.description}</p>
              </div>
            )}

            {asset.notes && (
              <div className="space-y-1">
                <span className="text-sm font-medium text-muted-foreground">{tc('labels.notes')}</span>
                <p className="text-sm">{asset.notes}</p>
              </div>
            )}

            {/* Metadata */}
            <div className="border-t pt-4 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <DetailItem label={tc('labels.createdAt')} value={formatDate(asset.createdAt)} />
              {asset.updatedAt && (
                <DetailItem label={tc('labels.updatedAt')} value={formatDate(asset.updatedAt)} />
              )}
            </div>
          </CardContent>
        </Card>

        {/* Depreciation Records */}
        {asset.depreciationRecords && asset.depreciationRecords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('depreciation.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">{t('depreciationPeriod')}</th>
                      <th className="text-left py-2 px-3 font-medium">{tc('labels.amount')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('depreciation.accumDepreciation')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('fields.netBookValue')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asset.depreciationRecords.map((rec) => (
                      <tr key={rec.id} className="border-b last:border-0">
                        <td className="py-2 px-3">{rec.period}</td>
                        <td className="py-2 px-3 font-mono">{formatCurrency(Number(rec.amount))}</td>
                        <td className="py-2 px-3 font-mono">{formatCurrency(Number(rec.accumulatedAmount))}</td>
                        <td className="py-2 px-3 font-mono">{formatCurrency(Number(rec.netBookValue))}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Transfer History */}
        {asset.transfers && asset.transfers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('transfer.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">{tc('labels.date')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('transfer.fromLocation')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('transfer.toLocation')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('transfer.reason')}</th>
                      <th className="text-left py-2 px-3 font-medium">{tc('labels.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asset.transfers.map((tr) => (
                      <tr key={tr.id} className="border-b last:border-0">
                        <td className="py-2 px-3">{formatDate(tr.createdAt)}</td>
                        <td className="py-2 px-3">{tr.fromLocation || '\u2014'}</td>
                        <td className="py-2 px-3">{tr.toLocation || '\u2014'}</td>
                        <td className="py-2 px-3">{tr.reason || '\u2014'}</td>
                        <td className="py-2 px-3"><StatusBadge status={tr.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Maintenance Records */}
        {asset.maintenanceRecords && asset.maintenanceRecords.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>{t('maintenance.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-2 px-3 font-medium">{t('maintenance.type')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('maintenance.scheduledDate')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('maintenance.completionDate')}</th>
                      <th className="text-left py-2 px-3 font-medium">{t('maintenance.cost')}</th>
                      <th className="text-left py-2 px-3 font-medium">{tc('labels.status')}</th>
                    </tr>
                  </thead>
                  <tbody>
                    {asset.maintenanceRecords.map((mr) => (
                      <tr key={mr.id} className="border-b last:border-0">
                        <td className="py-2 px-3"><StatusBadge status={mr.type} /></td>
                        <td className="py-2 px-3">{formatDate(mr.scheduledDate)}</td>
                        <td className="py-2 px-3">{mr.completionDate ? formatDate(mr.completionDate) : '\u2014'}</td>
                        <td className="py-2 px-3 font-mono">{mr.cost ? formatCurrency(Number(mr.cost)) : '\u2014'}</td>
                        <td className="py-2 px-3"><StatusBadge status={mr.status} /></td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Disposal */}
        {asset.disposal && (
          <Card>
            <CardHeader>
              <CardTitle>{t('disposal.title')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <DetailItem label={t('disposal.disposalMethod')} value={asset.disposal.method} />
                {asset.disposal.disposalDate && (
                  <DetailItem label={t('disposal.disposalDate')} value={formatDate(asset.disposal.disposalDate)} />
                )}
                {asset.disposal.saleAmount && (
                  <DetailItem label={t('disposal.saleAmount')} value={formatCurrency(Number(asset.disposal.saleAmount))} />
                )}
                {asset.disposal.reason && (
                  <DetailItem label={t('disposal.reason')} value={asset.disposal.reason} />
                )}
                <DetailItem label={tc('labels.status')}>
                  <StatusBadge status={asset.disposal.status} />
                </DetailItem>
              </div>
            </CardContent>
          </Card>
        )}

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
        title={t('editAsset')}
        description={`${t('fields.assetNo')}: ${asset.assetNo}`}
      >
        <Button variant="outline" size="sm" onClick={cancelEditing}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.cancel')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('editAsset')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Row 1: Name + Purchase Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-asset-name">{t('fields.name')} *</Label>
              <Input
                id="edit-asset-name"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-asset-price">{t('fields.purchasePrice')}</Label>
              <Input
                id="edit-asset-price"
                type="number"
                min="0"
                step="0.01"
                value={formPurchasePrice}
                onChange={(e) => setFormPurchasePrice(e.target.value)}
              />
            </div>
          </div>

          {/* Row 2: Serial Number + Barcode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-asset-serial">{t('serialNumber')}</Label>
              <Input
                id="edit-asset-serial"
                value={formSerialNumber}
                onChange={(e) => setFormSerialNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-asset-barcode">{t('barcode')}</Label>
              <Input
                id="edit-asset-barcode"
                value={formBarcode}
                onChange={(e) => setFormBarcode(e.target.value)}
              />
            </div>
          </div>

          {/* Row 3: Condition + Active */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-asset-condition">{t('fields.condition')}</Label>
              <Select value={formCondition} onValueChange={setFormCondition}>
                <SelectTrigger id="edit-asset-condition" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONDITIONS.map((c) => (
                    <SelectItem key={c} value={c}>
                      {tc(`status.${c}`)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-asset-active">{t('activeStatus')}</Label>
              <Select value={formIsActive ? 'true' : 'false'} onValueChange={(v) => setFormIsActive(v === 'true')}>
                <SelectTrigger id="edit-asset-active" className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="true">{tc('status.ACTIVE')}</SelectItem>
                  <SelectItem value="false">{tc('status.INACTIVE')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 4: Warehouse + Project */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-asset-warehouse">{t('warehouse')}</Label>
              <Select value={formWarehouseId} onValueChange={setFormWarehouseId}>
                <SelectTrigger id="edit-asset-warehouse" className="w-full">
                  <SelectValue placeholder={t('selectWarehouse')} />
                </SelectTrigger>
                <SelectContent>
                  {warehouses.map((wh) => (
                    <SelectItem key={wh.id} value={wh.id}>
                      {wh.code} - {wh.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-asset-project">{t('project')}</Label>
              <Select value={formProjectId} onValueChange={setFormProjectId}>
                <SelectTrigger id="edit-asset-project" className="w-full">
                  <SelectValue placeholder={t('selectProject')} />
                </SelectTrigger>
                <SelectContent>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>
                      {p.projectNo} - {p.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Row 5: Warranty + Insurance */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="edit-asset-warranty">{t('warrantyExpiry')}</Label>
              <Input
                id="edit-asset-warranty"
                type="date"
                value={formWarrantyExpiry}
                onChange={(e) => setFormWarrantyExpiry(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="edit-asset-insurance">{t('insuranceInfo')}</Label>
              <Input
                id="edit-asset-insurance"
                value={formInsuranceInfo}
                onChange={(e) => setFormInsuranceInfo(e.target.value)}
              />
            </div>
          </div>

          {/* Row 6: Description */}
          <div className="space-y-2">
            <Label htmlFor="edit-asset-description">{tc('labels.description')}</Label>
            <Textarea
              id="edit-asset-description"
              value={formDescription}
              onChange={(e) => setFormDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Row 7: Notes */}
          <div className="space-y-2">
            <Label htmlFor="edit-asset-notes">{tc('labels.notes')}</Label>
            <Textarea
              id="edit-asset-notes"
              value={formNotes}
              onChange={(e) => setFormNotes(e.target.value)}
              rows={3}
            />
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
