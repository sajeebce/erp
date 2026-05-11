'use client'

import { useCallback, useEffect, useState } from 'react'
import { useTranslations } from 'next-intl'
import {
  Pencil, Save, X, Loader2, Check,
  Shield, Mail, Receipt, Settings, Hash, Server, Database,
  Cloud,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Switch } from '@/components/ui/switch'
import { PageHeader } from '@/components/shared/page-header'
import { SearchableSelect } from '@/components/shared/searchable-select'
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from '@/components/ui/table'

// ─── Types ───

interface NumberSequence {
  id: string
  entity: string
  prefix: string
  separator: string
  includeYear: boolean
  currentValue: number
  padLength: number
}

type SectionId = 'security' | 'email' | 'storage' | 'tax' | 'defaults' | 'numberSequences'

// ─── Reusable Components ───

function FieldRow({ label, value }: { label: React.ReactNode; value: React.ReactNode }) {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center justify-between py-3 border-b last:border-0 gap-1">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium sm:text-right sm:max-w-[60%]">{value || '—'}</span>
    </div>
  )
}

function EditRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

function SectionHeader({
  title,
  description,
  icon: Icon,
  editing,
  saving,
  onEdit,
  onSave,
  onCancel,
  savedLabel,
  saveLabel,
  cancelLabel,
  readOnly,
}: {
  title: string
  description?: string
  icon?: React.ElementType
  editing: boolean
  saving: boolean
  onEdit: () => void
  onSave: () => void
  onCancel: () => void
  savedLabel?: string | null
  saveLabel: string
  cancelLabel: string
  readOnly?: boolean
}) {
  return (
    <CardHeader className="flex flex-row items-start justify-between space-y-0 gap-4">
      <div className="flex items-start gap-3">
        {Icon && <Icon className="h-5 w-5 text-muted-foreground mt-0.5 shrink-0" />}
        <div>
          <div className="flex items-center gap-2">
            <CardTitle className="text-base">{title}</CardTitle>
            {savedLabel && (
              <Badge variant="secondary" className="bg-emerald-100 text-emerald-700 text-xs">
                <Check className="h-3 w-3 mr-1" />{savedLabel}
              </Badge>
            )}
          </div>
          {description && <CardDescription className="mt-0.5">{description}</CardDescription>}
        </div>
      </div>
      {!readOnly && (
        editing ? (
          <div className="flex items-center gap-2 shrink-0">
            <Button size="sm" variant="ghost" onClick={onCancel} disabled={saving}>
              <X className="h-4 w-4 mr-1" />{cancelLabel}
            </Button>
            <Button size="sm" onClick={onSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Save className="h-4 w-4 mr-1" />}
              {saveLabel}
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={onEdit} className="shrink-0">
            <Pencil className="h-4 w-4" />
          </Button>
        )
      )}
    </CardHeader>
  )
}

// ─── Main Page ───

