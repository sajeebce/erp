'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslations } from 'next-intl'
import { ArrowLeft, Loader2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableSelect } from '@/components/shared/searchable-select'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/shared/page-header'

const INVENTORY_CATEGORIES = ['OFFICE_SUPPLIES', 'IT_EQUIPMENT', 'FURNITURE', 'VEHICLE_PARTS', 'MEDICAL', 'FOOD', 'OTHER'] as const
const UNITS = ['PCS', 'KG', 'LTR', 'MTR', 'BOX', 'SET', 'PACK', 'UNIT'] as const

interface Warehouse {
  id: string
  code: string
  name: string
}

export default function NewInventoryItemPage() {
  const router = useRouter()
  const t = useTranslations('procurement.inventory')
  const tc = useTranslations('common')

  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  // Form state
  const [itemCode, setItemCode] = useState('')
  const [name, setName] = useState('')
  const [category, setCategory] = useState('')
  const [unit, setUnit] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [stockInHand, setStockInHand] = useState('0')
  const [reorderLevel, setReorderLevel] = useState('0')
  const [unitPrice, setUnitPrice] = useState('0')
  const [donorFunded, setDonorFunded] = useState(false)

  // Lookup data
  const [warehouses, setWarehouses] = useState<Warehouse[]>([])

  useEffect(() => {
    fetch('/api/v1/procurement/warehouses?limit=100')
      .then(res => res.json())
      .then(json => { if (json.success) setWarehouses(json.data) })
      .catch(() => {})
  }, [])

  function validate(): boolean {
    if (!itemCode.trim() || !name.trim() || !unit || !warehouseId) {
      setError(t('requiredFields'))
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
      itemCode: itemCode.trim(),
      name: name.trim(),
      unit,
      warehouseId,
      stockInHand: parseFloat(stockInHand) || 0,
      reorderLevel: parseFloat(reorderLevel) || 0,
      unitPrice: parseFloat(unitPrice) || 0,
      donorFunded,
    }
    if (category) payload.category = category

    try {
      const res = await fetch('/api/v1/procurement/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()
      if (res.ok && json.success) {
        router.push('/procurement/inventory')
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
      <PageHeader title={t('newItem')} description={t('newItemDesc')}>
        <Button variant="outline" size="sm" onClick={() => router.push('/procurement/inventory')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          {tc('buttons.back')}
        </Button>
      </PageHeader>

      <Card>
        <CardHeader>
          <CardTitle>{t('newItem')}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {/* Row 1: Item Code + Name */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inv-item-code">{t('itemCode')} *</Label>
              <Input
                id="inv-item-code"
                value={itemCode}
                onChange={(e) => setItemCode(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-name">{t('itemName')} *</Label>
              <Input
                id="inv-name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </div>

          {/* Row 2: Category + Unit */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inv-category">{t('category')}</Label>
              <SearchableSelect
                id="inv-category"
                options={INVENTORY_CATEGORIES.map((cat) => ({ value: cat, label: t(`itemCategories.${cat}`) }))}
                value={category}
                onValueChange={setCategory}
                placeholder={t('selectCategory')}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-unit">{t('unit')} *</Label>
              <SearchableSelect
                id="inv-unit"
                options={UNITS.map((u) => ({ value: u, label: t(`units.${u}`) }))}
                value={unit}
                onValueChange={setUnit}
                placeholder={t('selectUnit')}
              />
            </div>
          </div>

          {/* Row 3: Warehouse */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inv-warehouse">{t('warehouse')} *</Label>
              <SearchableSelect
                id="inv-warehouse"
                options={warehouses.map((wh) => ({ value: wh.id, label: `${wh.code} - ${wh.name}` }))}
                value={warehouseId}
                onValueChange={setWarehouseId}
                placeholder={t('selectWarehouse')}
              />
            </div>
          </div>

          {/* Row 4: Stock + Reorder + Price */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label htmlFor="inv-stock">{t('stockInHand')}</Label>
              <Input
                id="inv-stock"
                type="number"
                min="0"
                step="1"
                value={stockInHand}
                onChange={(e) => setStockInHand(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-reorder">{t('reorderLevel')}</Label>
              <Input
                id="inv-reorder"
                type="number"
                min="0"
                step="1"
                value={reorderLevel}
                onChange={(e) => setReorderLevel(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="inv-price">{t('unitPrice')}</Label>
              <Input
                id="inv-price"
                type="number"
                min="0"
                step="0.01"
                value={unitPrice}
                onChange={(e) => setUnitPrice(e.target.value)}
              />
            </div>
          </div>

          {/* Row 5: Donor Funded */}
          <div className="flex items-center gap-3">
            <Switch
              id="inv-donor-funded"
              checked={donorFunded}
              onCheckedChange={setDonorFunded}
            />
            <Label htmlFor="inv-donor-funded">{t('donorFunded')}</Label>
          </div>
        </CardContent>

        <CardFooter className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => router.push('/procurement/inventory')} disabled={saving}>
            {tc('buttons.cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
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
