'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { PageHeader } from '@/components/shared/page-header'

const CONDITIONS = ['NEW', 'GOOD', 'FAIR', 'POOR'] as const

interface AssetCategory {
  id: string
  code: string
  name: string
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

function todayISO() {
  return new Date().toISOString().split('T')[0]
}

export default function NewAssetPage() {
  const router = useRouter()
  const t = useTranslations('assets')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [purchaseDate, setPurchaseDate] = useState(todayISO())
  const [purchasePrice, setPurchasePrice] = useState('')
  const [serialNumber, setSerialNumber] = useState('')
  const [barcode, setBarcode] = useState('')
  const [condition, setCondition] = useState<string>('NEW')
  const [warehouseId, setWarehouseId] = useState('')
  const [projectId, setProjectId] = useState('')
  const [warrantyExpiry, setWarrantyExpiry] = useState('')
  const [insuranceInfo, setInsuranceInfo] = useState('')
  const [notes, setNotes] = useState('')

  // Lookup data
  const [categories, setCategories] = useState<AssetCategory[]>([])
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])
  const [projects, setProjects] = useState<Project[]>([])

  useEffect(() => {
    fetch('/api/v1/assets/categories?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setCategories(json.data) })
      .catch(() => {})

    fetch('/api/v1/procurement/warehouses?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setWarehouses(json.data) })
      .catch(() => {})

    fetch('/api/v1/projects?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setProjects(json.data) })
      .catch(() => {})
  }, [])

  function validate(): boolean {
    if (!name.trim() || !categoryId || !purchaseDate) {
      setError(t('requiredFields'))
      return false
    }
    const price = parseFloat(purchasePrice)
    if (!purchasePrice || isNaN(price) || price < 0) {
      setError(t('priceRequired'))
      return false
    }
    setError('')
    return true
  }

  async function handleSubmit() {
    if (!validate()) return

    setSaving(true)
    setError('')

    const payload: Record<string, unknown> = {
      name: name.trim(),
      categoryId,
      purchaseDate,
      purchasePrice: parseFloat(purchasePrice),
      condition,
    }
    if (description.trim()) payload.description = description.trim()
    if (serialNumber.trim()) payload.serialNumber = serialNumber.trim()
    if (barcode.trim()) payload.barcode = barcode.trim()
    if (warehouseId) payload.warehouseId = warehouseId
    if (projectId) payload.projectId = projectId
    if (warrantyExpiry) payload.warrantyExpiry = warrantyExpiry
    if (insuranceInfo.trim()) payload.insuranceInfo = insuranceInfo.trim()
    if (notes.trim()) payload.notes = notes.trim()

    try {
      const res = await fetch('/api/v1/assets', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push('/assets')
      } else {
        setError(json.error || t('failedToCreate'))
      }
    } catch {
      setError(t('failedToCreate'))
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title={t('newAsset')} description={t('newAssetDesc')}>
        <Button variant="outline" size="sm" onClick={() => router.push('/assets')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('newAsset')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Row 1: Name + Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset-name">{t('fields.name')} *</Label>
              <Input
                id="asset-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset-category">{t('fields.category')} *</Label>
              <SearchableSelect
                id="asset-category"
                options={categories.map((cat) => ({ value: cat.id, label: `${cat.code} - ${cat.name}` }))}
                value={categoryId}
                onValueChange={setCategoryId}
                placeholder={t('selectCategory')}
              />
            </div>
          </div>

          {/* Row 2: Purchase Date + Purchase Price */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset-purchase-date">{t('fields.purchaseDate')} *</Label>
              <Input
                id="asset-purchase-date"
                type="date"
                value={purchaseDate}
                onChange={(e) => setPurchaseDate(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset-purchase-price">{t('fields.purchasePrice')} *</Label>
              <Input
                id="asset-purchase-price"
                type="number"
                min="0"
                step="0.01"
                value={purchasePrice}
                onChange={(e) => setPurchasePrice(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Row 3: Serial Number + Barcode */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset-serial">{t('serialNumber')}</Label>
              <Input
                id="asset-serial"
                value={serialNumber}
                onChange={(e) => setSerialNumber(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset-barcode">{t('barcode')}</Label>
              <Input
                id="asset-barcode"
                value={barcode}
                onChange={(e) => setBarcode(e.target.value)}
              />
            </div>
          </div>

          {/* Row 4: Condition + Warehouse */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset-condition">{t('fields.condition')}</Label>
              <SearchableSelect
                id="asset-condition"
                options={CONDITIONS.map((c) => ({ value: c, label: tc(`status.${c}`) }))}
                value={condition}
                onValueChange={setCondition}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset-warehouse">{t('warehouse')}</Label>
              <SearchableSelect
                id="asset-warehouse"
                options={warehouses.map((wh) => ({ value: wh.id, label: `${wh.code} - ${wh.name}` }))}
                value={warehouseId}
                onValueChange={setWarehouseId}
                placeholder={t('selectWarehouse')}
              />
            </div>
          </div>

          {/* Row 5: Project + Warranty */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="asset-project">{t('project')}</Label>
              <SearchableSelect
                id="asset-project"
                options={projects.map((p) => ({ value: p.id, label: `${p.projectNo} - ${p.name}` }))}
                value={projectId}
                onValueChange={setProjectId}
                placeholder={t('selectProject')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="asset-warranty">{t('warrantyExpiry')}</Label>
              <Input
                id="asset-warranty"
                type="date"
                value={warrantyExpiry}
                onChange={(e) => setWarrantyExpiry(e.target.value)}
              />
            </div>
          </div>

          {/* Row 6: Description */}
          <div className="space-y-2">
            <Label htmlFor="asset-description">{tc('labels.description')}</Label>
            <Textarea
              id="asset-description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>

          {/* Row 7: Insurance Info */}
          <div className="space-y-2">
            <Label htmlFor="asset-insurance">{t('insuranceInfo')}</Label>
            <Input
              id="asset-insurance"
              value={insuranceInfo}
              onChange={(e) => setInsuranceInfo(e.target.value)}
            />
          </div>

          {/* Row 8: Notes */}
          <div className="space-y-2">
            <Label htmlFor="asset-notes">{tc('labels.notes')}</Label>
            <Textarea
              id="asset-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
            />
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/assets')} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                {t('saving')}
              </>
            ) : (
              t('registerAsset')
            )}
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