export default function SystemConfigurationPage() {
  const t = useTranslations('settings.system')
  const tc = useTranslations('common')

  const [config, setConfig] = useState<Record<string, unknown>>({})
  const [sequences, setSequences] = useState<NumberSequence[]>([])
  const [loading, setLoading] = useState(true)

  // Section edit state
  const [editingSection, setEditingSection] = useState<SectionId | null>(null)
  const [saving, setSaving] = useState(false)
  const [savedSection, setSavedSection] = useState<SectionId | null>(null)
  const [error, setError] = useState('')
  const [formFields, setFormFields] = useState<Record<string, unknown>>({})
  const [seqEdits, setSeqEdits] = useState<NumberSequence[]>([])

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/v1/settings/system')
      const json = await res.json()

      if (json.success) {
        setConfig(json.data.config)
        setSequences(json.data.numberSequences)
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  function cfg(key: string): string | number | boolean {
    return (config[key] as string | number | boolean) ?? ''
  }

  function startEditing(section: SectionId) {
    setEditingSection(section)
    setError('')
    setSavedSection(null)

    if (section === 'numberSequences') {
      setSeqEdits(sequences.map(s => ({ ...s })))
    } else {
      // Extract section fields from config
      const prefix = section + '.'
      const fields: Record<string, unknown> = {}
      for (const [key, value] of Object.entries(config)) {
        if (key.startsWith(prefix)) {
          fields[key.replace(prefix, '')] = value
        }
      }
      setFormFields(fields)
    }
  }

  function cancelEditing() {
    setEditingSection(null)
    setFormFields({})
    setSeqEdits([])
    setError('')
  }

  async function handleSave() {
    setSaving(true)
    setError('')

    try {
      let payload: { section: string; data: unknown }

      if (editingSection === 'numberSequences') {
        payload = { section: 'numberSequences', data: seqEdits.map(s => ({ id: s.id, prefix: s.prefix, separator: s.separator, includeYear: s.includeYear, padLength: s.padLength })) }
      } else {
        payload = { section: editingSection!, data: formFields }
      }

      const res = await fetch('/api/v1/settings/system', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      const json = await res.json()

      if (!json.success) {
        setError(json.error?.message || t('saveFailed'))
        return
      }

      setConfig(json.data.config)
      setSequences(json.data.numberSequences)
      const saved = editingSection
      setEditingSection(null)
      setSavedSection(saved)
      setTimeout(() => setSavedSection(null), 3000)
    } catch {
      setError(t('saveFailed'))
    } finally {
      setSaving(false)
    }
  }

  function setField(key: string, value: unknown) {
    setFormFields(prev => ({ ...prev, [key]: value }))
  }

  function updateSeq(index: number, field: keyof NumberSequence, value: unknown) {
    setSeqEdits(prev => prev.map((s, i) => i === index ? { ...s, [field]: value } : s))
  }

  const isEditing = (s: SectionId) => editingSection === s
  const isSaved = (s: SectionId) => savedSection === s

  function seqExample(seq: NumberSequence): string {
    const next = seq.currentValue + 1
    const numPart = String(next).padStart(seq.padLength, '0')
    if (seq.includeYear) {
      return `${seq.prefix}${seq.separator}${new Date().getFullYear()}${seq.separator}${numPart}`
    }
    return `${seq.prefix}${seq.separator}${numPart}`
  }

  const twoFaLabels: Record<string, string> = {
    disabled: t('twoFaDisabled'),
    optional: t('twoFaOptional'),
    required: t('twoFaRequired'),
  }

  // ─── Loading ───
  if (loading) {
    return (
      <div className="space-y-6">
        <PageHeader title={t('title')} description={t('description')} />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {[1, 2, 3, 4].map(i => (
            <Card key={i}><CardHeader className="pb-2"><Skeleton className="h-4 w-24" /></CardHeader><CardContent><Skeleton className="h-8 w-16" /></CardContent></Card>
          ))}
        </div>
        {[1, 2, 3, 4].map(i => (
          <Card key={i}>
            <CardHeader><Skeleton className="h-5 w-48" /></CardHeader>
            <CardContent className="space-y-3">
              {[1, 2, 3].map(j => (
                <div key={j} className="flex justify-between"><Skeleton className="h-4 w-32" /><Skeleton className="h-4 w-48" /></div>
              ))}
            </CardContent>
          </Card>
        ))}
      </div>
    )
  }

  // ─── Render ───
  return (
    <div className="space-y-6">
      <PageHeader title={t('title')} description={t('description')} />

      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('systemVersion')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Server className="h-4 w-4 text-blue-500" />
              <p className="text-2xl font-bold">v3.4.1</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('numberSequencesCount')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Database className="h-4 w-4 text-emerald-500" />
              <p className="text-2xl font-bold">{sequences.length}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{t('configuredSequences')}</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('securityScore')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Shield className="h-4 w-4 text-emerald-500" />
              <p className="text-2xl font-bold">
                {cfg('security.twoFactorAuth') === 'required' ? '95' : cfg('security.twoFactorAuth') === 'optional' ? '87' : '72'}/100
              </p>
            </div>
            {cfg('security.twoFactorAuth') !== 'required' && (
              <p className="text-xs text-muted-foreground mt-1">{t('enable2faToReach', { score: '95' })}</p>
            )}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">{t('emailSmtp')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-violet-500" />
              <p className="text-2xl font-bold">{String(cfg('email.smtpServer')) ? t('configured') : t('notConfigured')}</p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">{String(cfg('email.smtpServer')) || '—'}</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ─── Security & Authentication ─── */}
        <Card>
          <SectionHeader
            title={t('securityAuth')}
            description={t('securityAuthDesc')}
            icon={Shield}
            editing={isEditing('security')}
            saving={saving}
            onEdit={() => startEditing('security')}
            onSave={handleSave}
            onCancel={cancelEditing}
            savedLabel={isSaved('security') ? t('saved') : null}
            saveLabel={tc('buttons.save')}
            cancelLabel={tc('buttons.cancel')}
          />
          <CardContent>
            {isEditing('security') ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditRow label={t('minPasswordLength')}>
                  <Input type="number" min={6} max={32} value={String(formFields.minPasswordLength ?? '')} onChange={e => setField('minPasswordLength', Number(e.target.value))} />
                </EditRow>
                <EditRow label={t('passwordComplexity')}>
                  <SearchableSelect
                    id="security-password-complexity"
                    options={[
                      { value: 'uppercase+number+special', label: t('complexityHigh') },
                      { value: 'uppercase+number', label: t('complexityMedium') },
                      { value: 'none', label: t('complexityNone') },
                    ]}
                    value={String(formFields.passwordComplexity ?? '')}
                    onValueChange={v => setField('passwordComplexity', v)}
                  />
                </EditRow>
                <EditRow label={t('passwordExpiryDays')}>
                  <Input type="number" min={0} max={365} value={String(formFields.passwordExpiryDays ?? '')} onChange={e => setField('passwordExpiryDays', Number(e.target.value))} />
                </EditRow>
                <EditRow label={t('maxLoginAttempts')}>
                  <Input type="number" min={1} max={20} value={String(formFields.maxLoginAttempts ?? '')} onChange={e => setField('maxLoginAttempts', Number(e.target.value))} />
                </EditRow>
                <EditRow label={t('lockoutMinutes')}>
                  <Input type="number" min={1} max={120} value={String(formFields.lockoutMinutes ?? '')} onChange={e => setField('lockoutMinutes', Number(e.target.value))} />
                </EditRow>
                <EditRow label={t('sessionTimeoutMinutes')}>
                  <Input type="number" min={5} max={480} value={String(formFields.sessionTimeoutMinutes ?? '')} onChange={e => setField('sessionTimeoutMinutes', Number(e.target.value))} />
                </EditRow>
                <EditRow label={t('twoFactorAuth')}>
                  <SearchableSelect
                    id="security-two-factor-auth"
                    options={[
                      { value: 'disabled', label: t('twoFaDisabled') },
                      { value: 'optional', label: t('twoFaOptional') },
                      { value: 'required', label: t('twoFaRequired') },
                    ]}
                    value={String(formFields.twoFactorAuth ?? '')}
                    onValueChange={v => setField('twoFactorAuth', v)}
                  />
                </EditRow>
                <EditRow label={t('auditLogRetentionDays')}>
                  <Input type="number" min={30} max={3650} value={String(formFields.auditLogRetentionDays ?? '')} onChange={e => setField('auditLogRetentionDays', Number(e.target.value))} />
                </EditRow>
              </div>
            ) : (
              <div>
                <FieldRow label={t('minPasswordLength')} value={`${cfg('security.minPasswordLength')} ${t('characters')}`} />
                <FieldRow label={t('passwordComplexity')} value={
                  cfg('security.passwordComplexity') === 'uppercase+number+special'
                    ? t('complexityHigh')
                    : cfg('security.passwordComplexity') === 'uppercase+number'
                      ? t('complexityMedium')
                      : t('complexityNone')
                } />
                <FieldRow label={t('passwordExpiryDays')} value={`${cfg('security.passwordExpiryDays')} ${t('days')}`} />
                <FieldRow label={t('maxLoginAttempts')} value={`${cfg('security.maxLoginAttempts')} (${t('thenLockout', { minutes: String(cfg('security.lockoutMinutes')) })})`} />
                <FieldRow label={t('sessionTimeoutMinutes')} value={`${cfg('security.sessionTimeoutMinutes')} ${t('minutes')}`} />
                <FieldRow label={t('twoFactorAuth')} value={
                  <Badge variant={cfg('security.twoFactorAuth') === 'required' ? 'default' : 'outline'}>
                    {twoFaLabels[String(cfg('security.twoFactorAuth'))] || String(cfg('security.twoFactorAuth'))}
                  </Badge>
                } />
                <FieldRow label={t('ipWhitelist')} value={
                  <Badge variant="outline">{cfg('security.ipWhitelist') ? tc('status.ACTIVE') : t('ipWhitelistOff')}</Badge>
                } />
                <FieldRow label={t('auditLogRetentionDays')} value={`${cfg('security.auditLogRetentionDays')} ${t('days')}`} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Email / SMTP ─── */}
        <Card>
          <SectionHeader
            title={t('emailSmtp')}
            description={t('emailSmtpDesc')}
            icon={Mail}
            editing={isEditing('email')}
            saving={saving}
            onEdit={() => startEditing('email')}
            onSave={handleSave}
            onCancel={cancelEditing}
            savedLabel={isSaved('email') ? t('saved') : null}
            saveLabel={tc('buttons.save')}
            cancelLabel={tc('buttons.cancel')}
          />
          <CardContent>
            {isEditing('email') ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditRow label={t('smtpServer')}>
                  <Input value={String(formFields.smtpServer ?? '')} onChange={e => setField('smtpServer', e.target.value)} placeholder="smtp.example.com" />
                </EditRow>
                <EditRow label={t('smtpPort')}>
                  <Input type="number" value={String(formFields.smtpPort ?? '')} onChange={e => setField('smtpPort', Number(e.target.value))} />
                </EditRow>
                <EditRow label={t('smtpSecurity')}>
                  <SearchableSelect
                    id="email-smtp-security"
                    options={[
                      { value: 'STARTTLS', label: 'STARTTLS' },
                      { value: 'SSL', label: 'SSL/TLS' },
                      { value: 'NONE', label: t('noEncryption') },
                    ]}
                    value={String(formFields.smtpSecurity ?? '')}
                    onValueChange={v => setField('smtpSecurity', v)}
                  />
                </EditRow>
                <EditRow label={t('fromAddress')}>
                  <Input type="email" value={String(formFields.fromAddress ?? '')} onChange={e => setField('fromAddress', e.target.value)} placeholder="noreply@example.com" />
                </EditRow>
                <EditRow label={t('fromName')}>
                  <Input value={String(formFields.fromName ?? '')} onChange={e => setField('fromName', e.target.value)} placeholder="NGO ERP System" />
                </EditRow>
                <EditRow label={t('dailySendLimit')}>
                  <Input type="number" min={1} value={String(formFields.dailySendLimit ?? '')} onChange={e => setField('dailySendLimit', Number(e.target.value))} />
                </EditRow>
              </div>
            ) : (
              <div>
                <FieldRow label={t('smtpServer')} value={String(cfg('email.smtpServer')) || <span className="text-muted-foreground italic">{t('notConfigured')}</span>} />
                <FieldRow label={t('smtpPort')} value={`${cfg('email.smtpPort')} (${cfg('email.smtpSecurity')})`} />
                <FieldRow label={t('fromAddress')} value={String(cfg('email.fromAddress')) || <span className="text-muted-foreground italic">{t('notConfigured')}</span>} />
                <FieldRow label={t('fromName')} value={String(cfg('email.fromName')) || <span className="text-muted-foreground italic">{t('notConfigured')}</span>} />
                <FieldRow label={t('dailySendLimit')} value={`${cfg('email.dailySendLimit')} ${t('emailsPerDay')}`} />
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <SectionHeader
            title={t('taxConfig')}
            description={t('taxConfigDesc')}
            icon={Receipt}
            editing={isEditing('tax')}
            saving={saving}
            onEdit={() => startEditing('tax')}
            onSave={handleSave}
            onCancel={cancelEditing}
            savedLabel={isSaved('tax') ? t('saved') : null}
            saveLabel={tc('buttons.save')}
            cancelLabel={tc('buttons.cancel')}
          />
          <CardContent>
            {isEditing('tax') ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditRow label={t('vatRate')}>
                  <div className="relative">
                    <Input type="number" min={0} max={100} value={String(formFields.vatRate ?? '')} onChange={e => setField('vatRate', Number(e.target.value))} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </EditRow>
                <EditRow label={t('tdsOnSalary')}>
                  <Input value={String(formFields.tdsOnSalary ?? '')} onChange={e => setField('tdsOnSalary', e.target.value)} />
                </EditRow>
                <EditRow label={t('tdsOnConsultancy')}>
                  <div className="relative">
                    <Input type="number" min={0} max={100} value={String(formFields.tdsOnConsultancy ?? '')} onChange={e => setField('tdsOnConsultancy', Number(e.target.value))} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </EditRow>
                <EditRow label={t('tdsOnSuppliers')}>
                  <Input value={String(formFields.tdsOnSuppliers ?? '')} onChange={e => setField('tdsOnSuppliers', e.target.value)} placeholder="3-7" />
                </EditRow>
                <EditRow label={t('ait')}>
                  <div className="relative">
                    <Input type="number" min={0} max={100} value={String(formFields.ait ?? '')} onChange={e => setField('ait', Number(e.target.value))} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">%</span>
                  </div>
                </EditRow>
                <EditRow label={t('stampDuty')}>
                  <div className="relative">
                    <Input type="number" min={0} value={String(formFields.stampDuty ?? '')} onChange={e => setField('stampDuty', Number(e.target.value))} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">BDT</span>
                  </div>
                </EditRow>
              </div>
            ) : (
              <div>
                <FieldRow label={t('vatRate')} value={<Badge variant="outline">{String(cfg('tax.vatRate'))}%</Badge>} />
                <FieldRow label={t('tdsOnSalary')} value={<Badge variant="outline">{String(cfg('tax.tdsOnSalary'))}</Badge>} />
                <FieldRow label={t('tdsOnConsultancy')} value={<Badge variant="outline">{String(cfg('tax.tdsOnConsultancy'))}%</Badge>} />
                <FieldRow label={t('tdsOnSuppliers')} value={<Badge variant="outline">{String(cfg('tax.tdsOnSuppliers'))}%</Badge>} />
                <FieldRow label={t('ait')} value={<Badge variant="outline">{String(cfg('tax.ait'))}% {t('onImports')}</Badge>} />
                <FieldRow label={t('stampDuty')} value={<Badge variant="outline">BDT {String(cfg('tax.stampDuty'))}</Badge>} />
              </div>
            )}
          </CardContent>
        </Card>

        {/* ─── Default Values ─── */}
        <Card>
          <SectionHeader
            title={t('defaultValues')}
            description={t('defaultValuesDesc')}
            icon={Settings}
            editing={isEditing('defaults')}
            saving={saving}
            onEdit={() => startEditing('defaults')}
            onSave={handleSave}
            onCancel={cancelEditing}
            savedLabel={isSaved('defaults') ? t('saved') : null}
            saveLabel={tc('buttons.save')}
            cancelLabel={tc('buttons.cancel')}
          />
          <CardContent>
            {isEditing('defaults') ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <EditRow label={t('approvalThreshold')}>
                  <div className="relative">
                    <Input type="number" min={0} value={String(formFields.approvalThreshold ?? '')} onChange={e => setField('approvalThreshold', Number(e.target.value))} />
                    <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">BDT</span>
                  </div>
                </EditRow>
                <EditRow label={t('decimalPlaces')}>
                  <SearchableSelect
                    id="defaults-decimal-places"
                    options={[
                      { value: '0', label: '0' },
                      { value: '2', label: '2' },
                      { value: '3', label: '3' },
                      { value: '4', label: '4' },
                    ]}
                    value={String(formFields.decimalPlaces ?? '2')}
                    onValueChange={v => setField('decimalPlaces', Number(v))}
                  />
                </EditRow>
              </div>
            ) : (
              <div>
                <FieldRow label={t('approvalThreshold')} value={`BDT ${Number(cfg('defaults.approvalThreshold')).toLocaleString()} (${t('autoApproveBelow')})`} />
                <FieldRow label={t('decimalPlaces')} value={String(cfg('defaults.decimalPlaces'))} />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ─── Cloudflare R2 Storage ─── */}
      <Card>
        <SectionHeader
          title="Cloudflare R2 Storage"
          description="Document and applicant file upload storage"
          icon={Cloud}
          editing={isEditing('storage')}
          saving={saving}
          onEdit={() => startEditing('storage')}
          onSave={handleSave}
          onCancel={cancelEditing}
          savedLabel={isSaved('storage') ? t('saved') : null}
          saveLabel={tc('buttons.save')}
          cancelLabel={tc('buttons.cancel')}
        />
        <CardContent>
          {isEditing('storage') ? (
            <div className="space-y-5">
              <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-900/40 dark:bg-blue-950/30 px-3 py-2 text-xs text-blue-900 dark:text-blue-200">
                <strong>Endpoint format:</strong> only the account URL without the bucket name —
                e.g. <code className="font-mono">https://&lt;account-id&gt;.r2.cloudflarestorage.com</code>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <EditRow label="Provider">
                  <SearchableSelect
                    id="storage-provider"
                    options={[{ value: 'cloudflare_r2', label: 'Cloudflare R2' }]}
                    value={String(formFields.provider ?? 'cloudflare_r2')}
                    onValueChange={v => setField('provider', v)}
                  />
                </EditRow>
                <EditRow label="Bucket name">
                  <Input value={String(formFields.bucketName ?? '')} onChange={e => setField('bucketName', e.target.value)} placeholder="cssbd-documents" />
                </EditRow>
                <EditRow label="Region">
                  <Input value={String(formFields.region ?? 'auto')} onChange={e => setField('region', e.target.value)} placeholder="auto" />
                </EditRow>
                <EditRow label="Endpoint">
                  <Input value={String(formFields.endpoint ?? '')} onChange={e => setField('endpoint', e.target.value)} placeholder="https://account-id.r2.cloudflarestorage.com" />
                </EditRow>
                <EditRow label="Public URL">
                  <Input value={String(formFields.publicUrl ?? '')} onChange={e => setField('publicUrl', e.target.value)} placeholder="https://pub-xxxx.r2.dev" />
                </EditRow>
                <EditRow label="Max file size (MB)">
                  <Input type="number" min={1} value={String(formFields.maxFileSizeMb ?? 50)} onChange={e => setField('maxFileSizeMb', Number(e.target.value))} />
                </EditRow>
                <EditRow label="Access key ID">
                  <Input value={String(formFields.accessKeyId ?? '')} onChange={e => setField('accessKeyId', e.target.value)} />
                </EditRow>
                <EditRow label="Secret access key">
                  <Input type="password" value={String(formFields.secretAccessKey ?? '')} onChange={e => setField('secretAccessKey', e.target.value)} placeholder="Leave masked value to keep existing" />
                </EditRow>
                <EditRow label="Active">
                  <div className="flex h-10 items-center">
                    <Switch checked={Boolean(formFields.isActive ?? true)} onCheckedChange={v => setField('isActive', v)} />
                  </div>
                </EditRow>
                <EditRow label="Allowed MIME types">
                  <Input value={String(formFields.allowedMimeTypes ?? '')} onChange={e => setField('allowedMimeTypes', e.target.value)} placeholder="image/*,application/pdf,.doc,.docx" />
                </EditRow>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8">
              <div>
                <FieldRow label="Provider" value={<Badge variant="outline">Cloudflare R2</Badge>} />
                <FieldRow label="Status" value={
                  <Badge variant={cfg('storage.isActive') ? 'default' : 'outline'}>
                    {cfg('storage.isActive') ? tc('status.ACTIVE') : t('notConfigured')}
                  </Badge>
                } />
                <FieldRow label="Bucket" value={String(cfg('storage.bucketName')) || <span className="text-muted-foreground italic">{t('notConfigured')}</span>} />
                <FieldRow label="Region" value={String(cfg('storage.region')) || 'auto'} />
              </div>
              <div>
                <FieldRow label="Endpoint" value={
                  cfg('storage.endpoint')
                    ? <span className="font-mono text-xs break-all">{String(cfg('storage.endpoint'))}</span>
                    : <span className="text-muted-foreground italic">{t('notConfigured')}</span>
                } />
                <FieldRow label="Public URL" value={
                  cfg('storage.publicUrl')
                    ? <span className="font-mono text-xs break-all">{String(cfg('storage.publicUrl'))}</span>
                    : <span className="text-muted-foreground italic">{t('notConfigured')}</span>
                } />
                <FieldRow label="Max file size" value={`${cfg('storage.maxFileSizeMb')} MB`} />
                <FieldRow label="Allowed MIME" value={
                  <span className="text-xs break-all">{String(cfg('storage.allowedMimeTypes')) || '—'}</span>
                } />
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ─── Number Sequences ─── */}
      <Card>
        <SectionHeader
          title={t('numberSequences')}
          description={t('numberSequencesDesc')}
          icon={Hash}
          editing={isEditing('numberSequences')}
          saving={saving}
          onEdit={() => startEditing('numberSequences')}
          onSave={handleSave}
          onCancel={cancelEditing}
          savedLabel={isSaved('numberSequences') ? t('saved') : null}
          saveLabel={tc('buttons.save')}
          cancelLabel={tc('buttons.cancel')}
        />
        <CardContent>
          {sequences.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">{t('noSequences')}</p>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('documentType')}</TableHead>
                    <TableHead>{t('prefix')}</TableHead>
                    <TableHead>{t('separator')}</TableHead>
                    <TableHead>{t('includeYear')}</TableHead>
                    <TableHead>{t('padLength')}</TableHead>
                    <TableHead>{t('exampleNext')}</TableHead>
                    <TableHead className="text-center">{t('currentNumber')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {(isEditing('numberSequences') ? seqEdits : sequences).map((seq, i) => (
                    <TableRow key={seq.id}>
                      <TableCell className="font-medium">{seq.entity}</TableCell>
                      {isEditing('numberSequences') ? (
                        <>
                          <TableCell>
                            <Input className="w-20 h-8" value={seq.prefix} onChange={e => updateSeq(i, 'prefix', e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Input className="w-14 h-8" value={seq.separator} onChange={e => updateSeq(i, 'separator', e.target.value)} />
                          </TableCell>
                          <TableCell>
                            <Switch checked={seq.includeYear} onCheckedChange={v => updateSeq(i, 'includeYear', v)} />
                          </TableCell>
                          <TableCell>
                            <Input className="w-14 h-8" type="number" min={1} max={8} value={String(seq.padLength)} onChange={e => updateSeq(i, 'padLength', Number(e.target.value))} />
                          </TableCell>
                        </>
                      ) : (
                        <>
                          <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{seq.prefix}</code></TableCell>
                          <TableCell><code className="text-xs bg-muted px-1.5 py-0.5 rounded">{seq.separator}</code></TableCell>
                          <TableCell>{seq.includeYear ? <Badge variant="default" className="text-xs">Yes</Badge> : <Badge variant="outline" className="text-xs">No</Badge>}</TableCell>
                          <TableCell>{seq.padLength}</TableCell>
                        </>
                      )}
                      <TableCell className="font-mono text-sm">{seqExample(seq)}</TableCell>
                      <TableCell className="text-center">{seq.currentValue}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

    </div>
  )
}
